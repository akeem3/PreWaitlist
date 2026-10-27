const MAX_HEADLINE_LENGTH = 200;
const MAX_SUBHEADLINE_LENGTH = 500;
const MAX_CTA_TEXT_LENGTH = 100;
const MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024;
const MAX_LOGO_DATA_URL_LENGTH = Math.ceil(MAX_LOGO_FILE_BYTES / 3) * 4 + 32;
const MAX_SIGNUP_COUNTER_THRESHOLD = 1_000_000;

const LOGO_DATA_URL_PATTERN =
  /^data:image\/(?:png|svg\+xml);base64,([A-Za-z0-9+/]+={0,2})$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function validateWaitlistFields(
  fields: Record<string, unknown>
): string | null {
  if (
    fields.template !== undefined &&
    fields.template !== "minimal" &&
    fields.template !== "bold" &&
    fields.template !== "dark"
  ) {
    return "Template must be minimal, bold, or dark.";
  }

  if (
    typeof fields.headline === "string" &&
    fields.headline.length > MAX_HEADLINE_LENGTH
  ) {
    return `Headline must be ${MAX_HEADLINE_LENGTH} characters or fewer.`;
  }

  if (
    typeof fields.headline !== "undefined" &&
    fields.headline !== null &&
    typeof fields.headline !== "string"
  ) {
    return "Headline must be text.";
  }

  if (
    typeof fields.subheadline === "string" &&
    fields.subheadline.length > MAX_SUBHEADLINE_LENGTH
  ) {
    return `Sub-headline must be ${MAX_SUBHEADLINE_LENGTH} characters or fewer.`;
  }

  if (
    typeof fields.subheadline !== "undefined" &&
    fields.subheadline !== null &&
    typeof fields.subheadline !== "string"
  ) {
    return "Sub-headline must be text.";
  }

  if (
    typeof fields.cta_text === "string" &&
    fields.cta_text.length > MAX_CTA_TEXT_LENGTH
  ) {
    return `Button text must be ${MAX_CTA_TEXT_LENGTH} characters or fewer.`;
  }

  if (
    typeof fields.cta_text !== "undefined" &&
    fields.cta_text !== null &&
    typeof fields.cta_text !== "string"
  ) {
    return "Button text must be text.";
  }

  if (
    fields.brand_color !== undefined &&
    fields.brand_color !== null &&
    fields.brand_color !== "" &&
    (typeof fields.brand_color !== "string" ||
      !HEX_COLOR_PATTERN.test(fields.brand_color))
  ) {
    return "Enter a valid hex color (e.g. #0F7A5E)";
  }

  if (fields.logo_url !== undefined && fields.logo_url !== null) {
    if (fields.logo_url !== "" && typeof fields.logo_url !== "string") {
      return "Invalid logo. Use a PNG or SVG file under 2MB.";
    }

    if (typeof fields.logo_url === "string" && fields.logo_url !== "") {
      if (fields.logo_url.length > MAX_LOGO_DATA_URL_LENGTH) {
        return "File must be under 2MB";
      }

      const match = LOGO_DATA_URL_PATTERN.exec(fields.logo_url);
      if (!match || match[1].length % 4 !== 0) {
        return "Only PNG and SVG files are allowed";
      }
    }
  }

  if (
    fields.qualification_enabled !== undefined &&
    typeof fields.qualification_enabled !== "boolean"
  ) {
    return "qualification_enabled must be true or false";
  }

  if (
    fields.signup_counter_enabled !== undefined &&
    typeof fields.signup_counter_enabled !== "boolean"
  ) {
    return "signup_counter_enabled must be true or false";
  }

  if (
    fields.signup_counter_threshold !== undefined &&
    (typeof fields.signup_counter_threshold !== "number" ||
      !Number.isInteger(fields.signup_counter_threshold) ||
      fields.signup_counter_threshold < 1)
  ) {
    return "Threshold must be a whole number greater than 0";
  }

  if (
    typeof fields.signup_counter_threshold === "number" &&
    fields.signup_counter_threshold > MAX_SIGNUP_COUNTER_THRESHOLD
  ) {
    return `Threshold must be ${MAX_SIGNUP_COUNTER_THRESHOLD.toLocaleString("en-US")} or fewer.`;
  }

  return null;
}
