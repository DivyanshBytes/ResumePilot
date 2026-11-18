export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-dots absolute inset-x-0 top-0 h-[70vh]" />
    </div>
  );
}