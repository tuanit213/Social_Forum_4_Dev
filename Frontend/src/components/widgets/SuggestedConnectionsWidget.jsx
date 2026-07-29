import { User } from "lucide-react";

export default function SuggestedConnectionsWidget() {
  const suggestedUsers = [
    { id: 1, name: "Alice Chen" },
    { id: 2, name: "Bob Smith" },
    { id: 3, name: "Carol Lee" },
  ];

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-5 border border-white/[0.04]">
      <h3 className="text-white/80 font-mono text-[14px] mb-4">Suggested Connections</h3>
      <div className="space-y-4">
        {suggestedUsers.map(user => (
          <div key={user.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50">
                <User size={16} />
              </div>
              <span className="text-white/70 font-mono text-[14px] group-hover:text-white transition-colors cursor-pointer">
                {user.name}
              </span>
            </div>
            <button className="text-[#00A2FF] font-mono text-[13px] hover:brightness-125 transition-all">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
