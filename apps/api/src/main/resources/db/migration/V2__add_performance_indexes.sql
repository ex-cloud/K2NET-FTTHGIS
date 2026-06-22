-- Performance Indexing for FTTH GIS multitenancy and foreign keys
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users (organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);

CREATE INDEX IF NOT EXISTS idx_assets_org_id ON assets (organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_proj_id ON assets (project_id);
CREATE INDEX IF NOT EXISTS idx_assets_node_id ON assets (node_id);
CREATE INDEX IF NOT EXISTS idx_assets_edge_id ON assets (edge_id);
CREATE INDEX IF NOT EXISTS idx_assets_cat_id ON assets (category_id);

CREATE INDEX IF NOT EXISTS idx_net_edges_org_id ON network_edges (organization_id);
CREATE INDEX IF NOT EXISTS idx_net_edges_proj_id ON network_edges (project_id);
CREATE INDEX IF NOT EXISTS idx_net_edges_source ON network_edges (source);
CREATE INDEX IF NOT EXISTS idx_net_edges_target ON network_edges (target);

CREATE INDEX IF NOT EXISTS idx_net_nodes_org_id ON network_nodes (organization_id);
CREATE INDEX IF NOT EXISTS idx_net_nodes_proj_id ON network_nodes (project_id);
CREATE INDEX IF NOT EXISTS idx_net_nodes_type ON network_nodes (node_type);
CREATE INDEX IF NOT EXISTS idx_net_nodes_status ON network_nodes (status);

CREATE INDEX IF NOT EXISTS idx_customers_odp_id ON customers (odp_id);
CREATE INDEX IF NOT EXISTS idx_odp_odc_id ON odp (odc_id);
CREATE INDEX IF NOT EXISTS idx_odc_olt_id ON odc (olt_id);
