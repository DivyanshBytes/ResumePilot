const norm = (word) => word.toLowerCase().replace(/[^a-z0-9+#.]/g, '');

export default function DiffText({ before = '', after = '' }) {
  const known = new Set(before.split(/\s+/).map(norm).filter(Boolean));

  return (
    <>
      {after.split(/(\s+)/).map((part, i) =>
        !norm(part) || known.has(norm(part)) ? (
          part
        ) : (
          <mark key={i} className="rounded bg-brand-200/70 px-0.5 text-inherit dark:bg-brand-400/25">{part}</mark>
        )
      )}
    </>
  );
}