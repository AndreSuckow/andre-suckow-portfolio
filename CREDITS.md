# Créditos e origem

Pedras da Dama: [Pedra (Jogo de Damas)](https://sketchfab.com/3d-models/pedra-jogo-de-damas-b38d9483544741238067199fce8852ec), de [Guilherme Tognetti](https://sketchfab.com/guilhermetognetti), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Geometria original compartilhada; material branco adaptado e damas representadas por duas pedras empilhadas.

Modelo de tabuleiro no chão: [3D Ludo Adventure](https://sketchfab.com/3d-models/3d-ludo-adventure-roll-into-a-vibrant-world-8809eed450174fa5a391028521cdba34), de [Ahmad Taj](https://sketchfab.com/ahmadtaj), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Adaptações: extração do tabuleiro sem peões/dados soltos, redução de texturas, escala e inclinação ao lado da cama. Original preservado; derivado em `public/models/tabuleiro/board.glb`, reproduzível por `npm run board:optimize`. A versão construída em código fica como reserva se o modelo não carregar.

Modelos adicionais fornecidos e preservados: [Xadrez](https://sketchfab.com/3d-models/xadrez-69b69c8c199141b9b5a4261e3e269c19), de [Leandro Calazans](https://sketchfab.com/calazans.cg), e [Pedra (Jogo de Damas)](https://sketchfab.com/3d-models/pedra-jogo-de-damas-b38d9483544741238067199fce8852ec), de [Guilherme Tognetti](https://sketchfab.com/guilhermetognetti), ambos CC BY 4.0. As peças do modal usam a interface acessível própria; esses arquivos originais permanecem disponíveis no projeto com as respectivas licenças.

Tabuleiro de quatro jogos: geometria e textura de madeira criadas em código em `public/new-room.js`. Trilha, Dama e Ludo implementados a partir do manual fornecido pelo usuário em `public/models/tabuleiro/manual_regras_jogos_tabuleiro.txt`. O Xadrez usa [chess.js 1.4.0](https://github.com/jhlywa/chess.js), com licença preservada em `public/vendor/chess-LICENSE.txt`. Partidas locais entre pessoas; não há jogador de IA. A variante de Dama segue a promoção durante captura descrita no manual e é identificada nas regras da interface.

Avatar pessoal em blocos: rosto de André com óculos, cabelo e barba criado com ImageGen a partir do retrato aprovado `public/img/andre-pixel.png`, aplicado à cabeça do modelo Minecraft - Steve. Textura em `public/img/andre-minecraft-face.webp`; a camisa escura acompanha o retrato. O modelo original, o Steve e a alternativa Master Chief permanecem preservados.

Alternativa de personagem na prévia local: [Master Chief](https://sketchfab.com/3d-models/master-chief-a321fd10909245a09670bac81d64113a), de [Glitchdust](https://sketchfab.com/GlitchDust), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Modelo e licença preservados em `public/models/master_chief/`. Adaptações: pose neutra, escala no mapa, materiais e articulação dos grupos originais para a caminhada. Personagem Master Chief pertence aos respectivos titulares.

Prévia local do mapa de carreira: [Minecraft jungle map](https://sketchfab.com/3d-models/minecraft-jungle-map-26b31bd5f3bc425b8dcbed6b7990af27), de [x_blade](https://sketchfab.com/X_BLADE.), e [Minecraft - Steve](https://sketchfab.com/3d-models/minecraft-steve-cb228dcc137042cc9a3dc588758cc6e9), de [Vincent Yanez](https://sketchfab.com/vinceyanez), ambos sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Arquivos originais e licenças preservados em suas pastas. Adaptações: escala e enquadramento, clareiras para as empresas e o percurso, materiais sem iluminação externa, separação das seis partes do Steve e animação de caminhada.

Versões otimizadas dos quatro objetos importados em `public/models/optimized/`, geradas por `npm run models:optimize`. Os originais, autores e licenças estão preservados nas pastas de cada modelo. Adaptações adicionais: compressão Meshopt, redução e codificação de texturas, remoção de UVs duplicados da Pokédex, cor uniforme do dourado da Bíblia no material e simplificação conservadora de partes estáticas. Nós e pivôs interativos foram preservados.

Bíblia: [“Holy Bible”](https://sketchfab.com/3d-models/holy-bible-091e139f26554be4844712ab50f8ad2a), de [VHM777](https://sketchfab.com/gizacorp01), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), fornecida pelo usuário em `public/models/holy_bible/`. Geometria, materiais PBR, texturas e licença preservados; escala e orientação ajustadas ao nicho e à inspeção. O link de leitura continua apontando para a Bíblia Online NTLH.

Pokédex: [“Pokedex”](https://sketchfab.com/3d-models/pokedex-7097eba74a7b437b9191deaf5dc7203b), de [chiara.dalfior](https://sketchfab.com/chiara.dalfior), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), fornecida pelo usuário em `public/models/pokedex/`. Geometria, materiais, texturas, abertura original e licença preservados; escala e orientação ajustadas à mesa e à inspeção. Ambos os modelos exibem os respectivos créditos na inspeção.

Porta-retrato: [“porta retrato”](https://sketchfab.com/3d-models/porta-retrato-00bfa4e5862d4d4b89f9bcf06d2a19e4), de [3dwstudio](https://sketchfab.com/3dwstudio), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Modelo fornecido pelo usuário em `public/models/portrait/scene.gltf`, com binário, textura e licença originais preservados. A versão `portrait/family-frame.gltf` adapta os materiais antigos para PBR; `public/family-frame.js` ajusta escala e orientação e aplica a fotografia fornecida por André em `public/img/teste-retrato.png` somente na superfície fotográfica. A moldura e o apoio mantêm seus materiais; os arquivos originais do modelo permanecem preservados. O crédito também aparece na inspeção do objeto.

Discman Sony D150: modelo fornecido pelo usuário em `public/models/discman_d150/`, baseado em [“Discman D150”](https://sketchfab.com/3d-models/discman-d150-6914d1e81eeb4377b61af0e5321ede5b), de [mittelwerk](https://sketchfab.com/mittelwerk), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Adaptações: escala e orientação no quarto, visor com título animado, botões físicos ligados ao player, rodinha de volume funcional, animação da dobradiça pelo botão OPEN e substituição das inscrições frontais por Retroceder, Ouvir e Pausar em elementos 3D. Arquivo e licença originais preservados na pasta do modelo.

Pôster Super Mario World: arte japonesa de Nintendo, correspondente à composição amarela enviada pelo usuário. Capa plana obtida no [OC ReMix](https://ocremix.org/game/98/super-mario-world-snes), preservada sem recorte em `public/img/poster-super-mario-world.webp`. Arte pertencente à Nintendo.

Pôster Mega Man X: imagem fornecida pelo usuário em `public/img/megamanx.webp`, substituindo o pôster de Twisted Metal. A capa exibe créditos de Daniel Arseneault e Chamba; arte e personagens pertencem aos respectivos titulares. Imagem preservada sem recorte, com proporção original no quarto.

Pôster Teenage Mutant Ninja Turtles III: The Manhattan Project: arte de Konami e respectivos titulares, correspondente à referência enviada por André; capa frontal obtida no [LaunchBox Games Database](https://gamesdb.launchbox-app.com/games/images/1386-teenage-mutant-ninja-turtles-iii-the-manhattan-project) e salva em `public/img/poster-turtles-manhattan.webp`.

Pôster de Donkey Kong Country 3: arte de Nintendo/Rare, obtida em https://asst2game.ru/uploads/posts/2023-08/donkey-kong-country-3-dixie-kongs-double-trouble.webp e salva em `public/img/poster-donkey-kong-country-3.webp`. A cena corresponde à referência do usuário, com enquadramento diferente. Não é criação de André.

Novo Quarto 3D: geometria, mantas, madeira e piso criados em código no arquivo `public/new-room.js`, inspirados na imagem de referência fornecida por André. A autoria da imagem de referência não foi informada. A TV, o console e os cartuchos interativos usam os modelos originais já mantidos no projeto.

O quarto 3D, modelos GLB, texturas e motor original foram adaptados dos arquivos públicos da referência de [Valdimir Ferraz](https://valdimirferraz.vercel.app/). As fontes mantidas estão em `src/engine.js`, `src/boot.js` e `src/portfolio.html`; modelos e texturas ativos ficam em `public/models/` e `public/textures/`. O motor inclui Three.js e GSAP; preservar seus avisos de licença. A disponibilização pública dos assets não constitui autorização de redistribuição: verificar os termos de origem antes de publicar.

Fontes: Inter, Space Grotesk e Pixelify Sans, com arquivos locais em `public/_astro/`.

Avatar: retrato em pixel art de André gerado com ImageGen a partir da foto fornecida, preservando óculos, cabelo e barba. Arquivo usado: `public/img/andre-pixel.png`.

MarQ HR: `public/img/marqhr-site.png` é uma captura local da [página oficial](https://marqhr.com/), correspondente à referência enviada. O site e as imagens da empresa não são criações de André. O relato sobre a primeira equipe de CS e o crescimento da empresa foi fornecido pelo usuário.

Conteúdo profissional: informações fornecidas por André e documento original preservado em `documents/curriculo-original.docx`. PDF disponível em `public/curriculo-andre-suckow.pdf`. Barras de atributos são ilustrativas.

Os efeitos sonoros atuais são sintetizados por `public/audio-controller.js`, compartilhado entre a TV e os controles HTML; não são uma trilha externa. Áudios, vídeos, capas e pôsteres de versões descartadas foram removidos.
Pilgrims Consulting: `public/img/pilgrims-site.png` é uma captura do banner da [página oficial](https://pilgrimsconsulting.com.br/), correspondente ao banner da referência enviada pelo usuário. O site e as imagens pertencem à empresa.

Logo MarQ HR: SVG fornecido pelo usuário e salvo em `public/img/marqhr-logo.svg`, preservando os traçados originais.

Logo Pilgrims: arquivo oficial da [empresa](https://pilgrimsconsulting.com.br/wp-content/uploads/2023/08/logo-white.webp), usado em `public/img/pilgrims-logo.webp`.
Emulação de ROM local: [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS), distribuição aberta 4.2.3 carregada sob demanda de `https://cdn.emulatorjs.org/4.2.3/data/`. O portfólio não inclui ROMs; o visitante seleciona seu próprio arquivo temporário no navegador. O núcleo SNES é fornecido pela distribuição do EmulatorJS.

## Game Boy

Emulação local: [jsGBC-core 0.7.0](https://github.com/ardean/jsGBC-core), de ardean, MIT. O núcleo informa uso da implementação Z80 de [GameBoy-Online](https://github.com/taisel/GameBoy-Online). Bundle para navegador em `public/vendor/gameboy/jsgbc.js`, com licença e avisos das dependências preservados na mesma pasta. Sem boot ROMs incluídas. O arquivo de Pokémon Blue foi fornecido pelo usuário e incluído por solicitação explícita de publicação; não é abrangido pela licença MIT do emulador. Pokémon pertence aos respectivos titulares.

Modelo 3D do aparelho, carcaça da interface, controles e cartucho de diagnóstico: criados em código para este portfólio. Game Boy e Nintendo são marcas de seus respectivos titulares.
