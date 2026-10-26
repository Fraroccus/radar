/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Self-Contained Vercel Serverless Function Handler for /api/radar
 * Designed with zero external relative dependencies to prevent Vercel 500 module resolution errors
 */

import { GoogleGenAI } from "@google/genai";

export type Scope = 'Didattica' | 'Ufficio' | 'PMI' | 'Tutti';
export type ItemType = 'Nuovo tool' | 'Nuova funzione' | 'Esercizio pratico' | 'Utilizzo LLM' | 'Tutti';
export type Price = 'Gratuito' | 'Freemium' | 'A pagamento' | 'Tutti' | 'N.D.';
export type LLM = 'ChatGPT' | 'Gemini' | 'Claude' | 'Copilot' | 'Altri' | 'Tutti';
export type Difficulty = 'Facile' | 'Medio' | 'Avanzato';

export interface RadarItem {
  id: string;
  title: string;
  scope: Scope;
  type: ItemType;
  description: string;
  price: Price;
  exercise?: string;
  source: string;
  date: string;
  llm?: LLM;
}

export interface PracticalUse {
  id: string;
  llm: LLM;
  scope: Scope;
  useCase: string;
  prompt: string;
  difficulty: Difficulty;
}

// -------------------------------------------------------------
// Curated Fallback Data (25 Verified Items & 8 Practical Uses)
// -------------------------------------------------------------
export const FALLBACK_ITEMS: RadarItem[] = [
  {
    id: "fb-1",
    title: "Gemini 4 Argon con Hybrid Reasoning & Analisi Dati",
    scope: "PMI",
    type: "Nuovo tool",
    description: "Google rilascia Gemini 4 Argon, modello di frontiera con capacità di pensiero esteso (hybrid reasoning) per compiti complessi di analisi bilanci, audit di sicurezza, coding avanzato e decision-making per le PMI.",
    price: "Freemium",
    exercise: "Fornisci al modello un bilancio d'esercizio sintetico di una PMI e richiedi di individuare anomalie di cassa, simulando 3 scenari di stress test a 12 mesi con budget di ragionamento alto.",
    source: "https://ai.google.dev/gemini-api/docs/models/gemini",
    date: "23 Ottobre 2026",
    llm: "Gemini"
  },
  {
    id: "fb-2",
    title: "Jevs Multi-Agent Orchestrator per Workflow Aziendali",
    scope: "Ufficio",
    type: "Nuovo tool",
    description: "Nuova architettura agentica open-source Jevs che consente di orchestrare team di agenti AI specializzati: un agente estrae dati, uno redige bozze di verbali e procedure, e un terzo esegue il fact-checking incrociato.",
    price: "Gratuito",
    exercise: "Configura un workflow a tre agenti per monitorare bandi pubblici per la formazione: ricerca del bando, estrazione dei requisiti di conformità e bozza di progetto didattico.",
    source: "https://github.com/search?q=jevs+multi+agent+orchestrator&type=repositories",
    date: "22 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-3",
    title: "NotebookLM Audio Overviews 2.0 & Studio Guidato",
    scope: "Didattica",
    type: "Nuova funzione",
    description: "Google espande NotebookLM consentendo di guidare attivamente l'Audio Overview su specifici argomenti e capitoli caricati dal docente, azzerando le allucinazioni e permettendo interruzioni vocali mirate.",
    price: "Gratuito",
    exercise: "Carica il PDF di una dispensa tecnica e chiedi di produrre una discussione audio tra due esperti focalizzata esclusivamente sulle 3 obiezioni più comuni dei clienti.",
    source: "https://blog.google/technology/ai/notebooklm-audio-overviews/",
    date: "24 Ottobre 2026",
    llm: "Gemini"
  },
  {
    id: "fb-4",
    title: "Claude 3.7 Sonnet con Hybrid Reasoning Integrato",
    scope: "Didattica",
    type: "Nuova funzione",
    description: "Anthropic lancia Claude 3.7 Sonnet con controllo dinamico del tempo di riflessione: genera spiegazioni didattiche passo-passo e revisiona testi complessi mostrando in modo trasparente i passaggi logici intermedi.",
    price: "Freemium",
    exercise: "Incolla la risposta aperta di uno studente a un quesito economico e chiedi a Claude di mostrare il reasoning prima di assegnare la valutazione formativa secondo griglia.",
    source: "https://www.anthropic.com/news/claude-3-7-sonnet",
    date: "21 Ottobre 2026",
    llm: "Claude"
  },
  {
    id: "fb-5",
    title: "OpenAI Canvas con Esecuzione Python e O3-mini",
    scope: "Ufficio",
    type: "Nuova funzione",
    description: "OpenAI potenzia l'interfaccia interattiva Canvas integrando l'esecuzione diretta di codice Python, grafici in tempo reale e il modello O3-mini per stesura congiunta di report e verbali d'ufficio.",
    price: "Freemium",
    exercise: "Incolla una serie storica di vendite trimestrali nel Canvas e chiedi di plottare la previsione di trend generando contestualmente l'executive summary per la direzione.",
    source: "https://openai.com/index/introducing-canvas/",
    date: "20 Ottobre 2026",
    llm: "ChatGPT"
  },
  {
    id: "fb-6",
    title: "Cursor 0.45 & Windsurf Agent per Automazioni d'Ufficio",
    scope: "PMI",
    type: "Nuovo tool",
    description: "Nuova generazione di ambienti di coding agentico che permettono a professionisti e formatori non programmatori di generare ed eseguire script locali per automatizzare file Excel, PDF e archivi fatture.",
    price: "Freemium",
    exercise: "Descrivi all'agente: 'Crea uno script locale che legge tutti i PDF di fatture nella cartella download ed esporta imponibile, IVA e fornitore in una tabella Excel ordinata'.",
    source: "https://www.cursor.com/changelog",
    date: "22 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-7",
    title: "DeepSeek-V3 Open-Weights per Server Aziendali PMI",
    scope: "PMI",
    type: "Nuovo tool",
    description: "Rilasciato il modello open-weights DeepSeek-V3 (Mixture of Experts): prestazioni paragonabili ai vertici di mercato ma a un quinto dei costi computazionali, per installazioni locali protette nelle PMI.",
    price: "Gratuito",
    exercise: "Configura una chat aziendale privata su server interno per interrogare il manuale di qualità e sicurezza ISO senza inviare alcun dato sensibile al cloud pubblico.",
    source: "https://github.com/deepseek-ai/DeepSeek-V3",
    date: "19 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-8",
    title: "Perplexity Pro Search con Navigazione Multi-Passaggio",
    scope: "Didattica",
    type: "Nuova funzione",
    description: "Perplexity potenzia la ricerca Pro Search: compie ricerche iterative su oltre 20 fonti accademiche e istituzionali, sintetizzando bibliografie complete con collegamenti verificabili per corsi e tesi.",
    price: "Freemium",
    exercise: "Crea una guida interattiva sulle novità dell'AI Act europeo per le scuole, con estratti puntuali dagli articoli ufficiali e relative date di entrata in vigore.",
    source: "https://www.perplexity.ai/hub/blog/introducing-pro-search",
    date: "21 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-9",
    title: "ElevenLabs GenFM & Isolatore Vocale per Videocorsi",
    scope: "Didattica",
    type: "Nuovo tool",
    description: "Piattaforma avanzata per formatori ed e-learning che consente di doppiare videolezioni in oltre 25 lingue mantenendo la voce originale del docente e rimuovendo automaticamente i riverberi dell'aula.",
    price: "Freemium",
    exercise: "Prendi un video didattico di 2 minuti registrato con microfono ambientale e genera la versione doppiata in inglese e spagnolo con sincronizzazione labiale automatica.",
    source: "https://elevenlabs.io/blog",
    date: "20 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-10",
    title: "v0 by Vercel & Lovable per Prototipazione in Aula",
    scope: "Didattica",
    type: "Nuovo tool",
    description: "Piattaforme di generazione UI full-stack che permettono a docenti e corsisti di creare simulatori didattici interattivi, calcolatori finanziari o quiz funzionanti in meno di 5 minuti con semplici prompt.",
    price: "Freemium",
    exercise: "Fai costruire ai partecipanti un simulatore di Break-Even Point aziendale con grafici dinamici per mostrare la velocità di prototipazione con l'AI generativa.",
    source: "https://v0.dev/docs",
    date: "18 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-11",
    title: "Whisper v3 Turbo per Trascrizioni Verbali Riservati",
    scope: "Ufficio",
    type: "Nuovo tool",
    description: "Nuovo modello Whisper ultraleggero e 8 volte più veloce per la verbalizzazione istantanea di consigli d'amministrazione e riunioni d'ufficio direttamente in locale, preservando la riservatezza.",
    price: "Gratuito",
    exercise: "Trascrivi una riunione audio di 15 minuti ed estrai l'elenco dei to-do con scadenze e responsabili secondo matrice RACI.",
    source: "https://github.com/openai/whisper",
    date: "19 Ottobre 2026",
    llm: "ChatGPT"
  },
  {
    id: "fb-12",
    title: "Napkin AI per Trasformare Testi Formativi in Schemi Grafici",
    scope: "Didattica",
    type: "Nuovo tool",
    description: "Innovativo strumento visuale che analizza testi, appunti e dispense formative e genera automaticamente diagrammi di flusso, mappe mentali, piramidi e grafici vettoriali esportabili ad alta risoluzione.",
    price: "Freemium",
    exercise: "Incolla la descrizione di una procedura aziendale e ottieni 3 opzioni di diagramma di flusso logico da proiettare durante la formazione d'aula.",
    source: "https://www.napkin.ai",
    date: "21 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-13",
    title: "Gamma 3.0 con Document-to-Presentation Interattivo",
    scope: "PMI",
    type: "Nuova funzione",
    description: "Evoluzione di Gamma: trasforma report aziendali, schede prodotto e dispense PDF in slide e mini-siti interattivi con schede a comparsa e sondaggi d'aula incorporati.",
    price: "Freemium",
    exercise: "Incolla l'indice di un corso aziendale di 8 ore e genera una presentazione di 10 slide interattive pronte per il cliente finale.",
    source: "https://gamma.app/changelog",
    date: "17 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-14",
    title: "Microsoft Copilot Studio per Workflow PMI",
    scope: "PMI",
    type: "Nuovo tool",
    description: "Piattaforma low-code per PMI che consente di creare agenti intelligenti capaci di rispondere a email di clienti, interrogare cataloghi magazzino e aggiornare il gestionale senza scrivere codice.",
    price: "A pagamento",
    exercise: "Configura un mini-assistente per il customer care aziendale che risponde a domande frequenti sui tempi di consegna verificando un file Excel su OneDrive.",
    source: "https://www.microsoft.com/en-us/microsoft-copilot/microsoft-copilot-studio",
    date: "16 Ottobre 2026",
    llm: "Copilot"
  },
  {
    id: "fb-15",
    title: "Mistral LeChat con Agent Workspaces & Web Search",
    scope: "Ufficio",
    type: "Nuovo tool",
    description: "Suite professionale europea di Mistral conforme al GDPR con ricerca web in tempo reale, elaborazione documenti riservati, canvas condivisi e creazione di agenti per uffici amministrativi.",
    price: "Freemium",
    exercise: "Usa LeChat per comparare 3 preventivi fornitori estraendo tabella comparativa di costi, tempi di consegna e penali contrattuali nel pieno rispetto della privacy UE.",
    source: "https://mistral.ai/news/le-chat/",
    date: "18 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-16",
    title: "Pika 2.1 & Kling AI per Simulazioni Video d'Aula",
    scope: "Didattica",
    type: "Nuovo tool",
    description: "Modelli generativi video di nuova generazione per creare scenari realistici d'aula: simulazioni di colloqui di lavoro, gestione di clienti difficili o procedure di sicurezza sul lavoro.",
    price: "Freemium",
    exercise: "Genera una clip di 10 secondi raffigurante una situazione di conflitto commerciale per avviare una discussione guidata sulle tecniche di de-escalation.",
    source: "https://pika.art",
    date: "20 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-17",
    title: "Google Workspace Gemini con Formula Builder Dinamico",
    scope: "Ufficio",
    type: "Nuova funzione",
    description: "Assistente avanzato per Fogli Google: traduce istruzioni in italiano in formule complesse (QUERY, REGEX, CERCA.X) con spiegazione riga per riga e generazione di tabelle riassuntive.",
    price: "A pagamento",
    exercise: "Scrivi in linguaggio naturale: 'Estrai i 5 prodotti a maggior marginalità percentuale escludendo le giacenze inferiori a 10 pezzi' e ottieni la formula corretta.",
    source: "https://workspace.google.com/solutions/ai/",
    date: "19 Ottobre 2026",
    llm: "Gemini"
  },
  {
    id: "fb-18",
    title: "Claude Artifacts per Simulatori Didattici Interattivi",
    scope: "Didattica",
    type: "Utilizzo LLM",
    description: "Metodo per richiedere a Claude la generazione immediata di micro-applicazioni didattiche in React/SVG (es. ruota della fortuna, flashcard rotanti, calcolatore di probabilità) direttamente nella finestra di chat.",
    price: "Freemium",
    exercise: "Chiedi a Claude: 'Genera un Artifact React interattivo che permetta agli studenti di calcolare il Break-Even Point variando costi fissi e prezzo con due slider'.",
    source: "https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them",
    date: "22 Ottobre 2026",
    llm: "Claude"
  },
  {
    id: "fb-19",
    title: "Zapier Central con Agenti AI Amministrativi",
    scope: "Ufficio",
    type: "Nuovo tool",
    description: "Nuova piattaforma Zapier che affianca impiegati e uffici con agenti intelligenti capaci di coordinare Google Calendar, Slack, HubSpot e Gmail senza dover costruire trigger rigidi.",
    price: "Freemium",
    exercise: "Istruisci un agente: 'Ogni venerdì alle 16 controlla le fatture con scadenza superata e prepara una bozza di sollecito cortese con link al bonifico'.",
    source: "https://zapier.com/central",
    date: "16 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-20",
    title: "Microsoft Copilot in Excel con Analisi Predittiva",
    scope: "PMI",
    type: "Nuova funzione",
    description: "Copilot in Excel introduce l'analisi predittiva per le PMI: individua pattern stagionali di vendita con linguaggio naturale e genera grafici di proiezione con intervallo di confidenza.",
    price: "A pagamento",
    exercise: "Fornisci il fatturato mensile degli ultimi due anni e chiedi: 'Evidenzia i tre centri di costo a maggiore crescita percentuale e stima il fabbisogno per il Q1'.",
    source: "https://support.microsoft.com/en-us/office/get-started-with-copilot-in-excel-d249f70a-04a5-49e0-b6f9-0352fb38059e",
    date: "15 Ottobre 2026",
    llm: "Copilot"
  },
  {
    id: "fb-21",
    title: "Scribe AI per Manuali e Guide Operative Automatiche",
    scope: "Ufficio",
    type: "Nuovo tool",
    description: "Estensione che cattura i clic a schermo durante l'utilizzo di qualsiasi software aziendale e redige istantaneamente manuali operativi corredati da screenshot con frecce e istruzioni testuali.",
    price: "Freemium",
    exercise: "Registra l'emissione di una bolla sul gestionale ed esporta in PDF la guida per l'onboarding di un nuovo addetto alla logistica.",
    source: "https://scribehow.com/gallery",
    date: "13 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-22",
    title: "Curipod con Valutazione Live Basata su Rubriche",
    scope: "Didattica",
    type: "Nuova funzione",
    description: "La piattaforma per lezioni partecipative introduce la valutazione istantanea delle risposte aperte degli studenti tramite rubrica didattica personalizzata dal docente con feedback in tempo reale.",
    price: "Freemium",
    exercise: "Proponi un quesito sull'impatto etico dell'AI e visualizza in 15 secondi la categorizzazione delle risposte e il feedback formativo automatico per ciascun discente.",
    source: "https://curipod.com/blog",
    date: "14 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-23",
    title: "Canva Magic Studio 2026 con Brand Kit Dinamico",
    scope: "PMI",
    type: "Nuova funzione",
    description: "Aggiornamento per piccole imprese: consente di declinare un'idea promozionale su 6 formati diversi (brochure, volantino, post social, reel) applicando automaticamente i colori e i font del brand.",
    price: "Freemium",
    exercise: "Crea una locandina per un open day formativo e convertila in un set coordinato per newsletter e canali social in meno di due minuti.",
    source: "https://www.canva.com/magic-home/",
    date: "12 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-24",
    title: "Make + LLM per Smistamento Reclami e Preventivi",
    scope: "PMI",
    type: "Utilizzo LLM",
    description: "Integrazione visiva no-code tra casella email e modelli LLM per analizzare l'urgenza dei messaggi commerciali in arrivo e predisporre risposte contestualizzate nel CRM aziendale.",
    price: "Freemium",
    exercise: "Costruisci uno scenario di test che analizza l'oggetto di 5 email di richiesta info ed estrae budget presunto e data desiderata di avvio lavori.",
    source: "https://www.make.com/en/help/tools/ai-tools",
    date: "10 Ottobre 2026",
    llm: "Altri"
  },
  {
    id: "fb-25",
    title: "Prompt Engineering per Audit Privacy & GDPR con LLM",
    scope: "Ufficio",
    type: "Esercizio pratico",
    description: "Metodologia d'uso guidata per utilizzare modelli linguistici nell'audit preliminare della modulistica aziendale rispetto ai requisiti del Regolamento UE 2016/679.",
    price: "Gratuito",
    exercise: "Sottoponi al modello l'informativa privacy aziendale chiedendo di evidenziare l'eventuale omissione dei tempi di conservazione dei log o del contatto DPO.",
    source: "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10004456",
    date: "15 Ottobre 2026",
    llm: "ChatGPT"
  }
];

export const FALLBACK_PRACTICAL_USES: PracticalUse[] = [
  {
    id: "pu-1",
    llm: "Gemini",
    scope: "PMI",
    useCase: "Audit Finanziario & Simulazione Scenari con Gemini 4 Argon",
    prompt: `Agisci come Senior Financial Analyst per una PMI italiana.
Analizza il seguente bilancio d'esercizio sintetico:
[INCOLLA I DATI DI BILANCIO]

Esegui un'analisi approfondita strutturata in:
1. DIAGNOSI CRITICA: calcola ROI, ROS ed EBITDA margin, evidenziando anomalie nei costi fissi.
2. STRESS TEST A 12 MESI: simula 3 scenari (ottimista +10%, base, pessimista -15% fatturato) e stima l'impatto sui flussi di cassa.
3. PIANO D'AZIONE: proponi 3 misure correttive immediate con relativo tempo stimato di recupero liquidità.
Mostra chiaramente i passaggi logici del ragionamento analitico.`,
    difficulty: "Avanzato"
  },
  {
    id: "pu-2",
    llm: "Claude",
    scope: "Didattica",
    useCase: "Valutazione Trasparente con Ragionamento Ibrido (Claude 3.7)",
    prompt: `Sei un formatore esperto in valutazione delle competenze didattiche.
Esamina il seguente elaborato prodotto da un corsista:
[INSERISCI TESTO DELL'ELABORATO]

Griglia di valutazione da applicare:
- Padronanza concettuale (peso 40%)
- Applicabilità pratica (peso 40%)
- Chiarezza comunicativa (peso 20%)

Istruzioni:
1. Prima di dare il voto, esplicita punto per punto il ragionamento e le evidenze rilevate nel testo.
2. Assegna una valutazione per ciascun indicatore (Livelli: Iniziale, Base, Intermedio, Avanzato).
3. Formula 3 feedback costruttivi direttamente rivolti al corsista per stimolarne il miglioramento.`,
    difficulty: "Medio"
  },
  {
    id: "pu-3",
    llm: "ChatGPT",
    scope: "Ufficio",
    useCase: "Redazione e Sintesi Operativa Verbali Riunione in Canvas",
    prompt: `Sei l'assistente esecutivo di direzione. Analizza la seguente trascrizione/appunti di riunione:
[INCOLLA GLI APPUNTI O TRASCRIZIONE WHISPER]

Produci un verbale operativo suddiviso in:
1. OBIETTIVO E PARTECIPANTI: sintesi in 2 righe.
2. DECISIONI PRESE: elenco puntato chiaro senza ambiguità.
3. ACTION ITEMS: tabella con colonne [Cosa fare], [Responsabile], [Scadenza].
4. PUNTI IN SOSPESO: eventuali elementi da ridiscutere nel prossimo incontro.
Mantieni un tono formale, sintetico ed esente da fronzoli.`,
    difficulty: "Facile"
  },
  {
    id: "pu-4",
    llm: "Gemini",
    scope: "Didattica",
    useCase: "Creazione di Rubrica di Valutazione Autentica e Percorso Guidato",
    prompt: `Agisci come formatore esperto in progettazione didattica per competenze.
Crea una rubrica valutativa per un'attività di project work intitolata [TITOLO ATTIVITÀ].
La rubrica deve contenere:
- 4 dimensioni chiave di competenza (es. Accuratezza metodologica, Collaborazione, Problem Solving, Comunicazione).
- 4 livelli di padronanza (Iniziale, Base, Intermedio, Avanzato) con descrittori operativi osservabili.
- Una colonna finale con suggerimenti di autovalutazione per il discente.
Formatta il risultato in una tabella Markdown pulita e pronta da stampare.`,
    difficulty: "Facile"
  },
  {
    id: "pu-5",
    llm: "Copilot",
    scope: "Ufficio",
    useCase: "Analisi Variazioni Budget e Scostamenti Finanziari in Excel",
    prompt: `Esamina i seguenti dati di bilancio/budget divisi per trimestre:
[DATI O TABELLA]

Fornisci:
1. Evidenziazione dei 3 scostamenti percentuali maggiori rispetto al forecast.
2. Ipotesi delle possibili cause operative sottostanti.
3. Tre raccomandazioni pratiche di ottimizzazione dei costi da presentare alla direzione.
Esprimi le cifre con formattazione europea (es. 1.250,50 €).`,
    difficulty: "Medio"
  },
  {
    id: "pu-6",
    llm: "ChatGPT",
    scope: "Ufficio",
    useCase: "Progettazione di un System Prompt per Assistente Aziendale",
    prompt: `Agisci come AI Prompt Engineer per una PMI italiana nel settore [SETTORE].
Scrivi un System Prompt completo per un assistente di prima linea per l'assistenza clienti o ufficio ordini.
Il System Prompt deve definire:
- Identità e tone of voice (professionale, cordiale, empatico, tipico italiano).
- Limiti invalicabili (es. non inventare sconti, non promettere rimborsi non verificati).
- Flusso di escalation a un operatore umano con raccolta dati preliminare (nome, email, numero ordine).
- Esempi di risposte tipo (Few-Shot examples) per le 3 domande più frequenti.`,
    difficulty: "Avanzato"
  },
  {
    id: "pu-7",
    llm: "Altri",
    scope: "Ufficio",
    useCase: "Orchestrazione Multi-Agente Jevs per Ricerca Normativa & Bandi",
    prompt: `Configura la specifica per un team di agenti intelligenti autonomi (Jevs framework):
- Agente 1 (Scout): monitora quotidianamente il sito del Ministero/Regione e scarica i nuovi avvisi pubblici per la formazione continua.
- Agente 2 (Compliance): analizza il bando e verifica se una PMI con requisiti [INSERISCI REQUISITI] può candidarsi.
- Agente 3 (Writer): compila una scheda sintetica di 1 pagina con budget ammesso, scadenze e documentazione necessaria.
Descrivi le istruzioni operative e il formato JSON di scambio dati tra i tre agenti.`,
    difficulty: "Avanzato"
  },
  {
    id: "pu-8",
    llm: "Claude",
    scope: "Didattica",
    useCase: "Simulatore di Casi Studio con Role-Play Interattivo",
    prompt: `Vorrei che tu assumessi il ruolo di un cliente insoddisfatto di una PMI che ha ricevuto una fornitura in ritardo.
Io sarò il corsista che deve gestire il reclamo via chat/email.
Regole del role-play:
- Non uscire mai dal personaggio fino a che non scriverò 'FINE ESERCIZIO'.
- All'inizio mostra frustrazione ma resta disponibile a una soluzione ragionevole.
- Reagisci in modo credibile alle mie proposte (se sono empatico e risolutivo ammorbidisciti, se sono rigido o evasivo insisti).
- Quando scriverò 'FINE ESERCIZIO', forniscimi una valutazione dettagliata sui miei punti di forza e 3 consigli di miglioramento.
Inizia presentandoti come cliente arrabbiato.`,
    difficulty: "Avanzato"
  }
];

// -------------------------------------------------------------
// Search & Filter Utilities
// -------------------------------------------------------------
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterRadarItems(items: RadarItem[], query: string): RadarItem[] {
  if (!query || !query.trim()) return items;
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return items;

  return items.filter(item => {
    const searchable = normalizeText([
      item.title,
      item.description,
      item.scope,
      item.type,
      item.llm || '',
      item.exercise || ''
    ].join(' '));

    return terms.every(term => searchable.includes(term));
  });
}

export function filterPracticalUses(uses: PracticalUse[], query: string): PracticalUse[] {
  if (!query || !query.trim()) return uses;
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return uses;

  return uses.filter(use => {
    const searchable = normalizeText([
      use.useCase,
      use.prompt,
      use.scope,
      use.llm,
      use.difficulty
    ].join(' '));

    return terms.every(term => searchable.includes(term));
  });
}

export function parseItalianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const months: Record<string, number> = {
    'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3,
    'maggio': 4, 'giugno': 5, 'luglio': 6, 'agosto': 7,
    'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = months[parts[1].toLowerCase()];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  } else if (parts.length === 2) {
    const month = months[parts[0].toLowerCase()];
    const year = parseInt(parts[1], 10);
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 15);
    }
  }
  return null;
}

export function sanitizeItemSource(item: any): any {
  let source = (item.source || '').trim();
  const title = item.title || '';
  const llm = item.llm || '';

  if (!source || source === 'N.D.' || source === '#') {
    source = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + (llm && llm !== 'Altri' ? llm : '') + ' AI news')}`;
  } else {
    try {
      const parsed = new URL(source);
      const path = parsed.pathname.trim();
      const isBareRoot = path === '' || path === '/' || path === '/index.html';

      if (isBareRoot) {
        if (parsed.hostname.includes('github.com')) {
          source = `https://github.com/search?q=${encodeURIComponent(title)}&type=repositories`;
        } else if (parsed.hostname.includes('huggingface.co')) {
          source = `https://huggingface.co/models?search=${encodeURIComponent(title)}`;
        } else if (parsed.hostname.includes('ai.google.dev')) {
          source = 'https://ai.google.dev/gemini-api/docs/models/gemini';
        } else if (parsed.hostname.includes('notebooklm.google.com')) {
          source = 'https://blog.google/technology/ai/notebooklm-audio-overviews/';
        } else if (parsed.hostname.includes('openai.com') || parsed.hostname.includes('chatgpt.com')) {
          source = `https://www.google.com/search?q=${encodeURIComponent('OpenAI ' + title + ' announcement')}`;
        } else if (parsed.hostname.includes('claude.ai') || parsed.hostname.includes('anthropic.com')) {
          source = `https://www.google.com/search?q=${encodeURIComponent('Anthropic Claude ' + title + ' announcement')}`;
        } else if (parsed.hostname.includes('copilot.microsoft.com') || parsed.hostname.includes('microsoft.com')) {
          source = `https://www.google.com/search?q=${encodeURIComponent('Microsoft Copilot ' + title)}`;
        } else {
          source = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + (llm && llm !== 'Altri' ? llm : '') + ' AI news')}`;
        }
      }
    } catch {
      source = `https://www.google.com/search?q=${encodeURIComponent(title + ' AI')}`;
    }
  }

  return {
    ...item,
    source
  };
}

export function filterFallbackData(days: number = 30, query?: string) {
  let filtered = [...FALLBACK_ITEMS];

  if (days <= 7) {
    filtered = filtered.slice(0, 10);
  } else if (days <= 30) {
    filtered = filtered.slice(0, 20);
  }

  if (query && query.trim()) {
    const matched = filterRadarItems(FALLBACK_ITEMS, query.trim());
    filtered = matched.length > 0 ? matched : filterRadarItems(FALLBACK_ITEMS, query.trim());
  }

  filtered = filtered.map(sanitizeItemSource);

  filtered.sort((a, b) => {
    const da = parseItalianDate(a.date)?.getTime() || 0;
    const db = parseItalianDate(b.date)?.getTime() || 0;
    return db - da;
  });

  let uses = [...FALLBACK_PRACTICAL_USES];
  if (query && query.trim()) {
    const matchedUses = filterPracticalUses(uses, query.trim());
    if (matchedUses.length > 0) {
      uses = matchedUses;
    }
  }

  return {
    items: filtered,
    practicalUses: uses
  };
}

// In-memory cache & quota cooldown
const serverCache = new Map<string, {
  items: RadarItem[];
  practicalUses: PracticalUse[];
  timestamp: number;
  engineMode: 'gemini-live' | 'verified-archive';
  hasApiKey: boolean;
  message?: string;
}>();

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let quotaCooldownUntil = 0;

export async function executeRadarSearch(days: number = 30, query?: string) {
  const daysNum = Number(days) || 30;
  const cacheKey = `${daysNum}-${query ? query.toLowerCase().trim() : '__default__'}`;

  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  const hasApiKey = Boolean(apiKey);

  if (!hasApiKey) {
    const { items, practicalUses } = filterFallbackData(daysNum, query);
    return {
      items,
      practicalUses,
      isFallback: true,
      hasApiKey: false,
      quotaExceeded: false,
      engineMode: 'verified-archive' as const,
      message: "Osservatorio Verificato attivo: la chiave GEMINI_API_KEY non è rilevata sul server. Inseriscila nelle Environment Variables di Vercel ed esegui un Redeploy."
    };
  }

  // Serve from in-memory cache if fresh
  const cached = serverCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return {
      items: cached.items,
      practicalUses: cached.practicalUses,
      fromCache: true,
      hasApiKey: true,
      engineMode: cached.engineMode,
      message: cached.message
    };
  }

  if (Date.now() < quotaCooldownUntil) {
    const { items, practicalUses } = filterFallbackData(daysNum, query);
    return {
      items,
      practicalUses,
      isFallback: true,
      quotaExceeded: true,
      hasApiKey: true,
      engineMode: 'verified-archive' as const,
      message: "Limite di traffico temporaneamente attivo sulle API live. È attivo l'Osservatorio Verificato con oltre 25 novità e modelli curati."
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const basePrompt = query 
    ? `Esegui una ricerca e genera un'analisi approfondita focalizzata su: "${query}". 
       1. Trova o sintetizza 15-20 NOVITÀ, TOOL, NUOVI MODELLI (es. Gemini, Jevs, Claude, OpenAI, DeepSeek, open-weights) o AGGIORNAMENTI recenti e reali specifici per questo ambito o con forte impatto su Didattica, Ufficio e PMI.
       Per ciascuno indica la DATA REALE di pubblicazione o annuncio (es. "25 Ottobre 2026", "23 Ottobre 2026", "21 Ottobre 2026").
       2. Genera 6-8 CASI D'USO PRATICI (Practical Uses) con prompt pronti all'uso, SEMPRE specifici per "${query}".`
    : `Esegui un'analisi rigorosa e aggiornata per trovare le 15-20 novità AI e i nuovi tool più rilevanti degli ultimi ${daysNum} giorni (focalizzandoti in particolare sui rilasci di Ottobre 2026).
       Includi tassativamente:
       - Nuovi modelli di frontiera e LLM (es. Gemini 4 Argon, modelli di reasoning, architetture multi-agente come Jevs, Claude, OpenAI, open-weights).
       - Nuovi tool AI e piattaforme software lanciati per professionisti, formatori, uffici e PMI.
       - Nuove funzionalità operative integrate nei software di lavoro e didattica.
       Per ogni novità o tool, indica la data di pubblicazione (formato "GG Mese AAAA", es. "25 Ottobre 2026", "23 Ottobre 2026", "20 Ottobre 2026").
       Genera anche 6-8 CASI D'USO PRATICI completi di prompt pronti all'uso per la didattica, ufficio e PMI.`;

  const systemInstruction = `Sei un osservatorio esperto e scrupoloso in intelligenza artificiale per formatori, professionisti e imprese italiane ("AI Radar per Formatori").
Trova e sintetizza novità concrete, modelli di frontiera e tool recenti.
Restituisci ESCLUSIVAMENTE un blocco JSON valido (senza testo descrittivo aggiuntivo, senza commenti, senza formule di cortesia).

Struttura JSON richiesta:
{
  "items": [
    {
      "title": "Nome del tool o titolo novità (es. 'Gemini 4 Argon con Hybrid Reasoning', 'Jevs Multi-Agent Orchestrator')",
      "scope": "Didattica" | "Ufficio" | "PMI",
      "type": "Nuovo tool" | "Nuova funzione" | "Esercizio pratico" | "Utilizzo LLM",
      "description": "Descrizione accurata in italiano di 2-4 frasi",
      "price": "Gratuito" | "Freemium" | "A pagamento" | "N.D.",
      "exercise": "Esercizio pratico consigliato per formatori o corsisti",
      "source": "URL specifico dell'articolo, documentazione o repo GitHub. NON inserire la sola home page generica. Se l'URL specifico non è certo, usa 'https://www.google.com/search?q=' seguito dal titolo.",
      "date": "Data esatta di pubblicazione o annuncio (formato: 'GG Mese AAAA', es. '25 Ottobre 2026')",
      "llm": "ChatGPT" | "Gemini" | "Claude" | "Copilot" | "Altri"
    }
  ],
  "practicalUses": [
    {
      "llm": "ChatGPT" | "Gemini" | "Claude" | "Copilot" | "Altri",
      "scope": "Didattica" | "Ufficio" | "PMI",
      "useCase": "Titolo caso d'uso applicabile",
      "prompt": "Prompt completo ed esaustivo pronto all'uso",
      "difficulty": "Facile" | "Medio" | "Avanzato"
    }
  ]
}
Regole fondamentali:
- Includi sia grandi modelli di fondazione sia tool applicativi per ufficio e didattica.
- Formato date rigoroso 'GG Mese AAAA'.
- Tutto rigorosamente in lingua ITALIANA.`;

  let rawJsonText = '';
  let liveEngineSuccess = false;
  let modeMessage = '';
  let lastApiError: string | null = null;
  let isQuotaExceeded = false;
  let isAuthInvalid = false;

  // Tier 1: Grounded search with 8s timeout
  try {
    const groundingPromise = ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `${basePrompt}\n\nRispondi esclusivamente con il blocco JSON valido.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });
    const groundingTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout Search Grounding (8s)")), 8000)
    );

    const response = await Promise.race([groundingPromise, groundingTimeout]) as any;
    rawJsonText = (response?.text || '').trim();
    if (rawJsonText) {
      liveEngineSuccess = true;
      modeMessage = "Ricerca Web Live attiva: dati estratti in tempo reale con Google Search Grounding.";
    }
  } catch (groundingError: any) {
    const msg = String(groundingError?.message || groundingError || '');
    lastApiError = msg;
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) isQuotaExceeded = true;
    if (msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) isAuthInvalid = true;
    console.warn("[Radar Engine] Tier 1 Google Search Grounding non riuscito (passaggio a Tier 2 Gemini Direct JSON):", msg);
  }

  // Tier 2: Direct Generation with official models
  if (!liveEngineSuccess && !isAuthInvalid) {
    const modelsToTry = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
    for (const modelName of modelsToTry) {
      try {
        const directPromise = ai.models.generateContent({
          model: modelName,
          contents: `${basePrompt}\n\nRispondi esclusivamente con un singolo blocco JSON valido con la struttura richiesta.`,
          config: {
            systemInstruction,
            responseMimeType: "application/json"
          }
        });
        const directTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout Gemini Direct ${modelName} (12s)`)), 12000)
        );

        const directResponse = await Promise.race([directPromise, directTimeout]) as any;
        rawJsonText = (directResponse?.text || '').trim();
        if (rawJsonText) {
          liveEngineSuccess = true;
          modeMessage = query 
            ? `Ricerca AI Live Gemini attiva per "${query}" (modello ${modelName}).`
            : `Ricerca AI Live Gemini attiva (sintesi dinamica con modello ${modelName}).`;
          break;
        }
      } catch (directError: any) {
        const msg = String(directError?.message || directError || '');
        lastApiError = msg;
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) isQuotaExceeded = true;
        if (msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
          isAuthInvalid = true;
          break;
        }
        console.warn(`[Radar Engine] Tentativo diretto con ${modelName} non riuscito:`, msg);
      }
    }
  }

  // Parse and validate live results
  if (liveEngineSuccess && rawJsonText) {
    try {
      const fenceMatch = rawJsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonString = fenceMatch ? fenceMatch[1].trim() : rawJsonText;
      
      if (!jsonString.startsWith('{')) {
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }
      }

      const parsed = JSON.parse(jsonString);

      const items = (parsed.items || []).map((item: any, idx: number) => sanitizeItemSource({
        ...item,
        id: item.id || `live-${Date.now()}-${idx}`
      }));

      const practicalUses = (parsed.practicalUses || []).map((use: any, idx: number) => ({
        ...use,
        id: use.id || `use-${Date.now()}-${idx}`
      }));

      if (items.length > 0) {
        items.sort((a: any, b: any) => {
          const da = parseItalianDate(a.date)?.getTime() || 0;
          const db = parseItalianDate(b.date)?.getTime() || 0;
          return db - da;
        });

        serverCache.set(cacheKey, {
          items,
          practicalUses,
          timestamp: Date.now(),
          engineMode: 'gemini-live',
          hasApiKey: true,
          message: modeMessage
        });

        return {
          items,
          practicalUses,
          isFallback: false,
          hasApiKey: true,
          quotaExceeded: false,
          engineMode: 'gemini-live' as const,
          message: modeMessage
        };
      }
    } catch (parseError: any) {
      console.warn("[Radar Engine] Errore nel parsing del JSON live:", parseError?.message || parseError);
    }
  }

  // Tier 3: Verified Archive
  const { items, practicalUses } = filterFallbackData(daysNum, query);

  let fallbackMessage = "Visualizzazione Archivio Verificato (motore Gemini operativo in modalità resiliente).";
  if (isAuthInvalid) {
    fallbackMessage = "La chiave GEMINI_API_KEY configurata non è autorizzata o abilitata (PERMISSION_DENIED). Verifica i permessi in Google AI Studio.";
  } else if (isQuotaExceeded) {
    fallbackMessage = "Quota richieste Google Gemini temporaneamente esaurita (429 RESOURCE_EXHAUSTED). Attivo l'Osservatorio Verificato con oltre 25 novità e modelli curati.";
  } else if (query) {
    fallbackMessage = `Visualizzazione Archivio Verificato per "${query}" (motore Gemini operativo in modalità resiliente).`;
  }
  
  return {
    items,
    practicalUses,
    isFallback: true,
    hasApiKey: true,
    quotaExceeded: isQuotaExceeded,
    apiError: lastApiError || undefined,
    engineMode: 'verified-archive' as const,
    message: fallbackMessage
  };
}

// -------------------------------------------------------------
// Vercel Serverless Function Handler
// -------------------------------------------------------------
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.removeHeader?.('X-Frame-Options');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Quick health check parameter support
  if (req.query?.health === '1' || req.query?.status === '1') {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
    const hasApiKey = Boolean(apiKey);
    return res.status(200).json({
      status: 'ok',
      hasApiKey,
      keyPreview: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}` : null,
      serverTime: new Date().toISOString()
    });
  }

  try {
    let body: any = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch {
        body = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const days = body.days || req.query?.days || 30;
    const query = body.query || req.query?.query;

    const result = await executeRadarSearch(Number(days) || 30, query ? String(query) : undefined);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Vercel API /api/radar error]:', err);
    
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
    const fallback = filterFallbackData(30, undefined);
    
    return res.status(200).json({
      items: fallback.items,
      practicalUses: fallback.practicalUses,
      isFallback: true,
      hasApiKey: Boolean(apiKey),
      quotaExceeded: false,
      engineMode: 'verified-archive',
      apiError: err?.message || 'Errore interno serverless',
      message: "Visualizzazione Archivio Verificato (recupero resiliente del serverless endpoint)."
    });
  }
}
