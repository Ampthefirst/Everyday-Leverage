import type { WorkerRequest, WorkerResponse, BuildResult, SectionResult } from './protocol';
import type { MeshData } from './kernel';

type Pending = { resolve: (r: WorkerResponse) => void };
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const p = pending.get(e.data.id);
      pending.delete(e.data.id);
      p?.resolve(e.data);
    };
    worker.onerror = (e) => {
      for (const [id, p] of pending)
        p.resolve({ id, ok: false, error: e.message || 'Geometry worker failed' });
      pending.clear();
    };
  }
  return worker;
}

export class StaleError extends Error {
  constructor() {
    super('stale');
  }
}

type Req<T extends WorkerRequest['type']> = Omit<Extract<WorkerRequest, { type: T }>, 'id'>;

function send(req: Omit<WorkerRequest, 'id'>): Promise<WorkerResponse> {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, { resolve });
    getWorker().postMessage({ ...req, id } as WorkerRequest);
  });
}

async function call<T>(req: Omit<WorkerRequest, 'id'>): Promise<T> {
  const r = await send(req);
  if (!r.ok) {
    if ('stale' in r) throw new StaleError();
    throw new Error(r.error);
  }
  return (r as unknown as { result: T }).result;
}

export const geometry = {
  build: (r: Req<'build'>) => call<BuildResult>(r),
  fitTest: (r: Req<'fitTest'>) => call<MeshData>(r),
  section: (r: Req<'section'>) => call<SectionResult>(r),
  bar: () => call<MeshData>({ type: 'bar' }),
};
