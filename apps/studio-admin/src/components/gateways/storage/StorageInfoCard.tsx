import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";

export function StorageInfoCard() {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Informasi Layanan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Library Kompresi</span>
          <Badge className="bg-muted text-muted-foreground border-border text-[9px]">chai2010/webp</Badge>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Format Output</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">WebP Only</Badge>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Batas Gambar</span>
          <Badge className="bg-background text-muted-foreground border-border text-[9px]">Max 10 MB</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Batas Non-Gambar</span>
          <Badge className="bg-background text-muted-foreground border-border text-[9px]">Max 150 MB</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
