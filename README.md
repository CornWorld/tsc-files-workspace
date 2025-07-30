# tsc-files-workspace

A tiny tool to run `tsc` on specific files without ignoring `tsconfig.json`, with workspace support.

## Why tsc-files-workspace?

Born out of real-world frustrations with pre-commit hooks in monorepo environments:

1. nano-staged + eslint --fix: Too many conflicts when multiple files are being fixed simultaneously
2. pnpm run test: Way too slow for just a simple commit - nobody wants to wait minutes for basic validation
3. tsc --noEmit: Fast and reliable, but doesn't show which specific files have errors - debugging becomes a nightmare!
4. **tsc-files-workspace**: Perfect solution for showing filenames with errors, but doesn't work in workspace/monorepo setups

This enhanced version detects workspace configurations automatically and ensures each file gets checked with its correct `tsconfig.json`. Now you get fast type checking with clear error reporting and proper workspace support - perfect for pre-commit hooks!

## Features

- ✅ Run TypeScript compiler on specific files
- ✅ Respect `tsconfig.json` configuration
- ✅ **NEW**: Automatic workspace detection
- ✅ **NEW**: Group files by their closest `tsconfig.json`
- ✅ **NEW**: Process each workspace package separately
- ✅ Support for monorepo projects
- ✅ Backward compatible with original [tsc-files](https://www.npmjs.com/package/tsc-files)

## Installation

```bash
npm install tsc-files-workspace
# or
pnpm add tsc-files-workspace
# or
yarn add tsc-files-workspace
```

## Usage

### Basic Usage (same as original tsc-files-workspace)

```bash
tsc-files-workspace src/file1.ts src/file2.ts
```

### Workspace Support (NEW)

When used in a monorepo with workspaces, the tool automatically:

1. Detects if you're in a workspace (looks for `package.json` with `workspaces` field)
2. Groups files by their closest `tsconfig.json`
3. Runs TypeScript compiler separately for each group

```bash
# In a monorepo, this will automatically group files by workspace packages
tsc-files-workspace packages/server/src/app.ts packages/client/src/main.ts packages/shared/src/utils.ts
```

### Manual Project Specification

You can still specify a specific `tsconfig.json` to disable workspace detection:

```bash
tsc-files-workspace --project packages/server/tsconfig.json src/file1.ts src/file2.ts
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
tsc-files-workspace packages/server/src/app.ts packages/client/src/main.ts packages/shared/src/utils.ts
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

## Husky Integration

This tool works great with Husky for pre-commit hooks. Here's how to set it up:

### Installation with Husky

```bash
# Install husky and tsc-files-workspace
pnpm install --save-dev husky tsc-files-workspace

# Initialize husky
pnpx husky init
```

### Pre-commit Hook Example

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Get staged TypeScript files
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -n "$STAGED_TS_FILES" ]; then
  echo "Type checking staged TypeScript files..."
  npx tsc-files-workspace $STAGED_TS_FILES --noEmit

  if [ $? -ne 0 ]; then
    echo "TypeScript type check failed. Please fix the errors before committing."
    exit 1
  fi
fi
```

### Advanced Husky Setup with Lint-staged

For more advanced setups, combine with lint-staged:

```bash
npm install --save-dev lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "tsc-files-workspace --noEmit",
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

Update `.husky/pre-commit`:

```bash
pnpx lint-staged
```

### Benefits of Using with Husky

- **Fast type checking**: Only checks changed files
- **Workspace aware**: Automatically uses correct tsconfig for each file
- **Early error detection**: Catches type errors before they reach CI/CD
- **Consistent code quality**: Ensures all commits pass type checking

## Compatibility

- Fully backward compatible with original `tsc-files-workspace`
- Works with any TypeScript version >= 3.0
- Supports all `tsc` command line options
- Works with any workspace manager (pnpm, npm, yarn, lerna, etc.)
- Integrates seamlessly with Husky, lint-staged, and other Git hooks

## License

MIT
