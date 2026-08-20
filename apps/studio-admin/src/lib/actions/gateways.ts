"use server";

/**
 * 🌐 K2NET Gateway Actions Modular Barrel
 * Split into domain-specific action modules:
 * - gateways/common.ts: Token discovery, auth guards, base URLs & core types
 * - gateways/core.ts: Global configuration, metrics ping, and service health
 * - gateways/ai.ts: AI Assistant, Knowledge Base, Vector RAG, Docs sync & S3 upload
 * - gateways/services.ts: Storage, Scheduler, Audit, OLT, Export, Poller, Notification, Payment
 */

export * from "./gateways/common";
export * from "./gateways/core";
export * from "./gateways/ai";
export * from "./gateways/services";
