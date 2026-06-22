import { z } from "zod";

/**
 * Common regex for UUID validation
 */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Base asset schema with common fields
 */
export const baseAssetSchema = z.object({
  code: z.string().min(3, "Kode minimal 3 karakter").max(50, "Kode maksimal 50 karakter"),
  name: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  status: z.enum(["PLANNED", "ACTIVE", "MAINTENANCE", "BROKEN", "DISMANTLED"]),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  lastNote: z.string().optional().nullable(),
});

/**
 * OLT Validation Schema
 */
export const oltSchema = baseAssetSchema.extend({
  ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Format IP Address tidak valid").optional().or(z.literal("")),
  snmpCommunity: z.string().optional().or(z.literal("")),
});

/**
 * ODC Validation Schema
 */
export const odcSchema = baseAssetSchema.extend({
  capacity: z.coerce.number().int().positive("Kapasitas harus angka positif"),
  usedCapacity: z.coerce.number().int().min(0, "Kapasitas terpakai tidak boleh negatif").default(0),
  parentId: z.string().regex(uuidRegex, "Parent ID harus UUID valid").optional().nullable(),
}).refine(data => data.usedCapacity <= data.capacity, {
  message: "Kapasitas terpakai tidak boleh melebihi total kapasitas",
  path: ["usedCapacity"],
});

/**
 * ODP Validation Schema
 */
export const odpSchema = baseAssetSchema.extend({
  totalPort: z.coerce.number().int().positive("Total port harus angka positif"),
  usedPort: z.coerce.number().int().min(0, "Port terpakai tidak boleh negatif").default(0),
  parentId: z.string().regex(uuidRegex, "Parent ID harus UUID valid").optional().nullable(),
}).refine(data => data.usedPort <= data.totalPort, {
  message: "Port terpakai tidak boleh melebihi total port",
  path: ["usedPort"],
});

/**
 * Customer Validation Schema
 */
export const customerSchema = baseAssetSchema.extend({
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  parentId: z.string().regex(uuidRegex, "Parent ID (ODP) harus UUID valid"),
});

/**
 * Batch Update Schema
 */
export const batchUpdateSchema = z.object({
  ids: z.array(z.string().regex(uuidRegex, "ID harus UUID valid")).min(1, "Pilih minimal satu aset"),
  type: z.string(),
  status: z.string().optional().nullable(),
  healthStatus: z.string().optional().nullable(),
  reason: z.string().min(3, "Alasan minimal 3 karakter"),
  notes: z.string().optional().nullable(),
  newParentId: z.string().regex(uuidRegex, "Parent ID harus UUID valid").optional().nullable(),
});

export type BaseAssetInput = z.infer<typeof baseAssetSchema>;
export type OltInput = z.infer<typeof oltSchema>;
export type OdcInput = z.infer<typeof odcSchema>;
export type OdpInput = z.infer<typeof odpSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;
