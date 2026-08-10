import type {ConfigObject} from '@eslint/core';

declare module '@eslint/core' {
  interface Plugin {
    /**
     * Flat configs, for plugins that keep `configs` for the legacy shape.
     * Optional, and never present on plugins that only ship `configs`.
     */
    flatConfigs?: (Record<string, (ConfigObject | ConfigObject[])> | undefined);
  }
}
