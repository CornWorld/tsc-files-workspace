# tsc-files-workspace

A tiny tool to run `tsc` on specific files without ignoring `tsconfig.json`, with workspace support.

## Features

- ✅ Run TypeScript compiler on specific files
- ✅ Respect `tsconfig.json` configuration
- ✅ **NEW**: Automatic workspace detection
- ✅ **NEW**: Group files by their closest `tsconfig.json`
- ✅ **NEW**: Process each workspace package separately
- ✅ Support for monorepo projects
- ✅ Backward compatible with original `tsc-files`

## Installation

```bash
npm install tsc-files-workspace
# or
pnpm add tsc-files-workspace
# or
yarn add tsc-files-workspace
```

## Usage

### Basic Usage (same as original tsc-files)

```bash
tsc-files src/file1.ts src/file2.ts
```

### Workspace Support (NEW)

When used in a monorepo with workspaces, the tool automatically:

1. Detects if you're in a workspace (looks for `package.json` with `workspaces` field)
2. Groups files by their closest `tsconfig.json`
3. Runs TypeScript compiler separately for each group

```bash
# In a monorepo, this will automatically group files by workspace packages
tsc-files packages/server/src/app.ts packages/client/src/main.ts packages/shared/src/utils.ts
```

### Manual Project Specification

You can still specify a specific `tsconfig.json` to disable workspace detection:

```bash
tsc-files --project packages/server/tsconfig.json src/file1.ts src/file2.ts
```

## How It Works

### Workspace Detection

1. Starts from current directory and walks up the directory tree
2. Looks for `package.json` files with a `workspaces` field
3. If found, enables workspace mode

### File Grouping

For each TypeScript file:

1. Finds the closest `tsconfig.json` by walking up from the file's directory
2. Groups files that share the same `tsconfig.json`
3. Creates temporary config files for each group
4. Runs `tsc` separately for each group

### Example Workspace Structure

```
my-monorepo/
├── package.json (with workspaces)
├── tsconfig.json
├── packages/
│   ├── server/
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── app.ts
│   ├── client/
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── main.ts
│   └── shared/
│       ├── tsconfig.json
│       └── src/
│           └── utils.ts
```

Running:
```bash
tsc-files packages/server/src/app.ts packages/client/src/main.ts packages/shared/src/utils.ts
```

Will:
1. Group `packages/server/src/app.ts` with `packages/server/tsconfig.json`
2. Group `packages/client/src/main.ts` with `packages/client/tsconfig.json`
3. Group `packages/shared/src/utils.ts` with `packages/shared/tsconfig.json`
4. Run TypeScript compiler 3 times, once for each group

## Benefits

- **Accurate type checking**: Each file is checked with its appropriate `tsconfig.json`
- **Faster CI/CD**: Only check changed files while respecting workspace boundaries
- **Better error reporting**: Errors are reported in the context of the correct workspace package
- **Monorepo friendly**: Works seamlessly with Lerna, Rush, pnpm workspaces, npm workspaces, etc.

## Compatibility

- Fully backward compatible with original `tsc-files`
- Works with any TypeScript version >= 3.0
- Supports all `tsc` command line options
- Works with any workspace manager (pnpm, npm, yarn, lerna, etc.)

## License

MIT
