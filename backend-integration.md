# Backend–Frontend Integration Guide

This document summarizes the FastAPI backend so you can wire a frontend quickly and correctly. It focuses on the HTTP contract, payload shapes, and the lifecycle of a simulation session.

## Core Concepts
- **Session**: Created via `POST /reset`; identified by `session_id`. Stored in-memory FIFO; oldest is evicted after `max_sessions`.
- **Environment**: `GovWorkflowEnv` drives the simulation. One env per session.
- **Task presets**: Three scenarios (`district_backlog_easy`, `mixed_urgency_medium`, `cross_department_hard`) defined in `app/tasks.py`.
- **Actions**: Encoded by `ActionModel`; drive `step()` transitions and rewards.
- **Grader**: Deterministic scoring in `app/graders.py` to produce a 0–1 score plus metric breakdown.

## API Surface (FastAPI in `app/main.py`)
All endpoints are JSON. CORS is enabled (see `CORSMiddleware`), so browser calls are allowed.

### 1) Health
- `GET /health` → `{status, version, active_sessions, available_tasks}`
  - Use to show backend status and task list.

### 2) Create Session
- `POST /reset`
```json
{
  "task_id": "district_backlog_easy",   // optional, defaults to env_settings.default_task_id
  "seed": 11,                           // optional, omit for task default
  "options": { "task_id": "..." }       // optional pass-through to env.reset
}
```
Response
```json
{
  "session_id": "uuid",
  "observation": { ...ObservationModel },
  "info": { "task_id": "...", "seed": 11 }
}
```
Notes
- Each reset creates a fresh env. Store `session_id` client-side.

### 3) Step Simulation
- `POST /step`
```json
{
  "session_id": "uuid",
  "action": {
    "action_type": "set_priority_mode" | "assign_capacity" | "request_missing_documents" | "escalate_service" | "advance_time" | "reallocate_officers",
    "priority_mode": "balanced|urgent_first|oldest_first|backlog_clearance",
    "service": "passport|driving_license|gst_registration|income_certificate|caste_certificate|birth_certificate|land_registration",
    "target_service": "...",           // used for reallocate_officers
    "case_id": "string",               // optional for specific case operations
    "officer_delta": 0                 // positive integer when assigning/reallocating
  }
}
```
Response
```json
{
  "session_id": "uuid",
  "observation": { ...ObservationModel },
  "reward": 1.23,
  "terminated": false,
  "truncated": false,
  "info": { ...StepInfoModel }
}
```
Errors
- `404` if session missing (ask user to reset).
- `409` if episode already ended (terminated or truncated).

### 4) Get State Snapshot
- `POST /state`
```json
{ "session_id": "uuid", "include_action_history": false }
```
Response
```json
{ "session_id": "uuid", "state": { ...EpisodeStateModel } }
```
- Set `include_action_history: true` to get full step log (larger payload).

### 5) Grade Current Episode
- `POST /grade`
```json
{ "session_id": "uuid" }
```
Response
```json
{ "session_id": "uuid", "score": 0.78, "grader_name": "easy|medium|hard", "metrics": { ... } }
```

### 6) Session Admin
- `GET /sessions` → `{ active_sessions, session_ids }`
- `DELETE /sessions/{id}` → `{ deleted: "id" }` or `404`

## Data Models (client-facing)
- **ObservationModel** (from `/reset` or `/step`):
  - `task_id`, `day`, `max_days`, `priority_mode`, `officer_pool {allocations, reserve_officers}`, `queue_snapshots[]` (per service counts of stages, missing docs, escalated, urgent, breaches, avg_age_days), `total_backlog`, `total_completed`, `total_sla_breaches`, `fairness_gap`, `escalation_budget_remaining`, `last_action_valid`, `last_action_message`.
- **StepInfoModel**:
  - `reward_breakdown {total_reward, progress_reward, completion_reward, waiting_penalty, sla_penalty, fairness_penalty, invalid_action_penalty, idle_capacity_penalty}`
  - `newly_arrived_cases`, `newly_completed_cases`, `invalid_action`, `grader_preview_score`, `notes[]`.
- **EpisodeStateModel** (from `/state`):
  - Adds `episode_id`, `seed`, `terminated`, `truncated`, `total_steps`, `metrics {totals...}`, `fairness_gap`, `priority_mode`, `escalation_budget_remaining`, `action_history` (optional).

## Typical Client Flow
1. `GET /health` to populate task selector and show server status.
2. `POST /reset` (task + optional seed) → store `session_id`, render initial observation.
3. Loop: user clicks “step” or auto-loop:
   - Build `action` JSON, `POST /step`.
   - Update charts/cards from `observation` and `info.reward_breakdown`.
   - Stop if `terminated` or `truncated`, then call `/grade` for final score.
4. On reload or mismatch, call `/sessions` to show/clean stale sessions.

## Wiring Tips
- Always send `session_id` with step/state/grade calls.
- Respect 409: if episode ended, prompt user to reset.
- For large histories, keep `include_action_history=false` during live runs; fetch true on demand for report view.
- Enum fields are lowercase strings; keep them as-is to avoid validation errors.
- CORS already enabled; standard `fetch`/`axios` works in browser.

## Mock Payload Seeds (good for UI dev without backend)
- Use task defaults from `app/tasks.py`:
  - easy seed 11, medium seed 22, hard seed 33.
- Create fixture JSON from ObservationModel/StepResponse to drive charts while offline.

## Where to Look in Code (if you need to extend)
- Session handling: `app/main.py` (`_SessionStore`, endpoints).
- Environment logic: `app/env.py` (reset/step, rewards, fairness gap).
- Reward math: `app/reward.py`.
- Grading: `app/graders.py`.
- Tasks: `app/tasks.py`.

This should be enough to connect UI components to the backend and to stub realistic fixtures while designing the frontend. 
