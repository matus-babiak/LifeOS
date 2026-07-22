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

/** Kostra pre miesto, kde sa dopisuje AI mentor (streamované cez Suspense). */
export function MentorSkeleton() {
  return (
    <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
      <div className="flex flex-col gap-2">
        <SkeletonLine className="h-3.5 w-full bg-accent/20" />
        <SkeletonLine className="h-3.5 w-5/6 bg-accent/20" />
        <SkeletonLine className="h-3.5 w-2/3 bg-accent/20" />
      </div>
    </section>
  );
}

/** Menšia kostra pre AI reframe vnorený v položke zoznamu. */
export function ReframeSkeleton() {
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent-soft p-3">
      <SkeletonLine className="h-3 w-full bg-accent/20" />
      <SkeletonLine className="h-3 w-4/5 bg-accent/20" />
    </div>
  );
}
