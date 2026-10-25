/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RadarItem, PracticalUse } from '../types.ts';

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
