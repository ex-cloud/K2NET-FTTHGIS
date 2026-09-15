export interface DocumentTemplateContent {
  title: string;
  docNumber: string;
  date: string;
  categoryLabel: string;
  classification: string;
  effectivePeriod?: string;
  sections: {
    heading: string;
    content: string;
    bullets?: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
  signatories?: {
    role: string;
    name: string;
    entity: string;
    signatureDate: string;
  }[];
}
