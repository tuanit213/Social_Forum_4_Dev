import { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  Award,
  BookOpenCheck,
  Building2,
  Clock,
  Flame,
  GraduationCap,
  LinkIcon,
  MapPin,
  Mail,
  MessagesSquare,
  TrendingUp,
  Trophy,
  UserPlus,
  UserCheck,
} from "lucide-react";
import api from "@/services/authService";

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

const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(value);

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
          <p className="mt-2 truncate font-sans text-sm font-medium leading-snug tracking-normal text-[var(--text-secondary)]">
            {label}
          </p>
        </div>
      </div>
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

export default function UserProfile() {
  const { username } = useParams();
  const { user: currentUser } = useOutletContext();
  const [profileUser, setProfileUser] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [profileData, setProfileData] = useState(emptyDashboard);
  const [followInfo, setFollowInfo] = useState({ isFollowing: false, followersCount: 0, followingCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);

      try {
        const res = await api.get(`/users/profile/${username}`);
        if (cancelled) return;

        if (res.data.success) {
          const data = res.data.data;
          const nextUser = data.user;
          const nextDashboard = { ...emptyDashboard, ...(data.profileDashboard || {}) };

          setProfileUser(nextUser);
          setStats({ ...emptyStats, ...(data.stats || {}) });
          setFollowInfo(data.followInfo || { isFollowing: false, followersCount: 0, followingCount: 0 });
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
        }
      } catch (error) {
        if (cancelled) return;
        console.error(error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const toggleFollow = async () => {
    if (isTogglingFollow) return;
    setIsTogglingFollow(true);
    try {
      const res = await api.put(`/users/profile/${username}/follow`);
      if (res.data.success) {
        setFollowInfo(prev => ({
          ...prev,
          isFollowing: res.data.isFollowing,
          followersCount: res.data.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const metrics = useMemo(() => {
    return [
      {
        icon: TrendingUp,
        value: formatNumber(stats.globalRank || 0),
        label: "Global Rank",
        tone: "border-[#00a2ff]/30 bg-[#00a2ff]/10 text-[#00a2ff]",
      },
      {
        icon: Award,
        value: formatNumber(stats.experienceYears || 0),
        label: "Years Exp",
        tone: "border-[#eab308]/30 bg-[#eab308]/10 text-[#eab308]",
      },
      {
        icon: GraduationCap,
        value: formatNumber(stats.courseCount || 0),
        label: "Courses",
        tone: "border-[#ec4899]/30 bg-[#ec4899]/10 text-[#ec4899]",
      },
      {
        icon: BookOpenCheck,
        value: formatNumber(stats.postCount || 0),
        label: "Posts",
        tone: "border-[#a855f7]/30 bg-[#a855f7]/10 text-[#a855f7]",
      },
      {
        icon: Flame,
        value: formatNumber(stats.currentStreak || 0),
        label: "Streak",
        tone: "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]",
      },
      {
        icon: Trophy,
        value: formatNumber(stats.contestCount || 0),
        label: "Contests",
        tone: "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]",
      },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)]">
        <div className="text-[var(--text-secondary)]">Không tìm thấy người dùng</div>
      </div>
    );
  }

  const isCurrentUser = currentUser?.Username === username;

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--border)] sm:h-24 sm:w-24 bg-[var(--bg-primary)] flex items-center justify-center">
              {profileUser?.avatarUrl ? (
                <img
                  src={profileUser.avatarUrl}
                  alt={profileUser.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-[var(--text-secondary)]">
                  {profileUser?.displayName?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {profileData.displayName || profileUser?.displayName}
              </h1>
              <p className="mt-1 font-sans text-base font-medium text-[var(--text-secondary)]">
                @{profileUser?.username}
              </p>
              <div className="mt-2 flex gap-4 text-sm text-[var(--text-secondary)]">
                <span><strong className="text-[var(--text-primary)]">{followInfo.followersCount}</strong> Followers</span>
                <span><strong className="text-[var(--text-primary)]">{followInfo.followingCount}</strong> Following</span>
              </div>
            </div>
          </div>
          
          {!isCurrentUser && (
            <button 
              onClick={toggleFollow}
              disabled={isTogglingFollow}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${
                followInfo.isFollowing 
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-primary)]" 
                  : "bg-[#00a2ff] text-white hover:bg-[#0088cc]"
              }`}
            >
              {followInfo.isFollowing ? (
                <>
                  <UserCheck size={18} />
                  <span>Đang theo dõi</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Theo dõi</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-sans text-lg font-bold text-[var(--text-primary)]">Overview</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Headline
                  </h3>
                  {profileData.headline ? (
                    <p className="font-sans text-base leading-relaxed text-[var(--text-primary)]">
                      {profileData.headline}
                    </p>
                  ) : (
                    <ReadOnlyEmpty />
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Core Stack
                  </h3>
                  {profileData.coreStack?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.coreStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 font-sans text-sm font-medium text-[var(--text-primary)] shadow-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <ReadOnlyEmpty />
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Experience
                  </h3>
                  {profileData.experience ? (
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-4">
                      <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text-primary)]">
                        {profileData.experience}
                      </p>
                    </div>
                  ) : (
                    <ReadOnlyEmpty />
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Top Contribution
                  </h3>
                  {profileData.topContribution ? (
                    <p className="font-sans text-base font-medium text-[var(--accent)]">
                      {profileData.topContribution}
                    </p>
                  ) : (
                    <ReadOnlyEmpty />
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-sans text-lg font-bold text-[var(--text-primary)]">Details</h2>
              </div>
              <div className="space-y-5">
                {[
                  { icon: Mail, label: "Email", value: profileData.contactEmail },
                  { icon: Building2, label: "Company", value: profileData.company },
                  { icon: MapPin, label: "Location", value: profileData.location },
                  { icon: Clock, label: "Local Time", value: profileData.showLocalTime ? "Visible" : "" },
                  { icon: MessagesSquare, label: "Pronouns", value: profileData.pronouns },
                  {
                    icon: LinkIcon,
                    label: "Website",
                    value: profileData.websiteUrl,
                    isLink: true,
                  },
                ].map((item, index) => {
                  if (!item.value) return null;
                  return (
                    <div key={`${item.label}-${index}`} className="flex items-start gap-3">
                      <item.icon size={18} className="mt-0.5 shrink-0 text-[var(--text-secondary)]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-xs font-semibold uppercase text-[var(--text-secondary)]">
                          {item.label}
                        </p>
                        {item.isLink ? (
                          <a
                            href={item.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate font-sans text-sm font-medium text-[var(--accent)] hover:underline"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="break-words font-sans text-sm font-medium text-[var(--text-primary)]">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
