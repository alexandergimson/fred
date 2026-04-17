import express from "express";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { Firestore, FieldValue } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";

const execFileAsync = promisify(execFile);

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

const firestore = new Firestore();
const storage = new Storage();

const PORT = process.env.PORT || 8080;
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;

if (!FIREBASE_STORAGE_BUCKET) {
  throw new Error("FIREBASE_STORAGE_BUCKET env var is required");
}

function publicStorageUrl(bucketName, objectPath) {
  return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`;
}

function parsePdfInfoPages(stdout) {
  const match = stdout.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error("Could not parse page count from pdfinfo output");
  return Number(match[1]);
}


function parsePngDimensions(buffer) {
  // PNG IHDR width/height at bytes 16-23
  if (!buffer || buffer.length < 24) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

app.post("/process-pdf", async (req, res) => {
  const { hubId, contentId } = req.body || {};

  if (!hubId || !contentId) {
    return res.status(400).json({ error: "hubId and contentId are required" });
  }

  const contentRef = firestore.doc(`hubs/${hubId}/content/${contentId}`);

  let tempRoot;

  try {
    const snap = await contentRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "content not found" });
    }

    const content = snap.data();
    if (!content) {
      return res.status(404).json({ error: "content data missing" });
    }

    if (content.kind !== "file") {
      return res.status(400).json({ error: "content is not a file" });
    }

    if (content.fileMimeType !== "application/pdf" && !/\.pdf$/i.test(content.fileUrl || "")) {
      return res.status(400).json({ error: "content is not a PDF" });
    }

    if (!content.originalFilePath) {
      return res.status(400).json({ error: "originalFilePath missing" });
    }

    await contentRef.update({
      processingStatus: "processing",
      updatedAt: FieldValue.serverTimestamp(),
    });

    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "fred-pdf-"));
    const inputPdf = path.join(tempRoot, "input.pdf");
    const outputDir = path.join(tempRoot, "rendered");
    await ensureDir(outputDir);

    const bucket = storage.bucket(FIREBASE_STORAGE_BUCKET);
    await bucket.file(content.originalFilePath).download({ destination: inputPdf });

    const { stdout: pdfInfoStdout } = await execFileAsync("pdfinfo", [inputPdf]);
    const pageCount = parsePdfInfoPages(pdfInfoStdout);

    // Render all pages to PNG. Later you can convert to WebP if you want.
    const baseOutput = path.join(outputDir, "page");
    await execFileAsync("pdftocairo", [
      "-png",
      "-r",
      "144",
      inputPdf,
      baseOutput,
    ]);

    const previewPages = [];
let pageAspectRatio = null;
let thumbnailUrl = null;

const renderedFiles = (await fs.readdir(outputDir))
  .filter((name) => name.toLowerCase().endsWith(".png"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (renderedFiles.length === 0) {
  throw new Error(`No rendered PNG pages found in ${outputDir}`);
}

for (let i = 0; i < renderedFiles.length; i++) {
  const pageNumber = i + 1;
  const localPagePath = path.join(outputDir, renderedFiles[i]);

  const pageBuffer = await fs.readFile(localPagePath);
  const dims = parsePngDimensions(pageBuffer);
  if (!dims) {
    throw new Error(`Could not read PNG dimensions for rendered page ${renderedFiles[i]}`);
  }

  if (pageNumber === 1) {
    pageAspectRatio = dims.height / dims.width;
  }

  const storagePath = `hubs/${hubId}/content/${contentId}/processed/page-${pageNumber}.png`;
  const file = bucket.file(storagePath);

  await file.save(pageBuffer, {
    contentType: "image/png",
    resumable: false,
    metadata: {
      cacheControl: "public,max-age=31536000,immutable",
    },
  });

  await file.makePublic();

  const pageUrl = publicStorageUrl(FIREBASE_STORAGE_BUCKET, storagePath);

  previewPages.push({
    page: pageNumber,
    url: pageUrl,
    width: dims.width,
    height: dims.height,
  });

  if (pageNumber === 1) {
    const thumbPath = `hubs/${hubId}/content/${contentId}/processed/thumb.png`;
    const thumbFile = bucket.file(thumbPath);

    await thumbFile.save(pageBuffer, {
      contentType: "image/png",
      resumable: false,
      metadata: {
        cacheControl: "public,max-age=31536000,immutable",
      },
    });

    await thumbFile.makePublic();

    thumbnailUrl = publicStorageUrl(FIREBASE_STORAGE_BUCKET, thumbPath);
  }
}

await contentRef.update({
  processingStatus: "ready",
  thumbnailUrl,
  pageCount: previewPages.length,
  pageAspectRatio,
  previewPages,
  updatedAt: FieldValue.serverTimestamp(),
});

    return res.json({
      ok: true,
      hubId,
      contentId,
      pageCount,
      thumbnailUrl,
      previewPagesCount: previewPages.length,
    });
  } catch (err) {
    console.error(err);

    try {
      await contentRef.update({
        processingStatus: "failed",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch {}

    return res.status(500).json({
      error: err instanceof Error ? err.message : "unknown error",
    });
  } finally {
    if (tempRoot) {
      try {
        await fs.rm(tempRoot, { recursive: true, force: true });
      } catch {}
    }
  }
});

app.listen(PORT, () => {
  console.log(`PDF processor listening on :${PORT}`);
});