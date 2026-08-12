import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "@/components/post/PostCard";
import UserCard from "@/components/user/UserCard";
import api from "@/services/authService";
import { Search as SearchIcon, Loader2 } from "lucide-react";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'post' | 'user'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ posts: [], users: [] });

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setResults({ posts: [], users: [] });
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&type=${activeTab}&limit=20`);
        if (res.data.success) {
          setResults({
            posts: res.data.data.posts || [],
            users: res.data.data.users || [],
          });
        }
      } catch (error) {
        console.error("Lỗi khi fetch search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, activeTab]);

  return (
    <div className="flex-1 w-full flex flex-col p-6">
      <div className="mb-6 pb-6 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <SearchIcon className="text-[var(--accent)]" />
          Kết quả tìm kiếm cho "{query}"
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Khám phá bài viết và người dùng liên quan đến từ khóa này
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[var(--border)] mb-6">
        {[
          { id: "all", label: "Tất cả" },
          { id: "post", label: "Bài viết" },
          { id: "user", label: "Người dùng" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
          <Loader2 size={32} className="animate-spin mb-4 text-[var(--accent)]" />
          <p>Đang tìm kiếm...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 pb-20">
          {!query.trim() ? (
            <div className="text-center py-10 text-[var(--text-secondary)]">
              Vui lòng nhập từ khóa để tìm kiếm.
            </div>
          ) : (
            <>
              {/* Users */}
              {(activeTab === "all" || activeTab === "user") && results.users.length > 0 && (
                <div>
                  {activeTab === "all" && (
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Người dùng</h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.users.map((user) => (
                      <UserCard key={user._id || user.id} user={user} />
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {(activeTab === "all" || activeTab === "post") && results.posts.length > 0 && (
                <div>
                  {activeTab === "all" && (
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 mt-6">Bài viết</h2>
                  )}
                  <div className="flex flex-col gap-4">
                    {results.posts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.users.length === 0 && results.posts.length === 0 && (
                <div className="text-center py-20 text-[var(--text-secondary)]">
                  Không tìm thấy kết quả nào phù hợp với từ khóa "{query}".
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
