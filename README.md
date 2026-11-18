# Portfólio de André Luis Suckow

Portfólio de Desenvolvimento Frontend, com quarto 3D, TV interativa e alternativa 2D. Inclui Sobre, Experiência, Projetos, Skills, Hobbies, Contato e encerramento com Game Over.

## Executar e verificar

Requer Node.js 22 ou superior.

```powershell
npm install
npm run dev
npm run build
npm run check
npm test
```

O portfólio abre em http://localhost:4173/. A rota /cs/ foi removida. Os modos 2D e 3D usam profile.json e skill-details.json, com conteúdo baseado em documents/Curriculo-Andre-Suckow-Frontend.pdf. O build regenera o conteúdo e substitui dist/.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` verifica e publica o site a cada push para `main`. Nas configurações do repositório, Pages deve usar **GitHub Actions**. O endereço previsto é https://andresuckow.github.io/andre-suckow-portfolio/.

| Rota | Conteúdo |
| --- | --- |
| `/andre-suckow-portfolio/` | Portfólio de Desenvolvimento Frontend. |

Apenas a raiz é mantida. Fichas de experiências ficam em /cases/frontend/ e /cases/performance/, e a versão para impressão em /curriculo/. Todas retornam à raiz e compartilham o mesmo perfil. /cs/ e suas subpáginas não são publicadas.

Após concluir uma alteração local, envie-a pelo painel de Controle de Código-Fonte do VS Code (commit e sincronização), ou pelo terminal:

```powershell
git add .
git commit -m "Descreva a alteração"
git push
```

O GitHub executa build, verificações e testes antes de atualizar o site. A publicação leva alguns minutos; salvar um arquivo local, por si só, não altera o site publicado. O status aparece na aba Actions do repositório.

Para gerar o build com os mesmos caminhos do Pages no PowerShell:

```powershell
$env:SITE_BASE_PATH='/andre-suckow-portfolio/'
npm run build
Remove-Item Env:SITE_BASE_PATH
```

## Fontes mantidas

Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para encontrar a fonte de cada funcionalidade, distinguir arquivos manuais e gerados e conhecer os limites da migração incremental. `npm run format` formata somente os scripts já migrados; `npm run format:check` verifica esse mesmo escopo sem editar arquivos. O motor legado e os templates permanecem fora da formatação automática.

O **Novo Quarto 3D** usa um cenário criado em código a partir da referência enviada. A abertura mostra o quarto por cima e o scroll aproxima a câmera da TV. Para trocar somente o ambiente, use `npm run room:previous` (quarto anterior) ou `npm run room:new` (novo quarto). O checkpoint completo antes dessa implementação está em `.checkpoints/antes-novo-quarto-3d.zip`.

- `profile.json`: única fonte de conteúdo profissional, contatos e hobbies.
- `skill-details.json`: explicações e relatos das habilidades de CS.
- `src/portfolio.html`, `src/boot.js`, `src/engine.js`: fontes do portfólio e do motor 3D adaptado.
- `customize.cjs`: gera public/index.html, as fichas e a versão para impressão a partir do perfil único.
- `customize.cjs` e `cs-portfolio.cjs`: geração de HTML, dados da TV e estudos de caso.
- `public/`: scripts, estilos, fontes, modelos e imagens usados pelo site.
- `documents/Curriculo-Andre-Suckow-Frontend.pdf`: currículo fornecido, preservado sem regeneração. `check.mjs` verifica que o download em `public/curriculo-andre-suckow.pdf` é idêntico ao original.
- `archived-assets/`: originais preservados que não são usados pelo site e não entram em `dist/`; atualmente contém o antigo modelo 3D de xadrez com sua licença.

O som do quarto é sintetizado pelo motor. Não há trilhas ou vídeos externos no projeto.

## E-mail

O formulário envia diretamente pelo FormSubmit para andre.suckow.dev@gmail.com, sem backend ou chave de API. Siga [EMAIL-SETUP.md](EMAIL-SETUP.md) para confirmar a ativação.

## Verificação visual

`node verify-portfolio.mjs` verifica a TV, tooltips, Hobbies, Game Over, reinício e o modo móvel em Chrome. `node verify-contact.mjs` verifica o formulário com respostas simuladas, sem enviar e-mails reais. No ambiente isolado, a opção `GAME_TEST_NO_SANDBOX=1` é aceita somente para a origem local.

`node verify-gameboy.mjs` verifica o Pokémon Blue em Chrome: áudio real, centralização em desktop e celular, geometria e toque nos botões, pausa, retomada, mudo e fechamento. Capturas ficam em `tmp/portfolio-browser/`; o servidor local deve estar ativo.

`node verify-crt-persistence.mjs` percorre duas vezes as seis telas no Chrome, acompanha a animação do CRT, testa seu botão e a volta de celular para desktop. Também compila o shader real em WebGL e mede 160 quadros dos ciclos da faixa, chiado persistente e respeito a CRT desligado e movimento reduzido. Requer o servidor local; `GAME_TEST_URL` permite conferir a versão publicada.

`node verify-tv-brightness.mjs` mede os pixels da tela no renderizador real, incluindo a passagem do pós-processamento para renderização direta. Compara brilho e granulação após Experiência → Projetos → Experiência por menu externo, menu da TV e teclado, inserção/substituição/ejeção de cartucho e desligar/religar a TV, nos níveis alto, médio e baixo. O relógio da amostra e a câmera são fixados somente durante a captura para permitir comparação; os controles de diagnóstico são injetados apenas no navegador isolado e não são publicados. Capturas ficam em `tmp/portfolio-browser/brightness-*.png`.

`node verify-routes.mjs` verifica a raiz nos modos 3D/2D, mobile, recarregamento, links das fichas e ausência de /cs/. GAME_TEST_URL recebe a raiz da prévia ou publicação.

Veja [CREDITS.md](CREDITS.md) para a origem do motor e dos assets.
