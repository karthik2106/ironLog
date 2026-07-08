import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[240px_1fr]">
        <Skeleton className="hidden h-[calc(100vh-2rem)] md:block" />
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    </main>
  );
}
