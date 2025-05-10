import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { ROUTE_CONFIGS, FROM_EMAIL} from "../config";
import { runAI } from "./ai";
import { runTraffic } from "./traffic";

dotenv.config();

export interface NotificationParams {
  customer: { name: string; email: string; phone?: string };
  message: string;
}

export async function sendNotification(params: NotificationParams): Promise<void> {
  const key = process.env.SENDGRID_API_KEY;
  const from = FROM_EMAIL;
  if (!key || !from) {
    throw new Error("Missing SENDGRID_API_KEY or FROM_EMAIL");
  }

  sgMail.setApiKey(key);
  const msg = {
    to: params.customer.email,
    from,
    subject: "🚚 Freight Delivery Delay Notification",
    text: params.message,
  };

  try {
    await sgMail.send(msg);
    console.log(`Notification sent to ${params.customer.email}`);
  } catch (err) {
    console.error("SendGrid error:", err);
    throw err;
  }
}


export async function runNotification(): Promise<void> {
  console.log('=== Running runNotification ===');

  const { customer } = ROUTE_CONFIGS[0];

  // Fetch current delay
  const delayMinutes = await runTraffic();

  // Generate AI message based on the real delay
  const msg = await runAI(delayMinutes);

  // Send the notification
  await sendNotification({ customer, message: msg });

  console.log('AI result:\n', msg);
  console.log(`Notification sent to ${customer.email}`);
}

// Run directly if invoked as a script
if (require.main === module) {
  runNotification().catch((err) => {
    console.error('❌ Error in runTestNotification:', err);
    process.exit(1);
  });
}
