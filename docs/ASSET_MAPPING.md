# Artwork mapping

The original files in `references/` are unchanged. Exact copies under `public/assets/` serve the app.

| Visual element | Source | Derived asset |
|---|---|---|
| Entire playable board, castle, flames, border, ladders, printed spaces | `references/board.webp` | none; rendered intact |
| Loki, Thor, Frexia card fronts | `references/hero-cards.webp` | `public/assets/derived/{loki,thor,frexia}.webp` |
| Four Dragon card fronts, printed penalty cards, and transparent flight silhouettes | `references/dragon-cards.webp` | `public/assets/derived/dragon-*.webp`, `penalty-*.webp`, `dragon-flight-*.png` |
| Printed rule wording | `references/rules.webp` | none |
| Overall composition reference | `references/complete-concept.webp` | none |

The derived cards are crops of their source images. Functional player markers and dice are CSS, with no substituted character illustration.
