import { User } from "lucide-react";

export default function SuggestedConnectionsWidget() {
  const suggestedUsers = [
    { id: 1, name: "Alice Chen" },
    { id: 2, name: "Bob Smith" },
    { id: 3, name: "Carol Lee" },
  ];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
      <h3 className="text-[var(--text-primary)] font-mono text-[14px] mb-4">Suggested Connections</h3>
      <div className="space-y-4">
        {suggestedUsers.map(user => (
          <div key={user.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]">
                <User size={16} />
              </div>
              <span className="text-[var(--text-secondary)] font-mono text-[14px] group-hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                {user.name}
              </span>
            </div>
            <button className="text-[var(--accent)] font-mono text-[13px] hover:brightness-125 transition-all">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
