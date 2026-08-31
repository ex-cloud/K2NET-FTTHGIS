export function getMartinTileUrl(
  tableNameOrFunction: string,
  baseUrl: string = "/tiles"
): string {
  // Martin vector tile endpoint format: /tiles/{table}/{z}/{x}/{y}
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}/${tableNameOrFunction}/{z}/{x}/{y}`;
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
