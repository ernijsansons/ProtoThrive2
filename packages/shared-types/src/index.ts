export type AgentMode = "single" | "fallback" | "ensemble";

export interface AgentBudget {
  default: number;
  max: number;
  fallbackMin: number;
}

export interface AgentCostSummary {
  estimate: number;
  actual: number;
  remaining: number;
}

export interface AgentCostDetail extends AgentCostSummary {
  consumed: number;
}

export type AgentName = "enterprise" | "lightweight" | "fallback";

export interface AgentTraceItem {
  agent: AgentName;
  success: boolean;
  confidence: number;
  cost: number;
  error?: string;
  reportUrl?: string;
}

export interface AgentRunRequest {
  task: string;
  context?: Record<string, unknown>;
  budget?: number;
  mode?: AgentMode;
  metadata?: Record<string, unknown>;
}

export interface AgentRunResult {
  runId: string;
  task: string;
  mode: AgentMode;
  confidence: number;
  output: unknown;
  cost: AgentCostDetail;
  trace: AgentTraceItem[];
  fallbackUsed: boolean;
  budgetConsumed: number;
  budgetRemaining: number;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type RoadmapStatus = "draft" | "active" | "completed" | "archived";

export interface RoadmapPayload {
  jsonGraph: string;
  vibeMode?: boolean;
  status?: RoadmapStatus;
}

export interface RoadmapSummary extends RoadmapPayload {
  id: string;
  userId: string;
  thriveScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapQueryParams {
  limit?: number;
  offset?: number;
  status?: RoadmapStatus;
  category?: string;
}

export interface SnippetPayload {
  category: string;
  code: string;
  uiPreviewUrl?: string;
}

export interface InsightPayload {
  roadmapId: string;
  type: "performance" | "usage" | "quality" | "cost";
  data: string;
  score: number;
}
