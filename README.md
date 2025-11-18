# 📊 Visualizador de Planilhas

<div align="center">
  <p>
    <strong>Uma aplicação web moderna e intuitiva para visualizar, gerenciar e analisar planilhas Excel</strong>
  </p>
  <p>
    <a href="#características">Características</a> •
    <a href="#tecnologias">Tecnologias</a> •
    <a href="#instalação">Instalação</a> •
    <a href="#uso">Uso</a> •
    <a href="#deploy">Deploy</a>
  </p>
</div>

---

## ✨ Características

### 📁 Gestão de Planilhas
- **Múltiplas planilhas**: Organize dados por tipo e período (semestre/ano)
- **Importação inteligente**: Suporte para arquivos `.xls`, `.xlsx` e `.xlsm`
- **Detecção automática**: Identifica automaticamente cabeçalhos e estrutura dos dados
- **Navegação por abas**: Abra múltiplas planilhas em abas diferentes do navegador

### 🔍 Visualização e Análise
- **Filtros dinâmicos**: Filtre dados em tempo real por qualquer coluna
- **Ordenação flexível**: Ordene por qualquer coluna (crescente/decrescente)
- **Colunas personalizadas**: Adicione colunas customizadas durante a importação
- **Visibilidade de colunas**: Mostre/oculte colunas conforme necessário
- **Pré-visualização**: Visualize dados antes de confirmar a importação

### 🔄 Atualização de Dados
- **Mesclagem inteligente**: Atualize planilhas existentes sem perder dados
- **Relatório de mudanças**: Veja quais registros foram atualizados ou adicionados
- **Identificação única**: Sistema automático de identificação de registros

### 💾 Armazenamento
- **LocalStorage**: Dados salvos localmente no navegador
- **Persistência**: Mantenha seus dados entre sessões
- **Export/Import**: Exporte seus dados quando necessário

### 🎨 Interface
- **Design moderno**: Interface limpa e responsiva
- **Modal intuitivo**: Processo guiado de importação
- **Indicadores visuais**: Feedback claro sobre status de colunas
- **Totalmente responsivo**: Funciona em desktop, tablet e mobile

---

## 🛠 Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **SheetJS (XLSX)** - Processamento de planilhas Excel
- **LocalStorage API** - Armazenamento de dados

---

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/visualizador-de-planilhas.git
   cd visualizador-de-planilhas
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute em desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

---

## 🚀 Uso

### 1. Criar Nova Planilha

1. Clique em **"Criar Nova Planilha"**
2. Selecione seu arquivo Excel (`.xls`, `.xlsx`, `.xlsm`)
3. Adicione colunas personalizadas se necessário
4. Escolha o tipo e período da planilha
5. Confirme e comece a usar!

### 2. Atualizar Planilha Existente

1. Abra a planilha desejada
2. Clique em **"Opções" > "Atualizar Dados"**
3. Selecione o novo arquivo
4. O sistema mesclará automaticamente os dados
5. Veja o relatório de mudanças

### 3. Filtrar e Ordenar

- **Filtrar**: Digite no campo de filtro de qualquer coluna
- **Ordenar**: Clique no cabeçalho da coluna desejada
- **Limpar filtros**: Use o botão "Limpar Filtros"

### 4. Gerenciar Colunas

- **Ocultar/Mostrar**: Use o menu "Gerenciar Colunas Visíveis"
- **Personalizar**: Adicione colunas customizadas na importação

---

## 🌐 Deploy

### Vercel (Recomendado)

1. **Instale a CLI da Vercel**
   ```bash
   npm install -g vercel
   ```

2. **Faça o deploy**
   ```bash
   vercel
   ```

3. **Ou use o GitHub**
   - Conecte seu repositório no [Vercel Dashboard](https://vercel.com)
   - Deploy automático a cada push

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `/dist`

---

## 📋 Estrutura do Projeto

```
visualizador-de-planilhas/
├── components/          # Componentes React
│   ├── DataTable.tsx       # Tabela de dados principal
│   ├── DataPreviewModal.tsx # Modal de pré-visualização
│   ├── MainMenu.tsx        # Menu principal
│   └── SheetSelectionModal.tsx # Seletor de planilhas
├── types.ts            # Definições TypeScript
├── App.tsx             # Componente principal
├── index.tsx           # Entry point
├── index.html          # HTML base
├── vite.config.ts      # Configuração Vite
└── package.json        # Dependências
```

---

## 🎯 Funcionalidades Futuras

- [ ] Export para Excel
- [ ] Gráficos e visualizações
- [ ] Backup em nuvem
- [ ] Compartilhamento de planilhas
- [ ] Fórmulas e cálculos
- [ ] Temas customizáveis

---

## 📝 Licença

Este projeto está sob a licença MIT.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

---

<div align="center">
  <p>Feito com ❤️ usando React e TypeScript</p>
</div>
