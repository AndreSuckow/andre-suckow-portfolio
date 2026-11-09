# Portfólio de André Luis Suckow

Portfólio de Customer Success e Onboarding, com quarto 3D, TV interativa e alternativa 2D. Inclui Sobre, Experiência, Projetos, Skills, Hobbies, Contato e encerramento com Game Over.

## Executar e verificar

Requer Node.js 22 ou superior.

```powershell
npm install
npm run dev
npm run build
npm run check
npm test
```

O currículo abre em http://localhost:4173/ e o portfólio de Customer Success em http://localhost:4173/cs/. As duas rotas usam o mesmo template, estilos, quarto 3D e alternativa 2D; atualmente têm o mesmo conteúdo. O build regenera o conteúdo e substitui `dist/` para impedir a permanência de arquivos antigos.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` verifica e publica o site a cada push para `main`. Nas configurações do repositório, Pages deve usar **GitHub Actions**. O endereço previsto é https://andresuckow.github.io/andre-suckow-portfolio/.

| Rota | Conteúdo |
| --- | --- |
| `/andre-suckow-portfolio/` | Currículo com a mesma apresentação interativa de CS. |
| `/andre-suckow-portfolio/cs/` | Versão atual do portfólio de Customer Success. |

O GitHub Pages resolve `/cs` para `/cs/`. Os assets e o motor são compartilhados. A raiz usa `profile-curriculo.json` e `skill-details-curriculo.json`; CS usa `profile.json` e `skill-details.json`. Esses arquivos começam com os mesmos dados e podem receber experiências e empresas distintas. Cada HTML incorpora seus dados para o motor 3D, que lê o conteúdo da rota ativa. As fichas e a versão para impressão também usam o perfil e o link de retorno da própria rota: `/cases/` e `/curriculo/` na raiz, `/cs/cases/` e `/cs/curriculo/` para CS.

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

O **Novo Quarto 3D** usa um cenário criado em código a partir da referência enviada. A abertura mostra o quarto por cima e o scroll aproxima a câmera da TV. Para trocar somente o ambiente, use `npm run room:previous` (quarto anterior) ou `npm run room:new` (novo quarto). O checkpoint completo antes dessa implementação está em `.checkpoints/antes-novo-quarto-3d.zip`.

- `profile.json`: conteúdo profissional, contatos e hobbies.
- `skill-details.json`: explicações e relatos das habilidades de CS.
- `profile-curriculo.json` e `skill-details-curriculo.json`: conteúdo independente da raiz, inicialmente igual ao de CS.
- `src/portfolio.html`, `src/boot.js`, `src/engine.js`: fontes do portfólio e do motor 3D adaptado.
- `customize.cjs`: gera `public/index.html` e `public/cs/index.html` a partir do mesmo template e dos perfis de cada rota, além das respectivas fichas e versões para impressão.
- `customize.cjs` e `cs-portfolio.cjs`: geração de HTML, dados da TV e estudos de caso.
- `public/`: scripts, estilos, fontes, modelos e imagens usados pelo site.
- `documents/curriculo-original.docx`: documento original preservado. `create-cv-pdf.mjs` permite regenerar e verificar o PDF; imagens de verificação vão para `tmp/`.

O som do quarto é sintetizado pelo motor. Não há trilhas ou vídeos externos no projeto.

## E-mail

O formulário envia diretamente pelo FormSubmit para andre.suckow.dev@gmail.com, sem backend ou chave de API. Siga [EMAIL-SETUP.md](EMAIL-SETUP.md) para confirmar a ativação.

## Verificação visual

`node verify-portfolio.mjs` verifica a TV, tooltips, Hobbies, Game Over, reinício e o modo móvel em Chrome. `node verify-contact.mjs` verifica o formulário com respostas simuladas, sem enviar e-mails reais. No ambiente isolado, a opção `GAME_TEST_NO_SANDBOX=1` é aceita somente para a origem local.

`node verify-gameboy.mjs` verifica o Pokémon Blue em Chrome: áudio real, centralização em desktop e celular, geometria e toque nos botões, pausa, retomada, mudo e fechamento. Capturas ficam em `tmp/portfolio-browser/`; o servidor local deve estar ativo.

`node verify-crt-persistence.mjs` percorre duas vezes as seis telas no Chrome, acompanha a animação do CRT, testa seu botão e a volta de celular para desktop. Também compila o shader real em WebGL e mede 160 quadros dos ciclos da faixa, chiado persistente e respeito a CRT desligado e movimento reduzido. Requer o servidor local; `GAME_TEST_URL` permite conferir a versão publicada.

`node verify-routes.mjs` verifica a apresentação compartilhada na raiz e em `/cs/`, o modo 3D/2D, o layout mobile, atualização direta, redirecionamento de `/cs` e retorno das fichas e versões para impressão. Nesse script, `GAME_TEST_URL` recebe a raiz; nos demais verificadores, pode receber qualquer uma das duas rotas.

Veja [CREDITS.md](CREDITS.md) para a origem do motor e dos assets.
