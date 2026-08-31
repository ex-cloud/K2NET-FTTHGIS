export type AiKnowledgeStats = {
  total_documents: number;
  total_chunks: number;
  total_size_bytes?: number;
  total_bytes?: number;
  unindexed_server_files?: number;
  unindexed_files_count?: number;
  categories_count?: number;
  avg_similarity_score?: number;
  avg_similarity?: number;
  top_category?: string;
  llm_provider?: string;
  chat_model?: string;
  scope_distribution?: Record<string, number>;
  category_distribution?: Record<string, number>;
};

export type AiDocumentItem = {
  id: string;
  title: string;
  source_file: string;
  file_name?: string;
  category: string;
  scope: "PLATFORM_INTERNAL" | "TENANT_INTERNAL" | "GLOBAL" | string;
  status: "DRAFT" | "INDEXED" | "ARCHIVED" | "REJECTED" | "PENDING_REVIEW";
  chunk_count: number;
  total_tokens: number;
  file_size_bytes: number;
  raw_content?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  version: number;
  author?: string;
  tags?: string[];
  chunks?: Array<{
    id: string;
    chunk_index: number;
    content: string;
    token_count: number;
    similarity?: number;
  }>;
};

export type AiDocumentDetail = AiDocumentItem;

export type AiDocumentListResponse = {
  documents: AiDocumentItem[];
  total: number;
  page: number;
  limit: number;
};

export interface VectorSearchResultItem {
  document_id: string;
  chunk_id?: string;
  title: string;
  category: string;
  scope?: string;
  chunk_index: number;
  content: string;
  content_preview?: string;
  similarity_score: number;
}

export type ModelCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  badge?: string;
  context_window?: string;
  is_default?: boolean;
};

export type ProviderModelsResponse = {
  provider: string;
  models: ModelCatalogItem[];
  detected_live: boolean;
  source: string;
};

export type ActiveChatModelsResponse = {
  default_model: string;
  active_primary: string;
  active_fallback: string;
  models: ModelCatalogItem[];
  configured_providers: string[];
};

export type KnowledgeGraphData = {
  nodes: Array<{
    id: string;
    label: string;
    title: string;
    category: string;
    chunk_count: number;
    file_size_bytes: number;
    vendor: string;
    status: string;
    degree: number;
    group: number;
    val: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    similarity: number;
    value: number;
    relation: string;
  }>;
  stats: {
    total_nodes: number;
    total_links: number;
    categories_count: number;
    max_chunks: number;
    top_categories: Array<{ category: string; count: number }>;
  };
};

export type ServerSyncStatus = {
  total_server_files: number;
  indexed_count: number;
  unindexed_count: number;
  unindexed_files: Array<{
    path: string;
    title: string;
    category: string;
    size_bytes: number;
    file_path?: string;
    file_name?: string;
    scope?: string;
    description?: string;
  }>;
  is_synced: boolean;
  status?: "IDLE" | "SYNCING" | "ERROR" | "SUCCESS";
};

export interface ServerFilePreview {
  path: string;
  title: string;
  category: string;
  scope: string;
  content: string;
  size_bytes: number;
  line_count: number;
  word_count: number;
  char_count: number;
  file_path?: string;
  file_name?: string;
  total_lines?: number;
  is_truncated?: boolean;
}

export type SuggestedPromptItem = {
  id: string;
  tenant_id?: string | null;
  title: string;
  description?: string | null;
  prompt: string;
  icon: string;
  category: string;
  target_role: string;
  is_pinned: boolean;
  is_active: boolean;
  is_trending?: boolean;
  usage_count: number;
  created_at?: string;
  updated_at?: string;
};

export type SuggestedPromptListResponse = {
  total: number;
  prompts: SuggestedPromptItem[];
};

export type TrendingTopicItem = {
  topic: string;
  count: number;
  category: string;
  sample_query: string;
  is_already_prompt: boolean;
};

export type TrendingTopicsResponse = {
  total_queries_analyzed: number;
  trending: TrendingTopicItem[];
  topics?: TrendingTopicItem[];
  period_days?: number;
  total_queries?: number;
};

export type AgentAuthorizationData = {
  is_authorized: boolean;
  agent_name: string;
  user_scope: string; // PLATFORM_INTERNAL | TENANT
  user_role: string;
  access_tier: string; // FULL | READ_ONLY | ROLE_PRESET | CUSTOM
  role_preset?: string | null;
  granted_permissions: string[];
  is_active: boolean;
  authorized_at?: string | null;
  agent_id?: string;
  role?: string;
  restricted_domains?: string[];
  max_tokens_per_request?: number;
  allow_autonomous_execution?: boolean;
  allow_database_mutations?: boolean;
  allow_gateway_write_calls?: boolean;
  require_human_confirmation?: boolean;
  updated_at?: string;
};

export type PermissionItemData = {
  id: string;
  name: string;
  scope: string; // Read | Write
  description: string;
  risk_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
};

export type PermissionDomainData = {
  id: string;
  title: string;
  icon: string;
  description: string;
  target_scope: string;
  permissions: PermissionItemData[];
  domain?: string;
  name?: string;
};

export type PermissionCatalogData = {
  scope: string;
  total_permissions: number;
  domains: PermissionDomainData[];
};

export type RolePresetData = {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  target_scope: string;
  default_permissions: string[];
  role?: string;
  max_tokens?: number;
};
