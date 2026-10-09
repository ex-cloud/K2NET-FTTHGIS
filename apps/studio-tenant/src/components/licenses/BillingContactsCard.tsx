import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Label, Switch } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { BillingContacts } from "../../hooks/useTenantLicense";
import { Mail, Phone, User, BellRing, Save, Loader2 } from "lucide-react";

interface BillingContactsCardProps {
  contacts?: BillingContacts;
  isLoading?: boolean;
  onSave: (data: BillingContacts) => Promise<unknown>;
  isSaving?: boolean;
}

export function BillingContactsCard({
  contacts,
  isLoading = false,
  onSave,
  isSaving = false,
}: BillingContactsCardProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = React.useState<BillingContacts>({
    billingContactName: "",
    billingContactEmail: "",
    billingContactPhone: "",
    notifyEmailEnabled: true,
    notifyWhatsappEnabled: true,
  });

  React.useEffect(() => {
    if (contacts) {
      setFormData({
        billingContactName: contacts.billingContactName ?? "",
        billingContactEmail: contacts.billingContactEmail ?? "",
        billingContactPhone: contacts.billingContactPhone ?? "",
        notifyEmailEnabled: contacts.notifyEmailEnabled ?? true,
        notifyWhatsappEnabled: contacts.notifyWhatsappEnabled ?? true,
      });
    }
  }, [contacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse p-6 border-border/80 bg-card">
        <div className="h-5 w-48 bg-muted rounded mb-2" />
        <div className="h-4 w-72 bg-muted rounded mb-6" />
        <div className="space-y-4">
          <div className="h-9 bg-muted rounded" />
          <div className="h-9 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card shadow-2xs overflow-hidden">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-muted/50 border border-border/80 flex items-center justify-center text-foreground">
              <BellRing className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight">
                {t("license.tenant.contacts_title")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {t("license.tenant.contacts_desc")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs text-foreground/80 font-medium">
                {t("license.tenant.contact_name_label")}
              </Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="contactName"
                  value={formData.billingContactName ?? ""}
                  onChange={(e) => setFormData({ ...formData, billingContactName: e.target.value })}
                  placeholder={t("license.tenant.contact_name_placeholder")}
                  className="h-8 pl-8 text-xs bg-muted/20 border-border/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactEmail" className="text-xs text-foreground/80 font-medium">
                {t("license.tenant.contact_email_label")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.billingContactEmail ?? ""}
                  onChange={(e) => setFormData({ ...formData, billingContactEmail: e.target.value })}
                  placeholder="billing@isp.net"
                  className="h-8 pl-8 text-xs bg-muted/20 border-border/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone" className="text-xs text-foreground/80 font-medium">
                {t("license.tenant.contact_phone_label")}
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="contactPhone"
                  value={formData.billingContactPhone ?? ""}
                  onChange={(e) => setFormData({ ...formData, billingContactPhone: e.target.value })}
                  placeholder="+6281234567890"
                  className="h-8 pl-8 text-xs bg-muted/20 border-border/80"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                {t("license.tenant.channels_title")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("license.tenant.channels_desc")}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="notifyEmail"
                  checked={formData.notifyEmailEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyEmailEnabled: checked })}
                />
                <Label htmlFor="notifyEmail" className="text-xs cursor-pointer font-normal text-foreground/90">
                  {t("license.tenant.channel_email")}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="notifyWhatsapp"
                  checked={formData.notifyWhatsappEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyWhatsappEnabled: checked })}
                />
                <Label htmlFor="notifyWhatsapp" className="text-xs cursor-pointer font-normal text-foreground/90">
                  {t("license.tenant.channel_whatsapp")}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end pt-2 border-t border-border/60 bg-muted/10">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="h-7 px-3 text-xs font-medium gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {t("common.save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
