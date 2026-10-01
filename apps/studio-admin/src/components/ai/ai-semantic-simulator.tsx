import React from "react";
import { 
  FlaskConical, 
  Search, 
  Loader2, 
  Database, 
  BrainCircuit,
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  Button, 
  Input, 
  Label, 
  Badge 
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { CATEGORIES, KNOWLEDGE_SCOPES } from "./types";
import type { VectorSearchResultItem } from "@/lib/actions/gateways/ai";

interface AiSemanticSimulatorProps {
  simQuery: string;
  setSimQuery: (q: string) => void;
  simMinSimilarity: number;
  setSimMinSimilarity: (v: number) => void;
  simLimit: number;
  setSimLimit: (l: number) => void;
  simScope: string;
  setSimScope: (s: string) => void;
  simResults: VectorSearchResultItem[];
  simTotalMatches: number;
  simSearching: boolean;
  hasSearched: boolean;
  onSimulateSearch: (e?: React.FormEvent) => void;
}

const PRESET_QUERIES = [
  "Standar redaman GPON ZTE C320",
  "Jarak maksimal kabel drop core ODP ke pelanggan",
  "Arsitektur database spasial PostGIS SRID 4326",
  "Prosedur 3-layer backup dan Nextcloud",
  "Daftar port gateway internal K2NET",
];

interface FormProps {
  simQuery: string;
  setSimQuery: (q: string) => void;
  simMinSimilarity: number;
  setSimMinSimilarity: (v: number) => void;
  simLimit: number;
  setSimLimit: (l: number) => void;
  simScope: string;
  setSimScope: (s: string) => void;
  simSearching: boolean;
  onSimulateSearch: (e?: React.FormEvent) => void;
}

function AiSimulatorForm({
  simQuery,
  setSimQuery,
  simMinSimilarity,
  setSimMinSimilarity,
  simLimit,
  setSimLimit,
  simScope,
  setSimScope,
  simSearching,
  onSimulateSearch,
}: FormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSimulateSearch} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="simQuery" className="text-xs font-semibold text-foreground">
          {t("ai.query_input_label")}
        </Label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/75 dark:text-muted-foreground" />
          <Input
            id="simQuery"
            type="text"
            placeholder={t("ai.query_placeholder")}
            value={simQuery}
            onChange={(e) => setSimQuery(e.target.value)}
            className="pl-10 pr-24 h-11 text-xs bg-background border-border text-foreground"
          />
          <Button
            type="submit"
            size="sm"
            disabled={simSearching || !simQuery.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
          >
            {simSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5" />
            )}
            {t("ai.test_vector_btn")}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">
          {t("ai.quick_presets")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSimQuery(preset);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 hover:bg-muted text-foreground/75 dark:text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/60">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>{t("ai.scope_visibility_category")}</span>
            <span className="text-[10px] text-foreground/75 dark:text-muted-foreground font-mono">{simScope}</span>
          </Label>
          <select
            value={simScope}
            onChange={(e) => setSimScope(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <optgroup label={t("ai.scope_multitenant_group")}>
              <option value="ALL">{t("ai.scope_all")}</option>
              <option value="PLATFORM_INTERNAL">{t("ai.scope_platform")}</option>
              <option value="TENANT_INTERNAL">{t("ai.scope_tenant")}</option>
              <option value="GLOBAL">{t("ai.scope_global")}</option>
            </optgroup>
            <optgroup label={t("ai.specific_category_group")}>
              {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>{t("ai.min_similarity_threshold")}</span>
            <span className="text-[10px] font-mono text-primary font-semibold">
              {(simMinSimilarity * 100).toFixed(0)}%
            </span>
          </Label>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={simMinSimilarity}
            onChange={(e) => setSimMinSimilarity(parseFloat(e.target.value))}
            className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>{t("ai.chunk_limit")}</span>
            <span className="text-[10px] font-mono text-primary font-semibold">
              {t("ai.chunks_count", { count: simLimit })}
            </span>
          </Label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={simLimit}
            onChange={(e) => setSimLimit(parseInt(e.target.value))}
            className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </form>
  );
}

interface ResultsProps {
  simResults: VectorSearchResultItem[];
  simTotalMatches: number;
  simSearching: boolean;
  hasSearched: boolean;
  simMinSimilarity: number;
}

function AiSimulatorResultList({
  simResults,
  simTotalMatches,
  simSearching,
  hasSearched,
  simMinSimilarity,
}: ResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-primary" />
          {t("ai.results_header", { count: simTotalMatches })}
        </h3>
        {hasSearched && (
          <Badge variant="outline" className="text-[10px] font-mono">
            {t("ai.cosine_threshold_badge", { pct: (simMinSimilarity * 100).toFixed(0) })}
          </Badge>
        )}
      </div>

      {simSearching ? (
        <div className="p-8 text-center border border-border/80 rounded-xl bg-muted/20">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">
            {t("ai.cosine_calculating")}
          </p>
        </div>
      ) : simResults.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/20 text-foreground/75 dark:text-muted-foreground text-xs">
          {hasSearched
            ? t("ai.no_results_tolerance")
            : t("ai.no_results_cta")}
        </div>
      ) : (
        <div className="space-y-3">
          {simResults.map((res, i) => {
            const scorePercent = (res.similarity_score * 100).toFixed(1);
            const scopeMeta = KNOWLEDGE_SCOPES.find((s) => s.id === res.scope) || KNOWLEDGE_SCOPES[2];
            return (
              <div
                key={i}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span>#{i + 1} {res.title}</span>
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        {t("ai.chunk_number", { index: res.chunk_index })}
                      </Badge>
                      {res.scope && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border ${scopeMeta.accentBg} ${scopeMeta.accentBorder}`}>
                          {scopeMeta.shortLabel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-foreground/75 dark:text-muted-foreground font-mono">
                      {t("ai.category_label", { category: res.category })} • {t("ai.doc_id_label", { id: res.document_id?.slice(0, 8) })}...
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-primary flex items-center gap-1 justify-end">
                      <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                      {scorePercent}%
                    </div>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(res.similarity_score * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed border border-border/40">
                  {res.content_preview}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AiSemanticSimulator({
  simQuery,
  setSimQuery,
  simMinSimilarity,
  setSimMinSimilarity,
  simLimit,
  setSimLimit,
  simScope,
  setSimScope,
  simResults,
  simTotalMatches,
  simSearching,
  hasSearched,
  onSimulateSearch,
}: AiSemanticSimulatorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                {t("ai.sim_card_title")}
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 font-mono">
                  {t("ai.live_pgvector_test")}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                {t("ai.sim_card_subtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          <AiSimulatorForm
            simQuery={simQuery}
            setSimQuery={setSimQuery}
            simMinSimilarity={simMinSimilarity}
            setSimMinSimilarity={setSimMinSimilarity}
            simLimit={simLimit}
            setSimLimit={setSimLimit}
            simScope={simScope}
            setSimScope={setSimScope}
            simSearching={simSearching}
            onSimulateSearch={onSimulateSearch}
          />

          <AiSimulatorResultList
            simResults={simResults}
            simTotalMatches={simTotalMatches}
            simSearching={simSearching}
            hasSearched={hasSearched}
            simMinSimilarity={simMinSimilarity}
          />
        </CardContent>
      </Card>
    </div>
  );
}
