
import OpenAI from "openai";
import type { Route } from "./traffic";
import { ROUTE_CONFIGS } from '../config';
import type { Customer } from "../workflows/delayNotifications";
import { companyName, companyContact } from "../config";


export interface AIParams {
  route: Route;
  delayMinutes: number;
  customer: { name: string; email: string; phone?: string };
}

export async function generateMessage(params: AIParams): Promise<string> {


  // console.log('[DEBUG][AI] params:', params);
  // const prompt = `
  //   …is delayed by ${params.delayMinutes} minutes.
  //   …
  // `;
  // console.log('[DEBUG][AI] prompt:', prompt.trim());



  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.warn("No OPENAI_API_KEY, using fallback message");
    return fallback(params);
  }

  try {
    const openai = new OpenAI({ apiKey: key });


    const prompt = `
You are a helpful assistant at ${companyName} (contact: ${companyContact}).
Write a friendly, professional, yet short email to ${params.customer.name} Make sure you don't include a Subject: Line, and inform them that their freight from
${params.route.origin} to ${params.route.destination}
is delayed by ${params.delayMinutes} minutes.
Apologize for the inconvenience, explain briefly why the delay happened, reassure them,
and sign off with ${companyName}’s name and contact info.
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Your job is to generate courteous customer notifications." },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.7,
    });

    const msg = resp.choices[0].message.content || fallback(params);
    console.log("AI message generated.");
    return msg;
  } catch (err) {
    console.error("OpenAI API error:", err);
    return fallback(params);
  }
}

function fallback({ customer, route, delayMinutes }: AIParams) {

  return `
Dear ${customer.name},

We wanted to let you know that your freight delivery from
${route.origin} to ${route.destination}
is currently delayed by approximately ${delayMinutes} minutes.
We apologize for the inconvenience and are working to get it back on schedule.

Thank you for your patience.

Best regards,  
${companyName}  

Contact: ${companyContact}
`;
}

export async function runAI(delayMinutes: number): Promise<string> {
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
    runAI(45).catch((err) => {
        console.error('❌ Error in runTestAI:', err);
        process.exit(1);
    });
}