import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonLine className="h-4 w-24" />
      <header className="flex flex-col gap-2">
        <SkeletonLine className="h-7 w-56" />
        <SkeletonLine className="h-3.5 w-32" />
      </header>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  );
}
