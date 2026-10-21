/// <reference lib="webworker" />
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import { loadKernel } from './kernel';
import { runBar, runBuild, runFitTest, runSection } from './jobs';
import type { WorkerRequest, WorkerResponse } from './protocol';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const kernel = loadKernel(() => wasmUrl);

// Only the newest job per type runs; older queued jobs of the same type are answered as stale.
const latest = new Map<string, number>();
const queue: WorkerRequest[] = [];
let running = false;

function transfer(r: WorkerResponse): Transferable[] {
  if (!r.ok) return [];
  if (r.type === 'build') {
    const out: Transferable[] = [r.result.mesh.positions.buffer, r.result.mesh.indices.buffer];
    for (const p of r.result.pieces) out.push(p.positions.buffer, p.indices.buffer);
    return out;
  }
  if (r.type === 'fitTest' || r.type === 'bar') return [r.result.positions.buffer, r.result.indices.buffer];
  return [];
}

async function pump() {
  if (running) return;
  running = true;
  const K = await kernel;
  while (queue.length) {
    const req = queue.shift()!;
    if (latest.get(req.type) !== req.id) {
      ctx.postMessage({ id: req.id, ok: false, stale: true } satisfies WorkerResponse);
      continue;
    }
    let res: WorkerResponse;
    try {
      if (req.type === 'build')
        res = {
          id: req.id,
          ok: true,
          type: 'build',
          result: runBuild(K, req.familyId, req.params, req.split),
        };
      else if (req.type === 'fitTest')
        res = { id: req.id, ok: true, type: 'fitTest', result: runFitTest(K, req.familyId, req.params) };
      else if (req.type === 'section')
        res = {
          id: req.id,
          ok: true,
          type: 'section',
          result: runSection(K, req.familyId, req.params, req.axis, req.offset, req.shellT),
        };
      else res = { id: req.id, ok: true, type: 'bar', result: runBar(K) };
    } catch (e) {
      res = { id: req.id, ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    ctx.postMessage(res, transfer(res));
    // Yield so newer messages can arrive and mark queued jobs stale.
    await new Promise((r) => setTimeout(r, 0));
  }
  running = false;
}

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  latest.set(e.data.type, e.data.id);
  queue.push(e.data);
  setTimeout(pump, 0);
};
