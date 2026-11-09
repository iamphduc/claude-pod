// One fake pod run, in a neutral shape. Each variant maps this into its
// library's own data format (OTel spans, tool-call parts, approval props...).
// Times are ms offsets from the run start, so the demo can replay them.

export type Status = "done" | "running" | "blocked" | "needs-you" | "idle";

export type ToolCall = {
  id: string;
  name: string; // e.g. "Edit", "Bash", "Read"
  summary: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  start: number;
  end?: number; // undefined while running
  status: "running" | "success" | "error";
};

export type Agent = {
  id: string;
  role: "orchestrator" | "sprint-planner" | "engineer" | "reviewer";
  slice?: string; // engineers own a slice
  model: string;
  status: Status;
  start: number;
  end?: number;
  tokens: number;
  costUsd: number;
  tools: ToolCall[];
  children?: Agent[];
};

export type Decision = {
  id: string;
  kind: "merge-pr" | "question" | "continue";
  title: string;
  detail: string;
  options: [string, string]; // two quick answers, first is the primary
  agentId?: string;
};

export const run = {
  repo: "habit-tracker",
  plan: "Habit tracker with streaks and reminders",
  stage: "Sprint 2 · Wave 1",
  startedAt: "2026-11-09T09:12:00Z",
  durationMs: 1_164_000,
};

export const orchestrator: Agent = {
  id: "orch",
  role: "orchestrator",
  model: "opus",
  status: "running",
  start: 0,
  tokens: 48_210,
  costUsd: 0.92,
  tools: [
    {
      id: "o1",
      name: "Read",
      summary: "Read pod-docs/plans/habit-tracker.md",
      args: { file_path: "pod-docs/plans/habit-tracker.md" },
      result: "# Habit tracker\n4 sprints · Sprint 2: streaks and reminders",
      start: 2_000,
      end: 3_100,
      status: "success",
    },
  ],
  children: [
    {
      id: "planner",
      role: "sprint-planner",
      model: "opus",
      status: "done",
      start: 4_000,
      end: 212_000,
      tokens: 31_400,
      costUsd: 0.61,
      tools: [
        {
          id: "p1",
          name: "Write",
          summary: "Wrote pod-docs/sprints/sprint-2.md (3 slices, 1 wave)",
          args: { file_path: "pod-docs/sprints/sprint-2.md" },
          result: { slices: 3, waves: 1 },
          start: 180_000,
          end: 181_200,
          status: "success",
        },
      ],
    },
    {
      id: "eng-streaks",
      role: "engineer",
      slice: "Streak counter",
      model: "sonnet",
      status: "done",
      start: 220_000,
      end: 812_000,
      tokens: 92_870,
      costUsd: 1.38,
      tools: [
        {
          id: "e1a",
          name: "Edit",
          summary: "Added streak logic to src/habits/streak.ts",
          args: { file_path: "src/habits/streak.ts", lines_changed: 48 },
          result: "ok",
          start: 400_000,
          end: 401_500,
          status: "success",
        },
        {
          id: "e1b",
          name: "Bash",
          summary: "Ran the unit tests",
          args: { command: "pnpm vitest run src/habits" },
          result: "✓ 14 tests passed",
          start: 700_000,
          end: 712_400,
          status: "success",
        },
      ],
    },
    {
      id: "eng-reminders",
      role: "engineer",
      slice: "Daily reminders",
      model: "sonnet",
      status: "blocked",
      start: 220_000,
      tokens: 77_050,
      costUsd: 1.12,
      tools: [
        {
          id: "e2a",
          name: "Bash",
          summary: "Ran the notification tests",
          args: { command: "pnpm vitest run src/reminders" },
          error: "Notification permission is not granted in the test browser",
          start: 930_000,
          end: 941_000,
          status: "error",
        },
      ],
    },
    {
      id: "eng-ui",
      role: "engineer",
      slice: "Streak badge UI",
      model: "sonnet",
      status: "running",
      start: 220_000,
      tokens: 64_300,
      costUsd: 0.97,
      tools: [
        {
          id: "e3a",
          name: "Edit",
          summary: "Editing src/components/StreakBadge.tsx",
          args: { file_path: "src/components/StreakBadge.tsx" },
          start: 1_150_000,
          status: "running",
        },
      ],
    },
  ],
};

export const decisions: Decision[] = [
  {
    id: "d1",
    kind: "question",
    title: "Daily reminders is blocked",
    detail: "Tests can't grant notification permission. Mock the Notification API, or skip the browser check for this slice?",
    options: ["Mock the API", "Skip the check"],
    agentId: "eng-reminders",
  },
  {
    id: "d2",
    kind: "merge-pr",
    title: "Merge PR #42 · Streak counter",
    detail: "14 tests pass. 3 files changed, +148 −12.",
    options: ["Merge", "Open on GitHub"],
    agentId: "eng-streaks",
  },
  {
    id: "d3",
    kind: "continue",
    title: "pod is waiting to start Wave 2",
    detail: "Send continue to the run's Claude session, or turn on Auto-continue.",
    options: ["Continue", "Auto-continue"],
  },
];
