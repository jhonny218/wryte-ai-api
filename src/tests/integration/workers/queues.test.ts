import { jest } from '@jest/globals';

// Prepare mocks before importing the module under test
const queueEventsInstances: any[] = [];
const loggerCalls: { level: string; msg: string; meta?: any }[] = [];

jest.mock('bullmq', () => {
  class MockQueue {
    name: string;
    opts: any;
    constructor(name: string, opts: any) {
      this.name = name;
      this.opts = opts;
    }
  }

  class MockQueueEvents {
    name: string;
    opts: any;
    handlers: Record<string, Function[]> = {};
    closed = false;
    constructor(name: string, opts: any) {
      this.name = name;
      this.opts = opts;
      queueEventsInstances.push(this);
    }
    on(event: string, fn: Function) {
      this.handlers[event] ??= [];
      this.handlers[event].push(fn);
    }
    // Helper used by tests to emit events
    emit(event: string, payload: any) {
      const fns = this.handlers[event] ?? [];
      for (const f of fns) f(payload);
    }
    async close() {
      this.closed = true;
    }
  }

  return {
    Queue: MockQueue,
    QueueEvents: MockQueueEvents,
  };
});

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    debug: (msg: string, meta?: any) => loggerCalls.push({ level: 'debug', msg, meta }),
    info: (msg: string, meta?: any) => loggerCalls.push({ level: 'info', msg, meta }),
    warn: (msg: string, meta?: any) => loggerCalls.push({ level: 'warn', msg, meta }),
    error: (msg: string, meta?: any) => loggerCalls.push({ level: 'error', msg, meta }),
  },
}));

describe('queues event handlers (integration)', () => {
  beforeEach(async () => {
    // Ensure we import fresh module with NODE_ENV not equal to 'test'
    jest.resetModules();
    loggerCalls.length = 0;
    queueEventsInstances.length = 0;
    process.env.NODE_ENV = 'development';
    // import the module dynamically (ESM-compatible test harness)
    const mod = await import('../../../workers/queues');
    // initialize events
    mod.initializeQueueEvents();
  });

  afterEach(async () => {
    // Close any created queue events
    const mod = await import('../../../workers/queues');
    await mod.closeQueueEvents();
    jest.resetModules();
  });

  test('should register handlers and log on events', async () => {
    // We expect three queue event instances (title, outline, blog)
    expect(queueEventsInstances.length).toBe(3);

    const [titleQE] = queueEventsInstances;

    // Emit a variety of events to exercise all handlers
    titleQE.emit('waiting', { jobId: 'w1' });
    titleQE.emit('active', { jobId: 'a1', prev: 'waiting' });
    titleQE.emit('completed', { jobId: 'c1', returnvalue: { ok: true } });
    titleQE.emit('failed', { jobId: 'f1', failedReason: 'boom' });
    titleQE.emit('stalled', { jobId: 's1' });
    titleQE.emit('retries-exhausted', { jobId: 'r1', attemptsMade: 3 });
    titleQE.emit('error', new Error('uh-oh'));

    // Make some assertions that logger was called for each event type
    const levels = loggerCalls.map((c) => c.level);
    expect(levels).toEqual(expect.arrayContaining(['debug', 'info', 'info', 'error', 'warn', 'error', 'error']));

    // Check one of the logged messages contains expected metadata
    const completedCall = loggerCalls.find((c) => c.level === 'info' && c.msg === 'Job completed');
    expect(completedCall).toBeDefined();
    expect(completedCall?.meta).toHaveProperty('event', 'job_completed');
  });

  test('initializeQueueEvents is no-op in test env', async () => {
    jest.resetModules();
    loggerCalls.length = 0;
    queueEventsInstances.length = 0;
    process.env.NODE_ENV = 'test';
    const mod = await import('../../../workers/queues');
    mod.initializeQueueEvents();
    expect(queueEventsInstances.length).toBe(0);
  });
});
