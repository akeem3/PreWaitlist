export default function OnboardingLoading() {
  return (
    <div className="flex w-full flex-col">
      {/* Progress dots */}
      <div className="mb-8 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>

      {/* Step label + heading */}
      <div className="mb-2 h-3 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mb-3 h-8 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mb-8 h-4 w-1/2 animate-pulse rounded bg-muted" />

      {/* Form fields */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-8 h-14 w-full animate-pulse rounded-md bg-muted" />

      {/* Back link */}
      <div className="mt-4 h-4 w-16 animate-pulse rounded bg-muted" />
    </div>
  );
}
