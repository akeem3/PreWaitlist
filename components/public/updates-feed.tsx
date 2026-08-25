interface Update {
  id: string;
  body: string;
  created_at: string;
}

interface UpdatesFeedProps {
  updates: Update[];
}

export function UpdatesFeed({ updates }: UpdatesFeedProps) {
  if (updates.length === 0) return null;

  return (
    <section className="mt-12 w-full max-w-lg">
      <h2 className="text-h4 text-foreground mb-4 text-center">Updates</h2>
      <div className="space-y-4">
        {updates.map((update) => (
          <div key={update.id} className="border-b border-border pb-4">
            <p className="text-body text-foreground">{update.body}</p>
            <time className="text-caption text-muted-foreground mt-1 block">
              {new Date(update.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        ))}
      </div>
    </section>
  );
}
