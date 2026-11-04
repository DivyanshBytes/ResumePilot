export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-blob absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-600/25" />
      <div className="animate-blob absolute -right-24 top-1/4 h-[26rem] w-[26rem] rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-600/20" style={{ animationDelay: '-5s' }} />
      <div className="animate-blob absolute -bottom-32 left-1/3 h-[24rem] w-[24rem] rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-600/20" style={{ animationDelay: '-9s' }} />
      <div className="bg-grid absolute inset-0" />
    </div>
  );
}