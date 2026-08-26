interface Update {
  id: string;
  body: string;
  created_at: string;
}

interface LatestUpdateCardProps {
  update: Update;
}

export function LatestUpdateCard({ update }: LatestUpdateCardProps) {
  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground mb-1">Latest update</p>
      <p className="text-body text-foreground">{update.body}</p>
      <time className="text-caption text-muted-foreground mt-2 block">
        {new Date(update.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
    </div>
  );
}
