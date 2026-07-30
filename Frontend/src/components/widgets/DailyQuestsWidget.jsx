export default function DailyQuestsWidget() {
  const quests = [
    {
      id: 1,
      title: "Post 1 câu hỏi",
      desc: "Chia sẻ vấn đề bạn đang gặp phải",
      xp: "+30 XP",
      actionText: "Đăng bài",
    },
    {
      id: 2,
      title: "Học 1 bài học bất kì",
      desc: "Duy trì nhịp học mỗi ngày",
      xp: "+30 XP",
      actionText: "Học ngay",
    },
    {
      id: 3,
      title: "Tham gia 1 Battle Code",
      desc: "Đối đầu và luyện kỹ năng thuật toán",
      xp: "+30 XP",
      actionText: "Vào battle",
    },
  ];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-[var(--text-primary)] font-mono font-bold text-[13px] uppercase tracking-wider mb-1">
          Nhiệm vụ hằng ngày
        </h3>
        <p className="text-[var(--text-secondary)] font-mono text-[11px]">
          Hoàn thành 3 nhiệm vụ để nhận +90 XP
        </p>
      </div>

      {/* Progress Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] mb-5">
        <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
        <span className="text-[var(--text-primary)] font-mono text-[11px] font-medium">
          0 / 3 hoàn thành
        </span>
      </div>

      {/* Quest Cards */}
      <div className="space-y-3">
        {quests.map(quest => (
          <div 
            key={quest.id} 
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--success) 100%)"
            }}
          >
            <div className="flex flex-col">
              <h4 className="text-white font-mono font-bold text-[14px] mb-1">
                {quest.title}
              </h4>
              <p className="text-white font-mono text-[11px] max-w-[160px] leading-tight">
                {quest.desc}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-white font-mono font-bold text-[11px]">
                {quest.xp}
              </span>
              <button className="px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--accent)] font-mono font-bold text-[10px] rounded hover:brightness-110 transition-colors">
                {quest.actionText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
