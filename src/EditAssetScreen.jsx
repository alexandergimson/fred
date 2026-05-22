import { DEFAULT_CATEGORIES } from "./lib/contentCategories";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import SaveIcon from "./icons/SaveIcon";
import DeleteIcon from "./icons/DeleteIcon";
import { deleteAsset, getAsset, updateAsset } from "./lib/assets";
import TagInput from "./components/TagInput";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;

  const cls =
    status === "ready"
      ? "bg-green-50 text-green-700 border-green-100"
      : status === "failed"
        ? "bg-red-50 text-red-700 border-red-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${cls}`}
    >
      {status}
    </span>
  );
}

function getAssetType(asset) {
  if (asset.kind === "embed") return "Embed";
  if (asset.fileMimeType === "application/pdf") return "PDF";
  if (asset.fileMimeType?.startsWith("image/")) return "Image";
  return "File";
}

function toEmbed(url, title = "Embed") {
  if (!url || typeof url !== "string") return null;

  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "youtu.be"
    ) {
      let id = "";
      if (host === "youtu.be") id = u.pathname.split("/")[1] || "";
      else if (u.pathname.startsWith("/shorts/"))
        id = u.pathname.split("/")[2] || "";
      else id = u.searchParams.get("v") || "";

      if (!id) return null;
      return { src: `https://www.youtube-nocookie.com/embed/${id}`, title };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = host === "player.vimeo.com" ? parts[1] || "" : parts[0] || "";
      if (!id) return null;
      return { src: `https://player.vimeo.com/video/${id}`, title };
    }

    if (host.endsWith("loom.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[1] || "";
      if (!id) return null;
      return { src: `https://www.loom.com/embed/${id}`, title };
    }

    return { src: u.toString(), title };
  } catch {
    return null;
  }
}

export default function EditAssetScreen() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    tags: [],
    category: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const a = await getAsset(assetId);
        setAsset(a);
        setForm({
          name: a.name || "",
          description: a.description || "",
          tags: Array.isArray(a.tags) ? a.tags : [],
          category: a.category || "",
        });
      } catch (e) {
        console.error(e);
        alert("Failed to load asset");
        navigate("/admin/library");
      } finally {
        setLoading(false);
      }
    })();
  }, [assetId, navigate]);

  async function save() {
    try {
      const tags = Array.isArray(form.tags) ? form.tags : [];

      await updateAsset(assetId, {
        name: (form.name || "").trim(),
        description: (form.description || "").trim() || null,
        category: (form.category || "").trim() || null,
        tags,
      });

      navigate("/admin/library");
    } catch (e) {
      console.error(e);
      alert("Failed to update asset");
    }
  }

  async function handleDelete() {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    try {
      await deleteAsset(assetId);
      navigate("/admin/library");
    } catch (e) {
      console.error(e);
      alert("Failed to delete asset");
    }
  }

  const embed = useMemo(() => {
    if (asset?.kind !== "embed") return null;
    return toEmbed(asset.embedUrl, asset.name || "Embed");
  }, [asset]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!asset) return null;

  const previewUrl =
    asset.thumbnailUrl ||
    (asset.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="shrink-0 px-6 pt-2">
        <HubScreenHeader
          title="Edit Asset"
          action={{
            label: "Save changes",
            onClick: save,
            icon: <SaveIcon className="w-5 h-5" />,
          }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-6 pb-6 pt-4">
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          {" "}
          <section className="min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="h-full overflow-auto p-6">
              {asset.kind === "embed" && embed ? (
                <div className="mx-auto max-w-5xl aspect-video overflow-hidden rounded-lg bg-black">
                  <iframe
                    src={embed.src}
                    title={embed.title}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              ) : previewUrl ? (
                <div className="mx-auto max-w-5xl">
                  <img
                    src={previewUrl}
                    alt={asset.name || "Asset"}
                    className="mx-auto h-auto w-full rounded-md bg-white"
                  />
                </div>
              ) : asset.fileUrl ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <div className="text-sm text-gray-500 mb-3">
                      Preview not available.
                    </div>
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline text-[#1F50AF]"
                    >
                      Open original file
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No preview available.
                </div>
              )}
            </div>
          </section>
          <aside className="min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">{getAssetType(asset)}</div>
              <StatusBadge status={asset.processingStatus} />
            </div>

            <div className="mt-8 space-y-6">
              <Field label="Name">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Field>

              <Field label="Description">
                <textarea
                  className="min-h-24 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  placeholder="Short summary shown on the hub card."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Field>

              <Field label="Tags">
                <TagInput
                  value={form.tags}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                  placeholder="sales, proposal, onboarding"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Press comma or Enter to add a tag.
                </p>
              </Field>

              <Field label="Category">
                <input
                  list="asset-categories"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  placeholder="Choose or type a category"
                  value={form.category || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                />

                <datalist id="asset-categories">
                  {DEFAULT_CATEGORIES.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </Field>

              {asset.kind === "embed" && asset.embedUrl ? (
                <Field label="Embed URL">
                  <input
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    value={asset.embedUrl}
                    disabled
                  />
                </Field>
              ) : null}

              {asset.fileUrl ? (
                <div>
                  <a
                    href={asset.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline text-[#1F50AF]"
                  >
                    Open original file
                  </a>
                </div>
              ) : null}
            </div>

            <div className="mt-10 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={handleDelete}
                className={
                  isDeleting
                    ? "inline-flex h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
                    : "inline-flex h-10 items-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50"
                }
              >
                <DeleteIcon className="h-4 w-4" />
                {isDeleting ? "Confirm delete" : "Delete asset"}
              </button>

              {isDeleting ? (
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="ml-3 h-10 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
