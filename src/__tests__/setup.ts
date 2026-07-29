import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Ensure navigator.clipboard exists in happy-dom for clipboard tests
if (
  typeof globalThis.navigator !== "undefined" &&
  !globalThis.navigator.clipboard
) {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: {
      writeText: async () => {},
      readText: async () => "",
    },
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
});
