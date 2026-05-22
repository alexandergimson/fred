import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import SettingsCard from "../admin/SettingsCard";
import { FormField, TextInput } from "../admin/FormControls";
import { db } from "../../lib/firebase";
import {
  buildShareUrl,
  createShareLink,
  revokeShareLink,
  subscribeToHubShares,
} from "../../lib/shares";

function formatDate(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatDuration(sec) {
  if (sec === undefined || sec === null) return "—";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}m ${r}s` : `${r}s`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function HubShareLinksSection({ hubId }) {
  const [shares, setShares] = useState([]);
  const [summaries, setSummaries] = useState(new Map());
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [form, setForm] = useState({
    label: "",
    company: "",
    recipientName: "",
    recipientEmail: "",
    campaign: "",
  });

  useEffect(() => {
    if (!hubId) return undefined;
    return subscribeToHubShares(hubId, setShares);
  }, [hubId]);

  useEffect(() => {
    const unsubs = shares.map((share) =>
      onSnapshot(
        doc(db, "shares", share.id, "analytics", "summary"),
        (snap) => {
          setSummaries((prev) => {
            const next = new Map(prev);
            next.set(share.id, snap.exists() ? snap.data() : {});
            return next;
          });
        },
        (err) => console.error("[shares] summary read error", err),
      ),
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, [shares]);

  const rows = useMemo(
    () =>
      shares.map((share) => {
        const summary = summaries.get(share.id) || {};
        const uniqueVisits = Number(summary.uniqueVisits || 0);
        const totalEngagementSec = Number(summary.totalEngagementSec || 0);
        return {
          ...share,
          summary,
          url: buildShareUrl({ hubId, shareId: share.id }),
          avgTimeSec:
            uniqueVisits > 0
              ? Math.round(totalEngagementSec / uniqueVisits)
              : null,
        };
      }),
    [hubId, shares, summaries],
  );

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const shareId = await createShareLink({ hubId, ...form });
      const url = buildShareUrl({ hubId, shareId });
      await copyText(url);
      setCopiedId(shareId);
      setForm({
        label: "",
        company: "",
        recipientName: "",
        recipientEmail: "",
        campaign: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create share link");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy(row) {
    await copyText(row.url);
    setCopiedId(row.id);
  }

  async function handleRevoke(row) {
    if (!window.confirm(`Revoke "${row.label || "Share link"}"?`)) return;
    await revokeShareLink(row.id);
  }

  return (
    <SettingsCard
      id="share-links"
      title="Share links"
      description="Create unique prospect links and track engagement for each recipient, company, or campaign."
    >
      <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <FormField label="Label" required>
          <TextInput
            value={form.label}
            onChange={(e) => update("label", e.target.value)}
            placeholder="Nscale - Alex"
            required
          />
        </FormField>

        <FormField label="Company">
          <TextInput
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Nscale"
          />
        </FormField>

        <FormField label="Recipient">
          <TextInput
            value={form.recipientName}
            onChange={(e) => update("recipientName", e.target.value)}
            placeholder="Alex Gimson"
          />
        </FormField>

        <FormField label="Email">
          <TextInput
            type="email"
            value={form.recipientEmail}
            onChange={(e) => update("recipientEmail", e.target.value)}
            placeholder="alex@example.com"
          />
        </FormField>

        <FormField label="Campaign">
          <div className="flex gap-2">
            <TextInput
              value={form.campaign}
              onChange={(e) => update("campaign", e.target.value)}
              placeholder="May follow-up"
            />
            <button
              type="submit"
              disabled={saving}
              className="h-10 shrink-0 transform-gpu cursor-pointer rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-primary hover:bg-background hover:text-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create
            </button>
          </div>
        </FormField>
      </form>

      <div className="mt-6 overflow-hidden rounded-md border border-gray-200">
        <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.4fr)_100px_120px_180px_180px] gap-4 border-b border-gray-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          <div>Link</div>
          <div>Recipient</div>
          <div>Visits</div>
          <div>Avg time</div>
          <div>Last viewed</div>
          <div className="text-right">Actions</div>
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.4fr)_100px_120px_180px_180px] items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">
                {row.label || "Share link"}
              </div>
              <div className="truncate text-xs text-gray-500">{row.url}</div>
            </div>
            <div className="min-w-0 text-gray-600">
              <div className="truncate">
                {[row.recipientName, row.company].filter(Boolean).join(" · ") ||
                  "—"}
              </div>
              <div className="truncate text-xs text-gray-400">
                {[row.recipientEmail, row.campaign].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div className="tabular-nums text-gray-700">
              {Number(row.summary.uniqueVisits || 0).toLocaleString()}
            </div>
            <div className="text-gray-700">{formatDuration(row.avgTimeSec)}</div>
            <div className="text-gray-500">{formatDate(row.summary.lastViewed)}</div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCopy(row)}
                className="h-8 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {copiedId === row.id ? "Copied" : "Copy"}
              </button>
              {row.status === "revoked" ? (
                <span className="inline-flex h-8 items-center rounded-md bg-gray-100 px-3 text-xs font-medium text-gray-500">
                  Revoked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRevoke(row)}
                  className="h-8 rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}

        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No share links yet. Create one to start tracking a specific send.
          </div>
        ) : null}
      </div>
    </SettingsCard>
  );
}
