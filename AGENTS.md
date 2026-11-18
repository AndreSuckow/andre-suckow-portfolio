# Publicação do portfólio

Ao concluir melhorias solicitadas neste site, incluir a publicação na versão final em https://andresuckow.github.io/andre-suckow-portfolio/, conforme preferência explícita do usuário.

A raiz apresenta o portfólio de Desenvolvimento Frontend. A rota `/cs/` foi retirada por solicitação do usuário. `profile.json` e `skill-details.json` são as únicas fontes de conteúdo profissional, compartilhadas pelos modos 2D/3D e pelas fichas. A fonte factual é `documents/Curriculo-Andre-Suckow-Frontend.pdf`; preservar o PDF fornecido e não atribuir tecnologias a empresas sem evidência no documento.

- Validar testes, check e build com `SITE_BASE_PATH=/andre-suckow-portfolio/`.
- Fazer commit das alterações pertinentes e enviar para `main`, que dispara o workflow de GitHub Pages.
- Acompanhar o deploy e conferir a versão online antes de declarar a publicação concluída. Se houver bloqueio, informar claramente o que continua apenas local.
- Não publicar alterações quando o usuário pedir somente análise, revisão ou uma versão preliminar.

# Manutenção incremental

- Consulte `ARCHITECTURE.md` para localizar a fonte de cada funcionalidade antes de abrir arquivos grandes. Busque símbolos com `rg -n` e leia trechos relevantes.
- Use `npm run format` e `npm run format:check`, limitados aos scripts já migrados. Não aplique formatação global.
- Preserve `src/engine.js`, `src/boot.js`, os templates e os contratos textuais de `customize.cjs` até uma etapa específica de migração do legado.
- `public/` mistura fontes manuais e saídas geradas; `dist/` é descartável. Não edite arquivos gerados como solução definitiva.
- Em reorganizações sem mudança funcional, compare o build antes/depois além de executar os testes. Não misture refatoração estrutural e alteração visual.
