// ProspectSidebarRight.jsx
import Download from "./icons/Download";

const Twitter = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
);
const Linkedin = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
);
const Facebook = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const Instagram = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);

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
