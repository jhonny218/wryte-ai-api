import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { titleGenerationQueue } from '../workers/queues';

// Create Bull Board UI
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(titleGenerationQueue)],
  serverAdapter: serverAdapter,
});

export { serverAdapter };
