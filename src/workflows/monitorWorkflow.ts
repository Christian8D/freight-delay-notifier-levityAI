
// src/workflows/monitorWorkflow.ts
import { proxyActivities, log, sleep } from '@temporalio/workflow';
import ms from 'ms';
import type * as trafficActivities from '../activities/traffic';
import type * as aiActivities from '../activities/ai';
import type * as notificationActivities from '../activities/notifications';
import { sleep as temporalSleep } from '@temporalio/workflow';
import { CLEAR_MARGIN_MIN, DELTA_JUMP_MIN, MAX_QUIET_MIN, POLL_INTERVAL_MIN } from '../config';

// Configure timeouts for your activities
const trafficOptions = { startToCloseTimeout: ms('1 minute') };
const aiOptions      = { startToCloseTimeout: ms('2 minutes') };
const notifyOptions  = { startToCloseTimeout: ms('1 minute') };

// Proxy out the activities we need
const { fetchTrafficData }   = proxyActivities<typeof trafficActivities>(trafficOptions);
const { generateMessage }    = proxyActivities<typeof aiActivities>(aiOptions);
const { sendNotification }   = proxyActivities<typeof notificationActivities>(notifyOptions);


export interface RouteConfig {
  route: { origin: string; destination: string };
  threshold: number;                     // delay threshold in minutes
  customer: { name: string; email: string; phone?: string };
  taskCompletedTimer: number;
}

  async function fetchUntilSuccess(route: RouteConfig['route']) {
      while (true) {
        const result = await fetchTrafficData(route);
        if (result.success) {
          return result.data;
        }
        log.warn(`Failed to fetch traffic data, retrying in ${POLL_INTERVAL_MIN} minutes...`);
        await sleep(ms(`${POLL_INTERVAL_MIN}min`));
      }

    }

    

export async function monitorWorkflow(cfg: RouteConfig): Promise<void> {
  const startTime = Date.now();
  let lastNotifiedAt: number | null = null;
  let lastNotifiedDelay = 0;
  
   while (true) {
    const now = Date.now();

    if (now - startTime >= ms(`${cfg.taskCompletedTimer}m`)) {
      log.info(`Delivery completed after ${cfg.taskCompletedTimer} minutes. Finishing workflow.`);
      return;
    }
  

    // const { delayMinutes } = result.data;
    const { delayMinutes } = await fetchUntilSuccess(cfg.route);


    
    const shouldNotify =
      (delayMinutes >= cfg.threshold && lastNotifiedAt === null) ||
      (delayMinutes >= cfg.threshold + DELTA_JUMP_MIN && delayMinutes - lastNotifiedDelay >= DELTA_JUMP_MIN) ||
      (delayMinutes >= cfg.threshold &&
        lastNotifiedAt !== null &&
        now - lastNotifiedAt >= ms(`${MAX_QUIET_MIN}m`)) ||
      (delayMinutes < cfg.threshold - CLEAR_MARGIN_MIN && lastNotifiedAt !== null);

    if (shouldNotify) {
      const message = await generateMessage({
        route: cfg.route,
        delayMinutes,
        customer: cfg.customer,
      });
      await sendNotification({ customer: cfg.customer, message });

      lastNotifiedAt = delayMinutes >= cfg.threshold ? now : null;
      lastNotifiedDelay = delayMinutes;
    }

    /* Wait before next poll */
    await sleep(ms(`${POLL_INTERVAL_MIN}min`));
  }
}

