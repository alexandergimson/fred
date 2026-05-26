import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { db, auth, storage } from "./lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import DropzoneModal from "./DropzoneModal";
import SaveIcon from "./icons/SaveIcon";
import {
  AdminLoadingState,
  AdminPage,
  AdminPageContent,
  AdminPageHeader,
} from "./components/admin/AdminPage";
import {
  FormField,
  TextArea,
  TextInput,
} from "./components/admin/FormControls";
import HubSetupSidebar from "./components/hubs/edit/HubSetupSidebar";
import BrandingSection from "./components/hubs/edit/BrandingSection";
import ContactExperienceSection from "./components/hubs/edit/ContactExperienceSection";
import TeamContactsSection from "./components/hubs/edit/TeamContactsSection";
import SocialLinksSection from "./components/hubs/edit/SocialLinksSection";

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

function animateScroll(scroller, top) {
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    scroller.scrollTo({ top });
    return;
  }

  const start = scroller.scrollTop;
  const distance = top - start;
  const duration = 720;
  const startedAt = performance.now();

  function tick(now) {
    const elapsed = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3);

    scroller.scrollTop = start + distance * eased;

    if (elapsed < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

export default function EditHubScreen() {
  const { hubId } = useParams();
  const [avatarTargetId, setAvatarTargetId] = useState(null);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const sidebarRef = useRef(null);

  const [loading, setLoading] = useState(true);

  const [hubName, setHubName] = useState("Hub");

  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("branding");

  const [form, setForm] = useState({
    name: "",
    industry: "",
    contactLink: "",
    contactHeadline: "",
    contactBody: "",
    ctaLabel: "",
    ctaUrl: "",
    twitter: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    logo: null,
    teamMembers: [],
  });

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  function handleAvatarSelect(file) {
    if (!avatarTargetId) return;

    updateTeamMember(avatarTargetId, "avatar", {
      file,
      url: URL.createObjectURL(file),
    });

    setAvatarTargetId(null);
  }
  function addTeamMember() {
    setForm((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        {
          id: crypto.randomUUID(),
          name: "",
          role: "",
          email: "",
          calendarUrl: "",
          linkedin: "",
          avatarUrl: "",
        },
      ],
    }));
  }

  function updateTeamMember(id, field, value) {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member,
      ),
    }));
  }

  function removeTeamMember(id) {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((member) => member.id !== id),
    }));
  }

  function scrollToSection(id) {
    const scroller = scrollRef.current;
    const target = document.getElementById(id);

    if (!scroller || !target) return;

    setActiveSection(id);

    const scrollerRect = scroller.getBoundingClientRect();
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = sidebarRect?.top ?? scrollerRect.top;
    const nextTop = scroller.scrollTop + targetRect.top - targetTop;

    animateScroll(scroller, nextTop);

    if (window.history?.replaceState) {
      window.history.replaceState(null, "", `#${id}`);
    }
  }

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

        const panel = d.contactPanel || {};

        setHubName(d.name || "Hub");

        setForm({
          name: d.name || "",
          industry: d.industry || "",
          contactLink: d.contactLink || "",
          contactHeadline: panel.headline || "",
          contactBody: panel.body || "",
          ctaLabel: panel.ctaLabel || "",
          ctaUrl: panel.ctaUrl || "",
          twitter: d.twitter || "",
          linkedin: d.linkedin || "",
          facebook: d.facebook || "",
          instagram: d.instagram || "",
          logo: d.logoUrl || null,
          teamMembers: Array.isArray(d.teamMembers) ? d.teamMembers : [],
        });
      } catch (e) {
        console.error(e);

        alert("Failed to load hub");
      } finally {
        setLoading(false);
      }
    })();
  }, [hubId, navigate]);

  async function save() {
    try {
      if (!auth.currentUser) {
        alert("Please sign in");
        return;
      }

      const uploadedTeamMembers = await Promise.all(
        form.teamMembers.map(async (member) => {
          if (
            member.avatar &&
            typeof member.avatar === "object" &&
            member.avatar.file
          ) {
            const path = `hubs/${hubId}/team/${member.id}/${member.avatar.file.name}`;
            const fileRef = ref(storage, path);
            const metadata = {
              contentType: member.avatar.file.type || "image/png",
            };
            const task = uploadBytesResumable(
              fileRef,
              member.avatar.file,
              metadata,
            );

            await new Promise((resolve, reject) =>
              task.on("state_changed", null, reject, resolve),
            );

            const avatarUrl = await getDownloadURL(fileRef);

            return {
              ...member,
              avatarUrl,
              avatar: null,
            };
          }

          return member;
        }),
      );

      const cleanedTeamMembers = uploadedTeamMembers
        .map((member) => ({
          id: member.id || crypto.randomUUID(),
          name: (member.name || "").trim(),
          role: (member.role || "").trim(),
          email: (member.email || "").trim(),
          calendarUrl: (member.calendarUrl || "").trim() || null,
          linkedin: (member.linkedin || "").trim() || null,
          avatarUrl: (member.avatarUrl || "").trim() || null,
        }))
        .filter((member) => member.name || member.role || member.email);

      const invalidMember = cleanedTeamMembers.find(
        (member) => !member.name || !member.role || !member.email,
      );

      if (invalidMember) {
        alert("Each team contact needs a name, job title, and email.");
        return;
      }

      let logoUrl =
        form.logo && typeof form.logo === "string" ? form.logo : null;

      if (form.logo && typeof form.logo === "object" && form.logo.file) {
        const path = `hubs/${hubId}/logo/${form.logo.file.name}`;
        const fileRef = ref(storage, path);
        const metadata = {
          contentType: form.logo.file.type || "image/png",
        };
        const task = uploadBytesResumable(fileRef, form.logo.file, metadata);

        await new Promise((resolve, reject) =>
          task.on("state_changed", null, reject, resolve),
        );

        logoUrl = await getDownloadURL(fileRef);
      }

      if (logoUrl && logoUrl.includes("firebasestorage.app")) {
        const p = extractPathFromUrl(logoUrl);

        if (p) {
          logoUrl = await getDownloadURL(ref(storage, p));
        }
      }

      await updateDoc(doc(db, "hubs", hubId), {
        name: (form.name || "").trim(),
        industry: (form.industry || "").trim() || null,
        contactLink: (form.contactLink || "").trim() || null,

        contactPanel: {
          headline: (form.contactHeadline || "").trim() || null,
          body: (form.contactBody || "").trim() || null,
          ctaLabel: (form.ctaLabel || "").trim() || null,
          ctaUrl: (form.ctaUrl || "").trim() || null,
        },

        twitter: (form.twitter || "").trim() || null,
        linkedin: (form.linkedin || "").trim() || null,
        facebook: (form.facebook || "").trim() || null,
        instagram: (form.instagram || "").trim() || null,

        teamMembers: cleanedTeamMembers,

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
      alert("Failed to update hub");
    }
  }

  if (loading) {
    return <AdminLoadingState>Loading hub…</AdminLoadingState>;
  }

  const logoPreview =
    form.logo && typeof form.logo === "object"
      ? form.logo.url
      : typeof form.logo === "string"
        ? form.logo
        : null;

  return (
    <AdminPage>
      <AdminPageHeader>
        <HubScreenHeader
          title={`${hubName} | Hub details`}
          secondaryAction={{
            label: "Preview Hub",
            href: `/prospect/${hubId}`,
          }}
          action={{
            label: "Save changes",
            onClick: save,
            icon: <SaveIcon className="h-5 w-5" />,
          }}
        />
      </AdminPageHeader>

      <AdminPageContent scrollRef={scrollRef}>
        <div className="mx-auto grid max-w-[1450px] grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <HubSetupSidebar
            sidebarRef={sidebarRef}
            activeSection={activeSection}
            onNavigate={scrollToSection}
          />

          <div className="space-y-6">
            <BrandingSection
              form={form}
              update={update}
              logoPreview={logoPreview}
              setLogoModalOpen={setLogoModalOpen}
              Field={FormField}
              TextInput={TextInput}
            />

            <ContactExperienceSection
              form={form}
              update={update}
              Field={FormField}
              TextInput={TextInput}
              TextArea={TextArea}
            />

            <TeamContactsSection
              members={form.teamMembers}
              addTeamMember={addTeamMember}
              updateTeamMember={updateTeamMember}
              removeTeamMember={removeTeamMember}
              setAvatarTargetId={setAvatarTargetId}
              Field={FormField}
              TextInput={TextInput}
            />

            <SocialLinksSection
              form={form}
              update={update}
              Field={FormField}
              TextInput={TextInput}
            />

            <div aria-hidden="true" className="h-[45vh] min-h-80" />
          </div>
        </div>
      </AdminPageContent>

      <DropzoneModal
        open={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        onSelect={(file) => {
          update("logo", {
            file,
            url: URL.createObjectURL(file),
          });

          setLogoModalOpen(false);
        }}
        accept="image/*"
        maxBytes={8 * 1024 * 1024}
        title="Upload logo"
        subtitle="PNG, JPG, SVG or WebP"
        helper="Max 8MB"
      />
      <DropzoneModal
        open={!!avatarTargetId}
        onClose={() => setAvatarTargetId(null)}
        onSelect={handleAvatarSelect}
        accept="image/*"
        maxBytes={8 * 1024 * 1024}
        title="Upload avatar"
        subtitle="PNG, JPG, SVG or WebP"
        helper="Max 8MB"
      />
    </AdminPage>
  );
}
