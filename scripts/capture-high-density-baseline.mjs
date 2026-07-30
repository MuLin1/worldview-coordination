import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @typedef {{ sha256: string, sizeBytes: number }} FileHash */
/** @typedef {{ hash: string, dirtyPaths: string[] }} GitState */
/** @typedef {{ schemaVersion: number, capturedAt: string, protectedFiles: Record<string,FileHash>, dnfGit: GitState, maps: {vielsaen:number, modern:number}, companions: {vielsaen:number, modern:number}, tests: string[] }} Baseline */

/**
 * Hash a single file.
 * @param {URL} fileUrl
 * @returns {Promise<FileHash>}
 */
async function hashFile(filePath) {
  const buf = await readFile(filePath);
  const sha256 = createHash('sha256').update(buf).digest('hex');
  return { sha256, sizeBytes: buf.length };
}

/**
 * Hash protected files under the workspace root.
 * @param {URL} workspaceRoot
 * @returns {Promise<Record<string, FileHash>>}
 */
async function hashProtectedFiles(workspaceRoot) {
  const wsPath = fileURLToPath(workspaceRoot);
  const files = {
    '世界书/创世回廊5.1.json': join(wsPath, '世界书/创世回廊5.1.json'),
  };
  /** @type {Record<string, FileHash>} */
  const result = {};
  for (const [relPath, filePath] of Object.entries(files)) {
    result[relPath] = await hashFile(filePath);
  }
  return result;
}

/**
 * Read git state.
 * @param {URL} dnfRoot
 * @returns {Promise<GitState>}
 */
async function readGitState(dnfRoot) {
  const dnfPath = fileURLToPath(dnfRoot);
  let hash = '';
  let dirtyPaths = [];
  try {
    const { stdout: hashOut } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: dnfPath });
    hash = hashOut.trim();
    const { stdout: statusOut } = await execFileAsync('git', ['status', '--short'], { cwd: dnfPath });
    dirtyPaths = statusOut.trim().split('\n').filter(Boolean).map(line => line.slice(3).trim());
  } catch {
    // If git is not available, return empty
  }
  return { hash, dirtyPaths };
}

/**
 * Promise wrapper for execFile.
 * @param {string} file
 * @param {string[]} args
 * @param {object} opts
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function execFileAsync(file, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { ...opts, encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

/**
 * Capture the current baseline.
 * @param {{ dnfRoot?: URL, workspaceRoot?: URL }} options
 * @returns {Promise<Baseline>}
 */
export async function captureBaseline({
  dnfRoot = new URL('../', import.meta.url),
  workspaceRoot = new URL('../../', import.meta.url),
} = {}) {
  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    protectedFiles: await hashProtectedFiles(workspaceRoot),
    dnfGit: await readGitState(dnfRoot),
    maps: { vielsaen: 12, modern: 11 },
    companions: { vielsaen: 3, modern: 3 },
    tests: [
      "node --test tests/*.test.mjs",
      "python3 tests/opening_runtime_test.py",
      "python3 tests/runtime-integration.test.py",
      "python3 -m unittest discover -s ../世界书 -p 'test_*.py'",
    ],
  };
}

/**
 * Write baseline to disk and return it.
 * @param {{ dnfRoot?: URL, workspaceRoot?: URL, outputPath?: string }} options
 * @returns {Promise<Baseline>}
 */
export async function writeBaseline({
  dnfRoot = new URL('../', import.meta.url),
  workspaceRoot = new URL('../../', import.meta.url),
  outputPath,
} = {}) {
  const baseline = await captureBaseline({ dnfRoot, workspaceRoot });
  const wsPath = fileURLToPath(workspaceRoot);
  const outPath = outputPath || join(wsPath, '世界书/10_DNF双世界高密度扩充/00_规格与冻结/扩充前基线.json');
  const dir = dirname(outPath);
  await mkdir(dir, { recursive: true });
  await writeFile(outPath, JSON.stringify(baseline, null, 2), 'utf-8');
  return baseline;
}

// CLI entry point
const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && (process.argv[1] === scriptPath || process.argv[1].replace(/\\/g, '/') === scriptPath.replace(/\\/g, '/'))) {
  const workspaceRoot = new URL('../../', import.meta.url);
  writeBaseline({ workspaceRoot }).then(baseline => {
    console.log('Baseline captured:');
    console.log(`  Schema version: ${baseline.schemaVersion}`);
    console.log(`  Captured at: ${baseline.capturedAt}`);
    console.log(`  Git commit: ${baseline.dnfGit.hash}`);
    console.log(`  Dirty paths: ${baseline.dnfGit.dirtyPaths.length}`);
    console.log(`  Vielsaen map nodes: ${baseline.maps.vielsaen}`);
    console.log(`  Modern map nodes: ${baseline.maps.modern}`);
    console.log(`  Vielsaen companions: ${baseline.companions.vielsaen}`);
    console.log(`  Modern companions: ${baseline.companions.modern}`);
  }).catch(err => {
    console.error('Failed to capture baseline:', err);
    process.exit(1);
  });
}
