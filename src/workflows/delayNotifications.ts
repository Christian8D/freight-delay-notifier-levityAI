/**
 * Orchestrates the four steps:
 * 1. fetch traffic → 2. check threshold → 
 * 3. generate AI message → 4. send notification.
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/traffic";
import type * as aiActs from "../activities/ai";
import type * as notifActs from "../activities/notifications";

export interface Route { origin: string; destination: string; }
export interface Customer { name: string; email: string; phone?: string; }

const { fetchTrafficData } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
});
const { generateMessage } = proxyActivities<typeof aiActs>({
  startToCloseTimeout: "1 minute",
});
const { sendNotification } = proxyActivities<typeof notifActs>({
  startToCloseTimeout: "1 minute",
});

/**
 * @param route           Delivery route
 * @param threshold       Minutes of delay before notifying
 * @param customer        Customer info
 */
export async function delayNotificationWorkflow(
  route: Route,
  threshold: number,
  customer: Customer
): Promise<void> {
  // 1. Fetch traffic data
  const data = await fetchTrafficData(route);
  console.log(`[DEBUG] fetchTrafficData → delayMinutes = ${data.delayMinutes}m`);


  // 2. If under threshold, exit
  if (data.delayMinutes < threshold) {
    console.log(`Delay ${data.delayMinutes}m < threshold ${threshold}m → no notification.`);
    return;
  }

  // 3. Generate AI message
  const message = await generateMessage({ route, delayMinutes: data.delayMinutes, customer });

  // 4. Send notification
  await sendNotification({ customer, message });

  
}
