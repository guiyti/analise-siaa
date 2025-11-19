import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Row, SortConfig, SheetData, SheetMetadata } from '../types';
import { SortIcon, AscIcon, DescIcon, MenuIcon, EyeIcon, CopyIcon, TrashIcon, UploadIcon, GridIcon, HomeIcon } from './icons';

interface DataTableProps {
  data: SheetData;
  processedRows: Row[];
  filters: Record<string, string>;
  sortConfig: SortConfig | null;
  visibleColumns: string[];
  availableSheets: SheetMetadata[];
  currentSheetKey: string | null;
  onFilterChange: (key: string, value: string) => void;
  onSort: (key: string) => void;
  onBackToMenu: () => void;
  onUpdateData: () => void;
  onClearStorage: () => void;
  onColumnVisibilityChange: (columns: string[]) => void;
  onSwitchSheet: (sheetKey: string) => void;
}

const ROW_HEIGHT = 37; // Corresponds to Tailwind's h-9 (36px) + 1px border
const OVERSCAN_COUNT = 3; // Rows to render above and below the visible area

const DataTable: React.FC<DataTableProps> = ({
  data,
  processedRows,
  filters,
  sortConfig,
  visibleColumns: visibleColumnsProp,
  availableSheets,
  currentSheetKey,
  onFilterChange,
  onSort,
  onBackToMenu,
  onUpdateData,
  onClearStorage,
  onColumnVisibilityChange,
  onSwitchSheet,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState(false);
  const [isSheetsListOpen, setIsSheetsListOpen] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const visibleColumnsSet = new Set(visibleColumnsProp);

  const scrollTimeoutRef = useRef<number>();
  
  const toggleColumnVisibility = useCallback((column: string) => {
    const newVisibleColumns = visibleColumnsSet.has(column)
      ? visibleColumnsProp.filter(c => c !== column)
      : [...visibleColumnsProp, column];
    onColumnVisibilityChange(newVisibleColumns);
  }, [visibleColumnsProp, visibleColumnsSet, onColumnVisibilityChange]);
  
  const copyVisibleData = useCallback(() => {
    const visibleHeaders = data.headers.filter(h => visibleColumnsSet.has(h));
    const headerRow = visibleHeaders.join('\t');
    const dataRows = processedRows.map(row => 
      visibleHeaders.map(header => String(row[header] ?? '')).join('\t')
    ).join('\n');
    
    const text = `${headerRow}\n${dataRows}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Dados copiados para a área de transferência!');
      setIsMenuOpen(false);
    }).catch(() => {
      alert('Erro ao copiar dados.');
    });
  }, [data.headers, processedRows, visibleColumnsSet]);
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    
    if (scrollTimeoutRef.current) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
    });
  }, []);

  // Handlers para redimensionamento de colunas
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(column);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[column] || 200);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(80, resizeStartWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Set initial height and observe for changes
    setContainerHeight(container.clientHeight);
    const resizeObserver = new ResizeObserver(() => {
      if(scrollContainerRef.current) {
        setContainerHeight(scrollContainerRef.current.clientHeight);
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsColumnVisibilityOpen(false);
        setIsSheetsListOpen(false);
      }
    };
    
    if (isMenuOpen || isColumnVisibilityOpen || isSheetsListOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen, isColumnVisibilityOpen, isSheetsListOpen]);

  // Virtualization calculations
  const totalRows = processedRows.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_COUNT);
  const visibleItemCount = Math.ceil(containerHeight / ROW_HEIGHT);
  const endIndex = Math.min(
    totalRows - 1,
    startIndex + visibleItemCount + OVERSCAN_COUNT * 2
  );
  
  const visibleRows = processedRows.slice(startIndex, endIndex + 1);
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = (totalRows - (endIndex + 1)) * ROW_HEIGHT;

  const visibleHeaders = data.headers.filter(h => visibleColumnsSet.has(h));
  
  const currentSheet = availableSheets.find(s => s.key === currentSheetKey);
  const headerTitle = currentSheet 
    ? currentSheet.name
    : 'Visualizador de Planilha';
  
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-800">
      <header className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-700">{headerTitle}</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={onBackToMenu}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-150 ease-in-out flex items-center space-x-2"
            title="Menu Principal"
          >
            <HomeIcon />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out flex items-center space-x-2"
            >
              <MenuIcon />
              <span>Opções</span>
            </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsColumnVisibilityOpen(!isColumnVisibilityOpen);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
                >
                  <EyeIcon />
                  <span>Visibilidade Colunas</span>
                </button>
                
                {isColumnVisibilityOpen && (
                  <div className="max-h-60 overflow-y-auto bg-gray-50 border-t border-b border-gray-200">
                    {data.headers.map(header => (
                      <label key={header} className="flex items-center px-6 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumnsSet.has(header)}
                          onChange={() => toggleColumnVisibility(header)}
                          className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 truncate">{header}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={copyVisibleData}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
                >
                  <CopyIcon />
                  <span>Copiar Planilha Visível</span>
                </button>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                {availableSheets.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        setIsSheetsListOpen(!isSheetsListOpen);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
                    >
                      <GridIcon />
                      <span>Visualizar Planilhas ({availableSheets.length})</span>
                    </button>
                    
                    {isSheetsListOpen && (
                      <div className="max-h-60 overflow-y-auto bg-gray-50 border-t border-b border-gray-200">
                        {availableSheets.map(sheet => (
                          <button
                            key={sheet.key}
                            onClick={() => {
                              onSwitchSheet(sheet.key);
                              setIsMenuOpen(false);
                              setIsSheetsListOpen(false);
                            }}
                            className={`w-full px-6 py-3 text-left hover:bg-gray-100 transition ${
                              sheet.key === currentSheetKey ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                            }`}
                          >
                          <div className="font-semibold text-sm text-gray-800">{sheet.name}</div>
                          <div className="text-xs text-gray-500">
                            Atualizado: {new Date(sheet.updatedAt).toLocaleDateString('pt-BR')}
                          </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 my-1"></div>
                  </>
                )}
                
                
                <button
                  onClick={() => {
                    onUpdateData();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
                >
                  <UploadIcon />
                  <span>Atualizar Esta Planilha</span>
                </button>
                
                <button
                  onClick={() => {
                    onClearStorage();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                >
                  <TrashIcon />
                  <span>Excluir Esta Planilha</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </header>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-auto"
      >
        <table className="relative min-w-full border-collapse">
          <thead className="text-sm">
            <tr className="bg-gray-200">
              {visibleHeaders.map((header) => (
                <th
                  key={header}
                  onClick={(e) => {
                    // Não ordenar se estiver clicando no resize handle
                    const target = e.target as HTMLElement;
                    if (!target.closest('.resize-handle')) {
                      onSort(header);
                    }
                  }}
                  style={{ 
                    width: columnWidths[header] || 200, 
                    minWidth: 80, 
                    maxWidth: columnWidths[header] || 200
                  }}
                  className="sticky top-0 px-4 h-12 text-left font-semibold text-gray-600 bg-gray-200 z-20 cursor-pointer select-none whitespace-nowrap border-b border-gray-300"
                >
                  <div className="flex items-center space-x-2 overflow-hidden relative h-full">
                    <span className="truncate">{header}</span>
                    <span className="text-gray-400 flex-shrink-0">
                      {sortConfig?.key === header ? (
                        sortConfig.direction === 'ascending' ? (
                          <AscIcon />
                        ) : (
                          <DescIcon />
                        )
                      ) : (
                        <SortIcon />
                      )}
                    </span>
                    {/* Handle de redimensionamento - 16px de largura para facilitar clique */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, header)}
                      className="resize-handle absolute top-0 right-0 w-4 h-full cursor-col-resize hover:bg-indigo-400 bg-transparent z-40"
                      style={{ userSelect: 'none' }}
                      title="Arrastar para redimensionar"
                    />
                  </div>
                </th>
              ))}
            </tr>
            <tr className="bg-gray-200">
              {visibleHeaders.map((header) => (
                <th
                  key={`${header}-filter`}
                  className="sticky p-2 bg-gray-200 border-b border-gray-300"
                  style={{ 
                    width: columnWidths[header] || 200, 
                    minWidth: 80,
                    maxWidth: columnWidths[header] || 200,
                    top: '48px',
                    zIndex: 20
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Filtrar ${header}...`}
                    value={filters[header] || ''}
                    onChange={(e) => onFilterChange(header, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-normal"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white text-sm">
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={visibleHeaders.length} />
              </tr>
            )}
            {visibleRows.map((row, index) => {
              const rowIndex = startIndex + index;
              return (
                <tr key={rowIndex} className="hover:bg-gray-50" style={{ height: `${ROW_HEIGHT}px` }}>
                  {visibleHeaders.map((header) => (
                    <td 
                      key={header} 
                      style={{ 
                        width: columnWidths[header] || 200, 
                        minWidth: 80,
                        maxWidth: columnWidths[header] || 200
                      }}
                      className="px-4 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis"
                      title={String(row[header] ?? '')}
                    >
                      {String(row[header] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
             {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={visibleHeaders.length} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="p-2 bg-white border-t border-gray-200 text-sm text-gray-500 text-center">
        Exibindo {processedRows.length} de {data.rows.length} linhas.
      </footer>
    </div>
  );
};

export default DataTable;
