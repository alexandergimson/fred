import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { db, storage, auth } from "./lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import SaveIcon from "./icons/SaveIcon";
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
    logo: null,
    favicon: null, // NEW
    contactLink: "",
    twitter: "",
    linkedin: "",
    facebook: "",
    instagram: "",
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
          favicon: d.faviconUrl || null, // NEW
          contactLink: d.contactLink || "",
          twitter: d.twitter || "",
          linkedin: d.linkedin || "",
          facebook: d.facebook || "",
          instagram: d.instagram || "",
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

      // ---- LOGO ----
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

      // ---- FAVICON (NEW) ----
      let faviconUrl =
        form.favicon && typeof form.favicon === "string" ? form.favicon : null;

      if (
        form.favicon &&
        typeof form.favicon === "object" &&
        form.favicon.file
      ) {
        const ext = (
          form.favicon.file.name.split(".").pop() || "png"
        ).toLowerCase();
        const path = `hubs/${hubId}/favicon/favicon.${ext}`;
        const fileRef = ref(storage, path);
        const metadata = {
          contentType: form.favicon.file.type || "image/png",
        };
        const task = uploadBytesResumable(fileRef, form.favicon.file, metadata);
        await new Promise((res, rej) =>
          task.on("state_changed", null, rej, res)
        );
        faviconUrl = await getDownloadURL(fileRef);
      }

      if (faviconUrl && faviconUrl.includes("firebasestorage.app")) {
        const p = extractPathFromUrl(faviconUrl);
        if (p) faviconUrl = await getDownloadURL(ref(storage, p));
      }

      const payload = {
        name: (form.name || "").trim(),
        contactLink: (form.contactLink || "").trim() || null,
        twitter: (form.twitter || "").trim() || null,
        linkedin: (form.linkedin || "").trim() || null,
        facebook: (form.facebook || "").trim() || null,
        instagram: (form.instagram || "").trim() || null,
        prospectTheme: form.prospectTheme,
        ...(form.logo === null
          ? { logoUrl: null }
          : logoUrl
          ? { logoUrl }
          : {}),
        ...(form.favicon === null
          ? { faviconUrl: null }
          : faviconUrl
          ? { faviconUrl }
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

  const faviconPreviewSrc =
    form.favicon && typeof form.favicon === "object"
      ? form.favicon.url
      : typeof form.favicon === "string"
      ? form.favicon
      : null;

  // Logo upload state
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const MAX_BYTES = 8 * 1024 * 1024;

  // Favicon upload state (NEW)
  const faviconInputRef = useRef(null);
  const [faviconDragging, setFaviconDragging] = useState(false);
  const [faviconError, setFaviconError] = useState("");
  const FAVICON_MAX_BYTES = 2 * 1024 * 1024;

  function validateAndSetLogo(file) {
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

  function validateAndSetFavicon(file) {
    if (!file) return;
    if (file.size > FAVICON_MAX_BYTES) {
      setFaviconError(
        `File too large. Max ${(FAVICON_MAX_BYTES / (1024 * 1024)).toFixed(
          0
        )}MB.`
      );
      return;
    }
    setFaviconError("");
    update("favicon", { file, url: URL.createObjectURL(file) });
  }

  function onDropLogo(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    validateAndSetLogo(f);
  }

  function onDropFavicon(e) {
    e.preventDefault();
    setFaviconDragging(false);
    const f = e.dataTransfer?.files?.[0];
    validateAndSetFavicon(f);
  }

  if (loading) {
    return (
      <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading hub…</div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col page-fade-in">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl overflow-hidden flex flex-col shadow-sm">
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

          <div className="flex-1 overflow-auto ml-8 mr-8 pb-4">
            <div className="space-y-10 max-w-screen-2xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* LEFT COLUMN: text + social */}
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

                  {/* Social Fields */}
                  <Field label="Twitter URL">
                    <TextInput
                      type="url"
                      value={form.twitter || ""}
                      onChange={(e) => update("twitter", e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </Field>
                  <Field label="LinkedIn URL">
                    <TextInput
                      type="url"
                      value={form.linkedin || ""}
                      onChange={(e) => update("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </Field>
                  <Field label="Facebook URL">
                    <TextInput
                      type="url"
                      value={form.facebook || ""}
                      onChange={(e) => update("facebook", e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </Field>
                  <Field label="Instagram URL">
                    <TextInput
                      type="url"
                      value={form.instagram || ""}
                      onChange={(e) => update("instagram", e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </Field>
                </div>

                {/* RIGHT COLUMN: logo + favicon */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Logo uploader */}
                  <div>
                    <div className="mb-2 text-sm text-gray-600">Logo</div>
                    <input
                      id="logoInput"
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => validateAndSetLogo(e.target.files?.[0])}
                    />
                    <label
                      htmlFor="logoInput"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDropLogo}
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
                      {previewSrc && (
                        <button
                          type="button"
                          className="UserSecondaryCta w-35 px-3"
                          onClick={() => update("logo", null)}
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        className="UserPrimaryCta w-35 px-4"
                        onClick={() => inputRef.current?.click()}
                      >
                        {previewSrc ? "Replace logo" : "Upload logo"}
                      </button>
                    </div>
                  </div>

                  {/* Favicon uploader (tab icon) */}
                  <div>
                    <div className="mb-2 text-sm text-gray-600">
                      Favicon (tab icon)
                    </div>
                    <input
                      id="faviconInput"
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        validateAndSetFavicon(e.target.files?.[0])
                      }
                    />
                    <label
                      htmlFor="faviconInput"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setFaviconDragging(true);
                      }}
                      onDragLeave={() => setFaviconDragging(false)}
                      onDrop={onDropFavicon}
                      className={[
                        "flex h-24 w-full items-center justify-center rounded-lg border border-dashed overflow-hidden cursor-pointer",
                        faviconDragging
                          ? "border-[#1F50AF] bg-[#F4F7FE]"
                          : "border-gray-300 bg-white",
                      ].join(" ")}
                    >
                      {faviconPreviewSrc ? (
                        <img
                          src={faviconPreviewSrc}
                          alt="Favicon preview"
                          className="h-12 w-12 object-contain"
                        />
                      ) : (
                        <div className="text-xs text-gray-500 text-center px-3">
                          <div className="mb-1 font-medium text-gray-700">
                            Click to upload or drag & drop
                          </div>
                          <div>Square PNG/JPG/SVG/ICO (max 2MB)</div>
                          <div>32×32 or 64×64 recommended</div>
                        </div>
                      )}
                    </label>

                    {faviconError ? (
                      <div className="mt-2 text-xs text-red-600">
                        {faviconError}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center gap-2">
                      {faviconPreviewSrc && (
                        <button
                          type="button"
                          className="UserSecondaryCta w-35 px-3"
                          onClick={() => update("favicon", null)}
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        className="UserPrimaryCta w-35 px-4"
                        onClick={() => faviconInputRef.current?.click()}
                      >
                        {faviconPreviewSrc
                          ? "Replace favicon"
                          : "Upload favicon"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* other design controls (theme etc) will sit below here */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
