# Modelos 3D otimizados

Os quatro objetos importados usam GLBs gerados em `public/models/optimized/`. Os arquivos originais, texturas e licenças permanecem nas pastas dos autores e são a reserva em caso de falha no carregamento de um GLB. A entrada antiga do porta-retrato continua disponível.

| Objeto | Originais e texturas | GLB otimizado | Triângulos antes → depois |
|---|---:|---:|---:|
| Discman | 7,93 MB | 1,82 MB | 188.972 → 171.886 |
| Bíblia | 7,97 MB | 1,07 MB | 121.654 → 68.960 |
| Pokédex | 10,44 MB | 2,62 MB | 60.060 → 37.476 |
| Porta-retrato | 0,44 MB | 0,08 MB | 660 → 660 |
| **Total** | **26,78 MB** | **5,58 MB** | **371.346 → 278.982** |

Os tamanhos são bytes dos arquivos, sem compressão HTTP: redução de 79,2% no payload desses objetos e 24,9% nos triângulos. A área total das texturas cai de 41.943.040 para 10.813.440 pixels. Em RGBA8 com mipmaps, o footprint estimado cai de 213,3 para 55 MiB; isso não é medição de VRAM nem promessa de ganho de FPS.

## Gerar novamente

```sh
npm ci
npm run models:optimize
```

O pipeline remove os UVs duplicados da Pokédex, usa OPAQUE somente após conferir todos os pixels alpha, substitui a textura dourada uniforme da Bíblia por um fator de cor em espaço linear, reduz resoluções e codifica mapas em WebP sem perdas após o redimensionamento. O atlas do porta-retrato usa JPEG de alta qualidade. A geometria recebe weld, simplificação conservadora de peças selecionadas, índices compactos, quantização de alta precisão e Meshopt. Os nós e pivôs usados pelos controles mantêm seus nomes e transformações.

`manifest.json` registra tamanhos, contagens, arquivos de entrada e hashes SHA-256. Os testes detectam originais alterados sem regeneração e verificam os GLBs com o mesmo decoder Meshopt que o site entrega. As ferramentas são dependências de desenvolvimento e não adicionam bibliotecas de compressão ao bundle do navegador.

## Carregamento e materiais

`public/model-loader.js` instala o decoder em cada carregador e tenta o original de cada objeto de forma independente se o otimizado falhar. No quarto procedural, o carregador deixa de buscar `room.glb`, `props.glb`, `console.glb` e as duas texturas da versão clássica — aproximadamente 1 MB a menos nessa etapa. O modo clássico conserva esses recursos.

O realce âmbar é temporário no quarto. A inspeção restaura as propriedades de emissão originais para preservar a capa escura da Bíblia, a imagem da família e as partes luminosas da Pokédex.

## Validação

- `SITE_BASE_PATH=/andre-suckow-portfolio/` nos testes, check e build.
- Decodificação, integridade dos assets, orçamento de tamanho, nomes e pivô da tampa, UVs, alpha e materiais.
- Navegador: cliques físicos, inspeção, giro, zoom, créditos, link NTLH, retrato e paisagem no celular, ausência de fallback silencioso e de downloads dos recursos clássicos.
- Discman: OPEN, reprodução/pausa, retrocesso, rodinha de volume, controles móveis e limites de zoom.

Manter a comparação visual no quarto e na inspeção ao ajustar tolerâncias. Não fundir tampa, visor, botões ou outras partes com funções independentes. A versão detalhada não é removida dos originais; os GLBs ativos foram escolhidos por tamanho e aparência, sem introduzir troca visível de LOD ou carregamento tardio de detalhes.
