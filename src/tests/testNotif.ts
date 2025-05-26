// src/tests/testNotif.ts
import { sendNotification } from '../activities/notifications';
import { runTestAI } from './testAI';
import { runTestTraffic } from './testTraffic';
import { ROUTE_CONFIGS } from '../config';

export async function runTestNotification(): Promise<void> {
  console.log('=== Running testNotification ===');

  // Use the first config customer
  const { customer } = ROUTE_CONFIGS[0];

  // Fetch current delay
  const delayMinutes = await runTestTraffic();

  // Generate AI message based on the real delay
  const msg = await runTestAI(delayMinutes);

  // Send the notification
  await sendNotification({ customer, message: msg });

  console.log('AI result:\n', msg);
  console.log(`Notification sent to ${customer.email}`);
}

// Run directly if invoked as a script
if (require.main === module) {
  runTestNotification().catch((err) => {
    console.error('❌ Error in runTestNotification:', err);
    process.exit(1);
  });
}
