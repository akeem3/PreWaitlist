export default function GonePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md px-6 text-center">
        <h1 className="mb-3 text-h2 text-foreground">
          This waitlist is no longer active.
        </h1>
        <p className="text-body text-muted-foreground">
          The founder has archived this waitlist. It is no longer accepting new
          signups.
        </p>
      </div>
    </div>
  );
}
