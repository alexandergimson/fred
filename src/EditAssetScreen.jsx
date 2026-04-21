import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import SaveIcon from "./icons/SaveIcon";
import { getAsset, updateAsset } from "./lib/assets";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;

  const cls =
    status === "ready"
      ? "bg-green-100 text-green-700"
      : status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${cls}`}>{status}</span>
  );
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
      if (host === "youtu.be") {
        id = u.pathname.split("/")[1] || "";
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2] || "";
      } else {
        id = u.searchParams.get("v") || "";
      }
      if (!id) return null;
      return {
        src: `https://www.youtube-nocookie.com/embed/${id}`,
        title,
      };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = host === "player.vimeo.com" ? parts[1] || "" : parts[0] || "";
      if (!id) return null;
      return {
        src: `https://player.vimeo.com/video/${id}`,
        title,
      };
    }

    if (host.endsWith("loom.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[1] || "";
      if (!id) return null;
      return {
        src: `https://www.loom.com/embed/${id}`,
        title,
      };
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
  const [form, setForm] = useState({
    name: "",
    tags: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const a = await getAsset(assetId);
        setAsset(a);
        setForm({
          name: a.name || "",
          tags: Array.isArray(a.tags) ? a.tags.join(", ") : "",
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
      const tags = (form.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await updateAsset(assetId, {
        name: (form.name || "").trim(),
        tags,
      });

      navigate("/admin/library");
    } catch (e) {
      console.error(e);
      alert("Failed to update asset");
    }
  }

  const embed = useMemo(() => {
    if (asset?.kind !== "embed") return null;
    return toEmbed(asset.embedUrl, asset.name || "Embed");
  }, [asset]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!asset) return null;

  const previewThumb =
    asset.thumbnailUrl ||
    (asset.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Edit asset"
            action={{
              label: "Save changes",
              onClick: save,
              icon: <SaveIcon className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto p-8">
            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
              <div className="min-h-[420px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {asset.kind === "embed" && embed ? (
                  <div className="w-full aspect-video relative">
                    <iframe
                      src={embed.src}
                      title={embed.title}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : previewThumb ? (
                  <img
                    src={previewThumb}
                    alt={asset.name || "Asset"}
                    className="w-full h-full object-contain"
                  />
                ) : asset.fileUrl ? (
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-3">
                      Preview not available
                    </div>
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-600"
                    >
                      Open original file
                    </a>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No preview available
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    {asset.kind === "embed"
                      ? "Embed"
                      : asset.fileMimeType === "application/pdf"
                        ? "PDF"
                        : asset.fileMimeType?.startsWith("image/")
                          ? "Image"
                          : "File"}
                  </div>
                  <StatusBadge status={asset.processingStatus} />
                </div>

                <Field label="Name">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </Field>

                <Field label="Tags (comma separated)">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                  />
                </Field>

                {asset.kind === "embed" && asset.embedUrl ? (
                  <Field label="Embed URL">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500"
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
                      className="underline text-blue-600"
                    >
                      Open original file
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
