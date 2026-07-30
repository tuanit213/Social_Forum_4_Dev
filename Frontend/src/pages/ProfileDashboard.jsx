import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpenCheck,
  Building2,
  Clock,
  Edit3,
  Flame,
  GraduationCap,
  LinkIcon,
  MapPin,
  Mail,
  MessagesSquare,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import {
  getProfileDashboard,
  updateProfileDashboard,
} from "@/services/profileDashboardService";

const emptyDashboard = {
  headline: "",
  bio: "",
  displayName: "",
  pronouns: "Don't specify",
  company: "",
  location: "",
  showLocalTime: false,
  contactEmail: "",
  websiteUrl: "",
  facebookUrl: "",
  socialLinks: [],
  coreStack: [],
  experience: "",
  achievements: [],
  competitions: [],
  topContribution: "",
};

const emptyStats = {
  experienceYears: 0,
  courseCount: 0,
  postCount: 0,
  globalRank: 0,
  currentStreak: 0,
  contestCount: 0,
};

const textToList = (value) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const listToText = (items) => (Array.isArray(items) ? items.join("\n") : "");

const readNumber = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return 0;
};

const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(value);

const githubInputClass =
  "w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-[5px] font-sans text-sm leading-5 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

const githubTextareaClass = `${githubInputClass} min-h-[58px] resize-y`;

const githubLabelClass = "font-sans text-sm font-semibold leading-5 text-[var(--text-primary)]";

function MetricCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="whitespace-nowrap font-sans text-2xl font-bold leading-none tracking-normal text-[var(--text-primary)]">
            {value}
          </p>
          <p className="mt-2 break-words font-sans text-sm font-medium leading-snug tracking-normal text-[var(--text-secondary)]">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onEdit }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-primary)] px-4 py-5">
      <p className="font-mono text-sm text-[var(--text-secondary)]">Chưa có dữ liệu</p>
      <button
        onClick={onEdit}
        className="mt-3 inline-flex items-center gap-2 rounded-md border border-[var(--accent)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-xs text-[var(--accent)] transition-colors hover:bg-[var(--bg-elevated)]"
      >
        <Edit3 size={14} />
        Chỉnh sửa
      </button>
    </div>
  );
}

function ReadOnlyEmpty() {
  return (
    <div
      aria-label="Chưa có dữ liệu"
      className="min-h-[74px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-primary)]"
    />
  );
}

function TextList({ items }) {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex gap-3">
          <span className="mt-1.5 h-3 w-3 rounded-full border border-[var(--accent)]" />
          <p className="font-sans text-sm leading-relaxed text-[var(--text-primary)]">{item}</p>
        </div>
      ))}
    </div>
  );
}

function ModalShell({ title, error, onClose, onSubmit, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="max-h-full w-full max-w-xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="font-sans text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-[var(--danger)] bg-[var(--bg-secondary)] px-3 py-2 font-sans text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {children}
      </form>
    </div>
  );
}

function FormActions({ onCancel }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        type="submit"
        className="rounded-md bg-[var(--success)] px-3 py-[6px] font-sans text-xs font-semibold leading-5 text-white transition-colors hover:brightness-110 active:translate-y-px"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-[6px] font-sans text-xs font-semibold leading-5 text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] active:translate-y-px"
      >
        Cancel
      </button>
    </div>
  );
}

function TextInput({ label, value, onChange, rows = 1 }) {
  return (
    <label className="grid gap-2">
      <span className={githubLabelClass}>{label}</span>
      {rows > 1 ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          className={githubTextareaClass}
        />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={githubInputClass} />
      )}
    </label>
  );
}

function IconInput({ icon: Icon, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="grid grid-cols-[18px_minmax(0,1fr)] items-center gap-2">
      <Icon size={17} strokeWidth={1.8} className="text-[var(--text-secondary)]" />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={githubInputClass}
      />
    </div>
  );
}

export default function ProfileDashboard() {
  const { user } = useOutletContext();
  const [profileUser, setProfileUser] = useState(user);
  const [stats, setStats] = useState(emptyStats);
  const [profileData, setProfileData] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [activeForm, setActiveForm] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    displayName: "",
    bio: "",
    pronouns: "Don't specify",
    company: "",
    location: "",
    showLocalTime: false,
    contactEmail: "",
    websiteUrl: "",
    facebookUrl: "",
    socialLink2: "",
    socialLink3: "",
    socialLink4: "",
  });
  const [focusDraft, setFocusDraft] = useState({
    headline: "",
    coreStack: "",
    experience: "",
    topContribution: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const data = await getProfileDashboard();
        if (cancelled) return;

        const nextUser = data.user || user;
        const nextDashboard = { ...emptyDashboard, ...(data.profileDashboard || {}) };

        setProfileUser(nextUser);
        setStats({ ...emptyStats, ...(data.stats || {}) });
        setProfileData({
          ...nextDashboard,
          displayName: nextUser?.displayName || nextDashboard.displayName || "",
          bio: nextUser?.bio || nextDashboard.bio || "",
          pronouns: nextUser?.pronouns || nextDashboard.pronouns || "Don't specify",
          company: nextUser?.company || nextDashboard.company || "",
          location: nextUser?.location || nextDashboard.location || "",
          showLocalTime: Boolean(nextUser?.showLocalTime ?? nextDashboard.showLocalTime),
          contactEmail: nextUser?.contactEmail || nextDashboard.contactEmail || "",
          websiteUrl: nextUser?.websiteUrl || nextDashboard.websiteUrl || "",
          facebookUrl: nextUser?.facebookUrl || nextDashboard.facebookUrl || "",
          socialLinks: nextUser?.socialLinks || nextDashboard.socialLinks || [],
        });
      } catch {
        if (cancelled) return;

        setProfileUser(user);
        setStats(emptyStats);
        setProfileData(emptyDashboard);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const metrics = useMemo(() => {
    const globalRank = readNumber(stats, ["globalRank", "rank"]);

    return [
      {
        label: "Kinh nghiệm",
        value: formatNumber(readNumber(stats, ["experienceYears", "yearsOfExperience", "experience"])),
        icon: GraduationCap,
        tone: "border-[var(--accent)] bg-[var(--bg-secondary)] text-[var(--accent)]",
      },
      {
        label: "Khóa học",
        value: formatNumber(readNumber(stats, ["courseCount", "coursesCompleted", "courses"])),
        icon: BookOpenCheck,
        tone: "border-[var(--success)] bg-[var(--bg-secondary)] text-[var(--success)]",
      },
      {
        label: "Đóng góp post",
        value: formatNumber(readNumber(stats, ["postCount", "postsCount", "posts"])),
        icon: MessagesSquare,
        tone: "border-[var(--accent)] bg-[var(--bg-secondary)] text-[var(--accent)]",
      },
      {
        label: "Global rank",
        value: globalRank > 0 ? `#${formatNumber(globalRank)}` : "0",
        icon: TrendingUp,
        tone: "border-[var(--accent)] bg-[var(--bg-secondary)] text-[var(--accent)]",
      },
      {
        label: "Current streak",
        value: `${formatNumber(readNumber(stats, ["currentStreak", "streak"]))} day`,
        icon: Flame,
        tone: "border-[var(--success)] bg-[var(--bg-secondary)] text-[var(--success)]",
      },
      {
        label: "Cuộc thi",
        value: formatNumber(readNumber(stats, ["contestCount", "competitionCount", "contests"])),
        icon: Award,
        tone: "border-[var(--accent)] bg-[var(--bg-secondary)] text-[var(--accent)]",
      },
    ];
  }, [stats]);

  const buildPayload = (overrides = {}) => ({
    bio: profileData.bio || profileUser?.bio || "",
    displayName: profileData.displayName || profileUser?.displayName || "",
    pronouns: profileData.pronouns || profileUser?.pronouns || "Don't specify",
    company: profileData.company || profileUser?.company || "",
    location: profileData.location || profileUser?.location || "",
    showLocalTime: Boolean(profileData.showLocalTime ?? profileUser?.showLocalTime),
    contactEmail: profileData.contactEmail || profileUser?.contactEmail || "",
    websiteUrl: profileData.websiteUrl || profileUser?.websiteUrl || "",
    facebookUrl: profileData.facebookUrl || profileUser?.facebookUrl || "",
    socialLinks: profileData.socialLinks || profileUser?.socialLinks || [],
    headline: profileData.headline,
    coreStack: profileData.coreStack,
    experience: profileData.experience,
    topContribution: profileData.topContribution,
    ...overrides,
  });

  const applyResponse = (data, fallbackPayload) => {
    const nextUser = data.user || profileUser;
    const nextDashboard = {
      ...emptyDashboard,
      ...fallbackPayload,
      ...(data.profileDashboard || {}),
    };

    setProfileUser(nextUser);
    setStats({ ...emptyStats, ...(data.stats || stats) });
    setProfileData({
      ...nextDashboard,
      displayName: nextUser?.displayName || nextDashboard.displayName || "",
      bio: nextUser?.bio || nextDashboard.bio || "",
      pronouns: nextUser?.pronouns || nextDashboard.pronouns || "Don't specify",
      company: nextUser?.company || nextDashboard.company || "",
      location: nextUser?.location || nextDashboard.location || "",
      showLocalTime: Boolean(nextUser?.showLocalTime ?? nextDashboard.showLocalTime),
      contactEmail: nextUser?.contactEmail || nextDashboard.contactEmail || "",
      websiteUrl: nextUser?.websiteUrl || nextDashboard.websiteUrl || "",
      facebookUrl: nextUser?.facebookUrl || nextDashboard.facebookUrl || "",
      socialLinks: nextUser?.socialLinks || nextDashboard.socialLinks || [],
    });
  };

  const openProfileForm = () => {
    const links = profileData.socialLinks || profileUser?.socialLinks || [];
    setProfileDraft({
      displayName: profileData.displayName || profileUser?.displayName || "",
      bio: profileData.bio || profileUser?.bio || "",
      pronouns: profileData.pronouns || profileUser?.pronouns || "Don't specify",
      company: profileData.company || profileUser?.company || "",
      location: profileData.location || profileUser?.location || "",
      showLocalTime: Boolean(profileData.showLocalTime ?? profileUser?.showLocalTime),
      contactEmail: profileData.contactEmail || profileUser?.contactEmail || "",
      websiteUrl: profileData.websiteUrl || profileUser?.websiteUrl || "",
      facebookUrl: profileData.facebookUrl || profileUser?.facebookUrl || "",
      socialLink2: links[0] || "",
      socialLink3: links[1] || "",
      socialLink4: links[2] || "",
    });
    setSaveError("");
    setActiveForm("profile");
  };

  const openFocusForm = () => {
    setFocusDraft({
      headline: profileData.headline,
      coreStack: listToText(profileData.coreStack),
      experience: profileData.experience,
      topContribution: profileData.topContribution,
    });
    setSaveError("");
    setActiveForm("focus");
  };

  const closeForm = () => setActiveForm(null);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaveError("");

    const payload = buildPayload({
      displayName: profileDraft.displayName.trim(),
      bio: profileDraft.bio.trim(),
      pronouns: profileDraft.pronouns,
      company: profileDraft.company.trim(),
      location: profileDraft.location.trim(),
      showLocalTime: profileDraft.showLocalTime,
      contactEmail: profileDraft.contactEmail.trim(),
      websiteUrl: profileDraft.websiteUrl.trim(),
      facebookUrl: profileDraft.facebookUrl.trim(),
      socialLinks: [
        profileDraft.socialLink2.trim(),
        profileDraft.socialLink3.trim(),
        profileDraft.socialLink4.trim(),
      ].filter(Boolean),
    });

    try {
      const data = await updateProfileDashboard(payload);
      applyResponse(data, payload);
      setActiveForm(null);
    } catch (error) {
      setSaveError(error.message || "Không lưu được profile");
    }
  };

  const saveFocus = async (event) => {
    event.preventDefault();
    setSaveError("");

    const payload = buildPayload({
      headline: focusDraft.headline.trim(),
      coreStack: textToList(focusDraft.coreStack),
      experience: focusDraft.experience.trim(),
      topContribution: focusDraft.topContribution.trim(),
    });

    try {
      const data = await updateProfileDashboard(payload);
      applyResponse(data, payload);
      setActiveForm(null);
    } catch (error) {
      setSaveError(error.message || "Không lưu được Experience & Focus");
    }
  };

  const displayName = profileUser?.displayName || profileUser?.username || "Người dùng";
  const username = profileUser?.username ? profileUser.username : "chưa-cập-nhật";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const bio = profileData.bio || profileUser?.bio || "";
  const company = profileData.company || profileUser?.company || "";
  const location = profileData.location || profileUser?.location || "";
  const websiteUrl = profileData.websiteUrl || profileUser?.websiteUrl || "";
  const facebookUrl = profileData.facebookUrl || profileUser?.facebookUrl || "";
  const hasFocusData =
    profileData.coreStack.length || profileData.experience || profileData.topContribution;
  const hasAchievements = profileData.achievements.length > 0;
  const hasCompetitions = profileData.competitions.length > 0;

  return (
    <div className="w-full">
      <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 px-4 py-3 backdrop-blur-md">
        <h2 className="font-sans text-xl font-bold text-[var(--text-primary)]">Profile Dashboard</h2>
      </div>

      <div className="space-y-6 p-4">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div className="grid gap-5 md:grid-cols-[96px_minmax(0,1fr)]">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--bg-primary)] font-sans text-lg font-bold text-[var(--accent)]">
              {profileUser?.avatarUrl ? (
                <img src={profileUser.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                initials || "ND"
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate font-sans text-2xl font-bold uppercase tracking-normal text-[var(--text-primary)]">
                    {displayName}
                  </h3>
                  <p className="mt-1 font-sans text-base text-[var(--text-secondary)]">{username}</p>
                </div>

                <button
                  onClick={openProfileForm}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 font-sans text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              </div>

              <p className="mt-5 font-sans text-base leading-relaxed text-[var(--text-primary)]">
                {isLoading ? "Đang tải..." : bio || "Chưa có dữ liệu"}
              </p>

              <div className="mt-5 space-y-3 font-sans text-sm text-[var(--text-primary)]">
                {company && (
                  <div className="flex items-center gap-2">
                    <Building2 size={17} className="text-[var(--text-secondary)]" />
                    <span>{company}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={17} className="text-[var(--text-secondary)]" />
                    <span>{location}</span>
                  </div>
                )}
                {websiteUrl && (
                  <div className="flex items-center gap-2">
                    <LinkIcon size={17} className="text-[var(--text-secondary)]" />
                    <span>{websiteUrl}</span>
                  </div>
                )}
                {facebookUrl && (
                  <div className="flex items-center gap-2">
                    <LinkIcon size={17} className="text-[var(--text-secondary)]" />
                    <span>{facebookUrl}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-sans text-lg font-bold text-[var(--text-primary)]">Experience & Focus</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--text-secondary)]">
                    {profileData.headline || "Chưa có dữ liệu"}
                  </p>
                </div>
                <button
                  onClick={openFocusForm}
                  className="rounded-md border border-[var(--border)] px-3 py-2 font-sans text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  Chỉnh sửa
                </button>
              </div>

              {!hasFocusData ? (
                <div className="mt-5">
                  <EmptyState onEdit={openFocusForm} />
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {profileData.coreStack.length > 0 && (
                    <div>
                      <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Core stack
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {profileData.coreStack.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md border border-[var(--accent)] bg-[var(--bg-primary)] px-4 py-2 font-sans text-sm font-semibold text-[var(--accent)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileData.experience && (
                    <div className="border-t border-[var(--border)] pt-5">
                      <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Experience
                      </p>
                      <p className="whitespace-pre-line font-sans text-base leading-7 text-[var(--text-primary)]">
                        {profileData.experience}
                      </p>
                    </div>
                  )}

                  {profileData.topContribution && (
                    <div className="border-t border-[var(--border)] pt-5">
                      <p className="font-sans text-base font-bold text-[var(--text-primary)]">Top contribution</p>
                      <p className="mt-2 font-sans text-sm font-semibold text-[var(--success)]">
                        {profileData.topContribution}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-sans text-lg font-bold text-[var(--text-primary)]">Achievements</h3>
                  <p className="mt-2 font-sans text-sm text-[var(--text-secondary)]">Verified milestones</p>
                </div>
                <Trophy size={18} className="text-[var(--accent)]" />
              </div>

              <div className="mt-5">
                {hasAchievements ? <TextList items={profileData.achievements} /> : <ReadOnlyEmpty />}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-sans text-lg font-bold text-[var(--text-primary)]">Competition History</h3>
                  {hasCompetitions && (
                    <p className="mt-2 font-sans text-sm text-[var(--text-secondary)]">
                      {`${profileData.competitions.length} mục đã thêm`}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                {hasCompetitions ? <TextList items={profileData.competitions} /> : <ReadOnlyEmpty />}
              </div>
            </section>
          </div>
        </div>
      </div>

      {activeForm === "profile" && (
        <div className="fixed inset-0 z-[200] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/80 px-4 py-6">
          <form
            onSubmit={saveProfile}
            className="github-profile-form w-full max-w-[320px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-5 pb-4 pt-0 text-[var(--text-primary)] shadow-2xl md:max-h-[calc(100dvh-32px)] md:overflow-y-auto"
          >
            <div className="mb-1 flex justify-center overflow-hidden pt-3">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg-secondary)] font-sans text-lg font-bold text-[var(--accent)]">
                {profileUser?.avatarUrl ? (
                  <img
                    src={profileUser.avatarUrl}
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials || "ND"
                )}
              </div>
            </div>

            {saveError && (
              <div className="mb-3 rounded-md border border-[var(--danger)] bg-[var(--bg-secondary)] px-3 py-2 font-sans text-xs text-[var(--danger)]">
                {saveError}
              </div>
            )}

            <div className="grid gap-2.5">
              <label className="grid gap-1">
                <span className={githubLabelClass}>Name</span>
                <input
                  value={profileDraft.displayName}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                  className={githubInputClass}
                />
              </label>

              <label className="grid gap-1">
                <span className={githubLabelClass}>Bio</span>
                <textarea
                  value={profileDraft.bio}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, bio: event.target.value }))}
                  rows={3}
                  className={githubTextareaClass}
                />
              </label>

              <p className="-mt-1 font-sans text-[11px] leading-4 text-[var(--text-secondary)]">
                You can @mention other users and organizations to link to them.
              </p>

              <label className="grid gap-1">
                <span className={githubLabelClass}>Pronouns</span>
                <select
                  value={profileDraft.pronouns}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, pronouns: event.target.value }))}
                  className={githubInputClass}
                >
                  <option>Don't specify</option>
                  <option>He/Him</option>
                  <option>She/Her</option>
                  <option>They/Them</option>
                </select>
              </label>

              <div className="grid gap-1.5">
                <IconInput
                  icon={Building2}
                  value={profileDraft.company}
                  onChange={(value) => setProfileDraft((prev) => ({ ...prev, company: value }))}
                  placeholder="Company"
                />

                <IconInput
                  icon={MapPin}
                  value={profileDraft.location}
                  onChange={(value) => setProfileDraft((prev) => ({ ...prev, location: value }))}
                  placeholder="Location"
                />

                <div className="grid grid-cols-[18px_minmax(0,1fr)] items-center gap-2">
                  <Clock size={17} strokeWidth={1.8} className="text-[var(--text-secondary)]" />
                  <label className="flex items-center gap-2 font-sans text-sm leading-5 text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={profileDraft.showLocalTime}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, showLocalTime: event.target.checked }))
                      }
                      className="h-3.5 w-3.5 rounded border-[var(--border)] bg-[var(--bg-primary)] accent-[var(--success)]"
                    />
                    Display current local time
                  </label>
                </div>

                <IconInput
                  icon={Mail}
                  value={profileDraft.contactEmail}
                  onChange={(value) => setProfileDraft((prev) => ({ ...prev, contactEmail: value }))}
                  placeholder="Email"
                  type="email"
                />

                <IconInput
                  icon={LinkIcon}
                  value={profileDraft.websiteUrl}
                  onChange={(value) => setProfileDraft((prev) => ({ ...prev, websiteUrl: value }))}
                  placeholder="Website"
                />
              </div>

              <div className="pt-1">
                <h4 className={githubLabelClass}>Social accounts</h4>
                <div className="mt-1.5 grid gap-1.5">
                  <div className="grid grid-cols-[18px_minmax(0,1fr)] items-center gap-2">
                    <span className="text-center font-sans text-xl font-black leading-none text-[var(--text-secondary)]">f</span>
                    <input
                      value={profileDraft.facebookUrl}
                      onChange={(event) => setProfileDraft((prev) => ({ ...prev, facebookUrl: event.target.value }))}
                      placeholder="Facebook profile URL"
                      className={githubInputClass}
                    />
                  </div>
                  {["socialLink2", "socialLink3", "socialLink4"].map((field, index) => (
                    <div key={field} className="grid grid-cols-[18px_minmax(0,1fr)] items-center gap-2">
                      <LinkIcon size={17} strokeWidth={1.8} className="text-[var(--text-secondary)]" />
                      <input
                        value={profileDraft[field]}
                        onChange={(event) => setProfileDraft((prev) => ({ ...prev, [field]: event.target.value }))}
                        placeholder={`Link to social profile ${index + 2}`}
                        className={githubInputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FormActions onCancel={closeForm} />
          </form>
        </div>
      )}

      {activeForm === "focus" && (
        <ModalShell title="Edit Experience & Focus" error={saveError} onClose={closeForm} onSubmit={saveFocus}>
          <div className="grid gap-4">
            <TextInput
              label="Headline"
              value={focusDraft.headline}
              onChange={(value) => setFocusDraft((prev) => ({ ...prev, headline: value }))}
              rows={2}
            />
            <TextInput
              label="Core stack"
              value={focusDraft.coreStack}
              onChange={(value) => setFocusDraft((prev) => ({ ...prev, coreStack: value }))}
              rows={3}
            />
            <TextInput
              label="Experience"
              value={focusDraft.experience}
              onChange={(value) => setFocusDraft((prev) => ({ ...prev, experience: value }))}
              rows={5}
            />
            <TextInput
              label="Top contribution"
              value={focusDraft.topContribution}
              onChange={(value) => setFocusDraft((prev) => ({ ...prev, topContribution: value }))}
            />
          </div>
          <FormActions onCancel={closeForm} />
        </ModalShell>
      )}
    </div>
  );
}
