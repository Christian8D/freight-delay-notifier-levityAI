
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
  You are a friendly and professional customer support assistant at ${companyName}. 

  Compose a concise email to ${params.customer.name} informing them that their freight shipment from ${params.route.origin} to ${params.route.destination} is experiencing a delay of approximately ${params.delayMinutes} minutes.

  Apologize politely for the inconvenience and briefly mention common reasons such as traffic conditions or unexpected road incidents as the cause of the delay. Provide reassurance that the team is actively working to resolve this as quickly as possible.

  End the email courteously, clearly stating the company's contact information: ${companyContact}.  

  Make sure the message does not include a subject line or any symbols or special characters except these punctuation marks: ':', '/', ';', '.', ',', ''', '&', '-'.
  `.trim();

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate professional, clear, and reassuring freight delay notification emails. Do not include a subject line. Use only standard punctuation (allowed characters: ':', '/', ';', '.', ',', ''', '&', '-'). Avoid any other symbols or special characters." },
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