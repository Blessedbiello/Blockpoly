export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#9945ff] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400">Loading game state from chain...</p>
      </div>
    </div>
  );
}
