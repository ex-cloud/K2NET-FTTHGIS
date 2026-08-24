import { useMemo } from "react";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";
import type { ServiceNode } from "./overview-types";

interface BuildServiceNodesParams {
  postgresStatus: string;
  redisStatus: string;
  keycloakStatus: string;
  gateways: GatewayServiceStatus[];
  allGatewaysHealthy: boolean;
  totalOrgs: number;
  postgresConns: number;
  redisCacheHit: number;
  redisKeysCached: number;
}

function getGwActive(gateways: GatewayServiceStatus[], name: string): boolean {
  return gateways.find((g) => g.name === name)?.active ?? false;
}

function getGwMetric(gateways: GatewayServiceStatus[], name: string, field: "throughput" | "latency"): number {
  return gateways.find((g) => g.name === name)?.[field] ?? 0;
}

export function buildServiceNodes({
  postgresStatus,
  redisStatus,
  keycloakStatus,
  gateways,
  allGatewaysHealthy,
  totalOrgs,
  postgresConns,
  redisCacheHit,
  redisKeysCached,
}: BuildServiceNodesParams): ServiceNode[] {
  const postgresActive = postgresStatus === "healthy";
  const redisActive = redisStatus === "healthy";
  const keycloakActive = keycloakStatus === "healthy";

  // All 9 gateway names tracked in the cluster
  const ALL_GATEWAY_NAMES = [
    "ftth-notification-gateway",
    "ftth-payment-gateway",
    "ftth-map-gateway",
    "ftth-storage-gateway",
    "ftth-whatsapp-gateway",
    "ftth-scheduler-gateway",
    "ftth-export-gateway",
    "ftth-olt-gateway",
    "ftth-audit-gateway",
  ];

  const onlineGateways = ALL_GATEWAY_NAMES.filter((name) =>
    getGwActive(gateways, name)
  ).length;
  const totalGateways = ALL_GATEWAY_NAMES.length;

  const avgLatency = ALL_GATEWAY_NAMES.reduce(
    (sum, name) => sum + getGwMetric(gateways, name, "latency"),
    0
  ) / totalGateways;

  const totalThroughput = ALL_GATEWAY_NAMES.reduce(
    (sum, name) => sum + getGwMetric(gateways, name, "throughput"),
    0
  );

  const clusterStatus: ServiceNode["status"] =
    onlineGateways === totalGateways
      ? "healthy"
      : onlineGateways === 0
      ? "error"
      : "warning";

  return [
    {
      id: "edge-router",
      name: "Traefik / Kong API",
      type: "edge",
      sublabel: "Edge Router",
      tone: "green",
      status: allGatewaysHealthy ? "healthy" : "warning",
      port: 8000,
      details: "Edge proxy & API Gateway. Handles SSL termination (Traefik 3.7) and JWT token validation decorator (Kong 3.9).",
      metrics: {
        "Kong Gateway": "Active (Port 8000)",
        "Edge Proxy": "Traefik v3.7 (Port 443)",
        "JWT Validation": "Active (Kong Decorator)",
        "Routing Rules": "DB-less Declarative",
      },
      x: 1,
      y: 2,
    },
    {
      id: "core-backend",
      name: "Spring Boot Core",
      type: "core",
      sublabel: "Port 9090",
      tone: "green",
      status: "healthy",
      port: 9090,
      details: "Primary Java Spring Boot core application managing platform logic, organization tenancy, and API endpoints.",
      metrics: {
        Framework: "Spring Boot 3.x",
        "JVM Runtime": "Active",
        "Tenancy Scope": "Multi-Tenant",
      },
      x: 3,
      y: 1,
    },
    {
      id: "ai-gateway",
      name: "AI Gateway (RAG)",
      type: "ai",
      sublabel: "Python Engine",
      tone: "green",
      status: "healthy",
      port: 5011,
      details: "Dedicated AI Assistant microservice powering vector embeddings, pgvector search, and RAG knowledge retrieval.",
      metrics: {
        "Vector Engine": "pgvector",
        Pipeline: "LangChain / RAG",
        Model: "Gemini 1.5 Pro",
      },
      x: 3,
      y: 2,
    },
    {
      id: "keycloak-iam",
      name: "Keycloak IAM",
      type: "auth",
      sublabel: "Keycloak 26",
      tone: "green",
      status: keycloakActive ? "healthy" : "error",
      port: 8081,
      details: "Identity & Access Management. Dynamic multi-tenant realm security, SAML/OIDC SSO, and MFA policies.",
      metrics: {
        "Realms Provisioned": `${totalOrgs} Active Realms`,
        Protocol: "OpenID Connect / SAML",
        "Session Limits": "Enforced",
      },
      x: 3,
      y: 3,
    },
    {
      id: "postgres-db",
      name: "PostgreSQL (PostGIS)",
      type: "db",
      sublabel: "(PostGIS)",
      tone: "blue",
      status: postgresActive ? "healthy" : "error",
      port: 5432,
      details: "Primary database storing platform schemas, billing history, and geographical spatial PostGIS topology tables.",
      metrics: {
        "Db Name": "ftth_gis",
        Connections: `${postgresConns} active`,
        Extensions: "PostGIS, Topology, pgvector",
      },
      x: 5,
      y: 1,
    },
    {
      id: "redis-cache",
      name: "Redis Cache Store",
      type: "cache",
      sublabel: "Port 6379",
      tone: "red",
      status: redisActive ? "healthy" : "error",
      port: 6379,
      details: "Distributed cache store handling session timeouts, geocoding cache, and poller pub/sub channels.",
      metrics: {
        "Hit Ratio": `${redisCacheHit}%`,
        "Keys Cached": `${redisKeysCached} active`,
        "Eviction Policy": "volatile-lru",
      },
      x: 5,
      y: 3,
    },
    {
      id: "gw-cluster",
      name: "Go Gateways",
      type: "gateway",
      sublabel: "9 Microservices",
      tone: "green",
      status: clusterStatus,
      port: 5000,
      details: `Cluster of ${totalGateways} Go microservice gateways. Handles notifications, payments, map tiles, storage, WhatsApp, OLT monitoring, audit logging, scheduling, and exports.`,
      metrics: {
        "Online": `${onlineGateways} / ${totalGateways}`,
        "Avg Latency": `${Math.round(avgLatency)} ms`,
        "Total Throughput": `${totalThroughput} req/min`,
      },
      x: 7,
      y: 2,
    },
  ];
}

/**
 * React hook wrapper around buildServiceNodes for easy use with useMemo.
 */
export function useServiceNodes(params: BuildServiceNodesParams): ServiceNode[] {
  return useMemo(
    () => buildServiceNodes(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params.postgresStatus,
      params.redisStatus,
      params.keycloakStatus,
      params.gateways,
      params.allGatewaysHealthy,
      params.totalOrgs,
      params.postgresConns,
      params.redisCacheHit,
      params.redisKeysCached,
    ]
  );
}
