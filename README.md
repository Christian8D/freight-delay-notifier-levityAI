
<!-- <div align="center"style="text-align: center;">
<img src="https://christianc.dev/wp-content/uploads/2025/05/Screenshot-2025-05-10-at-19.25.12.png" width="400" alt="Temporal Logo"  style="display: block; margin: 0 auto;"  />
<img src="https://christianc.dev/wp-content/uploads/2025/05/LevityAi.png" width="300" alt="Temporal Logo"  style="display: block; margin: 0 auto;"  />


</div> -->

<div align="center" style="text-align: center;">
   <img src="https://christianc.dev/wp-content/uploads/2024/11/Screen-Shot-2024-11-18-at-9.28.15-PM.svg" width="800" alt="Overlay Image" style="position: absolute; top: 0; left: 50%; transform: translateX(50%);" />

<img src="https://framerusercontent.com/images/qFTSfYBH5aoyhySaMO3zaAfVo.png" width="200" alt="Background Image" style="display: block; width: 40%;" /> 
 
</div>

# Freight Delay Notification System 🚚

An end‑to‑end TypeScript / Temporal demo that monitors live road traffic for predefined freight routes and notifies customers by email when shipments are delayed.

Powered by:

* **Google Maps Directions API** – real‑time ETA and traffic data
* **OpenAI GPT‑4o-mini** – generates polite, context‑rich customer messages
* **SendGrid** – delivers the email
* **Temporal** – orchestrates long‑running workflows, polling, retries and timing

## Table of contents

1. [Architecture](#architecture)
2. [Repository layout](#repository-layout)
3. [Getting started](#getting-started)
4. [Configuration](#configuration)
5. [Scripts & tasks](#scripts)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Architecture

```mermaid
sequenceDiagram
    participant CLI as index.ts
    participant WF as monitorWorkflow
    participant Maps as Google Maps
    participant OpenAI
    participant SendGrid

    CLI->>WF: start / schedule
    loop every 5 min
        WF->>Maps: ETA with traffic
        alt delay >= threshold
            WF->>OpenAI: draft email
            OpenAI-->>WF: content
            WF->>SendGrid: send email
        end
    end
```

Each job (route) runs as its own perpetual workflow instance and follows the loop above. Temporal makes the polling and retry logic fault‑tolerant and horizontally scalable.

## Repository layout

```text
├── launch.json               # VSCode debug configuration
├── package-lock.json         # NPM lockfile
├── package.json              # Project metadata and dependencies
├── README.md                 # Project documentation
├── src
│   ├── activities/           # OpenAI, SendGrid calls, Google Maps
│   │   ├── ai.ts
│   │   ├── notifications.ts
│   │   └── traffic.ts        
│   ├── config.ts             # Config for tuning thresholds, origins, etc.
│   ├── index.ts              # Entry point: schedules workflows
│   ├── tests/                # Test scripts (manual tests)
│   │   ├── testAI.ts
│   │   ├── testNotif.ts
│   │   ├── testTraffic.ts
│   │   └── testWorkflow.ts
│   ├── worker.ts             # Worker registration and runner
│   └── workflows/            # Temporal workflow logic
│       ├── delayNotifications.ts
│       ├── index.ts
│       └── monitorWorkflow.ts
├── tsconfig.json             # TypeScript configuration
└── your_temporal.db          # SQLite DB used by Temporal server
```

## Getting started

\### 1. Prerequisites

* Node.js >= 18
* A running Temporal server (e.g., `docker‑compose up` from the official samples)
* Alternatively, you can run brew install temporal and start the Temporal server locally (for testing and development purposes only).
* API keys: Google Maps, OpenAI, SendGrid

\### 2. Install

```bash
git clone <repo>
cd freight-delay-monitor
npm install
```

\### 3. Environment variables Create a `.env` file at the repo root:

```bash
OPENAI_API_KEY=<your key>
SENDGRID_API_KEY=<your key>
GOOGLE_MAPS_API_KEY=<your key>
```
\### 4. 👉 Install via Homebrew (Mac / Linux):

```bash
brew install temporal
temporal --version
temporal server start-dev
```
\### 5. You should see logs like:

```bash
Temporal server started.
Namespace default registered.
```

\### 6. Build & run

```bash
# compile TypeScript
npm run build

# start worker + schedule workflows
npm start
```

Logs will show one worker poller and one workflow scheduled per entry in `src/config.ts`.

## Configuration

## `src/config.ts`

The `config.ts` file is the **central place** to define all key parameters, routes, and customers for the freight monitoring system. You can customize it without touching any other part of the codebase.

---


* `TASK_QUEUE`: The Temporal **queue name** where workers listen for tasks. Default: `'FreightMonitorQueue'`.


### 🚦 Tuning knobs

| Constant            | Description                                                                                                                 | Default |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| `TASK_QUEUE`  | The Temporal **queue name** where workers listen for tasks. | Default: `'FreightMonitorQueue'`.  |
| `GLOBAL_THRESHOLD`  | The minimum delay (in minutes) before sending an alert. **⚠️ Important:** Remove the `-` sign to track real traffic delays. | `-25`   |
| `DELTA_JUMP_MIN`    | The extra delay (minutes) needed to consider the delay as “worsened” and send an updated notification.                      | `1`     |
| `MAX_QUIET_MIN`     | The maximum time (minutes) the workflow waits before sending a fresh update, even if the delay hasn't changed much.         | `3`     |
| `CLEAR_MARGIN_MIN`  | When delays drop below `(threshold - this margin)`, the delay is considered “cleared.”                                      | `3`     |
| `POLL_INTERVAL_MIN` | How often (in minutes) the system polls Google Maps for new traffic data.                                                   | `5`     |
| `ROLL_OVER_HOURS`   | Workflow rollover interval to keep Temporal histories small (hours).                                                        | `4`     |

---

### 🗺 Routes & Customers

Example predefined **origins**, **destinations**, and customers:

| Job ID | Origin Address                           | Destination | Customer Name | Customer Email                                                  |
| ------ | ---------------------------------------- | ----------- | ------------- | --------------------------------------------------------------- |
| 1      | Neuschwansteinstraße 20, 87645 Schwangau | Stuttgart   | Christian C   | [christian.cosio1@gmail.com](mailto:christian.cosio1@gmail.com) |
| 2      | Bielkenhagen 10, 18439 Stralsund         | Munich      | Manny M       | [christian.cosio1@gmail.com](mailto:christian.cosio1@gmail.com) |
| 3      | Unter den Linden 10, 10117 Berlin        | Berlin      | Leo M         | [christian.cosio1@gmail.com](mailto:christian.cosio1@gmail.com) |

To **add new routes, origins and custumers**, simply append to the `src/config.ts` array:

```ts

export const Origin_4 = 'New Origin 4';
export const Destination_4 = 'New Destination 4';
export const Customer_4 = { name: 'Jon Doe', email: 'JonDoe@example.com' };



 {
    job_id: 4,
    route: {
        origin: Origin_4,
        destination: Destination_4,
        },
    threshold: GLOBAL_THRESHOLD,
    customer: Customer_4,
    },
```


---

✅ **Pro Tip:**

* To **disable a job**, simply comment it out in `ROUTE_CONFIGS`.
* To **adjust sensitivity**, change `GLOBAL_THRESHOLD` and rerun your workflows.

This file is designed for **easy customization**—no code elsewhere needs changes when you modify routes, customers, or thresholds.

* **.env** for secret keys

## Scripts

`package.json` exposes handy aliases:

* `npm run worker` – start just the worker
* `npm run start` – worker + job scheduler
* `npm run test:traffic` / `test:ai` / `test:notif` – run individual module tests
* `npm run test:workflow` – run Temporal workflow tests (uses @temporalio/testing)

## Testing

Tests are written with Jest and nock for HTTP mocking. To execute all:

```bash
npm test
```

## Troubleshooting

* **No emails arriving?** Check SendGrid dashboard activity and verify `FROM_EMAIL` in `notifications.ts`.
* \`\` errors – ensure `.env` is loaded or environment is passed to your process manager.
* **Workflow "already started"** messages on restart are expected and benign – each job reuses its `workflowId`.

## License

MIT © 2025 Christian Cosio