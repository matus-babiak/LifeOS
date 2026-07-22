import { SkeletonCard, SkeletonHeader, SkeletonLine } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonHeader />
      <SkeletonLine className="h-11 w-full rounded-xl" />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </div>
  );
}
