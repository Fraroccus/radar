# AI Radar per Formatori | Francesco Rocco Formazione

Osservatorio e radar in tempo reale su strumenti, modelli di intelligenza artificiale di frontiera, casi d'uso ed esercizi pratici per la Didattica, l'Ufficio e le PMI.

Collegamento al sito principale: [roccoformazione.it](https://www.roccoformazione.it/)

---

## ⚡ Guida Rapida al Deploy su Vercel con Sottodominio (Consigliata)

Questa configurazione ti permette di avere **`radar.roccoformazione.it`** attivo senza spendere 1 euro per un nuovo dominio, sfruttando il dominio che possiedi già.

### Passo 1: Carica il Progetto su GitHub
1. Crea una nuova repository (pubblica o privata) su GitHub (es. `ai-radar-formatori`).
2. Carica i file di questa cartella nella repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - AI Radar per Formatori"
   git branch -M main
   git remote add origin https://github.com/tuo-username/ai-radar-formatori.git
   git push -u origin main
   ```

### Passo 2: Importa il Progetto su Vercel
1. Vai su [vercel.com](https://vercel.com) ed esegui l'accesso.
2. Clicca su **"Add New..."** > **"Project"**.
3. Seleziona la repository GitHub appena creata e clicca su **"Import"**.
4. Vercel rileverà automaticamente il framework **Vite** grazie al file `vercel.json` già presente nel progetto:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Nella sezione **"Environment Variables"**, aggiungi:
   - **`GEMINI_API_KEY`**: La tua chiave API di Google Gemini (ottenibile gratuitamente su [Google AI Studio](https://aistudio.google.com/)).
   - *(Opzionale)* **`GROQ_API_KEY`**: Se desideri abilitare anche l'assistente basato su Llama 3.
6. Clicca su **"Deploy"**.

### Passo 3: Collega il Sottodominio Gratuito (`radar.roccoformazione.it`)
1. Una volta completato il deploy su Vercel, vai nella scheda del progetto su **Settings** > **Domains**.
2. Digita: `radar.roccoformazione.it` e clicca su **Add**.
3. Vercel ti mostrerà il record DNS da inserire nel gestore del tuo dominio (dove hai acquistato `roccoformazione.it`, ad es. Aruba, Register.it, Cloudflare, Siteground, Namecheap, ecc.):
   - **Tipo record**: `CNAME`
   - **Nome / Host**: `radar`
   - **Valore / Destinazione**: `cname.vercel-dns.com`
   - **TTL**: Automatico o 3600
4. Nel giro di pochi minuti (tempo di propagazione DNS), Vercel genererà automaticamente e gratuitamente il certificato **SSL HTTPS**.

### Passo 4: Aggiungi il Pulsante sul tuo Sito Principale (`roccoformazione.it`)
Nel tuo sito principale (nella sezione Progetti o nel menu), inserisci il pulsante che apre l'AI Radar in una nuova scheda:

```html
<a 
  href="https://radar.roccoformazione.it" 
  target="_blank" 
  rel="noopener noreferrer"
  class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition duration-200"
>
  <span>Esplora AI Radar</span>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
  </svg>
</a>
```

> **Design Coordinato:** L'AI Radar ha già integrata in alto la barra coordinata *"AI Radar Lab | Progetto didattico a cura di Francesco Rocco Formazione"* con il tasto di ritorno rapido verso `roccoformazione.it`, offrendo un'esperienza utente impeccabile.

---

## 🛡️ Come Funziona l'Integrazione con le API Gemini & Google Search

1. **Ricerche Web in Tempo Reale**: L'endpoint backend `/api/radar` (funzione serverless su Vercel in `api/radar.ts`) interroga Gemini con Google Search Grounding attivo (`tools: [{ googleSearch: {} }]`).
2. **Cache Intelligente**: I risultati vengono memorizzati nella cache per 20 minuti per evitare chiamate ripetute, velocizzare l'apertura e non consumare inutilmente la quota API.
3. **Resilienza e Modalità Fallback Verificata**: Se l'API gratuita di Google raggiunge il rate limit (errore 429 / traffico elevato) o la chiave non è configurata, l'app **non si blocca mai**: attiva all'istante l'Osservatorio Verificato con oltre 25 modelli di frontiera e tool reali (Argon, Jevs, Claude 3.7, NotebookLM, Whisper Turbo, ecc.) e 8 esercizi didattici con prompt completi.

---

## 💻 Sviluppo Locale

1. Clona la repository:
   ```bash
   git clone https://github.com/tuo-username/ai-radar-formatori.git
   cd ai-radar-formatori
   ```
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Crea il file `.env` copiando il modello `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Inserisci la tua chiave `GEMINI_API_KEY`.
4. Avvia l'ambiente locale:
   ```bash
   npm run dev
   ```
   L'app sarà accessibile su `http://localhost:3000`.

---

## 🛠️ Script del Progetto

- `npm run dev`: Avvia il server di sviluppo integrato su porta 3000.
- `npm run build`: Compila il frontend React con Vite nella cartella `dist/`.
- `npm run lint`: Esegue il controllo dei tipi TypeScript senza generare errori.
- `npm run start`: Avvia il server Node/Express in produzione.
