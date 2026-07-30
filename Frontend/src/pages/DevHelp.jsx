export default function DevHelp() {
  return (
    <div className="w-full">
      <div className="sticky top-16 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Dev Help</h2>
      </div>
      <div className="p-4 flex flex-col items-center justify-center h-[60vh] text-center">
        <h3 className="text-[var(--text-primary)] font-mono text-lg mb-2">Hỏi đáp lập trình</h3>
        <p className="text-[var(--text-secondary)] text-sm">Bạn đang kẹt ở đâu? Hãy tạo câu hỏi tại đây.</p>
      </div>
    </div>
  );
}
