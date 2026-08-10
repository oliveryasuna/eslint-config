import type {RuleOptions} from '../types';

interface Overlay {
  /** Stable identifier. Appears in the emitted config name and in RULES.md. */
  id: string;
  files: string[];
  ignores?: string[];
  rules: Partial<RuleOptions>;
  /**
   * Required. An overlay without a stated reason is indistinguishable from an
   * accident, and this is the field that makes the inventory reviewable.
   */
  why: string;
}

export type {
  Overlay
};
