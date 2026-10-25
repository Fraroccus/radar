/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Database, 
  Key, 
  Server, 
  ExternalLink, 
  RefreshCw,
  Info
} from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineMode: 'gemini-live' | 'verified-archive';
  hasApiKey?: boolean;
  keyPreview?: string | null;
  quotaNotice?: string | null;
  onTestConnection: () => Promise<void>;
  isTesting: boolean;
  testResult: {
    status: 'idle' | 'success' | 'warning' | 'error';
    message: string;
    latencyMs?: number;
  } | null;
}

export function DiagnosticsModal({
  isOpen,
  onClose,
  engineMode,
  hasApiKey,
  keyPreview,
  quotaNotice,
  onTestConnection,
  isTesting,
  testResult
}: DiagnosticsModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'guide'>('status');

  if (!isOpen) return null;

  const isLive = engineMode === 'gemini-live';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 sm:p-8 z-10 border border-slate-200"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Chiudi"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isLive ? <Sparkles size={24} /> : <Database size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                Stato Motore AI & Osservatorio
              </h2>
              <p className="text-xs text-slate-500">
                Informazioni sull'origine dei dati, funzionamento dell'API e configurazione
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab('status')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'status'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              📊 Diagnostica Attuale
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'guide'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              ⚙️ Come Attivare la Chiave su Vercel
            </button>
          </div>

          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Current status card */}
              <div className={`p-4 rounded-2xl border ${
                isLive 
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-extrabold text-base">
                      {isLive ? 'Ricerca Web Live Gemini Attiva' : 'Archivio Verificato Attivo (Modalità Resiliente)'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isLive ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                  }`}>
                    {isLive ? 'Google Grounding' : '25+ Tool Curati'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {isLive 
                    ? 'Le ricerche interrogano i modelli Google Gemini con accesso in tempo reale al web tramite Google Search Grounding per estrarre gli ultimi annunci e pubblicazioni.'
                    : 'Il radar è alimentato dall\'Osservatorio Verificato: una banca dati curata e aggiornata con oltre 25 modelli di frontiera e tool (es. Gemini 4 Argon, architetture Jevs, Claude 3.7, OpenAI Canvas, DeepSeek-V3). Garantisce che il sito risponda istantaneamente senza interruzioni di servizio.'}
                </p>
              </div>

              {/* Server & API details list */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 divide-y divide-slate-200/70 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Server size={14} className="text-slate-400" /> Server Backend:
                  </span>
                  <span className="font-semibold text-slate-800">
                    Vercel Serverless / Express API (/api/radar)
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Key size={14} className="text-slate-400" /> Chiave GEMINI_API_KEY:
                  </span>
                  <span className={`font-semibold inline-flex items-center gap-1 ${
                    hasApiKey ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {hasApiKey ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {hasApiKey ? (keyPreview ? `Configurata (${keyPreview})` : 'Presente nell\'ambiente server') : 'Non configurata (Usa Archivio Verificato)'}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Database size={14} className="text-slate-400" /> Motore AI:
                  </span>
                  <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Google Gemini Flash + Search Grounding
                  </span>
                </div>

                {quotaNotice && (
                  <div className="py-2.5 text-amber-800 bg-amber-50/50 -mx-4 px-4 border-t border-amber-200/50">
                    <p className="font-semibold flex items-center gap-1.5 text-[11px]">
                      <Info size={13} className="text-amber-600 shrink-0" />
                      Nota Sistema: {quotaNotice}
                    </p>
                  </div>
                )}
              </div>

              {/* Test connection action */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Verifica Connessione Live</h4>
                    <p className="text-[11px] text-slate-500">Invia una richiesta di ping al backend per testare la risposta delle API</p>
                  </div>
                  <button
                    onClick={onTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                  >
                    <RefreshCw size={13} className={isTesting ? "animate-spin" : ""} />
                    {isTesting ? "Test in corso..." : "Testa Ora"}
                  </button>
                </div>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResult.status === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : testResult.status === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {testResult.status === 'success' ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.latencyMs && (
                        <p className="text-[10px] opacity-75 mt-0.5">Latenza risposta: {testResult.latencyMs} ms</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-600">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-blue-900 leading-relaxed">
                <p className="font-bold text-sm mb-1">Perché su Vercel serve la chiave?</p>
                Quando fai il deploy del radar sul tuo sottodominio <strong>radar.roccoformazione.it</strong> con Vercel, il codice viene eseguito sui server cloud di Vercel. Vercel non ha accesso alle chiavi di AI Studio finché non le inserisci nelle sue impostazioni.
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm">Genera la chiave su Google AI Studio</strong>
                    <p className="mt-0.5">Accedi a <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline inline-flex items-center gap-0.5">aistudio.google.com/apikey <ExternalLink size={10} /></a> e clicca su <em>"Create API key"</em>.</p>
                    <div className="mt-1.5 p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-700 leading-normal border border-slate-200">
                      💡 <strong>Formato chiave:</strong> Le nuove chiavi ufficiali generate da Google AI Studio iniziano con <code className="bg-white px-1.5 py-0.5 rounded font-mono text-blue-700 font-bold">AQ.</code> (es. <code className="bg-white px-1.5 py-0.5 rounded font-mono">AQ.Ab8RN...</code>) oppure con <code className="bg-white px-1.5 py-0.5 rounded font-mono">AIza...</code>. Entrambi i formati sono al 100% validi e supportati!
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm">Inseriscila nelle Environment Variables di Vercel</strong>
                    <p className="mt-0.5">Vai su <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline inline-flex items-center gap-0.5">vercel.com <ExternalLink size={10} /></a>, apri il progetto del radar, clicca su <strong>Settings</strong> e poi nel menu laterale su <strong>Environment Variables</strong>.</p>
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] mt-2 space-y-1">
                      <div>Key: <span className="text-emerald-400 font-bold">GEMINI_API_KEY</span></div>
                      <div>Value: <span className="text-slate-400 font-normal">AQ.Ab8RN6LCdSTx...</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm">FONDAMENTALE: Esegui il "Redeploy" su Vercel</strong>
                    <p className="mt-0.5 text-slate-600">
                      Vercel <strong>non</strong> applica le nuove variabili al deployment già attivo: devi rigenerare la build per attivarla.
                    </p>
                    <div className="mt-1.5 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                      Vai nella scheda <strong>Deployments</strong> di Vercel &rarr; clicca sui tre puntini <strong>(...)</strong> accanto all'ultimo deployment &rarr; clicca <strong>"Redeploy"</strong>. Bastano 20 secondi e il tuo radar su <em>radar.roccoformazione.it</em> passerà in modalità <strong>Live Gemini AI</strong>!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
