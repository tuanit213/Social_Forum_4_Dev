import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronsUpDown,
  GitFork,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Star,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  fetchTrendingRepos,
  getCreatedAfterFromPreset,
  sanitizeGithubTopic,
} from "@/services/githubApi";

const languageColors = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C#": "#178600",
  "C++": "#f34b7d",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
};

const createdOptions = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

const initialFilters = {
  sort: "stars",
  order: "desc",
  createdPreset: "week",
  language: "",
  topic: "",
  minStars: "",
  maxStars: "",
};

const filterControlClass =
  "h-9 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 font-mono text-xs text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]";

const formatCompactNumber = (value) => {
  const number = Number(value || 0);

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)}m`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000).toFixed(number >= 10_000 ? 0 : 1)}k`;
  }

  return String(number);
};

const readPositiveInteger = (value) => {
  if (value === "") return undefined;
  if (!/^\d+$/.test(String(value))) return null;
  return Number(value);
};

const validateFilters = (filters) => {
  const min = readPositiveInteger(filters.minStars);
  const max = readPositiveInteger(filters.maxStars);

  if (min === null || max === null) {
    return "Min stars va Max stars chi nhan so nguyen duong.";
  }

  if (min !== undefined && max !== undefined && min > max) {
    return "Min stars khong duoc lon hon Max stars.";
  }

  return "";
};

function useDebouncedValue(value, delay = 450) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

function RepoSkeleton() {
  return (
    <div className="border-b border-[var(--border)] p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-44 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-3 w-full animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="flex gap-3">
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--bg-elevated)]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--bg-elevated)]" />
          </div>
        </div>
        <div className="h-8 w-16 animate-pulse rounded-md bg-[var(--bg-elevated)]" />
      </div>
    </div>
  );
}

function RepoCard({ repo }) {
  const color = languageColors[repo.language] || "#8b949e";

  return (
    <article className="border-b border-[var(--border)] p-4 transition-colors last:border-b-0 hover:bg-[var(--bg-elevated)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="break-words font-mono text-[15px] font-bold text-[var(--accent)] hover:underline"
          >
            {repo.fullName}
          </a>

          <p className="mt-2 line-clamp-2 font-sans text-sm leading-relaxed text-[var(--text-secondary)]">
            {repo.description || "Repository chua co mo ta."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {repo.language || "Unknown"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star size={13} />
              {formatCompactNumber(repo.stars)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GitFork size={13} />
              {formatCompactNumber(repo.forks)}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled
          title="Can GitHub OAuth de star repo that"
          className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)]"
        >
          <Star size={13} />
          Star
        </button>
      </div>
    </article>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-[var(--danger)] bg-[var(--bg-secondary)] p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 shrink-0 text-[var(--danger)]" size={18} />
        <div className="min-w-0">
          <p className="font-sans text-sm font-semibold text-[var(--danger)]">Khong lay duoc repo trending</p>
          <p className="mt-1 font-sans text-sm leading-relaxed text-[var(--text-secondary)]">{message}</p>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-[var(--danger)] px-3 py-1.5 font-mono text-xs text-[var(--danger)] hover:brightness-110"
          >
            <RefreshCw size={13} />
            Thu lai
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterCollapse({ isOpen, onToggle, icon: Icon, label, summary, children }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg-primary)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <Icon size={14} className="shrink-0 text-[var(--accent)]" />
          <span className="truncate font-mono text-xs text-[var(--text-primary)]">{label}</span>
          {summary && <span className="truncate font-mono text-xs text-[var(--text-secondary)]">{summary}</span>}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--text-secondary)] transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="border-t border-[var(--border)] p-3">{children}</div>}
    </div>
  );
}

function FilterRadio({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 font-mono text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
      <input type="radio" checked={checked} onChange={onChange} className="accent-[var(--accent)]" />
      {label}
    </label>
  );
}

function FilterPanel({
  filters,
  onFilterChange,
  isOpen,
  onToggle,
  showSort,
  onToggleSort,
  showAdvanced,
  onToggleAdvanced,
  validationError,
}) {
  const sortLabel = filters.sort === "updated" ? "Updated" : filters.sort === "forks" ? "Forks" : "Stars";
  const orderLabel = filters.order === "desc" ? "High→Low" : "Low→High";
  const starsSummary =
    filters.minStars || filters.maxStars
      ? `${filters.minStars || "0"}..${filters.maxStars || "∞"}`
      : "";
  const activeFilterCount = [
    filters.sort !== initialFilters.sort || filters.order !== initialFilters.order,
    filters.createdPreset !== initialFilters.createdPreset,
    Boolean(filters.language),
    Boolean(filters.topic.trim()),
    Boolean(filters.minStars || filters.maxStars),
  ].filter(Boolean).length;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 font-mono text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
      >
        <SlidersHorizontal size={14} className="text-[var(--accent)]" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-semibold text-white">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown size={14} className={`text-[var(--text-secondary)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`grid transition-[grid-template-rows,margin-top] duration-300 ease-out ${
          isOpen ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className={`min-h-0 overflow-hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
            <div className="grid gap-3">
              <FilterCollapse
                isOpen={showSort}
                onToggle={onToggleSort}
                icon={ChevronsUpDown}
                label="Sort"
                summary={`${sortLabel}, ${orderLabel}`}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Sort by</p>
                    <div className="grid gap-1">
                      <FilterRadio
                        checked={filters.sort === "stars"}
                        onChange={() => onFilterChange("sort", "stars")}
                        label="Stars"
                      />
                      <FilterRadio
                        checked={filters.sort === "forks"}
                        onChange={() => onFilterChange("sort", "forks")}
                        label="Forks"
                      />
                      <FilterRadio
                        checked={filters.sort === "updated"}
                        onChange={() => onFilterChange("sort", "updated")}
                        label="Updated"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Order</p>
                    <div className="grid gap-1">
                      <FilterRadio
                        checked={filters.order === "desc"}
                        onChange={() => onFilterChange("order", "desc")}
                        label="High→Low"
                      />
                      <FilterRadio
                        checked={filters.order === "asc"}
                        onChange={() => onFilterChange("order", "asc")}
                        label="Low→High"
                      />
                    </div>
                  </div>
                </div>
              </FilterCollapse>

              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Created</span>
                  <div className="relative">
                    <select
                      value={filters.createdPreset}
                      onChange={(event) => onFilterChange("createdPreset", event.target.value)}
                      className={`${filterControlClass} w-full appearance-none pr-9`}
                    >
                      {createdOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                    />
                  </div>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Topic</span>
                <input
                  value={filters.topic}
                  onChange={(event) => onFilterChange("topic", event.target.value)}
                  placeholder="react, ai, cli, database..."
                  className={`${filterControlClass} w-full`}
                />
              </label>

              <FilterCollapse
                isOpen={showAdvanced}
                onToggle={onToggleAdvanced}
                icon={SlidersHorizontal}
                label="Advanced stars filter"
                summary={starsSummary}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Min stars</span>
                    <input
                      value={filters.minStars}
                      inputMode="numeric"
                      onChange={(event) => onFilterChange("minStars", event.target.value)}
                      placeholder="0"
                      className={filterControlClass}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Max stars</span>
                    <input
                      value={filters.maxStars}
                      inputMode="numeric"
                      onChange={(event) => onFilterChange("maxStars", event.target.value)}
                      placeholder="100000"
                      className={filterControlClass}
                    />
                  </label>
                </div>
              </FilterCollapse>

              {validationError && (
                <p className="rounded-md border border-[var(--danger)] bg-[var(--bg-elevated)] px-3 py-2 font-sans text-xs text-[var(--danger)]">
                  {validationError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrendingGithub() {
  const [searchParams] = useSearchParams();
  const selectedLanguage = searchParams.get("language") || "";
  const [filters, setFilters] = useState({ ...initialFilters, language: selectedLanguage });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedTopic = useDebouncedValue(filters.topic);
  const debouncedMinStars = useDebouncedValue(filters.minStars);
  const debouncedMaxStars = useDebouncedValue(filters.maxStars);
  const [repos, setRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hitSearchLimit, setHitSearchLimit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);

  useEffect(() => {
    setFilters((currentFilters) => ({ ...currentFilters, language: selectedLanguage }));
  }, [selectedLanguage]);

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      topic: sanitizeGithubTopic(debouncedTopic),
      minStars: debouncedMinStars,
      maxStars: debouncedMaxStars,
      createdAfter: getCreatedAfterFromPreset(filters.createdPreset),
    }),
    [debouncedMaxStars, debouncedMinStars, debouncedTopic, filters],
  );

  const validationError = useMemo(() => validateFilters(effectiveFilters), [effectiveFilters]);

  const languageLabel = effectiveFilters.language || "All languages";
  const createdLabel = createdOptions.find((option) => option.value === effectiveFilters.createdPreset)?.label || "This week";

  const loadRepos = useCallback(
    async ({ nextPage = 1, append = false } = {}) => {
      if (validationError) {
        setError("");
        setIsLoading(false);
        setIsLoadingMore(false);
        setRepos([]);
        setHasMore(false);
        return;
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      try {
        const data = await fetchTrendingRepos({
          page: nextPage,
          perPage: 10,
          sort: effectiveFilters.sort,
          order: effectiveFilters.order,
          createdAfter: effectiveFilters.createdAfter,
          language: effectiveFilters.language,
          topic: effectiveFilters.topic,
          minStars: effectiveFilters.minStars,
          maxStars: effectiveFilters.maxStars,
        });

        setRepos((currentRepos) => (append ? [...currentRepos, ...data.repos] : data.repos));
        setHasMore(data.hasMore);
        setHitSearchLimit(Boolean(data.hitSearchLimit));
        setPage(nextPage);
      } catch (loadError) {
        setError(loadError.message || "Khong ket noi duoc GitHub.");
        if (!append) {
          setRepos([]);
          setHasMore(false);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [effectiveFilters, validationError],
  );

  useEffect(() => {
    setRepos([]);
    setPage(1);
    setHasMore(true);
    setHitSearchLimit(false);
    loadRepos({ nextPage: 1, append: false });
  }, [loadRepos]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading || isLoadingMore || error || validationError) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadRepos({ nextPage: page + 1, append: true });
        }
      },
      { rootMargin: "260px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [error, hasMore, isLoading, isLoadingMore, loadRepos, page, validationError]);

  const skeletons = useMemo(() => Array.from({ length: 6 }, (_, index) => index), []);

  const updateFilter = (key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  };

  return (
    <div className="w-full">
      <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--accent)]">
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className="font-sans text-xl font-bold text-[var(--text-primary)]">GitHub Trending</h2>
            <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
              {languageLabel} · {createdLabel.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <FilterPanel
          filters={filters}
          onFilterChange={updateFilter}
          isOpen={isFilterPanelOpen}
          onToggle={() => setIsFilterPanelOpen((current) => !current)}
          showSort={showSort}
          onToggleSort={() => setShowSort((current) => !current)}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((current) => !current)}
          validationError={validationError}
        />

        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="grid grid-cols-[minmax(0,1fr)_96px] border-b border-[var(--border)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            <span>Repository</span>
            <span className="text-right">{effectiveFilters.sort}</span>
          </div>

          {isLoading ? (
            skeletons.map((item) => <RepoSkeleton key={item} />)
          ) : validationError ? (
            <div className="p-8 text-center">
              <p className="font-mono text-sm text-[var(--danger)]">{validationError}</p>
              <p className="mt-2 font-sans text-sm text-[var(--text-secondary)]">Sua bo loc stars de tiep tuc tim repo.</p>
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorState message={error} onRetry={() => loadRepos({ nextPage: 1, append: false })} />
            </div>
          ) : repos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-sm text-[var(--text-primary)]">Khong tim thay repo phu hop.</p>
              <p className="mt-2 font-sans text-sm text-[var(--text-secondary)]">Thu noi long bo loc hoac chon ngon ngu khac.</p>
            </div>
          ) : (
            repos.map((repo) => <RepoCard key={repo.fullName} repo={repo} />)
          )}
        </div>

        <div ref={sentinelRef} className="min-h-12 py-6 text-center">
          {isLoadingMore && (
            <span className="inline-flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
              <Loader2 size={14} className="animate-spin" />
              Dang tai them repo...
            </span>
          )}
          {!isLoading && !isLoadingMore && repos.length > 0 && hitSearchLimit && (
            <span className="font-mono text-xs text-[var(--text-secondary)]">Da hien thi toi da ket qua co the tai.</span>
          )}
          {!isLoading && !isLoadingMore && repos.length > 0 && !hasMore && !hitSearchLimit && (
            <span className="font-mono text-xs text-[var(--text-secondary)]">Da tai het danh sach repo.</span>
          )}
        </div>
      </div>
    </div>
  );
}
