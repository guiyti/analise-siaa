import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { SheetData, Row, SortConfig, StoredSheet, SheetMetadata, SheetPeriod } from './types';
import DataTable from './components/DataTable';
import { MainMenu } from './components/MainMenu';
import { DataPreviewModal } from './components/DataPreviewModal';

// XLSX is loaded from CDN in index.html, so we declare it here to satisfy TypeScript
declare const XLSX: any;
const STORAGE_SHEETS_KEY = 'spreadsheets';
const STORAGE_CURRENT_KEY = 'currentSheet';

// Utility functions for storage
const loadAllSheets = (): Record<string, StoredSheet> => {
  try {
    const stored = localStorage.getItem(STORAGE_SHEETS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading sheets:', error);
    return {};
  }
};

const saveSheet = (sheet: StoredSheet) => {
  try {
    const allSheets = loadAllSheets();
    allSheets[sheet.metadata.key] = sheet;
    localStorage.setItem(STORAGE_SHEETS_KEY, JSON.stringify(allSheets));
  } catch (error) {
    console.error('Error saving sheet:', error);
    alert('Erro ao salvar dados. O armazenamento local pode estar cheio.');
  }
};

const deleteSheet = (sheetKey: string) => {
  try {
    const allSheets = loadAllSheets();
    delete allSheets[sheetKey];
    localStorage.setItem(STORAGE_SHEETS_KEY, JSON.stringify(allSheets));
  } catch (error) {
    console.error('Error deleting sheet:', error);
  }
};

const generateSheetKey = (type: string, period: SheetPeriod): string => {
  return `${type}_${period.year}_${period.semester}`;
};

// --- Merge Report Modal Component ---
interface MergeReportModalProps {
  report: {
    updated: string[];
    new: string[];
  };
  onClose: () => void;
}

const MergeReportModal: React.FC<MergeReportModalProps> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Relatório de Mesclagem</h2>
        </header>
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="mb-4 text-gray-700 space-y-1">
            <p><strong className="font-semibold text-indigo-600">{report.updated.length}</strong> registros foram atualizados.</p>
            <p><strong className="font-semibold text-indigo-600">{report.new.length}</strong> novos registros foram adicionados.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Registros Atualizados</h3>
              <div className="border rounded-md bg-gray-50 flex-grow p-3 overflow-y-auto min-h-[150px]">
                {report.updated.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {report.updated.map((id) => <li key={`updated-${id}`} className="text-sm text-gray-600 truncate">{id}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic mt-2">Nenhum registro atualizado.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Novos Registros</h3>
              <div className="border rounded-md bg-gray-50 flex-grow p-3 overflow-y-auto min-h-[150px]">
                {report.new.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {report.new.map((id) => <li key={`new-${id}`} className="text-sm text-gray-600 truncate">{id}</li>)}
                  </ul>
                ) : (
                   <p className="text-sm text-gray-500 italic mt-2">Nenhum registro novo.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="p-4 bg-gray-50 border-t text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [allSheets, setAllSheets] = useState<Record<string, StoredSheet>>({});
  const [currentSheetKey, setCurrentSheetKey] = useState<string | null>(null);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mergeReport, setMergeReport] = useState<{ updated: string[]; new: string[] } | null>(null);
  const [pendingFileData, setPendingFileData] = useState<SheetData | null>(null);
  const [isUpdatingCurrentSheet, setIsUpdatingCurrentSheet] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [previewData, setPreviewData] = useState<SheetData | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const filterTimeoutRef = useRef<NodeJS.Timeout>();
  const isUpdatingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSheet = currentSheetKey ? allSheets[currentSheetKey] : null;

  // Load sheets on mount
  useEffect(() => {
    const sheets = loadAllSheets();
    setAllSheets(sheets);
    
    // Use sessionStorage para permitir abas independentes
    const storedCurrent = sessionStorage.getItem(STORAGE_CURRENT_KEY);
    if (storedCurrent && sheets[storedCurrent]) {
      setCurrentSheetKey(storedCurrent);
      setShowMainMenu(false);
    }
    
    setIsInitialized(true);
  }, []);

  // Save current sheet key - usa sessionStorage para isolar cada aba
  useEffect(() => {
    if (currentSheetKey) {
      sessionStorage.setItem(STORAGE_CURRENT_KEY, currentSheetKey);
    } else {
      sessionStorage.removeItem(STORAGE_CURRENT_KEY);
    }
  }, [currentSheetKey]);

  // Função para processar arquivo selecionado
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Não foi possível ler o arquivo.");
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Ler todas as linhas sem pular nenhuma inicialmente
        const allData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
        });
        
        if (allData.length < 2) {
            throw new Error("A planilha está vazia ou não contém dados suficientes.");
        }

        // Detectar automaticamente a linha do cabeçalho (linha 2 ou 3)
        let headerRowIndex = -1;
        let potentialHeaders: any[] = [];
        
        // Tentar linha 2 (índice 1) - formato .xls
        if (allData.length > 1 && allData[1]) {
          const row1 = allData[1];
          const validCells = row1.filter(cell => 
            cell !== null && cell !== undefined && String(cell).trim() !== ''
          );
          
          if (validCells.length >= 3 && validCells.every(cell => typeof cell === 'string')) {
            headerRowIndex = 1;
            potentialHeaders = row1;
          }
        }
        
        // Se não encontrou na linha 2, tentar linha 3 (índice 2) - formato .xlsx/.xlsm
        if (headerRowIndex === -1 && allData.length > 2 && allData[2]) {
          const row2 = allData[2];
          const validCells = row2.filter(cell => 
            cell !== null && cell !== undefined && String(cell).trim() !== ''
          );
          
          if (validCells.length >= 3 && validCells.every(cell => typeof cell === 'string')) {
            headerRowIndex = 2;
            potentialHeaders = row2;
          }
        }
        
        // Se ainda não encontrou, usar a primeira linha não vazia
        if (headerRowIndex === -1) {
          for (let i = 0; i < Math.min(5, allData.length); i++) {
            const row = allData[i];
            const validCells = row.filter(cell => 
              cell !== null && cell !== undefined && String(cell).trim() !== ''
            );
            if (validCells.length >= 2) {
              headerRowIndex = i;
              potentialHeaders = row;
              break;
            }
          }
        }
        
        if (headerRowIndex === -1) {
          throw new Error("Não foi possível detectar o cabeçalho da planilha.");
        }

        // Encontrar índice da primeira coluna com header null/vazio
        let lastValidIndex = potentialHeaders.length;
        
        for (let i = 0; i < potentialHeaders.length; i++) {
          const header = potentialHeaders[i];
          if (header === null || header === undefined || String(header).trim() === '') {
            lastValidIndex = i;
            break;
          }
        }
        
        // Coletar apenas colunas válidas (até o primeiro header null)
        const headers: string[] = potentialHeaders.slice(0, lastValidIndex).map(String);
        
        if (headers.length === 0) {
          throw new Error("Nenhuma coluna válida encontrada.");
        }
        
        // Pegar todas as linhas após o cabeçalho
        const dataRows = allData.slice(headerRowIndex + 1);
        
        const rows: Row[] = dataRows.map(rowData => {
          const rowObject: Row = {};
          headers.forEach((header, index) => {
            rowObject[header] = rowData[index];
          });
          return rowObject;
        }).filter(row => {
          // Filtrar linhas completamente vazias
          return Object.values(row).some(val => val !== null && val !== undefined);
        });

        // Mostrar pré-visualização
        setPreviewData({ headers, rows });
        setShowDataPreview(true);
        setIsLoadingFile(false);
        
        // Limpar input para permitir selecionar o mesmo arquivo novamente
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "Ocorreu um erro ao processar o arquivo. Verifique se o formato está correto.");
        setIsLoadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setIsLoadingFile(false);
      alert("Erro ao ler o arquivo.");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  }, []);

  const handleConfirmPreview = useCallback((modifiedData: SheetData, sheetType?: string, sheetPeriod?: SheetPeriod) => {
    // Se tem tipo e período, é uma nova planilha
    if (sheetType && sheetPeriod) {
      const key = generateSheetKey(sheetType, sheetPeriod);
      const now = new Date().toISOString();

      const newSheet: StoredSheet = {
        metadata: {
          type: sheetType,
          period: sheetPeriod,
          key,
          createdAt: now,
          updatedAt: now,
        },
        data: modifiedData,
        visibleColumns: modifiedData.headers,
      };

      saveSheet(newSheet);
      setAllSheets(prev => ({ ...prev, [key]: newSheet }));
      setCurrentSheetKey(key);
      setShowMainMenu(false);
      setShowDataPreview(false);
      setPreviewData(null);
      setFilters({});
      setDebouncedFilters({});
      setSortConfig(null);
    } else {
      // É atualização, apenas salva os dados modificados
      setPendingFileData(modifiedData);
      setShowDataPreview(false);
      setPreviewData(null);
    }
  }, []);

  const handleCancelPreview = useCallback(() => {
    setShowDataPreview(false);
    setPreviewData(null);
    if (currentSheetKey) {
      setShowMainMenu(false);
    } else {
      setShowMainMenu(true);
    }
  }, [currentSheetKey]);

  // Efeito para processar arquivo carregado
  useEffect(() => {
    if (!pendingFileData) return;
    
    // Se está atualizando planilha atual, atualiza diretamente SEM MOSTRAR MODAL
    if (isUpdatingRef.current && currentSheetKey) {
      // Processar a atualização imediatamente
      const existingSheet = allSheets[currentSheetKey];
      if (!existingSheet) {
        alert('Planilha não encontrada.');
        setPendingFileData(null);
        setIsUpdatingCurrentSheet(false);
        return;
      }

      // Verificar headers
      const existingHeaders = existingSheet.data.headers;
      const newHeaders = pendingFileData.headers;

      if (existingHeaders.length !== newHeaders.length || 
          !existingHeaders.every((h, i) => h === newHeaders[i])) {
        alert(`Erro: Os cabeçalhos não correspondem!\n\nExistente: ${existingHeaders.join(', ')}\nNovo: ${newHeaders.join(', ')}`);
        setPendingFileData(null);
        setIsUpdatingCurrentSheet(false);
        return;
      }

      // Merge logic
      const idKey = existingHeaders[0];
      const updatedIds: string[] = [];
      const newIds: string[] = [];
      const existingRowsMap = new Map(existingSheet.data.rows.map(row => [row[idKey], row]));

      pendingFileData.rows.forEach(newRow => {
        const newRowId = newRow[idKey];
        if (newRowId === null || newRowId === undefined) return;

        if (existingRowsMap.has(newRowId)) {
          updatedIds.push(String(newRowId));
        } else {
          newIds.push(String(newRowId));
        }
        existingRowsMap.set(newRowId, newRow);
      });

      const mergedRows = Array.from(existingRowsMap.values());
      const updatedSheet: StoredSheet = {
        ...existingSheet,
        data: { headers: existingHeaders, rows: mergedRows },
        metadata: { ...existingSheet.metadata, updatedAt: new Date().toISOString() },
      };

      saveSheet(updatedSheet);
      setAllSheets(prev => ({ ...prev, [currentSheetKey]: updatedSheet }));
      setPendingFileData(null);
      setIsUpdatingCurrentSheet(false);
      isUpdatingRef.current = false;
      setFilters({});
      setDebouncedFilters({});
      setSortConfig(null);
      setMergeReport({ updated: updatedIds, new: newIds });
      return;
    }
    
    // Se não está atualizando e é atualização de existente, processar merge
    // (este código só executa quando vem do preview modal para atualizar existente)
  }, [pendingFileData, isUpdatingCurrentSheet, currentSheetKey, allSheets]);

  const handleFileUploadError = useCallback((message: string) => {
    alert(message);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    filterTimeoutRef.current = setTimeout(() => {
      setDebouncedFilters(prev => ({ ...prev, [key]: value }));
    }, 300);
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prevConfig => {
        const isAsc = prevConfig?.key === key && prevConfig.direction === 'ascending';
        return { key, direction: isAsc ? 'descending' : 'ascending' };
    });
  }, []);

  const handleLoadNewFile = useCallback(() => {
    isUpdatingRef.current = false;
    setIsUpdatingCurrentSheet(false);
    setPendingFileData(null);
    // Acionar o input file diretamente
    fileInputRef.current?.click();
  }, []);
  
  const handleBackToMainMenu = useCallback(() => {
    setShowMainMenu(true);
    setCurrentSheetKey(null);
  }, []);
  
  const handleUpdateCurrentSheet = useCallback(() => {
    // Abrir seleção de arquivo para atualizar a planilha atual
    isUpdatingRef.current = true;
    setIsUpdatingCurrentSheet(true);
    setPendingFileData(null);
    // Acionar o input file diretamente
    fileInputRef.current?.click();
  }, []);
  
  const handleSelectSheetFromMenu = useCallback((sheetKey: string) => {
    setCurrentSheetKey(sheetKey);
    setShowMainMenu(false);
    setFilters({});
    setDebouncedFilters({});
    setSortConfig(null);
  }, []);

  const handleClearCurrentSheet = useCallback(() => {
    if (!currentSheetKey) return;
    
    if (confirm(`Tem certeza que deseja limpar a planilha "${allSheets[currentSheetKey]?.metadata.type}"?`)) {
      deleteSheet(currentSheetKey);
      setAllSheets(prev => {
        const newSheets = { ...prev };
        delete newSheets[currentSheetKey];
        return newSheets;
      });
      setCurrentSheetKey(null);
      setShowMainMenu(true);
    }
  }, [currentSheetKey, allSheets]);

  const handleColumnVisibilityChange = useCallback((newVisibleColumns: string[]) => {
    if (!currentSheetKey || !currentSheet) return;

    const updatedSheet: StoredSheet = {
      ...currentSheet,
      visibleColumns: newVisibleColumns,
      metadata: { ...currentSheet.metadata, updatedAt: new Date().toISOString() },
    };

    saveSheet(updatedSheet);
    setAllSheets(prev => ({ ...prev, [currentSheetKey]: updatedSheet }));
  }, [currentSheetKey, currentSheet]);

  const handleSwitchSheet = useCallback((sheetKey: string) => {
    setCurrentSheetKey(sheetKey);
    setFilters({});
    setDebouncedFilters({});
    setSortConfig(null);
  }, []);

  const processedRows = useMemo(() => {
    if (!currentSheet) return [];

    let filteredRows = currentSheet.data.rows;

    const activeFilters = Object.entries(debouncedFilters).filter(([, value]) => value);
    if (activeFilters.length > 0) {
        filteredRows = filteredRows.filter(row => {
            return activeFilters.every(([key, value]) => {
                const cellValue = row[key];
                if (cellValue == null) return false;
                
                const cellValueStr = String(cellValue).toLowerCase();
                
                // Suporta múltiplos termos separados por ';'
                const searchTerms = String(value).split(';').map(term => term.trim().toLowerCase()).filter(term => term);
                
                if (searchTerms.length === 0) return true;
                
                // Retorna true se pelo menos um termo for encontrado
                return searchTerms.some(term => cellValueStr.includes(term));
            });
        });
    }

    if (sortConfig !== null) {
      const sorted = [...filteredRows];
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
           return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }

        const valA = String(aValue).toLowerCase();
        const valB = String(bValue).toLowerCase();

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
      return sorted;
    }

    return filteredRows;
  }, [currentSheet, debouncedFilters, sortConfig]);
  
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Carregando aplicação...</p>
      </div>
    );
  }

  const existingSheetsList: SheetMetadata[] = Object.values(allSheets).map((s: StoredSheet) => s.metadata);

  return (
    <>
      {mergeReport && (
        <MergeReportModal 
            report={mergeReport} 
            onClose={() => setMergeReport(null)} 
        />
      )}
      
      {showDataPreview && previewData && (
        <DataPreviewModal
          data={previewData}
          onConfirm={handleConfirmPreview}
          onCancel={handleCancelPreview}
          existingHeaders={currentSheet?.data.headers}
          isNewSheet={!currentSheetKey && !isUpdatingCurrentSheet}
          existingSheets={existingSheetsList}
        />
      )}
      
      {/* Input file invisível para seleção de arquivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xls,.xlsx,.xlsm"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoadingFile}
      />
      
      {showMainMenu ? (
        <MainMenu
          availableSheets={existingSheetsList}
          onSelectSheet={handleSelectSheetFromMenu}
          onLoadNewFile={handleLoadNewFile}
        />
      ) : currentSheet ? (
        <DataTable
          data={currentSheet.data}
          processedRows={processedRows}
          filters={filters}
          sortConfig={sortConfig}
          visibleColumns={currentSheet.visibleColumns}
          availableSheets={existingSheetsList}
          currentSheetKey={currentSheetKey}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onBackToMenu={handleBackToMainMenu}
          onUpdateData={handleUpdateCurrentSheet}
          onClearStorage={handleClearCurrentSheet}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onSwitchSheet={handleSelectSheetFromMenu}
        />
      ) : null}
    </>
  );
};

export default App;
