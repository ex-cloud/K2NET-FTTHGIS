import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "@/lib/navigation-compat";
import { FlaskConical, Plus, Network, Database } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { simulateVectorSearch, type VectorSearchResultItem } from "@/lib/actions/gateways";
import { AiSemanticSimulator } from "@/components/ai/ai-semantic-simulator";

function AiSimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  // Semantic Search Simulator State (Real-time pgvector testing)
  const initialQuery = searchParams.get("query") || "Standar redaman GPON ZTE C320";
  const [simQuery, setSimQuery] = useState(initialQuery);
  const [simMinSimilarity, setSimMinSimilarity] = useState(0.2);
  const [simLimit, setSimLimit] = useState(4);
  const [simScope, setSimScope] = useState("GENERAL");
  const [simResults, setSimResults] = useState<VectorSearchResultItem[]>([]);
  const [simTotalMatches, setSimTotalMatches] = useState(0);
  const [simSearching, setSimSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSimulateSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simQuery.trim()) {
      toast.error(t("ai.enter_query_prompt"));
      return;
    }

    try {
      setSimSearching(true);
      const res = await simulateVectorSearch({
        query: simQuery,
        min_similarity: simMinSimilarity,
        limit: simLimit,
        scope: simScope,
      });
      if (res && res.results) {
        setSimResults(res.results || []);
        setSimTotalMatches(res.total_matches || 0);
        setHasSearched(true);
        if ((res.results || []).length === 0) {
          toast.info(t("ai.no_chunks_found"));
        }
      } else {
        toast.error(t("ai.sim_vector_failed"));
      }
    } catch {
      toast.error(t("ai.network_pgvector_failed"));
    } finally {
      setSimSearching(false);
    }
  }, [simQuery, simMinSimilarity, simLimit, simScope, t]);

  useEffect(() => {
    if (searchParams.get("query")) {
      handleSimulateSearch();
    }
  }, [searchParams, handleSimulateSearch]);

  return (
    <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {t("ai.simulator_title")}
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                {t("ai.live_vector_probe")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("ai.simulator_subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionTooltip label={t("ai.doc_list_tooltip")} shortcut="Esc">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/ai")}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              {t("ai.doc_list")}
            </Button>
          </ActionTooltip>
          <ActionTooltip label={t("ai.graph_2d_tooltip")} shortcut="S then G">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/ai/graph")}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              {t("ai.graph_2d")}
            </Button>
          </ActionTooltip>
          <ActionTooltip label={t("ai.add_document_tooltip")} shortcut="N">
            <Button
              size="sm"
              onClick={() => router.push("/ai/add")}
              className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("ai.add_document")}
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* Semantic Simulator Component */}
      <AiSemanticSimulator
        simQuery={simQuery}
        setSimQuery={setSimQuery}
        simMinSimilarity={simMinSimilarity}
        setSimMinSimilarity={setSimMinSimilarity}
        simLimit={simLimit}
        setSimLimit={setSimLimit}
        simScope={simScope}
        setSimScope={setSimScope}
        simResults={simResults}
        simTotalMatches={simTotalMatches}
        simSearching={simSearching}
        hasSearched={hasSearched}
        onSimulateSearch={handleSimulateSearch}
      />

    </div>
  );
}

export default function AiSimulatorPage() {
  const { t } = useTranslation();

  return (
    <AiPageWrapper>
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">{t("ai.loading_simulator")}</div>}>
        <AiSimulatorContent />
      </Suspense>
    </AiPageWrapper>
  );
}
