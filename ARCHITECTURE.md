# Mapa de manutenção

Leia este mapa antes de abrir arquivos grandes. Procure o símbolo ou a funcionalidade com `rg -n` e leia apenas o trecho necessário. Não use `dist/`, bundles de terceiros ou o motor inteiro como ponto de partida para uma alteração pequena.

## Fluxo atual

```text
profile.json + skill-details.json ────────────────────┐
src/portfolio.html + src/room-discoveries.html ────────┤
src/engine.js + src/boot.js ───────────────────────────┤
                                                    ↓
                   customize.cjs + cs-portfolio.cjs + certification.cjs
                                                    ↓
                  public/ (fontes manuais + arquivos gerados)
                                                    ↓
                     build.mjs (copia e ajusta caminhos)
                                                    ↓
                        dist/ → GitHub Pages
```

`npm run dev` serve `public/`; não regenera os templates. Execute `npm run build` depois de editar dados ou templates. O build importa `customize.cjs`, recria `dist/` e aplica `SITE_BASE_PATH` somente à saída. Não há etapa adicional de minificação nesta primeira migração.

## Onde editar

| Responsabilidade | Fonte canônica |
| --- | --- |
| Conteúdo profissional único | `profile.json`, `skill-details.json`; fonte factual em `documents/Curriculo-Andre-Suckow-Frontend.pdf` |
| Estrutura compartilhada e markup dos objetos | `src/portfolio.html`, `src/room-discoveries.html` |
| Motor legado, câmera, TV e inicialização | `src/engine.js`, `src/boot.js` — migração posterior |
| Geração de páginas, dados e versões de assets | `customize.cjs`, `cs-portfolio.cjs`, `certification.cjs` — preservar contratos textuais |
| Tokens e apresentação | `public/style.css`, `public/custom.css`; decisões em `DESIGN.md` |
| Conteúdo 2D e contato | `public/enhancements.js`, `public/cs-interactions.js`, `public/contact-form.js`, `public/mobile-reading.js`, `public/mobile-motion.js` |
| Cenário e objetos | `public/new-room.js`, `public/imported-props.js`, `public/family-frame.js` |
| Descobertas, movimento e inspeção | `public/room-cascade.js`, `public/scene-affordances.js`, `public/interaction-motion.js`, `public/inspection-layout.js`, `public/inspection-picking.js` |
| Experiência profissional na TV | `public/career-map.js`, `public/career-models.js`, `public/career-orbit.js` |
| Jogos de tabuleiro | `public/board-games/` |
| Game Boy e console | `public/gameboy*.js`, `public/gameboy.css`, `public/snes-console.js`, `public/snes-controls.js` |
| Discman, pôsteres e notebook | `public/discman*.js`, `public/poster-games.js`, `public/notebook-viewer.js` |
| Build, validação e servidor | `build.mjs`, `check.mjs`, `server.mjs`, `range.mjs` |
| Testes unitários e de integração | `*.test.mjs`; lista executada em `package.json` |
| Verificações reais no navegador | `verify-*.mjs`; detalhes no `README.md` |

## Fronteira entre fonte e geração

- `public/engine.js`, `public/boot.js`, `public/index.html` e as páginas de fichas/currículo são gerados. Corrija a fonte ou o gerador, nunca somente a saída. `/cs/` foi retirada, assim como os perfis duplicados. Os nomes históricos `cs-portfolio.cjs`, `cs-interactions.js` e `cs-model.js` ainda identificam módulos compartilhados; não representam uma rota ativa.
- Os demais módulos JS e estilos de `public/` ainda são fontes mantidas manualmente. Não excluir ou mover `public/` como se fosse uma pasta descartável.
- `dist/` é inteiramente gerado e não deve ser editado ou versionado.
- `archived-assets/` preserva originais sem uso no site, com suas licenças, fora do pacote publicado. Atualmente contém o antigo modelo 3D de xadrez; o jogo ativo continua em `public/board-games/`.
- `public/vendor/`, fontes, modelos, imagens, áudio e ROMs são dependências/assets. Evite ler seu conteúdo em tarefas de código; preserve licenças e créditos.
- `customize.cjs` depende de nomes e delimitadores específicos do motor (`Eh`, `Dh`, `Oh`, `kh`, `Ah`, `jh`). Alguns testes também verificam trechos literais. Formatação global pode quebrar esses contratos.

## Etapa 1: infraestrutura legível

`npm run format` e `npm run format:check` usam a lista explícita em `scripts/format.mjs`. Ela abrange build, check, servidor, ranges e verificadores de navegador. A versão do Prettier é fixa no `package.json` e no lockfile. A verificação roda no CI.

Não executar `prettier --write .`. Para incluir um arquivo, primeiro verificar seus consumidores, as buscas textuais e os testes; só então ampliar a lista. A formatação não deve renomear símbolos, mudar algoritmos ou reformatar strings de HTML/JS usadas por testes e geradores.

Para esta etapa, a equivalência exigida é o mesmo conjunto de arquivos e os mesmos bytes em `dist/`, usando o mesmo ambiente e `SITE_BASE_PATH=/andre-suckow-portfolio/` antes e depois. Executar também `npm run check`, `npm test` e o verificador de rotas quando Chrome estiver disponível.

## Próximas etapas, separadas desta mudança

1. Migrar módulos manuais de `public/` por responsabilidade, com cópia no build e URLs estáveis. Ajustar os testes e a lista de hashes do gerador junto com cada movimento.
2. Separar dependências do motor e substituir suas substituições textuais por interfaces explícitas, uma por vez.
3. Só depois adotar minificação de produção, com fontes legíveis, preservação de licenças, cache correto e validação de módulos, workers e imports dinâmicos.

Cada etapa deve manter uma única fonte de conteúdo para os modos 2D e 3D. Não juntar atualização de dependências do motor e extração de módulos no mesmo lote. O mapa de carreira dimensiona terreno, posições e áreas de clique a partir da quantidade de experiências; novas empresas não devem reutilizar rótulos fixos de empresas anteriores.

## Demonstrações mobile dos projetos

`profile.json` define `projects[].demoUrl`; todo projeto com uma demonstração online ganha automaticamente a ação mobile, salvo se `mobilePreview` for explicitamente `false`. `customize.cjs` gera as ações das fichas 2D, enquanto `public/project-demo-actions.js` gera as ações no canvas 3D. `public/mobile-preview.js` carrega cada URL em um iframe interativo com viewport mobile e, apenas se ele falhar ou exceder o tempo limite, apresenta instruções para abrir o projeto no celular. `public/mobile-phone-viewer.js` alinha o conteúdo ao modelo em `public/models/mobile/`. O Three.js local só é carregado sob demanda, sem inicializar o quarto. `scripts/prepare-mobile-vendor.mjs` reproduz os módulos de vendor durante o build. `verify-mobile-preview.mjs` verifica a experiência no Chrome.
