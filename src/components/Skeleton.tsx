export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-line ${className}`} />;
}

export function SkeletonCard({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-1/3", "w-2/3", "w-1/2", "w-3/4"];
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} className={`h-3.5 ${widths[i % widths.length]}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHeader({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <header className="flex flex-col gap-2">
      <SkeletonLine className="h-7 w-40" />
      {withSubtitle && <SkeletonLine className="h-3.5 w-64" />}
    </header>
  );
}
