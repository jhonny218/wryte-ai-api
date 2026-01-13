import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { titleGenerationQueue, outlineGenerationQueue, blogGenerationQueue } from '../workers/queues';

// Create Bull Board UI
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(titleGenerationQueue),
    new BullMQAdapter(outlineGenerationQueue),
    new BullMQAdapter(blogGenerationQueue),
  ],
  serverAdapter: serverAdapter,
});

export { serverAdapter };
