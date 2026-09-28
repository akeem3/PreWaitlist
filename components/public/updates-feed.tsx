interface Update {
  id: string;
  body: string;
  created_at: string;
}

type Template = "minimal" | "bold" | "dark";

interface LatestUpdateCardProps {
  update: Update;
  template?: Template;
}

export function LatestUpdateCard({
  update,
  template = "minimal",
}: LatestUpdateCardProps) {
  const isDark = template === "dark";

  return (
    <div
      className={`rounded-[var(--card-radius)] border p-4 ${
        isDark
          ? "border-dark-template-border bg-dark-template-bg"
          : "border-border bg-card"
      }`}
    >
      <p
        className={`text-caption mb-1 ${isDark ? "text-dark-template-muted" : "text-muted-foreground"}`}
      >
        Latest update
      </p>
      <p
        className={`text-body ${isDark ? "text-dark-template-text" : "text-foreground"}`}
      >
        {update.body}
      </p>
      <time
        className={`text-caption mt-2 block ${isDark ? "text-dark-template-secondary" : "text-muted-foreground"}`}
      >
        {new Date(update.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
    </div>
  );
}
