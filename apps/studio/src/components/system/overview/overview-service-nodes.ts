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

  const notificationActive = getGwActive(gateways, "ftth-notification-gateway");
  const paymentActive = getGwActive(gateways, "ftth-payment-gateway");
  const mapActive = getGwActive(gateways, "ftth-map-gateway");
  const storageActive = getGwActive(gateways, "ftth-storage-gateway");

  return [
    {
      id: "core-router",
      name: "Kong API Gateway",
      type: "core",
      status: allGatewaysHealthy ? "healthy" : "warning",
      port: 8000,
      details: "Edge router and request decorator. Validates Keycloak JWTs, handles global rate limiting, and enforces IP restrictions.",
      metrics: {
        "Global Rate Limit": "Active (100 req/min)",
        "IP Restriction": "WhatsApp Webhook CIDR Enforced",
        "JWT Validation": "Active (Globally Enforced)",
        "Routing Rules": "Active (DB-less Declarative)",
      },
      x: 6,
      y: 1,
    },
    {
      id: "auth-keycloak",
      name: "Keycloak IAM",
      type: "auth",
      status: keycloakActive ? "healthy" : "error",
      port: 8081,
      details: "Centralized security gateway. Manages dynamic realm provisioning, MFA, and SSO integrations.",
      metrics: {
        "Realms Provisioned": `${totalOrgs} Active Realms`,
        Protocol: "OpenID Connect / SAML",
        "Session Limits": "Enforced",
      },
      x: 2,
      y: 3,
    },
    {
      id: "db-postgres",
      name: "PostgreSQL Spasial",
      type: "db",
      status: postgresActive ? "healthy" : "error",
      port: 5432,
      details: "Primary database storing platform schemas, billing history, and geographical spatial tables.",
      metrics: {
        "Db Name": "ftth_gis",
        Connections: `${postgresConns} active`,
        Extensions: "PostGIS, Topology",
      },
      x: 10,
      y: 3,
    },
    {
      id: "cache-redis",
      name: "Redis Cache Store",
      type: "cache",
      status: redisActive ? "healthy" : "error",
      port: 6379,
      details: "Distributed cache layer to lower database overhead, store maps geocoding data, and session timeouts.",
      metrics: {
        "Hit Ratio": `${redisCacheHit}%`,
        "Keys Cached": `${redisKeysCached} active`,
        "Eviction Policy": "volatile-lru",
      },
      x: 6,
      y: 5,
    },
    {
      id: "gw-notification",
      name: "Notification Gateway",
      type: "gateway",
      status: notificationActive ? "healthy" : "error",
      port: 5001,
      details: "Handles microservice triggers for SMS, Email (Brevo), and WhatsApp messages.",
      metrics: {
        Throughput: `${getGwMetric(gateways, "ftth-notification-gateway", "throughput")} req/min`,
        Latency: `${getGwMetric(gateways, "ftth-notification-gateway", "latency")}ms`,
        "Provider status": "Twilio & Brevo OK",
      },
      x: 1,
      y: 7,
    },
    {
      id: "gw-payment",
      name: "Payment Gateway",
      type: "gateway",
      status: paymentActive ? "healthy" : "error",
      port: 5002,
      details: "Orchestrates tenant subscriptions, plan invoices, and webhooks processing.",
      metrics: {
        Throughput: `${getGwMetric(gateways, "ftth-payment-gateway", "throughput")} req/min`,
        Latency: `${getGwMetric(gateways, "ftth-payment-gateway", "latency")}ms`,
        Integrations: "Xendit SDK OK",
      },
      x: 4,
      y: 7,
    },
    {
      id: "gw-map",
      name: "Map Tile Gateway",
      type: "gateway",
      status: mapActive ? "healthy" : "error",
      port: 5003,
      details: "Direct vector maps provider linking database geospatial assets with ODP/ODC layouts.",
      metrics: {
        Throughput: `${getGwMetric(gateways, "ftth-map-gateway", "throughput")} req/min`,
        Latency: `${getGwMetric(gateways, "ftth-map-gateway", "latency")}ms`,
        "Basemap Cache": "94.2% hit",
      },
      x: 8,
      y: 7,
    },
    {
      id: "gw-storage",
      name: "WebP Storage Gateway",
      type: "gateway",
      status: storageActive ? "healthy" : "error",
      port: 5004,
      details: "Serves tenant assets with automatic WebP dynamic image compression on fly.",
      metrics: {
        Optimization: "68.5% Saved",
        Latency: `${getGwMetric(gateways, "ftth-storage-gateway", "latency")}ms`,
        Throughput: `${getGwMetric(gateways, "ftth-storage-gateway", "throughput")} req/min`,
      },
      x: 11,
      y: 7,
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
