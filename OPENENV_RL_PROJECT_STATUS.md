# OPENENV_RL Project Status

## Overview
`OPENENV_RL` is currently a government workflow simulation project built around a custom environment named `GovWorkflowEnv`. The simulated task is real-world: handling citizen applications in a district/government office under deadlines, fairness constraints, limited staffing, document issues, and escalation budgets.

The project currently has three main layers:
- A Python simulation environment in `app/`
- A FastAPI wrapper in `app/main.py`
- A React + Vite frontend in `frontend/`

There is also a CLI baseline runner in `baseline_openai.py` that drives the environment directly or over HTTP.

## Current Working Progress
The project currently works at these levels:

### Backend / Environment
- The environment exists and is functional.
- It supports `reset()`, `step(action)`, and `state()`.
- It uses typed Pydantic models for observation, action, reward, metrics, and state.
- It exposes HTTP endpoints for session-based execution through FastAPI.
- It includes 3 tasks:
  - `district_backlog_easy`
  - `mixed_urgency_medium`
  - `cross_department_hard`
- It includes deterministic graders with scores in the `0.0` to `1.0` range.
- It includes a meaningful reward function with partial progress signals.

### CLI / Baseline
- `baseline_openai.py` can run the environment in direct mode or HTTP mode.
- It implements a 10-model fallback sequence for NVIDIA-hosted models.
- It produces reproducible seeded runs for the 3 tasks.
- It prints terminal-style step logs and final grader metrics.

### Frontend
- The frontend now acts as a minimal backend-driven simulation runner.
- It no longer calls external LLM APIs directly.
- It talks to the backend through `/api` proxied to `http://localhost:7860`.
- It supports:
  - selecting difficulty
  - entering step count
  - starting a run
  - resetting the session
  - viewing simple step-by-step output
  - viewing minimal KPIs like reward and backlog

### Important Current Limitation
The frontend does **not** currently have access to the same smart-agent logic as `baseline_openai.py`, because the backend does not expose a dedicated endpoint like `/agent/step` or `/run-smart-agent`. The CLI baseline runner contains that orchestration logic locally. The frontend therefore only drives the backend with explicit actions it chooses itself.

That means:
- CLI smart-agent behavior is more advanced than frontend behavior.
- Backend environment is solid.
- Frontend is now stable and minimal, but not yet feature-equivalent with the CLI smart-agent baseline.

## How the Project Works Currently

### Core Simulation Concept
The project simulates a government district office processing different service requests such as:
- birth certificates
- income certificates
- driving licenses
- passports
- GST registration
- caste certificates
- land registration

Each case moves through workflow stages:
- `submission`
- `document_verification`
- `field_verification`
- `approval`
- `issuance`

The environment models:
- incoming cases over time
- limited officers
- reserve officer allocation
- missing documents
- field verification requirements
- SLA deadlines
- fairness between services
- escalation budget

The agent must choose actions that improve completion, minimize breaches, use staff efficiently, and keep service fairness balanced.

### Action Flow
Supported actions are defined in `app/models.py`:
- `set_priority_mode`
- `assign_capacity`
- `request_missing_documents`
- `escalate_service`
- `advance_time`
- `reallocate_officers`

`advance_time` is the action that actually moves the environment forward and processes cases.

### Reward Flow
Rewards are computed in `app/reward.py` from:
- stage advances
- completions
- backlog size
- new SLA breaches
- fairness gap
- invalid actions
- idle capacity

This gives the project a dense reward signal instead of only a final pass/fail score.

### Grading Flow
After a run, the environment can be graded with task-specific deterministic graders in `app/graders.py`. These compute:
- completion rate
- SLA compliance
- document rework quality
- urgent served rate
- fairness score
- escalation discipline
- idle efficiency

The final score is bounded to `0.0` to `1.0`.

## API Contract
The backend API is implemented in `app/main.py`.

Base URL in current repo setup:
- Backend direct: `http://localhost:7860`
- Frontend proxy target: `/api` -> `http://localhost:7860`

### `GET /health`
Purpose:
- backend health/status
- available task list
- active session count

Response shape:
```json
{
  "status": "ok",
  "version": "string",
  "active_sessions": 0,
  "available_tasks": [
    "district_backlog_easy",
    "mixed_urgency_medium",
    "cross_department_hard"
  ]
}
```

### `POST /reset`
Purpose:
- create a new environment session

Request:
```json
{
  "task_id": "district_backlog_easy",
  "seed": 11,
  "options": {}
}
```

Response:
```json
{
  "session_id": "uuid",
  "observation": {
    "task_id": "district_backlog_easy",
    "day": 0,
    "max_days": 20,
    "priority_mode": "balanced",
    "officer_pool": {
      "allocations": {
        "birth_certificate": 2
      },
      "reserve_officers": 1
    },
    "queue_snapshots": [],
    "total_backlog": 0,
    "total_completed": 0,
    "total_sla_breaches": 0,
    "fairness_gap": 0.0,
    "escalation_budget_remaining": 3,
    "last_action_valid": true,
    "last_action_message": "reset"
  },
  "info": {
    "task_id": "district_backlog_easy",
    "seed": 11
  }
}
```

### `POST /step`
Purpose:
- execute one action in a session

Request:
```json
{
  "session_id": "uuid",
  "action": {
    "action_type": "advance_time"
  }
}
```

Response:
```json
{
  "session_id": "uuid",
  "observation": {},
  "reward": 1.25,
  "terminated": false,
  "truncated": false,
  "info": {
    "reward_breakdown": {
      "total_reward": 1.25,
      "progress_reward": 0.7,
      "completion_reward": 4.0,
      "waiting_penalty": 0.12,
      "sla_penalty": 0.0,
      "fairness_penalty": 0.0,
      "invalid_action_penalty": 0.0,
      "idle_capacity_penalty": 0.05
    },
    "newly_arrived_cases": 2,
    "newly_completed_cases": 1,
    "invalid_action": false,
    "grader_preview_score": 0.63,
    "notes": [
      "Advanced simulation by one day"
    ]
  }
}
```

### `POST /state`
Purpose:
- get the current full internal episode state

Request:
```json
{
  "session_id": "uuid",
  "include_action_history": false
}
```

Response:
```json
{
  "session_id": "uuid",
  "state": {
    "episode_id": "string",
    "seed": 11,
    "task_id": "district_backlog_easy",
    "day": 3,
    "terminated": false,
    "truncated": false,
    "total_steps": 3,
    "total_completed": 5,
    "total_backlog": 10,
    "total_sla_breaches": 1,
    "action_history_count": 3,
    "fairness_gap": 0.1,
    "escalation_budget_remaining": 2,
    "priority_mode": "balanced",
    "metrics": {},
    "action_history": []
  }
}
```

### `POST /grade`
Purpose:
- run deterministic grading for the current session

Request:
```json
{
  "session_id": "uuid"
}
```

Response:
```json
{
  "session_id": "uuid",
  "score": 0.72,
  "grader_name": "medium",
  "metrics": {
    "completion_rate": 0.7,
    "sla_compliance": 0.8
  }
}
```

### `GET /sessions`
Purpose:
- list active in-memory sessions

Response:
```json
{
  "active_sessions": 1,
  "session_ids": ["uuid"]
}
```

### `DELETE /sessions/{session_id}`
Purpose:
- delete a session

Response:
```json
{
  "deleted": "uuid"
}
```

## Frontend and Backend Working in Sync

### Current Sync Model
The frontend is a thin session runner over the backend:
1. User selects task difficulty and step count.
2. User clicks `Start`.
3. Frontend calls `POST /reset`.
4. Backend returns a `session_id` and initial observation.
5. Frontend stores `session_id` in Zustand store.
6. Frontend loops `POST /step` calls for the chosen number of steps.
7. Frontend updates logs, reward, backlog, and session state after each step.
8. Frontend calls `POST /grade` at the end.

### Isolation of Backend
The backend can work completely on its own:
- via FastAPI directly
- via the CLI baseline runner in HTTP mode
- via tests

The backend does not require the frontend to function.

### Isolation of Frontend
The frontend depends on the backend for all simulation data.
It cannot simulate the environment by itself because:
- it does not hold environment logic
- it does not own session state
- it does not include a real backend smart-agent endpoint

The frontend can render, but it cannot run meaningful simulations without the backend.

## File-by-File Responsibilities

### Root
- `README.md`
  - project overview, usage, architecture, environment description
- `baseline_openai.py`
  - baseline runner with model rotation and direct/http execution
- `openenv.yaml`
  - environment metadata/spec file
- `Dockerfile`
  - container build for backend + frontend assets
- `requirements.txt`
  - Python dependencies
- `pyproject.toml`
  - Python project config and pytest config
- `nvidia_models.txt`
  - model reference list
- `.env`
  - runtime environment variables

### `app/`
- `app/__init__.py`
  - package marker
- `app/models.py`
  - all typed Pydantic models and enums
- `app/tasks.py`
  - task definitions and lookup helpers
- `app/utils.py`
  - helper logic like priority sorting and fairness calculations
- `app/state_machine.py`
  - workflow transition rules
- `app/reward.py`
  - dense reward computation
- `app/graders.py`
  - deterministic task grading functions
- `app/env.py`
  - main simulation environment implementation
- `app/main.py`
  - FastAPI server and session store
- `app/config.py`
  - server and environment settings
- `app/baselines.py`
  - extra baseline-related logic/helpers

### `frontend/src/`
- `main.tsx`
  - React bootstrap
- `App.tsx`
  - router and high-level page structure

#### `frontend/src/api/`
- `client.ts`
  - Axios client with `/api` base path
- `hooks.ts`
  - React Query hooks for backend endpoints

#### `frontend/src/store/`
- `simulationStore.ts`
  - Zustand store for session state, logs, metrics, and run triggers

#### `frontend/src/components/`
- `TopBar.tsx`
  - minimal controls for task, steps, start, reset
- `LeftNav.tsx`
  - app navigation
- `RightDrawer.tsx`
  - session snapshot: last action, escalation budget, officer allocation, priority mode
- `TerminalConsole.tsx`
  - simplified output panel for frontend logs

#### `frontend/src/pages/`
- `AgentConsole.tsx`
  - current main simulation runner page
- `Dashboard.tsx`
  - current data summary page
- `Reports.tsx`
  - saved run history and comparison view
- `SessionAdmin.tsx`
  - backend health and session management
- `Timeline.tsx`
  - chart-based visualization page
- `ActionsLab.tsx`
  - legacy/manual page that is no longer aligned with the minimal runner direction

#### `frontend/src/types/`
- `index.ts`
  - frontend TypeScript interfaces mirroring backend models

#### `frontend/src/utils/`
- `index.ts`
  - formatting and label helpers

### `tests/`
- `test_env.py`
  - environment behavior tests
- `test_graders.py`
  - grader correctness tests
- `test_models.py`
  - typed model tests
- `test_tasks.py`
  - task validation
- `test_api.py`
  - API-level tests
- `test_10_models.py`
  - model availability/fallback tests
- `test_all_models.py`
  - broader model testing
- `test_baseline_repro.py`
  - baseline reproducibility test

## Compliance Gap Analysis

Below is a direct comparison between the current project and the requested compliance target.

### 1. Real-world task simulation
Status:
- Largely compliant

Why:
- The project simulates a real government-office workflow, not a toy/game.
- This clearly satisfies the “real-world task” requirement.

Gap:
- Minimal. The project already meets this requirement well.

Distance:
- `90%+ complete`

### 2. Full OpenEnv spec compliance
Status:
- Partially compliant

What is already present:
- typed models in `app/models.py`
- `reset()`
- `step()`
- `state()`
- `openenv.yaml`

What is still weak or missing:
- `openenv.yaml` may not be sufficient for strict `openenv validate`
- no proof in repo that `openenv validate` passes
- frontend and backend naming/contracts are project-specific, not clearly verified against the official validator
- Docker/static integration and spec packaging may still need alignment

Distance:
- `70% complete`

What still needs to be done:
- run official `openenv validate`
- adjust `openenv.yaml` to exact validator expectations
- verify model names, task metadata, reward schema, and environment entrypoint format

### 3. Minimum 3 tasks with agent graders
Status:
- Compliant

Why:
- There are 3 tasks.
- They range easy -> medium -> hard.
- Graders are deterministic and return `0.0` to `1.0`.

Distance:
- `95% complete`

Remaining work:
- better documentation of each grader’s exact pass/fail expectations

### 4. Meaningful reward function
Status:
- Compliant

Why:
- Reward includes progress, completion, backlog, SLA, fairness, invalid actions, and idle capacity.
- This is a dense and meaningful reward trajectory.

Distance:
- `90%+ complete`

Remaining work:
- document reward design more clearly in README

### 5. Baseline inference script
Status:
- Partially compliant

What exists:
- `baseline_openai.py`
- reproducible seeds
- task execution across all 3 tasks

Gap:
- It currently uses NVIDIA-hosted model orchestration, not the exact required OpenAI API client with `OPENAI_API_KEY`.

Distance:
- `60% complete`

What still needs to be done:
- either rewrite baseline runner to use OpenAI API directly
- or add a second compliant baseline script using OpenAI client
- read credentials from `OPENAI_API_KEY`
- document reproducible baseline scores in README

### 6. Hugging Face Spaces deployment
Status:
- Partially compliant

What exists:
- Dockerfile exists
- backend is designed around port `7860`
- frontend can be built and copied into container

Gap:
- Dockerfile references `.env.example`, which is not present in this repo
- FastAPI is not yet confirmed to serve frontend static files
- no confirmed Hugging Face Space config or tested deployment path
- frontend build/runtime integration is not fully proven

Distance:
- `50% complete`

What still needs to be done:
- fix Dockerfile
- mount/serve frontend static assets through FastAPI or separate static server
- test `docker build` and `docker run`
- verify Hugging Face Space behavior end-to-end
- add Space metadata/tagging for `openenv`

### 7. README quality
Status:
- Partially compliant

What exists:
- environment motivation
- task names
- action and observation descriptions
- setup instructions
- baseline runner command

Gap:
- frontend instructions are incomplete
- baseline scores are not clearly documented as stable benchmark outputs
- Docker/HF deployment instructions are incomplete
- compliance notes are not explicit

Distance:
- `70% complete`

What still needs to be done:
- add exact action/observation model fields
- add baseline score table
- add Docker instructions
- add Hugging Face Spaces instructions
- add frontend/backend run instructions together

## How Far Away Is the Project Overall?
Overall, the project is functionally strong in simulation design, task design, reward shaping, and grading. It is weaker in compliance packaging, deployment readiness, and official OpenEnv validation.

Approximate overall compliance readiness:
- Core environment design: `85%`
- API and typed model structure: `80%`
- OpenEnv packaging/validator readiness: `65%`
- Baseline compliance with required OpenAI client spec: `60%`
- HF Spaces deployment readiness: `50%`
- Documentation completeness: `70%`

Overall project readiness against the full compliance checklist:
- `around 70% complete`

## What Needs To Be Done Next

### High priority
1. Add or adapt a compliant OpenAI baseline runner using `OPENAI_API_KEY`
2. Validate the environment with official `openenv validate`
3. Fix Dockerfile so it builds and runs cleanly
4. Make FastAPI serve built frontend assets if container deployment requires a single service
5. Verify Hugging Face Space deployment end-to-end

### Medium priority
1. Clean or remove legacy frontend pages that no longer match the minimal runner direction
2. Document stable baseline scores in README
3. Add exact frontend/backend run instructions
4. Add more explicit spec mapping in README and `openenv.yaml`

### Important architecture gap
If you want the frontend to behave exactly like `baseline_openai.py`, the backend needs a server-side smart-agent execution path. Right now the smart orchestration lives in the CLI baseline runner, not in the backend API. Until that logic is exposed server-side, the frontend cannot be fully equivalent to the CLI smart agent without reintroducing client-side model calls, which is not desirable.

## Recommended Next Milestone
The cleanest next milestone is:
- keep backend environment as the source of truth
- move smart-agent orchestration from `baseline_openai.py` into a backend service layer
- expose one backend endpoint for smart-run execution
- keep frontend as a pure backend client

That would make the project:
- more secure
- easier to deploy
- closer to hackathon demo quality
- much closer to full OpenEnv/HF compliance
