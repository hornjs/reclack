import { issueHasType } from "./utils.ts";
import type { State } from "./state.ts";
import type { CollectedIssue } from "./types.ts";

export class Issuer<T extends CollectedIssue> {
  private readonly state: State<T>;

  constructor(state: State<T>) {
    this.state = state;
  }

  get issues(): T[] {
    return this.state.issues;
  }

  get hasErrors(): boolean {
    return this.issues.some((issue) => issueHasType(issue, "error"));
  }

  get hasWarnings(): boolean {
    return this.issues.some((issue) => issueHasType(issue, "warning"));
  }
}
