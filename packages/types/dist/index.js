"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayConfigSchema = exports.PortSchema = exports.HealthStatus = exports.LifecycleStatus = void 0;
const zod_1 = require("zod");
// ==========================================
// Network & OLT GIS Types
// ==========================================
var LifecycleStatus;
(function (LifecycleStatus) {
    LifecycleStatus["PLAN"] = "PLAN";
    LifecycleStatus["DEPLOYING"] = "DEPLOYING";
    LifecycleStatus["ACTIVE"] = "ACTIVE";
    LifecycleStatus["MAINTENANCE"] = "MAINTENANCE";
    LifecycleStatus["RETIRED"] = "RETIRED";
})(LifecycleStatus || (exports.LifecycleStatus = LifecycleStatus = {}));
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["UP"] = "UP";
    HealthStatus["DEGRADED"] = "DEGRADED";
    HealthStatus["DOWN"] = "DOWN";
    HealthStatus["BROKEN"] = "BROKEN";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
// ==========================================
// Common Configurations & Schemas (Zod)
// ==========================================
exports.PortSchema = zod_1.z.number().int().min(1).max(65535);
exports.GatewayConfigSchema = zod_1.z.object({
    port: zod_1.z.string().regex(/^\d+$/, "Port harus berupa angka").transform(Number).pipe(exports.PortSchema),
    redisAddr: zod_1.z.string().min(1, "Alamat Redis tidak boleh kosong"),
    gatewayToken: zod_1.z.string().min(16, "Token gateway harus minimal 16 karakter"),
});
//# sourceMappingURL=index.js.map