import 'dotenv/config';
import { generateMessage } from '../activities/ai';
import {Route, Customer} from '../workflows/delayNotifications';
import { ROUTE_CONFIGS } from '../config';

export async function runTestAI(delayMinutes: number): Promise<string> {
    console.log('=== Running testAI ===');
    const { route, customer } = ROUTE_CONFIGS[0];
    const msg = await generateMessage({
        route: route as Route,
        delayMinutes,
        customer: customer as Customer,
    });
    console.log('AI result:\n', msg);
    return msg;
}

if (require.main === module) {
    runTestAI(45).catch((err) => {
        console.error('❌ Error in runTestAI:', err);
        process.exit(1);
    });
}
