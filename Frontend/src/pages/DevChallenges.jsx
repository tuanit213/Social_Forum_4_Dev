import { useOutletContext } from "react-router-dom";

export default function DevChallenges() {
  const { user } = useOutletContext();
  
  return (
    <div className="w-full">
      <div className="sticky top-16 z-30 bg-black/60 backdrop-blur-md border-b border-white/[0.04] px-4 py-3">
        <h2 className="text-xl font-bold text-white/90">Dev Challenges</h2>
      </div>
      <div className="p-4 flex flex-col items-center justify-center h-[60vh] text-center">
        <h3 className="text-white/60 font-mono text-lg mb-2">Thử thách lập trình</h3>
        <p className="text-white/40 text-sm">Cập nhật và hoàn thành các thử thách mỗi tuần.</p>
      </div>
    </div>
  );
}
