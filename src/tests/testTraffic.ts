import 'dotenv/config';
import { fetchTrafficData, TrafficData, Route } from '../activities/traffic';
import { ROUTE_CONFIGS } from '../config';

/**
 * Runs the traffic activity for the first route in config and returns the delay in minutes.
 */
export async function runTestTraffic(): Promise<number> {
  console.log('=== Running testTraffic ===');
  const { route } = ROUTE_CONFIGS[0];
  console.log(`Using route: ${route.origin} → ${route.destination}`);

  const data: TrafficData = await fetchTrafficData(route as Route);
  console.log('Fetched traffic data:', data);

  return data.delayMinutes;
  
}

if (require.main === module) {
  runTestTraffic().catch((err) => {
    console.error('❌ Error in runTestTraffic:', err);
    process.exit(1);
  });
}
