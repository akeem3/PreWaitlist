export const PHONE_MODES = ["off", "optional", "required"] as const;

export type PhoneMode = (typeof PHONE_MODES)[number];

export function isPhoneMode(value: unknown): value is PhoneMode {
  return (
    typeof value === "string" &&
    (PHONE_MODES as readonly string[]).includes(value)
  );
}

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export function normalizePhoneInput(raw: string): string | null {
  const compact = raw.replace(/[^\d+]/g, "");
  if (!E164_PATTERN.test(compact)) return null;
  return compact;
}

export function buildPhone(dial: string, national: string): string | null {
  const nationalDigits = national.replace(/[^\d+]/g, "");
  if (nationalDigits.startsWith("+")) {
    return normalizePhoneInput(nationalDigits);
  }

  let dialCode = dial.replace(/[^\d+]/g, "");
  if (dialCode.length <= 1) {
    dialCode = "+1";
  } else if (!dialCode.startsWith("+")) {
    dialCode = `+${dialCode}`;
  }

  if (nationalDigits.startsWith("00")) {
    return normalizePhoneInput(`+${nationalDigits.slice(2)}`);
  }

  return normalizePhoneInput(`${dialCode}${nationalDigits}`);
}
