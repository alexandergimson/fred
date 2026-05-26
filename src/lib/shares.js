import { auth, db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export function buildShareUrl({ hubId, shareId }) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/prospect/${hubId}?s=${shareId}`;
}

export async function createShareLink({
  hubId,
  label,
  company,
  recipientName,
  recipientEmail,
  campaign,
}) {
  if (!auth.currentUser) throw new Error("Not signed in");
  if (!hubId) throw new Error("Missing hubId");

  const shareRef = doc(collection(db, "shares"));

  await setDoc(shareRef, {
    hubId,
    label: (label || "").trim() || "Share link",
    company: (company || "").trim() || null,
    recipientName: (recipientName || "").trim() || null,
    recipientEmail: (recipientEmail || "").trim() || null,
    campaign: (campaign || "").trim() || null,
    status: "active",
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return shareRef.id;
}

export function subscribeToHubShares(hubId, callback, onError) {
  const qy = query(collection(db, "shares"), where("hubId", "==", hubId));

  return onSnapshot(
    qy,
    (snap) => {
      const shares = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const at = a.createdAt?.toMillis?.() ?? 0;
          const bt = b.createdAt?.toMillis?.() ?? 0;
          return bt - at;
        });

      callback(shares);
    },
    (error) => {
      console.error("subscribeToHubShares failed", error);
      onError?.(error);
    },
  );
}

export async function getShareLink(shareId) {
  if (!shareId) return null;

  const snap = await getDoc(doc(db, "shares", shareId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function revokeShareLink(shareId) {
  await updateDoc(doc(db, "shares", shareId), {
    status: "revoked",
    updatedAt: serverTimestamp(),
  });
}
