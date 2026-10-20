import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Download,
  Printer,
  Calculator,
  Loader2,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  EmptyState,
} from "@k2net/ui";
import { toast } from "sonner";
import { networkApi, type BoqSummary } from "../../../lib/api/network";
import { useTranslation } from "@k2net/i18n";

export function BoqGeneratorPage() {
  const { t, formatCurrency, formatNumber } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "";

  const [boqData, setBoqData] = React.useState<BoqSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function loadBoq() {
      if (!projectId) {
        setBoqData(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await networkApi.getBoqEstimation(projectId);
        if (isMounted) setBoqData(res);
      } catch {
        if (isMounted) setBoqData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBoq();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleExportPDF = () => {
    toast.success(t("common.export"));
  };

  const handleExportExcel = () => {
    toast.success(t("common.export"));
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.boq_title")}
        subtitle={t("inventory.boq_subtitle")}
        icon={Calculator}
        actions={
          boqData && boqData.items.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
              >
                <Download className="h-3.5 w-3.5" />
                {t("inventory.export_excel")}
              </Button>
              <Button
                size="sm"
                onClick={handleExportPDF}
                className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md"
              >
                <Printer className="h-3.5 w-3.5" />
                {t("inventory.export_pdf")}
              </Button>
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <Card className="border-border/60 p-8 flex items-center justify-center text-muted-foreground shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <span className="text-xs">{t("common.loading", { defaultValue: "Loading..." })}</span>
        </Card>
      ) : boqData && boqData.items.length > 0 ? (
        <>
          {/* Total Cost Banner Card */}
          <Card className="p-5 border-border/60 bg-card shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("inventory.total_estimated_cost")}
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-primary">
                    {formatCurrency(boqData.totalEstimatedCost || 0)}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                <span>{boqData.metadata?.totalCableLengthKm ?? 0} Km {t("gis.layer_cables")}</span>
                <span>•</span>
                <span>{boqData.metadata?.totalOdc ?? 0} ODC</span>
                <span>•</span>
                <span>{boqData.metadata?.totalOdp ?? 0} ODP</span>
              </div>
            </div>
          </Card>

          {/* Material Items Table */}
          <Card className="border-border/60 overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[11px]">
                  <TableHead className="font-bold">{t("inventory.item_code").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.item_description").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("common.description").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.unit").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.unit_price").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.quantity").toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t("inventory.total_price").toUpperCase()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boqData.items.map((item) => (
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
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {formatNumber(item.quantity)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-primary text-right">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={<Calculator className="h-6 w-6 text-muted-foreground" />}
          title={t("common.no_results")}
          description={t("inventory.boq_subtitle")}
        />
      )}
    </PageLayout>
  );
}
