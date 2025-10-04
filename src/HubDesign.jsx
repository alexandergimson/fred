import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { db, storage, auth } from "./lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import DropzoneModal from "./DropzoneModal";
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
      <div className="mt-1 px-3 py-2 border border-gray-200 rounded-md">
        {children}
      </div>
    </label>
  );
}
function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-gray-200 hover:border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1F50AF] ${
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
  const [logoModalOpen, setLogoModalOpen] = useState(false);

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

  const [hubName, setHubName] = useState("Content");
  // Fetch hub name
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (snap.exists()) setHubName(snap.data().name || "Content");
      } catch {}
    })();
  }, [hubId]);

  const previewSrc =
    form.logo && typeof form.logo === "object"
      ? form.logo.url
      : typeof form.logo === "string"
      ? form.logo
      : null;

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
              {/* Prospect Theme + Preview */}
              <section>
                <div className="space-y-6">
                  {/* Inputs in a 3x2 grid */}
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      <BgField
                        label="Background Colour"
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
                          value={form.prospectTheme.sidebarText}
                          onChange={(v) =>
                            update("prospectTheme.sidebarText", v)
                          }
                        />
                      </Field>

                      <Field label="Button background">
                        <ColorInput
                          value={form.prospectTheme.buttonBg}
                          onChange={(v) => update("prospectTheme.buttonBg", v)}
                        />
                      </Field>

                      <Field label="Button text">
                        <ColorInput
                          value={form.prospectTheme.buttonText}
                          onChange={(v) =>
                            update("prospectTheme.buttonText", v)
                          }
                        />
                      </Field>

                      <Field label="Button hover background">
                        <ColorInput
                          value={form.prospectTheme.buttonHoverColor}
                          onChange={(v) =>
                            update("prospectTheme.buttonHoverColor", v)
                          }
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Theme preview below inputs */}
                  <div>
                    <div className="mt-4">
                      <ThemePreview
                        theme={form.prospectTheme}
                        logoUrl={previewSrc}
                        hubName={form.name}
                        anchorClass="relative w-full"
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
