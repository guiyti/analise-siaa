# Guia Rápido de Deploy - Vercel

## Opção 1: Deploy via CLI (Mais Rápido)

1. **Instale a Vercel CLI globalmente:**
   ```bash
   npm install -g vercel
   ```

2. **Faça login na Vercel:**
   ```bash
   vercel login
   ```

3. **Execute o deploy:**
   ```bash
   vercel
   ```
   
   Siga as instruções:
   - Set up and deploy? `Y`
   - Which scope? (escolha sua conta)
   - Link to existing project? `N`
   - Project name? (pressione Enter para usar o padrão)
   - In which directory is your code located? `./`

4. **Deploy para produção:**
   ```bash
   vercel --prod
   ```

## Opção 2: Deploy via GitHub (Automatizado)

1. **Crie um repositório no GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/visualizador-de-planilhas.git
   git push -u origin main
   ```

2. **Conecte ao Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório do GitHub
   - Configure:
     - Framework Preset: `Vite`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Clique em "Deploy"

3. **Deploy automático:**
   - Cada push na branch `main` fará deploy automaticamente
   - Pull requests criam previews automáticos

## Verificações Antes do Deploy

✅ Build local funciona: `npm run build`
✅ Não há erros no console
✅ `.gitignore` configurado corretamente
✅ Dependências instaladas

## URLs Após Deploy

Você receberá:
- **Production URL**: `https://seu-projeto.vercel.app`
- **Preview URLs**: Para cada PR/branch

## Configurações Opcionais na Vercel

- **Custom Domain**: Configure seu próprio domínio
- **Environment Variables**: Se precisar adicionar no futuro
- **Analytics**: Ative para ver métricas de uso

## Comandos Úteis

```bash
# Ver deployments
vercel ls

# Ver logs do último deploy
vercel logs

# Remover projeto
vercel remove nome-do-projeto
```

## Troubleshooting

**Build falha?**
- Verifique se `npm run build` funciona localmente
- Confira os logs do Vercel

**404 ao acessar?**
- Verifique se o `outputDirectory` está como `dist`

**Página em branco?**
- Verifique o console do navegador
- Certifique-se que o build completou com sucesso

---

🎉 Pronto! Sua aplicação estará no ar em segundos!
