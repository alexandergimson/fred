import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { db, storage, auth } from "./lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import DropzoneModal from "./DropzoneModal";
import ThemePreview from "./ThemePreview";
import SaveIcon from "./icons/SaveIcon";

import ColorInput from "./theme/ColorInput";
import BgField from "./theme/BgField";
import { defaultProspectTheme, migrateTheme } from "./theme/defaults";

const THEME_PRESETS = [
  {
    id: "clean",
    label: "Clean",
    description: "Bright, neutral, safe default.",
    swatches: ["#F7F8FC", "#1F50AF", "#374151"],
    theme: {
      sidebarBgMode: "solid",
      sidebarBg: "#F7F8FC",
      sidebarText: "#374151",
      rightSidebarText: "#374151",
      buttonBg: "#1F50AF",
      buttonText: "#FFFFFF",
      buttonHoverColor: "#183F8C",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Premium dark experience.",
    swatches: ["#111827", "#FFFFFF", "#93C5FD"],
    theme: {
      sidebarBgMode: "solid",
      sidebarBg: "#111827",
      sidebarText: "#FFFFFF",
      rightSidebarText: "#FFFFFF",
      buttonBg: "#FFFFFF",
      buttonText: "#111827",
      buttonHoverColor: "#E5E7EB",
    },
  },
  {
    id: "soft",
    label: "Soft",
    description: "Calm and understated.",
    swatches: ["#EEF2FF", "#4F46E5", "#475569"],
    theme: {
      sidebarBgMode: "solid",
      sidebarBg: "#EEF2FF",
      sidebarText: "#475569",
      rightSidebarText: "#475569",
      buttonBg: "#4F46E5",
      buttonText: "#FFFFFF",
      buttonHoverColor: "#4338CA",
    },
  },
  {
    id: "bold",
    label: "Bold",
    description: "High contrast and punchy.",
    swatches: ["#0F172A", "#F97316", "#FFFFFF"],
    theme: {
      sidebarBgMode: "solid",
      sidebarBg: "#0F172A",
      sidebarText: "#FFFFFF",
      rightSidebarText: "#FFFFFF",
      buttonBg: "#F97316",
      buttonText: "#FFFFFF",
      buttonHoverColor: "#EA580C",
    },
  },
];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ThemePresetCard({ preset, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative text-left rounded-lg border bg-white p-3 min-h-[112px] transition-all hover:shadow-sm",
        selected
          ? "border-[#1F50AF] ring-2 ring-[#1F50AF]/15"
          : "border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      {selected ? (
        <div className="absolute right-3 top-3 h-6 w-6 rounded-full bg-[#1F50AF] text-white grid place-items-center text-sm">
          ✓
        </div>
      ) : null}

      <div className="flex items-center gap-1.5">
        {preset.swatches.map((colour) => (
          <span
            key={colour}
            className="h-5 w-5 rounded-full border border-black/5"
            style={{ backgroundColor: colour }}
          />
        ))}
      </div>

      <div className="mt-5 text-sm font-semibold text-gray-900">
        {" "}
        {preset.label}
      </div>
      <div className="mt-1 text-xs leading-4 text-gray-500">
        {" "}
        {preset.description}
      </div>
    </button>
  );
}

function AccentControl({ value, onChange, onApply }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-900">Accent colour</div>
          <div className="mt-1 text-xs text-gray-500">
            Used for buttons and primary highlights.
          </div>
        </div>

        <ColorInput value={value} onChange={onChange} />
      </div>

      <button
        type="button"
        onClick={onApply}
        className="mt-4 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
      >
        Apply to buttons
      </button>
    </div>
  );
}

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

function darkenHex(hex) {
  const clean = (hex || "#1F50AF").replace("#", "");
  const num = parseInt(clean, 16);

  const r = Math.max(0, Math.floor(((num >> 16) & 255) * 0.82));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * 0.82));
  const b = Math.max(0, Math.floor((num & 255) * 0.82));

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function applyThemePatch(theme, patch) {
  return {
    ...theme,
    ...patch,
  };
}

export default function HubDesign() {
  const { hubId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [hubName, setHubName] = useState("Hub");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [form, setForm] = useState({
    logo: null,
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

  const patchTheme = (patch) => {
    setForm((prev) => ({
      ...prev,
      prospectTheme: applyThemePatch(prev.prospectTheme, patch),
    }));
  };

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

        setHubName(d.name || "Hub");
        setForm({
          logo: d.logoUrl || null,
          prospectTheme: migrateTheme(d.prospectTheme || {}),
        });
      } catch (e) {
        console.error(e);
        alert("Failed to load hub");
      } finally {
        setLoading(false);
      }
    })();
  }, [hubId, navigate]);

  const activePresetId = useMemo(() => {
    const t = form.prospectTheme;

    return (
      THEME_PRESETS.find((preset) => {
        return (
          preset.theme.sidebarBgMode === t.sidebarBgMode &&
          preset.theme.sidebarBg === t.sidebarBg &&
          preset.theme.buttonBg === t.buttonBg
        );
      })?.id || null
    );
  }, [form.prospectTheme]);

  async function save() {
    try {
      if (!auth.currentUser) {
        alert("Please sign in");
        return;
      }

      let logoUrl =
        form.logo && typeof form.logo === "string" ? form.logo : null;

      if (form.logo && typeof form.logo === "object" && form.logo.file) {
        const path = `hubs/${hubId}/logo/${form.logo.file.name}`;
        const fileRef = ref(storage, path);
        const metadata = { contentType: form.logo.file.type || "image/png" };
        const task = uploadBytesResumable(fileRef, form.logo.file, metadata);

        await new Promise((res, rej) =>
          task.on("state_changed", null, rej, res),
        );

        logoUrl = await getDownloadURL(fileRef);
      }

      if (logoUrl && logoUrl.includes("firebasestorage.app")) {
        const p = extractPathFromUrl(logoUrl);
        if (p) logoUrl = await getDownloadURL(ref(storage, p));
      }

      let bgImage = form.prospectTheme?.sidebarBgImage ?? null;

      if (bgImage && typeof bgImage === "object" && bgImage.file) {
        const ext = (bgImage.file.name.split(".").pop() || "png").toLowerCase();
        const path = `hubs/${hubId}/theme/sidebar-bg.${ext}`;
        const fileRef = ref(storage, path);
        const metadata = { contentType: bgImage.file.type || "image/png" };
        const task = uploadBytesResumable(fileRef, bgImage.file, metadata);

        await new Promise((res, rej) =>
          task.on("state_changed", null, rej, res),
        );

        bgImage = await getDownloadURL(fileRef);
      }

      if (
        typeof bgImage === "string" &&
        bgImage.includes("firebasestorage.app")
      ) {
        const p = extractPathFromUrl(bgImage);
        if (p) bgImage = await getDownloadURL(ref(storage, p));
      }

      const nextTheme = structuredClone(form.prospectTheme);
      nextTheme.sidebarBgImage = bgImage;

      if (nextTheme.sidebarBgMode === "image" && nextTheme.sidebarBgImage) {
        nextTheme.sidebarBgImageFit = "cover";
        nextTheme.sidebarBgImagePosition = "center";
      }

      await updateDoc(doc(db, "hubs", hubId), {
        prospectTheme: nextTheme,
        ...(form.logo === null
          ? { logoUrl: null }
          : logoUrl
            ? { logoUrl }
            : {}),
        updatedAt: serverTimestamp(),
      });

      navigate("/admin/hubs");
    } catch (e) {
      console.error(e);
      alert("Failed to update hub design");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  const previewSrc =
    form.logo && typeof form.logo === "object"
      ? form.logo.url
      : typeof form.logo === "string"
        ? form.logo
        : null;

  const accent = form.prospectTheme.buttonBg || "#1F50AF";

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="shrink-0 px-6 pt-2">
        <HubScreenHeader
          title={`${hubName} | Hub design`}
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
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_520px] gap-6">
          {" "}
          <div className="space-y-5">
            <Section
              title="Design setup"
              description="Add your logo, then choose a visual style."
            >
              <div className="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)] gap-5">
                {" "}
                <div>
                  <div className="text-sm font-medium text-gray-900">Logo</div>

                  <div className="mt-3 h-20 w-32 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {" "}
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt=""
                        className="max-h-16 max-w-[110px] object-contain"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">No logo</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLogoModalOpen(true)}
                      className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Change
                    </button>

                    {previewSrc ? (
                      <button
                        type="button"
                        onClick={() => update("logo", null)}
                        className="h-9 rounded-md border border-red-200 bg-white px-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="border-l border-gray-100 pl-6">
                  <div className="text-sm font-medium text-gray-900">
                    Choose a look
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Apply a complete visual style.
                  </p>

                  <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {THEME_PRESETS.map((preset) => (
                      <ThemePresetCard
                        key={preset.id}
                        preset={preset}
                        selected={activePresetId === preset.id}
                        onClick={() => patchTheme(preset.theme)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <section className="rounded-xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Advanced customisation
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Fine-tune individual colours and background.
                  </p>
                </div>

                <span className="text-2xl text-gray-400">
                  {advancedOpen ? "⌄" : "›"}
                </span>
              </button>

              {advancedOpen ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <AccentControl
                      value={accent}
                      onChange={(v) => update("prospectTheme.buttonBg", v)}
                      onApply={() =>
                        patchTheme({
                          buttonBg: accent,
                          buttonHoverColor: darkenHex(accent),
                          buttonText: "#FFFFFF",
                        })
                      }
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <BgField
                      label="Sidebar background"
                      mode={form.prospectTheme.sidebarBgMode}
                      setMode={(v) => update("prospectTheme.sidebarBgMode", v)}
                      solid={form.prospectTheme.sidebarBg}
                      setSolid={(v) => update("prospectTheme.sidebarBg", v)}
                      gradient={form.prospectTheme.sidebarGradient}
                      setGradient={(g) =>
                        update("prospectTheme.sidebarGradient", g)
                      }
                      image={form.prospectTheme.sidebarBgImage}
                      setImage={(img) =>
                        update("prospectTheme.sidebarBgImage", img)
                      }
                    />
                  </div>

                  <Field label="Left sidebar text">
                    <ColorInput
                      value={form.prospectTheme.sidebarText}
                      onChange={(v) => update("prospectTheme.sidebarText", v)}
                    />
                  </Field>

                  <Field label="Right sidebar text">
                    <ColorInput
                      value={
                        form.prospectTheme.rightSidebarText ??
                        form.prospectTheme.sidebarText
                      }
                      onChange={(v) =>
                        update("prospectTheme.rightSidebarText", v)
                      }
                    />
                  </Field>

                  <Field label="Button colour">
                    <ColorInput
                      value={form.prospectTheme.buttonBg}
                      onChange={(v) => update("prospectTheme.buttonBg", v)}
                    />
                  </Field>

                  <Field label="Button text">
                    <ColorInput
                      value={form.prospectTheme.buttonText}
                      onChange={(v) => update("prospectTheme.buttonText", v)}
                    />
                  </Field>

                  <Field label="Button hover">
                    <ColorInput
                      value={form.prospectTheme.buttonHoverColor}
                      onChange={(v) =>
                        update("prospectTheme.buttonHoverColor", v)
                      }
                    />
                  </Field>
                </div>
              ) : null}
            </section>
          </div>
          <aside className="xl:sticky xl:top-4 h-fit">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-8">
                <h2 className="text-base font-semibold text-gray-900">
                  Live preview
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Every change updates the prospect experience instantly.
                </p>
              </div>

              <ThemePreview
                theme={form.prospectTheme}
                logoUrl={previewSrc}
                hubName={hubName}
                anchorClass="relative w-full"
                className="w-full"
              />
            </div>
          </aside>
        </div>
      </div>

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
