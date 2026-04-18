import { cursor, erase } from "sisteransi";
import { renderMultiline } from "./utils.ts";
import type { Colorizer } from "./color.ts";
import type { WriteStream } from "./types.ts";

export type OverwriteOptions = {
  stream?: WriteStream;
  colorizer?: Colorizer;
  firstPrefix?: string;
  continuationPrefix?: string;
  stripColorTags?: boolean;
  styleTagAliases?: boolean;
};

export class OverwriteHandle {
  private lineCount = 0;
  private readonly options: OverwriteOptions;

  constructor(options: OverwriteOptions = {}) {
    this.options = options;
  }

  update(message: string): void {
    const rendered = renderMultiline(
      message,
      this.options.firstPrefix ?? "",
      this.options.continuationPrefix ?? this.options.firstPrefix ?? "",
      this.options.colorizer,
      this.options.stripColorTags ?? false,
      this.options.styleTagAliases ?? false,
    );
    if (this.lineCount > 0) {
      this.clear();
    }
    this.options.stream?.write(rendered);
    this.lineCount = rendered.split("\n").length;
  }

  clear(): void {
    // Clear from the current line upwards because overwrite output is rendered in-place.
    for (let index = 0; index < this.lineCount; index += 1) {
      this.options.stream?.write(cursor.to(0) + erase.line);
      if (index < this.lineCount - 1) {
        this.options.stream?.write(cursor.up(1));
      }
    }
    this.lineCount = 0;
  }
}
