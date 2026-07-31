import { SkeletonCard, SkeletonHeader, SkeletonLine } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonHeader />
      <SkeletonLine className="h-24 w-full rounded-2xl" />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </div>
  );
}
