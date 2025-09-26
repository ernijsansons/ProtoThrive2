/**
 * TypeScript type definitions for ProtoThrive
 * Ref: CLAUDE.md - Comprehensive type safety
 */

// Core domain types
export interface User {
  id: string;
  email: string;
  role: 'vibe_coder' | 'engineer' | 'exec' | 'admin';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultView: '2d' | '3d';
  notifications: boolean;
  autoSave: boolean;
  language: string;
  timezone: string;
}

// Roadmap and graph types
export interface Node {
  id: string;
  label: string;
  status: 'gray' | 'neon' | 'completed' | 'failed' | 'pending';
  position: Position3D;
  type?: 'default' | 'ui' | 'code' | 'deploy' | 'milestone';
  data?: NodeData;
  metadata?: Record<string, unknown>;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface NodeData {
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  dependencies?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface Edge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  type?: 'default' | 'dependency' | 'milestone' | 'blocker';
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  metadata?: GraphMetadata;
}

export interface GraphMetadata {
  version: string;
  created_at: string;
  updated_at: string;
  layout?: 'force' | 'hierarchical' | 'circular' | 'grid';
  zoom?: number;
  viewport?: { x: number; y: number };
}

export interface Roadmap {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  json_graph: Graph;  // Always use Graph type, parse JSON string when needed
  status: 'draft' | 'active' | 'completed' | 'archived' | 'paused';
  vibe_mode: boolean;
  thrive_score: number;
  visibility: 'private' | 'team' | 'public';
  tags?: string[];
  collaborators?: string[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Helper type for raw API responses
export interface RawRoadmap extends Omit<Roadmap, 'json_graph'> {
  json_graph: string;  // JSON string from API
}

// Code snippet types
export interface Snippet {
  id: string;
  title?: string;
  category: string;
  code: string;
  language?: string;
  ui_preview_url?: string;
  version: number;
  description?: string;
  tags?: string[];
  author_id?: string;
  is_public: boolean;
  download_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SnippetCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  color?: string;
}

// AI and automation types
export interface AgentLog {
  id: string;
  roadmap_id: string;
  task_type: string;
  task_description?: string;
  output: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'timeout' | 'cancelled';
  model_used: 'kimi' | 'claude' | 'uxpilot' | 'gpt-4' | 'local';
  token_count: number;
  cost?: number;
  execution_time?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface AITask {
  id: string;
  type: 'code_generation' | 'ui_design' | 'analysis' | 'optimization' | 'testing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: AITaskInput;
  output?: AITaskOutput;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface AITaskInput {
  prompt: string;
  context?: Record<string, unknown>;
  parameters?: AITaskParameters;
  constraints?: string[];
}

export interface AITaskOutput {
  result: string;
  confidence?: number;
  alternatives?: string[];
  metadata?: Record<string, unknown>;
  artifacts?: Artifact[];
}

export interface AITaskParameters {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface Artifact {
  id: string;
  type: 'code' | 'image' | 'document' | 'data';
  name: string;
  content: string | Blob;
  mimeType: string;
  size: number;
  metadata?: Record<string, unknown>;
}

// Insights and analytics types
export interface Insight {
  id: string;
  roadmap_id: string;
  type: 'prediction' | 'recommendation' | 'warning' | 'completion' | 'performance';
  title: string;
  description: string;
  data: string | Record<string, unknown>;
  score: number;
  confidence?: number;
  impact?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  actionable?: boolean;
  actions?: InsightAction[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  expires_at?: string;
}

export interface InsightAction {
  id: string;
  label: string;
  description?: string;
  type: 'navigation' | 'api_call' | 'modal' | 'external_link';
  payload: Record<string, unknown>;
  primary?: boolean;
}

export interface Analytics {
  roadmap_id: string;
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year';
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrend[];
  generated_at: string;
}

export interface AnalyticsMetrics {
  total_nodes: number;
  completed_nodes: number;
  completion_rate: number;
  avg_completion_time: number;
  bottlenecks: string[];
  critical_path: string[];
  estimated_completion: string;
  velocity: number;
  burn_rate: number;
}

export interface AnalyticsTrend {
  metric: string;
  data_points: DataPoint[];
  trend_direction: 'up' | 'down' | 'stable';
  change_percentage: number;
}

export interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// UI and component types
export interface Theme {
  name: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: Animations;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  gray: ColorScale;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
}

export interface Spacing {
  [key: string]: string;
}

export interface BorderRadius {
  [key: string]: string;
}

export interface Shadows {
  [key: string]: string;
}

export interface Animations {
  duration: Record<string, string>;
  easing: Record<string, string>;
}

// API and state management types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  request_id: string;
}

export interface ResponseMetadata {
  timestamp: string;
  request_id: string;
  duration: number;
  cached?: boolean;
  cache_ttl?: number;
  rate_limit?: RateLimit;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  retry_after?: number;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_previous: boolean;
  total_pages: number;
}

export interface QueryOptions {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
  search?: string;
  include?: string[];
  fields?: string[];
}

// Store and state types
export interface AppState {
  user: UserState;
  roadmaps: RoadmapState;
  canvas: CanvasState;
  ui: UIState;
  ai: AIState;
  settings: SettingsState;
}

export interface UserState {
  current: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  preferences: UserPreferences;
}

export interface RoadmapState {
  current: Roadmap | null;
  list: Roadmap[];
  isLoading: boolean;
  error: string | null;
  filters: RoadmapFilters;
}

export interface RoadmapFilters {
  status?: string[];
  tags?: string[];
  dateRange?: { start: string; end: string };
  search?: string;
}

export interface CanvasState {
  mode: '2d' | '3d';
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: { x: number; y: number; zoom: number };
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  modalStack: Modal[];
  notifications: Notification[];
  isOnline: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface Modal {
  id: string;
  type: string;
  props: Record<string, unknown>;
  priority: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timeout?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  created_at: string;
}

export interface NotificationAction {
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface AIState {
  isProcessing: boolean;
  currentTasks: AITask[];
  completedTasks: AITask[];
  insights: Insight[];
  lastUpdate: string | null;
}

export interface SettingsState {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  integrations: IntegrationSettings;
}

export interface GeneralSettings {
  autoSave: boolean;
  autoSync: boolean;
  defaultView: '2d' | '3d';
  language: string;
  timezone: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  colorScheme: string;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  reducedMotion: boolean;
}

export interface PrivacySettings {
  analytics: boolean;
  crashReporting: boolean;
  dataCollection: boolean;
  marketing: boolean;
}

export interface IntegrationSettings {
  github: GitHubIntegration | null;
  slack: SlackIntegration | null;
  jira: JiraIntegration | null;
  custom: CustomIntegration[];
}

export interface GitHubIntegration {
  enabled: boolean;
  token: string;
  repositories: string[];
  syncEnabled: boolean;
}

export interface SlackIntegration {
  enabled: boolean;
  token: string;
  channels: string[];
  notificationsEnabled: boolean;
}

export interface JiraIntegration {
  enabled: boolean;
  serverUrl: string;
  username: string;
  token: string;
  projects: string[];
}

export interface CustomIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'oauth';
  config: Record<string, unknown>;
  enabled: boolean;
}

// Event types
export interface AppEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  user_id?: string;
  session_id: string;
  timestamp: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Awaited<T> = T extends Promise<infer U> ? U : T;

export type KeyOf<T> = keyof T;

export type ValueOf<T> = T[keyof T];

// Component prop types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncComponentProps extends BaseComponentProps, LoadingState {
  onRetry?: () => void;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  defaultValue?: unknown;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Security types
export interface SecurityContext {
  user: User;
  permissions: Permission[];
  session: Session;
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// Types are already exported as interfaces above - removing duplicate exports