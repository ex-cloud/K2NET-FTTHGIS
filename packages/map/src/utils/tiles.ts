export interface TenantMvtUrlOptions {
  projectId?: string;
  organizationId?: string;
  baseUrl?: string;
}

export function getMartinTileUrl(
  tableNameOrFunction: string,
  baseUrl: string = "/tiles"
): string {
  // Martin vector tile endpoint format: /tiles/{table}/{z}/{x}/{y}
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}/${tableNameOrFunction}/{z}/{x}/{y}`;
}

/**
 * Builds dynamic Vector Tile URL scoped strictly to tenant and project.
 * Martin calls PostGIS function get_mvt_data(z, x, y, query json).
 * Query parameters are passed as URL query strings: ?project_id=...&org_id=...
 */
export function getTenantMvtUrl(options?: TenantMvtUrlOptions): string {
  const baseUrl = options?.baseUrl || "/get_mvt_data";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  const params = new URLSearchParams();
  if (options?.projectId) {
    params.set("project_id", options.projectId);
  }
  if (options?.organizationId) {
    params.set("org_id", options.organizationId);
    params.set("organization_id", options.organizationId);
  }

  const queryString = params.toString();
  const queryPart = queryString ? `?${queryString}` : "";
  return `${cleanBase}/{z}/{x}/{y}${queryPart}`;
}

export function createTenantMvtSource(options?: TenantMvtUrlOptions) {
  return {
    type: "vector" as const,
    tiles: [getTenantMvtUrl(options)],
    minzoom: 6,
    maxzoom: 22,
  };
}

export function createMartinVectorSource(
  sourceId: string,
  layerTables: string[],
  baseUrl: string = "/tiles"
) {
  return {
    type: "vector" as const,
    tiles: layerTables.map((tbl) => getMartinTileUrl(tbl, baseUrl)),
    minzoom: 8,
    maxzoom: 20,
  };
}
