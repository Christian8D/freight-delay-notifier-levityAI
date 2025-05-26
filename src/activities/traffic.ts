
import 'dotenv/config'; 
import { Client as MapsClient, TrafficModel } from "@googlemaps/google-maps-services-js";
import { ROUTE_CONFIGS } from '../config';

export interface Route { origin: string; destination: string; }
export interface TrafficData {
  delayMinutes: number;
  baselineSeconds: number;
  inTrafficSeconds: number;
}

export async function fetchTrafficData(
  route: Route
): Promise<TrafficData> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY in environment variables");
  }

  try {
    const client = new MapsClient({});
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
    const baseline = leg.duration.value;                  // seconds if no traffic
    const inTraffic = leg.duration_in_traffic?.value ?? baseline;
    const delay = inTraffic - baseline;                   // seconds
    const delayMinutes = Math.round(delay / 60);

    // console.log(
    //   `Fetched traffic data: baseline=${baseline}s, inTraffic=${inTraffic}s, delay=${delayMinutes}m`
    // );

    return { delayMinutes, baselineSeconds: baseline, inTrafficSeconds: inTraffic };
  } catch (err) {
    console.error("Error fetching traffic data:", err);
    // Fallback: assume no delay
    return { delayMinutes: 0, baselineSeconds: 0, inTrafficSeconds: 0 };
  }
}


export async function runTraffic(): Promise<number> {
  console.log('=== Running testTraffic ===');
  const { route } = ROUTE_CONFIGS[0];
  console.log(`Using route: ${route.origin} → ${route.destination}`);

  const data: TrafficData = await fetchTrafficData(route as Route);
  console.log('Fetched traffic data:', data);

  return data.delayMinutes;
  
}

if (require.main === module) {
  runTraffic().catch((err) => {
    console.error('❌ Error in runTestTraffic:', err);
    process.exit(1);
  });
}
