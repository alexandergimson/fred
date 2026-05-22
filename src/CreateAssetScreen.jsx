import { DEFAULT_CATEGORIES } from "./lib/contentCategories";
import { useEffect, useMemo, useRef, useState } from "react";
import TagInput from "./components/TagInput";
import { useNavigate } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import SaveIcon from "./icons/SaveIcon";
import Toggle from "./components/Toggle";
import {
  createEmbedAsset,
  createFileAsset,
  isImageFile,
  isPdfFile,
} from "./lib/assets";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function InlineFileDropzone({
  selectedFile,
  onPick,
  onClear,
  accept = "application/pdf,image/*",
  maxBytes = 16 * 1024 * 1024,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function validate(file) {
    if (!file) return false;

    const okType = isPdfFile(file) || isImageFile(file);

    if (!okType) {
      alert("Please pick a PDF or image file.");
      return false;
    }

    if (file.size > maxBytes) {
      alert(`File too large. Max ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`);
      return false;
    }

    return true;
  }

  function handleFile(file) {
    if (!file) return;
    if (!validate(file)) return;
    onPick?.(file);
  }

  const previewUrl = useMemo(() => {
    if (!selectedFile || !isImageFile(selectedFile)) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
          }
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={[
            "flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 text-center transition-all",
            dragOver
              ? "border-[#1F50AF] bg-[#1F50AF]/5"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/60",
          ].join(" ")}
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm">
            <span className="text-2xl">↑</span>
          </div>

          <div className="mt-5 text-lg font-semibold text-gray-900">
            Upload a PDF or image
          </div>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            Drag and drop your file here, or click to browse.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-6 h-10 rounded-md bg-[#1F50AF] px-4 text-sm font-medium text-white hover:bg-[#183F8C]"
          >
            Browse files
          </button>

          <div className="mt-4 text-xs text-gray-400">
            Supports PDF, PNG, JPG, WebP up to 16MB
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-1 gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-72 items-center justify-center bg-gray-50 p-6">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="max-h-80 max-w-full rounded-lg object-contain shadow-sm"
                />
              ) : (
                <div className="grid h-64 w-48 place-items-center rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="text-center">
                    <div className="text-4xl">📄</div>
                    <div className="mt-3 text-sm font-medium text-gray-700">
                      PDF selected
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6 md:border-l md:border-t-0">
              <div className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                File ready
              </div>

              <div className="mt-4 text-base font-semibold text-gray-900">
                {selectedFile.name}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {formatBytes(selectedFile.size)}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Replace
                </button>

                <button
                  type="button"
                  onClick={onClear}
                  className="h-9 rounded-md border border-red-200 bg-white px-3 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateAssetScreen() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    kind: "file",
    embedUrl: "",
    newFile: null,
    tags: [],
    category: "",
    guided: true,
  });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      const tags = Array.isArray(form.tags) ? form.tags : [];

      if (!(form.name || "").trim()) {
        alert("Please enter a name");
        return;
      }

      if (form.kind === "embed") {
        if (!(form.embedUrl || "").trim()) {
          alert("Please enter an embed URL");
          return;
        }

        await createEmbedAsset({
          name: form.name,
          description: (form.description || "").trim() || null,
          embedUrl: form.embedUrl,
          tags,
          category: form.category,
        });

        navigate("/admin/library");
        return;
      }

      if (!form.newFile) {
        alert("Please choose a file to upload");
        return;
      }

      await createFileAsset({
        name: form.name,
        description: (form.description || "").trim() || null,
        file: form.newFile,
        tags,
        category: form.category,
      });

      navigate("/admin/library");
    } catch (e) {
      console.error(e);
      alert("Failed to create asset");
    }
  }

  return (
    <main className="flex h-screen flex-1 flex-col overflow-hidden bg-[#F4F7FE]">
      <div className="shrink-0 px-6 pt-2">
        <HubScreenHeader
          title="Upload content"
          action={{
            label: "Save asset",
            onClick: save,
            icon: <SaveIcon className="h-5 w-5" />,
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="mx-auto max-w-none px-0">
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_420px]">
            {" "}
            <section className="p-6">
              {" "}
              <div className="mb-6 flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Content details
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    These details power hub cards, tabs, and recommendations.
                  </p>
                </div>

                <Field label="Type">
                  <select
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#1F50AF]"
                    value={form.kind || "file"}
                    onChange={(e) =>
                      update({
                        kind: e.target.value,
                        newFile:
                          e.target.value === "embed" ? null : form.newFile,
                      })
                    }
                  >
                    <option value="file">File</option>
                    <option value="embed">Embed</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Name">
                  <input
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#1F50AF]"
                    value={form.name || ""}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </Field>

                <Field label="Category">
                  <input
                    list="asset-categories"
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#1F50AF]"
                    placeholder="Choose or type a category"
                    value={form.category || ""}
                    onChange={(e) => update({ category: e.target.value })}
                  />

                  <datalist id="asset-categories">
                    {DEFAULT_CATEGORIES.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      className="min-h-28 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                      placeholder="Short summary shown on the hub card."
                      value={form.description || ""}
                      onChange={(e) => update({ description: e.target.value })}
                    />
                  </Field>
                </div>

                <Field label="Tags">
                  <TagInput
                    value={form.tags}
                    onChange={(tags) => update({ tags })}
                    placeholder="sales, proposal, onboarding"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Press comma or Enter to add a tag.
                  </p>
                </Field>

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Add to guided track
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Use this by default when adding to hubs.
                    </p>
                  </div>

                  <Toggle
                    checked={form.guided !== false}
                    onChange={(checked) => update({ guided: checked })}
                    label="Add to guided track"
                  />
                </div>
              </div>
            </section>
            <section className="p-6 lg:border-r lg:border-gray-200">
              {" "}
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Upload file
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add a resource to your content library.
                </p>
              </div>
              {form.kind === "embed" ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <Field label="Embed URL">
                    <input
                      className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#1F50AF]"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={form.embedUrl || ""}
                      onChange={(e) => update({ embedUrl: e.target.value })}
                    />
                  </Field>
                </div>
              ) : (
                <InlineFileDropzone
                  selectedFile={form.newFile}
                  onPick={(file) => {
                    update({
                      newFile: file,
                      name: form.name || file.name.replace(/\.[^/.]+$/, ""),
                    });
                  }}
                  onClear={() => update({ newFile: null })}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
