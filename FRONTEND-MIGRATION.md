# Portfólio Frontend — migração de conteúdo

Fonte factual: `documents/Curriculo-Andre-Suckow-Frontend.pdf`, fornecido pelo usuário. O download em `public/curriculo-andre-suckow.pdf` é uma cópia byte a byte, sem reescrita.

- Apenas a raiz é mantida. `/cs/`, suas fichas e os perfis duplicados foram removidos.
- `profile.json` e `skill-details.json` alimentam HTML, TV 3D e documentos de apoio.
- Sobre, missão, atributos, contato, título da página e encerramento agora destacam frontend.
- Cinco experiências reais, em ordem da mais recente para a mais antiga: Match, Pilgrim's, GP Strategies, MarQ e GVT. A sexta posição é o convite “Sua companhia”. MarQ usa jan/2018–jan/2021, conforme o novo documento.
- Dois destaques profissionais: aplicações educacionais interativas na GP Strategies e performance/qualidade web na Match. Não foram inventados repositórios, demos ou métricas de performance.
- Quinze habilidades distribuídas em Desenvolvimento Frontend, Interfaces e Qualidade, Integrações e Produto. Next.js é apresentado como competência técnica, sem atribuição a uma empresa específica. A formação, o inglês B1 e o curso Sebrae seguem o documento; suporte complementa o posicionamento frontend.
- O mapa 3D dimensiona as posições e o terreno para seis paradas. Empresas sem logo fornecido recebem apenas identificação textual. O único ajuste no motor-fonte foi trocar o rótulo fixo “CUSTOMER SUCCESS” pela propriedade `displayRole` do perfil; não houve refatoração de seu código legado.

Backup local do estado anterior, incluindo a limpeza já aplicada: `.checkpoints/pre-frontend-2026-11-18.zip`. SHA-256: `6e29d7bd5118c74d2056db4b5066ab99580c25862852e0237bb49a20ac2428ab`.

Validação local: formatação, build/check com `SITE_BASE_PATH=/andre-suckow-portfolio/`, 117 testes aprovados, verificação Chrome da raiz em 3D/2D/mobile, navegação por teclado pelas seis experiências, fichas frontend/performance, recarregamento e 404 na rota antiga. Capturas em `tmp/portfolio-browser/frontend-*-desktop.png` e `routes-curriculo-*.png`.

A falha preexistente do teste amplo de arraste do notebook está documentada em `CLEANUP-LOCAL.md`; não foi corrigida nesta mudança de conteúdo.
