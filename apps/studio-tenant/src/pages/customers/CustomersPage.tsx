import { useState } from "react";
import { Users, Search, Plus } from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import type { CustomerDto } from "@k2net/api-client";

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const customers: CustomerDto[] = [
    { id: "cust-1", name: "Budi Santoso", pppoeUser: "budi.santoso@net", odpCode: "ODP-JKT-012", portNumber: 3, packageSpeed: "50 Mbps", rxPower: "-19.4 dBm", status: "ACTIVE" },
    { id: "cust-2", name: "PT. Sumber Makmur", pppoeUser: "sumbermakmur@corp", odpCode: "ODP-JKT-004", portNumber: 1, packageSpeed: "200 Mbps", rxPower: "-18.2 dBm", status: "ACTIVE" },
    { id: "cust-3", name: "Rina Wijaya", pppoeUser: "rina.w@net", odpCode: "ODP-JKT-018", portNumber: 7, packageSpeed: "30 Mbps", rxPower: "-27.8 dBm", status: "ACTIVE" },
    { id: "cust-4", name: "Hendro Kusumo", pppoeUser: "hendro.k@net", odpCode: "ODP-JKT-022", portNumber: 4, packageSpeed: "50 Mbps", rxPower: "-21.5 dBm", status: "ISOLIR" },
    { id: "cust-5", name: "Klinik Sehat Utama", pppoeUser: "klinik.sehat@corp", odpCode: "ODP-JKT-009", portNumber: 2, packageSpeed: "100 Mbps", rxPower: "-19.1 dBm", status: "ACTIVE" },
  ];

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pppoeUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.odpCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card/80 p-6 shadow-xs backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Manajemen Pelanggan & Provisioning</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Kelola akun PPPoE/IPoE, penempatan port FAT/ODP, status isolir tagihan, dan telemetri sinyal optik ONU.
          </p>
        </div>

        <Button size="sm" className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Tambah Pelanggan Baru</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, user PPPoE, atau kode ODP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-xl border border-border bg-card/70 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-bold text-foreground/80">
              <tr>
                <th className="px-5 py-3">Nama Pelanggan</th>
                <th className="px-5 py-3">PPPoE User</th>
                <th className="px-5 py-3">Lokasi ODP & Port</th>
                <th className="px-5 py-3">Paket Layanan</th>
                <th className="px-5 py-3">Redaman ONU</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-semibold text-foreground">{cust.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{cust.pppoeUser}</td>
                  <td className="px-5 py-3 text-foreground font-bold">{cust.odpCode} · Port #{cust.portNumber}</td>
                  <td className="px-5 py-3 text-foreground">{cust.packageSpeed}</td>
                  <td className="px-5 py-3">
                    <span className={cust.rxPower.includes("-27") ? "text-amber-500 font-bold" : "text-emerald-500"}>
                      {cust.rxPower}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={
                        cust.status === "ACTIVE"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px]"
                          : "border-destructive/40 bg-destructive/10 text-destructive text-[10px]"
                      }
                    >
                      {cust.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
