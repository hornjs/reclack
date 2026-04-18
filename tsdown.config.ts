import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: true,
  entry: [
    "src/index.ts",
    "src/ansi-colors.ts",
    "src/ansi-styles.ts",
    "src/chalk.ts",
    "src/colorette.ts",
    "src/picocolors.ts",
    "src/yoctocolors.ts",
  ]
})
