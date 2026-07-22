import { SkeletonCard, SkeletonHeader, SkeletonLine } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonHeader />
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-4 w-16" />
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-4 w-16" />
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={2} />
    </div>
  );
}
