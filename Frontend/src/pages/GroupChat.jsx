import { useOutletContext } from "react-router-dom";

export default function GroupChat() {
  const { user } = useOutletContext();
  
  return (
    <div className="w-full">
      <div className="sticky top-16 z-30 bg-black/60 backdrop-blur-md border-b border-white/[0.04] px-4 py-3">
        <h2 className="text-xl font-bold text-white/90">Group Chat</h2>
      </div>
      <div className="p-4 flex flex-col items-center justify-center h-[60vh] text-center">
        <h3 className="text-white/60 font-mono text-lg mb-2">Group Chat đang được xây dựng...</h3>
        <p className="text-white/40 text-sm">Chức năng nhắn tin nhóm sẽ sớm ra mắt.</p>
      </div>
    </div>
  );
}
