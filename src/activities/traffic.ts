
import 'dotenv/config'; 
import { Client as MapsClient, TrafficModel } from "@googlemaps/google-maps-services-js";
import { ROUTE_CONFIGS } from '../config';

export interface Route { origin: string; destination: string; }
export interface TrafficData {
  delayMinutes: number;
  baselineSeconds: number;
  inTrafficSeconds: number;
}

export type TrafficResult = | { success:true; data: TrafficData } | { success: false; error: string };


export async function fetchTrafficData(
  route: Route,
): Promise<TrafficResult> {
  try {
    const client = new MapsClient({});
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      throw new Error("Missing GOOGLE_MAPS_API_KEY in environment variables");
    }

    const res = await client.directions({
    params: {
      origin: route.origin,
      destination: route.destination,
      key, 
      departure_time: "now",
      traffic_model: TrafficModel.best_guess,
    },
    
  });

  

  const leg = res.data.routes[0].legs[0];

  if (!leg) throw new Error("Invalid traffic data: no route/leg returned from Google Maps API");

  const baseline = leg.duration.value;                  
  const inTraffic = leg.duration_in_traffic?.value ?? baseline;
  const delay = inTraffic - baseline;
  const delayMinutes = Math.round(delay / 60);
  
  return{
    success: true,
    data: {
      delayMinutes,
      baselineSeconds: baseline,
      inTrafficSeconds: inTraffic,
    },
  };
}catch (err:any) {
  const status = err.response?.status;
  const apiMsg = err.response?.data?.error_message;
  console.log('[Traffic][FetchFailure]', {
    route,
    status,
    apiMsg,
    stack: err.stack,
  });
  return { success: false, error: apiMsg ?? err.message };
}
}


export async function runTraffic(): Promise<number> {
  console.log('=== Running testTraffic ===');
  if (!ROUTE_CONFIGS.length) {
    throw new Error("No route configurations found");
  }
  const { route } = ROUTE_CONFIGS[0];

if(!route.origin || !route.destination) {
  throw new Error("Route configuration is missing origin or destination");
}

  console.log(`Using route: ${route.origin} → ${route.destination}`);

  const result = await fetchTrafficData(route as Route);
  if (!result.success) {
    throw new Error(`Failed to fetch traffic data: ${result.error}`);
  }
  const data = result.data;
  console.log('Fetched traffic data:', data);

  return data.delayMinutes;
  
}

if (require.main === module) {
  runTraffic().catch((err) => {
    console.error('❌ Error in runTestTraffic:', err);
    process.exit(1);
  });
}

