import * as React from "react";
import { Check } from "lucide-react";
import { Badge, DialogHeader, DialogTitle, DialogDescription } from "@k2net/ui";

interface WizardHeaderProps {
  step: number;
}

const STEP_TITLES: Record<number, { title: string; desc: string }> = {
  1: {
    title: "Langkah 1: Identitas & Subdomain Portal",
    desc: "Daftarkan identitas ISP mitra dan alamat subdomain akses GIS portal.",
  },
  2: {
    title: "Langkah 2: Paket Lisensi & Hardware Quota",
    desc: "Tentukan alokasi batas kapasitas hardware (OLT & ODP) serta MinIO storage.",
  },
  3: {
    title: "Langkah 3: Integrasi Jaringan & VPN Mesh",
    desc: "Konfigurasikan alokasi IP WireGuard VPN Tunnel dan Active Directory/LDAP.",
  },
  4: {
    title: "Langkah 4: Admin PIC & Setup Realm Keycloak",
    desc: "Buat akun penanggung jawab teknis dan generate realm Keycloak terisolasi.",
  },
  5: {
    title: "Infrastructure Provisioned Successfully!",
    desc: "Semua service telah siap. Harap simpan kredensial akses di bawah ini.",
  },
};

export function WizardHeader({ step }: WizardHeaderProps) {
  const currentStepInfo = STEP_TITLES[step] || STEP_TITLES[1];

  return (
    <DialogHeader className="p-6 pb-3 border-b border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs font-mono">
            {step <= 4 ? step : <Check className="size-4" />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">
            {step <= 4 ? `Step ${step} of 4 • Provisioning Wizard` : "Deployment Ready"}
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground">
          Enterprise SaaS
        </Badge>
      </div>

      <DialogTitle className="text-lg font-bold text-foreground mt-1">
        {currentStepInfo.title}
      </DialogTitle>
      <DialogDescription className="text-xs text-muted-foreground">
        {currentStepInfo.desc}
      </DialogDescription>
    </DialogHeader>
  );
}
