import { Card, CardContent } from "@k2net/ui";

interface TrashKpiCardsProps {
  stats: {
    total: number;
    organizations: number;
    projects: number;
    tasks: number;
    networkAssets: number;
  };
}

export function TrashKpiCards({ stats }: TrashKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      <Card className="bg-card border-border shadow-xs">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total di Trash</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {stats.total}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-xs">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Organizations</div>
          <div className="text-2xl font-bold font-mono text-blue-500 mt-1">
            {stats.organizations}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-xs">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">GIS Projects</div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {stats.projects}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-xs">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Tasks &amp; Tickets</div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
            {stats.tasks}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-xs">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Network Assets</div>
          <div className="text-2xl font-bold font-mono text-purple-500 mt-1">
            {stats.networkAssets}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
