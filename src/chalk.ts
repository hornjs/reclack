import { Chalk } from "chalk";
import type { ChalkInstance } from "chalk";
import type { Colorizer } from "./lib/color.ts";

const STYLE_NAMES = [
  "reset",
  "bold",
  "dim",
  "italic",
  "underline",
  "overline",
  "inverse",
  "hidden",
  "strikethrough",
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "gray",
  "grey",
  "blackBright",
  "redBright",
  "greenBright",
  "yellowBright",
  "blueBright",
  "magentaBright",
  "cyanBright",
  "whiteBright",
  "bgBlack",
  "bgRed",
  "bgGreen",
  "bgYellow",
  "bgBlue",
  "bgMagenta",
  "bgCyan",
  "bgWhite",
  "bgGray",
  "bgGrey",
  "bgBlackBright",
  "bgRedBright",
  "bgGreenBright",
  "bgYellowBright",
  "bgBlueBright",
  "bgMagentaBright",
  "bgCyanBright",
  "bgWhiteBright",
] as const;

export function createChalk(enabled: boolean): Colorizer {
  const chalk = new Chalk({ level: enabled ? 1 : 0 });
  const cached = new Map<string, ChalkInstance>();

  for (const key of STYLE_NAMES) {
    const value = chalk[key];
    if (typeof value === "function") {
      cached.set(key, value);
    }
  }

  return {
    wrap: (name, input) => cached.get(name)?.(input) ?? input?.toString() ?? "",
    is: (name) => cached.has(name),
  };
}
