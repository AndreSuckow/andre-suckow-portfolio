# Continuidade do projeto

Atualizado em 2026-11-18. Este documento é um resumo para iniciar outro chat no mesmo repositório; confirme o estado real com `git status` e `git log -1` antes de alterar algo.

## Estado entregue

- Capa da BoxLyne: imagem fornecida pelo usuário em `public/img/boxlyne-capa.png`, 1575×892, aplicada como screenshot em `profile.json` com enquadramento integral (`contain`). Compartilhada pela TV, modo 2D e ficha do projeto; símbolo da marca preservado na fita. Usuário solicitou publicação imediata.

- Usuário aprovou a prévia e autorizou publicar todas as melhorias em 18/11/2026. As referências abaixo a “local/sem publicação” descrevem etapas anteriores; consultar Git e workflow para o estado final. A imagem alternativa do Sinergia segue pendente do arquivo original; a versão aprovada usa a arte B2B para Todos já disponível.

- Ajuste fino da prateleira: espaçamento das fitas na mesa reduzido de .21 para .13, mantendo a primeira posição e liberando a fotografia à direita. Prateleira e fileira superior subiram .035 (rowHeight .335). Build, check, format:check e os 19 testes de conteúdo/projetos passaram; continua local.

- Validação da prateleira: 121 testes passaram; format:check, check e build com SITE_BASE_PATH passaram. Captura real do Chrome em `tmp/portfolio-browser/frontend-projetos-desktop.png` confirma as seis fitas visíveis. Verificação focada de rotas/2D/mobile/fichas passou via `tmp/verify-shelf.mjs`; o verificador completo ainda para no percurso da carreira (ordem antiga de empresas, timeout em Pilgrim's), fora desta alteração. Animações ajustadas no código, sem inspeção quadro a quadro. Servidor local em http://127.0.0.1:4173/. Sem commit ou publicação durante esta revisão local.

- Prateleira local de Projetos: três fitas sobre a mesa e três na nova prateleira acima, com madeira/material do quarto. `public/project-shelf.js` compartilha posições e suportes; câmera enquadra as duas alturas. Inserção/ejeção passa à frente da prateleira e restaura a posição de origem. Ajuste visual em revisão local.

- Quinto projeto: `google-workspace`, fita “WORKSPACE”, link https://andresuckow.github.io/GP_onepage_TorreCloud_GoogleWorkspace_1/. Código público confirma React, JavaScript, CSS, Vite e SCORM 1.2/Pipwerks; conteúdo de transformação digital e segurança com carrosséis e painéis. Usa arte de abertura original em `public/img/project-google-workspace.webp`. Agora são cinco projetos e a fita de convite. A troca da imagem do Sinergia pela captura enviada continua pendente do arquivo `public/img/sinergia-movel.png` (não disponível localmente).

- Projeto `sinergia-movel` adicionado: “Sinergia Móvel — B2B para Todos”, com demonstração e repositório fornecidos/verificados. HTML/CSS/JavaScript, Rellax e SCORM 1.2 confirmados nos arquivos públicos. Arte original B2B para Todos em `public/img/project-sinergia-movel.svg`, com enquadramento integral. Quatro projetos reais e a fita de convite; continua local.

- BoxLyne adicionada como site desenvolvido pelo usuário (não como emprego). Tecnologias confirmadas nos assets públicos: Next.js, React, Three.js, CSS e Lucide. Link https://boxlyne.com.br/; sem repositório informado e sem atribuir TypeScript por inferência. Usa o ícone original do site em `public/img/project-boxlyne.svg`. Descrição: caixas 3D, catálogo de medidas e orçamento via WhatsApp. Continua na prévia local.

- Segundo projeto real: `nike-air-max-90`, título “Nike Air Max 90” e fita “AIR MAX 90”. Link fornecido: https://andresuckow.github.io/figmaNikeAirmaxReact_vite/. Repositório público verificado; tecnologias React, TypeScript, CSS e Vite. Descrito como estudo de reprodução de layout do Figma, com componentes, responsividade e animações CSS. Usa a imagem original do tênis (não uma captura de tela), em `public/img/project-nike-air-max.webp`. Alteração local para revisão.

- Revisão local de Projetos: removidas as fichas que resumiam empresas; cada fita representa uma entrega, com imagem, demonstração e/ou repositório opcionais. A fita final usa `projectInvitation` de `profile.json`: “E aí, o que iremos construir juntos?”, com ação de contato em 2D/3D, sem erro 404.
- Primeiro projeto real adicionado: `tabuleiro-de-cursos`, com link fornecido pelo usuário (https://andresuckow.github.io/tabuleiro-de-cursos/) e repositório público verificado. Arte original `img/bg.png` convertida para `public/img/project-tabuleiro-de-cursos.webp`. Descrição baseada no HTML/JS públicos: 18 conteúdos, modais de detalhes, links e configuração SCORM. 120 testes, formatação, check e build passaram. Tudo continua local, sem publicação; navegador integrado indisponível para QA visual nesta sessão.

- Revisão local do mapa: trilha única cronológica GVT → MarQ → GP → Pilgrim’s → Match → Sua companhia, casas numeradas com ano, setas no chão, câmera mais elevada e remoção da dica flutuante de arrastar. Movimento e limpeza de vegetação compartilham o traçado; navegação por teclado segue a ordem da trilha. Browser integrado indisponível nesta sessão; avaliação visual inicial baseada na captura enviada pelo usuário, sem confirmação visual da nova versão.

- Revisão local posterior: formação em ADS substitui o cartão do Sebrae em Sobre/Skills, com link para `documents/graduacao-estacio.pdf` em nova aba, compartilhado por 2D/3D. O build copia o documento sem alterar seus bytes.
- “React e TypeScript” foi incorporado ao tooltip de “Interfaces web” (120+ aplicações; 50+ em React/TypeScript). Agora são quatro atributos.
- Alterações desta revisão ainda locais, sem commit/deploy. Formatação, check, build com base de Pages e 117 testes passaram. Verificação automatizada no Chrome encontrou timeout em `Page.enable`; não presumir validação visual concluída.

- Commit de referência: `a9e1173b2dd66f934661c75dd9fb9ce568d5217f` em `main`.
- Migração para portfólio Frontend concluída e publicada em https://andresuckow.github.io/andre-suckow-portfolio/.
- Workflow de referência: https://github.com/AndreSuckow/andre-suckow-portfolio/actions/runs/44258052852 — sucesso e verificação online na sessão anterior.
- Apenas a rota geral permanece. `/cs/` foi removida por instrução explícita mais recente; não restaurar a antiga divisão de perfis.
- Fonte factual: `documents/Curriculo-Andre-Suckow-Frontend.pdf`. O arquivo antigo `ANDRE_LUIS_SUCKOW_CV.pdf` não é a referência atual, mesmo se uma aba antiga do editor o mostrar.
- Dados canônicos: `profile.json` e `skill-details.json`. Sobre, experiências, habilidades, projetos, contatos e currículo foram atualizados. Suporte/CS são experiências complementares ao posicionamento Frontend.
- Cinco experiências reais: Match, Pilgrim's, GP Strategies, MarQ e GVT; sexta parada do mapa é o convite “Sua companhia”. MarQ: jan/2018–jan/2021. Não inventar métricas, demos ou atribuir Next.js a uma empresa sem evidência.
- Conteúdo compartilhado entre modos 2D/3D. PDF disponibilizado é cópia exata do fornecido.

## Preferências e cuidados

- Usuário quer manutenção mais simples e uso econômico de contexto, com mudanças incrementais e cuidadosas.
- Consultar `AGENTS.md` e `ARCHITECTURE.md` antes de modificar. Ler trechos com `rg`, evitando despejar motor minificado inteiro no contexto.
- Não reformatar/refatorar globalmente o motor legado, boot, templates ou contratos textuais de `customize.cjs`. Sua migração foi deixada para etapas futuras.
- O ajuste pontual já feito em `src/engine.js` substituiu o rótulo fixo CUSTOMER SUCCESS por `displayRole` do perfil. Não desfazer.
- Não confundir nomes históricos `cs-portfolio.cjs` e `cs-interactions.js` com uma rota CS ativa: ainda são código compartilhado.
- `public/` mistura fontes manuais e arquivos gerados; `dist/` é descartável. Alterar a fonte correta.
- Usuário autorizou remover código comprovadamente não utilizado, preservando um ponto de recuperação. Não remover recursos apenas porque uma busca literal não encontra referências: existem imports dinâmicos, modelos e fallbacks.
- Melhorias finais devem ser publicadas conforme `AGENTS.md`; análise, revisão e prévia/local não autorizam publicação. Este resumo não altera o site e foi criado apenas localmente.

## Limpeza já concluída

- Removidos poster antigo, gerador obsoleto de PDF e dependências associadas; modelos antigos de xadrez preservados em `archived-assets/models/xadrez/` fora da distribuição.
- Removidas 36 regras CSS auditadas, sem formatação global. Redução aproximada de 12,15 MB no pacote estático, não no download inicial.
- Símbolos suspeitos do motor legado ficaram para análise futura; não considerar sua remoção aprovada por este resumo.
- Relatório de auditoria local: `output/usage-audit/`. Histórico: `CLEANUP-LOCAL.md`.

## Validação e limitações

- Na entrega: 117 testes aprovados, formatação/check/build aprovados com `SITE_BASE_PATH=/andre-suckow-portfolio/`.
- `verify-routes.mjs` validou online 2D/3D/mobile, seis paradas por teclado, fichas frontend/performance, recarregamento, currículo e 404 da rota antiga.
- O teste amplo `verify-portfolio.mjs` tem falha preexistente em “Dragging rotates real 3D notebook geometry”, reproduzida também no baseline anterior à limpeza. Não foi corrigida; não declarar que a suíte ampla inteira passou.
- Prévia usada: http://127.0.0.1:4173/. Confirmar se ainda há servidor ativo antes de reutilizar. `npm run dev` inicia o servidor conforme `server.mjs`.
- Pode haver servidor antigo na porta 4182: é baseline histórico, não a versão nova.

## Recuperação e documentação

- Antes da limpeza: `.checkpoints/pre-cleanup-2026-11-18-b252f9d/`, com ZIP de arquivos rastreados e baseline.
- Antes da migração Frontend: `.checkpoints/pre-frontend-2026-11-18.zip`; SHA-256 `6e29d7bd5118c74d2056db4b5066ab99580c25862852e0237bb49a20ac2428ab`.
- Checkpoints, `tmp/` e `output/` são locais e ignorados pelo Git; não presumir que existem em outro computador.
- Ler `FRONTEND-MIGRATION.md` para detalhes da migração; `DESIGN.md` e `UX-CONTRACT.md` quando a próxima tarefa envolver interface.
- Não há tarefa de implementação pendente da última solicitação. Aguardar a próxima mudança solicitada; não repetir migração, limpeza ou deploy.
- Atualizar este resumo ao concluir etapas importantes, mantendo-o curto e separando fatos confirmados de pendências.
