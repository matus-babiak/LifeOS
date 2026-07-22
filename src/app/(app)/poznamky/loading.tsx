import { SkeletonCard, SkeletonHeader, SkeletonLine } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonHeader />
      <SkeletonLine className="h-11 w-full rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </div>
  );
}
