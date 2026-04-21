import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export async function listHubItems(hubId) {
  const itemsQuery = query(
    collection(db, "hubs", hubId, "items"),
    orderBy("position", "asc"),
  );

  const itemsSnap = await getDocs(itemsQuery);
  const items = itemsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const assetIds = [...new Set(items.map((item) => item.assetId).filter(Boolean))];
  const assetMap = new Map();

  await Promise.all(
    assetIds.map(async (assetId) => {
      const assetSnap = await getDoc(doc(db, "assets", assetId));
      if (!assetSnap.exists()) return;

      assetMap.set(assetId, {
        id: assetSnap.id,
        ...assetSnap.data(),
      });
    }),
  );

  return items.map((item) => ({
    ...item,
    asset: assetMap.get(item.assetId) || null,
  }));
}

export async function addAssetsToHub(hubId, assetIds) {
  const cleanIds = [...new Set((assetIds || []).filter(Boolean))];
  if (cleanIds.length === 0) return;

  const existingSnap = await getDocs(collection(db, "hubs", hubId, "items"));
  const existingItems = existingSnap.docs.map((d) => d.data());
  const existingAssetIds = new Set(existingItems.map((item) => item.assetId));
  const maxPosition = existingItems.reduce(
    (max, item) => Math.max(max, Number(item.position) || 0),
    0,
  );

  let nextPosition = maxPosition + 1;

  for (const assetId of cleanIds) {
    if (existingAssetIds.has(assetId)) continue;

    const itemRef = doc(collection(db, "hubs", hubId, "items"));
    await setDoc(itemRef, {
      assetId,
      position: nextPosition++,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function removeHubItem(hubId, itemId) {
  await deleteDoc(doc(db, "hubs", hubId, "items", itemId));
}