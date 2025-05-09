
// src/index.ts
import 'dotenv/config';
import { Connection, Client, WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import { monitorWorkflow } from './workflows/monitorWorkflow';
import { ROUTE_CONFIGS, TASK_QUEUE } from './config';
import { runWorker } from './worker';

/**
 * Bootstraps the worker, then schedules **one Temporal workflow per job** in ROUTE_CONFIGS.
 * Each workflow is identified by `freight-monitor-job-${job_id}` and runs on CRON_SCHEDULE.
 */
async function main() {
  // 1️⃣ Start the worker (fire‑and‑forget)
  runWorker().catch((err) => {
    console.error('❌ Worker failed:', err);
    process.exit(1);
  });
  console.log(`🚀 Worker polling on queue "${TASK_QUEUE}"`);

  // 2️⃣ Allow the worker a moment to register
  await new Promise((r) => setTimeout(r, 1000));

  // 3️⃣ Create Temporal client
  const conn = await Connection.connect();
  const client = new Client({ connection: conn });

  console.log('=== Scheduling monitorWorkflow jobs ===');

  for (const cfg of ROUTE_CONFIGS) {
    const { job_id } = cfg;
    const workflowId = `freight-monitor-job-${job_id}`;

    try {
      await client.workflow.start(monitorWorkflow, {
        args: [cfg],              // monitorWorkflow expects an array
        taskQueue: TASK_QUEUE,
        workflowId,
        workflowIdReusePolicy: 'REJECT_DUPLICATE',
      });
  
    } catch (err: unknown) {
      if (err instanceof WorkflowExecutionAlreadyStartedError || (err as any)?.message?.includes('Workflow execution already started')) {
        console.log(`↪ Job ${job_id} already scheduled – skipping duplicate.`);
      } else {
        throw err;
      }
    }
  }

  console.log('✅ All jobs scheduled.');
}

main().catch((err) => {
  console.error('❌ Error in main:', err);
  process.exit(1);
});
