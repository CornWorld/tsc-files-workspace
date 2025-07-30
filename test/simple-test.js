#!/usr/bin/env node

import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('Testing tsc-files-workspace...\n')

// Test 1: Direct test of a file with errors
console.log('Test 1: Running on app1 (strict mode, should have errors)')
const result1 = spawnSync('node', [
  join(__dirname, '..', 'cli.js'),
  'packages/app1/src/index.ts',
  '--noEmit'
], {
  cwd: join(__dirname, 'workspace'),
  stdio: 'inherit'
})

console.log(`Exit code: ${result1.status}`)
console.log(`Expected: 2 (TypeScript errors)\n`)

// Test 2: Test on app2 (non-strict mode)
console.log('Test 2: Running on app2 (non-strict mode, should pass)')
const result2 = spawnSync('node', [
  join(__dirname, '..', 'cli.js'),
  'packages/app2/src/index.ts',
  '--noEmit'
], {
  cwd: join(__dirname, 'workspace'),
  stdio: 'inherit'
})

console.log(`Exit code: ${result2.status}`)
console.log(`Expected: 0 (no errors)\n`)

// Summary
console.log('Summary:')
console.log(`Test 1: ${result1.status === 2 ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Test 2: ${result2.status === 0 ? '✅ PASS' : '❌ FAIL'}`)
