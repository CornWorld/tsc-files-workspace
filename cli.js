#!/usr/bin/env node

import { spawnSync } from 'child_process'
import fs from 'fs'
import { dirname, join, resolve } from 'path'

const randomChars = () => {
  return Math.random().toString(36).slice(2)
}

const resolveFromModule = (moduleName, ...paths) => {
  try {
    // Try to resolve using import.meta.resolve (Node.js 20.6+)
    const moduleUrl = import.meta.resolve(`${moduleName}/package.json`)
    const modulePath = dirname(new URL(moduleUrl).pathname)
    return join(modulePath, ...paths)
  } catch {
    // Fallback: assume module is in node_modules
    const modulePath = join(process.cwd(), 'node_modules', moduleName)
    return join(modulePath, ...paths)
  }
}

const resolveFromRoot = (...paths) => {
  return join(process.cwd(), ...paths)
}

// Find workspace root by looking for package.json with workspaces
const findWorkspaceRoot = (startDir = process.cwd()) => {
  let currentDir = startDir
  while (currentDir !== dirname(currentDir)) {
    // Check for pnpm-workspace.yaml (pnpm workspace)
    const pnpmWorkspacePath = join(currentDir, 'pnpm-workspace.yaml')
    if (fs.existsSync(pnpmWorkspacePath)) {
      return currentDir
    }

    // Check for package.json with workspaces field (npm/yarn workspace)
    const packageJsonPath = join(currentDir, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        if (packageJson.workspaces) {
          return currentDir
        }
      } catch {
        // Continue searching
      }
    }
    currentDir = dirname(currentDir)
  }
  return null
}

// Find the closest tsconfig.json for a file
const findTsconfigForFile = (filePath, workspaceRoot) => {
  let currentDir = dirname(resolve(filePath))
  while (currentDir.startsWith(workspaceRoot || process.cwd())) {
    const tsconfigPath = join(currentDir, 'tsconfig.json')
    if (fs.existsSync(tsconfigPath)) {
      return tsconfigPath
    }
    currentDir = dirname(currentDir)
  }
  return resolveFromRoot('tsconfig.json')
}

// Group files by their tsconfig
const groupFilesByTsconfig = (files, workspaceRoot) => {
  const groups = new Map()

  for (const file of files) {
    const tsconfigPath = findTsconfigForFile(file, workspaceRoot)
    if (!groups.has(tsconfigPath)) {
      groups.set(tsconfigPath, [])
    }
    groups.get(tsconfigPath).push(file)
  }

  return groups
}

const args = process.argv.slice(2)

const argsProjectIndex = args.findIndex(arg =>
  ['-p', '--project'].includes(arg),
)

const argsProjectValue =
  argsProjectIndex !== -1 ? args[argsProjectIndex + 1] : undefined

const files = args.filter(file => /\.(ts|tsx)$/.test(file))
if (files.length === 0) {
  process.exit(0)
}

const remainingArgsToForward = args.slice().filter(arg => !files.includes(arg))

if (argsProjectIndex !== -1) {
  remainingArgsToForward.splice(argsProjectIndex, 2)
}

// Check if we're in a workspace
const workspaceRoot = findWorkspaceRoot()
const tmpConfigPaths = []
let overallStatus = 0

if (workspaceRoot && !argsProjectValue) {
  console.log('Using workspace mode')
  // Group files by their closest tsconfig
  const fileGroups = groupFilesByTsconfig(files, workspaceRoot)

  // Process each group separately
  for (const [tsconfigPath, groupFiles] of fileGroups) {
    // Load existing config
    const tsconfigContent = fs.readFileSync(tsconfigPath).toString()
    // Use 'eval' to read the JSON as regular JavaScript syntax so that comments are allowed
    let tsconfig = {}
    eval(`tsconfig = ${tsconfigContent}`)

    // Write a temp config file
    const tmpTsconfigPath = resolveFromRoot(`tsconfig.${randomChars()}.json`)
    tmpConfigPaths.push(tmpTsconfigPath)

    const tmpTsconfig = {
      ...tsconfig,
      compilerOptions: {
        ...tsconfig.compilerOptions,
        skipLibCheck: true,
        verbatimModuleSyntax: false,
      },
      files: groupFiles,
      include: [],
    }
    fs.writeFileSync(tmpTsconfigPath, JSON.stringify(tmpTsconfig, null, 2))

    // Type-check files for this group
    const { status } = spawnSync(
      process.versions.pnp
        ? 'tsc'
        : resolveFromModule(
            'typescript',
            `../.bin/tsc${process.platform === 'win32' ? '.cmd' : ''}`,
          ),
      ['-p', tmpTsconfigPath, ...remainingArgsToForward],
      { stdio: 'inherit' },
    )

    if (status !== 0) {
      overallStatus = status
    }
  }
} else {
  // Original behavior for non-workspace or when project is specified
  const tsconfigPath = argsProjectValue || resolveFromRoot('tsconfig.json')
  const tsconfigContent = fs.readFileSync(tsconfigPath).toString()
  let tsconfig = {}
  eval(`tsconfig = ${tsconfigContent}`)

  const tmpTsconfigPath = resolveFromRoot(`tsconfig.${randomChars()}.json`)
  tmpConfigPaths.push(tmpTsconfigPath)

  const tmpTsconfig = {
    ...tsconfig,
    compilerOptions: {
      ...tsconfig.compilerOptions,
      skipLibCheck: true,
    },
    files,
    include: [],
  }
  fs.writeFileSync(tmpTsconfigPath, JSON.stringify(tmpTsconfig, null, 2))

  const { status } = spawnSync(
    'tsc',
    ['-p', tmpTsconfigPath, ...remainingArgsToForward],
    { stdio: 'inherit' },
  )

  overallStatus = status
}

// Attach cleanup handlers
let didCleanup = false
for (const eventName of ['exit', 'SIGHUP', 'SIGINT', 'SIGTERM']) {
  process.on(eventName, exitCode => {
    if (didCleanup) return
    didCleanup = true

    // Clean up all temp config files
    tmpConfigPaths.forEach(path => {
      try {
        fs.unlinkSync(path)
      } catch {
        // Ignore cleanup errors
      }
    })

    if (eventName !== 'exit') {
      process.exit(exitCode)
    }
  })
}

process.exit(overallStatus)
