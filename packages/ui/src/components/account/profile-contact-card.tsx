import * as React from "react";
import { User, Mail, Phone, AtSign, Loader2, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { UserProfileData, AccountLabels } from "./account-types";

export interface ProfileContactCardProps {
  user?: UserProfileData;
  labels?: AccountLabels;
  onSaveProfile?: (data: { name: string; phone: string }) => Promise<void> | void;
  isLoading?: boolean;
}

export function ProfileContactCard({
  user,
  labels,
  onSaveProfile,
  isLoading = false,
}: ProfileContactCardProps) {
  const [name, setName] = React.useState(user?.name || "");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user?.name !== undefined) setName(user.name || "");
    if (user?.phone !== undefined) setPhone(user.phone || "");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveProfile) return;
    try {
      setIsSubmitting(true);
      await onSaveProfile({ name, phone });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-border/80 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          {labels?.profileTitle || "Personal Profile & Contact"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {labels?.profileDesc || "Your public identity and operational contact information."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="account-full-name" className="text-xs font-medium">
                {labels?.fullNameLabel || "Full Name"}
              </Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="account-full-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={labels?.fullNamePlaceholder || "e.g. John Doe"}
                  className="pl-8 h-8 text-xs"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-username" className="text-xs font-medium">
                {labels?.usernameLabel || "Username"}
              </Label>
              <div className="relative">
                <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="account-username"
                  type="text"
                  value={user?.username || ""}
                  readOnly
                  disabled
                  className="pl-8 h-8 text-xs bg-muted/40 cursor-not-allowed text-muted-foreground font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="account-email" className="text-xs font-medium">
                {labels?.emailLabel || "Email Address"}
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="account-email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                  className="pl-8 h-8 text-xs bg-muted/40 cursor-not-allowed text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-phone" className="text-xs font-medium">
                {labels?.phoneLabel || "Phone / WhatsApp Number"}
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="account-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={labels?.phonePlaceholder || "+6281234567890"}
                  className="pl-8 h-8 text-xs"
                  disabled={isLoading || isSubmitting}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {labels?.phoneDesc || "Used for operational security notifications and two-step verification."}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-4 border-t border-border/40 flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>{labels?.saving || "Saving..."}</span>
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                <span>{labels?.saveProfileBtn || "Save Profile"}</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
