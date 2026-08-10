import type {RuleEntry, RuleOptions, Severity, SeverityResolver} from '../types';
import type {StrictnessChannel} from './types';

interface PendingRule {
  /** Version this rule was introduced in. */
  since: string;
  /** Major version in which it is promoted to its intended severity. */
  promoteIn: string;
}

/**
 * Rules awaiting promotion. Adding an entry here is how a new rule ships
 * without breaking builds; removing one is a breaking change and belongs in a
 * major release.
 */
const PENDING_RULES: Record<string, PendingRule> = {};

const isPending = ((rule: string): boolean =>
  Object.hasOwn(PENDING_RULES, rule));

const asSeverity = ((value: unknown): (Severity | null) => {
  switch(value) {
    case 0:
    case 'off': {
      return 'off';
    }
    case 1:
    case 'warn': {
      return 'warn';
    }
    case 2:
    case 'error': {
      return 'error';
    }
  }

  return null;
});

/**
 * `error` becomes `warn`; `off` and `warn` are unchanged. Options are
 * preserved.
 */
const downgrade = ((entry: RuleEntry): RuleEntry => {
  if(Array.isArray(entry)) {
    const [
      level,
      ...options
    ] = entry;

    return ((asSeverity(level) === 'error')
      ? [
          'warn',
          ...options
        ]
      : entry);
  }

  return ((asSeverity(entry) === 'error')
    ? 'warn'
    : entry);
});

const createSeverityResolver = ((channel: StrictnessChannel): SeverityResolver =>
  ((rule, intended) => (((channel === 'next') || !isPending(rule)) ? intended : downgrade(intended))));

/**
 * Applied by every config module to its rule record. Keeping this in one helper
 * means a module author cannot forget the channel logic for an individual rule.
 */
const applySeverity = ((
  severity: SeverityResolver,
  rules: Partial<RuleOptions>
): Partial<RuleOptions> =>
  Object.fromEntries(Object.entries(rules).map(([
    rule,
    entry
  ]) => [
    rule,
    severity(rule, (entry as RuleEntry))
  ])));

export type {
  PendingRule
};
export {
  PENDING_RULES,
  isPending,
  asSeverity,
  downgrade,
  createSeverityResolver,
  applySeverity
};
