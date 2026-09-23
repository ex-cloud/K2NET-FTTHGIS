import {
  CreditCard,
  Check,
  Zap,
  Download,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { toast } from "sonner";

export function BillingPage() {
  const plans = [
    {
      name: "STARTER",
      price: "Rp 0",
      period: "/bulan",
      description: "Untuk uji coba lab & perencanaan awal",
      features: ["Maksimal 1 Proyek", "Hingga 250 Pelanggan", "Map Studio Standar", "Support Komunitas"],
      current: false,
    },
    {
      name: "PROFESSIONAL",
      price: "Rp 1.500.000",
      period: "/bulan",
      description: "Untuk ISP menengah berkembang dengan multi-cluster",
      features: [
        "Hingga 10 Proyek FTTH",
        "10.000 Pelanggan Terdaftar",
        "Live OLT SNMP Telemetry",
        "Heatmap & CAD Canvas Builder",
        "WhatsApp & SMS Gateway",
        "Prioritas Support 24/7",
      ],
      current: true,
      badge: "PAKET AKTIF",
    },
    {
      name: "ENTERPRISE",
      price: "Hubungi Sales",
      period: "",
      description: "Untuk operator skala besar & ISP nasional",
      features: [
        "Unlimited Proyek & Pelanggan",
        "Multi-Cluster High Availability",
        "Custom Poller Engine & Dedicated VM",
        "SLA 99.95% & Dedicated Account Manager",
        "Kustom Domain & White-Label Logo",
      ],
      current: false,
    },
  ];

  const invoices = [
    {
      id: "INV-2026-09-001",
      date: "01 Sep 2026",
      plan: "PROFESSIONAL (1 Bulan)",
      amount: "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit QRIS / Virtual Account",
    },
    {
      id: "INV-2026-08-001",
      date: "01 Agu 2026",
      plan: "PROFESSIONAL (1 Bulan)",
      amount: "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit Bank Mandiri VA",
    },
    {
      id: "INV-2026-07-001",
      date: "01 Jul 2026",
      plan: "PROFESSIONAL (1 Bulan)",
      amount: "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit BCA VA",
    },
  ];

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Mengunduh kuitansi ${invoiceId}...`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Langganan & Faktur Penagihan"
        breadcrumbs={[
          { label: "Organisasi", href: "/projects" },
          { label: "Billing & Pembayaran" },
        ]}
      />

      <PageContentShell className="space-y-6 custom-scrollbar">
        {/* Current Plan Overview Card */}
        <Card className="p-5 border-border/60 bg-card shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Paket Professional Active</h3>
                  <Badge variant="default" className="text-[10px] font-mono">
                    AKTIF
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Berlaku hingga <strong>30 September 2026</strong> • Pembayaran otomatis via Xendit
                </p>
              </div>
            </div>

            <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
              <CreditCard className="h-3.5 w-3.5" />
              Perbarui Metode Pembayaran
            </Button>
          </div>
        </Card>

        {/* Pricing Tier Plans */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pilihan Paket Langganan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p, idx) => (
              <Card
                key={idx}
                className={`p-5 flex flex-col justify-between border-border/60 bg-card transition-all ${
                  p.current
                    ? "border-primary ring-1 ring-primary shadow-sm"
                    : "hover:border-primary/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{p.name}</span>
                    {p.badge && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-xl font-bold font-mono text-foreground">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.period}</span>
                  </div>

                  <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
                    {p.description}
                  </p>

                  <div className="pt-3 border-t border-border/40 space-y-2">
                    {p.features.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/40">
                  <Button
                    variant={p.current ? "outline" : "default"}
                    size="sm"
                    disabled={p.current}
                    className="w-full text-xs font-semibold"
                  >
                    {p.current ? "Paket Saat Ini" : "Pilih Paket Ini"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Invoices History Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Riwayat Pembayaran & Faktur
          </h3>

          <Card className="border-border/60 overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[11px]">
                  <TableHead className="font-bold">NOMOR INVOICE</TableHead>
                  <TableHead className="font-bold">TANGGAL</TableHead>
                  <TableHead className="font-bold">DESKRIPSI PAKET</TableHead>
                  <TableHead className="font-bold">METODE BAYAR</TableHead>
                  <TableHead className="font-bold">TOTAL</TableHead>
                  <TableHead className="font-bold">STATUS</TableHead>
                  <TableHead className="w-16 text-right">FAKTUR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="text-xs">
                    <TableCell className="font-mono font-bold text-foreground">
                      {inv.id}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{inv.date}</TableCell>
                    <TableCell>{inv.plan}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.paymentMethod}</TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {inv.amount}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(inv.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </PageContentShell>
    </div>
  );
}
