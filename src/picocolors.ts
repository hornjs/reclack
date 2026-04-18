import { createColors } from "picocolors";
import type { Formatter } from "picocolors/types.js";
import type { Colorizer } from "./lib/color.ts";

export function createPico(enabled: boolean): Colorizer {
  const cached = new Map<string, Formatter>();

  const colors = createColors(enabled);
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "function") {
      cached.set(key, value);
    }
  }

  return {
    wrap: (name: string, input: string | number | null | undefined) => {
      return cached.get(name)?.(input) ?? input?.toString() ?? "";
    },
    is: (name: string) => {
      return cached.has(name);
    },
  };
}
