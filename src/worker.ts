// src/worker.ts
import { Worker } from '@temporalio/worker';
import * as trafficActivities from './activities/traffic';
import * as aiActivities from './activities/ai';
import * as notificationActivities from './activities/notifications';
import { TASK_QUEUE } from './config';

  const reqKey = ['OPENAI_API_KEY', 'SENDGRID_API_KEY', 'GOOGLE_MAPS_API_KEY'] as const;
  type EnvKey = (typeof reqKey)[number];

  const env: Record<EnvKey, string | undefined> = reqKey.reduce((acc, key)=>{
   const value = process.env[key];
   if (!value){
      console.warn(`Environment variable ${key} is not set.`);
   }

   return { ...acc, [key]: value };
  }, {} as Record<EnvKey, string | undefined>)



export async function runWorker() {

  //Critical environment variables check else stop the worker
    if (!env.GOOGLE_MAPS_API_KEY || !env.SENDGRID_API_KEY) {
    throw new Error('Critical API is required');
  }
  
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
