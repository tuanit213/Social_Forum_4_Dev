const GITHUB_SEARCH_URL = "https://api.github.com/search/repositories";
const REQUEST_TIMEOUT_MS = 12_000;
export const GITHUB_SEARCH_RESULT_LIMIT = 1000;

const mapGithubRepo = (repo) => ({
  fullName: repo.full_name,
  description: repo.description || "",
  stars: Number(repo.stargazers_count || 0),
  forks: Number(repo.forks_count || 0),
  language: repo.language || null,
  url: repo.html_url,
});

export const toGithubDate = (date) => date.toISOString().slice(0, 10);

export const getCreatedAfterFromPreset = (preset = "week") => {
  const daysByPreset = {
    today: 1,
    week: 7,
    month: 30,
    year: 365,
  };

  const date = new Date();
  date.setUTCDate(date.getUTCDate() - (daysByPreset[preset] || daysByPreset.week));
  return toGithubDate(date);
};

export const sanitizeGithubTopic = (value = "") =>
  value
    .trim()
    .replace(/^topic:/i, "")
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .slice(0, 60);

const normalizePositiveInteger = (value) => {
  if (value === undefined || value === null || value === "") return undefined;

  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return undefined;
  return number;
};

export const buildTrendingRepoQuery = ({
  createdAfter = getCreatedAfterFromPreset("week"),
  language = "",
  topic = "",
  minStars,
  maxStars,
} = {}) => {
  const parts = ["archived:false", `created:>${createdAfter || getCreatedAfterFromPreset("week")}`];
  const cleanedTopic = sanitizeGithubTopic(topic);
  const min = normalizePositiveInteger(minStars);
  const max = normalizePositiveInteger(maxStars);

  if (language) {
    parts.push(`language:${language}`);
  }

  if (cleanedTopic) {
    parts.push(`topic:${cleanedTopic}`);
  }

  if (min !== undefined && max !== undefined) {
    parts.push(`stars:${min}..${max}`);
  } else if (min !== undefined) {
    parts.push(`stars:>${min}`);
  } else if (max !== undefined) {
    parts.push(`stars:<${max}`);
  }

  return parts.join(" ");
};

const parseRateLimitMessage = (response, fallbackMessage) => {
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (!Number.isFinite(reset)) return fallbackMessage;

  const retryAt = new Date(reset * 1000).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `GitHub dang gioi han luot truy cap. Thu lai sau ${retryAt}.`;
};

export const fetchTrendingRepos = async ({
  page = 1,
  perPage = 10,
  sort = "stars",
  order = "desc",
  createdAfter,
  language,
  topic,
  minStars,
  maxStars,
} = {}) => {
  const safePerPage = Math.min(Math.max(Number(perPage) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  if (safePage * safePerPage > GITHUB_SEARCH_RESULT_LIMIT) {
    return {
      repos: [],
      totalCount: GITHUB_SEARCH_RESULT_LIMIT,
      hasMore: false,
      hitSearchLimit: true,
    };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const params = new URLSearchParams({
    q: buildTrendingRepoQuery({
      createdAfter,
      language,
      topic,
      minStars,
      maxStars,
    }),
    sort,
    order,
    per_page: String(safePerPage),
    page: String(safePage),
  });

  try {
    const response = await fetch(`${GITHUB_SEARCH_URL}?${params.toString()}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        response.status === 403
          ? parseRateLimitMessage(response, payload.message || "GitHub dang tam thoi gioi han luot truy cap.")
          : payload.message || "Khong lay duoc danh sach repo GitHub.";

      throw new Error(message);
    }

    const totalCount = Math.min(Number(payload.total_count || 0), GITHUB_SEARCH_RESULT_LIMIT);
    const items = Array.isArray(payload.items) ? payload.items : [];

    return {
      repos: items.map(mapGithubRepo),
      totalCount,
      hasMore: items.length === safePerPage && safePage * safePerPage < totalCount,
      hitSearchLimit: safePage * safePerPage >= GITHUB_SEARCH_RESULT_LIMIT,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Ket noi GitHub qua thoi gian. Thu lai sau.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};
