# Publicação do portfólio

Ao concluir melhorias solicitadas neste site, incluir a publicação na versão final em https://andresuckow.github.io/andre-suckow-portfolio/, conforme preferência explícita do usuário.

A raiz apresenta o currículo e `/cs/` a versão de Customer Success. Ambas usam o mesmo visual, template e motor 2D/3D; apenas o conteúdo profissional pode variar. `profile-curriculo.json` e `skill-details-curriculo.json` alimentam a raiz; `profile.json` e `skill-details.json` alimentam `/cs/`. Preservar essa separação de dados e compartilhar alterações visuais entre as duas rotas.

- Validar testes, check e build com `SITE_BASE_PATH=/andre-suckow-portfolio/`.
- Fazer commit das alterações pertinentes e enviar para `main`, que dispara o workflow de GitHub Pages.
- Acompanhar o deploy e conferir a versão online antes de declarar a publicação concluída. Se houver bloqueio, informar claramente o que continua apenas local.
- Não publicar alterações quando o usuário pedir somente análise, revisão ou uma versão preliminar.
