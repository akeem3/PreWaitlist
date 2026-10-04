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

  const surface = isDark
    ? "border-dark-template-border bg-dark-template-bg"
    : template === "bold"
      ? "border-2 border-foreground bg-card"
      : "border-border bg-card";
  const labelColor = isDark
    ? "text-dark-template-muted"
    : "text-muted-foreground";
  const bodyColor = isDark ? "text-dark-template-text" : "text-foreground";
  const timeColor = isDark
    ? "text-dark-template-secondary"
    : "text-muted-foreground";

  return (
    <div
      className={`rounded-(--card-radius) border p-5 text-center ${surface}`}
    >
      <p className={`text-overline mb-2 ${labelColor}`}>Latest update</p>
      <p className={`text-base font-medium text-balance ${bodyColor}`}>
        {update.body}
      </p>
      <time className={`mt-2 block text-xs font-normal ${timeColor}`}>
        {new Date(update.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
    </div>
  );
}
