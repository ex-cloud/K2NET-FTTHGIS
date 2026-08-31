

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@k2net/ui";
import { useRouter } from "@/lib/navigation-compat";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { useAiKnowledge } from "@/hooks/useAiKnowledge";
import { AiDocumentItem } from "@/lib/actions/gateways";

import { AiKpiCards } from "@/components/ai/ai-kpi-cards";
import { AiKnowledgeTable } from "@/components/ai/ai-knowledge-table";
import { AiVectorExplorerModal } from "@/components/ai/ai-vector-explorer-modal";
import { AiEditKnowledgeModal } from "@/components/ai/ai-edit-knowledge-modal";

export default function AiKnowledgePage() {
  const router = useRouter();
  const {
    documents,
    docsTotal,
    totalCount,
    totalChunks,
    totalBytes,
    stats,
    statsLoading,
    syncStatus,
    syncStatusLoading,
    loading: docsLoading,
    loadingMore,
    hasMore,
    selectedCategory,
    setSelectedCategory,
    selectedScope,
    setSelectedScope,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    fetchMore,
    refresh,
    approve,
    reject,
    remove,
    syncServerDocs,
    isSyncing,
  } = useAiKnowledge();

  // Edit Knowledge Modal state
  const [editingDoc, setEditingDoc] = useState<AiDocumentItem | null>(null);

  // Vector Explorer Dialog State
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Daftar Pengetahuan SOP & RAG
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                  pgvector 1536 dim
                </Badge>
              </div>
              <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                Basis data pengetahuan teknis FTTH, manual hardware OLT/ONT, dan prosedur operasional jaringan K2NET.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <AiKpiCards 
          stats={stats} 
          loading={statsLoading} 
          onOpenExplorer={() => setIsExplorerOpen(true)}
        />

        {/* Full-Width Table View with Solid Sticky Header & Proportional Grid */}
        <AiKnowledgeTable
          documents={documents}
          docsLoading={docsLoading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          totalCount={totalCount}
          totalChunks={totalChunks}
          totalBytes={totalBytes}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedScope={selectedScope}
          setSelectedScope={setSelectedScope}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onEdit={(doc) => setEditingDoc(doc)}
          onApprove={approve}
          onReject={reject}
          onDelete={remove}
          onGoToUpload={() => router.push("/ai/add")}
          onSyncServerDocs={syncServerDocs}
          onRefresh={refresh}
          onFetchMore={fetchMore}
          isSyncing={isSyncing}
          syncStatus={syncStatus}
          syncStatusLoading={syncStatusLoading}
          onInspectVector={() => setIsExplorerOpen(true)}
          onTestSimulator={(title) => {
            router.push(`/ai/simulator?query=${encodeURIComponent(title)}`);
          }}
        />

        {/* Edit Knowledge Modal */}
        <AiEditKnowledgeModal
          document={editingDoc}
          isOpen={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          onSuccess={refresh}
        />

        {/* Vector Chunk Explorer Modal */}
        <AiVectorExplorerModal
          isOpen={isExplorerOpen}
          setIsOpen={setIsExplorerOpen}
          stats={stats}
          documents={documents}
          onOpenSimulator={() => {
            setIsExplorerOpen(false);
            router.push("/ai/simulator");
          }}
        />

      </div>
    </AiPageWrapper>
  );
}
