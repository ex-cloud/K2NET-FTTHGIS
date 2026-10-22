import * as React from "react";
import {
  Card,
  Button,
  Badge,
  Input,
  Switch,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Search,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  Mail,
  Smartphone,
  Boxes,
} from "lucide-react";
import {
  useUpdateMessageTemplate,
  type MessageTemplate,
} from "@/hooks/useMessageTemplates";

interface MessageTemplatesTableProps {
  templates: MessageTemplate[];
  loading?: boolean;
  onPreview: (template: MessageTemplate) => void;
  onEdit: (template: MessageTemplate) => void;
  onDelete: (template: MessageTemplate) => void;
  onCreateNew: () => void;
}

export function MessageTemplatesTable({
  templates,
  loading,
  onPreview,
  onEdit,
  onDelete,
  onCreateNew,
}: MessageTemplatesTableProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateMessageTemplate();

  const [search, setSearch] = React.useState<string>("");
  const [channelFilter, setChannelFilter] = React.useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");

  const filtered = React.useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        search === "" ||
        tpl.code.toLowerCase().includes(search.toLowerCase()) ||
        tpl.name.toLowerCase().includes(search.toLowerCase()) ||
        (tpl.subjectTemplate && tpl.subjectTemplate.toLowerCase().includes(search.toLowerCase()));

      const matchChannel =
        channelFilter === "ALL" || tpl.channel === channelFilter;

      const matchCategory =
        categoryFilter === "ALL" || tpl.category === categoryFilter;

      return matchSearch && matchChannel && matchCategory;
    });
  }, [templates, search, channelFilter, categoryFilter]);

  const handleToggleActive = async (template: MessageTemplate) => {
    await updateMutation.mutateAsync({
      id: template.id,
      payload: {
        name: template.name,
        channel: template.channel,
        category: template.category,
        subjectTemplate: template.subjectTemplate,
        bodyTemplate: template.bodyTemplate,
        active: !template.active,
      },
    });
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("billing.templates_search_placeholder")}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">{t("billing.templates_filter_all_channels")}</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">{t("billing.templates_filter_all_categories")}</option>
              <option value="DUNNING">Dunning</option>
              <option value="BILLING">Billing</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={onCreateNew}
          className="gap-1.5 text-xs font-medium shrink-0"
        >
          <PlusCircle className="size-3.5" />
          <span>{t("billing.templates_create_btn")}</span>
        </Button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
            <tr>
              <th className="py-2.5 px-4 font-semibold">{t("billing.templates_th_code")}</th>
              <th className="py-2.5 px-4 font-semibold">{t("billing.templates_th_channel")}</th>
              <th className="py-2.5 px-4 font-semibold">{t("billing.templates_th_category")}</th>
              <th className="py-2.5 px-4 font-semibold">{t("billing.templates_th_subject")}</th>
              <th className="py-2.5 px-4 font-semibold text-center">{t("billing.templates_th_status")}</th>
              <th className="py-2.5 px-4 font-semibold text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="h-12 bg-muted/10 px-4" />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Boxes className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="font-medium text-foreground">{t("billing.templates_empty_title")}</p>
                  <p className="text-[11px] mt-0.5">{t("billing.templates_empty_desc")}</p>
                </td>
              </tr>
            ) : (
              filtered.map((tpl) => {
                const isWa = tpl.channel === "WHATSAPP";
                const isEmail = tpl.channel === "EMAIL";

                return (
                  <tr key={tpl.id} className="hover:bg-muted/20 transition-colors">
                    {/* Code & Name */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-foreground text-xs">
                          {tpl.code}
                        </span>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {tpl.name}
                        </p>
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-4">
                      {isEmail ? (
                        <Badge variant="outline" className="gap-1 text-[10px] font-mono">
                          <Mail className="size-3 text-primary" />
                          <span>EMAIL</span>
                        </Badge>
                      ) : isWa ? (
                        <Badge variant="outline" className="gap-1 text-[10px] font-mono text-primary border-primary/30">
                          <Smartphone className="size-3 text-primary" />
                          <span>WHATSAPP</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {tpl.channel}
                        </Badge>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] font-mono ${
                          tpl.category === "DUNNING"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : tpl.category === "BILLING"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {tpl.category}
                      </Badge>
                    </td>

                    {/* Subject preview */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-[11px] text-muted-foreground line-clamp-1 font-mono">
                        {tpl.subjectTemplate || tpl.bodyTemplate.substring(0, 50) + "..."}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <Switch
                        checked={tpl.active}
                        onCheckedChange={() => handleToggleActive(tpl)}
                        disabled={updateMutation.isPending}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onPreview(tpl)}
                          className="h-6 px-2 text-[11px] gap-1"
                          title={t("billing.templates_action_preview")}
                        >
                          <Eye className="size-3" />
                          <span className="hidden md:inline">{t("billing.templates_action_preview")}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onEdit(tpl)}
                          className="h-6 px-2 text-[11px] gap-1"
                          title={t("billing.templates_action_edit")}
                        >
                          <Edit3 className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onDelete(tpl)}
                          className="h-6 px-2 text-[11px] text-destructive hover:text-destructive gap-1"
                          title={t("billing.templates_action_delete")}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
