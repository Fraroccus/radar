/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import { 
  RefreshCw, 
  Search, 
  ExternalLink, 
  BookOpen, 
  Briefcase, 
  Building2, 
  Zap, 
  Wrench, 
  FileCode, 
  MessageSquare,
  Tag,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ClipboardCopy,
  ChevronRight,
  Loader2,
  X,
  History,
  MessageCircle,
  Send,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchRadarData } from './services/radarService';
import { RadarItem, PracticalUse, SCOPES, TYPES, PRICES, LLMS, Scope, ItemType, Price, LLM } from './types';

const TIME_RANGES = [
  { label: 'Ultima settimana', value: 7 },
  { label: 'Ultimo mese', value: 30 },
  { label: 'Ultimi 3 mesi', value: 90 },
];

// Helper to extract a human-friendly domain and label for URLs
function getDomainLabel(urlStr?: string): string {
  if (!urlStr || urlStr === 'N.D.' || urlStr === '#') return 'N.D.';
  try {
    const u = new URL(urlStr);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'github.com') {
      if (u.pathname.includes('/search')) return 'GitHub (Cerca Repo)';
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) return `GitHub (${parts[0]}/${parts[1]})`;
      return 'GitHub Repo';
    }
    if (host.includes('google.com') && u.pathname.includes('/search')) {
      return 'Google Notizie';
    }
    if (host === 'ai.google.dev') return 'Google AI Docs';
    if (host === 'anthropic.com' || host === 'docs.anthropic.com') return 'Anthropic Docs';
    if (host === 'openai.com') return 'OpenAI News';
    if (host === 'huggingface.co') return 'Hugging Face';
    if (host === 'blog.google') return 'Google Blog';
    return host;
  } catch {
    return 'Fonte';
  }
}

// Client-side sanitizer to guarantee no generic root URLs slip through
function sanitizeClientSource(source: string | undefined, title: string, llm?: string): string {
  if (!source || source === 'N.D.' || source === '#') {
    return `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + (llm && llm !== 'Altri' ? llm : '') + ' AI news')}`;
  }
  try {
    const parsed = new URL(source);
    const path = parsed.pathname.trim();
    const isBareRoot = path === '' || path === '/' || path === '/index.html';

    if (isBareRoot) {
      if (parsed.hostname.includes('github.com')) {
        return `https://github.com/search?q=${encodeURIComponent(title)}&type=repositories`;
      }
      if (parsed.hostname.includes('huggingface.co')) {
        return `https://huggingface.co/models?search=${encodeURIComponent(title)}`;
      }
      if (parsed.hostname.includes('ai.google.dev')) {
        return 'https://ai.google.dev/gemini-api/docs/models/gemini';
      }
      if (parsed.hostname.includes('notebooklm.google.com')) {
        return 'https://blog.google/technology/ai/notebooklm-audio-overviews/';
      }
      if (parsed.hostname.includes('openai.com') || parsed.hostname.includes('chatgpt.com')) {
        return `https://www.google.com/search?q=${encodeURIComponent('OpenAI ' + title + ' announcement')}`;
      }
      if (parsed.hostname.includes('claude.ai') || parsed.hostname.includes('anthropic.com')) {
        return `https://www.google.com/search?q=${encodeURIComponent('Anthropic Claude ' + title + ' announcement')}`;
      }
      if (parsed.hostname.includes('copilot.microsoft.com') || parsed.hostname.includes('microsoft.com')) {
        return `https://www.google.com/search?q=${encodeURIComponent('Microsoft Copilot ' + title)}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + (llm && llm !== 'Altri' ? llm : '') + ' AI news')}`;
    }
    return source;
  } catch {
    return `https://www.google.com/search?q=${encodeURIComponent(title + ' AI')}`;
  }
}

export default function App() {
  const [items, setItems] = useState<RadarItem[]>([]);
  const [practicalUses, setPracticalUses] = useState<PracticalUse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RadarItem | null>(null);
  const [selectedUse, setSelectedUse] = useState<PracticalUse | null>(null);
  const [activeTab, setActiveTab] = useState<'radar' | 'search'>('radar');
  const [searchInput, setSearchInput] = useState('');
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Filters state
  const [filterScope, setFilterScope] = useState<Scope>('Tutti');
  const [filterType, setFilterType] = useState<ItemType>('Tutti');
  const [filterPrice, setFilterPrice] = useState<Price>('Tutti');
  const [filterLLM, setFilterLLM] = useState<LLM>('Tutti');
  const [timeRange, setTimeRange] = useState(30);

  // Detect if running inside an iframe or embedded mode (e.g. ?embed=true)
  const isEmbedded = useMemo(() => {
    try {
      return (
        window.self !== window.top ||
        new URLSearchParams(window.location.search).get('embed') === 'true'
      );
    } catch {
      return false;
    }
  }, []);

  const loadData = useCallback(async (days: number = timeRange, forceRefresh: boolean = false, query?: string) => {
    // Purge legacy cache formats
    try {
      localStorage.removeItem('radar_cache');
      localStorage.removeItem('radar_cache_v2');
      localStorage.removeItem('radar_cache_v3');
      for (const d of [7, 30, 90]) {
        localStorage.removeItem(`radar_cache_v3_${d}`);
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    const cacheKey = `radar_cache_v4_${days}`;

    // Check Cache (only for general radar when forceRefresh is not requested)
    if (!forceRefresh && !query) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          const twoHours = 2 * 60 * 60 * 1000;
          const hasOutdatedGenericDates = data?.items?.some((it: any) => it.date === "Aggiornato di recente");
          
          if (age < twoHours && data?.items?.length && !hasOutdatedGenericDates) {
            const cleanedCachedItems = (data.items || []).map((it: any) => ({
              ...it,
              source: sanitizeClientSource(it.source, it.title, it.llm)
            }));
            setItems(cleanedCachedItems);
            setPracticalUses(data.practicalUses || []);
            setLoading(false);
            setActiveTab('radar');
            if (data.quotaExceeded) {
              setQuotaNotice(data.message || "Quota ricerche in tempo reale momentaneamente esaurita: visualizzazione dell'osservatorio verificato.");
            } else {
              setQuotaNotice(null);
            }
            return;
          }
        }
      } catch (e) {
        // Fallthrough to fetch
      }
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRadarData(days, query);
      const cleanedItems = (data.items || []).map((it: any) => ({
        ...it,
        source: sanitizeClientSource(it.source, it.title, it.llm)
      }));
      setItems(cleanedItems);
      setPracticalUses(data.practicalUses || []);
      
      if (data.quotaExceeded) {
        setQuotaNotice(data.message || "Quota ricerche in tempo reale momentaneamente esaurita: visualizzazione dei dati verificati dell'osservatorio.");
      } else {
        setQuotaNotice(null);
      }

      if (!query) {
        // Save Cache per timeframe
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: { ...data, items: cleanedItems },
            timestamp: Date.now()
          }));
        } catch (e) {
          // LocalStorage quota may be full, ignore
        }
        setLastSearchQuery('');
      } else {
        setLastSearchQuery(query);
      }
    } catch (err) {
      if (items.length === 0) {
        setError("Impossibile completare la ricerca in questo momento. Riprova più tardi.");
      } else {
        setQuotaNotice("Connessione momentaneamente limitata: rimangono visualizzati i dati dell'archivio.");
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange, items.length]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveTab('search');
      loadData(timeRange, true, searchInput.trim());
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchScope = filterScope === 'Tutti' || item.scope === filterScope;
      const matchType = filterType === 'Tutti' || item.type === filterType;
      const matchPrice = filterPrice === 'Tutti' || item.price === filterPrice;
      const matchLLM = filterLLM === 'Tutti' || item.llm === filterLLM;
      return matchScope && matchType && matchPrice && matchLLM;
    });
  }, [items, filterScope, filterType, filterPrice, filterLLM]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback could be added here
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Assistant 
        items={items} 
        practicalUses={practicalUses} 
        lastSearchQuery={lastSearchQuery} 
      />
      {/* Top Brand Banner */}
      <div className="bg-slate-900 text-slate-300 px-6 py-2 text-xs flex flex-wrap justify-between items-center border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-100 tracking-wide uppercase text-[10px]">AI Radar Lab</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden sm:inline">Progetto didattico a cura di</span>
          <a 
            href="https://www.roccoformazione.it/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 decoration-blue-500/50 hover:decoration-blue-400 transition-colors"
          >
            Francesco Rocco Formazione
          </a>
        </div>
        <a 
          href="https://www.roccoformazione.it/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-medium transition-all text-xs border border-slate-700/60"
        >
          <span>← Torna al sito principale</span>
          <span className="text-[10px] text-slate-400">(roccoformazione.it)</span>
        </a>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="header-content">
          <h1 className="text-2xl font-extrabold text-[#2563eb] tracking-tight leading-none mb-1">AI Radar per Formatori</h1>
          <p className="text-[13px] text-slate-500">Novità ed esercizi aggiornati in tempo reale</p>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Cerca tool o ambito specifico (es: 'matematica', 'copywriting'...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
              <Search size={18} />
            </button>
          </form>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => {
              setActiveTab('radar');
              setSearchInput('');
              loadData(timeRange, true);
            }}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'radar' ? 'bg-[#2563eb] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {loading && activeTab === 'radar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Aggiorna Radar
          </button>
        </div>
      </header>

      {/* Quota / Archive Notice Banner */}
      {quotaNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Modalità Archivio Verificato:</strong> {quotaNotice}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => loadData(timeRange, true)}
              disabled={loading}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Riprova Live
            </button>
            <button 
              onClick={() => setQuotaNotice(null)}
              className="text-amber-600 hover:text-amber-800 p-1 cursor-pointer"
              title="Chiudi avviso"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 border-b border-slate-100 flex gap-8">
          <button 
            onClick={() => {
              setActiveTab('radar');
              loadData(timeRange, false);
            }}
            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'radar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            📡 Radar Generale
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            🔍 Ricerca Specifica
          </button>
        </div>
        
        <div className="px-8 py-3 flex gap-6 items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-bold text-slate-400">Ambito:</span>
            <div className="flex gap-1.5">
              {SCOPES.map(s => (
                <button 
                  key={s}
                  onClick={() => setFilterScope(s)}
                  className={`filter-pill-sleek ${filterScope === s ? 'active' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-bold text-slate-400">Tipo:</span>
            <div className="flex gap-1.5">
              {TYPES.map(t => {
                const count = t === 'Tutti' 
                  ? items.length 
                  : items.filter(i => i.type === t).length;
                return (
                  <button 
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`filter-pill-sleek ${filterType === t ? 'active' : ''}`}
                  >
                    {t} <span className="opacity-70 text-[10px] ml-0.5">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-bold text-slate-400">Modello:</span>
            <div className="flex gap-1.5">
              {LLMS.map(l => (
                <button 
                  key={l}
                  onClick={() => setFilterLLM(l)}
                  className={`filter-pill-sleek ${filterLLM === l ? 'active' : ''}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-bold text-slate-400">Prezzo:</span>
            <div className="flex gap-1.5">
              {PRICES.map(p => (
                <button 
                  key={p}
                  onClick={() => setFilterPrice(p)}
                  className={`filter-pill-sleek ${filterPrice === p ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] border-l border-slate-200 pl-6 ml-2">
            <History size={14} className="text-slate-400" />
            <span className="font-bold text-slate-400">Periodo:</span>
            <div className="flex gap-1.5">
              {TIME_RANGES.map(r => (
                <button 
                  key={r.value}
                  onClick={() => {
                    setTimeRange(r.value);
                    loadData(r.value, false, activeTab === 'search' ? searchInput : undefined);
                  }}
                  className={`filter-pill-sleek ${timeRange === r.value ? 'active' : ''}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    <main className="flex-1 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 p-8">
        {/* Main Content Area */}
        <div className="content-area">
          {lastSearchQuery && (
            <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Search size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Risultati della ricerca per:</p>
                  <p className="text-xl font-extrabold text-blue-900 leading-tight">"{lastSearchQuery}"</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setLastSearchQuery('');
                  setSearchInput('');
                  setActiveTab('radar');
                  loadData(timeRange, false);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-100 transition-all active:scale-95 flex items-center gap-2"
              >
                <X size={14} /> Torna al Radar
              </button>
            </div>
          )}
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            📌 Ultime Novità & Tool
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-12 rounded-2xl text-center border border-red-100">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">{error}</p>
              <button onClick={loadData} className="mt-4 text-red-700 font-bold underline">Riprova</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode='popLayout'>
                {filteredItems.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-200"
                  >
                    <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Nessun risultato trovato con i filtri attuali.</p>
                  </motion.div>
                ) : (
                  filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setSelectedItem(item)}
                      className="card-sleek p-4 flex flex-col justify-between cursor-pointer hover:border-blue-300 ring-primary/10 hover:ring-4 transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-[15px] font-bold text-slate-900 leading-tight inline">{item.title}</h3>
                            {item.source && item.source !== 'N.D.' && (
                              <span className="text-[10px] text-slate-400 font-medium ml-2 border-l border-slate-200 pl-2">
                                {(() => {
                                  try {
                                    return new URL(item.source).hostname.replace('www.', '');
                                  } catch (e) {
                                    return '';
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end shrink-0 ml-2">
                            <Badge scope={item.scope} />
                            <span className="px-2 py-0.5 bg-slate-600 text-white text-[9px] font-bold uppercase rounded leading-none flex items-center">
                              {item.type}
                            </span>
                            {item.llm && item.llm !== 'Altri' && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold uppercase rounded leading-none flex items-center">
                                {item.llm}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-500 text-[12px] leading-relaxed mb-4 line-clamp-2">
                          {item.description}
                        </p>
                        {item.exercise && (
                          <div className="exercise-box-sleek mb-4">
                            <strong>Esercizio:</strong> {item.exercise}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-[10px] text-slate-400">
                        <span className="font-bold text-slate-600 tracking-tight flex items-center gap-1">
                          € {item.price}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <Calendar size={11} className="text-slate-400" />
                            {item.date}
                          </span>
                          {item.source && item.source !== 'N.D.' && (
                            <a 
                              href={item.source} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 font-bold text-[11px] max-w-[130px] truncate"
                              title={`Apri risorsa: ${item.source}`}
                            >
                              <span className="truncate">{getDomainLabel(item.source)}</span>
                              <ExternalLink size={10} className="shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar flex flex-col bg-white rounded-2xl border border-slate-200 p-6 h-fit sticky top-32">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            ⚡ Utilizzi Pratici LLM
          </h2>

          <div className="flex flex-col">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl mb-4 animate-pulse" />)
            ) : (
              practicalUses.map((use, idx) => (
                <div 
                  key={use.id} 
                  onClick={() => setSelectedUse(use)}
                  className={`py-4 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-xl transition-colors ${idx !== practicalUses.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <div className="flex justify-between text-[10px] font-extrabold text-blue-600 mb-1 uppercase tracking-tight">
                    <span>{use.llm}</span> <span>{use.scope}</span>
                  </div>
                  <div className="text-[13px] font-semibold text-slate-800 mb-2">{use.useCase}</div>
                  <div className="group relative">
                    <div className="prompt-box-sleek truncate pr-8">
                      {use.prompt}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(use.prompt);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      title="Copia"
                    >
                      <ClipboardCopy size={12} />
                    </button>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">
                      Difficoltà: {use.difficulty}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      <footer className="py-6 px-8 text-center text-[12px] text-slate-400 font-medium">
        AI Radar per Formatori © 2026 • Realizzato con Tecnologia Gemini
      </footer>

      {/* Modal Detail */}
      <AnimatePresence>
        {(selectedItem || selectedUse) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedItem(null);
                setSelectedUse(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8"
            >
              <button 
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedUse(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>

              {selectedItem && (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge scope={selectedItem.scope} />
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-md border border-slate-200">
                      {selectedItem.type}
                    </span>
                    {selectedItem.llm && (
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-md border border-indigo-100">
                        {selectedItem.llm}
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
                    {selectedItem.title}
                  </h2>

                  <div className="prose prose-slate max-w-none mb-8">
                    <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                      {selectedItem.description}
                    </p>
                  </div>

                  {selectedItem.exercise && (
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8">
                      <h4 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Wrench size={16} /> Esercizio Pratico
                      </h4>
                      <p className="text-blue-900 font-medium leading-relaxed italic text-lg">
                        "{selectedItem.exercise}"
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Prezzo</p>
                      <p className="text-slate-900 font-bold flex items-center gap-2">
                        <Tag size={16} className="text-slate-400" />
                        {selectedItem.price}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Data risorsa</p>
                      <p className="text-slate-900 font-bold flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        {selectedItem.date}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <span className="font-bold text-slate-700">Fonte:</span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-mono text-[11px] truncate max-w-[220px]" title={selectedItem.source}>
                        {selectedItem.source ? getDomainLabel(selectedItem.source) : 'N.D.'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Secondary Google search link to find all news, reviews and press coverage */}
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(selectedItem.title + ' ' + (selectedItem.llm && selectedItem.llm !== 'Altri' ? selectedItem.llm : '') + ' AI news annuncio')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
                        title="Cerca articoli, rassegna stampa e approfondimenti su Google"
                      >
                        <Search size={14} className="text-slate-500" />
                        <span>Cerca Notizie & Articoli</span>
                      </a>

                      {/* Primary direct link to resource / repo */}
                      {selectedItem.source && selectedItem.source !== 'N.D.' ? (
                        <a 
                          href={selectedItem.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-[#2563eb] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#1e40af] transition-all flex items-center gap-2 shadow-md shadow-blue-200 text-sm"
                        >
                          Vai alla risorsa / repo <ExternalLink size={16} />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-medium italic text-xs">Link diretto non disponibile</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedUse && (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase rounded-md border border-indigo-200">
                      {selectedUse.llm}
                    </span>
                    <Badge scope={selectedUse.scope} />
                    <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${
                      selectedUse.difficulty === 'Facile' ? 'bg-green-100 text-green-700' :
                      selectedUse.difficulty === 'Medio' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Difficoltà: {selectedUse.difficulty}
                    </span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900 mb-6 leading-tight">
                    {selectedUse.useCase}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <MessageSquare size={16} /> Prompt Suggerito
                      </h4>
                      <div className="relative group">
                        <div className="bg-[#1e293b] text-[#38bdf8] p-6 rounded-2xl font-mono text-sm leading-relaxed border border-slate-700 shadow-inner whitespace-pre-wrap">
                          {selectedUse.prompt}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(selectedUse.prompt)}
                          className="absolute top-4 right-4 p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors shadow-lg"
                          title="Copia Prompt"
                        >
                          <ClipboardCopy size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 italic">
                        Il prompt sopra è stato ottimizzato per {selectedUse.llm} e può essere adattato alle tue esigenze specifiche nell'ambito {selectedUse.scope}.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AI Radar per Formatori — Ideato e sviluppato per <a href="https://www.roccoformazione.it/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Francesco Rocco Formazione</a>.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.roccoformazione.it/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 font-medium transition-colors">roccoformazione.it ↗</a>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">Verificato & Aggiornato con Google Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Assistant({ items, practicalUses, lastSearchQuery }: { items: any[], practicalUses: any[], lastSearchQuery: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setChat(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    try {
      const response = await fetch(`${apiBase}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            currentSearch: lastSearchQuery,
            itemCount: items.length,
            featuredTopics: items.slice(0, 3).map(i => i.title)
          }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setChat(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'assistant', content: "Spiacente, ho riscontrato un problema tecnico con Groq. Verifica la chiave API." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all active:scale-95 group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="font-bold text-sm">Groq Assistant</p>
                  <p className="text-[10px] opacity-70">Powered by Llama-3 (Cloud)</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chat.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="text-blue-600" size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Come posso aiutarti?</p>
                  <p className="text-xs text-slate-400 mt-1">Chiedimi tool specifici, prompt o consigli sulla didattica AI.</p>
                </div>
              )}
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrivi qui..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                disabled={isLoading || !message.trim()}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Badge({ scope }: { scope: string }) {
  const styles = {
    'Didattica': 'bg-[#22c55e]',
    'Ufficio': 'bg-[#3b82f6]',
    'PMI': 'bg-[#f97316]',
  }[scope] || 'bg-slate-400';

  return (
    <span className={`px-2 py-0.5 ${styles} text-white text-[9px] font-bold uppercase rounded leading-none flex items-center`}>
      {scope}
    </span>
  );
}
