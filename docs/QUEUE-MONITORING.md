# Queue Monitoring Guide

## 1. Bull Board Web UI

Access the visual dashboard at:
**http://localhost:3000/admin/queues**

Features:

- View all jobs (waiting, active, completed, failed, delayed)
- Retry failed jobs
- Clean old jobs
- Real-time updates
- Job details and logs

## 2. Redis CLI Commands

Check queue stats:

```bash
# See all BullMQ keys
redis-cli KEYS "bull:title-generation:*"

# Count jobs by status
redis-cli LLEN "bull:title-generation:wait"      # Waiting jobs
redis-cli ZCARD "bull:title-generation:delayed"   # Delayed jobs
redis-cli ZCARD "bull:title-generation:active"    # Active jobs
redis-cli ZCARD "bull:title-generation:completed" # Completed jobs
redis-cli ZCARD "bull:title-generation:failed"    # Failed jobs
```

Get job details:

```bash
# Get job data
redis-cli HGETALL "bull:title-generation:1"

# Get job state
redis-cli HGET "bull:title-generation:1" "state"
```

## 3. Programmatic Monitoring

Add to your code:

```typescript
import { titleGenerationQueue } from "./queues/title-generation.queue";

// Get queue stats
const counts = await titleGenerationQueue.getJobCounts();
console.log(counts); // { waiting: 0, active: 0, completed: 5, failed: 2, delayed: 0 }

// Get jobs
const waiting = await titleGenerationQueue.getWaiting();
const active = await titleGenerationQueue.getActive();
const completed = await titleGenerationQueue.getCompleted();
const failed = await titleGenerationQueue.getFailed();

// Get specific job
const job = await titleGenerationQueue.getJob("job-id");
```

## 4. Enable Workers

To actually process jobs, set in `.env`:

```
RUN_WORKERS="true"
```

Then restart the server. You'll see:

```
🔧 Workers started successfully
```

## Common Operations

### Add a test job:

```typescript
// In your code or via API
await titleGenerationQueue.add("generate-titles", {
  organizationId: "org-id",
  userId: "user-id",
  settingsId: "settings-id",
});
```

### Clear all jobs:

```bash
# Via Redis CLI
redis-cli DEL $(redis-cli KEYS "bull:title-generation:*")
```

### Monitor worker logs:

Check your application logs when `RUN_WORKERS=true` - you'll see:

- Job started: `Processing title generation for org: {orgId}`
- Job completed: `Title generation completed for org: {orgId}`
- Job failed: Error details in logs
