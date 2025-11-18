import React, { useState } from 'react';
import type { SheetMetadata, SheetPeriod } from '../types';

interface SheetSelectionModalProps {
  existingSheets: SheetMetadata[];
  newDataHeaders: string[];
  onSelectNew: (type: string, period: SheetPeriod) => void;
  onSelectExisting: (sheetKey: string) => void;
  onCancel: () => void;
  forceNewSheetOnly?: boolean;
}

const PREDEFINED_TYPES = ['Ofertas', 'Alunos'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

export const SheetSelectionModal: React.FC<SheetSelectionModalProps> = ({
  existingSheets,
  newDataHeaders,
  onSelectNew,
  onSelectExisting,
  onCancel,
  forceNewSheetOnly = false,
}) => {
  const [selectedType, setSelectedType] = useState<string>('Ofertas');
  const [customType, setCustomType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);

  const generateSheetKey = (type: string, period: SheetPeriod): string => {
    return `${type}_${period.year}_${period.semester}`;
  };

  const checkSheetExists = (type: string, period: SheetPeriod): SheetMetadata | undefined => {
    const key = generateSheetKey(type, period);
    return existingSheets.find(s => s.key === key);
  };

  const handleConfirmNew = () => {
    const finalType = selectedType === 'Outro' ? customType : selectedType;
    if (!finalType.trim()) {
      alert('Por favor, forneça um nome para o tipo de planilha.');
      return;
    }
    
    const period = { year: selectedYear, semester: selectedSemester };
    const existingSheet = checkSheetExists(finalType, period);
    
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
    
    onSelectNew(finalType, period);
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Nova Planilha</h2>
            <p className="text-sm text-gray-600 mt-2">Defina o tipo e período da planilha</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
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
            
            {selectedType === 'Outro' && (
              <div>
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
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Período</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ano</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Semestre</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>1º Semestre</option>
                    <option value={2}>2º Semestre</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Identificador:</strong> {selectedType === 'Outro' ? (customType || '(vazio)') : selectedType}_{selectedYear}/{selectedSemester}
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-150"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmNew}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
};
