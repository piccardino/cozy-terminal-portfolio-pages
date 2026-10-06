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

Le immagini fornite sono ottimizzate in WebP: panoramica per tutti i rapporti da 16:9 a 32:9, inclusi quelli intermedi (scala proporzionale e ritaglio centrale dinamici), verticale per 9:16. Gli altri desktop conservano la fotografia originale. Monitor, foto LinkedIn e tazza/CV seguono le coordinate della fotografia anche al ridimensionamento. I nuovi formati usano la transizione CSS; il desktop standard conserva Three.js.

Le calibrazioni sono in `src/sceneConfig.ts`; nome, contatti e progetti in `src/portfolio.ts` e `src/workProjects.ts`; traduzioni in `src/i18n.ts` e competenze in `src/stack.json`.

Clic o Invio avvicinano il monitor e mantengono visibile la sua schermata; un secondo clic o Invio aprono il terminale. Escape torna alla scrivania. La foto delle montagne apre LinkedIn e la tazza apre il CV. Sono disponibili EN/IT, schermo intero e audio del camino.
