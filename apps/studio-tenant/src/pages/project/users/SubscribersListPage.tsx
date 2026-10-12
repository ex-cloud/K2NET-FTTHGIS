import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export function SubscribersListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "proj-bdg-01";
  const [searchQuery, setSearchQuery] = React.useState("");

  const subscribers = [
    {
      id: "sub-1",
      customerCode: "CUST-08421",
      name: "Bambang Sudarmono",
      pppoeUser: "bambang@ispnet",
      ipAddress: "100.64.12.45",
      odpCode: "ODP-DGO-01",
      port: 4,
      ontSn: "ZTEGC84A12B9",
      rxDbm: -18.2,
      status: "ONLINE",
    },
    {
      id: "sub-2",
      customerCode: "CUST-08422",
      name: "Ibu Ratna Juwita",
      pppoeUser: "ratna@ispnet",
      ipAddress: "100.64.12.46",
      odpCode: "ODP-DGO-01",
      port: 5,
      ontSn: "HWTC99A041C2",
      rxDbm: -19.4,
      status: "ONLINE",
    },
    {
      id: "sub-3",
      customerCode: "CUST-08424",
      name: "Ahmad Maulana",
      pppoeUser: "ahmad@ispnet",
      ipAddress: "100.64.12.47",
      odpCode: "ODP-DGO-03",
      port: 2,
      ontSn: "FHTT0412889A",
      rxDbm: -26.8,
      status: "HIGH_ATTENUATION",
    },
  ];

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.customer_title")}
        subtitle={t("inventory.customer_subtitle")}
        icon={Users}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80"
          />
        </div>
      </div>

        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.customer_name").toUpperCase()}</TableHead>
                <TableHead className="font-bold">USER PPPOE</TableHead>
                <TableHead className="font-bold">IP ASSIGNED</TableHead>
                <TableHead className="font-bold">{t("inventory.odp_code").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.ont_sn").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.optical_rx_power").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((s) => (
                <TableRow key={s.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">{s.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {s.customerCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-primary font-medium">
                    {s.pppoeUser}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.ipAddress}</TableCell>
                  <TableCell className="font-mono font-medium">
                    {s.odpCode} (Port #{s.port})
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.ontSn}</TableCell>
                  <TableCell>
                    <span
                      className={`font-mono font-bold ${
                        s.rxDbm < -25
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-primary"
                      }`}
                    >
                      {s.rxDbm} dBm
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        s.status === "ONLINE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {s.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
    </PageLayout>
  );
}
