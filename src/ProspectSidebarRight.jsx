// ProspectSidebarRight.jsx
import { Download, Twitter, Linkedin, Facebook, Instagram } from "./icons";

export default function ProspectMetaSidebar({
  hub,
  hubTitle,
  contentName,
  contactHref,
  activeItem, // ⬅️ make sure the parent passes this in
  style,
}) {
  const social = {
    twitter: hub?.twitter,
    linkedin: hub?.linkedin,
    facebook: hub?.facebook,
    instagram: hub?.instagram,
  };

  const hasSocials = Object.values(social).some(Boolean);
  const iconStyle = { color: "var(--pv-sidebar-meta-text)" };

  // ---------- Download helpers ----------
  async function downloadFile(url, filename = "download") {
    try {
      const res = await fetch(url, { credentials: "omit", mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      // Fallback – let browser handle it
      const a = document.createElement("a");
      a.href = url + (url.includes("?") ? "&" : "?") + "download=1";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function filenameFor(item) {
    if (!item?.fileUrl) return "download";
    try {
      const u = new URL(item.fileUrl);
      const last = u.pathname.split("/").filter(Boolean).pop() || "";
      const hasExt = /\.[a-z0-9]+$/i.test(last);
      const base = (item.name || last || "download")
        .replace(/[^\w.\- ]+/g, "_")
        .trim();
      return hasExt ? base : `${base}${last ? "" : ".file"}`;
    } catch {
      const base = (item?.name || "download")
        .replace(/[^\w.\- ]+/g, "_")
        .trim();
      return base;
    }
  }

  const canDownload =
    activeItem &&
    activeItem.kind !== "embed" &&
    typeof activeItem.fileUrl === "string" &&
    activeItem.fileUrl.length > 0;

  // --------------------------------------

  return (
    <aside
      className="h-screen flex flex-col overflow-hidden shrink-0 page-fade-in"
      style={{
        width: "clamp(220px, 16vw, 320px)",
        background: "transparent",
        color: "var(--pv-sidebar-text)",
        ...(style || {}),
      }}
    >
      <div
        className="p-4 shrink-0 flex flex-col items-center justify-center space-y-4"
        style={{ background: "transparent" }}
      >
        {contactHref ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brand w-full max-w-[280px] h-10 text-sm"
          >
            Contact us
          </a>
        ) : null}

        {hasSocials && (
          <div className="flex gap-4 justify-center">
            {social.twitter && (
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                title="Twitter"
                style={iconStyle}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Twitter size={18} />
              </a>
            )}
            {social.linkedin && (
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                style={iconStyle}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Linkedin size={18} />
              </a>
            )}
            {social.facebook && (
              <a
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                style={iconStyle}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Facebook size={18} />
              </a>
            )}
            {social.instagram && (
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                style={iconStyle}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Instagram size={18} />
              </a>
            )}
          </div>
        )}
      </div>

      <div
        className="p-4 space-y-5"
        style={{ color: "var(--pv-sidebar-meta-text)" }}
      >
        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
            Hub
          </div>
          <div className="text-base font-semibold leading-snug">
            {hubTitle || "—"}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
            Content
          </div>
          <div className="text-sm leading-snug">{contentName || "—"}</div>

          {canDownload && (
            <button
              type="button"
              onClick={() =>
                downloadFile(activeItem.fileUrl, filenameFor(activeItem))
              }
              className="mt-2 inline-flex items-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Download file"
            >
              {/* Download icon still uses main sidebar text colour */}
              <Download className="w-4 h-4" style={iconStyle} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1" />
    </aside>
  );
}
