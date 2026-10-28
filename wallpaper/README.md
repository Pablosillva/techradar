# Developer Workspace — Cheat Sheet Wallpaper

Papel de parede 8K (7680 × 4320) com o dashboard de atalhos e comandos para desenvolvedores Full Stack.

## Arquivos gerados

| Arquivo | Resolução | Uso |
|---|---|---|
| `developer-cheat-sheet-8k.png` | 7680 × 4320 | Master 8K Ultra HD (monitores 8K / 4K com escala 200%) |
| `developer-cheat-sheet-4k.png` | 3840 × 2160 | Monitores 4K (recomendado para leitura) |
| `developer-cheat-sheet-2k.png` | 2560 × 1440 | Monitores 2K |
| `developer-cheat-sheet-fhd.png` | 1920 × 1080 | Monitores Full HD |

## Regerar

```powershell
node build.mjs
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu `
  --hide-scrollbars --force-device-scale-factor=2 --window-size=3840,2160 `
  --screenshot="developer-cheat-sheet-8k.png" `
  "file:///<caminho>/wallpaper/wallpaper.html"
```

## Estrutura do projeto

- `data.mjs` — todo o conteúdo (atalhos, comandos, descrições em pt-BR) + linhas de código do fundo.
- `build.mjs` — gera `wallpaper.html` (HTML/CSS/SVG autocontido, fonte embutida em base64).
- `wallpaper.html` — arte final renderizada pelo Chrome headless (3840 × 2160 lógicos → 7680 × 4320 @2x).
- `fonts/` — JetBrains Mono (fonte variável, 100–800).
- `icons/` — logos vetoriais (Simple Icons).

## Paleta

| Uso | Cor |
|---|---|
| Fundo | `#080D18` |
| Painéis | `#111827` |
| Bordas | `#1E293B` |
| Destaque | `#00D9FF` |
| Comandos | `#E2E8F0` |
| Teclas | `#263244` |
| Elementos especiais | `#22C55E` |

Acentos por painel: Windows `#00D9FF`, VS Code `#3B9EFF`, Git `#22C55E`, Browser `#A78BFA`.