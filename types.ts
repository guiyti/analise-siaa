
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

export type SheetType = 'Ofertas' | 'Alunos' | string;

export interface SheetPeriod {
  year: number;
  semester: 1 | 2;
}

export interface SheetMetadata {
  type: SheetType;
  period: SheetPeriod;
  key: string; // tipo_ano_semestre
  createdAt: string;
  updatedAt: string;
}

export interface StoredSheet {
  metadata: SheetMetadata;
  data: SheetData;
  visibleColumns: string[];
}
