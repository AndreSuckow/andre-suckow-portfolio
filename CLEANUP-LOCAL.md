# Limpeza experimental local

Registro histórico da etapa de limpeza anterior à migração frontend. O estado do PDF e das rotas descrito abaixo corresponde àquela validação; a migração posterior passou a usar o novo currículo frontend e retirou `/cs/`.

Base anterior: `b252f9d88f3325e08c3ed442e6b5f1e95caea206`. Esta etapa é uma prévia local solicitada para testar as remoções; não foi enviada ao GitHub Pages.

## Ponto de restauração

O backup está em `.checkpoints/pre-cleanup-2026-11-18-b252f9d/`:

- `tracked-before.zip`: 242 arquivos versionados da base anterior, com integridade verificada.
- SHA-256: `9c31aa3a7ff569287ba4123235d60f7598435d925beb5f19018172056b3f8cf9`.
- Cópia adicional do PDF local não versionado e capturas das duas rotas.
- `baseline/`: cópia extraída para comparação no navegador.
- `README.md`: instruções de restauração sem apagar documentos locais.

Prévia limpa: `http://127.0.0.1:4173/` e `/cs/`. Cópia anterior: `http://127.0.0.1:4182/` e `/cs/`. Os servidores precisam estar ativos; o ZIP e o commit permanecem como pontos de restauração depois de encerrá-los.

## Alterações

- Removido `public/img/poster-twisted-metal.webp`, substituído anteriormente por Mega Man X.
- Nove arquivos do modelo antigo de xadrez movidos de `public/models/tabuleiro/xadrez/` para `archived-assets/models/xadrez/`, preservando conteúdo e licença. O jogo atual e as pedras da Dama permanecem ativos.
- Aposentado `create-cv-pdf.mjs`, dependente de um DOCX ausente; removidas as dependências diretas exclusivas `pdfkit`, `pdfjs-dist`, `adm-zip` e `fast-xml-parser`. O npm retirou 30 pacotes da árvore instalada; `@napi-rs/canvas` continua presente.
- Removidas 36 regras CSS associadas às 28 classes auditadas: 7 regras de `public/custom.css` e 29 de `public/style.css`, totalizando 3.047 bytes. Os seletores dinâmicos do Ludo foram preservados. As regras foram removidas por posições da árvore sintática, sem reformatar as folhas inteiras ou alterar regras compartilhadas.
- README, créditos e mapa de manutenção atualizados.

Redução no pacote estático: **12.153.436 bytes**, aproximadamente **12,15 MB**, somando assets retirados e CSS. Não representa redução igual no carregamento inicial, pois os assets antigos não eram requisitados. Os arquivos arquivados continuam no repositório, fora de `public/` e `dist/`.

Motor-fonte, boot-fonte, templates e `customize.cjs` permanecem intactos. Os arquivos gerados mudam sua versão de cache após a alteração de CSS. Currículo PDF e dados das duas rotas foram preservados.

## Validação

- `npm run format:check`: passou.
- `SITE_BASE_PATH=/andre-suckow-portfolio/` com build, check e testes: passou; **117 testes**, nenhuma falha.
- `npm ls --depth=0`: dependências restantes válidas.
- Modelos arquivados comparados com o commit anterior; binários idênticos e texto equivalente considerando finais de linha.
- Os dez arquivos retirados de `public/` não aparecem no build regenerado.
- PDF de download continua idêntico a `documents/ANDRE_LUIS_SUCKOW_CV.pdf`.
- `verify-routes.mjs`: passou no Chrome, nas duas rotas, com desktop/mobile, 2D/3D, recarregamento e retorno das fichas.
- Capturas mobile das duas rotas ficaram idênticas byte a byte às capturas anteriores. Desktop foi inspecionado visualmente; a cena 3D varia com animação/enquadramento no momento da captura.
- Smoke test em Chrome dos quatro jogos, nas duas rotas: xadrez com jogada e4, Dama com carregamento das pedras 3D e jogada, Ludo, Trilha e fechamento do modal. Passou sem exceções de runtime registradas.

### Falha preexistente reproduzida

`verify-portfolio.mjs` falhou na asserção **“Dragging rotates real 3D notebook geometry”**, linha 303. A execução isolada na versão limpa e a execução na cópia anterior do ZIP falharam na mesma asserção. Portanto, não foi classificada como regressão da limpeza. O teste amplo interrompe nesse ponto; suas verificações posteriores não estão validadas por essas execuções.

Logs locais: `tmp/cleanup-tests.log`, `tmp/cleanup-portfolio.log`, `tmp/baseline-portfolio.log`, `tmp/cleanup-games.log`. Smoke test temporário: `tmp/verify-cleanup-games.mjs`. Nenhuma asserção dos testes existentes foi desativada ou alterada.

Não foram retirados os cinco símbolos suspeitos do motor, fallbacks, variantes clássicas, avatares alternativos, workers, emuladores, ROM, áudio, licenças ativas ou documentos pessoais. Uma revisão interativa do usuário ainda pode revelar estados não cobertos pelos testes.
