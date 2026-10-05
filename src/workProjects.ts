import type { Project } from "./portfolio";

// Functional summaries only; no workplace code, configuration, data, or endpoints.
export const workProjects: Project[] = [
  {
    slug: "automazione-profili",
    name: "AutoMacro",
    visibility: "private",
    collection: "work",
    description:
      "Legge un elenco di elementi da configurare e ripete le operazioni di profilazione nell’applicativo. Una console mostra l’avanzamento, riducendo la necessità di compilare e selezionare ogni voce a mano.",
    tags: ["Configurazione", "Attività ripetitive"],
  },
  {
    slug: "archiviazione-documenti",
    name: "BACKUP_Ellipse",
    visibility: "private",
    collection: "work",
    description:
      "Automatizza il recupero di documenti a partire da un elenco e li organizza in cartelle. Aiuta a ripetere le operazioni di esportazione e a mantenere ordinati i materiali raccolti.",
    tags: ["Esportazione", "Archivio"],
  },
  {
    slug: "dashboard-operativa",
    name: "Dashboard",
    visibility: "private",
    collection: "work",
    description:
      "Riunisce conteggi e andamento delle attività in un cruscotto. Permette di consultare i riepiloghi e osservare come cambiano le operazioni nel corso della giornata.",
    tags: ["Riepiloghi", "Monitoraggio"],
  },
  {
    slug: "ricerca-archivi-dati",
    name: "DB search",
    visibility: "private",
    collection: "work",
    description:
      "Aiuta a esplorare un archivio di dati, elencarne le strutture e cercare un valore nei contenuti esportati. Riunisce gli strumenti di consultazione per orientarsi tra informazioni distribuite.",
    tags: ["Ricerca", "Consultazione"],
  },
  {
    slug: "scambio-messaggi",
    name: "HL7",
    visibility: "private",
    collection: "work",
    description:
      "Riceve messaggi da altri applicativi, ne legge il contenuto e restituisce una conferma di ricezione. Comprende anche strumenti per inviare messaggi e verificare lo scambio tra sistemi.",
    tags: ["Comunicazione", "Integrazione"],
  },
  {
    slug: "portale-intranet",
    name: "IntraEllipse",
    visibility: "private",
    collection: "work",
    description:
      "Riunisce applicativi, documenti, moduli e strumenti di lavoro in un unico portale. Gli utenti possono trovare le risorse per categoria e accedere alle funzioni disponibili per il proprio ruolo.",
    tags: ["Risorse", "Organizzazione", "Accessi"],
  },
  {
    slug: "file-in-rete",
    name: "LANaccessFilesGUI",
    visibility: "private",
    collection: "work",
    description:
      "Controlla la disponibilità dei computer e delle cartelle condivise. Permette di esplorare i contenuti, scaricare file e consultare gli esiti dei controlli da un’interfaccia unica.",
    tags: ["Cartelle condivise", "Disponibilità", "Download"],
  },
  {
    slug: "automazione-stampe",
    name: "Macro Novara",
    visibility: "private",
    collection: "work",
    description:
      "Ripete sequenze di ricerca, selezione e stampa nell’applicativo. Una piccola interfaccia permette di impostare il lavoro e avviare le operazioni ripetitive.",
    tags: ["Stampa", "Attività ripetitive"],
  },
  {
    slug: "misurazione-attivita",
    name: "MACRO timer 2.0",
    visibility: "private",
    collection: "work",
    description:
      "Esegue sequenze di operazioni, misura quanto tempo richiedono e raccoglie i risultati. Permette di confrontare le attività e consultare le misurazioni in un foglio di lavoro.",
    tags: ["Tempi", "Confronto", "Riepiloghi"],
  },
  {
    slug: "compilazione-moduli",
    name: "RAD ldo GPI",
    visibility: "private",
    collection: "work",
    description:
      "Recupera informazioni da un servizio collegato e le riporta nei campi di un modulo. Riduce gli inserimenti manuali e collega i dati disponibili al documento che si sta compilando.",
    tags: ["Moduli", "Compilazione", "Integrazione"],
  },
  {
    slug: "servizi-consultazione",
    name: "REST_service",
    visibility: "private",
    collection: "work",
    description:
      "Offre agli applicativi un punto di accesso alle informazioni richieste. Riunisce la consultazione dei dati e i controlli di accesso, così che altri strumenti possano ottenere le risposte necessarie.",
    tags: ["Consultazione", "Accessi", "Integrazione"],
  },
  {
    slug: "sincronizzazione-richieste",
    name: "SQL Rad PROD & C#",
    visibility: "private",
    collection: "work",
    description:
      "Controlla le richieste in attesa, recupera le informazioni da un servizio collegato e aggiorna i dati corrispondenti. Mantiene un resoconto degli esiti per seguire l’avanzamento delle operazioni.",
    tags: ["Sincronizzazione", "Richieste", "Avanzamento"],
  },
  {
    slug: "recupero-documenti",
    name: "Request",
    visibility: "private",
    collection: "work",
    description:
      "Richiede un documento a un servizio e salva il file ricevuto. Semplifica il recupero dei materiali che devono essere consultati o archiviati.",
    tags: ["Documenti", "Download"],
  },
  {
    slug: "convertitore-xml-csv",
    name: "Tool-XML-CSV",
    visibility: "private",
    collection: "work",
    description:
      "Apre un file, ne mostra i contenuti in una tabella e permette di esportarli in un altro formato. Consente di passare da documenti strutturati a dati tabellari e di ricostruire il documento di partenza.",
    tags: ["Conversione", "Tabelle", "Esportazione"],
  },
  {
    slug: "archivio-web",
    name: "WEBAPP Folders",
    visibility: "private",
    collection: "work",
    description:
      "Presenta cartelle e documenti in pagine web organizzate. Offre un punto di consultazione per navigare tra le risorse e trovare i materiali disponibili.",
    tags: ["Cartelle", "Consultazione"],
  },
  {
    slug: "gestione-segnalazioni",
    name: "WEBAPP segnalazioni - timer",
    visibility: "private",
    collection: "work",
    description:
      "Permette di inviare segnalazioni con allegati e seguirne lo stato. Chi le gestisce può consultare le richieste, aggiornarle e organizzare il lavoro dalla propria area di accesso.",
    tags: ["Richieste", "Allegati", "Stato di avanzamento"],
  },
  {
    slug: "convertitore-excel-xml",
    name: "XLS to XML",
    visibility: "private",
    collection: "work",
    description:
      "Carica un foglio di lavoro, mostra i dati in tabelle modificabili e genera documenti strutturati da scaricare. Aiuta a controllare e correggere i contenuti prima dell’esportazione.",
    tags: ["Fogli di lavoro", "Modifica", "Esportazione"],
  },
  {
    slug: "stampa-etichette",
    name: "ZPL",
    visibility: "private",
    collection: "work",
    description:
      "Converte documenti ed etichette nei formati necessari alla stampa. Permette di ottenere un’anteprima e inviare il risultato alla stampante, anche attraverso un comando da un altro computer.",
    tags: ["Etichette", "Anteprima", "Stampa"],
  },
  {
    slug: "trascrizione-vocale",
    name: "server_whisper.py",
    visibility: "private",
    collection: "work",
    description:
      "Riceve una registrazione audio e restituisce il testo pronunciato. Rende la trascrizione disponibile agli strumenti che devono trasformare il parlato in contenuti scritti.",
    tags: ["Audio", "Testo", "Trascrizione"],
  },
];
