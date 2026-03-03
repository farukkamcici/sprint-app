# AI Gateway Contracts

All LLM interactions flow through a dedicated gateway service.
The mobile app never calls an LLM provider directly.
The gateway is provider-agnostic — provider can be swapped without mobile changes.

---

## Authentication

All gateway endpoints require a valid Supabase JWT in the `Authorization` header.

```
Authorization: Bearer <supabase_access_token>
```

The gateway validates the token with Supabase and extracts `user_id`.
Requests without a valid token return `401 Unauthorized`.

---

## Base URL

```
{GATEWAY_BASE_URL}/api
```

Separate deployments per environment (dev, production).

---

## Session Types

| Type              | Key                | Time Limit | Message Cap | Tier |
|-------------------|--------------------|------------|-------------|------|
| Story Session     | `story`            | 60 min     | None        | PRO  |
| Sprint Planning   | `sprint_planning`  | 8 min      | None        | PRO  |
| Day 1 Calibration | `calibration`      | 5 min      | None        | PRO  |
| Sprint End Review | `sprint_review`    | 10 min     | None        | PRO  |
| Weekly Meeting    | `weekly_meeting`   | 15 min     | None        | PRO  |

---

## Endpoints

### POST /api/sessions

Create a new AI session.

**Request:**

```typescript
interface CreateSessionRequest {
  type: "story" | "sprint_planning" | "calibration" | "sprint_review" | "weekly_meeting";
  sprint_id?: string; // required for sprint_planning, calibration, sprint_review
  context?: {
    operational_profile?: OperationalProfile;
    sprint_rules?: SprintRule[];
    completion_data?: DailyCheckSummary[];
    daily_entries?: string[];
  };
}
```

**Response (201):**

```typescript
interface CreateSessionResponse {
  session_id: string;
  type: SessionType;
  time_limit_minutes: number;
  expires_at: string; // ISO 8601
  status: "active";
}
```

**Errors:**

| Code | Condition                              |
|------|----------------------------------------|
| 401  | Invalid or missing token               |
| 403  | User not PRO tier                      |
| 409  | Active session already exists for user |
| 429  | Rate limit exceeded                    |

---

### POST /api/sessions/:id/messages

Send a message within an active session.

**Request:**

```typescript
interface SendMessageRequest {
  content: string;
}
```

**Response (200):**

```typescript
interface SendMessageResponse {
  message_id: string;
  role: "assistant";
  content: string;
  session_status: "active" | "expiring_soon";
  remaining_seconds: number;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

**Errors:**

| Code | Condition                        |
|------|----------------------------------|
| 401  | Invalid or missing token         |
| 403  | Session does not belong to user  |
| 404  | Session not found                |
| 410  | Session expired or ended         |
| 429  | Rate limit exceeded              |

---

### POST /api/sessions/:id/end

End a session and receive structured output.

**Request:**

```typescript
interface EndSessionRequest {
  reason: "user_ended" | "time_expired";
}
```

**Response (200):**

```typescript
interface EndSessionResponse {
  session_id: string;
  type: SessionType;
  status: "completed" | "expired";
  duration_seconds: number;
  total_tokens: number;
  output: SessionOutput;
}
```

**Session Output Types:**

```typescript
// Story Session output
interface StorySessionOutput {
  type: "story";
  operational_profile: {
    operational_traits: string[];
    sustainable_rule_capacity: number;
    priority_areas: string[];
    behavioral_triggers: string[];
    tone_preference: string;
  };
  sprint_recommendations: {
    suggested_rules: SuggestedRule[];
    rationale: string;
  };
}

// Sprint Planning output
interface SprintPlanningOutput {
  type: "sprint_planning";
  sustainability_assessment: string;
  suggested_adjustments: SuggestedRule[];
  balance_notes: string;
}

// Calibration output
interface CalibrationOutput {
  type: "calibration";
  optimized_rules: SuggestedRule[];
  rationale: string;
}

// Sprint Review output
interface SprintReviewOutput {
  type: "sprint_review";
  performance_summary: string;
  completion_analysis: {
    rule_title: string;
    completion_rate: number;
    observation: string;
  }[];
  next_sprint_suggestions: SuggestedRule[];
}

// Weekly Meeting output
interface WeeklyMeetingOutput {
  type: "weekly_meeting";
  summary: string;
  action_items: string[];
}

// Shared
interface SuggestedRule {
  title: string;
  type: "binary" | "numeric";
  target_value?: number;
  rationale: string;
}
```

---

### GET /api/sessions/:id

Get session status.

**Response (200):**

```typescript
interface GetSessionResponse {
  session_id: string;
  type: SessionType;
  status: "active" | "completed" | "expired";
  started_at: string;
  expires_at: string;
  remaining_seconds: number;
  total_tokens: number;
}
```

---

### GET /api/usage

Get token usage summary for the authenticated user.

**Response (200):**

```typescript
interface UsageResponse {
  user_id: string;
  current_period: {
    start_date: string;
    total_tokens: number;
    session_count: number;
    by_type: Record<SessionType, { tokens: number; count: number }>;
  };
}
```

---

## Rate Limiting

| Scope              | Limit                          |
|---------------------|-------------------------------|
| Sessions per hour   | 3                             |
| Sessions per day    | 10                            |
| Messages per minute | 15                            |
| Concurrent sessions | 1                             |

Rate limit responses return `429` with:

```typescript
interface RateLimitResponse {
  error: "rate_limit_exceeded";
  retry_after_seconds: number;
}
```

---

## Time Enforcement

- The gateway tracks session start time server-side.
- Each message request checks remaining time before processing.
- When time expires, the gateway auto-ends the session.
- The `remaining_seconds` field is included in every message response.
- Client should display a countdown and warn at 60 seconds remaining.

---

## Provider Abstraction

The gateway implements a provider interface:

```typescript
interface LLMProvider {
  chat(params: {
    messages: ChatMessage[];
    system_prompt: string;
    max_tokens: number;
    temperature: number;
  }): Promise<{
    content: string;
    usage: { prompt_tokens: number; completion_tokens: number };
  }>;
}
```

Provider is configured via gateway environment variables.
No provider details are exposed to the mobile client.

---

## System Prompts

Each session type has a dedicated system prompt managed server-side.
System prompts are not sent from the mobile client.
The gateway selects the prompt based on session type and injects context.

---

## Error Format

All errors follow:

```typescript
interface GatewayError {
  error: string;
  message: string;
  status: number;
}
```
