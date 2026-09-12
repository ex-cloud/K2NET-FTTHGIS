import type { EnrichedOrganization } from "../types";
import { useOrgDocumentsState } from "./documents/useOrgDocumentsState";
import { DocumentsHeaderBar } from "./documents/DocumentsHeaderBar";
import { DocumentsKeyCards } from "./documents/DocumentsKeyCards";
import { DocumentsTable } from "./documents/DocumentsTable";
import { DocumentUploadModal } from "./documents/DocumentUploadModal";
import { DocumentPreviewModal } from "./documents/DocumentPreviewModal";

export type { DocumentCategory, TenantDocument } from "./documents/types";

interface OrgDocumentsTabProps {
  organization: EnrichedOrganization;
}

export function OrgDocumentsTab({ organization: org }: OrgDocumentsTabProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isUploadOpen,
    setIsUploadOpen,
    previewDoc,
    setPreviewDoc,
    newDocName,
    setNewDocName,
    newDocCategory,
    setNewDocCategory,
    newDocFile,
    setNewDocFile,
    uploading,
    documents,
    filteredDocs,
    handleUploadSubmit,
    handleDelete,
    handleDownload,
  } = useOrgDocumentsState(org);

  return (
    <div className="space-y-6">
      {/* 1. KYC & Legal Verification Banner */}
      <DocumentsHeaderBar onOpenUpload={() => setIsUploadOpen(true)} />

      {/* 2. Key B2B Document Cards Grid */}
      <DocumentsKeyCards
        org={org}
        documents={documents}
        onPreview={(doc) => setPreviewDoc(doc)}
      />

      {/* 3. Document Repository & Explorer Table */}
      <DocumentsTable
        slug={org.slug}
        filteredDocs={filteredDocs}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onPreview={(doc) => setPreviewDoc(doc)}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      {/* 4. Upload Document Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        orgName={org.name}
        newDocName={newDocName}
        setNewDocName={setNewDocName}
        newDocCategory={newDocCategory}
        setNewDocCategory={setNewDocCategory}
        newDocFile={newDocFile}
        setNewDocFile={setNewDocFile}
        uploading={uploading}
        onSubmit={handleUploadSubmit}
      />

      {/* 5. Document Preview Modal */}
      <DocumentPreviewModal
        previewDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}
