import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('production build writes artifacts under dist/', () => {
	const distDir = join(repoRoot, 'dist');
	const mainJs = join(distDir, 'main.js');
	const stylesCss = join(distDir, 'styles.css');

	rmSync(distDir, { recursive: true, force: true });

	execFileSync('node', ['esbuild.config.mjs', 'production'], {
		cwd: repoRoot,
		stdio: 'pipe'
	});

	assert.ok(existsSync(mainJs));
	const js = readFileSync(mainJs, 'utf8');
	assert.match(js, /GENERATED\/BUNDLED FILE BY ESBUILD/);

	if (existsSync(join(repoRoot, 'styles.css'))) {
		assert.ok(existsSync(stylesCss));
	}
});
