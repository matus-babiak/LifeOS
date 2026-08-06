import { SkeletonCard, SkeletonHeader, SkeletonLine } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonHeader />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="h-11 w-full rounded-xl" />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <div className="flex flex-col gap-3">
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="h-11 w-full rounded-xl" />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </div>
  );
}
