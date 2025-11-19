
export type Row = Record<string, string | number | boolean | null>;

export type SortDirection = 'ascending' | 'descending';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface SheetData {
  headers: string[];
  rows: Row[];
}

export interface SheetMetadata {
  key: string; // Identificador único da planilha
  name: string; // Nome de exibição da planilha
  createdAt: string;
  updatedAt: string;
}

export interface StoredSheet {
  metadata: SheetMetadata;
  data: SheetData;
  visibleColumns: string[];
}
