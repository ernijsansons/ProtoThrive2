-- ProtoThrive Enterprise Caching & Performance Schema Migration
-- Version: 1.0.0
-- Date: 2025-01-21
-- Ref: CLAUDE.md Section 6 - Performance Optimization

-- Cache entries for multi-layer caching system
CREATE TABLE IF NOT EXISTS cache_entries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cache_key TEXT NOT NULL UNIQUE,
    cache_namespace TEXT NOT NULL,
    data BLOB, -- Compressed data
    data_type TEXT NOT NULL CHECK (data_type IN ('json', 'string', 'binary', 'html')),
    compression_type TEXT CHECK (compression_type IN ('gzip', 'brotli', 'none')),
    content_length INTEGER NOT NULL,
    tags JSON NOT NULL DEFAULT '[]',
    dependencies JSON NOT NULL DEFAULT '[]',
    ttl_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP
);

-- Cache invalidation tracking
CREATE TABLE IF NOT EXISTS cache_invalidations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    invalidation_type TEXT NOT NULL CHECK (invalidation_type IN ('key', 'tag', 'namespace', 'pattern')),
    target TEXT NOT NULL,
    reason TEXT,
    invalidated_count INTEGER NOT NULL DEFAULT 0,
    requested_by TEXT,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance budgets and monitoring
CREATE TABLE IF NOT EXISTS performance_budgets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    page_pattern TEXT NOT NULL,
    metric_name TEXT NOT NULL CHECK (metric_name IN ('bundle_size', 'image_size', 'font_size', 'lcp', 'fid', 'cls', 'ttfb')),
    budget_value REAL NOT NULL,
    unit TEXT NOT NULL,
    warning_threshold REAL NOT NULL DEFAULT 0.8,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance budget violations
CREATE TABLE IF NOT EXISTS performance_violations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    budget_id TEXT NOT NULL REFERENCES performance_budgets(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    page_url TEXT NOT NULL,
    measured_value REAL NOT NULL,
    budget_value REAL NOT NULL,
    violation_percentage REAL NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
    build_id TEXT,
    commit_sha TEXT,
    branch TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CDN and edge caching configurations
CREATE TABLE IF NOT EXISTS cdn_configurations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    zone_name TEXT NOT NULL,
    cache_level TEXT NOT NULL DEFAULT 'aggressive' CHECK (cache_level IN ('bypass', 'basic', 'simplified', 'aggressive')),
    browser_ttl INTEGER NOT NULL DEFAULT 14400, -- 4 hours
    edge_ttl INTEGER NOT NULL DEFAULT 86400, -- 24 hours
    development_mode BOOLEAN NOT NULL DEFAULT false,
    purge_everything_enabled BOOLEAN NOT NULL DEFAULT false,
    custom_cache_rules JSON NOT NULL DEFAULT '[]',
    compression_enabled BOOLEAN NOT NULL DEFAULT true,
    minification_settings JSON NOT NULL DEFAULT '{"html":true,"css":true,"js":true}',
    rocket_loader_enabled BOOLEAN NOT NULL DEFAULT false,
    always_online BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource loading optimization
CREATE TABLE IF NOT EXISTS resource_hints (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    page_pattern TEXT NOT NULL,
    resource_url TEXT NOT NULL,
    hint_type TEXT NOT NULL CHECK (hint_type IN ('preload', 'prefetch', 'preconnect', 'dns-prefetch', 'modulepreload')),
    resource_type TEXT CHECK (resource_type IN ('script', 'style', 'font', 'image', 'fetch', 'document')),
    priority TEXT CHECK (priority IN ('high', 'low', 'auto')),
    crossorigin TEXT CHECK (crossorigin IN ('anonymous', 'use-credentials')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image optimization tracking
CREATE TABLE IF NOT EXISTS image_optimizations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    original_url TEXT NOT NULL,
    optimized_url TEXT NOT NULL,
    original_size INTEGER NOT NULL,
    optimized_size INTEGER NOT NULL,
    compression_ratio REAL NOT NULL,
    format_original TEXT NOT NULL,
    format_optimized TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    quality INTEGER,
    optimization_type TEXT NOT NULL CHECK (optimization_type IN ('webp', 'avif', 'resize', 'compress', 'format_conversion')),
    processing_time_ms REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Code splitting and lazy loading tracking
CREATE TABLE IF NOT EXISTS code_splits (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    chunk_name TEXT NOT NULL,
    chunk_hash TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    compressed_size INTEGER,
    load_priority TEXT NOT NULL DEFAULT 'normal' CHECK (load_priority IN ('critical', 'high', 'normal', 'low')),
    route_pattern TEXT,
    dependencies JSON NOT NULL DEFAULT '[]',
    load_analytics JSON NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service worker and offline capabilities
CREATE TABLE IF NOT EXISTS service_worker_caches (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    cache_name TEXT NOT NULL,
    cache_version TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK (strategy IN ('cache_first', 'network_first', 'stale_while_revalidate', 'network_only', 'cache_only')),
    max_entries INTEGER,
    max_age_seconds INTEGER,
    url_patterns JSON NOT NULL DEFAULT '[]',
    precache_urls JSON NOT NULL DEFAULT '[]',
    runtime_caching JSON NOT NULL DEFAULT '[]',
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Database query performance tracking
CREATE TABLE IF NOT EXISTS query_performance (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    query_hash TEXT NOT NULL,
    query_type TEXT NOT NULL CHECK (query_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    execution_time_ms REAL NOT NULL,
    rows_examined INTEGER,
    rows_returned INTEGER,
    index_used BOOLEAN,
    full_table_scan BOOLEAN NOT NULL DEFAULT false,
    query_plan JSON,
    optimization_suggestions JSON NOT NULL DEFAULT '[]',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API response caching
CREATE TABLE IF NOT EXISTS api_cache_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    endpoint_pattern TEXT NOT NULL,
    http_method TEXT NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    cache_key_template TEXT NOT NULL,
    ttl_seconds INTEGER NOT NULL DEFAULT 300,
    vary_headers JSON NOT NULL DEFAULT '[]',
    cache_conditions JSON NOT NULL DEFAULT '{}',
    invalidation_triggers JSON NOT NULL DEFAULT '[]',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Memory usage and optimization tracking
CREATE TABLE IF NOT EXISTS memory_usage (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    component_name TEXT NOT NULL,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('heap_used', 'heap_total', 'external', 'rss')),
    size_bytes INTEGER NOT NULL,
    growth_rate_per_hour REAL,
    optimization_applied TEXT,
    measurement_type TEXT NOT NULL CHECK (measurement_type IN ('initial', 'after_gc', 'peak', 'average')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for caching and optimization
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_namespace ON cache_entries(cache_namespace);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_tags ON cache_entries(tags);
CREATE INDEX IF NOT EXISTS idx_cache_invalidations_type ON cache_invalidations(invalidation_type, target);
CREATE INDEX IF NOT EXISTS idx_cache_invalidations_workspace ON cache_invalidations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_performance_budgets_workspace ON performance_budgets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_performance_budgets_page ON performance_budgets(page_pattern);
CREATE INDEX IF NOT EXISTS idx_performance_violations_budget ON performance_violations(budget_id);
CREATE INDEX IF NOT EXISTS idx_performance_violations_severity ON performance_violations(severity, detected_at);
CREATE INDEX IF NOT EXISTS idx_cdn_configurations_workspace ON cdn_configurations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_resource_hints_workspace ON resource_hints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_resource_hints_page ON resource_hints(page_pattern);
CREATE INDEX IF NOT EXISTS idx_image_optimizations_workspace ON image_optimizations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_image_optimizations_url ON image_optimizations(original_url);
CREATE INDEX IF NOT EXISTS idx_code_splits_workspace ON code_splits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_code_splits_chunk ON code_splits(chunk_name, chunk_hash);
CREATE INDEX IF NOT EXISTS idx_service_worker_caches_workspace ON service_worker_caches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_worker_caches_name ON service_worker_caches(cache_name, cache_version);
CREATE INDEX IF NOT EXISTS idx_query_performance_workspace ON query_performance(workspace_id);
CREATE INDEX IF NOT EXISTS idx_query_performance_hash ON query_performance(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_performance_table ON query_performance(table_name);
CREATE INDEX IF NOT EXISTS idx_query_performance_time ON query_performance(execution_time_ms);
CREATE INDEX IF NOT EXISTS idx_api_cache_rules_workspace ON api_cache_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_cache_rules_endpoint ON api_cache_rules(endpoint_pattern, http_method);
CREATE INDEX IF NOT EXISTS idx_memory_usage_workspace ON memory_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memory_usage_component ON memory_usage(component_name, memory_type);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS trigger_performance_budgets_updated_at
    AFTER UPDATE ON performance_budgets
    BEGIN
        UPDATE performance_budgets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_cdn_configurations_updated_at
    AFTER UPDATE ON cdn_configurations
    BEGIN
        UPDATE cdn_configurations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_service_worker_caches_updated_at
    AFTER UPDATE ON service_worker_caches
    BEGIN
        UPDATE service_worker_caches SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_api_cache_rules_updated_at
    AFTER UPDATE ON api_cache_rules
    BEGIN
        UPDATE api_cache_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Cleanup triggers for expired cache entries
CREATE TRIGGER IF NOT EXISTS trigger_cleanup_expired_cache
    AFTER INSERT ON cache_entries
    BEGIN
        DELETE FROM cache_entries
        WHERE expires_at IS NOT NULL
        AND expires_at < CURRENT_TIMESTAMP
        AND accessed_at < datetime('now', '-7 days');
    END;