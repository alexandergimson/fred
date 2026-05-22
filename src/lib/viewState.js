function getKey(hubId) {
  return `fred:view-state:${hubId}`;
}

export function getViewState(hubId) {
  if (!hubId) return {};

  try {
    return JSON.parse(localStorage.getItem(getKey(hubId)) || "{}");
  } catch {
    return {};
  }
}

export function markContentViewed(hubId, contentId) {
  if (!hubId || !contentId) return {};

  const current = getViewState(hubId);

  const next = {
    ...current,
    [contentId]: {
      ...(current[contentId] || {}),
      viewed: true,
      viewedAt: new Date().toISOString(),
    },
  };

  localStorage.setItem(getKey(hubId), JSON.stringify(next));

  return next;
}