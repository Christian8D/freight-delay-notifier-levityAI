// src/worker.ts
import { Worker } from '@temporalio/worker';
import * as trafficActivities from './activities/traffic';
import * as aiActivities from './activities/ai';
import * as notificationActivities from './activities/notifications';
import { TASK_QUEUE } from './config';

export async function runWorker() {
  const worker = await Worker.create({
    // Point at the workflows folder’s index.ts, which exports monitorWorkflow (and any others)
    workflowsPath: require.resolve('./workflows'),
    activities: {
      ...trafficActivities,
      ...aiActivities,
      ...notificationActivities,
    },
    taskQueue: TASK_QUEUE,
  });

  console.log('🚀 Worker started on coord-queue');
  await worker.run();
}

runWorker().catch((err) => {
  console.error(err);
  process.exit(1);
});
