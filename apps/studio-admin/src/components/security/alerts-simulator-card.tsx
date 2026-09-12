import { useState } from "react";
import { Play } from "lucide-react";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import type { useSecuritySettings } from "@/hooks/useSecuritySettings";

interface AlertsSimulatorCardProps {
  simulateTravel: ReturnType<typeof useSecuritySettings>["simulateTravel"];
  simulateFail: ReturnType<typeof useSecuritySettings>["simulateFail"];
  isSimulating: boolean;
}

export function AlertsSimulatorCard({
  simulateTravel,
  simulateFail,
  isSimulating,
}: AlertsSimulatorCardProps) {
  const [simUserId, setSimUserId] = useState("00000000-0000-0000-0000-000000000001");
  const [simUsername, setSimUsername] = useState("john.doe");
  const [simIp, setSimIp] = useState("185.220.101.5");
  const [simFailIp, setSimFailIp] = useState("103.45.122.9");
  const [simFailCount, setSimFailCount] = useState(5);

  const handleSimulateTravel = async () => {
    try {
      const res = await simulateTravel({
        userId: simUserId,
        username: simUsername,
        ipAddress: simIp,
      });
      if (res.triggeredAnomaly) {
        toast.warning(res.message || "Impossible Travel Anomaly triggered!");
      } else {
        toast.info(res.message || "Travel looks safe.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to simulate travel.");
    }
  };

  const handleSimulateFail = async () => {
    try {
      await simulateFail({
        username: simUsername,
        ipAddress: simFailIp,
        count: simFailCount,
      });
      toast.success(`Simulated ${simFailCount} failed logins successfully.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to simulate failed logins.");
    }
  };

  return (
    <Card glowingEffect className="bg-card/30 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" /> Incident Simulator
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Generate mock login events to test the alert feed, email verification, and firewall blocks.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {/* Impossible Travel Simulation */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">1. Impossible Travel</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sim_user" className="text-muted-foreground text-[9px]">
                User ID
              </Label>
              <Input
                id="sim_user"
                value={simUserId}
                onChange={(e) => setSimUserId(e.target.value)}
                className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sim_username" className="text-muted-foreground text-[9px]">
                Username
              </Label>
              <Input
                id="sim_username"
                value={simUsername}
                onChange={(e) => setSimUsername(e.target.value)}
                className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sim_ip" className="text-muted-foreground text-[9px]">
              Simulated Remote IP
            </Label>
            <Input
              id="sim_ip"
              value={simIp}
              onChange={(e) => setSimIp(e.target.value)}
              className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
            />
          </div>
          <ActionTooltip label="Jalankan Simulasi Anomali Impossible Travel" shortcut="Alt+T">
            <Button
              onClick={handleSimulateTravel}
              disabled={isSimulating}
              className="w-full bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/35 text-rose-400 text-xs h-8 font-medium transition-all shadow-md gap-2"
            >
              Simulate Travel Anomaly
            </Button>
          </ActionTooltip>
        </div>

        <div className="border-t border-border/60 pt-4 space-y-3">
          {/* Brute Force Simulation */}
          <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">2. Brute Force Login</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sim_fail_ip" className="text-muted-foreground text-[9px]">
                Attacker IP
              </Label>
              <Input
                id="sim_fail_ip"
                value={simFailIp}
                onChange={(e) => setSimFailIp(e.target.value)}
                className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sim_fail_count" className="text-muted-foreground text-[9px]">
                Fail Count
              </Label>
              <Input
                id="sim_fail_count"
                type="number"
                min={1}
                max={20}
                value={simFailCount}
                onChange={(e) => setSimFailCount(Number(e.target.value))}
                className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
              />
            </div>
          </div>
          <ActionTooltip label="Jalankan Simulasi Percobaan Brute Force" shortcut="Alt+B">
            <Button
              onClick={handleSimulateFail}
              disabled={isSimulating}
              className="w-full bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/35 text-rose-400 text-xs h-8 font-medium transition-all shadow-md gap-2"
            >
              Simulate Brute Force
            </Button>
          </ActionTooltip>
        </div>
      </CardContent>
    </Card>
  );
}
