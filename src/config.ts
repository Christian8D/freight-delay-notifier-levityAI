// src/config.ts
import type { RouteConfig } from './workflows/monitorWorkflow';

/* -------------------------------------------------------------------------- */
/*  Tuning knobs (edit here, no code changes required elsewhere)               */
/* -------------------------------------------------------------------------- */


export const companyName = 'Levity.ai';
export const companyContact = '555-555-5555';
export const FROM_EMAIL="hire@christianc.dev"


//** The Temporal queue name where workers listen for tasks.*/
export const TASK_QUEUE = 'FreightMonitorQueue';

/** Global threshold for initial alert (minutes of delay tolerance) REMOVE THE "-" symbol to get real traffic gains */
export const GLOBAL_THRESHOLD = 30;



/** Additional minutes before we say the delay has “worsened” */
export const DELTA_JUMP_MIN   = 15;


/** Max silent period before sending an update (minutes) */
export const MAX_QUIET_MIN    = 60;


/** Margin below threshold that counts as “cleared”  */
export const CLEAR_MARGIN_MIN = 30;


/** Poll Google Maps every N minutes */
export const POLL_INTERVAL_MIN = .5;



// Change the Delivery Details here 


export const Origin_1 = 'Neuschwansteinstraße 20, 87645 Schwangau';
export const Destination_1 = 'Stuttgart';
export const Customer_1 = { name: 'Christian C', email: 'hire@christianc.dev', phone: '+49 123 456789' };
export const TASK_COMPLETED_TIMER_1= 1;

export const Origin_2 = 'Bielkenhagen 10, 18439 Stralsund';
export const Destination_2 = 'Munich';
export const Customer_2 = { name: 'Manny M', email: 'hire@christianc.dev', phone: '+49 123 456789' };
export const TASK_COMPLETED_TIMER_2= 2;

export const Origin_3 = 'Unter den Linden 10, 10117 Berlin';
export const Destination_3 = 'Berlin';
export const Customer_3 = { name: 'Leo M', email: 'hire@christianc.dev', phone: '+49 123 456789' };
export const TASK_COMPLETED_TIMER_3= 3;


// NEW Delivery Details example:

// export const Origin_4 = 'New Origin 4';
// export const Destination_4 = 'New Destination 4';
// export const Customer_4 = { name: 'Jon Doe', email: 'JonDoe@example.com' };


/* -------------------------------------------------------------------------- */
/*  Job list                                                                   */
/* -------------------------------------------------------------------------- */

export interface JobConfig extends RouteConfig { job_id: number, taskCompletedTimer: number;  }

export const ROUTE_CONFIGS: JobConfig[] = [
  {
    job_id: 1,
    route: {
      origin: Origin_1,
      destination: Destination_1,
    },
    threshold: GLOBAL_THRESHOLD,
    customer: Customer_1,
    taskCompletedTimer: TASK_COMPLETED_TIMER_1,
    },
    {
    job_id: 2,
    route: {
        origin: Origin_2,
        destination: Destination_2,
    },
    threshold: GLOBAL_THRESHOLD,
    customer: Customer_2,
    taskCompletedTimer: TASK_COMPLETED_TIMER_2,
    },
    {
    job_id: 3,
    route: {
        origin: Origin_3,
        destination: Destination_3,
        },
    threshold: GLOBAL_THRESHOLD,
    customer: Customer_3,
    taskCompletedTimer: TASK_COMPLETED_TIMER_3,
    },
    // {
    // job_id: 4,
    // route: {
    //     origin: Origin_4,
    //     destination: Destination_4,
    //     },
    // threshold: GLOBAL_THRESHOLD,
    // customer: Customer_4,
    // },
];


