# Mapa de manutenção

Leia este mapa antes de abrir arquivos grandes. Procure o símbolo ou a funcionalidade com `rg -n` e leia apenas o trecho necessário. Não use `dist/`, bundles de terceiros ou o motor inteiro como ponto de partida para uma alteração pequena.

## Fluxo atual

```text
profile-curriculo.json + skill-details-curriculo.json ─┐
profile.json + skill-details.json ────────────────────┤
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
| Conteúdo profissional da raiz | `profile-curriculo.json`, `skill-details-curriculo.json` |
| Conteúdo profissional de `/cs/` | `profile.json`, `skill-details.json` |
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

- `public/engine.js`, `public/boot.js`, `public/index.html`, `public/cs/index.html` e as páginas de fichas/currículos são gerados. Corrija a fonte ou o gerador, nunca somente a saída.
- Os demais módulos JS e estilos de `public/` ainda são fontes mantidas manualmente. Não excluir ou mover `public/` como se fosse uma pasta descartável.
- `dist/` é inteiramente gerado e não deve ser editado ou versionado.
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

Cada etapa deve manter os dados independentes das duas rotas e a apresentação compartilhada. Não juntar mudanças visuais, atualização de dependências do motor e extração de módulos no mesmo lote.
