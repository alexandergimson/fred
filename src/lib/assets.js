import { db, storage, auth } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { deleteDoc } from "firebase/firestore";

export async function deleteAsset(assetId) {
  await deleteDoc(doc(db, "assets", assetId));
}

function isImageFile(file) {
  return (file?.type || "").startsWith("image/");
}

function isPdfFile(file) {
  const t = file?.type || "";
  return t === "application/pdf" || /\.pdf$/i.test(file?.name || "");
}

function buildPdfProcessingFields(file, path) {
  if (!isPdfFile(file)) {
    return {
      processingStatus: null,
      thumbnailUrl: null,
      pageCount: null,
      pageAspectRatio: null,
      previewPages: [],
      originalFilePath: path,
      fileMimeType: file?.type || null,
    };
  }

  return {
    processingStatus: "pending",
    thumbnailUrl: null,
    pageCount: null,
    pageAspectRatio: null,
    previewPages: [],
    originalFilePath: path,
    fileMimeType: file?.type || "application/pdf",
  };
}

export function subscribeToAssets(callback, onError) {
  const qy = query(
    collection(db, "assets"),
    where("ownerUid", "==", auth.currentUser?.uid || "__none__"),
  );

  return onSnapshot(
    qy,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });

      callback(items);
    },
    (error) => {
      console.error("subscribeToAssets failed", error);
      onError?.(error);
    },
  );
}

export async function createEmbedAsset({
  name,
  description = "",
  embedUrl,
  tags = [],
  category = "",
}) {
  if (!auth.currentUser) throw new Error("Not signed in");

  const docRef = doc(collection(db, "assets"));

  await setDoc(docRef, {
    ownerUid: auth.currentUser.uid,
    name: (name || "").trim(),
    description: (description || "").trim() || null,
    category: (category || "").trim() || null,
    kind: "embed",
    embedUrl: (embedUrl || "").trim(),
    fileUrl: null,
    processingStatus: null,
    thumbnailUrl: null,
    pageCount: null,
    pageAspectRatio: null,
    previewPages: [],
    originalFilePath: null,
    fileMimeType: null,

    archived: false,
    tags,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getAsset(assetId) {
  const snap = await getDoc(doc(db, "assets", assetId));
  if (!snap.exists()) {
    throw new Error("Asset not found");
  }

  return {
    id: snap.id,
    ...snap.data(),
  };
}

export async function updateAsset(assetId, patch) {
  await updateDoc(doc(db, "assets", assetId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function createFileAsset({
  name,
  description = "",
  file,
  tags = [],
  category = "",
}) {
  if (!auth.currentUser) throw new Error("Not signed in");
  if (!file) throw new Error("No file provided");

  const docRef = doc(collection(db, "assets"));
  const assetId = docRef.id;

  const base = {
    ownerUid: auth.currentUser.uid,
    name: (name || "").trim(),
    description: (description || "").trim() || null,
    category: (category || "").trim() || null,
    kind: "file",
    embedUrl: null,
    fileUrl: null,

    processingStatus: null,
    thumbnailUrl: null,
    pageCount: null,
    pageAspectRatio: null,
    previewPages: [],
    originalFilePath: null,
    fileMimeType: null,

    archived: false,
    tags,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, base);

  const versionedName = `${Date.now()}-${file.name}`;
  const path = `assets/${auth.currentUser.uid}/${assetId}/${versionedName}`;
  const fileRef = ref(storage, path);

  const metadata = {
    contentType:
      file.type ||
      (isPdfFile(file) ? "application/pdf" : "application/octet-stream"),
    cacheControl: "public,max-age=31536000,immutable",
  };

  const task = uploadBytesResumable(fileRef, file, metadata);
  await new Promise((resolve, reject) => {
    task.on("state_changed", null, reject, resolve);
  });

  const fileUrl = await getDownloadURL(fileRef);

  await updateDoc(docRef, {
    fileUrl,
    ...buildPdfProcessingFields(file, path),
    updatedAt: serverTimestamp(),
  });

  if (isPdfFile(file)) {
    fetch(
      "https://fred-pdf-processor-867347292100.europe-west2.run.app/process-pdf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId,
        }),
      },
    )
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Processor failed: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Asset PDF processor started:", data);
      })
      .catch((err) => {
        console.error("Failed to start PDF processing", err);
      });
  }

  return assetId;
}

export { isImageFile, isPdfFile };