import { CardSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 p-1">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
