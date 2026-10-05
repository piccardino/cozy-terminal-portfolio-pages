import stack from "./stack.json";
import { workProjects } from "./workProjects";

export interface Project {
  slug: string;
  name: string;
  language?: string;
  collection?: "work";
  description: string;
  tags: string[];
  visibility: "public" | "private";
  repositoryUrl?: string;
  siteUrl?: string;
  siteLabel?: string;
  featured?: boolean;
}

// Public repositories and local Coding / work projects reviewed on 2026-10-05.
// Exclude names containing "test"; deduplicate local copies by their Git remote.
// Private projects link only to public websites when available, never source repositories.
export const portfolio = {
  name: "Alex Morra",
  handle: "piccardino",
  role: "Developer · creative explorer",
  github: "https://github.com/piccardino",
  email: "alexmorra2002@gmail.com",
  phone: "+39 349 527 4599",
  phoneHref: "+393495274599",
  linkedin: "https://www.linkedin.com/in/alex-morra-02145a1a4/",
  bio: "Mi piace esplorare il punto in cui il codice incontra l’esperienza. Questo è il mio spazio: idee da provare, dettagli da curare e progetti che prendono forma.",
  stack,
  projects: [
    {
      slug: "volleyhub",
      name: "Volley Hub Pro",
      language: "HTML / JavaScript",
      visibility: "private",
      featured: true,
      description:
        "Una piattaforma per allenatori, giocatori e tornei di pallavolo. Genera squadre bilanciate, gestisce roster e formazioni e aiuta a organizzare tabelloni, partite e allenamenti.",
      tags: ["Pallavolo", "Team generator", "Web / Android"],
      siteUrl: "https://volleyhubpro.com/",
      siteLabel: "Apri Volley Hub Pro",
    },
    {
      slug: "space-bunny-aetheria",
      name: "Space Bunny Aetheria",
      language: "JavaScript",
      visibility: "public",
      featured: true,
      description:
        "Un’isola sospesa in stile steampunk voxel. L’isola stessa è la navigazione, con otto luoghi animati, Three.js e React.",
      tags: ["Three.js", "React", "Interactive world"],
      repositoryUrl: "https://github.com/piccardino/space-bunny-aetheria",
      siteUrl: "https://piccardino.github.io/space-bunny-aetheria/",
      siteLabel: "Apri la demo su Pages",
    },
    {
      slug: "wollytcg",
      name: "WollyTCG",
      language: "TypeScript",
      visibility: "private",
      featured: true,
      description:
        "Una vetrina di carte Pokémon graduate, con catalogo, prezzi e schede delle carte. Le trattative del sito pubblico passano da Instagram. Il progetto comprende anche una nuova versione locale con Next.js, PostgreSQL e carte animate in CSS 3D.",
      tags: ["React / Next.js", "Firebase / PostgreSQL", "CSS 3D"],
      siteUrl: "https://wollytcg-app.web.app/",
      siteLabel: "Visita WollyTCG",
    },
    {
      slug: "somi",
      name: "SOMI",
      language: "Kotlin",
      visibility: "public",
      description:
        "Applicazione Android per l’addestramento del Soccorritore Militare. Simula scenari clinico-operativi e comprende timer, valutazione degli esiti e debriefing.",
      tags: ["Kotlin", "Training"],
      repositoryUrl: "https://github.com/piccardino/SOMI",
    },
    {
      slug: "overlay-video",
      name: "VHP Match Presentation",
      language: "Kotlin",
      visibility: "public",
      description:
        "Un progetto Android dedicato alla presentazione delle partite di pallavolo, sviluppato in Kotlin.",
      tags: ["Kotlin", "Android", "Pallavolo"],
      repositoryUrl: "https://github.com/piccardino/Overlay_Video",
    },
    {
      slug: "pointsvolleyhub",
      name: "PointsVolleyHub",
      language: "Kotlin / HTML",
      visibility: "public",
      description:
        "Un’app Wear OS per seguire il punteggio delle partite di pallavolo, con integrazione Firebase e strumenti per la gestione della partita.",
      tags: ["Wear OS", "Firebase", "Pallavolo"],
      repositoryUrl: "https://github.com/piccardino/PointsVolleyHub",
    },
    {
      slug: "sitohelix",
      name: "Studio Helix",
      language: "JavaScript",
      visibility: "public",
      description:
        "Un sito portfolio per uno studio tecnico di geometra. Una galleria interattiva a doppia elica presenta progetti architettonici, rilievi con drone, pratiche catastali e servizi professionali.",
      tags: ["Three.js", "Galleria 3D", "Portfolio"],
      repositoryUrl: "https://github.com/piccardino/sitoHelix",
    },
    {
      slug: "karaoke",
      name: "Karaoke Night",
      language: "JavaScript",
      visibility: "public",
      description:
        "Una web app karaoke con integrazione YouTube, testi delle canzoni e visualizzazioni 3D di particelle e onde realizzate con Three.js.",
      tags: ["Three.js", "YouTube", "Web Audio"],
      repositoryUrl: "https://github.com/piccardino/Karaoke",
      siteUrl: "https://piccardino.github.io/Karaoke/",
      siteLabel: "Apri Karaoke su Pages",
    },
    {
      slug: "floating-island",
      name: "Floating Island",
      language: "JavaScript",
      visibility: "public",
      description:
        "Un esperimento web tridimensionale ambientato su un’isola sospesa, con edifici e modelli 3D da esplorare.",
      tags: ["Three.js", "3D world", "Web"],
      repositoryUrl: "https://github.com/piccardino/Floating-Island",
      siteUrl: "https://piccardino.github.io/Floating-Island/",
      siteLabel: "Esplora l’isola su Pages",
    },
    {
      slug: "remotegpu",
      name: "RemoteGPU",
      visibility: "private",
      description:
        "Permette a un computer di usare la scheda grafica di un’altra macchina per eseguire calcoli e generare immagini. Il lavoro viene elaborato sul computer remoto e i risultati tornano a quello da cui è stata inviata la richiesta.",
      tags: ["Calcolo remoto", "Immagini", "Rete"],
    },
    {
      slug: "piano-finanziario",
      name: "Piano Finanziario",
      language: "TypeScript",
      visibility: "private",
      description:
        "Una dashboard per la gestione delle finanze personali, con budget, investimenti periodici, grafici e previsioni. Realizzata con React, TypeScript e Firebase.",
      tags: ["React", "Firebase", "Dashboard"],
      siteUrl: "https://piano-finanziario-befa7.web.app/",
      siteLabel: "Apri Piano Finanziario",
    },
    {
      slug: "coach-ai-lab",
      name: "VolleyHub — Training AI",
      visibility: "private",
      description:
        "Un laboratorio per insegnare all’assistente di VolleyHub a comprendere comandi in italiano e inglese. I training partono da esempi di richieste, verificano le risposte su nuovi messaggi e permettono di provare in una chat la gestione di giocatori, ruoli, statistiche e cambi.",
      tags: ["Addestramento", "Comandi naturali", "Pallavolo"],
    },
    {
      slug: "pip-boy-data-manager",
      name: "Pip-Boy Data Manager",
      language: "Kotlin",
      visibility: "private",
      description:
        "Un gestore Android di credenziali, note e campi personalizzati con interfaccia ispirata al Pip-Boy. Realizzato con Jetpack Compose e Firebase, include categorie, preferiti, accesso con PIN e controlli biometrici.",
      tags: ["Jetpack Compose", "Firebase", "Android"],
    },
    {
      slug: "cozy-terminal-portfolio",
      name: "Questo workspace",
      language: "TypeScript",
      visibility: "private",
      description:
        "Il portfolio che stai esplorando: fotografia, camera Three.js e terminale HTML, con una transizione dalla scrivania al Project Explorer.",
      tags: ["Three.js", "GSAP", "TypeScript"],
      siteUrl: "./",
      siteLabel: "Riapri il workspace",
    },
    ...workProjects,
  ] satisfies Project[] as Project[],
};
