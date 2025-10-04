import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { db, storage, auth } from "./lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import ThemePreview from "./ThemePreview";
import SaveIcon from "./icons/SaveIcon";

/* theme pieces */
import ColorInput from "./theme/ColorInput";
import BgField from "./theme/BgField";
import { defaultProspectTheme, migrateTheme } from "./theme/defaults";

/* small UI */
function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF] ${
        props.className || ""
      }`}
    />
  );
}

/* helpers */
function extractPathFromUrl(url) {
  try {
    const afterO = url.split("/o/")[1];
    if (!afterO) return null;
    const encoded = afterO.split("?")[0];
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

export default function EditHubScreen() {
  const { hubId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    logo: null, // { file, url } OR string
    contactLink: "",
    prospectTheme: defaultProspectTheme,
  });

  const update = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts.at(-1)] = value;
      return next;
    });
  };

  /* load */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (!snap.exists()) {
          alert("Hub not found");
          navigate("/admin/hubs");
          return;
        }
        const d = snap.data();
        const theme = migrateTheme(d.prospectTheme || {});
        setForm({
          name: d.name || "",
          logo: d.logoUrl || null,
          contactLink: d.contactLink || "",
          prospectTheme: theme,
        });
      } catch (e) {
        console.error(e);
        alert("Failed to load hub");
      } finally {
        setLoading(false);
      }
    })();
  }, [hubId, navigate]);

  const [hubName, setHubName] = useState("Content");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (snap.exists()) setHubName(snap.data().name || "Content");
      } catch {}
    })();
  }, [hubId]);

  /* save */
  const save = async () => {
    try {
      if (!auth.currentUser) return alert("Please sign in");

      let logoUrl =
        form.logo && typeof form.logo === "string" ? form.logo : null;

      if (form.logo && typeof form.logo === "object" && form.logo.file) {
        const path = `hubs/${hubId}/logo/${form.logo.file.name}`;
        const fileRef = ref(storage, path);
        const metadata = { contentType: form.logo.file.type || "image/png" };
        const task = uploadBytesResumable(fileRef, form.logo.file, metadata);
        await new Promise((res, rej) =>
          task.on("state_changed", null, rej, res)
        );
        logoUrl = await getDownloadURL(fileRef);
      }

      if (logoUrl && logoUrl.includes("firebasestorage.app")) {
        const p = extractPathFromUrl(logoUrl);
        if (p) logoUrl = await getDownloadURL(ref(storage, p));
      }

      const payload = {
        name: (form.name || "").trim(),
        contactLink: (form.contactLink || "").trim() || null,
        prospectTheme: form.prospectTheme,
        ...(form.logo === null
          ? { logoUrl: null }
          : logoUrl
          ? { logoUrl }
          : {}),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "hubs", hubId), payload);
      navigate("/admin/hubs");
    } catch (e) {
      console.error(e);
      alert("Failed to update hub");
    }
  };

  const previewSrc =
    form.logo && typeof form.logo === "object"
      ? form.logo.url
      : typeof form.logo === "string"
      ? form.logo
      : null;

  // === Inline Dropzone (no modal) ===
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const MAX_BYTES = 8 * 1024 * 1024; // 8MB

  function validateAndSet(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(
        `File too large. Max ${(MAX_BYTES / (1024 * 1024)).toFixed(0)}MB.`
      );
      return;
    }
    setError("");
    update("logo", { file, url: URL.createObjectURL(file) });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    validateAndSet(f);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title={`${hubName} | design`}
            secondaryAction={{
              label: "Preview Hub",
              href: `/prospect/${hubId}`,
            }}
            action={{
              label: "Save changes",
              onClick: save,
              icon: <SaveIcon className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 overflow-auto px-6 pb-4">
            <div className="space-y-10 max-w-screen-2xl mx-auto">
              {/* Top row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="lg:col-span-1 grid grid-cols-1 gap-4">
                  <Field label="Hub Name" required>
                    <TextInput
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Coca-Cola"
                    />
                  </Field>
                  <Field label="Contact Us link">
                    <TextInput
                      type="url"
                      value={form.contactLink || ""}
                      onChange={(e) => update("contactLink", e.target.value)}
                      placeholder="https://example.com/contact"
                    />
                  </Field>
                </div>

                <div className="lg:col-span-1">
                  <div className="mb-2 text-sm text-gray-600">Logo</div>

                  {/* Dropzone */}
                  <input
                    id="logoInput"
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => validateAndSet(e.target.files?.[0])}
                  />
                  <label
                    htmlFor="logoInput"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={[
                      "flex h-40 w-full items-center justify-center rounded-lg border border-dashed overflow-hidden cursor-pointer",
                      dragging
                        ? "border-[#1F50AF] bg-[#F4F7FE]"
                        : "border-gray-300 bg-white",
                    ].join(" ")}
                  >
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt="Logo preview"
                        className="h-24 max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 text-center px-3">
                        <div className="mb-1 font-medium text-gray-700">
                          Click to upload or drag & drop
                        </div>
                        <div>PNG, JPG, SVG, or WebP (max 8MB)</div>
                      </div>
                    )}
                  </label>

                  {error ? (
                    <div className="mt-2 text-xs text-red-600">{error}</div>
                  ) : null}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="UserPrimaryCta w-35 px-4"
                      onClick={() => inputRef.current?.click()}
                    >
                      {previewSrc ? "Replace logo" : "Upload logo"}
                    </button>
                    {previewSrc && (
                      <button
                        type="button"
                        className="UserSecondaryCta w-35 px-3"
                        onClick={() => update("logo", null)}
                        title="Remove current logo"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
