import React from 'react';
import type { SheetMetadata } from '../types';

interface MainMenuProps {
  availableSheets: SheetMetadata[];
  onSelectSheet: (sheetKey: string) => void;
  onLoadNewFile: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  availableSheets,
  onSelectSheet,
  onLoadNewFile,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">Visualizador de Planilhas</h1>
        </div>

        <div className="p-6">
          {availableSheets.length > 0 ? (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Planilhas Disponíveis</h2>
              </div>

              <div className="space-y-2 mb-6">
                {availableSheets.map(sheet => (
                  <button
                    key={sheet.key}
                    onClick={() => onSelectSheet(sheet.key)}
                    className="w-full p-4 border border-gray-200 rounded-md hover:border-indigo-500 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">
                          {sheet.name}
                        </h3>
                        <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                          <span>Atualizado: {new Date(sheet.updatedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Nenhuma planilha encontrada</h3>
              <p className="text-gray-600 text-sm">Comece carregando seu primeiro arquivo</p>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <button
              onClick={onLoadNewFile}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Carregar Novos Dados</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
