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

type OverwriteRegister = {
  beforeUpdate?: () => void;
  onClear?: () => void;
  onDispose?: () => void;
};

type InternalOverwriteOptions = OverwriteOptions & {
  register?: OverwriteRegister;
};

export class OverwriteHandle {
  lineCount = 0;
  lastRendered = "";
  suspended = false;
  disposed = false;
  visible = false;
  readonly options: InternalOverwriteOptions;

  constructor(options: InternalOverwriteOptions = {}) {
    this.options = options;
  }

  update(message: string): void {
    if (this.disposed) return;
    this.lastRendered = renderMultiline(
      message,
      this.options.firstPrefix ?? "",
      this.options.continuationPrefix ?? this.options.firstPrefix ?? "",
      this.options.colorizer,
      this.options.stripColorTags ?? false,
      this.options.styleTagAliases ?? false,
    );
    this.visible = this.lastRendered !== "";
    this.options.register?.beforeUpdate?.();
    if (this.suspended) {
      this.suspended = false;
    }
    if (this.lineCount > 0 && !this.suspended) {
      clearRenderedOutput(this);
    }
    if (!this.suspended) {
      this.options.stream?.write(this.lastRendered);
      this.lineCount = this.lastRendered.split("\n").length;
    }
  }

  clear(): void {
    clearRenderedOutput(this);
    this.visible = false;
    this.options.register?.onClear?.();
  }

  dispose(): void {
    if (this.disposed) return;
    clearRenderedOutput(this);
    this.visible = false;
    this.disposed = true;
    this.options.register?.onDispose?.();
  }
}

function clearRenderedOutput(handle: OverwriteHandle): void {
  // Clear from the current line upwards because overwrite output is rendered in-place.
  for (let index = 0; index < handle.lineCount; index += 1) {
    handle.options.stream?.write(cursor.to(0) + erase.line);
    if (index < handle.lineCount - 1) {
      handle.options.stream?.write(cursor.up(1));
    }
  }
  handle.lineCount = 0;
}

function suspendOverwrite(handle: OverwriteHandle): void {
  if (handle.disposed || handle.suspended || handle.lineCount === 0) return;
  clearRenderedOutput(handle);
  handle.suspended = true;
}

function resumeOverwrite(handle: OverwriteHandle): void {
  if (handle.disposed || !handle.suspended || handle.lastRendered === "") return;
  handle.options.stream?.write(handle.lastRendered);
  handle.lineCount = handle.lastRendered.split("\n").length;
  handle.suspended = false;
}

export function createControlledOverwrite(
  options: OverwriteOptions,
  register: OverwriteRegister,
): {
  handle: OverwriteHandle;
  suspend: () => void;
  resume: () => void;
  isVisible: () => boolean;
} {
  const handle = new OverwriteHandle({
    ...options,
    register,
  });

  return {
    handle,
    suspend: () => suspendOverwrite(handle),
    resume: () => resumeOverwrite(handle),
    isVisible: () => handle.visible,
  };
}
