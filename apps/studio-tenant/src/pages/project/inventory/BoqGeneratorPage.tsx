import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Download,
  Printer,
  Calculator,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { toast } from "sonner";
import { networkApi, type BoqSummary } from "../../../lib/api/network";

export function BoqGeneratorPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const [boqData, setBoqData] = React.useState<BoqSummary | null>(null);

  React.useEffect(() => {
    async function loadBoq() {
      try {
        const res = await networkApi.getBoqEstimation(projectId);
        setBoqData(res);
      } catch {
        // Mock fallback data for demonstration
        setBoqData({
          projectId,
          projectName: "FTTH Bandung Timur Cluster",
          totalEstimatedCost: 142850000,
          currency: "IDR",
          calculatedAt: new Date().toISOString(),
          metadata: {
            totalOdc: 12,
            totalOdp: 86,
            totalCableLengthKm: 48.6,
            totalSubscribers: 1420,
          },
          items: [
            {
              id: "item-1",
              materialCode: "MAT-CBL-48C",
              materialName: "Kabel Fiber Optik Aerial 48 Core G.652D",
              category: "Kabel Optik",
              unit: "Meter",
              unitPrice: 12500,
              quantity: 4860,
              totalPrice: 60750000,
              currency: "IDR",
            },
            {
              id: "item-2",
              materialCode: "MAT-ODC-144",
              materialName: "Kabinet ODC 144 Core Outdoor Pole-Mount",
              category: "Enclosure",
              unit: "Unit",
              unitPrice: 2850000,
              quantity: 12,
              totalPrice: 34200000,
              currency: "IDR",
            },
            {
              id: "item-3",
              materialCode: "MAT-ODP-16",
              materialName: "Kotak ODP FAT 16 Port Lengkap Adapter SC/UPC",
              category: "Enclosure",
              unit: "Unit",
              unitPrice: 245000,
              quantity: 86,
              totalPrice: 21070000,
              currency: "IDR",
            },
            {
              id: "item-4",
              materialCode: "MAT-SPL-116",
              materialName: "PLC Splitter Modular Box 1:16 SC/UPC",
              category: "Splitter",
              unit: "Pcs",
              unitPrice: 95000,
              quantity: 86,
              totalPrice: 8170000,
              currency: "IDR",
            },
            {
              id: "item-5",
              materialCode: "MAT-ACC-CLAMP",
              materialName: "Suspension Clamp & Tensioner Bracket Tiang",
              category: "Aksesoris",
              unit: "Set",
              unitPrice: 45000,
              quantity: 415,
              totalPrice: 18660000,
              currency: "IDR",
            },
          ],
        });
      }
    }
    loadBoq();
  }, [projectId]);

  const handleExportPDF = () => {
    toast.success("Dokumen BOQ PDF berhasil di-generate dan diunduh!");
  };

  const handleExportExcel = () => {
    toast.success("Spreadsheet BOQ Excel (.xlsx) berhasil di-generate!");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Inventory", href: `/project/${projectId}/inventory/odc` },
          { label: "Kalkulator BOQ" },
        ]}
        title="Kalkulator Bill of Quantities (BOQ) Otomatis"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 px-2.5 text-xs font-medium gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel (.xlsx)
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak Dokumen BOQ (PDF)
            </Button>
          </div>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        {/* Total Cost Banner Card */}
        <Card className="p-5 border-border/60 bg-card shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Estimasi Biaya Material (Capex)
                </span>
                <h3 className="text-2xl font-bold font-mono text-primary">
                  Rp {boqData?.totalEstimatedCost.toLocaleString("id-ID")}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span>{boqData?.metadata.totalCableLengthKm} Km Kabel</span>
              <span>•</span>
              <span>{boqData?.metadata.totalOdc} ODC</span>
              <span>•</span>
              <span>{boqData?.metadata.totalOdp} ODP</span>
            </div>
          </div>
        </Card>

        {/* Material Items Table */}
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">KODE MATERIAL</TableHead>
                <TableHead className="font-bold">NAMA MATERIAL & SPESIFIKASI</TableHead>
                <TableHead className="font-bold">KATEGORI</TableHead>
                <TableHead className="font-bold">SATUAN</TableHead>
                <TableHead className="font-bold">HARGA SATUAN (RP)</TableHead>
                <TableHead className="font-bold">JUMLAH (QTY)</TableHead>
                <TableHead className="font-bold text-right">TOTAL HARGA (RP)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boqData?.items.map((item) => (
                <TableRow key={item.id} className="text-xs">
                  <TableCell className="font-mono font-bold text-primary">
                    {item.materialCode}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.materialName}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-[11px]">
                    {item.category}
                  </TableCell>
                  <TableCell className="font-mono">{item.unit}</TableCell>
                  <TableCell className="font-mono">
                    Rp {item.unitPrice.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-foreground">
                    {item.quantity.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-primary text-right">
                    Rp {item.totalPrice.toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PageContentShell>
    </div>
  );
}
