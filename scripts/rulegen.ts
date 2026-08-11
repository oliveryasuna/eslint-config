import type {PresetName, Severity} from '../src';
import {COMMON_OVERLAYS, RULE_NOTES} from '../src';
import {buildInventories, compareRules, type PresetInventory} from './_resolve';
import {banner, fromRoot, type GeneratedFile, isEntrypoint, runAsScript} from './_shared';

const OUTPUT: string = fromRoot('RULES.md');

const SEVERITY_CELL: Record<Severity, string> = {
  error: '`error`',
  warn: '`warn`',
  off: '—'
};

const escapeCell = ((value: string): string => value.replace(/\|/g, '\\|').replace(/\n/g, ' '));

const table = ((
  headers: string[],
  rows: string[][]
): string[] => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map(row => `| ${row.join(' | ')} |`)
]);

interface MatrixRow {
  rule: string;
  module: string;
  scoped: boolean;
  severities: Record<PresetName, Severity>;
}

const buildMatrix = ((inventories: PresetInventory[]): MatrixRow[] => {
  const rows = (new Map<string, MatrixRow>());

  for(const inventory of inventories) {
    for(const record of inventory.rules.values()) {
      let row = rows.get(record.rule);
      if(!row) {
        row = {
          rule: record.rule,
          module: record.module,
          scoped: record.scoped,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
          severities: ({} as Record<PresetName, Severity>)
        };
        rows.set(record.rule, row);
      }
      row.severities[inventory.preset] = record.severity;
      // A rule is only reported as globally applied if it is unscoped somewhere.
      row.scoped &&= record.scoped;
    }
  }

  return [...rows.values()].toSorted(compareRules);
});

const summarySection = ((inventories: PresetInventory[]): string[] => {
  const rows = inventories.map((inventory) => {
    const records = [...inventory.rules.values()];
    const on = records.filter(r => (r.severity !== 'off'));
    return [
      `\`${inventory.preset}\``,
      String(inventory.configs.length),
      String(on.length),
      String(on.filter(r => (r.severity === 'error')).length),
      String(on.filter(r => (r.severity === 'warn')).length),
      String(records.length - on.length)
    ];
  });

  return [
    '## Summary',
    '',
    ...table(
      [
        'Preset',
        'Configs',
        'Rules on',
        '`error`',
        '`warn`',
        'Explicitly off'
      ],
      rows
    )
  ];
});

const matrixSection = ((
  matrix: MatrixRow[],
  presets: PresetName[]
): string[] => {
  const rows = matrix.map((row) => {
    const note = RULE_NOTES[row.rule];
    return [
      `\`${row.rule}\``,
      row.module,
      row.scoped ? 'scoped' : 'global',
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Correct.
      ...presets.map(preset => SEVERITY_CELL[row.severities[preset] ?? 'off']),
      note ? escapeCell(note) : ''
    ];
  });

  const undocumented = matrix.filter(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Correct.
    row => (!RULE_NOTES[row.rule] && presets.some(p => ((row.severities[p] ?? 'off') !== 'off')))
  ).length;

  return [
    '## Rules',
    '',
    'Severity shown is the last entry in config order. Rules marked `scoped` are',
    'only set inside configs restricted by `files` or `ignores`, so the severity',
    'applies to those globs rather than the whole project.',
    '',
    `${undocumented} enabled rule(s) have no entry in \`src/meta/notes.ts\`.`,
    '',
    ...table(
      [
        'Rule',
        'Module',
        'Scope',
        ...presets.map(p => `\`${p}\``),
        'Note'
      ],
      rows
    )
  ];
});

const optionsSection = ((inventories: PresetInventory[]): string[] => {
  const lines = [
    '## Rule options',
    ''
  ];

  for(const inventory of inventories) {
    const configured = [...inventory.rules.values()]
      .filter(record => ((record.severity !== 'off') && (record.options.length > 0)))
      .toSorted(compareRules);

    lines.push(`### \`${inventory.preset}\``, '');

    if(configured.length === 0) {
      lines.push('No rule in this preset is configured with options.', '');
      continue;
    }

    const payload: Record<string, unknown[]> = {};
    for(const record of configured) {
      payload[record.rule] = record.options;
    }

    lines.push('```json', JSON.stringify(payload, null, 2), '```', '');
  }

  return lines;
});

const overlaysSection = ((): string[] => {
  const rows = COMMON_OVERLAYS.map(overlay => [
    `\`${overlay.id}\``,
    overlay.files.map(glob => `\`${glob}\``).join('<br>'),
    String(Object.keys(overlay.rules).length),
    escapeCell(overlay.why)
  ]);

  return [
    '## Overlays',
    '',
    'Path-scoped rule relaxations. Opt-in via `overlays: COMMON_OVERLAYS`; none',
    'are applied by default.',
    '',
    ...table(
      [
        'Overlay',
        'Files',
        'Rules relaxed',
        'Rationale'
      ],
      rows
    )
  ];
});

const generate = (async(): Promise<GeneratedFile[]> => {
  const inventories = (await buildInventories());
  const presets = inventories.map(inventory => inventory.preset);
  const matrix = buildMatrix(inventories);

  const content = [
    banner('rulegen.ts', 'html'),
    '',
    '# Rule Inventory',
    '',
    `${matrix.length} distinct rules are referenced across ${presets.length} presets.`,
    '',
    ...summarySection(inventories),
    '',
    ...matrixSection(matrix, presets),
    '',
    ...optionsSection(inventories),
    ...overlaysSection()
  ].join('\n');

  return [
    {
      path: OUTPUT,
      content: content
    }
  ];
});

if(isEntrypoint(import.meta.url)) {
  await runAsScript(generate);
}

export type {
  MatrixRow

};
export {
  generate,
  OUTPUT
};

export {
  type RuleRecord
} from './_resolve';
