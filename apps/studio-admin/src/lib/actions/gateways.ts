"use server";

/**
 * 🌐 K2NET Gateway Actions Modular Entrypoint
 * All functions and types are exported from domain modules:
 * - core.ts: Gateway config, health status, ping & metrics cache
 * - ai.ts: AI Knowledge Base, documents, vector RAG, preview/reject, MinIO image upload
 * - services.ts: Storage, Scheduler, Audit, OLT, Export, Poller, Notification, Payment
 */

export * from "./gateways/core";
export * from "./gateways/ai";
export * from "./gateways/services";
