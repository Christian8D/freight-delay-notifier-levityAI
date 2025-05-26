// End-to-end test: traffic → AI → notification → full workflow (optimized)
import 'dotenv/config';
import { runTestTraffic } from './testTraffic';
import { runTestAI } from './testAI';
import { runTestNotification } from './testNotif';
import { Connection, Client } from '@temporalio/client';
import { delayNotificationWorkflow } from '../workflows/delayNotifications';
import { ROUTE_CONFIGS, TASK_QUEUE } from '../config';
import { Customer } from '../workflows/delayNotifications';

/**
 * Runs the full workflow remotely using the first route config from src/config.ts
 */
export async function runWorkflowTest(): Promise<void> {
  console.log('=== Running full workflow ===');

  const { route, threshold, customer } = ROUTE_CONFIGS[0];

  const conn = await Connection.connect();
  const client = new Client({ connection: conn });

  const handle = await client.workflow.start(delayNotificationWorkflow, {
    args: [route, threshold, customer],
    taskQueue: TASK_QUEUE,
    workflowId: `testWorkflow-${Date.now()}`,
  });

  console.log('Started workflow:', handle.workflowId);
  await handle.result();
  console.log('Workflow completed.');
}

/**
 * Runs each step in sequence with shared data to avoid redundant fetching:
 * 1) Traffic test
 * 2) AI test
 * 3) Notification test (using previous AI result and threshold check)
 * 4) Full workflow test
 */
export async function runTestWorkflow(): Promise<void> {
  const { route, threshold, customer } = ROUTE_CONFIGS[0] as { route: any; threshold: number; customer: Customer };

  // 1️⃣ Traffic test
  console.log('=== 1) Traffic Test ===');
  const delayMinutes = await runTestTraffic();
  console.log(`→ delayMinutes = ${delayMinutes}m\n`);

  // 2️⃣ AI test (only if delay exceeds threshold)
  if (delayMinutes <= threshold) {
    console.log(`Threshold (${threshold}m) >= delay (${delayMinutes}m): skipping AI and notification.`);
  } else {
    console.log('=== 2) AI Test ===');
    await runTestAI(delayMinutes);
    console.log('→ AI message generated\n');

    console.log('=== 3) Notification Test ===');
    await runTestNotification();
    console.log('→ Notification step completed\n');

    // 4️⃣ Full workflow test
    console.log('=== 4) Full Workflow ===');
    await runWorkflowTest();
    console.log('\n✅ All test steps completed successfully!\n');
    return;
  }

  console.log('\n✅ Traffic below threshold, test sequence completed without notification.\n');
}

// If invoked directly, execute the test
if (require.main === module) {
  runTestWorkflow().catch((err) => {
    console.error('❌ Error in test workflow:', err);
    process.exit(1);
  });
}
