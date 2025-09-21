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

// Helper: run a CLI command
function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd });
    let out = "", err = "";
    p.stdout.on("data", d => (out += d.toString()));
    p.stderr.on("data", d => (err += d.toString()));
    p.on("close", code => (code === 0 ? resolve(out) : reject(new Error(err))));
  });
}

// POST /process
// Body:
// {
//   "bucket": "your-firebase-bucket",
//   "name": "hubs/{hubId}/content/{contentId}/original.pdf",
//   "hubId": "...",
//   "contentId": "..."
// }
app.post("/process", async (req, res) => {
  const { bucket, name, hubId, contentId } = req.body || {};
  if (!bucket || !name || !hubId || !contentId) {
    return res.status(400).json({ error: "Missing bucket/name/hubId/contentId" });
  }

  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-"));
  try {
    const gcsFile = storage.bucket(bucket).file(name);
    const localIn = path.join(workdir, "in.pdf");
    await gcsFile.download({ destination: localIn });

    // 1) (Optional) Linearise/optimise PDF for faster download if user clicks "Download"
    // Ghostscript optimisation (safe defaults)
    const localOpt = path.join(workdir, "opt.pdf");
    await run("gs", [
      "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.6", "-dPDFSETTINGS=/printer",
      "-dNOPAUSE", "-dQUIET", "-dBATCH",
      `-sOutputFile=${localOpt}`, localIn
    ], workdir);

    // 2) Render pages to PNG (vector-accurate). -r 200 is a good balance
    // Output: page-1.png, page-2.png, ...
    await run("pdftocairo", ["-png", "-r", "200", localOpt, path.join(workdir, "page")], workdir);

    // 3) Build responsive WebP sizes + poster + LQIP
    const widths = [800, 1200, 1600];
    const outPrefix = `hubs/${hubId}/content/${contentId}`;
    const pagesLocal = fssync.readdirSync(workdir)
      .filter(f => /^page-\d+\.png$/.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/page-(\d+)\.png/)[1], 10);
        const nb = parseInt(b.match(/page-(\d+)\.png/)[1], 10);
        return na - nb;
      });

    if (pagesLocal.length === 0) throw new Error("No rendered pages found");

    // Poster (page 1)
    const firstPagePath = path.join(workdir, pagesLocal[0]);
    const posterLocal = path.join(workdir, "poster.webp");
    await sharp(firstPagePath).resize({ width: 1600 }).webp({ quality: 78 }).toFile(posterLocal);

    const lqipBuf = await sharp(firstPagePath).resize({ width: 32 }).webp({ quality: 30 }).toBuffer();
    const lqipDataUrl = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

    // Upload poster + lqip + optimized pdf
    const bkt = storage.bucket(bucket);
    const posterGcs = `${outPrefix}/posters/poster-1600.webp`;
    await bkt.upload(posterLocal, {
      destination: posterGcs,
      contentType: "image/webp",
      metadata: { cacheControl: "public, max-age=31536000, immutable" }
    });

    const optPdfGcs = `${outPrefix}/optimized.pdf`;
    await bkt.upload(localOpt, {
      destination: optPdfGcs,
      contentType: "application/pdf",
      metadata: { cacheControl: "public, max-age=31536000, immutable" }
    });

    // Per-page responsive images
    const manifestPages = [];
    for (const f of pagesLocal) {
      const n = parseInt(f.match(/page-(\d+)\.png/)[1], 10);
      const full = path.join(workdir, f);
      const meta = await sharp(full).metadata();
      const aspect = (meta.height || 1) / (meta.width || 1);
      manifestPages.push({ n, aspect: Number(aspect.toFixed(5)) });

      for (const w of widths) {
        const out = path.join(workdir, `p${n}-${w}.webp`);
        await sharp(full).resize({ width: w }).webp({ quality: 76 }).toFile(out);
        const gcsPath = `${outPrefix}/pages/${n}-${w}.webp`;
        await bkt.upload(out, {
          destination: gcsPath,
          contentType: "image/webp",
          metadata: { cacheControl: "public, max-age=31536000, immutable" }
        });
      }
    }

    // 4) Manifest
    const manifest = {
      version: 1,
      numPages: pagesLocal.length,
      widths,
      poster: `https://storage.googleapis.com/${bucket}/${posterGcs}`,
      lqip: lqipDataUrl,
      pages: manifestPages
    };

    const manifestLocal = path.join(workdir, "manifest.json");
    await fs.writeFile(manifestLocal, JSON.stringify(manifest));

    const manifestGcs = `${outPrefix}/manifest.json`;
    await bkt.upload(manifestLocal, {
      destination: manifestGcs,
      contentType: "application/json",
      metadata: { cacheControl: "public, max-age=31536000, immutable" }
    });

    // 5) Update Firestore doc
    await db.doc(`hubs/${hubId}/content/${contentId}`).set({
      imageManifestUrl: `https://storage.googleapis.com/${bucket}/${manifestGcs}`,
      posterUrl: `https://storage.googleapis.com/${bucket}/${posterGcs}`,
      posterLqip: lqipDataUrl,
      fileUrl: `https://storage.googleapis.com/${bucket}/${optPdfGcs}`
    }, { merge: true });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  } finally {
    try { await fs.rm(workdir, { recursive: true, force: true }); } catch {}
  }
});

app.get("/", (_, res) => res.send("OK"));
app.listen(process.env.PORT || 8080, () => console.log("renderer up"));
