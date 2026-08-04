import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('..');
const evidence = resolve(root, 'evidence/task-runs/P02-DOOM-P2-085');
const frames = ['frame-001.bin', 'frame-035.bin', 'frame-070.bin', 'frame-140.bin'];

function digest(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
function signature(run) {
  const states = readFileSync(resolve(run, 'state.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  return { states, frames: Object.fromEntries(frames.map((name) => [name, digest(resolve(run, name))])) };
}

test('native, Chromium, and Firefox Oracle evidence is exact and unnormalized', async () => {
  const native = signature(resolve(evidence, 'native/baseline/run-1'));
  expect(native.states.map((state) => state.tic)).toEqual([0, 1, 35, 70, 140]);
  for (const [browser, count] of [['chromium', 5], ['firefox', 3]]) {
    for (let index = 1; index <= count; index += 1) {
      expect(signature(resolve(evidence, `wasm-${browser}/baseline/run-${index}`))).toEqual(native);
    }
  }
  const summary = JSON.parse(readFileSync(resolve(evidence, 'comparison.json'), 'utf8'));
  expect(summary.status).toBe('PASS');
  expect(summary.normalization).toBe('none');
  expect(summary.pwad_order_claim).toBe('excluded');
});
