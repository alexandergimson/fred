import express from "express";
import { Storage } from "@google-cloud/storage";
import { Firestore } from "@google-cloud/firestore";
import { spawn } from "child_process";
import fs from "fs/promises";
import fssync from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";

const app = express();
app.use(express.json({ limit: "10mb" }));

const storage = new Storage();
const db = new Firestore();

// -------------------------------
// Small helpers
// -------------------------------
function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd });
    let out = "", err = "";
    p.stdout.on("data", d => (out += d.toString()));
    p.stderr.on("data", d => (err += d.toString()));
    p.on("error", reject);
    p.on("close", code => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited ${code}\n${err || out}`));
    });
  });
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function byPageNumber(a, b) {
  const na = parseInt(a.match(/page-(\d+)\.png/)[1], 10);
  const nb = parseInt(b.match(/page-(\d+)\.png/)[1], 10);
  return na - nb;
}

// -------------------------------
// Config knobs (safe defaults)
// -------------------------------
const CACHE_META = { cacheControl: "public, max-age=31536000, immutable" };
const RENDER_DPI = 200;                // pdftocairo resolution (quality vs. size)
const POSTER_WIDTH = 1600;             // poster width
const PAGE_WIDTHS = [800, 1200, 1600]; // responsive sizes for per-page images

// -------------------------------
// POST /process
// Body: { bucket, name, hubId, contentId }
// name = gs://bucket/path OR object path (e.g. hubs/{hubId}/content/{contentId}/original.pdf)
// -------------------------------
app.post("/process", async (req, res) => {
  const { bucket, name, hubId, contentId } = req.body || {};
  if (!bucket || !name || !hubId || !contentId) {
    return res.status(400).json({ error: "Missing bucket/name/hubId/contentId" });
  }

  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-"));
  const cleanup = async () => { try { await fs.rm(workdir, { recursive: true, force: true }); } catch {} };

  try {
    // -------------------------------
    // 0) Input download
    // -------------------------------
    const objectPath = name.replace(/^gs:\/\/[^/]+\//, ""); // tolerate gs://bucket/obj form
    const inputFile = storage.bucket(bucket).file(objectPath);
    const localIn = path.join(workdir, "in.pdf");
    await inputFile.download({ destination: localIn });

    // Sanity check
    if (!(await fileExists(localIn))) throw new Error("Downloaded PDF missing");

    // -------------------------------
    // 1) Optimise + linearise (Fast Web View) for streaming
    // -------------------------------
    const localOpt = path.join(workdir, "optimized.pdf");

    // Ghostscript pass (quality + compression + FastWebView)
    await run("gs", [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.6",
      "-dPDFSETTINGS=/printer",
      "-dFastWebView=true",             // ✅ linearise for streaming
      "-dDetectDuplicateImages=true",
      "-dDownsampleColorImages=true",
      "-dColorImageResolution=150",
      "-dNOPAUSE", "-dQUIET", "-dBATCH",
      `-sOutputFile=${localOpt}`, localIn
    ], workdir);

    // Optional: reinforce linearisation with qpdf if present
    try { await run("qpdf", ["--linearize", localOpt, localOpt], workdir); } catch {}

    // -------------------------------
    // 2) Rasterise pages to PNG (vector-accurate) for posters/thumbnails
    // -------------------------------
    await run("pdftocairo", ["-png", "-r", String(RENDER_DPI), localOpt, path.join(workdir, "page")], workdir);

    const pagePngs = fssync.readdirSync(workdir)
      .filter(f => /^page-\d+\.png$/.test(f))
      .sort(byPageNumber);

    if (pagePngs.length === 0) throw new Error("No rendered pages found from pdftocairo");

    // -------------------------------
    // 3) Build poster + LQIP + responsive per-page images (WebP)
    // -------------------------------
    const outPrefix = `hubs/${hubId}/content/${contentId}`;
    const bkt = storage.bucket(bucket);

    // Poster (page 1)
    const firstPagePath = path.join(workdir, pagePngs[0]);
    const posterLocal = path.join(workdir, "poster.webp");
    await sharp(firstPagePath)
      .resize({ width: POSTER_WIDTH })
      .webp({ quality: 78 })
      .toFile(posterLocal);

    const lqipBuf = await sharp(firstPagePath)
      .resize({ width: 32 })
      .webp({ quality: 30 })
      .toBuffer();
    const lqipDataUrl = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

    // Upload poster
    const posterGcs = `${outPrefix}/posters/poster-${POSTER_WIDTH}.webp`;
    await bkt.upload(posterLocal, {
      destination: posterGcs,
      contentType: "image/webp",
      metadata: CACHE_META,
    });

    // Upload optimised (linearised) PDF
    const optPdfGcs = `${outPrefix}/optimized.pdf`;
    await bkt.upload(localOpt, {
      destination: optPdfGcs,
      contentType: "application/pdf",
      metadata: CACHE_META,
    });

    // Per-page responsive images
    const manifestPages = [];
    for (const f of pagePngs) {
      const n = parseInt(f.match(/page-(\d+)\.png/)[1], 10);
      const full = path.join(workdir, f);
      const meta = await sharp(full).metadata();
      const aspect = (meta.height || 1) / (meta.width || 1);
      manifestPages.push({ n, aspect: Number(aspect.toFixed(5)) });

      for (const w of PAGE_WIDTHS) {
        const out = path.join(workdir, `p${n}-${w}.webp`);
        await sharp(full).resize({ width: w }).webp({ quality: 76 }).toFile(out);
        const gcsPath = `${outPrefix}/pages/${n}-${w}.webp`;
        await bkt.upload(out, {
          destination: gcsPath,
          contentType: "image/webp",
          metadata: CACHE_META,
        });
      }
    }

    // -------------------------------
    // 4) Manifest
    // -------------------------------
    const publicBase = `https://storage.googleapis.com/${bucket}`;
    const manifest = {
      version: 1,
      numPages: pagePngs.length,
      widths: PAGE_WIDTHS,
      poster: `${publicBase}/${posterGcs}`,
      lqip: lqipDataUrl,
      pages: manifestPages,
    };

    const manifestLocal = path.join(workdir, "manifest.json");
    await fs.writeFile(manifestLocal, JSON.stringify(manifest));

    const manifestGcs = `${outPrefix}/manifest.json`;
    await bkt.upload(manifestLocal, {
      destination: manifestGcs,
      contentType: "application/json",
      metadata: CACHE_META,
    });

    // -------------------------------
    // 5) Update Firestore doc
    // -------------------------------
    await db.doc(`hubs/${hubId}/content/${contentId}`).set(
      {
        imageManifestUrl: `${publicBase}/${manifestGcs}`,
        posterUrl: `${publicBase}/${posterGcs}`,
        posterLqip: lqipDataUrl,
        fileUrl: `${publicBase}/${optPdfGcs}`, // linearised PDF for streaming
      },
      { merge: true }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message || e) });
  } finally {
    await cleanup();
  }
});

// Health
app.get("/", (_, res) => res.send("OK"));

app.listen(process.env.PORT || 8080, () => {
  console.log("renderer up");
});
