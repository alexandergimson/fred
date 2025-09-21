// CreateHubScreen.jsx
import { useState } from "react";
import HubScreenHeader from "./HubScreenHeader";
import { useNavigate } from "react-router-dom";
import ThemePreview from "./ThemePreview";

import { db, storage, auth } from "./lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import DropzoneModal from "./DropzoneModal";

/* shared theme bits */
import ColorInput from "./theme/ColorInput";
import BgField from "./theme/BgField";
import { defaultProspectTheme } from "./theme/defaults";

/* ---------- small UI helpers ---------- */
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

/* ---------- main ---------- */
export default function CreateHubScreen() {
  const [form, setForm] = useState({
    name: "",
    contactLink: "",
    prospectTheme: defaultProspectTheme, // gradient-capable defaults
    logo: null, // { file, url }
  });
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const navigate = useNavigate();

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

  const save = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Please sign in");

      // 1) Create the hub (no logo yet)
      const basePayload = {
        name: (form.name || "").trim(),
        contactLink: (form.contactLink || "").trim() || null,
        prospectTheme: form.prospectTheme,
        logoUrl: null,
        ownerId: user.uid,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const hubsCol = collection(db, "hubs");
      const docRef = await addDoc(hubsCol, basePayload);

      // 2) Upload logo if selected
      if (form.logo?.file) {
        const path = `hubs/${docRef.id}/logo/${form.logo.file.name}`;
        const fileRef = ref(storage, path);
        const metadata = { contentType: form.logo.file.type || "image/png" };
        const task = uploadBytesResumable(fileRef, form.logo.file, metadata);
        await new Promise((res, rej) =>
          task.on("state_changed", null, rej, res)
        );
        const logoUrl = await getDownloadURL(fileRef);
        await updateDoc(doc(db, "hubs", docRef.id), {
          logoUrl,
          updatedAt: serverTimestamp(),
        });
      }

      // 3) Go to content list
      navigate(`/admin/hubs/${docRef.id}/content`);
    } catch (e) {
      console.error(e);
      alert("Failed to save hub");
    }
  };

  const previewSrc =
    form.logo && typeof form.logo === "object" ? form.logo.url : null;

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="New Hub"
            action={{ label: "Save hub", onClick: save }}
          />

          <div className="flex-1 overflow-auto px-6 pb-4">
            <div className="space-y-10 max-w-screen-2xl mx-auto">
              {/* Top row: left inputs, right logo area */}
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

                {/* Right: logo preview + modal trigger (matches Edit) */}
                <div className="lg:col-span-1">
                  <div className="mb-2 text-sm text-gray-600">Logo</div>
                  <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white overflow-hidden">
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt="Logo preview"
                        className="h-24 max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 text-center px-3">
                        <div className="mb-1 font-medium text-gray-700">
                          Upload an image
                        </div>
                        <div>PNG, JPG, SVG, or WebP</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="UserPrimaryCta w-35 px-4"
                      onClick={() => setLogoModalOpen(true)}
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

              {/* Prospect Theme + Preview */}
              <section>
                <div className="grid lg:grid-cols-2 gap-6 items-start">
                  {/* Left: Prospect Theme with solid/gradient popovers */}
                  <div>
                    <h3 className="TextH2">Prospect Theme</h3>
                    <p className="TextMuted">
                      Sidebar, header, buttons (incl. PDF controls) and viewer
                      background.
                    </p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Backgrounds with gradient support */}
                      <BgField
                        label="Sidebar background"
                        mode={form.prospectTheme.sidebarBgMode}
                        setMode={(v) =>
                          update("prospectTheme.sidebarBgMode", v)
                        }
                        solid={form.prospectTheme.sidebarBg}
                        setSolid={(v) => update("prospectTheme.sidebarBg", v)}
                        gradient={form.prospectTheme.sidebarGradient}
                        setGradient={(g) =>
                          update("prospectTheme.sidebarGradient", g)
                        }
                      />
                      <Field label="Sidebar text">
                        <ColorInput
                          withModal
                          value={form.prospectTheme.sidebarText}
                          onChange={(v) =>
                            update("prospectTheme.sidebarText", v)
                          }
                        />
                      </Field>
                      <Field label="Logo background (sidebar)">
                        <ColorInput
                          withModal
                          value={form.prospectTheme.logoBg}
                          onChange={(v) => update("prospectTheme.logoBg", v)}
                        />
                      </Field>

                      <BgField
                        label="Header background"
                        mode={form.prospectTheme.headerBgMode}
                        setMode={(v) => update("prospectTheme.headerBgMode", v)}
                        solid={form.prospectTheme.headerBg}
                        setSolid={(v) => update("prospectTheme.headerBg", v)}
                        gradient={form.prospectTheme.headerGradient}
                        setGradient={(g) =>
                          update("prospectTheme.headerGradient", g)
                        }
                      />
                      <Field label="Header text">
                        <ColorInput
                          withModal
                          value={form.prospectTheme.headerText}
                          onChange={(v) =>
                            update("prospectTheme.headerText", v)
                          }
                        />
                      </Field>

                      <Field label="Button background">
                        <ColorInput
                          withModal
                          value={form.prospectTheme.buttonBg}
                          onChange={(v) => update("prospectTheme.buttonBg", v)}
                        />
                      </Field>
                      <Field label="Button text">
                        <ColorInput
                          withModal
                          value={form.prospectTheme.buttonText}
                          onChange={(v) =>
                            update("prospectTheme.buttonText", v)
                          }
                        />
                      </Field>

                      <BgField
                        label="Content background"
                        mode={form.prospectTheme.contentBgMode}
                        setMode={(v) =>
                          update("prospectTheme.contentBgMode", v)
                        }
                        solid={form.prospectTheme.contentBg}
                        setSolid={(v) => update("prospectTheme.contentBg", v)}
                        gradient={form.prospectTheme.contentGradient}
                        setGradient={(g) =>
                          update("prospectTheme.contentGradient", g)
                        }
                      />
                    </div>
                  </div>

                  {/* Right: inline live preview */}
                  <div>
                    <h3 className="TextH2">Theme Preview</h3>
                    <div className="mt-4">
                      <ThemePreview
                        theme={form.prospectTheme}
                        logoUrl={previewSrc}
                        anchorClass="relative w-full" // inline
                        className="w-full aspect-[16/9]"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Logo upload modal */}
      <DropzoneModal
        open={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        onSelect={(file) => {
          update("logo", { file, url: URL.createObjectURL(file) });
          setLogoModalOpen(false);
        }}
        accept="image/*"
        maxBytes={8 * 1024 * 1024}
        title="Upload logo"
        subtitle="PNG, JPG, SVG or WebP"
        helper="Max 8MB"
      />
    </main>
  );
}
