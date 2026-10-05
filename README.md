# Cozy Terminal Portfolio

Progetto Codex: **Portffolio**. Clone: `C:/Coding/Portfolio/cozy-terminal-portfolio-pages`.

Questa repo contiene il codice sul ramo `main` e il sito compilato su `gh-pages`. La precedente repo sorgente viene conservata: i contenuti originali non erano identici.

## Avvio e pubblicazione

```sh
npm ci
npm run dev
npm run build
npm test
npm run deploy:pages
```

Richiede Node.js 22.12+ o 24+. La pubblicazione aggiorna `gh-pages` di questa stessa repository.

## Fotografie e contenuti

Le immagini fornite sono ottimizzate in WebP: panoramica per 32:9 e 21:9 (ritaglio centrale), verticale per 9:16. Gli altri desktop conservano la fotografia originale. Monitor, foto LinkedIn e tazza/CV seguono le coordinate della fotografia anche al ridimensionamento. I nuovi formati usano la transizione CSS; il desktop standard conserva Three.js.

Le calibrazioni sono in `src/sceneConfig.ts`; nome, contatti e progetti in `src/portfolio.ts` e `src/workProjects.ts`; traduzioni in `src/i18n.ts` e competenze in `src/stack.json`.

Il monitor apre il terminale, la foto delle montagne apre LinkedIn e la tazza apre il CV. Enter entra nel terminale; Escape torna alla scrivania. Sono disponibili EN/IT, schermo intero e audio del camino.
