export function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}••••@${domain}`;
  return `${local[0]}••••${local[local.length - 1]}@${domain}`;
}
