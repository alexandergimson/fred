import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import {
  listHubItems,
  removeHubItem,
  reorderHubItems,
  updateHubItem,
} from "./lib/hubItems";
import AddAssetsToHubModal from "./AddAssetsToHubModal";
import AssetTileGrid from "./components/library/AssetTileGrid";
import ViewToggle from "./components/library/ViewToggle";
import ActionButton from "./components/ActionButton";
import DeleteIcon from "./icons/DeleteIcon";
import Toggle from "./components/Toggle";

function getAssetType(asset) {
  if (asset?.kind === "embed") return "embed";
  if (asset?.fileMimeType === "application/pdf") return "pdf";
  if (asset?.fileMimeType?.startsWith("image/")) return "image";
  if (asset?.kind === "file") return "file";
  return "unknown";
}

function getAssetTypeLabel(asset) {
  const type = getAssetType(asset);

  return type === "embed"
    ? "Embed"
    : type === "pdf"
      ? "PDF"
      : type === "image"
        ? "Image"
        : "File";
}

function FilterSelect({ value, onChange, options, ariaLabel }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-10 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-400 outline-none transition-colors hover:bg-gray-50 focus:border-[#1F50AF]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-gray-400"
      >
        <path
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

function StatusText({ status }) {
  if (!status) return <span className="text-gray-400">—</span>;

  const cls =
    status === "ready"
      ? "text-green-600"
      : status === "failed"
        ? "text-red-600"
        : "text-amber-600";

  return <span className={`font-medium ${cls}`}>{status}</span>;
}

function formatUpdatedAt(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function HubItemTile({ item, confirmRemoveId, onSetConfirmRemove, onRemove }) {
  const asset = item.asset;
  const isConfirming = confirmRemoveId === item.id;
  const thumb =
    asset?.thumbnailUrl ||
    (asset?.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <div className="group relative cursor-default overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(16,24,40,0.10)]">
      <div className="relative aspect-[16/10] bg-gray-50 flex items-center justify-center overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={asset?.name || "Asset"}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="text-sm text-gray-400">
            {asset?.kind === "embed" ? "Embed" : "File"}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="flex items-center justify-center gap-2 translate-y-[120%] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            {isConfirming ? (
              <ActionButton
                title="Confirm remove"
                intent="danger"
                confirm
                label="Confirm?"
                onClick={() => onRemove(item.id)}
              />
            ) : (
              <ActionButton
                title="Remove from hub"
                intent="danger"
                onClick={() => onSetConfirmRemove(item.id)}
              >
                <DeleteIcon className="w-4 h-4" />
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="truncate text-[15px] font-semibold text-gray-900">
          {asset?.name || "Missing asset"}
        </div>

        <div className="mt-1 text-sm text-gray-500">
          {getAssetTypeLabel(asset)}
        </div>

        {Array.isArray(asset?.tags) && asset.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HubItemsTableHeader() {
  return (
    <div className="grid grid-cols-[44px_minmax(0,2.4fr)_120px_140px_120px_1.4fr_160px_120px] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 border-b border-gray-200 bg-white">
      <div />
      <div>Name</div>
      <div>Type</div>
      <div>Status</div>
      <div>Guided</div>
      <div>Tags</div>
      <div>Updated</div>
      <div className="text-right">Actions</div>
    </div>
  );
}

function HubItemsTableRow({
  item,
  confirmRemoveId,
  onSetConfirmRemove,
  onRemove,
  draggableProps,
  isDragging,
  onToggleGuided,
}) {
  const asset = item.asset;
  const isConfirming = confirmRemoveId === item.id;

  return (
    <div
      draggable
      onDragStart={draggableProps.onDragStart}
      onDragOver={draggableProps.onDragOver}
      onDrop={draggableProps.onDrop}
      onDragEnd={draggableProps.onDragEnd}
      className={[
        "grid grid-cols-[44px_minmax(0,2.4fr)_120px_140px_120px_1.4fr_160px_120px] items-center gap-4 px-6 py-4 text-sm text-gray-900 border-b border-gray-100 transition-colors hover:bg-gray-50",
        isDragging ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="cursor-move select-none text-gray-400 text-lg leading-none">
        ☰
      </div>

      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900">
          {asset?.name || "Missing asset"}
        </div>
      </div>

      <div className="text-gray-600">{getAssetTypeLabel(asset)}</div>

      <div>
        <StatusText status={asset?.processingStatus} />
      </div>

      <Toggle
        checked={item.guided !== false}
        onChange={() => onToggleGuided?.(item)}
        label="Toggle guided track"
      />

      <div className="truncate text-gray-500">
        {Array.isArray(asset?.tags) && asset.tags.length > 0
          ? asset.tags.slice(0, 3).join(", ")
          : "—"}
      </div>

      <div className="text-gray-500">
        {formatUpdatedAt(asset?.updatedAt || asset?.createdAt)}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          {isConfirming ? (
            <ActionButton
              title="Confirm remove"
              intent="danger"
              confirm
              label="Confirm?"
              onClick={() => onRemove(item.id)}
            />
          ) : (
            <ActionButton
              title="Remove from hub"
              intent="danger"
              onClick={() => onSetConfirmRemove(item.id)}
            >
              <DeleteIcon className="w-4 h-4" />
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

function HubItemsTable({
  items,
  confirmRemoveId,
  onSetConfirmRemove,
  onRemove,
  onToggleGuided,
  dragId,
  draggablePropsFor,
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <HubItemsTableHeader />

      <div>
        {items.map((item) => (
          <HubItemsTableRow
            key={item.id}
            item={item}
            confirmRemoveId={confirmRemoveId}
            onSetConfirmRemove={onSetConfirmRemove}
            onRemove={onRemove}
            onToggleGuided={onToggleGuided}
            isDragging={dragId === item.id}
            draggableProps={draggablePropsFor(item)}
          />
        ))}
      </div>
    </div>
  );
}

export default function HubItemsScreen() {
  const { hubId } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("fred-hub-items-view") || "grid",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");

  const loadedRef = useRef(false);

  async function load() {
    try {
      setLoading(true);
      const nextItems = await listHubItems(hubId);
      setItems(nextItems);
      loadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [hubId]);

  useEffect(() => {
    localStorage.setItem("fred-hub-items-view", viewMode);
  }, [viewMode]);

  const sortedItems = useMemo(() => {
    const BIG = 9e15;
    return [...items].sort((a, b) => {
      const pa = typeof a.position === "number" ? a.position : BIG;
      const pb = typeof b.position === "number" ? b.position : BIG;
      return pa - pb;
    });
  }, [items]);

  const tagOptions = useMemo(() => {
    const set = new Set();

    sortedItems.forEach((item) => {
      (item.asset?.tags || []).forEach((tag) => {
        if (tag) set.add(tag);
      });
    });

    return [
      { value: "all", label: "All tags" },
      ...Array.from(set)
        .sort((a, b) => a.localeCompare(b))
        .map((tag) => ({ value: tag, label: tag })),
    ];
  }, [sortedItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return sortedItems.filter((item) => {
      const asset = item.asset || {};

      const matchesSearch = !q || (asset.name || "").toLowerCase().includes(q);

      const matchesType =
        selectedType === "all" || getAssetType(asset) === selectedType;

      const matchesStatus =
        selectedStatus === "all" ||
        (asset.processingStatus || "none") === selectedStatus;

      const matchesTag =
        selectedTag === "all" ||
        (Array.isArray(asset.tags) && asset.tags.includes(selectedTag));

      return matchesSearch && matchesType && matchesStatus && matchesTag;
    });
  }, [sortedItems, searchQuery, selectedType, selectedStatus, selectedTag]);

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedType !== "all" ||
    selectedStatus !== "all" ||
    selectedTag !== "all";

  function clearFilters() {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedTag("all");
  }

  async function handleRemove(itemId) {
    try {
      await removeHubItem(hubId, itemId);
      setConfirmRemoveId(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to remove item from hub");
    }
  }

  async function handleToggleGuided(item) {
    try {
      await updateHubItem(hubId, item.id, {
        guided: item.guided === false,
      });

      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to update guided track");
    }
  }

  function handleDragStart(e, itemId) {
    setDragId(itemId);
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, overId) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;

    setItems((curr) => {
      const from = curr.findIndex((r) => r.id === dragId);
      const to = curr.findIndex((r) => r.id === overId);
      if (from === -1 || to === -1 || from === to) return curr;

      const next = [...curr];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      return next.map((item, index) => ({
        ...item,
        position: index * 100,
      }));
    });
  }

  async function handleDrop(e) {
    e.preventDefault();

    try {
      await reorderHubItems(hubId, items);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to save new order");
    } finally {
      setDragId(null);
    }
  }

  function handleDragEnd() {
    setDragId(null);
  }

  function draggablePropsFor(item) {
    return {
      onDragStart: (e) => handleDragStart(e, item.id),
      onDragOver: (e) => handleDragOver(e, item.id),
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
    };
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="shrink-0 px-6 pt-2">
        <HubScreenHeader
          title="Hub Content"
          action={{
            label: "Add from library",
            onClick: () => setIsAddOpen(true),
          }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        {loading && !loadedRef.current ? (
          <div className="p-6 text-gray-500">Loading…</div>
        ) : sortedItems.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900">
                This hub doesn’t have any content yet
              </h2>
              <p className="text-gray-500 mt-3">
                Add assets from your library to start building it.
              </p>
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="inline-flex mt-6 px-4 py-2 rounded-md bg-[#1F50AF] text-white"
              >
                Add from library
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-[#F4F7FE]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F4F7FE]/80 pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <ViewToggle viewMode={viewMode} onChange={setViewMode} />

                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name"
                  className="h-10 min-w-[220px] flex-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-400 outline-none transition-colors focus:border-[#1F50AF]"
                />

                <FilterSelect
                  value={selectedType}
                  onChange={setSelectedType}
                  ariaLabel="Filter by type"
                  options={[
                    { value: "all", label: "All types" },
                    { value: "pdf", label: "PDF" },
                    { value: "image", label: "Image" },
                    { value: "embed", label: "Embed" },
                    { value: "file", label: "File" },
                  ]}
                />

                <FilterSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  ariaLabel="Filter by status"
                  options={[
                    { value: "all", label: "All statuses" },
                    { value: "ready", label: "Ready" },
                    { value: "pending", label: "Pending" },
                    { value: "processing", label: "Processing" },
                    { value: "failed", label: "Failed" },
                    { value: "none", label: "No status" },
                  ]}
                />

                <FilterSelect
                  value={selectedTag}
                  onChange={setSelectedTag}
                  ariaLabel="Filter by tag"
                  options={tagOptions}
                />

                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-400 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Clear
                </button>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="pt-10 text-sm text-gray-500">
                No content matches your filters.
              </div>
            ) : viewMode === "grid" ? (
              <div className="pt-2">
                <AssetTileGrid>
                  {filteredItems.map((item) => (
                    <HubItemTile
                      key={item.id}
                      item={item}
                      confirmRemoveId={confirmRemoveId}
                      onSetConfirmRemove={setConfirmRemoveId}
                      onRemove={handleRemove}
                    />
                  ))}
                </AssetTileGrid>
              </div>
            ) : (
              <div className="pt-2">
                <HubItemsTable
                  items={filteredItems}
                  confirmRemoveId={confirmRemoveId}
                  onSetConfirmRemove={setConfirmRemoveId}
                  onRemove={handleRemove}
                  onToggleGuided={handleToggleGuided}
                  dragId={dragId}
                  draggablePropsFor={draggablePropsFor}
                />
              </div>
            )}
          </>
        )}
      </div>

      <AddAssetsToHubModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        hubId={hubId}
        existingAssetIds={sortedItems.map((item) => item.assetId)}
        onAdded={load}
      />
    </main>
  );
}
