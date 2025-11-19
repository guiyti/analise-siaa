import React, { useState, useMemo } from 'react';
import type { SheetData, Row } from '../types';

interface DataPreviewModalProps {
  data: SheetData;
  onConfirm: (modifiedData: SheetData, sheetIdentifier?: string) => void;
  onCancel: () => void;
  existingHeaders?: string[]; // Headers da planilha existente (se estiver mesclando)
  isNewSheet?: boolean; // Se true, mostra campo de identificador
  existingIdentifiers?: string[]; // Para validar duplicatas
  fileName?: string; // Nome do arquivo carregado
}

interface CustomColumn {
  name: string;
  value: string;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  data,
  onConfirm,
  onCancel,
  existingHeaders,
  isNewSheet = false,
  existingIdentifiers = [],
  fileName = '',
}) => {
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  
  // Estado para valores de colunas faltantes (usado quando está mesclando)
  const [missingColumnValues, setMissingColumnValues] = useState<Record<string, string>>({});
  
  // Estados para edição inline na tabela
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnValue, setNewColumnValue] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  
  // Estado para identificador da planilha
  const [sheetIdentifier, setSheetIdentifier] = useState<string>('');

  // Determinar status das colunas
  const columnStatus = useMemo(() => {
    const status: Record<string, 'present' | 'missing' | 'custom' | 'none'> = {};
    
    // Se não há headers existentes (arquivo novo), não marcar status
    if (!existingHeaders || existingHeaders.length === 0) {
      data.headers.forEach(header => {
        status[header] = 'none';
      });
      return status;
    }

    // Marcar colunas do arquivo carregado
    data.headers.forEach(header => {
      // 'present' apenas se existe TANTO no arquivo existente QUANTO no novo
      status[header] = existingHeaders.includes(header) ? 'present' : 'none';
    });

    // Marcar colunas que faltam (existem na base mas não no arquivo carregado)
    existingHeaders.forEach(header => {
      if (!data.headers.includes(header)) {
        status[header] = 'missing';
      }
    });

    return status;
  }, [data.headers, existingHeaders]);

  // Identificar colunas faltantes
  const missingColumns = useMemo(() => {
    if (!existingHeaders || existingHeaders.length === 0) {
      return [];
    }
    return existingHeaders.filter(header => !data.headers.includes(header));
  }, [data.headers, existingHeaders]);

  // Verificar se está mesclando (tem headers existentes e não é nova planilha)
  const isMerging = existingHeaders && existingHeaders.length > 0 && !isNewSheet;

  // Combinar headers: primeiro os do arquivo, depois os faltantes, depois os customizados, e por último a coluna de adicionar
  const allHeaders = useMemo(() => {
    const combined = [...data.headers];
    
    // Adicionar colunas faltantes
    if (existingHeaders) {
      existingHeaders.forEach(header => {
        if (!combined.includes(header)) {
          combined.push(header);
        }
      });
    }
    
    // Adicionar colunas customizadas
    customColumns.forEach(col => {
      if (!combined.includes(col.name)) {
        combined.push(col.name);
      }
    });
    
    return combined;
  }, [data.headers, existingHeaders, customColumns]);

  const previewData = useMemo(() => {
    const newHeaders = [...allHeaders];
    const newRows = data.rows.map(row => ({ ...row }));

    // Adicionar colunas customizadas (sempre, não apenas quando não está mesclando)
    customColumns.forEach(col => {
      newRows.forEach(row => {
        row[col.name] = col.value;
      });
    });

    // Marcar colunas customizadas no status
    customColumns.forEach(col => {
      if (!columnStatus[col.name]) {
        columnStatus[col.name] = 'custom';
      }
    });

    // Adicionar valores das colunas faltantes (quando está mesclando)
    if (isMerging) {
      missingColumns.forEach(colName => {
        const value = missingColumnValues[colName] || '';
        newRows.forEach(row => {
          row[colName] = value;
        });
      });
    }

    return { headers: newHeaders, rows: newRows };
  }, [data.rows, allHeaders, customColumns, columnStatus, isMerging, missingColumns, missingColumnValues]);

  // Salvar coluna atual (se tiver nome válido)
  const handleSaveCurrentColumn = () => {
    const trimmedName = newColumnName.trim();
    const trimmedValue = newColumnValue.trim();

    if (!trimmedName) {
      // Se não tem nome, apenas limpar
      setNewColumnName('');
      setNewColumnValue('');
      setIsAddingColumn(false);
      return;
    }

    if (data.headers.includes(trimmedName)) {
      alert('Já existe uma coluna com este nome no arquivo carregado.');
      return;
    }

    if (customColumns.some(col => col.name === trimmedName)) {
      alert('Você já adicionou uma coluna com este nome.');
      return;
    }

    const newCustomColumns = [...customColumns, { name: trimmedName, value: trimmedValue }];
    
    setCustomColumns(newCustomColumns);
    setNewColumnName('');
    setNewColumnValue('');
    setIsAddingColumn(false);
  };

  // Lidar com perda de foco nos campos
  const handleBlur = () => {
    // Usar timeout para permitir cliques em outros elementos do modal
    setTimeout(() => {
      const trimmedName = newColumnName.trim();
      
      if (!trimmedName && isAddingColumn) {
        // Se não tem nome, remover campo de edição
        setNewColumnName('');
        setNewColumnValue('');
        setIsAddingColumn(false);
      }
    }, 200);
  };

  const handleRemoveColumn = (columnName: string) => {
    setCustomColumns(customColumns.filter(col => col.name !== columnName));
  };

  const handleConfirm = () => {
    // Se estiver adicionando uma coluna, incluir ela nos dados antes de confirmar
    let finalData = previewData;
    if (isAddingColumn && newColumnName.trim()) {
      const columnName = newColumnName.trim();
      const columnValue = newColumnValue.trim();
      
      finalData = {
        headers: [...previewData.headers, columnName],
        rows: previewData.rows.map(row => ({
          ...row,
          [columnName]: columnValue
        }))
      };
    }
    
    // Se é nova planilha, validar identificador
    if (isNewSheet) {
      const trimmedIdentifier = sheetIdentifier.trim();
      if (!trimmedIdentifier) {
        alert('Por favor, forneça um identificador para a planilha.');
        return;
      }
      
      // Verificar se já existe
      if (existingIdentifiers.includes(trimmedIdentifier)) {
        alert(
          `Já existe uma planilha com o identificador "${trimmedIdentifier}".\n\n` +
          `Para modificar os dados dessa planilha:\n` +
          `1. Acesse a planilha "${trimmedIdentifier}" no menu principal\n` +
          `2. Use "Opções > Atualizar Esta Planilha" para adicionar/atualizar registros\n` +
          `3. Ou use "Opções > Excluir Esta Planilha" para remover todos os dados`
        );
        return;
      }
      
      onConfirm(finalData, trimmedIdentifier);
    } else {
      onConfirm(finalData);
    }
  };

  // Mostrar apenas as primeiras 10 linhas na pré-visualização
  const previewRows = previewData.rows.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <header className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Pré-visualização dos Dados</h2>
          {fileName && (
            <p className="text-sm font-semibold text-indigo-600 mt-1">
              Arquivo: {fileName}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Visualize os dados e adicione colunas personalizadas antes de carregar
          </p>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Pré-visualização da tabela */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                Pré-visualização ({data.rows.length} linhas no total, mostrando primeiras 10)
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {allHeaders.map((header) => {
                      const status = columnStatus[header] || 'none';
                      const isCustom = customColumns.some(col => col.name === header);
                      
                      return (
                        <th
                          key={header}
                          className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                        >
                          <div className="flex items-center justify-between space-x-1">
                            <div className="flex items-center space-x-1">
                              {status === 'present' && !isCustom && (
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {status === 'missing' && (
                                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {isCustom && (
                                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              )}
                              <span className={
                                status === 'missing' ? 'text-red-600' :
                                isCustom ? 'text-indigo-600' :
                                'text-gray-700'
                              }>
                                {header}
                              </span>
                            </div>
                            {isCustom && (
                              <button
                                onClick={() => handleRemoveColumn(header)}
                                className="ml-2 text-red-500 hover:text-red-700"
                                title="Remover coluna"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    {/* Coluna em edição (se estiver adicionando) */}
                    {!isMerging && isAddingColumn && (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 bg-yellow-50" style={{ minWidth: '150px' }}>
                        <input
                          type="text"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          onBlur={handleBlur}
                          placeholder="Nome da coluna"
                          className="w-full px-2 py-1 text-xs border border-yellow-400 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                          autoFocus
                        />
                      </th>
                    )}
                    
                    {/* Coluna '+' para adicionar nova coluna */}
                    {!isMerging && (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 bg-indigo-50">
                        <button
                          onClick={() => {
                            // Salvar a coluna atual antes de abrir nova
                            if (isAddingColumn && newColumnName.trim()) {
                              handleSaveCurrentColumn();
                            }
                            setIsAddingColumn(true);
                          }}
                          className="flex items-center justify-center w-full text-indigo-600 hover:text-indigo-800"
                          title="Adicionar nova coluna"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {allHeaders.map((header) => {
                        const status = columnStatus[header] || 'none';
                        const isCustom = customColumns.some(col => col.name === header);
                        const isMissing = status === 'missing';
                        
                        return (
                          <td
                            key={`${rowIndex}-${header}`}
                            className={`px-4 py-2 text-sm border-r border-gray-200 last:border-r-0 whitespace-nowrap ${
                              isMissing ? 'bg-red-50' : ''
                            } ${isCustom ? 'bg-indigo-50' : ''}`}
                          >
                            {isMissing && rowIndex === 0 ? (
                              // Campo editável para coluna faltante (apenas primeira linha)
                              <input
                                type="text"
                                value={missingColumnValues[header] || ''}
                                onChange={(e) => setMissingColumnValues({
                                  ...missingColumnValues,
                                  [header]: e.target.value
                                })}
                                placeholder="Digite o valor..."
                                className="w-full px-2 py-1 text-sm border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                              />
                            ) : isMissing ? (
                              // Mostrar valor replicado nas outras linhas
                              <span className="text-red-600 italic">
                                {missingColumnValues[header] || '(faltando)'}
                              </span>
                            ) : (
                              // Valor normal da célula
                              <span className={isCustom ? 'text-indigo-700 font-medium' : 'text-gray-800'}>
                                {row[header] !== null && row[header] !== undefined
                                  ? String(row[header])
                                  : '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {/* Célula da coluna em edição */}
                      {!isMerging && isAddingColumn && (
                        <td className="px-4 py-2 text-sm border-r border-gray-200 bg-yellow-50" style={{ minWidth: '150px' }}>
                          {rowIndex === 0 ? (
                            <input
                              type="text"
                              value={newColumnValue}
                              onChange={(e) => setNewColumnValue(e.target.value)}
                              onBlur={handleBlur}
                              disabled={!newColumnName.trim()}
                              placeholder={newColumnName.trim() ? "Valor padrão..." : "Digite o nome primeiro"}
                              className="w-full px-2 py-1 text-sm border border-yellow-400 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          ) : (
                            <span className="text-yellow-700 text-xs italic">{newColumnValue || '-'}</span>
                          )}
                        </td>
                      )}
                      
                      {/* Célula da coluna '+' */}
                      {!isMerging && (
                        <td className="px-4 py-2 text-sm border-r border-gray-200 bg-indigo-50">
                          {/* Vazia, apenas para alinhamento */}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legenda */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Coluna presente no arquivo</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-600">Coluna faltante (edite na primeira linha para preencher)</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-gray-600">Coluna personalizada adicionada</span>
              </div>
              {!isMerging && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-gray-600">Clique no + para adicionar nova coluna</span>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Identificador - APENAS para novas planilhas */}
          {isNewSheet && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Identificador</h3>
              <p className="text-sm text-gray-600 mb-3">
                Dê um nome único para identificar esta planilha no sistema.
              </p>
              <input
                type="text"
                value={sheetIdentifier}
                onChange={(e) => setSheetIdentifier(e.target.value)}
                placeholder={fileName ? fileName.replace(/\.(xlsx?|xlsm)$/i, '') : 'Ex: Ofertas_2024_1, Alunos_Ativos, etc.'}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>
          )}
        </div>

        <footer className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {isMerging && missingColumns.length > 0 ? (
              <span className="font-medium text-orange-600">
                {missingColumns.filter(col => missingColumnValues[col]).length} de {missingColumns.length} coluna{missingColumns.length > 1 ? 's' : ''} faltante{missingColumns.length > 1 ? 's' : ''} preenchida{missingColumns.length > 1 ? 's' : ''}
              </span>
            ) : customColumns.length > 0 ? (
              <span className="font-medium text-indigo-600">
                {customColumns.length} coluna{customColumns.length > 1 ? 's' : ''} personalizada{customColumns.length > 1 ? 's' : ''} adicionada{customColumns.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-gray-500">
                {!isMerging ? 'Clique no + para adicionar colunas personalizadas' : 'Preencha as colunas faltantes na tabela acima'}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
            >
              Confirmar e Continuar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
