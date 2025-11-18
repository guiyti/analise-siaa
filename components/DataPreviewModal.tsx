import React, { useState, useMemo } from 'react';
import type { SheetData, Row, SheetMetadata, SheetPeriod } from '../types';

interface DataPreviewModalProps {
  data: SheetData;
  onConfirm: (modifiedData: SheetData, sheetType?: string, sheetPeriod?: SheetPeriod) => void;
  onCancel: () => void;
  existingHeaders?: string[]; // Headers da planilha existente (se estiver mesclando)
  isNewSheet?: boolean; // Se true, mostra campos de tipo e período
  existingSheets?: SheetMetadata[]; // Para validar duplicatas
}

interface CustomColumn {
  name: string;
  value: string;
}

const PREDEFINED_TYPES = ['Ofertas', 'Alunos'];
const CURRENT_YEAR = new Date().getFullYear();

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  data,
  onConfirm,
  onCancel,
  existingHeaders,
  isNewSheet = false,
  existingSheets = [],
}) => {
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnValue, setNewColumnValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Estados para nova planilha
  const [selectedType, setSelectedType] = useState<string>('Ofertas');
  const [customType, setCustomType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(`${CURRENT_YEAR}/1`);

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

  // Combinar headers: primeiro os do arquivo, depois os faltantes, depois os customizados
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

    // Adicionar colunas customizadas
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

    return { headers: newHeaders, rows: newRows };
  }, [data.rows, allHeaders, customColumns, columnStatus]);

  const handleAddColumn = () => {
    const trimmedName = newColumnName.trim();
    const trimmedValue = newColumnValue.trim();

    if (!trimmedName) {
      alert('Por favor, forneça um nome para a coluna.');
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

    setCustomColumns([...customColumns, { name: trimmedName, value: trimmedValue }]);
    setNewColumnName('');
    setNewColumnValue('');
  };

  const handleEditColumn = (index: number) => {
    const col = customColumns[index];
    setNewColumnName(col.name);
    setNewColumnValue(col.value);
    setEditingIndex(index);
  };

  const handleUpdateColumn = () => {
    if (editingIndex === null) return;

    const trimmedName = newColumnName.trim();
    const trimmedValue = newColumnValue.trim();

    if (!trimmedName) {
      alert('Por favor, forneça um nome para a coluna.');
      return;
    }

    const updatedColumns = [...customColumns];
    updatedColumns[editingIndex] = { name: trimmedName, value: trimmedValue };
    setCustomColumns(updatedColumns);
    setNewColumnName('');
    setNewColumnValue('');
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setNewColumnName('');
    setNewColumnValue('');
    setEditingIndex(null);
  };

  const handleRemoveColumn = (index: number) => {
    setCustomColumns(customColumns.filter((_, i) => i !== index));
  };

  const generateSheetKey = (type: string, period: SheetPeriod): string => {
    return `${type}_${period.year}_${period.semester}`;
  };

  const handleConfirm = () => {
    // Se é nova planilha, validar tipo e período
    if (isNewSheet) {
      const finalType = selectedType === 'Outro' ? customType : selectedType;
      if (!finalType.trim()) {
        alert('Por favor, forneça um nome para o tipo de planilha.');
        return;
      }
      
      // Parse do período selecionado (formato: "YYYY/S")
      const [yearStr, semesterStr] = selectedPeriod.split('/');
      const year = parseInt(yearStr);
      const semester = parseInt(semesterStr) as 1 | 2;
      const period: SheetPeriod = { year, semester };
      
      // Verificar se já existe
      const key = generateSheetKey(finalType, period);
      const existingSheet = existingSheets.find(s => s.key === key);
      
      if (existingSheet) {
        alert(
          `Já existe uma planilha "${existingSheet.type}" para ${existingSheet.period.year}/${existingSheet.period.semester}.\n\n` +
          `Para modificar os dados dessa planilha:\n` +
          `1. Acesse a planilha "${existingSheet.type}" no menu principal\n` +
          `2. Use "Opções > Atualizar Esta Planilha" para adicionar/atualizar registros\n` +
          `3. Ou use "Opções > Limpar Esta Planilha" para remover todos os dados`
        );
        return;
      }
      
      onConfirm(previewData, finalType, period);
    } else {
      onConfirm(previewData);
    }
  };

  // Mostrar apenas as primeiras 10 linhas na pré-visualização
  const previewRows = previewData.rows.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <header className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Pré-visualização dos Dados</h2>
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
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {allHeaders.map((header) => {
                        const status = columnStatus[header] || 'none';
                        
                        return (
                          <td
                            key={`${rowIndex}-${header}`}
                            className={`px-4 py-2 text-sm border-r border-gray-200 last:border-r-0 whitespace-nowrap ${
                              status === 'missing' ? 'bg-red-50 text-red-400 italic' : 'text-gray-800'
                            }`}
                          >
                            {status === 'missing' ? '(faltando)' :
                             row[header] !== null && row[header] !== undefined
                              ? String(row[header])
                              : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legenda */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center space-x-6 text-xs">
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
                <span className="text-gray-600">Coluna faltando (será preenchida com vazio ou valor customizado)</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-gray-600">Coluna personalizada adicionada</span>
              </div>
            </div>
          </div>

          {/* Seção de adicionar colunas - AGORA ABAIXO DA PREVIEW */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Adicionar Coluna Personalizada</h3>
            
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Coluna</label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Ex: Campus, Modalidade..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="text"
                  value={newColumnValue}
                  onChange={(e) => setNewColumnValue(e.target.value)}
                  placeholder="Ex: São Paulo, EAD..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                {editingIndex !== null ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateColumn}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition whitespace-nowrap"
                    >
                      Atualizar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddColumn}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition whitespace-nowrap"
                  >
                    + Adicionar Coluna
                  </button>
                )}
              </div>
            </div>

            {/* Lista de colunas personalizadas */}
            {customColumns.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Colunas Adicionadas:</h4>
                <div className="space-y-2">
                  {customColumns.map((col, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3"
                    >
                      <div className="flex-grow">
                        <span className="font-semibold text-gray-800">{col.name}:</span>
                        <span className="text-gray-600 ml-2">{col.value || '(vazio)'}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditColumn(index)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleRemoveColumn(index)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seção de Tipo e Período - APENAS para novas planilhas */}
          {isNewSheet && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Informações da Nova Planilha</h3>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Planilha</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PREDEFINED_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="Outro">Outro (personalizado)</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Período</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(() => {
                      const now = new Date();
                      const currentYear = now.getFullYear();
                      const currentMonth = now.getMonth() + 1;
                      const currentSemester = currentMonth <= 6 ? 1 : 2;
                      
                      // Próximo semestre
                      let nextYear = currentYear;
                      let nextSemester = currentSemester === 1 ? 2 : 1;
                      if (nextSemester === 1) nextYear++;
                      
                      const periods = [];
                      // Adicionar próximo semestre
                      periods.push({ year: nextYear, semester: nextSemester });
                      
                      // Adicionar 4 semestres para trás (total de 5)
                      let year = currentYear;
                      let semester = currentSemester;
                      for (let i = 0; i < 4; i++) {
                        periods.push({ year, semester });
                        if (semester === 1) {
                          semester = 2;
                          year--;
                        } else {
                          semester = 1;
                        }
                      }
                      
                      return periods.map(p => (
                        <option key={`${p.year}/${p.semester}`} value={`${p.year}/${p.semester}`}>
                          {p.year} - {p.semester}º Semestre
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Identificador</label>
                  <div className="px-4 py-2 bg-white border border-blue-300 rounded-md">
                    <p className="text-sm text-gray-700 truncate">
                      {selectedType === 'Outro' ? (customType || '(vazio)') : selectedType}_{selectedPeriod.replace('/', '_')}
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedType === 'Outro' && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Personalizado</label>
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Digite o nome do tipo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {customColumns.length > 0 && (
              <span className="font-medium text-indigo-600">
                {customColumns.length} coluna{customColumns.length > 1 ? 's' : ''} personalizada{customColumns.length > 1 ? 's' : ''} será{customColumns.length > 1 ? 'ão' : ''} adicionada{customColumns.length > 1 ? 's' : ''}
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
