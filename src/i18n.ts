export type Language = "en" | "it";
export let language: Language = "en";
try {
  if (localStorage.getItem("workspace-language") === "it") language = "it";
} catch {
  /* Storage is optional. */
}
export const t = (en: string, it: string) => (language === "en" ? en : it);
export function setLanguage(next: Language) {
  language = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem("workspace-language", next);
  } catch {
    /* Storage is optional. */
  }
}

export const englishStackLabels: Record<string, string> = {
  "API per modelli AI": "AI model APIs",
  "Configurazione di LLM locali": "Local LLM setup and configuration",
  "Inferenza locale": "Local inference",
  "Gestione di modelli e tokenizer": "Model and tokenizer management",
  "Parametri di contesto e generazione": "Context and generation settings",
  "Esecuzione su CPU / GPU": "CPU / GPU execution",
};

export const englishProjects: Record<
  string,
  { description: string; tags: string[]; name?: string }
> = {
  volleyhub: {
    description:
      "A platform for volleyball coaches, players and tournaments. It builds balanced teams, manages rosters and lineups, and helps organise brackets, matches and training sessions.",
    tags: ["Volleyball", "Team generator", "Web / Android"],
  },
  "space-bunny-aetheria": {
    description:
      "A floating island in a steampunk voxel world. The island itself is the navigation, with eight animated locations built with Three.js and React.",
    tags: ["Three.js", "React", "Interactive world"],
  },
  wollytcg: {
    description:
      "A showcase of graded Pokémon cards, with a catalogue, prices and individual card pages. Enquiries on the public site go through Instagram. A new local version also includes Next.js, PostgreSQL and animated CSS 3D cards.",
    tags: ["React / Next.js", "Firebase / PostgreSQL", "CSS 3D"],
  },
  somi: {
    description:
      "An Android application for military first responder training. It simulates clinical and operational scenarios, with timers, outcome assessment and debriefing.",
    tags: ["Kotlin", "Training"],
  },
  "overlay-video": {
    description:
      "An Android project for presenting volleyball matches, developed in Kotlin.",
    tags: ["Kotlin", "Android", "Volleyball"],
  },
  pointsvolleyhub: {
    description:
      "A Wear OS app for keeping volleyball match scores, with Firebase integration and match management tools.",
    tags: ["Wear OS", "Firebase", "Volleyball"],
  },
  sitohelix: {
    description:
      "A portfolio for a surveying practice. An interactive double helix gallery presents architectural projects, drone surveys, cadastral work and professional services.",
    tags: ["Three.js", "3D gallery", "Portfolio"],
  },
  karaoke: {
    description:
      "A karaoke web app with YouTube integration, song lyrics and 3D particle and wave visualisations made with Three.js.",
    tags: ["Three.js", "YouTube", "Web Audio"],
  },
  "floating-island": {
    description:
      "A three dimensional web experiment on a floating island, with buildings and 3D models to explore.",
    tags: ["Three.js", "3D world", "Web"],
  },
  remotegpu: {
    description:
      "Lets one computer use another machine’s graphics card to run calculations and generate images. The remote computer processes the work and sends the results back to the machine that requested them.",
    tags: ["Remote computing", "Images", "Network"],
  },
  "piano-finanziario": {
    description:
      "A personal finance dashboard with budgets, recurring investments, charts and forecasts. Built with React, TypeScript and Firebase.",
    tags: ["React", "Firebase", "Dashboard"],
  },
  "coach-ai-lab": {
    description:
      "A lab for teaching the VolleyHub assistant to understand commands in Italian and English. Training starts with sample requests, checks responses to new messages, and provides a chat for trying player, role, statistics and substitution management.",
    tags: ["AI training", "Natural commands", "Volleyball"],
  },
  "pip-boy-data-manager": {
    description:
      "An Android manager for credentials, notes and custom fields, with a Pip-Boy inspired interface. Built with Jetpack Compose and Firebase, it includes categories, favourites, PIN access and biometric checks.",
    tags: ["Jetpack Compose", "Firebase", "Android"],
  },
  "cozy-terminal-portfolio": {
    name: "This workspace",
    description:
      "The portfolio you are exploring: a photograph, a Three.js camera and an HTML terminal, with a transition from the desk to the Project Explorer.",
    tags: ["Three.js", "GSAP", "TypeScript"],
  },
  "automazione-profili": {
    description:
      "Reads a list of items to configure and repeats the profiling steps in an application. A console shows progress, reducing the need to fill in and select every item by hand.",
    tags: ["Configuration", "Repetitive tasks"],
  },
  "archiviazione-documenti": {
    description:
      "Retrieves documents from a list and organises them into folders. It helps repeat export operations and keep the collected material in order.",
    tags: ["Export", "Archive"],
  },
  "dashboard-operativa": {
    description:
      "Brings activity counts and trends into one dashboard. It lets users review summaries and see how operations change throughout the day.",
    tags: ["Summaries", "Monitoring"],
  },
  "ricerca-archivi-dati": {
    description:
      "Helps explore a data archive, list its structures and search for a value in exported content. It brings together tools for finding information spread across different sources.",
    tags: ["Search", "Consultation"],
  },
  "scambio-messaggi": {
    description:
      "Receives messages from other applications, reads their content and returns an acknowledgement. It also includes tools for sending messages and checking communication between systems.",
    tags: ["Communication", "Integration"],
  },
  "portale-intranet": {
    description:
      "Brings applications, documents, forms and work tools into one portal. Users can find resources by category and access the features available to their role.",
    tags: ["Resources", "Organisation", "Access"],
  },
  "file-in-rete": {
    description:
      "Checks whether computers and shared folders are available. Users can browse their content, download files and review check results from a single interface.",
    tags: ["Shared folders", "Availability", "Downloads"],
  },
  "automazione-stampe": {
    description:
      "Repeats search, selection and printing steps in an application. A small interface lets users set up the job and start the repetitive operations.",
    tags: ["Printing", "Repetitive tasks"],
  },
  "misurazione-attivita": {
    description:
      "Runs sequences of operations, measures how long they take and collects the results. Users can compare activities and review the measurements in a spreadsheet.",
    tags: ["Timing", "Comparison", "Summaries"],
  },
  "compilazione-moduli": {
    description:
      "Retrieves information from a connected service and fills in the corresponding form fields. It reduces manual entry and connects available data to the document being completed.",
    tags: ["Forms", "Data entry", "Integration"],
  },
  "servizi-consultazione": {
    description:
      "Provides applications with a way to request the information they need. It combines data lookup and access checks so other tools can obtain the necessary responses.",
    tags: ["Consultation", "Access", "Integration"],
  },
  "sincronizzazione-richieste": {
    description:
      "Checks pending requests, retrieves information from a connected service and updates the corresponding data. A record of outcomes helps track progress.",
    tags: ["Synchronisation", "Requests", "Progress"],
  },
  "recupero-documenti": {
    description:
      "Requests a document from a service and saves the returned file. It simplifies retrieving materials that need to be read or archived.",
    tags: ["Documents", "Downloads"],
  },
  "convertitore-xml-csv": {
    description:
      "Opens a file, displays its content in a table and exports it in another format. Users can turn structured documents into tabular data and reconstruct the original document.",
    tags: ["Conversion", "Tables", "Export"],
  },
  "archivio-web": {
    description:
      "Presents folders and documents in organised web pages. It offers a place to browse resources and find the available materials.",
    tags: ["Folders", "Consultation"],
  },
  "gestione-segnalazioni": {
    description:
      "Lets users submit reports with attachments and follow their status. The team handling them can review requests, update them and organise the work from their own access area.",
    tags: ["Requests", "Attachments", "Progress"],
  },
  "convertitore-excel-xml": {
    description:
      "Loads a spreadsheet, shows its data in editable tables and generates structured documents to download. Users can check and correct the content before exporting it.",
    tags: ["Spreadsheets", "Editing", "Export"],
  },
  "stampa-etichette": {
    description:
      "Converts documents and labels into the formats needed for printing. Users can preview the result and send it to a printer, including through a command from another computer.",
    tags: ["Labels", "Preview", "Printing"],
  },
  "trascrizione-vocale": {
    description:
      "Receives an audio recording and returns the spoken text. It makes transcription available to tools that need to turn speech into written content.",
    tags: ["Audio", "Text", "Transcription"],
  },
};
