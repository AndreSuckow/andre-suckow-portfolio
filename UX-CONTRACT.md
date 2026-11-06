# Portfólio de CS - contrato de navegação

## Portfólio principal de CS

Fonte da solicitação: usuário, 14/10/2026. `profile.json` registra os fatos, contatos confirmados e hobbies; `documents/curriculo-original.docx` preserva o documento original. Os tamanhos de equipe no caso da MarQ HR são informação fornecida pelo usuário. Sua companhia é convite, sem vínculo profissional inventado.

| Capacidade | Responsável | Comportamento e verificação |
|---|---|---|
| Conteúdo e navegação 2D/3D | `customize.cjs`, `cs-portfolio.cjs`, motor da TV | Sobre → Experiência → Projetos → Skills → Hobbies → Contato. Hobbies também participa dos gatilhos de scroll, teclado e câmera. |
| Atributos | Botões HTML e itens da TV | Tooltip por mouse, foco/teclado ou toque, descrições em verbos de atuação e Escape no HTML. Raycast real da TV verifica hover. |
| Contatos | `public/cs-interactions.js`, `cs-model.js` | LinkedIn e igreja confirmados pelo usuário. `mailto:` abre o cliente configurado. WhatsApp prepara a mensagem e exige envio pelo visitante; bom dia das 5h às 11h59, boa tarde das 12h às 17h59 e boa noite no restante, em America/Sao_Paulo. |
| Modais | `dialog.skill-modal`, eventos existentes de abertura/fechamento | Skills e Game Over reutilizam apresentação, semântica nativa, foco, Escape e suspensão do scroll 3D. Retorno de foco ao fechar. |
| Continue e Game Over | `public/cs-interactions.js`, seção `#fim` | 9 → 0 somente com a última seção visível. Sair, ocultar a aba ou navegar cancela; outro modal pausa a contagem. Ao zero, abrir uma vez com Contrate agora no WhatsApp e Reiniciar. Contato não contém contador. |
| Reiniciar | `[data-reload]` | Remover fragmento da URL, restaurar scroll manual, voltar ao topo e recarregar. |
| Envio de mensagem | `public/contact-form.js`, FormSubmit AJAX | Validação no cliente; destinatário fixo; visitante em reply-to. Sem chave ou backend. Busy impede cliques duplicados; confirmação só após aceite do serviço; erros mantêm os campos. Ativação do destinatário feita pelo Gmail. |
| Alternativa 2D e toque | HTML gerado, `public/custom.css` | Hobbies, links de contato e atributos continuam utilizáveis sem o canvas. Botões visuais A/B removidos; teclado do motor preservado. |
| Jogos de tabuleiro | `public/board-games/ui.js`, motores separados de Trilha, Dama, Ludo e Xadrez | Modal nativo, duas pessoas no mesmo aparelho ou contra o computador na Dama (Ludo: 2–4), validação antes de alterar o estado, destinos legais visíveis, histórico de jogadas visível apenas no Xadrez, reinício confirmado e restauração do foco. Sessões preservadas ao trocar de jogo durante a visita. Promoção do xadrez usa seletor nativo; regras da variante são apresentadas antes e durante a partida. |

Jogos de tabuleiro: Trilha e Dama reconhecem empate por repetição tripla; Dama usa a promoção durante captura do manual. Ludo concede nova jogada com seis, usa os inícios e quatro estrelas como casas seguras e não aplica punição por três seis ou barreiras. As regras são exibidas no modal. Xadrez reconhece automaticamente repetição e a regra dos 50 lances. Dama oferece adversário humano ou computador; o visitante joga de brancas contra o PC. Os outros jogos continuam locais entre pessoas. Na Trilha, a peça desliza até o destino, com colocação e captura animadas; movimento reduzido aplica a jogada imediatamente.

