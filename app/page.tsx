
"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js'
import { Browser } from '@capacitor/browser';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser';
import { motion, AnimatePresence } from 'framer-motion';
import * as stringSimilarity from 'string-similarity';

// Coloque suas chaves reais aqui
const supabase = createClient('https://usnhoviysiaeqcwvnhcd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbmhvdml5c2lhZXFjd3ZuaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjQ1NjksImV4cCI6MjA4MTM0MDU2OX0.7K1qfEeRZ7qrJBf0noIZJ6fkT4OMKIljgwd6r2MLUXk')
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, Play, Pause, 
  Maximize2, X, Globe, ArrowRight,
  Sun, Moon, TrendingUp, TrendingDown, CloudSun, CloudMoon, MapPin, Telescope,
  Clock, DollarSign, Bitcoin, Activity, Zap, GripVertical,
  FileText, CheckCircle, Trash2, BrainCircuit, Euro, 
  Headphones, Search, ChevronRight, Rss, Calendar as CalendarIcon, Loader2, RefreshCw, Music, Disc3, SkipBack, SkipForward, Type, ALargeSmall, Minus, Plus, PenTool, Highlighter, StickyNote, Save, Archive, Pencil, Eraser, Undo, Redo, Mail, Copy, Check, Wand2, Languages, Mic, Volume2, VolumeX, Heart, ChevronDown, History, MessageCircle, 
} from 'lucide-react';


const stripTags = (html = "") => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};



const stringToHash = (str) => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para um inteiro de 32bit
  }
  return Math.abs(hash);
};

// --- DADOS MOCKADOS ---

const STORIES = [
  { id: 1, name: 'G1', avatar: 'https://ui-avatars.com/api/?name=G1&background=c0392b&color=fff', items: [{ id: 101, type: 'image', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&q=80', title: 'Chuva recorde', time: '10 min' }] },
  { id: 2, name: 'Verge', avatar: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff', items: [{ id: 201, type: 'image', img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', title: 'Review M3', time: '30 min' }] },
  { id: 3, name: 'CNN', avatar: 'https://ui-avatars.com/api/?name=CN&background=e74c3c&color=fff', items: [{ id: 301, type: 'image', img: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=600&q=80', title: 'Bolsas asiáticas', time: '3h' }] },
];

const FEED_NEWS = []; // Limpo para evitar dados fantasmas


const BANCA_ITEMS = [
  { id: 1, name: 'Folha de S.Paulo', category: 'Jornais', color: 'bg-[#004990]', layoutType: 'standard', logo: 'FOLHA', headline: 'Reforma Tributária avança no Senado' },
  { id: 2, name: 'Wired', category: 'Revistas', color: 'bg-black', layoutType: 'magazine', logo: 'WIRED', headline: 'The Future of AI is Here' },
  { id: 3, name: 'National Geo', category: 'Revistas', color: 'bg-[#FFCC00] text-black', layoutType: 'visual', logo: 'NAT GEO', headline: 'Secrets of the Ocean' },
  { id: 4, name: 'Le Monde', category: 'Internacional', color: 'bg-[#D6CFC7] text-black', layoutType: 'minimal', logo: 'Le Monde', headline: 'La crise politique en France' },
  { id: 5, name: 'The NY Times', category: 'Internacional', color: 'bg-zinc-900', layoutType: 'standard', logo: 'The New York Times', headline: 'Global Markets Rally' },
];

const BANCA_CATEGORIES = ['Tudo', 'Jornais', 'Revistas', 'Internacional'];

const YOUTUBE_FEED = [
  { 
    id: 1, 
    channel: 'MKBHD', 
    category: 'Tech', 
    title: 'Review: O fim dos smartphones?', 
    views: '4M', 
    img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80',
    // ADICIONE ESTA LINHA:
    link: 'https://www.youtube.com/watch?v=P7D72a8u82c' 
  },
  { 
    id: 2, 
    channel: 'Manual do Mundo', 
    category: 'Ciência', 
    title: 'Construí um submarino caseiro', 
    views: '1M', 
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
    // ADICIONE ESTA LINHA:
    link: 'https://www.youtube.com/watch?v=SP-pW3tM8_w'
  },

];

const SAVED_ITEMS = [
  { id: 101, source: 'The Verge', title: 'Review aprofundado do Vision Pro após 1 mês de uso', category: 'Tech', readProgress: 70, date: 'Hoje', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80' },
  { id: 102, source: 'Folha', title: 'A nova reforma tributária explicada ponto a ponto', category: 'Economia', readProgress: 0, date: 'Ontem', img: 'https://images.unsplash.com/photo-1554224155-9840c6a9d306?w=800&q=80' },
  { 
  id: 103, 
  source: 'Medium.com', 
  title: 'Design Principles Behind Great Products', 
  category: 'Link', 
  readProgress: 0, 
  date: 'Há 2 dias', 
  img: 'https://images.unsplash.com/photo-1559028006-448665bd7c24?w=600&q=80', // Imagem de fallback
  url: 'medium.com/design-principles...'
},
];

const SAVED_CATEGORIES = ['Tudo', 'Tech', 'Economia', 'Design', 'Ciência', 'Música', 'Vídeo'];

const FEED_CATEGORIES = ['Tudo', 'Geral', 'Economia', 'Tecnologia', 'Local', 'Carros', 'Mundo','Política', 'Saúde',  'Esportes',  'Ciência'];
const YOUTUBE_CATEGORIES = ['Tudo', 'Tech', 'Finanças', 'Ciência'];



// --- ABA PODCAST (NOVA) ---

const PodcastTab = React.memo(({ isDarkMode, onPlayAudio, savedItems, onToggleSave, podcastsData, isLoading }) => {
  const [filter, setFilter] = useState('Todos');
  
  const uniqueCategories = useMemo(() => {
      if (!podcastsData || podcastsData.length === 0) return ['Todos'];
      const cats = new Set(podcastsData.map(p => p.source)); 
      return ['Todos', ...Array.from(cats).slice(0, 5)];
  }, [podcastsData]);

  const displayedPodcasts = useMemo(() => {
      if (!podcastsData) return [];
      if (filter === 'Todos') return podcastsData;
      return podcastsData.filter(p => p.source === filter);
  }, [podcastsData, filter]);

  return (
    <div className="pt-2 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                <Mic size={24} className="text-orange-500" /> Podcasts
            </h2>
            <span className="text-xs font-bold opacity-50 border px-2 py-1 rounded-full">
                {podcastsData?.length || 0} eps
            </span>
        </div>
        
        {uniqueCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {uniqueCategories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all
                            ${filter === cat 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border border-zinc-200 text-zinc-600')}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        )}
      </div>

      {isLoading && (!podcastsData || podcastsData.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Loader2 size={30} className="animate-spin mb-2 text-orange-500"/>
              <p className="text-xs font-bold uppercase tracking-widest">Buscando episódios...</p>
          </div>
      )}

      {!isLoading && displayedPodcasts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-60">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Mic size={24} className="text-zinc-400"/>
              </div>
              <h3 className="font-bold text-lg mb-2">Sua biblioteca está vazia</h3>
              <p className="text-sm max-w-xs">Adicione canais do YouTube ou RSS marcando-os como "Podcast" nas configurações.</p>
          </div>
      )}

      <div className="px-4 space-y-4">
         {displayedPodcasts.map((pod) => (
             <div key={pod.id} className={`group relative p-3 rounded-2xl border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900' : 'bg-white border-zinc-100 hover:shadow-lg'}`}>
                 <div className="flex gap-4">
                     
                     {/* --- AQUI ESTÁ A ALTERAÇÃO: forceAudioMode: true --- */}
                     <div 
                        className="w-16 h-16 rounded-xl bg-zinc-800 flex-shrink-0 relative overflow-hidden cursor-pointer shadow-sm" 
                        onClick={() => onPlayAudio({ ...pod, forceAudioMode: true })}
                     >
                         <img 
                            src={pod.cover || pod.img} 
                            className="w-full h-full object-cover" 
                            onError={(e) => e.target.style.display = 'none'}
                         />
                         <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] text-white font-bold flex items-center gap-1">
                             {pod.type === 'video' ? <Youtube size={8} /> : <Rss size={8} />}
                             {pod.type === 'video' ? 'Vídeo' : 'Áudio'}
                         </div>
                     </div>

                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <div className="flex justify-between items-start">
                             <span className="text-[10px] font-bold text-orange-500 uppercase truncate pr-2">
                                {pod.source}
                             </span>
                             <span className="text-[9px] font-bold opacity-40 whitespace-nowrap">{pod.date}</span>
                         </div>
                         
                         {/* --- AQUI TAMBÉM: forceAudioMode: true --- */}
                         <h4 
                            className={`text-sm font-bold leading-tight mt-1 mb-2 line-clamp-2 cursor-pointer hover:underline ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} 
                            onClick={() => onPlayAudio({ ...pod, forceAudioMode: true })}
                         >
                             {pod.title}
                         </h4>
                         
                         <div className="flex items-center gap-3">
                             <button onClick={() => onToggleSave(pod)} className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${savedItems?.some(i => i.id === pod.id) ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                 <Bookmark size={12} fill={savedItems?.some(i => i.id === pod.id) ? "currentColor" : "none"} /> Salvar
                             </button>
                             
                             <button className="flex items-center gap-1 text-[10px] font-bold text-purple-500 hover:text-purple-400 transition-colors bg-purple-500/10 px-2 py-0.5 rounded-full" onClick={(e) => { e.stopPropagation(); alert("A IA está ouvindo e resumindo este episódio..."); }}>
                                 <Sparkles size={10} /> Resumo
                             </button>
                         </div>
                     </div>
                 </div>
                 
                 {/* Botão Play Flutuante */}
                 <div className="absolute right-4 bottom-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                     <button onClick={() => onPlayAudio({ ...pod, forceAudioMode: true })} className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition">
                         <Play size={18} fill="white" className="ml-1" />
                     </button>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
});

function CalendarModal({ isOpen, onClose, selectedDate, onSelectDate, isDarkMode }) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate)); // Data que o calendário está mostrando (mês/ano)

  if (!isOpen) return null;

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 = Domingo

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onSelectDate(newDate);
    onClose();
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === viewDate.getMonth() && 
           selectedDate.getFullYear() === viewDate.getFullYear();
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === viewDate.getMonth() && 
           today.getFullYear() === viewDate.getFullYear();
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`
        relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border
        ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}
      `}>
        {/* Header do Calendário */}
        <div className="flex items-center justify-between mb-6">
            <button onClick={handlePrevMonth} className={`p-2 rounded-full hover:bg-white/10`}><ChevronLeft size={20}/></button>
            <span className="font-bold text-lg font-serif">
                {monthNames[viewDate.getMonth()]} <span className="opacity-50">{viewDate.getFullYear()}</span>
            </span>
            <button onClick={handleNextMonth} className={`p-2 rounded-full hover:bg-white/10`}><ChevronRight size={20}/></button>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs font-bold opacity-40 py-2">{d}</div>
            ))}
        </div>

        {/* Grid de Dias */}
        <div className="grid grid-cols-7 gap-2">
            {/* Espaços vazios antes do dia 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
            ))}

            {/* Dias do mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                    <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={`
                            h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${selected 
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110' 
                                : (isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700')}
                            ${today && !selected ? 'border-2 border-purple-500/50 text-purple-500' : ''}
                        `}
                    >
                        {day}
                    </button>
                );
            })}
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100">
            <X size={18} />
        </button>
      </div>
    </div>
  );
}


function HeaderDashboard({ isDarkMode, onOpenSettings, activeTab, isLoading, selectedSource, onSearch, onOpenPodNews }) {
  const [aiStatus, setAiStatus] = useState("Inicializando sistemas...");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [data, setData] = useState({});
  const searchInputRef = useRef(null); 

  // --- CORREÇÃO DE HIDRATAÇÃO APLICADA AQUI ---
  // 1. Inicializa a data como 'null' no servidor.
  const [currentDate, setCurrentDate] = useState(null); 
  // --- FIM DA CORREÇÃO ---

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

  // --- CORREÇÃO DE HIDRATAÇÃO APLICADA AQUI ---
  // 2. A data real (local do usuário) só é definida no navegador, após a primeira renderização.
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);
  // --- FIM DA CORREÇÃO ---

  const PHRASES = {
    loading: [
        "Sincronizando satélites de dados...",
        "Processando feed neural...",
        "Baixando pacotes criptografados...",
        "Atualizando matriz de informação..."
    ],
    feed_general: [
        "Monitorando o pulso global...",
        "Curadoria por IA ativa...",
        "Filtrando ruído, entregando sinais...",
        "Analisando tendências de mercado..."
    ],
    youtube: [
        "Otimizando buffer de vídeo...",
        "Renderizando feed visual...",
        "Sintonizando canais prioritários...",
        "Carregando criadores de conteúdo..."
    ],
    podcast: [
        "Calibrando frequências de áudio...",
        "Sincronizando feeds de voz...",
        "Isolando ruído de fundo...",
        "Preparando briefing auditivo..."
    ],
    happening: [
        "Detectando Breaking News...",
        "Monitoramento em tempo real...",
        "Analisando eventos críticos agora...",
        "Rastreando picos de interesse..."
    ],
    newsletter: [
        "Descriptografando inbox...",
        "Organizando correspondência digital...",
        "Resumindo boletins diários..."
    ],
    banca: [
        "Imprimindo edições digitais...",
        "Organizando capas de hoje...",
        "Acessando acervo editorial..."
    ],
    saved: [
        "Acessando memória de longo prazo...",
        "Recuperando arquivos salvos...",
        "Organizando sua biblioteca pessoal..."
    ]
  };

  const getRandomPhrase = (key) => {
      const list = PHRASES[key] || PHRASES['feed_general'];
      return list[Math.floor(Math.random() * list.length)];
  };

  useEffect(() => {
    if (isLoading) {
        setAiStatus(getRandomPhrase('loading'));
        return;
    }

    if (activeTab === 'feed' && selectedSource && selectedSource !== 'all') {
        const sourceName = selectedSource.charAt(0).toUpperCase() + selectedSource.slice(1);
        const sourcePhrases = [
            `Focando nos dados de ${sourceName}...`,
            `Extraindo inteligência de ${sourceName}...`,
            `Lendo feeds exclusivos de ${sourceName}...`
        ];
        setAiStatus(sourcePhrases[Math.floor(Math.random() * sourcePhrases.length)]);
        return;
    }

    switch (activeTab) {
        case 'youtube': setAiStatus(getRandomPhrase('youtube')); break;
        case 'podcast': setAiStatus(getRandomPhrase('podcast')); break;
        case 'happening': setAiStatus(getRandomPhrase('happening')); break;
        case 'newsletter': setAiStatus(getRandomPhrase('newsletter')); break;
        case 'banca': setAiStatus(getRandomPhrase('banca')); break;
        case 'saved': setAiStatus(getRandomPhrase('saved')); break;
        default: setAiStatus(getRandomPhrase('feed_general')); break;
    }

  }, [activeTab, isLoading, selectedSource]);

  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const str = new Intl.DateTimeFormat('pt-BR', options).format(date);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleDragStart = (clientX) => setDragStartX(clientX);
  
  const handleDragMove = (clientX) => {
    if (dragStartX === null) return;
    setDragOffset(clientX - dragStartX);
  };

  const handleDragEnd = () => {
    if (!currentDate) return; // Proteção extra
    if (Math.abs(dragOffset) < 5) {
        setIsCalendarOpen(true);
    } 
    else if (Math.abs(dragOffset) > 50) { 
      const newDate = new Date(currentDate);
      if (dragOffset > 0) newDate.setDate(currentDate.getDate() - 1);
      else {
        const today = new Date();
        if (newDate < today.setHours(0,0,0,0)) newDate.setDate(currentDate.getDate() + 1);
      }
      handleDateChange(newDate);
    }
    setDragStartX(null);
    setDragOffset(0);
  };

  const handleDateChange = (newDate) => {
      setCurrentDate(newDate);
      const isToday = newDate.toDateString() === new Date().toDateString();
      if (!isToday) {
          setAiStatus(`Acessando arquivos de ${newDate.toLocaleDateString()}...`);
      }
  };
const triggerSearch = () => {
      const term = searchInputRef.current?.value; // Pega o texto do input
      if (term && term.trim() && onSearch) {
          onSearch(term);        // Manda pesquisar
          setIsSearchOpen(false); // Fecha a barra
          searchInputRef.current.value = ''; // Limpa o texto
      }
  };
  const fetchMarketData = async () => {
    const symbols = ['USDBRL=X', 'EURBRL=X', 'BTC-USD', '^BVSP', '^IXIC', 'VALE3.SA', 'PETR4.SA'];
    const newData = {};
    try {
        await Promise.all(symbols.map(async (symbol) => {
            try {
                const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(targetUrl);
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error('Network err');
                const json = await res.json();
                const meta = json.chart?.result?.[0]?.meta;
                if (meta) {
                    const price = meta.regularMarketPrice;
                    const prevClose = meta.chartPreviousClose;
                    const change = price - prevClose;
                    const isUp = change >= 0;
                    let valDisplay = '...';
                    if (price) {
                        if (symbol === '^BVSP' || symbol === '^IXIC' || symbol === 'BTC-USD') {
                            valDisplay = (price / 1000).toFixed(1) + 'k';
                        } else {
                            valDisplay = price.toFixed(2).replace('.', ',');
                        }
                    }
                    newData[symbol] = { val: valDisplay, up: isUp };
                }
            } catch (err) {
                newData[symbol] = { val: '...', up: true };
            }
        }));
        setData(prev => ({ ...prev, ...newData }));
    } catch (error) {
        console.error("Erro geral no fetch:", error);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const TICKERS = [
      { id: 'USDBRL=X', label: 'USD', icon: DollarSign },
      { id: 'EURBRL=X', label: 'EUR', icon: Euro },
      { id: 'BTC-USD',  label: 'BTC', icon: Bitcoin },
      { id: '^BVSP',    label: 'IBOV', icon: Activity },
      { id: '^IXIC',    label: 'NDX',  icon: Zap },
      { id: 'VALE3.SA', label: 'VALE3', icon: TrendingUp },
      { id: 'PETR4.SA', label: 'PETR4', icon: TrendingDown },
  ];

  const TickerItem = ({ label, value, up, icon: Icon }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 mx-1">
       <span className={`text-[10px] ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
          {up ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
       </span>
       <span className="text-[10px] font-bold text-white/60">{label}</span>
       <span className="text-[10px] font-bold text-white">{value}</span>
    </div>
  );

  return (
    <div className="relative z-20 pb-2">
      {currentDate && <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={handleDateChange}
        isDarkMode={isDarkMode}
      />}

      <div className={`
        relative w-full overflow-hidden rounded-b-[2.5rem] shadow-2xl border-b border-white/10 
        transition-all duration-500 ease-in-out
        ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-900'}
      `}>
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[100%] bg-teal-600/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-soft-light pointer-events-none"></div>

        <div className="relative px-6 pt-6 pb-4 flex flex-col gap-4">
           <div className="absolute top-2 left-3 flex items-center gap-3 opacity-95">
                <div className="w-10 h-10 bg-gradient-to-br from-white via-zinc-200 to-zinc-500 rounded-lg flex items-center justify-center shadow-sm border border-white/20">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-black to-zinc-800">N</span>
                </div>
                <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">NewsOS</span>
            </div>

           <div 
             className="absolute top-0 right-0 z-50 cursor-ew-resize select-none touch-none group"
             onMouseDown={(e) => handleDragStart(e.clientX)}
             onMouseMove={(e) => handleDragMove(e.clientX)}
             onMouseUp={handleDragEnd}
             onMouseLeave={handleDragEnd}
             onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
             onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
             onTouchEnd={handleDragEnd}
           >
              <div 
                className={`flex items-center gap-3 px-5 py-3 rounded-b-2xl border-x border-b border-white/10 bg-black/20 backdrop-blur-xl shadow-lg transition-all duration-200 ease-out ${Math.abs(dragOffset) > 0 ? 'translate-y-1 bg-black/40' : 'hover:bg-black/30 hover:pt-4'}`}
                style={{ transform: `translateX(${dragOffset}px)` }}
              >
                  <ChevronLeft size={14} className={`text-white/40 transition-opacity ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                  <span className="text-sm font-bold text-green-400 whitespace-nowrap tracking-wide flex items-center gap-2 uppercase text-[10px]">
                      {currentDate ? formatDate(currentDate) : <>&nbsp;</>}
                      <CalendarIcon size={10} className="opacity-50" />
                  </span>
                  <ChevronRight size={14} className={`text-white/40 transition-opacity ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'group-hover:opacity-100'}`} />
              </div>
           </div>

           {/* ========================================================== */}
           {/* === A MUDANÇA PRINCIPAL ESTÁ AQUI === */}
           {/* ========================================================== */}
           <div className="flex justify-between items-center mt-12">
              {/* --- Lado Esquerdo: Avatar e Status --- */}
              <div className="flex items-center gap-3 -translate-x-3">
                 <div onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-lg">
                    <img src="https://ui-avatars.com/api/?name=User&background=000&color=fff" className="rounded-full w-full h-full border-2 border-black" alt="User" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-[10px] font-black uppercase text-white/40 tracking-[0.15em] leading-none mb-1">System Status</h1>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                       <span className="text-xs font-bold text-white tracking-wide animate-in fade-in slide-in-from-left-2 duration-500" key={aiStatus}>
                           {aiStatus}
                       </span>
                    </div>
                 </div>
              </div>

              {/* --- Lado Direito: PodNews e Ask AI --- */}
              <div className="flex items-center gap-3">
                {/* O NOVO BOTÃO PODNEWS */}
                <button
                    onClick={onOpenPodNews}
                    className="group relative flex items-center gap-3 px-4 h-11 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                    <div className="relative">
                        <div className="absolute -inset-1 bg-purple-500 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300 animate-pulse" />
                        <Headphones size={20} className="relative text-purple-400" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black uppercase tracking-widest">PodNews</span>
                        <span className="text-[9px] font-bold text-white/60">Resumo 07:00</span>
                    </div>
                </button>

                {/* O BOTÃO ASK AI (com margem ajustada) */}
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`relative z-[60] p-2.5 rounded-xl transition-all duration-500 flex items-center gap-2 border ${isSearchOpen ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-90' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 active:scale-95'}`}
                >
                  {isSearchOpen ? <X size={18} /> : <Sparkles size={18} className="text-purple-400 animate-pulse" />}
                  {!isSearchOpen && <span className="text-[10px] font-black uppercase tracking-widest px-4">Ask AI</span>}
                </button>
              </div>
           </div>

           <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSearchOpen ? 'grid-rows-[1fr] mt-2 mb-2' : 'grid-rows-[0fr] mt-0 mb-0'}`}>
              <div className="overflow-hidden">
                <div className={`transition-all duration-500 delay-[50ms] origin-top-right ${isSearchOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 -translate-y-4'}`}>
                    <div className="relative flex items-center bg-white/5 backdrop-blur-3xl border border-white/20 rounded-2xl p-1 shadow-inner">
                        <div className="pl-4 pr-3 text-white/30"><Search size={18} /></div>
                        <input ref={searchInputRef} type="text" autoFocus={isSearchOpen} placeholder="O que você deseja saber?" className="w-full bg-transparent text-white placeholder:text-white/30 text-sm font-medium py-3 outline-none" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { if (onSearch) { onSearch(e.target.value); setIsSearchOpen(false); } e.target.value = ''; } }} />
                        <div className="pr-1.5">
                            <button onClick={triggerSearch} className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
              </div>
           </div>
           
           <div className={`relative w-full overflow-hidden transition-all duration-700 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] ${isSearchOpen ? 'opacity-20  scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
              <div className="flex w-max animate-[scroll_40s_linear_infinite] hover:[animation-play-state:paused]">
                  {[...TICKERS, ...TICKERS, ...TICKERS].map((item, index) => (
                      <TickerItem key={`${item.id}-${index}`} label={item.label} value={data[item.id]?.val || '...'} up={data[item.id]?.up} icon={item.icon} />
                  ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function FeedVerticalFilter({ categories, active, onChange, isDarkMode }) {
  return (
    // 'fixed' é a melhor abordagem para este caso
<div 
    className="fixed right-0 z-30 flex flex-col items-end pointer-events-none"
    style={{ top: 'calc(50% + 40px)', transform: 'translateY(-50%)' }} // <<-- A MÁGICA ESTÁ AQUI
>      
      {/* O espaçamento entre os botões foi reduzido */}
      <div className={`
        pointer-events-auto flex flex-col gap-0.5 p-1 rounded-l-2xl border-t border-l border-b
        shadow-xl
        ${isDarkMode 
          ? 'bg-zinc-900/80 border-white/10 backdrop-blur-md' 
          : 'bg-white/80 border-zinc-200 backdrop-blur-md'}
      `}>
          {categories.map((cat) => {
            const isActive = active === cat;
            return (
              <button 
                key={cat} 
                onClick={() => onChange(cat)} 
                // ==========================================================
                // === A ALTURA DO BOTÃO (PADDING VERTICAL) FOI REDUZIDA ===
                // ==========================================================
                // 'py-5' (40px) foi trocado por 'py-3' (24px)
                className={`
                  relative flex items-center justify-center w-8 py-2 rounded-lg
                  transition-all duration-300
                  ${isActive 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : (isDarkMode 
                          ? 'text-zinc-400 hover:bg-white/5 hover:text-white' 
                          : 'text-zinc-500 hover:bg-black/5 hover:text-black')}
                `}
              >
                  {/* O tamanho da fonte foi ajustado para melhor encaixe */}
                  <span 
                    className="text-[12px] font-black uppercase tracking-[0.2em] whitespace-nowrap" 
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                  >
                      {cat}
                  </span>
              </button>
            )
          })}
      </div>
    </div>
  );
}

function SourceSelector({ news, selectedSource, onSelect, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);

  // Extrai fontes únicas (mantido)
  const uniqueSources = useMemo(() => {
    const seen = new Set();
    const sources = [];
    news.forEach(n => {
        if (!seen.has(n.source)) {
            seen.add(n.source);
            sources.push(n);
        }
    });
    return sources;
  }, [news]);

  return (
    <div className="absolute left-0 top-2 z-[1001]">
      
      {/* --- O BOTÃO "CORTADO" (TRIGGER) --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center
          h-[42px] w-12 pl-1
          rounded-r-2xl rounded-l-none
          border-y border-r border-l-0
          backdrop-blur-xl shadow-sm transition-all duration-300
          ${isDarkMode 
            ? 'bg-zinc-900/80 border-white/10 text-white hover:bg-zinc-800' 
            : 'bg-white/80 border-zinc-200 text-zinc-600 hover:bg-white'}
          ${isOpen ? 'w-14 border-purple-500/50' : ''}
        `}
      >
        {selectedSource === 'all' ? (
           <LayoutGrid size={20} className={isOpen ? 'text-purple-500' : ''} />
        ) : (
           <div className="w-6 h-6 rounded-md overflow-hidden border border-white/20">
              <img 
                src={uniqueSources.find(s => s.source === selectedSource)?.logo} 
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
           </div>
        )}
      </button>

      {/* --- MENU SUSPENSO (ICONES) --- */}
      {isOpen && (
        <>
          {/* Backdrop invisível para fechar ao clicar fora */}
          <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />

          <div className={`
             absolute top-[50px] left-2 z-[1001]
             flex flex-col gap-2 p-2
             rounded-2xl border shadow-xl backdrop-blur-xl
             animate-in slide-in-from-left-2 duration-200
             ${isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white/90 border-zinc-200'}
          `}>
             
             {/* Opção "Todas" (FIXA NO TOPO) */}
             <button
               onClick={() => { onSelect('all'); setIsOpen(false); }}
               className={`
                 w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center transition-all
                 ${selectedSource === 'all' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : (isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')}
               `}
               title="Todas as Fontes"
             >
                <LayoutGrid size={20} />
             </button>

             <div className={`h-[1px] w-full flex-shrink-0 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`} />

             {/* --- ÁREA DE ROLAGEM PARA OS LOGOS --- */}
             <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto scrollbar-hide pt-1 pb-1">
                 {uniqueSources.map((item) => (
                   <button
                     key={item.source}
                     onClick={() => { onSelect(item.source); setIsOpen(false); }}
                     // MUDANÇA 1: rounded-full -> rounded-md aqui
                     className={`
                       relative w-10 h-10 rounded-md p-[2px] transition-transform hover:scale-110 flex-shrink-0
                       ${selectedSource === item.source ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : ''}
                     `}
                     title={item.source}
                   >
                     <img 
                       src={item.logo} 
                       alt={item.source} 
                       // MUDANÇA 2: rounded-full -> rounded-md aqui também
                       className="w-full h-full rounded-md object-cover border border-black/10 bg-white"
                       onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${item.source}&background=random`}
                     />
                   </button>
                 ))}
             </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- SELETOR DE CANAIS YOUTUBE (LIMPO E SEM ERROS) ---
function YouTubeChannelSelector({ videos, selectedChannel, onSelect, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);

  // Extrai canais únicos garantindo que o nome seja o mesmo usado no filtro
  const uniqueChannels = useMemo(() => {
    const seen = new Set();
    const channels = [];
    videos.forEach(v => {
      const name = v.source || v.channel;
      if (name && !seen.has(name)) {
        seen.add(name);
        channels.push({ name, logo: v.logo });
      }
    });
    return channels;
  }, [videos]);

  return (
    <div className="absolute left-180 top-45 z-[1001]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 h-[42px] px-3 rounded-r-2xl border-y border-l border-r-0 backdrop-blur-xl shadow-sm transition-all active:scale-95 ${isDarkMode ? 'bg-zinc-900/80 border-white/10 text-white' : 'bg-white/80 border-zinc-200 text-zinc-600'}`}
      >
        {selectedChannel === 'all' ? (
           <LayoutGrid size={20} className={isOpen ? 'text-purple-500' : ''} />
        ) : (
           <div className="flex items-center gap-2">
              <img src={uniqueChannels.find(c => c.name === selectedChannel)?.logo} className="w-6 h-6 rounded-full object-cover border border-white/20" />
              <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">{selectedChannel}</span>
           </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
          <div className={`absolute top-[50px] left-2 z-[1001] flex flex-col gap-1 p-2 min-w-[200px] rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-left-2 duration-200 ${isDarkMode ? 'bg-zinc-900/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
             <button 
             onClick={() => { onSelect('ch.name'); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selectedChannel === 'all' ? 'bg-purple-600 text-white' : (isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')}`}>
                <LayoutGrid size={18} /> <span className="text-xs font-bold uppercase">Todos os Canais</span>
             </button>
             <div className={`h-[1px] w-full my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`} />
             {uniqueChannels.map((ch) => (
               <button key={ch.name} onClick={() => { onSelect(ch.name); setIsOpen(false); }} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full ${selectedChannel === ch.name ? 'bg-purple-500/20 ring-1 ring-purple-500/50' : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5')}`}>
                 <img src={ch.logo} className="w-7 h-7 rounded-full object-cover border border-black/10 shrink-0" />
                 <span className={`text-xs font-bold whitespace-nowrap truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>{ch.name}</span>
               </button>
             ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- COMPONENTE INTELIGENTE DE IMAGEM (NOVO) ---

const SmartImage = ({ src, title, logo, isDarkMode, className, sourceName }) => {
  const [hasError, setHasError] = useState(!src);

  // Mantém sua lógica de cor original
  const stringToColor = (str) => {
    if (!str) return isDarkMode ? '#27272a' : '#e4e4e7'; 
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 60; 
    const l = isDarkMode ? 25 : 85; 
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  // --- NOVA LÓGICA: PEGAR 6 PALAVRAS ---
  const getDisplayTitle = () => {
    if (!title) return sourceName || "News";
    // Divide por espaços, pega os 6 primeiros itens, junta de volta
    const words = title.split(/\s+/).slice(0, 6).join(' ');
    // Adiciona "..." se o título for maior que 6 palavras
    return words + (title.split(/\s+/).length > 6 ? "..." : "");
  };

if (hasError) {
  const bgColor = stringToColor(sourceName || title);
  
  return (
    <div 
      className={`w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden ${className}`}
      style={{ backgroundColor: bgColor }} 
    >
      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        {/* === MUDANÇA 4: REMOVER LOGO DO FALLBACK DE SMARTIMAGE === */}
        {/* Removido o bloco de código que exibia o logo aqui */}

        {/* --- AQUI ESTÁ A MUDANÇA: Exibe o Título (6 palavras) --- */}
        <h3 className={`font-black leading-tight tracking-tight uppercase select-none opacity-90 ${isDarkMode ? 'text-white' : 'text-zinc-900'} text-[10px] md:text-xs line-clamp-3`}>
          {getDisplayTitle()}
        </h3>
      </div>
    </div>
  );
}

  return (
    <img 
      src={src} 
      className={className} 
      alt={title}
      onError={() => setHasError(true)} 
      loading="lazy"
    />
  );
};

const NewsCardSkeleton = ({ isDarkMode }) => {
  return (
    <div className={`
      flex flex-row gap-5 w-full p-3 rounded-3xl border animate-pulse
      ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'}
    `}>
      {/* Imagem Skeleton */}
      <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl flex-shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

      {/* Conteúdo Skeleton */}
      <div className="flex-1 flex flex-col gap-3 py-2 min-w-0">
        <div className="flex justify-between items-center">
           <div className={`h-3 w-20 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
           <div className={`h-3 w-10 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
        </div>
        <div className="space-y-2">
           <div className={`h-4 w-full rounded-md ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
           <div className={`h-4 w-3/4 rounded-md ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
        </div>
        <div className={`h-3 w-full rounded-md mt-1 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100'}`} />
        <div className={`h-3 w-16 rounded-full mt-auto ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
      </div>
    </div>
  );
};


// --- TAB: FEED (COMPLETA E FUNCIONAL) ---


// ==========================================================
// === SUBSTITUA SUA FUNÇÃO "NewsCard" INTEIRA POR ESTA ===
// ==========================================================
// ==========================================================
// === SUBSTITUA SUA FUNÇÃO "NewsCard" INTEIRA POR ESTA ===
// ==========================================================

// ==========================================================
// === CÓDIGO 100% COMPLETO E CORRIGIDO PARA O NewsCard ===
// ==========================================================
const NewsCard = React.memo(({ 
  news, 
  isSelected, 
  isRead, 
  isSaved, 
  isLiked, 
  isDarkMode, 
  onClick, 
  onAnalyze, 
  onLongPress,
  onToggleSave, 
  onToggleLike, 
  onPlay, 
  playingAudio 
}) => {
  const [activePill, setActivePill] = useState(null);

  // Função que encapsula a lógica do clique normal, incluindo a mudança da pílula.
  const handleNormalClick = () => {
    setActivePill('read');
    onClick(news); 
  };
  
  // Hook que gerencia os eventos de mouse/touch para diferenciar clique normal de longo.
  const longPressEvents = useLongPress(onLongPress, handleNormalClick, { threshold: 500 });

  const displayTime = news.rawDate ? new Date(news.rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...';
  const isPlayable = !!news.title;
  const isCurrentPlaying = playingAudio?.id === news.id;
  const isGenerating = isCurrentPlaying && playingAudio?.isGenerating;

  // Definição do sub-componente InlinePlayer (com a correção do fragmento).
  const InlinePlayer = () => (
    <>
        <div className={`mt-0 border-t ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-zinc-100 bg-zinc-50'} animate-in slide-in-from-top-2 duration-300`}>
            <div className="p-4 flex items-center gap-4">
                <button 
                    onClick={(e) => { e.stopPropagation(); onPlay(news); }}
                    className="w-12 h-12 flex-shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                    {isGenerating ? <Loader2 size={20} className="animate-spin"/> : (
                        <div className="flex gap-1 items-end h-4">
                            <div className="w-1 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]"></div>
                            <div className="w-1 bg-white animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                            <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite]"></div>
                        </div>
                    )}
                </button>
                <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {isGenerating ? 'Gerando Áudio Neural...' : 'Ouvindo Agora'}
                    </h4>
                    <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-1/3 animate-pulse"></div>
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onPlay(null); }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>
        <style jsx="true">{`@keyframes music-bar { 0%, 100% { height: 20%; } 50% { height: 100%; } }`}</style>
    </>
  );

  // --- A CORREÇÃO PRINCIPAL: ADICIONANDO O 'return' ---
  return (
    <div 
      {...longPressEvents}
      style={{ zIndex: isSelected ? 40 : 1 }}
      className={`group relative flex flex-col rounded-[2.5rem] mb-12 cursor-pointer transition-all duration-500 ease-out will-change-transform ${isSelected ? 'scale-[1.02]' : 'active:scale-[0.98]'}`}
    >
      
      {isSelected && (
        <>
            <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-60 blur-xl animate-pulse transition-all duration-500" />
            <div className="absolute -inset-[2px] rounded-[2.5rem] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-100" />
        </>
      )}

      <div className={`relative z-10 w-full h-full flex flex-col overflow-hidden rounded-[2.5rem] ${isDarkMode ? 'bg-zinc-900' : 'bg-white shadow-xl'} ${!isSelected && (isDarkMode ? 'border border-white/5' : 'border border-zinc-100')}`}>
      
          <div className="relative h-80 w-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
            <img src={news.img} alt={news.title} className="absolute w-full h-[calc(100%+1.5rem)] object-cover transition-transform duration-700 group-hover:scale-105 -bottom-6" onError={(e) => e.target.style.display='none'} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-0 bg-gradient-to-b from-white via-white/95 to-transparent pointer-events-none" />

            <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg border-2 border-white/80">
                    <img 
                        src={news.logo} 
                        className="w-full h-full object-contain rounded-lg" 
                        onError={(e) => e.target.style.display = 'none'} 
                        alt={news.source}
                    />
                </div>
                <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/70">
                    <span className="text-[13px] font-black text-white uppercase tracking-widest truncate">
                        {news.source}
                    </span>
                    <span className="text-sm font-mono font-bold text-white/70 tracking-wider">
                        {displayTime}
                    </span>
                </div>
            </div>

            <div className="absolute top-20 right-5 z-20 flex flex-col items-end gap-2">
                {isRead && (
                    <div className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg shadow-md border border-red-500 animate-in fade-in zoom-in duration-300">
                        Lida
                    </div>
                )}
                <div className="flex flex-col items-center gap-1 p-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-lg">
                    <button onClick={(e) => { e.stopPropagation(); onToggleLike(news); }} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onToggleSave(news); }} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isSaved ? 'text-purple-500 bg-purple-500/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                        <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                    {isPlayable && (
                        <button onClick={(e) => { e.stopPropagation(); onPlay(news); }} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isCurrentPlaying ? 'text-green-400 bg-green-500/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                            {isGenerating ? (<Loader2 size={20} className="animate-spin" />) : isCurrentPlaying ? (<Pause size={20} fill="currentColor"/>) : (<Play size={20} fill="currentColor" />)}
                        </button>
                    )}
                </div>
            </div>
          </div>
          
          <div className="absolute top-80 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-max">
            <div className={`relative flex items-center p-0 rounded-full border shadow-2xl ${isDarkMode ? 'bg-zinc-800/60 border-white/10 backdrop-blur-xl' : 'bg-white/70 backdrop-blur-md border border-white/70 shadow-lg'}`}>
                <AnimatePresence>
                    {activePill && (
                        <motion.div
                            layoutId={`pill-switch-${news.id}`}
                            className="absolute h-[calc(100%-8px)] rounded-full overflow-hidden"
                            initial={false}
                            animate={{
                                left: activePill === 'read' ? '4px' : 'calc(100% - 132px)',
                                width: activePill === 'read' ? '68px' : '128px'
                            }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        >
                            <div className="relative w-full h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 opacity-80"></div>
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                                <div className="absolute inset-0 rounded-full border border-white/30"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleNormalClick(); }} 
                    className="relative z-10 w-[68px] h-[42px] flex items-center justify-center rounded-full text-base font-bold transition-colors duration-300"
                >
                    <span className={activePill === 'read' ? 'text-white' : (isDarkMode ? 'text-zinc-300' : 'text-zinc-700')}>
                        Ler
                    </span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setActivePill('analyze'); onAnalyze(news); }} 
                    className="relative z-10 w-[128px] h-[42px] flex items-center justify-center rounded-full text-base font-bold transition-colors duration-300"
                >
                    <div className={`flex items-center gap-2 ${activePill === 'analyze' ? 'text-white' : (isDarkMode ? 'text-zinc-300' : 'text-zinc-700')}`}>
                        <Sparkles size={22} className={`animate-pulse ${activePill === 'analyze' ? 'text-white/80' : 'text-purple-400'}`} />
                        <span>Analisar</span>
                    </div>
                </button>
            </div>
          </div>

          <div className="relative px-6 pt-7.5 pb-2 flex-1 flex flex-col justify-end">
            <div className="cursor-pointer">
                 <h3 className={`text-xl font-black leading-tight mb-1.5 line-clamp-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                     {news.title}
                 </h3>
                 <p className={`text-sm font-medium leading-relaxed opacity-80 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} line-clamp-2`}>
                     {news.summary}
                 </p>
            </div>
          </div>

          {isCurrentPlaying && <InlinePlayer />}
      </div>
    </div>
  );
});

// --- TAB: FEED (COM PROTEÇÃO CONTRA DUPLICATAS) ---
// --- TAB: FEED (VERSÃO FINAL, LIMPA E OTIMIZADA) ---
function FeedTab({ 
  isDarkMode, 
  selectedArticleId, 
  savedItems, 
  onToggleSave, 
  readHistory, 
  newsData, 
  isLoading, 
  sourceFilter, 
  setSourceFilter, 
  likedItems, 
  onToggleLike, 
  onRefresh, 
  onReadArticle, 
  onGenerateAudio,
  onLongPressArticle,
  openArticle // Esta é a função que abre o painel de IA
}) {
  
  // Estados e lógica pertencentes APENAS ao feed
  const [category, setCategory] = useState('Tudo');
  const [stableData, setStableData] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localPlayingAudio, setLocalPlayingAudio] = useState(null); 
  const [audioUrl, setAudioUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const feedContainerRef = useRef(null);
  const audioRef = useRef(null);
  const prevCategory = useRef(category);

  useEffect(() => {
    if (feedContainerRef.current && prevCategory.current !== category) {
      feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevCategory.current = category;
  }, [category]);

  useEffect(() => { setSourceFilter('all'); }, [category]);

  useEffect(() => {
    if (newsData && newsData.length > 0) {
        setStableData(newsData);
        if (!hasLoaded) setHasLoaded(true);
    } else {
        setStableData([]);
    }
  }, [newsData]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
    } else if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
    }
  }, [audioUrl]);

  const safeNews = useMemo(() => stableData || [], [stableData]);
  const filteredByCategory = useMemo(() => category === 'Tudo' ? safeNews : safeNews.filter(n => n.category === category), [safeNews, category]);
  const filteredBySource = useMemo(() => sourceFilter === 'all' ? filteredByCategory : filteredByCategory.filter(n => n.source === sourceFilter), [filteredByCategory, sourceFilter]);
  const sortedFeed = useMemo(() => [...filteredBySource].sort((a, b) => (new Date(b.rawDate).getTime() || 0) - (new Date(a.rawDate).getTime() || 0)), [filteredBySource]);
  const uniqueNews = useMemo(() => {
      const seen = new Set();
      return sortedFeed.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
      }).slice(0, 50); 
  }, [sortedFeed]);

  const handleTouchStart = (e) => { if (feedContainerRef.current?.scrollTop <= 5 && !isRefreshing) setStartY(e.touches[0].clientY); };
  const handleTouchMove = (e) => {
    if (startY === 0 || isRefreshing || (feedContainerRef.current && feedContainerRef.current.scrollTop > 5)) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      if (e.cancelable) e.preventDefault();
      setPullDistance(Math.min(diff * 0.45, 140));
    }
  };
  const handleTouchEnd = async () => {
    if (pullDistance > 70) {
      setIsRefreshing(true);
      if (onRefresh) await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0); setStartY(0);
  };
  const handleLocalPlay = useCallback(async (article) => {
    if (!article || localPlayingAudio?.id === article.id) { setLocalPlayingAudio(null); setAudioUrl(''); return; }
    setLocalPlayingAudio(article); setIsGenerating(true); setAudioUrl('');
    const url = await onGenerateAudio(article);
    if (url) { setIsGenerating(false); setAudioUrl(url); } 
    else { setLocalPlayingAudio(null); setIsGenerating(false); }
  }, [localPlayingAudio, onGenerateAudio]);

  if (isLoading && stableData.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 size={40} className="animate-spin text-purple-500" />
          <p className={`text-sm font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Buscando notícias...</p>
       </div>
     );
  }

  return (
    <div 
      ref={feedContainerRef} 
      className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-24 pt-2 min-h-screen overscroll-y-none touch-pan-y custom-scrollbar"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
    >
      <audio ref={audioRef} onEnded={() => setLocalPlayingAudio(null)} />
      
      <FeedVerticalFilter 
          categories={FEED_CATEGORIES} 
          active={category} 
          onChange={setCategory} 
          isDarkMode={isDarkMode} 
      />
      
      {/* O SELETOR DE FONTES AGORA FICA PRESO NO TOPO */}
      <div className="sticky top-0 z-20 py-2">
        <SourceSelector news={filteredByCategory} selectedSource={sourceFilter} onSelect={setSourceFilter} isDarkMode={isDarkMode} />
      </div>

      <div style={{ height: `${pullDistance}px`, opacity: Math.min(pullDistance / 40, 1) }} className="flex items-end justify-center overflow-hidden w-full">
         <div className={`mb-4 flex items-center gap-3 px-5 py-2 rounded-full shadow-lg border ${isDarkMode ? 'bg-zinc-800 border-purple-500/30' : 'bg-white border-purple-200'}`}>
            {isRefreshing ? <><Loader2 size={16} className="animate-spin text-purple-500" /> <span className="text-xs font-bold text-purple-500">Atualizando...</span></> : <><RefreshCw size={16} style={{ transform: `rotate(${pullDistance * 3}deg)` }} /> <span className="text-xs">{pullDistance > 70 ? 'Solte para atualizar' : 'Puxe para atualizar'}</span></>}
         </div>
      </div>
      
      {/* O PADDING LATERAL AGORA É APLICADO AQUI, E É MAIOR À DIREITA */}
      <div className="flex flex-col gap-4 px-4 pr-12">
        {uniqueNews.length === 0 && !isLoading && <div className="text-center py-10 opacity-50"><p>Nenhuma notícia encontrada.</p></div>}
        {uniqueNews.map((news) => (
            <NewsCard 
              key={news.id} news={news} isSelected={selectedArticleId === news.id}
              playingAudio={isGenerating ? {id: localPlayingAudio?.id, isGenerating: true} : localPlayingAudio}
              onPlay={handleLocalPlay} isRead={readHistory?.includes(news.id)}
              isSaved={savedItems?.some((item) => item.id === news.id)}
              isDarkMode={isDarkMode} onClick={onReadArticle} onAnalyze={openArticle}
              onToggleSave={onToggleSave} isLiked={likedItems?.includes(news.id)}
              onToggleLike={onToggleLike}
              onLongPress={() => onLongPressArticle(news)}
            />
        ))}
      </div>
    </div>
  );
}

// --- OUTROS COMPONENTES E FILTROS ---

function YouTubeVerticalFilter({ categories, active, onChange, isDarkMode }) {
  return (
    // Container Wrapper (Posiciona tudo na esquerda)
    <div className="fixed left-2 top-[260px] z-30 flex flex-col items-center gap-4 pointer-events-none">
      
      {/* --- A BARRA PRINCIPAL --- */}
      <div className={`
        pointer-events-auto flex flex-col gap-2 p-1.5 rounded-2xl border shadow-xl backdrop-blur-xl transition-colors duration-300 items-center
        ${isDarkMode ? 'bg-zinc-900/80 border-red-900/30' : 'bg-white/80 border-red-100'}
      `}>
        {/* Lista de Categorias de Texto */}
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onChange(cat)} 
              className={`
                relative px-1 py-4 text-sm rounded-2xl font-bold transition-all duration-300 flex items-center justify-center
                ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105' : (isDarkMode ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300' : 'text-zinc-400 hover:bg-black/5 hover:text-red-600')}
              `}
            >
              <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }} className="uppercase tracking-wider whitespace-nowrap">
                {cat}
              </span>
            </button>
          )
        })}

        {/* Divisória */}
        <div className={`w-full h-[1px] my-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />

        {/* Barra de Pesquisa (Apenas Visual - Sem lógica complexa para não dar erro) */}
        <div className="relative w-8 h-32 flex items-center justify-center py-2">
            <div className={`absolute flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-300 w-32 
                ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white focus-within:border-red-500' : 'bg-zinc-100 border-zinc-200 text-zinc-800 focus-within:border-red-500'}
            `} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center' }}>
                
                {/* INPUT LIMPO - SEM REF, SEM AUTO FOCUS, SEM ISSEARCHOPEN */}
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider w-full placeholder:text-zinc-500" 
                />
                
                <Search size={14} className={`flex-shrink-0 rotate-90 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </div>
        </div>
      </div>
    </div>
  );
}


// Função auxiliar ROBUSTA para extrair ID do YouTube
const getVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Tenta encontrar ID de 11 caracteres (padrão YouTube)
    // Suporta: youtube.com/watch?v=, youtu.be/, embed/, shorts/
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
};


// --- COMPONENTE: STORY DE YOUTUBE (V5 - COM CONTROLE DE VOLUME) ---
const YouTubeStoryModal = ({ story, onClose, onWatchVideo }) => {
    const [isMuted, setIsMuted] = useState(true); // Começa mudo para permitir autoplay
    const iframeRef = useRef(null);

    // Detecção de Short
    const isShort = useMemo(() => {
        if (!story) return false;
        const titleCheck = story.title?.toLowerCase().includes('#shorts');
        const linkCheck = story.link?.includes('/shorts/');
        return titleCheck || linkCheck;
    }, [story]);

    const finalId = story?.videoId || getVideoId(story?.link);

    // Função para alternar o som sem recarregar
    const toggleMute = (e) => {
        e.stopPropagation();
        if (iframeRef.current) {
            const command = isMuted ? 'unMute' : 'mute';
            // Envia comando direto para a API do Iframe
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command
            }), '*');
            setIsMuted(!isMuted);
        }
    };

    if (!story || !finalId) return null;

    return (
        <div className="fixed inset-0 z-[60000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            
            {/* Barra de Progresso Visual */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 z-[60002]">
                <div className="h-full bg-red-600 w-full animate-[progress_15s_linear]" />
            </div>

            {/* Cabeçalho */}
            <div className="absolute top-6 left-6 z-[60002] flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-lg">
                    <img src={story.logo} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col drop-shadow-md">
                    <span className="text-white font-bold text-base leading-none shadow-black">{story.channel || story.source}</span>
                    <span className="text-white/80 text-xs uppercase font-bold tracking-wider mt-0.5">
                        {isShort ? 'Shorts' : 'Novo Vídeo'}
                    </span>
                </div>
            </div>

            {/* Botão Fechar */}
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 z-[60002] p-3 text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20 transition-transform active:scale-90"
            >
                <X size={28} />
            </button>

            {/* --- CONTAINER PRINCIPAL --- */}
            <div className="relative w-full h-full md:w-[700px] md:h-[95vh] bg-black md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
                
                {isShort ? (
                    // --- MODO SHORT ---
                    <div className="flex-1 relative bg-black w-full h-full">
                        <iframe 
                            ref={iframeRef}
                            // enablejsapi=1 é ESSENCIAL para o botão de som funcionar
                            src={`https://www.youtube.com/embed/${finalId}?autoplay=1&mute=1&enablejsapi=1&controls=0&rel=0&playsinline=1&loop=1&playlist=${finalId}&modestbranding=1&iv_load_policy=3&fs=0`}
                            className="w-full h-full absolute inset-0 object-cover"
                            style={{ pointerEvents: 'none' }} 
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        />
                        
                        {/* Overlay de Clique (Abre o Player Completo) */}
                        <div 
                            className="absolute inset-0 z-10 cursor-pointer" 
                            onClick={() => onWatchVideo(story)}
                            title="Abrir Player Completo"
                        />

                        {/* --- NOVO: BOTÃO DE SOM --- */}
                        <button 
                            onClick={toggleMute}
                            className="absolute bottom-24 right-6 z-[60005] p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-90 shadow-lg group"
                        >
                            {isMuted ? (
                                <div className="relative">
                                    <VolumeX size={24} />
                                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Ativar Som</span>
                                </div>
                            ) : (
                                <Volume2 size={24} />
                            )}
                        </button>

                        {/* Botão Inferior */}
                        <div className="absolute bottom-6 left-0 right-0 text-center z-20 pointer-events-none px-8">
                            <h3 className="text-white font-bold text-lg drop-shadow-md line-clamp-2 mb-2">{story.title}</h3>
                             <div className="inline-flex bg-red-600/90 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-lg items-center gap-2">
                                <Play size={10} fill="white"/> Toque para expandir
                             </div>
                        </div>
                    </div>
                ) : (
                    // --- MODO VÍDEO NORMAL ---
                    <div 
                        className="w-full h-full relative cursor-pointer group bg-zinc-900"
                        onClick={() => onWatchVideo(story)}
                    >
                        <img 
                            src={story.img} 
                            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" 
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-20">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center mb-8 group-hover:bg-red-600 group-hover:border-red-600 group-hover:scale-110 transition-all duration-300 shadow-2xl">
                                <Play size={40} fill="white" className="ml-1 text-white" />
                            </div>
                            <h2 className="text-white text-3xl md:text-4xl font-black leading-tight mb-8 drop-shadow-2xl line-clamp-4">
                                {story.title}
                            </h2>
                            <span className="px-8 py-3 rounded-xl bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition transform active:scale-95 shadow-xl">
                                Assistir Agora
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            <style jsx="true">{`@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
        </div>
    );
};


// --- ABA YOUTUBE (V8 - LÓGICA DE STORIES ESTRITA: SÓ O MAIS RECENTE) ---

function YouTubeTab({ isDarkMode, openStory, onToggleSave, savedItems, realVideos, isLoading, onPlayVideo, seenStoryIds, onMarkAsSeen, channelFilter, setChannelFilter }) {
  const [category, setCategory] = useState('Tudo');
  const [activeStory, setActiveStory] = useState(null); 
  
  const safeVideos = (realVideos && realVideos.length > 0) ? realVideos : YOUTUBE_FEED;
  const displayedVideos = useMemo(() => {
    return safeVideos.filter(v => {
        // 1. Filtra por Categoria Lateral (Mantém o que já existia)
        const matchesCategory = category === 'Tudo' || v.category === category || v.source === category;
        
        // 2. ADICIONE ISSO: Filtra por Canal (SourceSelector)
        const matchesChannel = channelFilter === 'all' || (v.source === channelFilter) || (v.channel === channelFilter);
        
        return matchesCategory && matchesChannel;
    });
}, [safeVideos, category, channelFilter]); // Não esqueça de adicionar channelFilter nas dependências

  // --- LÓGICA DE STORIES CORRIGIDA ---
  const channelStories = useMemo(() => {
      const processedChannels = new Set(); // Para rastrear quais canais já verificamos
      const stories = [];
      
      // O array safeVideos JÁ VEM ordenado por data (do mais novo pro mais velho)
      safeVideos.forEach(video => {
          const channelName = video.channel || video.source;
          
          // Se já processamos esse canal (ou seja, já passamos pelo vídeo mais recente dele),
          // IGNORA qualquer outro vídeo mais antigo. Não queremos "voltar no tempo".
          if (processedChannels.has(channelName)) return;

          // Marca o canal como processado. 
          // A partir de agora, ignoramos qualquer outro vídeo desse canal nesta lista.
          processedChannels.add(channelName);

          // Agora verificamos: O vídeo mais recente (este) já foi visto?
          const isSeen = seenStoryIds?.includes(video.id);

          // Se NÃO foi visto, adiciona aos Stories.
          // Se FOI visto, não fazemos nada (a bolinha desse canal não aparecerá).
          if (!isSeen) {
              stories.push({ ...video, hasNew: true });
          }
      });

      return stories;
  }, [safeVideos, seenStoryIds]);

  const handleWatchFromStory = (video) => {
      setActiveStory(null); 
      onPlayVideo(video);   
  };

 const handleOpenStory = (story) => {
      // 1. Detecta se é Short
      const isShort = story.link?.includes('/shorts/') || story.title?.toLowerCase().includes('#shorts');

      // 2. Se for Short, ou se não tivermos certeza, abrimos o Modal (StoryOverlay)
      // O Modal já tem a lógica interna: se for Short = Autoplay; Se for Longo = Capa + Botão.
      setActiveStory(story);
      
      // 3. Marca como visto
      if (onMarkAsSeen) onMarkAsSeen(story.id);
  };

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in px-2 pl-16 relative min-h-screen">
    
<div className="absolute top-0 left-0 z-30">
   <YouTubeChannelSelector 
      videos={safeVideos} 
      selectedChannel={channelFilter} 
      onSelect={setChannelFilter} 
      isDarkMode={isDarkMode} 
   />
</div>

   
      
      {/* Filtro Lateral */}
      <YouTubeVerticalFilter categories={YOUTUBE_CATEGORIES} active={category} onChange={setCategory} isDarkMode={isDarkMode} />
      
      {/* --- ÁREA DE STORIES --- */}
      {/* Só mostra a barra se houver stories novos ou estiver carregando */}
      {(channelStories.length > 0 || isLoading) && (
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x items-center px-1 min-h-[120px]">
            
            {isLoading && channelStories.length === 0 && (
                [1,2,3,4].map(i => (
                    <div key={i} className="flex flex-col items-center space-y-2 snap-center min-w-[80px]">
                        <div className="w-[76px] h-[76px] rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse border dark:border-white/5" />
                        <div className="w-12 h-2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                ))
            )}

            {channelStories.map((story) => (
            <div 
                key={story.id} 
                onClick={() => handleOpenStory(story)} 
                className="flex flex-col items-center space-y-2 snap-center cursor-pointer group flex-shrink-0 animate-in zoom-in-50 duration-300"
            >
                {/* Anel de Gradiente */}
                <div className={`
                    relative w-[80px] h-[80px] rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105
                    bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-md
                `}>
                <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-black bg-black' : 'border-white bg-white'}`}>
                    <img 
                        src={story.logo || story.img} 
                        className="w-full h-full object-cover" 
                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${story.source}&background=random`}
                    />
                </div>
                </div>
                
                <span className={`text-[10px] font-bold max-w-[80px] truncate text-center transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-600 group-hover:text-black'}`}>
                    {story.channel || story.source}
                </span>
            </div>
            ))}
        </div>
      )}

      {/* --- LISTA DE VÍDEOS (FEED) --- */}
      <div className="grid md:grid-cols-1 gap-10">
        {isLoading && safeVideos === YOUTUBE_FEED && (
          <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-50">
              <Loader2 size={30} className="animate-spin mb-2"/>
              <p>Atualizando feed...</p>
          </div>
        )}

        {displayedVideos.map((video) => {
            const isSaved = savedItems?.some(i => i.id === video.id);
            // Verifica se foi visto (para diminuir opacidade na lista)
            const isSeen = seenStoryIds?.includes(video.id);

            return (
                 <div 
          key={video.id} 
          // MUDANÇA: Chama openPlayVideo diretamente
          onClick={() => onPlayVideo(video)} 
                  className={`group relative md:w-[520px] rounded-3xl overflow-hidden border shadow-lg hover:shadow-xl transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'} ${isSeen ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full p-[2px] ${isSeen ? 'bg-zinc-500' : 'bg-gradient-to-r from-red-600 to-orange-600'}`}>
                                <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                                    <img 
                                      src={video.logo} 
                                      className="w-full h-full object-cover rounded-full" 
                                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${video.source}&rounded=true`} 
                                    />
                                </div>
                            </div>
                            <div>
                                <span className={`text-xs font-bold block ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
        {video.channel || video.source}
    </span>
    
    <span className="text-[10px] uppercase font-bold text-zinc-500">
        {/* Data (Ex: 20 de dez. de 2025) */}
        {new Date(video.rawDate).toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        })}
        
        {/* Separador e Hora (Ex: • 14:30) */}
        <span className="mx-1 opacity-50">•</span>
        
        {new Date(video.rawDate).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}
    </span>
                            </div>
                        </div>
                        <MoreHorizontal size={20} className="text-zinc-400" />
                    </div>
                    <div className={`relative aspect-video overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                        <img src={video.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full"><Play size={48} className="text-white drop-shadow-lg fill-white/20" /></div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); if (onToggleSave) onToggleSave(video); }} className={`absolute bottom-3 right-3 z-20 p-2.5 rounded-full backdrop-blur-xl shadow-xl transition-all active:scale-90 ${isSaved ? 'bg-purple-600 text-white' : 'bg-black/50 text-white'}`}><Bookmark size={18} fill={isSaved ? "currentColor" : "none"} /></button>
                    </div>
                    <div className="px-5 py-4"><h3 className={`text-lg font-bold leading-tight mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{video.title}</h3></div>
                </div>
            )
        })}
      </div>

      {/* --- RENDERIZA O STORY SE ESTIVER ATIVO --- */}
      {activeStory && (
          <YouTubeStoryModal 
              story={activeStory} 
              onClose={() => setActiveStory(null)} 
              onWatchVideo={handleWatchFromStory} 
          />
      )}

    </div>
  );
}


// ==========================================================
// FUNÇÕES DE INTELIGÊNCIA ARTIFICIAL (V3.1 - 4 TÓPICOS)
// ==========================================================

const cleanGeminiJSON = (text) => {
  if (!text) return "";
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const parseAndNormalize = (text) => {
    try {
        const cleanText = cleanGeminiJSON(text);
        const json = JSON.parse(cleanText);
        if (Array.isArray(json)) {
            console.log("IA retornou Array, normalizando para Objeto...");
            return json[0];
        }
        return json;
    } catch (e) {
        console.error("Erro ao fazer parse do JSON:", e);
        return null;
    }
}

// --- FALLBACK (ATUALIZADO PARA 4 TÓPICOS) ---
const generateBriefingFallback = async (news, apiKey) => {
    console.log("Iniciando Fallback (Gemini 1.5)...");
    
    if (!news || news.length === 0) return null;
    
    const context = news.slice(0, 15).map(n => `- ${n.title}`).join('\n');
    
    const prompt = `
      Atue como editor de notícias. Resuma os fatos abaixo em um JSON estrito.
      
      NOTÍCIAS:
      ${context}
      
      SCHEMA JSON OBRIGATÓRIO (4 TÓPICOS):
      { 
        "vibe_emoji": "🔥", 
        "vibe_title": "Resumo Rápido", 
        "topics": [
          { "tag": "Geral", "summary": "Resumo conciso de 20 palavras." },
          { "tag": "Destaques", "summary": "Outros pontos relevantes." },
          { "tag": "Mercados", "summary": "Movimentações financeiras ou políticas." },
          { "tag": "Variedades", "summary": "Esportes, cultura ou tecnologia." }
        ] 
      }
    `;

    try {
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });
        
        const data = await response.json();
        
        if (data.error) { return null; }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Vazio");
        
        return parseAndNormalize(text);
    } catch (e) {
        console.error("Erro fatal no sistema de Fallback:", e);
        return null;
    }
};


// --- NOVA FUNÇÃO DE IA: RESUMO NEUTRO PARA CLUSTER ---
const generateNeutralSummaryForCluster = async (articles, apiKey) => {
    if (!articles || articles.length < 2 || !apiKey) return null;

    // Envia apenas o essencial para a IA
    const context = articles.map(a => `- ${a.title}`).join('\n');

    const prompt = `
      Você é um editor de notícias sênior e imparcial. Sua tarefa é sintetizar as manchetes abaixo em um único parágrafo coeso e neutro.
      - Resuma os fatos principais em 2-3 frases.
      - Não adicione opiniões ou informações externas.
      - Foque no "o quê", "quem" e "onde".
      - A resposta deve ser em Português do Brasil.

      MANCHETES PARA SINTETIZAR:
      ${context}
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
            })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível gerar um resumo no momento.";
    } catch (error) {
        console.error("Erro ao gerar resumo de cluster:", error);
        return null;
    }
};


// --- FUNÇÃO DE IA: ANÁLISE COMPLETA (ABA AI) ---
const generateFullAnalysis = async (text, apiKey) => {
  if (!text || text.length < 100 || !apiKey) return null;

  // Limpa e corta para economizar tokens
  const cleanText = text.replace(/<[^>]*>?/gm, ' ').slice(0, 12000);

  const prompt = `
  Aja como um Analista de Inteligência Sênior. Analise o texto fornecido.
  
  GERE UM JSON ESTRITO COM ESTA ESTRUTURA EXATA (Tudo em PT-BR):
  {
    "summaries": {
      "executive": "Resumo formal, direto e jornalístico (3 parágrafos curtos e bem explicados).",
      "tldr": "Resumo em 1 única frase de impacto (Too Long Didn't Read).",
      "eli5": "Explicação didática como se fosse para uma criança de 5 anos (analogias).",
      "bullets": ["Ponto chave 1", "Ponto chave 2", "Ponto chave 3", "Ponto chave 4"]
    },
    "mindmap": {
    "center": "Tema Central (Max 3 palavras)",
    "nodes": ["Nó A", "Nó B", "Nó C", "Nó D"]
},
"contextualTerms": [
    {
        "term": "Nó A (Nome exato do nó do mindmap)",
        "context": "Definição do termo + Explique a importância específica dele NESTA notícia. SEJA DENSO E DETALHADO. NÃO use frases genéricas como 'Contexto geral'. Mínimo 25 palavras.",
        "sentiment": "neutral", 
        "evidence_quotes": ["Citação exata do texto onde o termo aparece."]
    },
    { "term": "Nó B", "context": "...", "sentiment": "positive", "evidence_quotes": ["..."] },
    { "term": "Nó C", "context": "...", "sentiment": "negative", "evidence_quotes": ["..."] },
    { "term": "Nó D", "context": "...", "sentiment": "neutral", "evidence_quotes": ["..."] }
],
    "timeline": [
                      { "time": "Passado (Causa Raiz)", "event": "O que causou o contexto geral desta notícia?" },
                      { "time": "Recente (Gatilho)", "event": "Qual foi o evento específico que levou diretamente a esta matéria?" },
                      { "time": "Hoje (Fato Principal)", "event": "Qual é o fato principal reportado na notícia de hoje?" }
                  ],
    "future": {
      "optimistic": "Melhor cenário possível a longo prazo.",
      "pessimistic": "Pior cenário/Riscos envolvidos.",
      "probable": "O que realmente deve acontecer (análise realista)."
    }
  }

  TEXTO:
  ${cleanText}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) return null;

       const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // ==========================================================
    // === INÍCIO DA CORREÇÃO: Lógica de Limpeza do JSON ===
    // ==========================================================
    if (!jsonString) {
        console.error("Erro Full Analysis: A IA não retornou nenhum texto.");
        return null;
    }
    
    // 1. Remove os blocos de código markdown (como já fazia)
    let cleanedString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 2. Tenta remover vírgulas finais traiçoeiras antes de fechar chaves ou colchetes.
    // Esta expressão regular busca por ",}" e substitui por "}" e busca por ",]" e substitui por "]".
    cleanedString = cleanedString.replace(/,\s*([}\]])/g, "$1");

    // 3. Tenta fazer o parse do JSON limpo.
    return JSON.parse(cleanedString);
    // ==========================================================
    // === FIM DA CORREÇÃO ===
    // ==========================================================

  } catch (error) {
    // Agora o log de erro será mais útil, mostrando o JSON problemático
    console.error("Erro Full Analysis:", error);
    // Se quiser ver o que a IA retornou de errado, adicione este log:
    // console.log("JSON problemático recebido da IA:", jsonString);
    return null;
  }
};


// --- FUNÇÃO DE IA: CLUSTERIZAÇÃO NARRATIVA (MODELO 2.5 FLASH) ---
// --- FUNÇÃO DE IA: CLUSTERIZAÇÃO NARRATIVA (V3 - 4 CARDS + TEXTO FLUÍDO) ---
const generateSmartClustering = async (news, apiKey, limit = 50) => { 
  if (!news || news.length < 10 || !apiKey) return null;

  // Envia apenas o essencial para economizar, mas inclui o início do resumo para contexto
  const simplifiedNews = news.slice(0, limit).map((n, index) => 
    `${index}|${n.source}|${n.title}`
  ).join('\n');

  const prompt = `
  Você é um Editor Sênior de Jornalismo. Analise as manchetes abaixo.
  
  SUA MISSÃO:
  Identificar os 5 (CINCO) maiores acontecimentos do momento e criar grupos.
  
PARA CADA GRUPO, CRIE:
1.  Um título que seja uma FRASE JORNALÍSTICA COMPLETA, clara e direta.
    - NÃO faça listas de palavras (ex: "Mercado, Dólar, Bolsa").
    - FAÇA uma frase explicativa (ex: "Dólar cai e Bolsa sobe com otimismo sobre juros nos EUA").
    - O título deve ser claro, direto e em Português do Brasil (Máx 12 palavras).
2.  Um resumo complementar para o título principal (20-30 palavras). // <-- ADICIONE ESTA LINHA
3.  O índice da melhor notícia para servir de imagem de capa (representative_index).
4.  Os índices das notícias relacionadas (related_indices), contendo pelo menos 2 índices.

RETORNE APENAS JSON:
[
  {
    "ai_title": "Frase jornalística explicativa (Máx 12 palavras)",
    "ai_summary": "Resumo complementar de 20-30 palavras para o título.", // <-- ADICIONE ESTA LINHA
    "representative_index": 0,
    "related_indices": [0, 5, 8] 
  }
]
  DADOS:
  ${simplifiedNews}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) return null;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

    const hydratedJson = json.map(cluster => {
        const mainArticle = news[cluster.representative_index];
        const repImage = mainArticle ? mainArticle.img : null;
        const uniqueArticles = [];
        const seenSources = new Set();

        if (cluster.related_indices && Array.isArray(cluster.related_indices)) {
            cluster.related_indices.forEach(idx => {
                const article = news[idx];
                if (article && !seenSources.has(article.source)) {
                    seenSources.add(article.source);
                    uniqueArticles.push({ ...article, ai_sentiment: 'neutral' }); 
                }
            });
        }

        return { 
            ai_title: cluster.ai_title,
            ai_summary: cluster.ai_summary,
            representative_image: repImage,
            related_articles: uniqueArticles 
        };
    }).filter(c => c.related_articles.length > 0); 

    // Garante que retornamos no máximo 4, conforme pedido, caso a IA se empolgue
    return Array.isArray(hydratedJson) ? hydratedJson.slice(0, 5) : null;

  } catch (error) {
    console.error("Erro Smart Clustering:", error);
    return null;
  }
};

// --- NOVO SUB-COMPONENTE: CARD DE ATIVO FINANCEIRO (COM ACORDEÃO) ---
const AssetCard = ({ asset, allNews, openArticle, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Encontra as notícias relacionadas a este ativo para mostrar no acordeão
    const relatedArticles = useMemo(() => {
        if (!allNews || !asset.keywords) return [];
        // Filtra todas as notícias que contenham alguma das palavras-chave no título
        return allNews.filter(n => {
            const title = n.title.toLowerCase();
            return asset.keywords.some(k => title.includes(k));
        }).slice(0, 4); // Limita a 4 notícias para não sobrecarregar
    }, [asset.keywords, allNews]);

    // Escolhe o ícone com base no nome do ativo
    const getIcon = (assetName) => {
        const name = assetName.toUpperCase();
        if (name.includes('BTC') || name.includes('BITCOIN')) return <Bitcoin size={20} />;
        if (name.includes('USD') || name.includes('DÓLAR')) return <DollarSign size={20} />;
        if (name.includes('EUR') || name.includes('EURO')) return <Euro size={20} />;
        if (name.includes('IBOV') || name.includes('BOLSA')) return <Activity size={20} />;
        return <TrendingUp size={20} />;
    };

    return (
        <div className={`rounded-2xl transition-all duration-300 overflow-hidden ${isDarkMode ? 'bg-zinc-900 border border-white/10' : 'bg-white border border-zinc-200 shadow-sm'}`}>
            {/* ÁREA CLICÁVEL (CABEÇALHO) */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-4 w-full text-left outline-none flex justify-between items-center group"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-black/20' : 'bg-zinc-100'} text-purple-400`}>
                        {getIcon(asset.name)}
                    </div>
                    <span className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                        {asset.name}
                    </span>
                </div>
                
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                    <ChevronRight size={20} className="text-zinc-500" />
                </div>
            </button>

            {/* ÁREA DO ACORDEÃO (NOTÍCIAS) */}
            <div 
                className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className={`border-t px-2 pb-2 space-y-1 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-zinc-50'}`}>
                        {relatedArticles.length > 0 ? (
                            relatedArticles.map((news) => (
                                <button 
                                    key={news.id}
                                    onClick={(e) => { e.stopPropagation(); openArticle(news); }}
                                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left group ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                    <img src={news.logo} className="w-6 h-6 rounded-full border border-white/10 flex-shrink-0 object-cover" alt="Logo" onError={(e) => e.target.style.display='none'} />
                                    <span className={`text-xs font-semibold leading-tight line-clamp-2 ${isDarkMode ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-black'}`}>
                                        {news.title}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-center text-[10px] opacity-50">
                                Sem notícias recentes para este ativo.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};




// --- WIDGET: MARKET PULSE (V6 - DESIGN PREMIUM E IA INTEGRADA) ---
const MarketPulseWidget = ({ newsData, apiKey, isDarkMode, openArticle }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success'

  // Lógica para verificar se o mercado está aberto (simplificado para o horário)
  const isMarketOpen = useMemo(() => {
    const currentHour = new Date().getHours();
    // Considera o mercado aberto entre 9h e 18h
    return currentHour >= 9 && currentHour < 18;
  }, []);

  // A lógica heurística permanece a mesma, como fallback e estado inicial
  const heuristicData = useMemo(() => {
    if (!newsData || newsData.length === 0) return { topMovers: [], allAssets: [] };
    const financialSources = ['Uol Economia', 'Investing', 'Istoé Dinheiro', 'Valor Econômico'];
    const marketNews = newsData.filter(n => financialSources.includes(n.source));
    const assets = [
        { name: 'Dólar', keywords: ['dólar', 'dolar', 'usd', 'câmbio'] },
        { name: 'Ibovespa', keywords: ['ibovespa', 'b3', 'ações', 'bolsa', 'índice'] },
        { name: 'Bitcoin', keywords: ['bitcoin', 'btc', 'cripto'] },
        { name: 'Euro', keywords: ['euro', 'eur'] },
        { name: 'Juros', keywords: ['juros', 'selic', 'copom', 'inflação'] },
    ];
    const topicScores = new Map();
    assets.forEach(asset => topicScores.set(asset.name, { count: 0, latestArticle: null }));
    marketNews.forEach(article => {
        const title = article.title.toLowerCase();
        for (const asset of assets) {
            if (asset.keywords.some(k => title.includes(k))) {
                const score = topicScores.get(asset.name);
                score.count++;
                if (!score.latestArticle || new Date(article.rawDate) > new Date(score.latestArticle.rawDate)) {
                    score.latestArticle = article;
                }
                break; 
            }
        }
    });
    const topMovers = Array.from(topicScores.entries())
      .filter(([name, data]) => data.count > 0 && data.latestArticle)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)
      .map(([name, data]) => ({ name, article: data.latestArticle }));
    return { topMovers, allAssets: assets };
  }, [newsData]);

  // Função para chamar a IA
  const runAI = async () => {
      setStatus('loading');
      const result = await generateMarketAnalysis(newsData, apiKey);
      if (result) {
          setAnalysisData(result);
          setStatus('success');
      } else {
          setStatus('idle');
      }
  };

  // Helper para classes de borda da IA
  const getTrendBorder = (trend) => {
    if (trend === 'up') return 'border-emerald-500';
    if (trend === 'down') return 'border-rose-500';
    return 'border-blue-500'; // Azul para estável/neutro
  };
  
  // RENDERIZAÇÃO
  
  if (status === 'loading') {
      return (
          <div className={`h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-[1.5rem] ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="relative"><div className="absolute inset-0 bg-purple-500 blur-2xl animate-pulse"></div><div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/50 border-white'}`}><BrainCircuit size={32} className="text-purple-400" /></div></div>
              <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Analisando o Mercado...</h3>
              <p className={`text-sm max-w-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>A IA está correlacionando dados e notícias para gerar seu briefing financeiro.</p>
          </div>
      );
  }

  if (status === 'success' && analysisData) {
      return (
          <div className={`p-4 rounded-[1.5rem] space-y-4 animate-in fade-in ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              {/* CABEÇALHO DA ANÁLISE IA */}
              <div className={`p-4 rounded-xl text-center relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-purple-900/50 to-zinc-900 border border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-white border border-purple-100'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <BrainCircuit size={14} className="text-purple-400"/>
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Análise do Dia</span>
                </div>
                <p className="text-sm font-bold text-purple-400">{analysisData.market_status}</p>
                <h3 className={`font-semibold mt-1 text-base ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{analysisData.summary}</h3>
              </div>

              {/* MOVERS DA IA - AGORA COM NOVO DESIGN E BORDAS */}
              <div className="space-y-3">
                  {analysisData.movers.map((mover, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border-2 ${isDarkMode ? 'bg-black/20' : 'bg-zinc-100'} ${getTrendBorder(mover.trend)}`}>
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{mover.asset}</span>
                              </div>
                              {mover.article && (
                                <button onClick={() => openArticle(mover.article)} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-purple-400 transition-colors">
                                    Ver fonte <img src={mover.article.logo} className="w-4 h-4 rounded-full" />
                                </button>
                              )}
                          </div>
                          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              {mover.reason}
                          </p>
                      </div>
                  ))}
              </div>
              
              <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] font-mono opacity-40">Análise via Gemini 1.5 Flash</span>
                  <button onClick={() => setStatus('idle')} className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Voltar</button>
              </div>
          </div>
      );
  }

  // ESTADO PADRÃO (HEURÍSTICO)
  return (
    <div className="space-y-4">
        {/*
          NOVO: Se a IA já rodou uma vez, o resumo dela continua visível aqui!
          Isso cria uma sensação de persistência e inteligência.
        */}
        {analysisData && (
          <div className={`p-4 rounded-xl text-center relative overflow-hidden animate-in fade-in ${isDarkMode ? 'bg-gradient-to-br from-purple-900/50 to-zinc-900 border border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-white border border-purple-100'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
                <BrainCircuit size={14} className="text-purple-400"/>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Última Análise IA</span>
            </div>
            <h3 className={`font-semibold text-base ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{analysisData.summary}</h3>
          </div>
        )}

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Destaques do Dia</h4>
              {/* NOVO: INDICADOR DE MERCADO ABERTO/FECHADO */}
              {isMarketOpen ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[9px] font-bold uppercase"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>Aberto</div>
              ) : (
                <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-bold uppercase"><span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>Fechado</div>
              )}
            </div>
            <button onClick={runAI} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition">
                <Sparkles size={12} /> Análise IA
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heuristicData?.topMovers?.map(({ name, article }, idx) => (
                <div key={idx} className={`p-4 rounded-2xl flex flex-col justify-between h-36 ${isDarkMode ? 'bg-zinc-900 border border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
                    <div><span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{name}</span><h4 className={`font-bold text-sm leading-tight line-clamp-2 mt-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{article.title}</h4></div>
                    <button onClick={() => openArticle(article)} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors self-start"><img src={article.logo} className="w-4 h-4 rounded-full" />Ler na fonte</button>
                </div>
            ))}
        </div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 pt-2">Explorar Ativos</h4>
        <div className="space-y-2">
            {heuristicData?.allAssets?.map((asset) => (
                <AssetCard key={asset.name} asset={asset} allNews={newsData} openArticle={openArticle} isDarkMode={isDarkMode} />
            ))}
        </div>
    </div>
  );
};


// --- FUNÇÃO DE IA: RAIO-X CONTEXTUAL (PARA ABA WEB/MAGIC) ---
const generateNewsContext = async (fullText, apiKey) => {
  // Verificações de segurança
  if (!fullText || fullText.length < 200) {
      console.warn("Texto muito curto para análise");
      return null;
  }
  if (!apiKey) {
      alert("Chave de API não configurada para o Leitor.");
      return null;
  }

  // Otimização de Payload
  const cleanText = fullText.slice(0, 8000).replace(/\s+/g, ' ').trim();

  const prompt = `
  Você é um Analista de Inteligência Sênior. Analise o texto da notícia.

  SUA MISSÃO:
  Identificar entre 4 a 6 termos, nomes, siglas ou conceitos que são CRUCIAIS para entender essa história.
  
  REGRAS:
  1. NÃO explique o que é (Definição).
  2. EXPLIQUE O PAPEL DELE NESTA NOTÍCIA (Contexto).
  3. Seja breve (máx 20 palavras).

  RETORNE APENAS JSON:
  [
    {
      "term": "Termo exato encontrado no texto",
      "context": "Explicação contextual curta."
    }
  ]

  TEXTO:
  ${cleanText}
  `;

  try {
    // CORREÇÃO 1: Atualizado para gemini-2.5-flash
    // CORREÇÃO 2: Garantido method: "POST"
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.3
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
        console.error("Erro API Reader:", data.error);
        return null;
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) return null;

    // Limpeza de Markdown (caso a IA mande ```json)
    const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(jsonString);
    
    return Array.isArray(json) ? json : null;

  } catch (error) {
    console.error("Erro fatal no NewsContext:", error);
    return null;
  }
};

// --- FUNÇÃO SMART DIGEST (MODELO 2.5 FLASH) ---
const generateBriefing = async (news, apiKey) => {
  if (!news || news.length === 0) return null;
  if (!apiKey) {
      alert("API Key não configurada!");
      return null;
  }

  const context = news.slice(0, 40).map((n, index) => {
      const cleanSummary = n.summary ? n.summary.replace(/<[^>]*>?/gm, '').slice(0, 100) : "";
      return `Ref:${index}|${n.source}|${n.title}|${cleanSummary}`;
  }).join('\n');

  const prompt = `
  Identifique os 4 maiores temas. Retorne JSON:
  {
    "vibe_emoji": "Emoji",
    "vibe_title": "Manchete (3-6 palavras)",
    "topics": [
      { "tag": "Categoria", "summary": "Resumo...", "source_indices": [0] }
    ]
  }
  DADOS:
  ${context}
  `;

  try {
    // ATUALIZADO PARA gemini-2.5-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();

    if (data.error) return null;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const finalData = parseAndNormalize(text);
    if (!finalData || !finalData.topics) return null;

    finalData.topics = finalData.topics.map(topic => {
        const indices = topic.source_indices || [];
        const relatedArticles = indices.map(idx => news[idx]).filter(Boolean);
        return { ...topic, articles: relatedArticles };
    });

    return finalData;

  } catch (error) {
    console.warn("Erro fatal SmartDigest:", error);
    return null;
  }
};

const MarketPulseHeuristicWidget = ({ onGenerateWithAI, isDarkMode }) => {
    // Reutilize o mesmo hook/lógica do HeaderDashboard para buscar dados do Yahoo
    // Aqui, vou simular com dados estáticos para o exemplo.
    const marketData = {
        'IBOV': { val: '128.5k', up: true },
        'USD': { val: '5,02', up: false },
        'BTC': { val: '68.1k', up: true },
        'PETR4': { val: '38,50', up: false },
    };

    return (
        <div className="px-2 mb-8">
            <div className="p-5 rounded-[2rem] bg-zinc-900 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-white">Pulso do Mercado</h3>
                    <button 
                        onClick={onGenerateWithAI}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-600 text-white"
                    >
                        <Sparkles size={14} /> Análise IA
                    </button>
                </div>
                
                {/* Grid com os dados da API do Yahoo */}
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(marketData).map(([key, value]) => (
                        <div key={key} className={`p-3 rounded-xl ${value.up ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                            <span className="text-xs font-bold text-zinc-400">{key}</span>
                            <div className="flex items-end justify-between">
                                <span className="text-xl font-black text-white">{value.val}</span>
                                {value.up ? <TrendingUp size={18} className="text-emerald-500"/> : <TrendingDown size={18} className="text-rose-500"/>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// No seu MarketPulseWidget, você faria:
// if (status === 'idle') return <MarketPulseHeuristicWidget onGenerateWithAI={runAI} ... />



// --- FUNÇÃO TREND RADAR (MODELO 2.5 FLASH) ---
// --- FUNÇÃO TREND RADAR (VOLTANDO A USAR O POOL) ---
const generateTrendRadar = async (news, apiKey) => {
  if (!news || news.length === 0) return null;

  const context = news.slice(0, 40).map((n, index) => 
    `${index}|${n.title}|${n.summary ? n.summary.slice(0, 60) : ''}`
  ).join('\n');

  // ==========================================================
  // === INÍCIO DA ALTERAÇÃO: O NOVO PROMPT ===
  // ==========================================================
  const prompt = `
Você é um Editor de Primeira Página. Analise as notícias e identifique 8 tendências com diferentes níveis de impacto.

  REGRAS OBRIGATÓRIAS:
  1.  **TÓPICO COMO MANCHETE:** O campo "topic" DEVE ser uma micro-manchete curta e dinâmica (máx. 5 palavras) que explique a tendência.
      - NÃO FAÇA: "Inflação"
      - FAÇA: "Inflação Preocupa Mercados Globais"
      - FAÇA: "Avanço da IA na Saúde"
  2.  **VARIEDADE DE SCORES:** Sua resposta DEVE incluir tópicos em diferentes faixas de score (quente, médio, frio).
  3.  **JSON ESTRITO:** Retorne APENAS um array JSON com 8 objetos.

  FORMATO DO JSON:
  [
    {
      "topic": "Micro-Manchete da Tendência", // <<-- A GRANDE MUDANÇA
      "score": 1, // Número de 1 a 10
      "hex": "#3b82f6", // Cor correspondente
      "summary": "Um fato curto e direto sobre este tópico."
      "source_indices": [0, 5, 12]
    }
  ]

  DADOS PARA ANÁLISE:
  ${context}
  `;
  // ==========================================================
  // === FIM DA ALTERAÇÃO ===
  // ==========================================================

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) return null;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanText);

    return Array.isArray(json) ? json : []; 

  } catch (error) {
    console.warn("Erro Trend Radar:", error);
    return []; 
  }
};

// --- WIDGET: SMART DIGEST (DESIGN EDITORIAL PREMIUM) ---





const GlassBrowser = ({ article, onClose, isDarkMode }) => {
  // ✅ URL do seu Worker (troque se necessário)
  const WORKER_BASE = 'https://newsos-extract.paulodetarsomacedo.workers.dev';

  const [excerpt, setExcerpt] = useState('');
  const [excerptStatus, setExcerptStatus] = useState('idle'); // idle | loading | success | error
  const abortRef = useRef(null);

  // --- Raw summary vindo do RSS (ou do seu pipeline)
  const summaryRaw = (article?.summary || '').trim();

  // --- Helpers (só lógica)
  const normalize = (s) =>
    (s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const summaryNormalized = useMemo(() => normalize(summaryRaw), [summaryRaw]);

  // --- Heurísticas: detectar boilerplate e "texto-lixo" (menus/breadcrumb)
  const isBoilerplateSummary = useMemo(() => {
    const s = summaryNormalized;
    if (!s) return false;

    const boilerplateSignals = [
      'toque abaixo para ler',
      'toque abaixo para abrir',
      'toque abaixo',
      'clique abaixo para ler',
      'ler a matéria completa',
      'ler notícia completa',
      'diretamente na fonte original',
      'não foi possível extrair automaticamente',
      'nao foi possivel extrair automaticamente',
      'abra na fonte',
      'abrir na fonte',
      'matéria completa na fonte',
      'materia completa na fonte',
      'veja na fonte',
    ];

    return boilerplateSignals.some((sig) => s.includes(sig));
  }, [summaryNormalized]);

  const looksLikeMenuOrBreadcrumb = useMemo(() => {
    const s = summaryNormalized;
    if (!s) return false;

    const menuSignals = [
      'home',
      'buscar',
      'menu',
      'assine',
      'assinante',
      'entrar',
      'login',
      'cadastre',
      'cadastre-se',
      'carregando',
      'princípios editoriais',
      'principios editoriais',
      'política',
      'politica',
      'economia',
      'mundo',
      'mercados',
      'bolsas',
      'moedas',
      'commodities',
      'índices',
      'indices',
      'voltar',
      'sair',
      'conta',
    ];

    // se tiver muitos desses termos, é breadcrumb/menu e não conteúdo
    const hits = menuSignals.reduce((acc, term) => (s.includes(term) ? acc + 1 : acc), 0);

    // “hits >= 2” já pega bem esses casos de prints que você mandou
    return hits >= 2;
  }, [summaryNormalized]);

  const summaryLineCount = useMemo(() => {
    if (!summaryRaw) return 0;
    return summaryRaw
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean).length;
  }, [summaryRaw]);

  // Ajuste fino: se quiser, altere isso
  const MIN_CHARS = 240;

  const summaryTooShortByLength =
    !summaryRaw || summaryRaw.length < MIN_CHARS || summaryLineCount <= 1;

  // “Densidade ruim”: se for texto “colado” com muitas palavras curtas repetidas
  const summaryLowQualityByDensity = useMemo(() => {
    if (!summaryNormalized) return true;

    const tokens = summaryNormalized.split(' ').filter(Boolean);
    if (tokens.length < 18) return true; // muito curto

    const shortTokens = tokens.filter((t) => t.length <= 3).length;
    const ratioShort = shortTokens / tokens.length;

    // se tiver muita palavra curta, tende a ser breadcrumb/menu
    if (ratioShort > 0.38) return true;

    // repetição excessiva
    const unique = new Set(tokens).size;
    const repetitionRatio = unique / tokens.length;
    if (repetitionRatio < 0.55) return true;

    return false;
  }, [summaryNormalized]);

  // ✅ Regra final: quando extrair?
  const shouldExtract = useMemo(() => {
    // sem link, não tem o que extrair
    if (!article?.link) return false;

    // se summary é boilerplate/menu/lixo: extrai SEMPRE
    if (isBoilerplateSummary) return true;
    if (looksLikeMenuOrBreadcrumb) return true;

    // se é curto/ruim: extrai
    if (summaryTooShortByLength) return true;

    // se tem cara de “texto ruim”: extrai
    if (summaryLowQualityByDensity) return true;

    // caso contrário, aceita o summary
    return false;
  }, [
    article?.link,
    isBoilerplateSummary,
    looksLikeMenuOrBreadcrumb,
    summaryTooShortByLength,
    summaryLowQualityByDensity,
  ]);

  // ✅ Cache key por URL (session)
  const cacheKey = useMemo(() => {
    return article?.link ? `newsos_excerpt_cache:${article.link}` : null;
  }, [article?.link]);

  useEffect(() => {
    // limpa qualquer request anterior
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setExcerpt('');
    setExcerptStatus('idle');

    // sem link: não extrai
    if (!article?.link) return;

    // se não precisa extrair: para aqui
    if (!shouldExtract) return;

    // tenta cache primeiro
    if (cacheKey) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached && cached.trim().length > 0) {
        setExcerpt(cached.trim());
        setExcerptStatus('success');
        return;
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      try {
        setExcerptStatus('loading');
        setExcerpt('');

        const url = `${WORKER_BASE}/?url=${encodeURIComponent(article.link)}`;

        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        const data = await res.json().catch(() => null);

        if (controller.signal.aborted) return;

        const extracted = data?.excerpt ? String(data.excerpt).trim() : '';

        if (res.ok && extracted.length > 0) {
          setExcerpt(extracted);
          setExcerptStatus('success');
          if (cacheKey) sessionStorage.setItem(cacheKey, extracted);
        } else {
          setExcerpt('');
          setExcerptStatus('error');
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setExcerpt('');
        setExcerptStatus('error');
      } finally {
        if (!controller.signal.aborted) abortRef.current = null;
      }
    };

    run();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.link, shouldExtract]);

  const openInNativeBrowser = async () => {
    try {
      await Browser.open({
        url: article.link,
        presentationStyle: 'fullscreen',
        toolbarColor: isDarkMode ? '#000000' : '#FFFFFF',
      });
      onClose();
    } catch (e) {
      window.open(article.link, '_blank');
    }
  };

  // ✅ Texto final exibido no card
  // Regra:
  // - se não precisa extrair => usa summary
  // - se precisa extrair => usa excerpt (quando chegar)
  // - se falhar => fallback
  const finalText =
    (!shouldExtract ? summaryRaw : '') ||
    (excerpt && excerpt.length > 0 ? excerpt : '') ||
    'Toque abaixo para ler a matéria completa diretamente na fonte original.';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        className={`
          relative w-[95vw] h-[85vh] md:w-[800px] md:h-[90vh]
          rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col 
          transition-all transform scale-100 animate-in zoom-in-95 duration-300
          ${isDarkMode
            ? 'bg-zinc-900/95 border-white/10 shadow-purple-500/20'
            : 'bg-white/95 border-white/40 shadow-xl'}
          backdrop-blur-2xl
        `}
      >
        {/* Imagem de Capa (Hero) */}
        <div className="relative h-56 md:h-72 w-full flex-shrink-0">
          <img
            src={article.img || article.logo}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white backdrop-blur-md border border-white/20 hover:bg-black/50 transition active:scale-90"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-4 left-6 flex items-center gap-2">
            <img
              src={article.logo}
              className="w-6 h-6 rounded-full border border-white/50 bg-white"
            />
            <span className="text-xs font-bold text-white uppercase tracking-widest shadow-black drop-shadow-md">
              {article.source}
            </span>
          </div>
        </div>

        {/* Conteúdo do Card */}
        <div className="p-6 md:p-8 flex flex-col flex-1 overflow-y-auto">
          <h2
            className={`text-2xl md:text-3xl font-black leading-tight mb-4 font-serif ${
              isDarkMode ? 'text-white' : 'text-zinc-900'
            }`}
          >
            {article.title}
          </h2>

          <div className="flex-1">
            <p
              className={`text-base md:text-lg leading-relaxed ${
                isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
              }`}
            >
              {finalText}
            </p>

            {/* ✅ Indicador discreto */}
            {shouldExtract && excerptStatus === 'loading' && (
              <p
                className={`mt-3 text-[10px] font-mono uppercase tracking-widest ${
                  isDarkMode ? 'text-white/30' : 'text-black/30'
                }`}
              >
                extraindo 15 linhas da fonte…
              </p>
            )}

            {shouldExtract && excerptStatus === 'error' && (
              <p
                className={`mt-3 text-[10px] font-mono uppercase tracking-widest ${
                  isDarkMode ? 'text-white/30' : 'text-black/30'
                }`}
              >
                não foi possível extrair automaticamente — abra na fonte.
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-dashed border-zinc-500/20">
            <button
              onClick={openInNativeBrowser}
              className={`
                w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg
                ${isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-black text-white hover:bg-zinc-800'}
              `}
            >
              Ler Notícia Completa <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};





const SmartDigestWidget = ({ newsData, getApiKey, isDarkMode, refreshTrigger }) => {
  const [digest, setDigest] = useState(null);
  const [status, setStatus] = useState('idle');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [glassArticle, setGlassArticle] = useState(null);
  const [voices, setVoices] = useState([]);

  // Micro-sinal “gerado agora” + timestamp
  const [justGenerated, setJustGenerated] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);

  const SESSION_KEY = 'newsos_current_session_digest';

  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  useEffect(() => {
    const loadVoices = () => {
      if (!synthRef.current) return;
      const available = synthRef.current.getVoices();
      setVoices(available);
    };

    if (synthRef.current) {
      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  // 1. CARREGAR DADOS DA SESSÃO ATUAL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedData = sessionStorage.getItem(SESSION_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        const now = Date.now();
        const isValidTime = parsed.timestamp && (now - parsed.timestamp < 2 * 60 * 60 * 1000);

        if (parsed && parsed.data && parsed.data.topics && isValidTime) {
          setDigest(parsed.data);
          setStatus('success');
          setLastGeneratedAt(parsed.timestamp || null);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch (e) {
        console.error("Erro ao carregar Digest da sessão", e);
      }
    }
  }, []);

  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    if (diffMs < 10 * 1000) return 'Atualizado agora';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `Atualizado há ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Atualizado há ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    return `Atualizado há ${diffH}h`;
  };

  const handleGenerate = async () => {
    const currentApiKey = getApiKey('widgets');

    if (!currentApiKey) {
      alert("Configure sua API Key nas configurações primeiro.");
      return;
    }

    setStatus('loading');
    setExpandedIndex(null);

    await new Promise((r) => setTimeout(r, 800));

    const result = await generateBriefing(newsData, currentApiKey);

    if (result) {
      setDigest(result);
      setStatus('success');

      const now = Date.now();
      setLastGeneratedAt(now);

      setJustGenerated(true);
      window.setTimeout(() => setJustGenerated(false), 1400);

      const sessionPayload = {
        timestamp: now,
        data: result,
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
      }
    } else {
      setStatus('error');
    }
  };

  const cancelSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handlePlayBriefing = () => {
    if (!synthRef.current || !digest) return;
    if (isSpeaking) {
      cancelSpeech();
      return;
    }

    setIsSpeaking(true);

    const intro = `Briefing Executivo do News O S. ${digest.vibe_title}.`;
    const content = digest.topics.map((t) => `${t.tag}. ${t.summary}`).join('. ... Próximo: ');
    const finalText = `${intro} ... ${content}. ... Fim do resumo.`;

    const utterance = new SpeechSynthesisUtterance(finalText);

    const ptVoices = voices.filter((v) => v.lang.includes('pt-BR'));

    let bestVoice = ptVoices.find((v) => v.name.includes('Google'));
    if (!bestVoice) {
      bestVoice = ptVoices.find(
        (v) => v.name.includes('Luciana (Aprimorada)') || v.name.includes('Joana')
      );
    }
    if (!bestVoice) bestVoice = ptVoices.find((v) => v.name.includes('Enhanced'));
    if (!bestVoice) bestVoice = ptVoices[0];

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const toggleExpand = (index) => {
    const next = expandedIndex === index ? null : index;
    setExpandedIndex(next);
  };

  const getTag3DStyle = (index) => {
    const base3D = "shadow-sm border-t border-b";
    if (isDarkMode) {
      const styles = [
        `bg-blue-500/10 text-blue-300 border-blue-500/20 ${base3D}`,
        `bg-orange-500/10 text-orange-300 border-orange-500/20 ${base3D}`,
        `bg-emerald-500/10 text-emerald-300 border-emerald-500/20 ${base3D}`,
        `bg-purple-500/10 text-purple-300 border-purple-500/20 ${base3D}`,
      ];
      return styles[index % styles.length];
    } else {
      const styles = [
        `bg-blue-50 text-blue-700 border-blue-100 ${base3D}`,
        `bg-orange-50 text-orange-700 border-orange-100 ${base3D}`,
        `bg-emerald-50 text-emerald-700 border-emerald-100 ${base3D}`,
        `bg-purple-50 text-purple-700 border-purple-100 ${base3D}`,
      ];
      return styles[index % styles.length];
    }
  };

  // --- RENDERIZAÇÃO ---

  if (status === 'idle') {
    return (
      <div className="px-1 mb-6">
        <div
          className={`relative overflow-hidden rounded-[2rem] p-8 border transition-all shadow-lg ${
            isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'
          }`}
        >
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="mb-4 p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Sparkles size={24} className="text-white animate-pulse" />
            </div>
            <h2 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Briefing Inteligente
            </h2>
            <p
              className={`text-sm mb-6 max-w-[260px] leading-relaxed opacity-70 ${
                isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
              }`}
            >
              A IA analisa {newsData?.length || 0} fatos e cria um resumo executivo para você.
            </p>

            <button
              onClick={handleGenerate}
              className={`group relative px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest overflow-hidden shadow-xl active:scale-95 transition-all ${
                isDarkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white'
              }`}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="flex items-center gap-2 relative z-10">
                <Zap size={14} fill="currentColor" /> Gerar Agora
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="px-1 mb-6">
        <div
          className={`h-[350px] rounded-[2rem] flex flex-col items-center justify-center border relative overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'
          }`}
        >
          <div className="w-16 h-16 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin mb-6" />
          <div className="text-center space-y-1 relative z-10">
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Redigindo Briefing...
            </p>
            <p className="text-xs font-mono opacity-50 uppercase tracking-widest">Conectando Fatos</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error' || !digest) {
    return (
      <div className="px-1 mb-6">
        <div className="p-6 rounded-[2rem] bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-center">
          <p className="text-red-500 font-bold text-sm mb-2">Falha na análise.</p>
          <button
            onClick={handleGenerate}
            className="text-xs font-bold underline decoration-red-500 underline-offset-4 opacity-80 hover:opacity-100"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx="true">{`
        @keyframes reveal-up {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0px); }
        }
        @keyframes sweep-line {
          0% { transform: translateX(-120%); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
      `}</style>

      <div className="px-1 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="relative">
          {/* Contorno neutro + profundidade editorial */}
          <div
            className={`relative rounded-[2.5rem] p-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}
            style={{
              boxShadow: isDarkMode
                ? '0 30px 80px rgba(0,0,0,0.60)'
                : '0 30px 80px rgba(0,0,0,0.16)',
            }}
          >
            {/* Micro-sinal de geração */}
            <div
              className="absolute left-6 right-6 top-2 h-px overflow-hidden"
              style={{
                opacity: justGenerated ? 1 : 0,
                transition: 'opacity 280ms ease',
              }}
            >
              <div
                className="h-full"
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.35), transparent)',
                  animation: justGenerated ? 'sweep-line 900ms ease-out 1' : 'none',
                }}
              />
            </div>

            <div
              className={`
                relative overflow-hidden rounded-[2.25rem] transition-all
                ${isDarkMode ? 'bg-zinc-950 border border-white/10' : 'bg-white border border-zinc-100/60'}
              `}
            >
              {/* TOPO LIMPO: DATA AURA SILENCIOSA + LINHA EDITORIAL */}
              <div className="relative px-6 pt-6 pb-4">
                {/* Data Aura silenciosa */}
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: isDarkMode ? 0.06 : 0.04,
                    backgroundImage: isDarkMode
                      ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)'
                      : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.25) 1px, transparent 0)',
                    backgroundSize: '18px 18px',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                  }}
                />

                {/* Linha editorial em gradiente */}
                <div
                  className="relative w-full h-[2px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(59,130,246,0.9), rgba(168,85,247,0.9), rgba(249,115,22,0.9))',
                    opacity: 0.85,
                  }}
                />

                {/* Botão áudio */}
                <button
                  onClick={handlePlayBriefing}
                  className="absolute top-5 right-6 bg-black/40 backdrop-blur-md text-white p-2 rounded-full border border-white/15 shadow-lg active:scale-95 transition-transform"
                >
                  {isSpeaking ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
                </button>

                {/* Cabeçalho editorial */}
                <div
                  className="relative mt-4"
                  style={{
                    animation: 'reveal-up 420ms ease-out both',
                    animationDelay: '40ms',
                  }}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2 flex items-center gap-2">
                    <Sparkles size={12} /> Briefing Executivo
                  </span>

                  <h2 className={`text-2xl md:text-3xl font-serif font-black leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {digest.vibe_title}
                  </h2>

                  {/* Destaque temporal */}
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest ${
                        isDarkMode ? 'text-white/38' : 'text-black/38'
                      }`}
                    >
                      {getRelativeTime(lastGeneratedAt)}
                    </span>

                    {/* Chip discreto estilo AI */}
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full ${
                        isDarkMode ? 'bg-white/5 text-white/45' : 'bg-black/5 text-black/45'
                      }`}
                      style={{
                        opacity: justGenerated ? 1 : 0,
                        transform: justGenerated ? 'translateY(0px)' : 'translateY(-2px)',
                        transition: 'opacity 240ms ease, transform 240ms ease',
                      }}
                    >
                      síntese pronta
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTEÚDO */}
              <div className="px-6 pb-8 relative z-10 -mt-1">
                <div className="grid grid-cols-1 gap-4">
                  {digest.topics?.map((topic, i) => {
                    const isExpanded = expandedIndex === i;
                    // CORREÇÃO: Removemos onFocus, onBlur e tabIndex={0}
                    // para evitar o duplo toque no mobile.

                    return (
                      <div
                        key={i}
                        onClick={() => toggleExpand(i)}
                        className={`
                          group relative p-5 rounded-2xl transition-all duration-300 cursor-pointer border outline-none
                          ${isDarkMode
                            ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'
                            : 'bg-zinc-50 border-zinc-200 hover:bg-white'}
                          ${isExpanded ? (isDarkMode ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'border-indigo-500/30 shadow-lg') : ''}
                        `}
                        style={{
                          animation: 'reveal-up 420ms ease-out both',
                          animationDelay: `${120 + i * 60}ms`,
                        }}
                      >
                        {/* Barra lateral sutil */}
                        <div
                          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                          style={{
                            opacity: isExpanded ? 1 : 0,
                            transition: 'opacity 220ms ease',
                            background: 'linear-gradient(180deg, rgba(59,130,246,0.9), rgba(168,85,247,0.9), rgba(249,115,22,0.85))',
                          }}
                        />

                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${getTag3DStyle(i)}`}>
                            {topic.tag}
                          </span>
                          <ChevronRight
                            size={14}
                            className={`opacity-30 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>

                        <p className={`text-sm font-medium leading-relaxed font-serif ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {topic.summary}
                        </p>

                        {/* FONTES */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-dashed border-zinc-500/20 animate-in slide-in-from-top-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">
                              Fontes Analisadas:
                            </p>
                            <div className="space-y-2">
                              {topic.articles?.map((article, idx) => (
                                <div
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGlassArticle(article);
                                  }}
                                  className={`
                                    flex items-center gap-3 p-3 rounded-xl border transition-colors
                                    ${isDarkMode
                                      ? 'bg-black/30 border-white/10 hover:bg-white/5'
                                      : 'bg-white border-zinc-200 hover:bg-zinc-50'}
                                  `}
                                >
                                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                    <img
                                      src={article.logo}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                      loading="lazy"
                                    />
                                  </div>

                                  <div className="flex flex-col min-w-0">
                                    <span className={`text-[9px] font-bold uppercase tracking-wide truncate ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                      {article.source}
                                    </span>
                                    <span className={`text-xs font-bold truncate leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                                      {article.title}
                                    </span>
                                  </div>

                                  <ArrowRight size={12} className="opacity-30 ml-auto" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-6 flex justify-between items-center opacity-40"
                  style={{
                    animation: 'reveal-up 420ms ease-out both',
                    animationDelay: `${120 + (digest.topics?.length || 0) * 60 + 120}ms`,
                  }}
                >
                  <span className="text-[10px] font-mono">Análise via Gemini 2.5</span>
                  <button
                    onClick={handleGenerate}
                    className="p-2 hover:text-indigo-500 transition-colors"
                    title="Atualizar Briefing"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GLASS */}
          {glassArticle && (
            <GlassBrowser
              article={glassArticle}
              onClose={() => setGlassArticle(null)}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </>
  );
};

// ==========================================================
// === COLE A PARTIR DAQUI, SUBSTITUINDO TUDO ATÉ O FIM DO WIDGET ===
// ==========================================================

const generateHeuristicClustersV2 = (news) => {
    if (!news || news.length < 5) return [];

    const SOURCE_WEIGHTS = { 'G1': 3, 'CNN Brasil': 3, 'O Globo': 2.5, 'Band': 2, 'Estadão': 2, 'Folha de S.Paulo': 2, 'Jovem Pan': 1.5, 'Metropoles': 1.5, };
    const DEFAULT_WEIGHT = 1;
    const SIMILARITY_THRESHOLD = 0.58;
    const CLUSTER_LIMIT = 4; // Agora são 4 clusters

    const articles = [...news.slice(0, 200)];
    let potentialClusters = [];
    const articlesUsed = new Set();

    for (let i = 0; i < articles.length; i++) {
        if (articlesUsed.has(articles[i].id)) continue;
        let currentCluster = { related_articles: [articles[i]], sourcesInCluster: new Set([articles[i].source]) };
        articlesUsed.add(articles[i].id);

        for (let j = i + 1; j < articles.length; j++) {
            if (articlesUsed.has(articles[j].id)) continue;
            const similarity = stringSimilarity.compareTwoStrings(articles[i].title, articles[j].title);
            if (similarity >= SIMILARITY_THRESHOLD && !currentCluster.sourcesInCluster.has(articles[j].source)) {
                currentCluster.related_articles.push(articles[j]);
                currentCluster.sourcesInCluster.add(articles[j].source);
                articlesUsed.add(articles[j].id);
            }
        }
        if (currentCluster.related_articles.length > 1) {
            potentialClusters.push(currentCluster);
        }
    }

    const scoredClusters = potentialClusters.map(cluster => {
        const uniqueSources = new Set(cluster.related_articles.map(a => a.source));
        let sourceImpact = 0;
        uniqueSources.forEach(sourceName => {
            sourceImpact += (SOURCE_WEIGHTS[sourceName] || DEFAULT_WEIGHT);
        });
        const impactScore = cluster.related_articles.length * sourceImpact;
        return { ...cluster, impactScore };
    });

    const topClusters = scoredClusters.sort((a, b) => b.impactScore - a.impactScore).slice(0, CLUSTER_LIMIT);

    return topClusters.map(cluster => {
        // Ordena para pegar o título e a data mais recentes
        const sortedArticles = [...cluster.related_articles].sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        
        // Pega as fontes únicas com seus logos
        const uniqueSourcesMap = new Map();
        sortedArticles.forEach(article => {
            if (!uniqueSourcesMap.has(article.source)) {
                uniqueSourcesMap.set(article.source, article.logo);
            }
        });
        const uniqueSources = Array.from(uniqueSourcesMap, ([name, logo]) => ({ name, logo }));

        return {
            id: sortedArticles[0].id,
            representativeTitle: sortedArticles[0].title,
            latestArticleDate: sortedArticles[0].rawDate,
            uniqueSources: uniqueSources,
            related_articles: sortedArticles,
        };
    });
};
const HighlightedSummary = ({ text, keywords, onKeywordClick, isDarkMode }) => {
    if (!keywords || keywords.length === 0) {
        return <p className="text-base text-zinc-300 leading-relaxed drop-shadow-md">{text}</p>;
    }
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
        <p className="text-base text-zinc-300 leading-relaxed drop-shadow-md">
            {parts.map((part, index) => {
                const isKeyword = keywords.some(kw => part.toLowerCase() === kw.toLowerCase());
                if (isKeyword) {
                    return (
                        <button key={index} onClick={() => onKeywordClick(part)}
                            className={`mx-1 px-1 py-0 rounded-md font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg ${isDarkMode ? 'bg-blue-700 hover:bg-yellow-500/40 text-pink-500' : 'bg-blue-700/50 hover:bg-yellow-200 text-amber-400'}`}>
                            {part}
                        </button>
                    );
                }
                return part;
            })}
        </p>
    );
};

const KeywordFocusModal = ({ data, onClose, openArticle, isDarkMode }) => {
    if (!data) return null;
    const { keyword, articles } = data;
    return (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md h-[70vh] flex flex-col rounded-3xl shadow-2xl border animate-in zoom-in-95 ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white'}`}>
                <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}><Search size={16} className="text-yellow-500" /></div>
                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Foco em: {keyword}</h3>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {articles.map(article => (
                        <button key={article.id} onClick={() => openArticle(article)} className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'}`}>
                            <img src={article.logo} className="w-8 h-8 rounded-full border border-black/10 shrink-0" onError={(e) => e.target.style.display = 'none'} />
                            <div className="min-w-0">
                                <p className={`text-sm font-bold leading-tight line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{article.title}</p>
                                <span className="text-xs text-zinc-500">{article.source}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

function ClusterDetailModal({ cluster, onClose, isDarkMode, openArticle, getApiKey }) {
  const [summary, setSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    const apiKey = getApiKey('analysis'); // Usa o pool pesado
    const generatedSummary = await generateNeutralSummaryForCluster(cluster.related_articles, apiKey);
    setSummary(generatedSummary);
    setIsLoadingSummary(false);
  };

  // Formata o tempo relativo
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return "agora";
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-lg h-[80vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white'}`}>
        {/* Header */}
        <div className={`p-4 border-b shrink-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-500">Análise de Tópico</span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X size={18}/></button>
          </div>
          <h2 className="text-xl font-bold font-serif">{cluster.representativeTitle}</h2>
        </div>
        
        {/* Resumo IA */}
        <div className={`p-4 shrink-0 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          {summary ? (
            <p className="text-sm text-zinc-400 italic">"{summary}"</p>
          ) : (
            <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition disabled:opacity-60">
              {isLoadingSummary ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isLoadingSummary ? 'Gerando...' : 'Gerar Resumo Neutro com IA'}
            </button>
          )}
        </div>

        {/* Lista de Artigos */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {cluster.related_articles.map(article => (
            <button key={article.id} onClick={() => openArticle(article)} className={`w-full flex items-center gap-3 p-3 text-left rounded-xl transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'}`}>
              <img src={article.logo} className="w-8 h-8 rounded-md border border-black/10 shrink-0 object-contain bg-white p-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-bold line-clamp-2">{article.title}</p>
                <span className="text-xs text-zinc-500">{article.source}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- NOVO WIDGET: TopStoriesWidget (Substitui WhileYouWereAwayWidget) ---
function TopStoriesWidget({ clusters, openArticle, isDarkMode, getApiKey }) {
    const [modalCluster, setModalCluster] = useState(null);

    // Esqueleto de carregamento
    if (!clusters || clusters.length === 0) {
        return (
            <div className="px-4 space-y-4 animate-pulse">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className={`p-4 rounded-2xl h-36 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                ))}
            </div>
        );
    }
    
    // Função para formatar o tempo relativo
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "agora";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `há ${minutes}min`;
        const hours = Math.floor(minutes / 60);
        return `há ${hours}h`;
    };

    return (
        <div className="px-4 space-y-4">
            {clusters.map(cluster => (
                <div key={cluster.id} className={`p-4 rounded-2xl border transition-shadow hover:shadow-xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    {/* Cabeçalho com fontes e tempo */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center -space-x-2">
                            {cluster.uniqueSources.slice(0, 4).map(source => (
                                <img key={source.name} src={source.logo} title={source.name} className="w-6 h-6 rounded-md border-2 object-contain bg-white p-0.5 border-zinc-900 dark:border-zinc-800" />
                            ))}
                            {cluster.uniqueSources.length > 4 && (
                                <div className="w-6 h-6 rounded-md border-2 border-zinc-900 dark:border-zinc-800 bg-zinc-700 text-white flex items-center justify-center text-[10px] font-bold">
                                    +{cluster.uniqueSources.length - 4}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-zinc-500">{timeAgo(cluster.latestArticleDate)}</span>
                    </div>
                    
                    {/* Título Principal */}
                    <h3 className="font-bold text-lg leading-tight mb-4">{cluster.representativeTitle}</h3>

                    {/* Botões de Ação */}
                    <div className="flex gap-2">
                        <button onClick={() => setModalCluster(cluster)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                           <Layers size={14}/> Entenda o Caso
                        </button>
                        {/* Outros botões podem ser adicionados aqui */}
                    </div>
                </div>
            ))}
            
            {/* Modal */}
            {modalCluster && (
                <ClusterDetailModal 
                    cluster={modalCluster} 
                    onClose={() => setModalCluster(null)}
                    isDarkMode={isDarkMode}
                    openArticle={openArticle}
                    getApiKey={getApiKey}
                />
            )}
        </div>
    );
}



// ==========================================================
// FUNÇÃO DE IA: ANÁLISE DE MERCADO (VERSÃO CORRIGIDA)
// ==========================================================
// --- FUNÇÃO 1: ANÁLISE DE MERCADO (Backend Seguro Vercel) ---
const generateMarketAnalysis = async (news: any[], apiKey?: string) => {
  // 1. Filtragem
  const financialSources = ['Uol Economia', 'Investing', 'Istoé Dinheiro', 'Valor Econômico', 'CNN Economia', 'InfoMoney'];
  const keywords = ['bolsa', 'dólar', 'ibovespa', 'selic', 'juros', 'inflação', 'mercado', 'ações'];
  
  const marketNews = news.filter(n => {
      const isSource = financialSources.some(s => n.source && n.source.includes(s));
      const isKeyword = keywords.some(k => n.title && n.title.toLowerCase().includes(k));
      return isSource || isKeyword;
  }).slice(0, 40);

  if (marketNews.length < 2) {
      console.log("Poucas notícias financeiras para análise.");
      return null;
  }

  try {
    // 2. Chamada ao Backend Seguro
    const response = await fetch("https://newsos-app2.vercel.app/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            marketNews: marketNews,
            apiKeyFromFrontend: apiKey || null
        })
    });

    if (!response.ok) throw new Error("Erro no servidor de análise");

    const json = await response.json();

    // 3. Hidratação (Recuperando essa lógica que estava perdida no final)
    // O backend devolve os IDs, aqui nós reconectamos com o objeto de notícia completo
    if (json.movers) {
        json.movers = json.movers.map((mover: any) => {
            const article = news.find(n => n.id === mover.news_id);
            return { ...mover, article }; 
        }).filter((mover: any) => mover.article);
    }

    return json;

  } catch (error) {
    console.error("Erro ao gerar análise de mercado:", error);
    return null;
  }
};








// --- WIDGET: MARKET PULSE (V7 - DESIGN PREMIUM COM BACKDROP FINANCEIRO) ---


// --- COMPONENTE TREND RADAR (V5 - BARRAS VIVAS + TÍTULOS LEGÍVEIS) ---
// --- COMPONENTE TREND RADAR (V5 - TERMÔMETRO HORIZONTAL 0–10 + CARDS AGRUPADOS POR NÍVEL + BALÕES) ---
// ✅ NÃO mexe na sua função de IA (generateTrendRadar)
// ✅ Mantém a lógica: click -> handleToggle(idx) -> activeIndex/activeItem -> balão
// ✅ Termômetro agora é horizontal (0–10)
// ✅ Cards menores, agrupados horizontalmente por faixas de temperatura (colunas)
// ✅ Texto legível: dark = branco, light = preto/cinza escuro
// Este componente substitui o seu TrendRadar atual.
// Requer: generateTrendRadar(newsData, apiKey), getApiKey("widgets"), openArticle(article), isDarkMode boolean.

const TrendRadar = ({ newsData, getApiKey, isDarkMode, openArticle }) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Janela de tempo
  const [timeWindow, setTimeWindow] = useState("24h"); // "6h" | "24h" | "7d" | "all"

  // Faixa selecionada pelo usuário (NÃO mostrar cards até selecionar)
  // null => estado “selecione uma faixa”
  const [selectedBandIndex, setSelectedBandIndex] = useState(null);

  // Cache
  const STORAGE_KEY_CURRENT = "newsos_trend_radar_data_v6";
  const STORAGE_KEY_PREVIOUS = "newsos_trend_radar_previous_v1";

  // --------- Helpers de estilo ---------
  const getTrendStyle = (score) => {
    if (score >= 9) return { color: "#ef4444", bandLabel: "🔥 MUITO QUENTE" };
    if (score >= 7) return { color: "#f97316", bandLabel: "🟠 QUENTE" };
    if (score >= 5) return { color: "#eab308", bandLabel: "🟡 MÉDIO" };
    if (score >= 3) return { color: "#22c55e", bandLabel: "🟢 LEVE" };
    return { color: "#3b82f6", bandLabel: "🧊 FRIO" };
  };

  const temperatureBands = [
    { label: "🧊 FRIO", minimum: 0, maximum: 2, color: "#3b82f6" },
    { label: "🟢 LEVE", minimum: 3, maximum: 4, color: "#22c55e" },
    { label: "🟡 MÉDIO", minimum: 5, maximum: 6, color: "#eab308" },
    { label: "🟠 QUENTE", minimum: 7, maximum: 8, color: "#f97316" },
    { label: "🔥 MUITO QUENTE", minimum: 9, maximum: 10, color: "#ef4444" },
  ];

  const clampNumber = (value, minimum, maximum) => {
    return Math.min(maximum, Math.max(minimum, value));
  };

  const formatDelta = (delta) => {
    if (delta === null || typeof delta !== "number") return "—";
    if (Math.abs(delta) < 0.05) return "0.0";
    const fixed = Math.abs(delta).toFixed(1);
    return delta > 0 ? `+${fixed}` : `-${fixed}`;
  };

  const getConfidenceLabel = (confidenceValue) => {
    if (confidenceValue >= 0.75) return "Alta";
    if (confidenceValue >= 0.5) return "Média";
    return "Baixa";
  };

  const getConfidenceValue = (trendItem) => {
    const relatedCount = Array.isArray(trendItem.related_articles) ? trendItem.related_articles.length : 0;
    const normalizedRelated = clampNumber(relatedCount / 8, 0, 1);
    const normalizedScore = clampNumber(Number(trendItem.score || 0) / 10, 0, 1);
    const confidence = clampNumber(0.65 * normalizedRelated + 0.35 * normalizedScore, 0, 1);
    return confidence;
  };

  const getVolumeValue = (trendItem) => {
    return Array.isArray(trendItem.related_articles) ? trendItem.related_articles.length : 0;
  };

  const parseArticleDate = (article) => {
    const candidate =
      article?.publishedAt ||
      article?.pubDate ||
      article?.date ||
      article?.createdAt ||
      article?.isoDate ||
      article?.published ||
      null;

    if (!candidate) return null;

    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const filterNewsByTimeWindow = (allNews, windowKey) => {
    if (!Array.isArray(allNews) || allNews.length === 0) return [];
    if (windowKey === "all") return allNews;

    const now = new Date();
    let windowMilliseconds = 24 * 60 * 60 * 1000;

    if (windowKey === "6h") windowMilliseconds = 6 * 60 * 60 * 1000;
    if (windowKey === "24h") windowMilliseconds = 24 * 60 * 60 * 1000;
    if (windowKey === "7d") windowMilliseconds = 7 * 24 * 60 * 60 * 1000;

    const cutoff = new Date(now.getTime() - windowMilliseconds);

    let foundAnyValidDate = false;

    const filtered = allNews.filter((article) => {
      const articleDate = parseArticleDate(article);
      if (articleDate) foundAnyValidDate = true;
      if (!articleDate) return true;
      return articleDate >= cutoff;
    });

    if (!foundAnyValidDate) return allNews;
    return filtered;
  };

  const getBandIndexByScore = (score) => {
    const numeric = clampNumber(Number(score || 0), 0, 10);
    if (numeric >= 9) return 4;
    if (numeric >= 7) return 3;
    if (numeric >= 5) return 2;
    if (numeric >= 3) return 1;
    return 0;
  };

  // --------- Carrega cache ao abrir (NÃO seleciona faixa automaticamente) ---------
  useEffect(() => {
    const savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (savedCurrent) {
      try {
        const parsed = JSON.parse(savedCurrent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = parsed.slice().sort((first, second) => (second.score || 0) - (first.score || 0));
          setTrends(sorted);
          setHasGenerated(true);
          setSelectedBandIndex(null); // mantém “selecione uma faixa”
        }
      } catch (error) {
        console.error("Erro ao ler Trend Radar salvo", error);
      }
    }
  }, []);

  const handleToggle = (index) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  const activeItem = activeIndex !== null && trends ? trends[activeIndex] : null;

  const clearBandSelection = () => {
    setSelectedBandIndex(null);
    setActiveIndex(null);
  };

  // --------- Run Analysis (com deltas) ---------
  const runTrendAnalysis = async () => {
    const currentApiKey = getApiKey("widgets");

    if (!currentApiKey || !Array.isArray(newsData) || newsData.length === 0) {
      alert("Aguarde o carregamento das notícias ou configure as chaves de IA do Pool 1.");
      return;
    }

    setLoading(true);
    setActiveIndex(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const filteredNews = filterNewsByTimeWindow(newsData, timeWindow);

    const data = await generateTrendRadar(filteredNews, currentApiKey);

    if (data && Array.isArray(data) && data.length > 0) {
      const hydratedData = data.map((trend) => {
        const relatedArticles = Array.isArray(trend.source_indices)
          ? trend.source_indices.map((index) => filteredNews[index]).filter(Boolean)
          : [];

        return {
          ...trend,
          related_articles: relatedArticles,
        };
      });

      let previousData = null;
      try {
        const savedPrevious = localStorage.getItem(STORAGE_KEY_PREVIOUS);
        if (savedPrevious) {
          const parsedPrevious = JSON.parse(savedPrevious);
          if (Array.isArray(parsedPrevious)) previousData = parsedPrevious;
        }
      } catch (error) {
        previousData = null;
      }

      const previousScoreByTopic = new Map();
      if (Array.isArray(previousData)) {
        previousData.forEach((trend) => {
          if (trend && typeof trend.topic === "string") {
            previousScoreByTopic.set(trend.topic.trim().toLowerCase(), Number(trend.score || 0));
          }
        });
      }

      const enrichedWithDelta = hydratedData.map((trend) => {
        const topicKey = typeof trend.topic === "string" ? trend.topic.trim().toLowerCase() : "";
        const previousScore = previousScoreByTopic.has(topicKey) ? previousScoreByTopic.get(topicKey) : null;
        const delta = previousScore === null ? null : Number(trend.score || 0) - Number(previousScore || 0);

        const confidenceValue = getConfidenceValue({ ...trend, related_articles: trend.related_articles });
        const volumeValue = getVolumeValue({ ...trend, related_articles: trend.related_articles });

        return {
          ...trend,
          delta_score: delta,
          confidence_value: confidenceValue,
          volume_value: volumeValue,
        };
      });

      const sortedData = enrichedWithDelta.slice().sort((first, second) => (second.score || 0) - (first.score || 0));

      setTrends(sortedData);
      setHasGenerated(true);

      // ✅ IMPORTANTE: NÃO MOSTRAR CARDS AUTOMATICAMENTE
      setSelectedBandIndex(null);
      setActiveIndex(null);

      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(sortedData));
      localStorage.setItem(STORAGE_KEY_PREVIOUS, JSON.stringify(sortedData));
    } else {
      alert("A IA não identificou tendências claras no momento. Tente novamente mais tarde.");
    }

    setLoading(false);
  };

  // --------- Tendências filtradas pela faixa selecionada ---------
  const bandFilteredTrends = useMemo(() => {
    if (!Array.isArray(trends)) return null;
    if (selectedBandIndex === null) return [];

    const band = temperatureBands[selectedBandIndex];
    if (!band) return [];

    return trends.filter((trend) => {
      const score = clampNumber(Number(trend.score || 0), 0, 10);
      return score >= band.minimum && score <= band.maximum;
    });
  }, [trends, selectedBandIndex]);

  const featuredTrend = useMemo(() => {
    if (!Array.isArray(bandFilteredTrends) || bandFilteredTrends.length === 0) return null;
    return bandFilteredTrends[0];
  }, [bandFilteredTrends]);

  const topTrends = useMemo(() => {
    if (!Array.isArray(bandFilteredTrends) || bandFilteredTrends.length <= 1) return [];
    return bandFilteredTrends.slice(1, 11);
  }, [bandFilteredTrends]);

  // --------- UI helpers ---------
  const commonPanelBackground = isDarkMode ? "rgba(24,24,27,0.55)" : "rgba(255,255,255,0.75)";
  const commonPanelBorder = isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)";
  const commonPanelShadow = isDarkMode
    ? "0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)"
    : "0 18px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.30)";

  const Chip = ({ label, value, toneColor, subtle }) => {
    const background = isDarkMode
      ? subtle
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.35)"
      : subtle
      ? "rgba(0,0,0,0.05)"
      : "rgba(255,255,255,0.85)";

    const border = isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)";
    const textColor = isDarkMode ? "rgba(255,255,255,0.78)" : "rgba(17,24,39,0.78)";

    return (
      <div
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full"
        style={{
          background,
          border,
          backdropFilter: "blur(10px)",
        }}
      >
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: textColor }}>
          {label}
        </span>
        <span className="text-[10px] font-black" style={{ color: toneColor || textColor }}>
          {value}
        </span>
      </div>
    );
  };

  const ImpactPill = ({ score }) => {
    const style = getTrendStyle(score);
    const pct = clampNumber(Number(score || 0), 0, 10) * 10;

    return (
      <div
        className="flex items-center gap-2 px-2.5 py-1 rounded-full"
        style={{
          background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: isDarkMode ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.70)" }}
        >
          Impacto
        </span>

        <div
          className="relative w-16 h-[6px] rounded-full overflow-hidden"
          style={{ background: isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)" }}
        >
          <div
            className="absolute left-0 top-0 h-full"
            style={{
              width: `${pct}%`,
              background: style.color,
              boxShadow: `0 0 12px ${style.color}66`,
            }}
          />
        </div>
      </div>
    );
  };

  const WindowButton = ({ label, value }) => {
    const isActive = timeWindow === value;
    return (
      <button
        onClick={() => {
          setTimeWindow(value);
          setActiveIndex(null);
        }}
        className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        style={{
          background: isActive
            ? isDarkMode
              ? "rgba(249,115,22,0.18)"
              : "rgba(249,115,22,0.14)"
            : isDarkMode
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.05)",
          border: isActive
            ? "1px solid rgba(249,115,22,0.35)"
            : isDarkMode
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.08)",
          color: isActive ? "#f97316" : isDarkMode ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.60)",
        }}
      >
        {label}
      </button>
    );
  };

const countsByBand = temperatureBands.map((band) => {
  if (!Array.isArray(trends)) return 0;

  return trends.reduce((acc, t) => {
    const score = clampNumber(Number(t?.score || 0), 0, 10);
    if (score >= band.minimum && score <= band.maximum) return acc + 1;
    return acc;
  }, 0);
});

  const TemperatureSelector = () => {
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/35" : "text-black/35"}`}>
            Selecione uma temperatura para ver as trends
          </span>

          <button
            type="button"
            onClick={clearBandSelection}
            className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full active:scale-95"
            style={{
              background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
              color: isDarkMode ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.60)",
            }}
          >
            Limpar
          </button>
        </div>

        {/* Régua mais grossa (clique seleciona a faixa pelo x) */}
        <div className="relative">
          <div
            className="w-full rounded-full"
            style={{
              height: "16px",
              background: "linear-gradient(90deg, #3b82f6, #22c55e, #eab308, #f97316, #ef4444)",
              boxShadow: isDarkMode
                ? "0 14px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)"
                : "0 14px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)",
              border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
            }}
          />

          <button
            type="button"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = clampNumber(event.clientX - rect.left, 0, rect.width);
              const ratio = rect.width === 0 ? 0 : x / rect.width;
              const score = Math.round(ratio * 10);
              const bandIdx = getBandIndexByScore(score);
              setSelectedBandIndex(bandIdx);
              setActiveIndex(null);
            }}
            className="absolute inset-0 rounded-full"
            style={{ cursor: "pointer", background: "transparent" }}
            aria-label="Selecionar faixa de temperatura clicando na régua"
          />

          {/* marcador da faixa selecionada */}
          {selectedBandIndex !== null && (
            <div
              className="absolute -bottom-2 h-2 rounded-full"
              style={{
                left: `${(selectedBandIndex / 5) * 100}%`,
                width: `${(1 / 5) * 100}%`,
                background: `${temperatureBands[selectedBandIndex].color}`,
                boxShadow: `0 0 18px ${temperatureBands[selectedBandIndex].color}88`,
              }}
            />
          )}
        </div>

        {/* Indicadores modernos por faixa (CLICÁVEIS) */}
        <div className="flex flex-wrap gap-2 mt-3">
          {temperatureBands.map((band, idx) => {
            const active = selectedBandIndex === idx;
            return (
              <button
                key={band.label}
                type="button"
                onClick={() => {
                  setSelectedBandIndex(idx);
                  setActiveIndex(null);
                }}
                className="px-3 py-2 rounded-2xl text-left transition-transform active:scale-[0.98]"
                style={{
                  background: isDarkMode ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.90)",
                  border: active ? `2px solid ${band.color}` : `1px solid ${band.color}55`,
                  boxShadow: active ? `0 18px 40px ${band.color}35` : `0 10px 24px rgba(0,0,0,0.12)`,
                  minWidth: "170px",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: band.color }}>
                    {band.label}
                  </span>

                <div
  className="min-w-[34px] h-8 px-2 rounded-xl flex items-center justify-center"
  style={{
    background: `${band.color}22`,
    border: `1px solid ${band.color}66`,
    boxShadow: `0 0 18px ${band.color}33`,
  }}
>
  <span className="text-[12px] font-black" style={{ color: band.color }}>
    {countsByBand[idx]}
  </span>
</div>
                </div>

                <div className="mt-1 text-[10px] font-black uppercase tracking-widest" style={{ color: isDarkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                  {band.minimum}–{band.maximum}/10
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --------- Render ---------
  return (
    <div className="relative z-[50] mb-6 animate-in fade-in duration-1000 px-4">
      <style jsx="true">{`
        @keyframes glow-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sweep {
          0% { transform: rotate(0deg); opacity: 0.55; }
          100% { transform: rotate(360deg); opacity: 0.55; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.25; }
          50% { transform: scale(1.05); opacity: 0.45; }
        }
        @keyframes dots {
          0% { opacity: 0.25; transform: translateY(0px); }
          50% { opacity: 0.9; transform: translateY(-3px); }
          100% { opacity: 0.25; transform: translateY(0px); }
        }
      `}</style>

      {/* Header */}
      {hasGenerated && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 opacity-70">
            <Activity size={14} className="text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Trend Radar AI</span>
          </div>

          <button
            onClick={runTrendAnalysis}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all active:scale-95 ${
              isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-200 text-zinc-600 hover:text-black"
            }`}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {loading ? "Analisando..." : "Atualizar"}
          </button>
        </div>
      )}

      {/* Loading (mais moderno) */}
      {loading ? (
        <div className="h-56 flex flex-col items-center justify-center text-center gap-4">
          <div className="relative h-44 w-44 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 90deg, rgba(59,130,246,0.9), rgba(34,197,94,0.9), rgba(234,179,8,0.9), rgba(249,115,22,0.9), rgba(239,68,68,0.9), rgba(59,130,246,0.9))",
                filter: "blur(1px)",
                opacity: 0.35,
                animation: "glow-spin 1.6s linear infinite",
              }}
            />
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background: isDarkMode ? "rgba(9,9,11,0.92)" : "rgba(255,255,255,0.92)",
                border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
              }}
            />
            <div
              className="absolute inset-4 rounded-full"
              style={{
                background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                animation: "pulse 1.1s ease-in-out infinite",
              }}
            />
            <div className="absolute inset-0 origin-center" style={{ animation: "sweep 1.2s linear infinite" }}>
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  width: "50%",
                  height: "2px",
                  transform: "translateY(-50%)",
                  background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.95))",
                }}
              />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <Activity size={26} className="text-orange-400" />
              <div className="flex gap-1 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" style={{ animation: "dots 0.8s ease-in-out infinite" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" style={{ animation: "dots 0.8s ease-in-out infinite", animationDelay: "0.15s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" style={{ animation: "dots 0.8s ease-in-out infinite", animationDelay: "0.30s" }} />
              </div>
            </div>
          </div>

          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Analisando tendências...</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Empty state */}
          {!hasGenerated ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <p className="font-bold text-lg mb-4">Ative o Radar de Tendências</p>
              <p className="text-base text-zinc-500 max-w-xs mb-6">
                Clique para escanear as notícias e revelar as trends mais importantes de agora.
              </p>
              <button
                onClick={runTrendAnalysis}
                className="group relative px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg bg-orange-500 text-white hover:bg-orange-400 shadow-orange-500/30"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-300" /> Ativar Radar
                </span>
              </button>
            </div>
          ) : (
            <>
              {/* Painel principal */}
              <div
                className="relative w-full rounded-2xl p-4"
                style={{
                  background: commonPanelBackground,
                  border: commonPanelBorder,
                  boxShadow: commonPanelShadow,
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Controles */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                        Temperatura (selecione uma faixa)
                      </span>
                      {selectedBandIndex !== null && (
                        <span
                          className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                          style={{
                            background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                            border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
                            color: temperatureBands[selectedBandIndex].color,
                          }}
                        >
                          {temperatureBands[selectedBandIndex].label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <WindowButton label="6h" value="6h" />
                      <WindowButton label="24h" value="24h" />
                      <WindowButton label="7d" value="7d" />
                      <WindowButton label="Tudo" value="all" />
                    </div>
                  </div>

                  <TemperatureSelector />
                </div>

                {/* ✅ Só mostra cards quando o usuário selecionar uma faixa */}
                {selectedBandIndex === null ? (
                  <div
                    className="rounded-2xl p-6 mt-4 text-center"
                    style={{
                      background: isDarkMode ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.88)",
                      border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
                    }}
                  >
                    <p className="text-sm font-black">
                      Selecione uma temperatura acima para mostrar as trends.
                    </p>
                    <p className="text-xs mt-2" style={{ color: isDarkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                      Ex.: clique em “🟠 QUENTE” para ver somente as notícias dessa faixa.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-4 mt-6">
                    {/* FEATURED */}
                    {featuredTrend && (
                      <div className="col-span-12 lg:col-span-7">
                        <button
                          type="button"
                          onClick={() => {
                            const originalIndex = Array.isArray(trends)
                              ? trends.findIndex(
                                  (item) =>
                                    item?.topic === featuredTrend?.topic &&
   Number(item?.score || 0) === Number(featuredTrend?.score || 0)
                                )
                              : -1;

                            if (originalIndex >= 0) handleToggle(originalIndex);
                          }}
                          className="w-full text-left rounded-2xl p-5 h-full transition-transform active:scale-[0.99]"
                          style={{
                            background: isDarkMode ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.95)",
                            border: `4px solid ${getTrendStyle(featuredTrend.score).color}`,
                            boxShadow: `0 22px 50px ${getTrendStyle(featuredTrend.score).color}44`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-black leading-tight">{featuredTrend.topic}</h3>
                            <span
                              className="text-sm font-black"
                              style={{ color: getTrendStyle(featuredTrend.score).color }}
                            >
                              {featuredTrend.score}/10
                            </span>
                          </div>

                          {/* APENAS: temperatura + indicadores (sem resumo no card) */}
                          <div className="flex flex-wrap gap-2">
                            <Chip
                              label="Temp"
                              value={`${featuredTrend.score}/10`}
                              toneColor={getTrendStyle(featuredTrend.score).color}
                            />
                            <ImpactPill score={featuredTrend.score} />
                            <Chip
                              label="Confiança"
                              value={getConfidenceLabel(featuredTrend.confidence_value)}
                              toneColor={getTrendStyle(featuredTrend.score).color}
                            />
                            <Chip label="Volume" value={featuredTrend.volume_value} />
                            <Chip
                              label="Delta"
                              value={formatDelta(featuredTrend.delta_score)}
                              toneColor={featuredTrend.delta_score > 0 ? "#22c55e" : "#ef4444"}
                            />
                          </div>
                        </button>
                      </div>
                    )}

                    {/* LISTA (substitui radar + top4) */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
                      {topTrends.map((trend) => {
                        const style = getTrendStyle(trend.score);
                        const originalIndex = Array.isArray(trends)
                          ? trends.findIndex(
                              (item) =>
                                item?.topic === trend?.topic &&
                                Number(item?.score || 0) === Number(trend?.score || 0)
                            )
                          : -1;

                        return (
                          <button
                            key={`${trend.topic}-${trend.score}`}
                            type="button"
                            onClick={() => {
                              if (originalIndex >= 0) handleToggle(originalIndex);
                            }}
                            className="text-left rounded-2xl p-4 transition-transform active:scale-[0.99]"
                            style={{
                              background: isDarkMode ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.90)",
                              border: `3px solid ${style.color}`,
                              boxShadow: `0 16px 30px ${style.color}22, inset 0 1px 0 rgba(255,255,255,0.10)`,
                            }}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0">
                                {/* APENAS: notícia (topic) */}
                                <div className="text-sm font-black leading-tight truncate">{trend.topic}</div>

                                {/* APENAS: temperatura + indicadores modernos */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Chip label="Temp" value={`${trend.score}/10`} toneColor={style.color} />
                                  <ImpactPill score={trend.score} />
                                  <Chip
                                    label="Confiança"
                                    value={getConfidenceLabel(trend.confidence_value)}
                                    toneColor={style.color}
                                  />
                                  <Chip label="Volume" value={trend.volume_value} />
                                  <Chip
                                    label="Delta"
                                    value={formatDelta(trend.delta_score)}
                                    toneColor={trend.delta_score > 0 ? "#22c55e" : "#ef4444"}
                                  />
                                </div>
                              </div>

                              <span className="text-xs font-black" style={{ color: style.color }}>
                                {trend.score}/10
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ================= BALÃO (DETALHE) ================= */}
              <AnimatePresence>
                {activeItem && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="mt-6"
                  >
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: isDarkMode ? "rgba(9,9,11,0.92)" : "rgba(255,255,255,0.98)",
                        border: `3px solid ${getTrendStyle(activeItem.score).color}`,
                        boxShadow: isDarkMode ? "0 22px 60px rgba(0,0,0,0.55)" : "0 22px 60px rgba(0,0,0,0.18)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      {/* Header do balão */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          {/* TÍTULO */}
                          <h4 className="font-black text-base leading-tight">{activeItem.topic}</h4>

                          {/* Indicadores */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Chip
                              label="Temp"
                              value={`${activeItem.score}/10`}
                              toneColor={getTrendStyle(activeItem.score).color}
                            />
                            <ImpactPill score={activeItem.score} />
                            <Chip
                              label="Confiança"
                              value={getConfidenceLabel(activeItem.confidence_value)}
                              toneColor={getTrendStyle(activeItem.score).color}
                            />
                            <Chip label="Volume" value={activeItem.volume_value} />
                            <Chip
                              label="Delta"
                              value={formatDelta(activeItem.delta_score)}
                              toneColor={activeItem.delta_score > 0 ? "#22c55e" : "#ef4444"}
                            />
                          </div>
                        </div>

                        {/* Fechar */}
                        <button
                          type="button"
                          onClick={() => setActiveIndex(null)}
                          className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95"
                          style={{
                            background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                            border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
                            color: isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)",
                          }}
                        >
                          Fechar
                        </button>
                      </div>

                      {/* RESUMO (só aqui) */}
                      <p className="text-sm leading-relaxed opacity-85">{activeItem.summary}</p>

                      {/* FONTES */}
                      {Array.isArray(activeItem.related_articles) && activeItem.related_articles.length > 0 && (
                        <div className="mt-4">
                          <div
                            className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                              isDarkMode ? "text-white/45" : "text-black/45"
                            }`}
                          >
                            Fontes
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {activeItem.related_articles.slice(0, 10).map((article, idx) => {
                              const title = typeof article?.title === "string" ? article.title : "Abrir fonte";
                              const logo = article?.logo || article?.image || article?.favicon || "";

                              return (
                                <button
                                  key={`${article?.id || idx}-${title}`}
                                  type="button"
                                  onClick={() => openArticle(article)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl active:scale-95 hover:scale-[1.02] transition"
                                  style={{
                                    background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                    border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
                                  }}
                                  title={title}
                                >
                                  {logo ? (
                                    <img
                                      src={logo}
                                      alt=""
                                      className="w-6 h-6 rounded-lg"
                                      style={{
                                        border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="w-6 h-6 rounded-lg"
                                      style={{
                                        background: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                        border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
                                      }}
                                    />
                                  )}

                                  <span
                                    className="text-[11px] font-bold max-w-[220px] truncate"
                                    style={{ color: isDarkMode ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.70)" }}
                                  >
                                    {title}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </div>
  );
};







// Substitua o seu componente HappeningTab inteiro por esta versão aprimorada

function HappeningTab({ openArticle, openStory, isDarkMode, newsData, onRefresh, storiesToDisplay, onMarkAsSeen, getApiKey, savedClusters, setSavedClusters, seenStoryIds, onTriggerWidgetRotation, heuristicClusters }) {
 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // --- MUDANÇA CRÍTICA 1: startY agora é REF (Não causa re-render ao tocar) ---
  // Isso impede que o componente pisque quando você encosta o dedo.
  const startY = useRef(0); 
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e) => {
    // Só grava a posição se estiver no topo. Como é Ref, não renderiza nada visualmente.
    if (window.scrollY <= 5 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    // Se não tiver ponto de partida ou estiver carregando, ignora
    if (startY.current === 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Só atualiza o estado (e causa render) SE o usuário estiver puxando para baixo
    if (diff > 0 && window.scrollY <= 5) {
      if (e.cancelable) e.preventDefault();
      // Adiciona uma resistência para não descer demais
      const newPull = Math.min(diff * 0.5, 220);
      setPullDistance(newPull);
    }
  };

  const handleTouchEnd = async () => {
    // --- MUDANÇA CRÍTICA 2: Proteção total do clique ---
    // Se o usuário não puxou a tela (pullDistance é 0), não fazemos NADA.
    // O return imediato impede qualquer state update, preservando o clique nos filhos.
    if (pullDistance === 0) {
        startY.current = 0;
        return; 
    }

    if (pullDistance > 90) {
      setIsRefreshing(true);
      setPullDistance(120); // Mantém o loading visível
      setRefreshTrigger(prev => prev + 1);
      
      if (onRefresh) await onRefresh();
      
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      // Se puxou pouco, volta pro zero
      setPullDistance(0);
    }
    
    // Reseta a referência
    startY.current = 0;
  };

  const displayClusters = savedClusters && savedClusters.length > 0 ? savedClusters : heuristicClusters;

  return (
    <div className="animate-in fade-in duration-700 pb-10 min-h-screen touch-pan-y space-y-8" 
         onTouchStart={handleTouchStart} 
         onTouchMove={handleTouchMove} 
         onTouchEnd={handleTouchEnd}>      
      
      <style jsx="true">{`
        @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmer-text { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .animate-shimmer-text { background-size: 200% auto; animation: shimmer-text 3s linear infinite; }
      `}</style>

      {/* Indicador de Refresh (Visual) */}
      <div className="fixed left-0 right-0 z-[1000] flex justify-center pointer-events-none" style={{ top: '35%', opacity: Math.min(pullDistance / 80, 1), transform: `scale(${Math.min(pullDistance / 100, 1.2)})`, display: pullDistance > 0 || isRefreshing ? 'flex' : 'none' }}>
         <div className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] shadow-2xl border ${isDarkMode ? 'bg-black/5 border-white/10 shadow-purple-500/20' : 'bg-white/90 border-white shadow-xl text-zinc-900'}`}>
            {isRefreshing ? <Loader2 size={42} className="animate-spin text-purple-500" /> : <RefreshCw size={42} className="text-purple-500 transition-transform" style={{ transform: `rotate(${pullDistance * 3}deg)` }}/>}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{isRefreshing ? 'Atualizando Feed' : 'Solte para Atualizar'}</span>
         </div>
      </div>
      
       {/* Stories */}
       <div className="flex items-center gap-4 px-4 pt-2 relative z-10">
        <div className="flex-1 min-w-0"> 
            <div className="flex space-x-5 overflow-x-auto pb-2 scrollbar-hide snap-x items-center min-h-[100px]">
                {storiesToDisplay && storiesToDisplay
                    .filter(story => !seenStoryIds?.includes(story.id))
                    .map((story) => {
                        const isBreaking = story.isBreaking;
                        const isAnchor = story.isAnchor;
                        let ringClass = 'bg-gradient-to-tr from-rose-600 via-pink-500 to-orange-400 shadow-rose-500/20';
                        let animationClass = '';
                        let badgeIcon = null;

                        if (isBreaking) { ringClass = 'bg-red-600 shadow-red-500/40'; animationClass = 'animate-[fast-pulse_1s_ease-in-out_infinite]'; badgeIcon = <Zap size={10} className="text-white"/>;
                        } else if (isAnchor) { ringClass = 'bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 shadow-amber-500/30'; animationClass = 'animate-[slow-pulse_2.5s_ease-in-out_infinite]'; badgeIcon = <Sparkles size={10} className="text-white"/>; }

                        return (
                            <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group flex-shrink-0">
                                <div className={`relative w-[76px] h-[76px] rounded-full p-[3px] transition-all duration-500 shadow-lg ${ringClass} ${animationClass}`}>
                                    <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950 bg-zinc-900' : 'border-white bg-zinc-200'}`}>
                                        <img src={story.avatar} className="w-full h-full object-cover" alt="" onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                    {badgeIcon && ( <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center">{badgeIcon}</div> )}
                                </div>
                                <span className={`text-[10px] font-semibold truncate max-w-[76px] text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{story.name}</span>
                            </div>
                        );
                    })}
                
                {storiesToDisplay && storiesToDisplay.filter(s => !seenStoryIds?.includes(s.id)).length === 0 && (
                    <div className="flex flex-col justify-center h-full pl-2 opacity-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tudo visto por aqui</span>
                        <span className="text-[9px]">Puxe para atualizar</span>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Trend Radar */}
      <div className="px-4">
        <TrendRadar newsData={newsData} getApiKey={getApiKey} isDarkMode={isDarkMode} openArticle={openArticle} />
      </div>
      
          {/* Manchete e o NOVO Widget */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-4">
            <div className={`p-2 rounded-xl ...`}>
                <Sparkles size={18} />
            </div>
            <h3 className="text-lg font-bold ...">
                As principais notícias de agora, em múltiplos ângulos.
            </h3>
        </div>
        
        {/* --- SUBSTITUA O WIDGET ANTIGO POR ESTE --- */}
        <TopStoriesWidget 
            clusters={heuristicClusters}
            openArticle={openArticle}
            isDarkMode={isDarkMode}
            getApiKey={getApiKey}
        />
      </div>
    
      {/* Smart Digest */}
      <div className="px-4">
        <SmartDigestWidget 
            newsData={newsData} 
            getApiKey={getApiKey}
            isDarkMode={isDarkMode} 
            refreshTrigger={refreshTrigger} 
        />
      </div>
      
      {/* Market Pulse */}
      <div className="space-y-4 px-4 pt-4">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shadow-lg ${isDarkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-indigo-600 shadow-indigo-200'}`}>
                  <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-shimmer-text">
                  Mercados Hoje
              </h3>
          </div>
          <div className="rounded-[1.75rem] p-1 bg-gradient-to-br from-purple-500/50 via-purple-500/20 to-transparent">
            <div className={`rounded-[1.5rem] p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
              <MarketPulseWidget 
                newsData={newsData}
                getApiKey={getApiKey}
                isDarkMode={isDarkMode}
                openArticle={openArticle}
              />
            </div>
          </div>
      </div>
    </div>
  );
}


// ==========================================================
// === SUBSTITUA SUA FUNÇÃO "BancaTab" INTEIRA POR ESTA ===
// ==========================================================

function BancaTab({ openOutlet, isDarkMode, userFeeds, realNews }) {
  const [category, setCategory] = useState('Tudo');

  // DICIONÁRIO DE LOGOS COMPLETO E RESTAURADO
  const LOGO_DICTIONARY = {
    'cnn brasil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/CNN_Brasil.svg/1280px-CNN_Brasil.svg.png',
    'o globo': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/O_Globo_2025.svg',
    'notícias ao minuto': 'logos/noticiasao.png', 
    'veja': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Veja.svg/1280px-Veja.svg.png',
    'infomoney': 'https://logodownload.org/wp-content/uploads/2019/09/infomoney-logo.png',
    'macmagazine': 'https://macmagazine.com.br/wp-content/uploads/2024/01/logomm_light@2x.png',
    'le monde': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Le_Monde.svg/2560px-Le_Monde.svg.png',
    'appleinsider': 'logos/insider.png',
    '9to5mac': 'logos/9to.png',
    'times brasil': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Times_Brasil_CNBC_logo_2025.svg',
    'quatro rodas': '/logos/quatro-rodas.png',
    'g1': 'https://logodownload.org/wp-content/uploads/2016/10/g1-logo-0.png',
    'fox news': 'logos/fox2.png'
  };

  const layoutStyles = [
    { layoutType: 'standard', color: 'bg-blue-800' },
    { layoutType: 'magazine', color: 'bg-black' },
    { layoutType: 'visual', color: 'bg-yellow-500 text-black' }, // Restaurado
    { layoutType: 'impact', color: 'bg-red-700' },             // Novo
    { layoutType: 'minimal', color: 'bg-gray-200 text-black' },
    { layoutType: 'grid', color: 'bg-zinc-900' },               // Novo
];

  const bancaFeeds = useMemo(() => {
    if (!userFeeds || !realNews) return [];
    
    return userFeeds
        .filter(feed => feed.display?.banca)
        .map((feed, index) => {
            const latestHeadlines = realNews.filter(news => news.source === feed.name).slice(0, 2);
            let finalLogo = feed.logo;
            const lowerName = feed.name.toLowerCase();
            
            for (const key in LOGO_DICTIONARY) {
                if (lowerName.includes(key)) {
                    finalLogo = LOGO_DICTIONARY[key];
                    break;
                }
            }
            
            return {
                ...feed,
                logo: finalLogo,
                ...layoutStyles[index % layoutStyles.length],
                latestHeadlines: latestHeadlines,
            };
        });
  }, [userFeeds, realNews]);

  const bancaCategories = useMemo(() => {
    if (!bancaFeeds || bancaFeeds.length === 0) return ['Tudo'];
    const categories = new Set(bancaFeeds.map(feed => feed.category || 'Geral'));
    return ['Tudo', ...Array.from(categories)];
  }, [bancaFeeds]);

  const displayedItems = category === 'Tudo' ? bancaFeeds : bancaFeeds.filter(i => (i.category || 'Geral') === category);

return (
    <div className="pt-2 pb-24 pr-16 animate-in zoom-in-95 duration-500 min-h-screen">
      <div className="fixed right-0 top-[25%] z-30 flex flex-col gap-1 items-end pointer-events-none">
          {bancaCategories.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={`pointer-events-auto relative flex items-center justify-center w-10 py-6 rounded-l-xl rounded-r-none shadow-lg border-y border-l border-r-0 transition-all duration-300 ${category === cat ? 'bg-purple-500 text-white border-purple-400 translate-x-0 w-12' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border-zinc-800 translate-x-2 hover:translate-x-0' : 'bg-zinc-200 text-zinc-400 border-zinc-300 translate-x-2 hover:translate-x-0')}`}>
                  <span className="text-[12px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>{cat}</span>
              </button>
          ))}
      </div>
      
      <h2 className={`text-xl font-bold mb-6 px-2 mt-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
        <LayoutGrid size={20} className="text-emerald-600"/> Sua Banca Pessoal
      </h2>
      
      {displayedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 opacity-60 px-4">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <LayoutGrid size={24} className="text-zinc-400"/>
              </div>
              <h3 className="font-bold text-lg mb-2">Sua banca está vazia</h3>
              <p className="text-sm max-w-xs">Vá em Configurações → Fontes e clique no ícone de banca <LayoutGrid size={12} className="inline-block -mt-1"/> ao lado de suas fontes favoritas para adicioná-las aqui.</p>
          </div>
      )}

     <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2">
        {displayedItems.map((item) => {
          // A variável é definida aqui, de forma segura
          const mainHeadline = item.latestHeadlines?.[0];

          return (
            <div key={item.id} onClick={() => openOutlet(item)} 
                 className={`relative aspect-[3/4] rounded-2xl flex flex-col cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group`}>
              
              {/* SEU CABEÇALHO (INTOCADO) */}
              <div className={`h-1/3 flex items-center justify-center p-4 ${isDarkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                  <img 
                      src={item.logo} 
                      alt={item.name} 
                      className="max-h-full max-w-full object-contain drop-shadow-lg p-2"
                  />
              </div>
              
              {/* O NOVO "TEASER VISUAL" SUBSTITUINDO A LISTA DE TEXTO */}
              <div className="flex-1 flex flex-col justify-end relative bg-white dark:bg-zinc-800">
                {mainHeadline?.img ? (
                    <>
                        <img src={mainHeadline.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => {e.target.style.display='none'}} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                    </>
                ) : (
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}></div>
                )}
                
                <div className="relative p-3">
                    <h3 className={`font-serif font-bold leading-tight text-lg line-clamp-3 ${mainHeadline?.img ? 'text-white drop-shadow-lg' : (isDarkMode ? 'text-zinc-200' : 'text-zinc-800')}`}>
                        {mainHeadline ? mainHeadline.title : `Destaques de ${item.name}`}
                    </h3>
                    <p className={`text-xs mt-1 opacity-80 ${mainHeadline?.img ? 'text-white/80' : 'text-zinc-500'}`}>
                        {item.latestHeadlines && item.latestHeadlines.length > 1 
                            ? `Leia a matéria principal e +${item.latestHeadlines.length - 1} destaques` 
                            : 'Leia a matéria principal'
                        }
                    </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- NOVO FILTRO MODERNO E MINIMALISTA (PARA A ABA SALVOS) ---

function UnderlineFilterBar({ categories, active, onChange, isDarkMode }) {
  const tabsRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      // Agora buscamos pelo 'label' dentro do objeto
      const activeTabNode = tabsRef.current?.querySelector(`[data-category="${active}"]`);
      if (activeTabNode) {
        setIndicatorStyle({
          left: activeTabNode.offsetLeft,
          width: activeTabNode.offsetWidth,
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [active, categories]);

  return (
    <div className="w-full flex justify-center">
      <div
        ref={tabsRef}
        className="relative flex items-center border-b border-zinc-200 dark:border-zinc-800"
      >
        <div
          className={`
            absolute bottom-[-1px] h-1 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}
          `}
          style={indicatorStyle}
        />
        
        {/* Mapeando a nova estrutura com ícones */}
        {categories.map((cat) => {
          const isActive = active === cat.label;
          const Icon = cat.icon; // Pega o componente do ícone
          return (
            <button
              key={cat.label}
              data-category={cat.label}
              onClick={() => onChange(cat.label)}
              className={`
                relative z-10 flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors duration-300 whitespace-nowrap
                ${isActive
                  ? (isDarkMode ? 'text-white' : 'text-zinc-900')
                  : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-800')}
              `}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- ABA SALVOS (VERSÃO CORRIGIDA COM LIXEIRA EM TODOS OS CARDS) ---

// --- ABA SALVOS (VERSÃO FINAL COM LIXEIRA SEMPRE VISÍVEL EM TODOS OS CARDS) ---

function SavedTab({ isDarkMode, openArticle, items, onRemoveItem, onPlayVideo }) {
  const [filter, setFilter] = useState('Tudo');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lista de filtros com ícones, incluindo "Arquivo"
  const SAVED_FILTERS_WITH_ICONS = [
    { label: 'Tudo', icon: Layers },
    { label: 'Arquivo', icon: Archive },
    { label: 'Notícias', icon: FileText },
    { label: 'Vídeos', icon: Youtube },
    { label: 'Podcasts', icon: Mic },
    { label: 'Links', icon: Globe },
  ];

  const safeItems = items || [];

  // Função auxiliar para determinar o tipo do item
  const getItemType = (item) => {
    // Se tiver flag de arquivado ou categoria explicita, é Arquivo
    if (item.category === 'Arquivo' || item.isArchived) return 'Arquivo';
    
    if (item.category === 'Música') return 'Músicas';
    if (item.category === 'Vídeo') return 'Vídeos';
    if (item.category === 'Link') return 'Links';
    return 'Notícias';
  };
  
  // Lógica de filtragem avançada
  const filteredItems = safeItems.filter(item => {
    const type = getItemType(item);
    
    // Lógica principal de Abas
    let typeMatch = false;
    if (filter === 'Arquivo') {
        // Se estamos na aba Arquivo, mostra SÓ o que é arquivo
        typeMatch = type === 'Arquivo';
    } else if (filter === 'Tudo') {
        // Se estamos em Tudo, mostra tudo MENOS o que está arquivado (comportamento de Inbox)
        typeMatch = type !== 'Arquivo'; 
    } else {
        // Nas outras abas (Vídeo, Música, etc), mostra a categoria específica
        // Mas opcionalmente você pode decidir se quer mostrar arquivados aqui ou não.
        // Por padrão, vamos mostrar apenas itens ativos (não arquivados) dessas categorias
        typeMatch = type === filter && !item.isArchived;
    }

    const searchMatch = searchQuery === '' || 
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return typeMatch && searchMatch;
  });

  return (
    <div className="pt-2 pb-24 animate-in fade-in duration-500 min-h-screen">
      
      {/* Cabeçalho e Busca */}
      <div className="px-4 mb-4">
        <h2 className={`text-2xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Sua Biblioteca</h2>
        <div className={`relative flex items-center w-full p-1 rounded-full border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>
          <div className="pl-3 pr-2 text-zinc-500"><Search size={18}/></div>
          <input 
            type="text" 
            placeholder="Buscar em seus itens salvos..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full h-10 bg-transparent text-sm font-medium outline-none" 
          />
        </div>
      </div>
      
      {/* Barra de Filtros */}
      <div className="px-4 my-6">
        <UnderlineFilterBar 
            categories={SAVED_FILTERS_WITH_ICONS} 
            active={filter} 
            onChange={setFilter} 
            isDarkMode={isDarkMode} 
        />
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mt-2">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-16 opacity-50">
            <Archive size={40} className="mx-auto mb-4"/>
            <h3 className="font-bold">Nenhum item encontrado em "{filter}"</h3>
            <p className="text-sm">Seus itens salvos e arquivados aparecerão aqui.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemType = getItemType(item);
            
            // Renderização condicional baseada no tipo (Música, Vídeo, Link, Notícia)
            // Nota: Se for 'Arquivo', ele cai no default (Notícia) ou no tipo original dele se preservarmos a estrutura,
            // mas aqui trataremos visualmente igual.

            // Se for Vídeo (seja arquivado ou não, se tiver estrutura de vídeo, renderiza como vídeo)
            if (item.category === 'Vídeo') {
                return (
                  <div key={item.id} onClick={() => onPlayVideo(item)} className={`group relative w-full flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                      className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 text-white/70 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title}/>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                         <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full"><Play size={32} className="text-white fill-white" /></div>
                      </div>
                      {/* Badge de Arquivado se estiver no filtro de arquivo */}
                      {filter === 'Arquivo' && <div className="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex gap-1 items-center"><StickyNote size={10}/> Anotado</div>}
                    </div>
                    <div className="bg-black p-4 flex items-center gap-3">
                      <Youtube size={24} className="text-red-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-white text-sm font-bold leading-snug truncate">{item.title}</h3>
                        <p className="text-white/70 text-xs truncate">{item.source}</p>
                      </div>
                    </div>
                  </div>
                );
            }

            if (item.category === 'Música') {
                return (
                  <div key={item.id} onClick={() => openArticle(item)} className={`group relative w-full flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                      className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 text-white/70 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title}/>
                    </div>
                    <div className="bg-red-600 p-4 flex items-center gap-3">
                      <Music size={24} className="text-white flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-white text-sm font-bold leading-snug truncate">{item.title}</h3>
                        <p className="text-white/70 text-xs truncate">{item.source}</p>
                      </div>
                    </div>
                  </div>
                );
            }

            if (item.category === 'Link') {
                return (
                    <div key={item.id} onClick={() => openArticle(item)} className={`group relative w-full h-full flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-purple-500' : 'bg-white border-zinc-200 hover:border-purple-500 hover:shadow-lg'}`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                        className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/10 text-zinc-500 hover:bg-red-600 hover:text-white transition-all active:scale-90 dark:bg-white/10 dark:text-zinc-400"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><Globe size={16} className="text-purple-500"/></div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.source}</span>
                          </div>
                        </div>
                        <h3 className={`text-lg font-bold leading-snug font-serif ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{item.title}</h3>
                      </div>
                      <p className={`text-xs truncate mt-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.url || 'Link salvo'}</p>
                    </div>
                );
            }

            // Default: Notícias / Artigos / Arquivo Genérico
            return (
              <div key={item.id} onClick={() => openArticle(item)} className={`group relative w-full rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                  className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 text-white/70 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
                <div className={`aspect-video w-full overflow-hidden relative ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                 <div className={`aspect-video w-full overflow-hidden relative ...`}>
                 <SmartImage 
                     src={item.img} 
                     className="w-full h-full object-cover ..." 
                     title={item.title} 
                     logo={item.logo} 
                     
                     // --- A CORREÇÃO É AQUI ---
                     // Mude de news.source para item.source
                     sourceName={item.source}  
                     
                     isDarkMode={isDarkMode} 
                 />
                 {/* ... */}
                </div>
                <div className="p-4">
                  {/* ... (resto do card) ... */}
                </div>
              </div>
                <div className="p-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{item.source}</span>
                  <h3 className={`text-base font-bold leading-snug line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{item.title}</h3>
                  
                  {/* Exibe a nota do usuário se existir */}
                  {item.userNote && (
                      <div className={`mt-3 p-2 rounded-lg text-xs italic border-l-2 border-yellow-400 ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-yellow-50 text-zinc-600'}`}>
                          "{item.userNote}"
                      </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.date}</p>
                </div>
              </div>
            );

          })
        )}
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick, isDarkMode }) { 
  
  
  return (
    <button 
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center 
        w-15 h-9 /* Um pouco maior para a aura ter espaço */
        transition-transform duration-200 ease-out 
        active:scale-90 touch-manipulation
        ${active ? 'scale-110 -translate-y-2' : 'hover:-translate-y-1'}
      `}
    >
      {/* Container do Ícone */}
      <div className={`
        relative p-3 rounded-full transition-all duration-200
        ${isDarkMode 
            ? 'text-zinc-500 group-hover:text-zinc-200' 
            : 'text-zinc-400 group-hover:text-zinc-600'
        }
      `}>
        {/* Ícone */}
        <div className={`transition-transform duration-200 ${active ? 'scale-125' : 'scale-100'}`}>
            {React.cloneElement(icon, { 
                className: `transition-colors duration-200 ${active ? (isDarkMode ? 'text-white' : 'text-blue-500') : ''}` 
            })}
        </div>

        {/* EFEITO AURA (Só aparece quando ativo) */}
        {active && (
            <div className={`
                absolute inset-0 rounded-full blur-lg animate-pulse
                bg-blue-500/70 /* Cor principal da Aura (mesma do cabeçalho) */
            `}/>
        )}
      </div>
    </button>
  ); 
}
// --- APP PRINCIPAL ---


// --- FUNÇÃO CORRIGIDA: PARSE XML COM SUPORTE A NAMESPACES (yt:videoId) ---

const extractImageFromContent = (content) => {
  if (!content || typeof content !== 'string') return null;
  // Regex que busca src="..." ou src='...' ignorando maiúsculas/minúsculas
  const imgMatch = content.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
};

const parseXMLToNewsItems = (xmlText, feedSource, feedId) => {
  try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
          console.warn("Erro ao ler XML de:", feedSource);
          return { items: [], realTitle: feedSource, realLogo: null };
      }

      let detectedTitle = feedSource;
      const channelTitle = xmlDoc.querySelector("channel > title") || xmlDoc.querySelector("title");
      if (channelTitle && channelTitle.textContent) {
          detectedTitle = channelTitle.textContent.trim();
      }

      let siteLink = "";
      const channelLink = xmlDoc.querySelector("channel > link") || xmlDoc.querySelector("link");
      if (channelLink) {
          siteLink = channelLink.textContent || channelLink.getAttribute("href") || "";
      }

      let autoLogo = `https://ui-avatars.com/api/?name=${detectedTitle}&background=random`;
      if (siteLink) {
          try {
              const domain = new URL(siteLink).hostname;
              autoLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          } catch (e) { /* ignora */ }
      }

      const items = Array.from(xmlDoc.querySelectorAll("item, entry"));
      
      const parsedItems = items.map((node) => {
        const getTxt = (tag) => {
            if (tag.includes(':')) {
                const els = node.getElementsByTagName(tag);
                return els.length > 0 ? els[0].textContent : "";
            }
            return node.querySelector(tag)?.textContent || "";
        };

        const linkNode = node.querySelector("link");
        let link = linkNode?.getAttribute("href") || linkNode?.textContent || "";

        const ytId = getTxt("yt:videoId") || getTxt("videoId");
        if (ytId) link = `https://www.youtube.com/watch?v=${ytId}`;
        
        const pubDate = getTxt("pubDate") || getTxt("published") || getTxt("updated");
        const rawDateValue = pubDate ? new Date(pubDate) : null;
        
        const description = getTxt("description") || getTxt("summary");
        const contentEncoded = getTxt("content:encoded") || getTxt("content");

        let img = null;
        const mediaContent = node.getElementsByTagName("media:content");
        if (mediaContent.length > 0) img = mediaContent[0].getAttribute("url");
        if (!img) {
            const mediaThumb = node.getElementsByTagName("media:thumbnail")[0];
            if (mediaThumb) img = mediaThumb.getAttribute("url");
        }
        if (!img) {
            const enclosure = node.querySelector("enclosure");
            if (enclosure && enclosure.getAttribute("type")?.includes("image")) {
                img = enclosure.getAttribute("url");
            }
        }
        if (!img) img = extractImageFromContent(contentEncoded);
        if (!img) img = extractImageFromContent(description);

        const title = getTxt("title");
        const stableId = stringToHash(title + link);

        return {
          id: `${feedId}-${stableId}`,
          source: detectedTitle,
          logo: autoLogo,
          // A LINHA 'time:' FOI REMOVIDA DAQUI
          rawDate: rawDateValue,
          title: title,
          summary: description.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...',
          category: 'Geral',
          img: img,
          readTime: '3 min',
          link: link,
          origin: 'rss',
          videoId: ytId
        };
      });

      return { items: parsedItems, realTitle: detectedTitle, realLogo: autoLogo };

  } catch (err) {
      console.error("Erro fatal no parser:", err);
      return { items: [], realTitle: feedSource, realLogo: null };
  }
};


// --- COMPONENTE: PLAYER DE ÁUDIO GLOBAL (BLINDADO) ---
const GlobalAudioPlayer = ({ track, onClose, isDarkMode }) => {
  const audioRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isYoutube, setIsYoutube] = useState(false);
  const [hasError, setHasError] = useState(false); // Novo estado de erro visual

  // 1. Extração de ID Segura
  const ytId = useMemo(() => {
      if (!track) return null;
      if (track.videoId) return track.videoId;
      const match = track.link?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return match ? match[1] : null;
  }, [track]);

  // 2. Setup Inicial (Com Try/Catch agressivo)
  useEffect(() => {
    if (!track || track.isGenerating) return;

    // Reset dos estados
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);

    if (ytId) {
        setIsYoutube(true);
    } else {
        setIsYoutube(false);
        // Tenta iniciar o áudio apenas se a ref existir
        if (audioRef.current) {
            try {
                // Se for link HTTP em site HTTPS, o navegador bloqueia (Mixed Content)
                // Vamos tentar usar o link direto
                audioRef.current.src = track.audio || track.link;
                audioRef.current.load();
                
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setIsPlaying(true))
                        .catch(err => {
                            console.warn("Autoplay impedido ou falha de fonte:", err);
                            // Não marcamos erro fatal aqui para não travar a UI, apenas não toca
                        });
                }
            } catch (e) {
                console.error("Erro fatal ao iniciar áudio:", e);
                setHasError(true);
            }
        }
    }
  }, [track, ytId]);

  // 3. Simulação de Progresso (YouTube)
  useEffect(() => {
      let interval = null;
      if (isYoutube && isPlaying) {
          interval = setInterval(() => {
              setCurrentTime(prev => prev + 1);
              if (duration > 0) setProgress((currentTime / duration) * 100);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isYoutube, isPlaying, currentTime, duration]);

  // --- HANDLER DE FECHAR (FORÇA BRUTA) ---
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Apenas para o áudio e chama o pai para desmontar o componente.
    // Não precisa mais mexer no src.
    try {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    } catch (err) {
        console.warn("Erro ao pausar áudio no fechamento (ignorado):", err);
    }
    if (onClose) onClose();
};

  // --- RENDERIZAÇÃO ---
  if (!track) return null;

  // Tela de Loading da IA
  if (track.isGenerating) {
      return (
        <div className={`fixed bottom-24 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[99999] rounded-2xl p-6 shadow-2xl backdrop-blur-xl border border-white/10 animate-in slide-in-from-bottom-10 flex items-center gap-4 ${isDarkMode ? 'bg-zinc-900/95 text-white' : 'bg-white/95 text-zinc-900'}`}>
            <Loader2 size={24} className="animate-spin text-purple-500" />
            <div>
                <h4 className="text-sm font-bold animate-pulse">Sintetizando Voz Neural...</h4>
                <p className="text-[10px] opacity-60">Usando Google Cloud TTS</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-2 hover:bg-black/10 rounded-full"><X size={20}/></button>
        </div>
      );
  }

  // Handlers de Áudio Nativo
  const handleNativeTimeUpdate = () => {
      if (audioRef.current) {
          const curr = audioRef.current.currentTime;
          const dur = audioRef.current.duration;
          if (isFinite(curr)) setCurrentTime(curr);
          if (isFinite(dur) && dur > 0) {
              setDuration(dur);
              setProgress((curr / dur) * 100);
          }
      }
  };

  const togglePlay = (e) => {
      e.stopPropagation();
      if (!isYoutube && audioRef.current) {
          if (isPlaying) audioRef.current.pause();
          else audioRef.current.play().catch(e => console.warn("Play failed:", e));
          setIsPlaying(!isPlaying);
      }
  };

  const formatTime = (t) => {
      if (!t || isNaN(t)) return "0:00";
      const min = Math.floor(t / 60);
      const sec = Math.floor(t % 60);
      return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  // Handler de erro do elemento <audio>
  const handleAudioError = (e) => {
      console.error("Erro no elemento de áudio:", e.target.error);
      setHasError(true);
      setIsPlaying(false);
  };

  return (
    <div className={`fixed bottom-24 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[99999] rounded-2xl p-4 shadow-2xl backdrop-blur-xl border border-white/10 animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-zinc-900/95 text-white' : 'bg-white/95 text-zinc-900'}`}>
        
        {!isYoutube && (
            <audio 
                ref={audioRef} 
                onTimeUpdate={handleNativeTimeUpdate} 
                onLoadedMetadata={(e) => setDuration(e.target.duration)} 
                onEnded={() => setIsPlaying(false)}
                onError={handleAudioError} // Captura o erro do console
                playsInline 
            />
        )}
        
        {/* Barra de Progresso */}
        <div className="absolute top-0 left-4 right-4 -mt-1.5 h-4 flex items-center z-20 pointer-events-none">
             <div className={`w-full h-1.5 rounded-full overflow-hidden ${hasError ? 'bg-red-500/30' : (isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300')}`}>
                <div className={`h-full transition-all duration-500 ${hasError ? 'bg-red-500 w-full' : 'bg-orange-500'}`} style={{ width: hasError ? '100%' : `${progress}%` }} />
             </div>
        </div>

        <div className="flex items-center gap-4 mt-2 relative z-30"> 
            
            {/* Capa */}
            <div className="w-24 h-16 rounded-lg bg-black flex-shrink-0 overflow-hidden relative shadow-md border border-white/10">
                {isYoutube ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=0&modestbranding=1&playsinline=1`}
                        title="YouTube"
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        style={{ pointerEvents: 'none' }} 
                    />
                ) : (
                    <img src={track.cover || track.img} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                )}
            </div>
            
            {/* Informações */}
            <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold leading-tight truncate ${hasError ? 'text-red-500' : ''}`}>
                    {hasError ? "Erro na reprodução" : track.title}
                </h4>
                <p className="text-[10px] opacity-60 truncate flex items-center gap-1 mt-1">
                    {hasError 
                        ? "Formato inválido ou bloqueado (Mixed Content)" 
                        : (isYoutube 
                            ? <><Youtube size={10} className="text-red-500"/> YouTube</> 
                            : <><Mic size={10} className="text-blue-500"/> {track.source} • {formatTime(currentTime)} / {formatTime(duration)}</>
                        )
                    }
                </p>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
                {!isYoutube && !hasError && (
                    <button 
                        onClick={togglePlay} 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg bg-orange-500 hover:scale-105 active:scale-95 transition cursor-pointer"
                    >
                        {isPlaying ? <Pause size={18} fill="white"/> : <Play size={18} fill="white" className="ml-1"/>}
                    </button>
                )}

                {hasError && (
                     <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                        <VolumeX size={20} />
                     </div>
                )}
                
                {/* BOTÃO DE FECHAR (Blinded) */}
                <button 
                    onClick={handleClose} 
                    className="p-3 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 cursor-pointer z-50 pointer-events-auto active:scale-90 transition-transform"
                >
                    <X size={22} />
                </button>
            </div>
        </div>
    </div>
  );
};



// --- COMPONENTE: SPLASH SCREEN (AJUSTADO) ---
const SplashScreen = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 100);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2500);
    const t4 = setTimeout(onFinish, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onFinish]);

  // Ajustei a posição dos ícones para ficarem um pouco mais afastados já que o logo vai crescer
  const icons = [
    { Icon: Rss, color: 'text-blue-500', pos: '-translate-x-16 -translate-y-16' },
    { Icon: Youtube, color: 'text-red-500', pos: 'translate-x-16 -translate-y-16' },
    { Icon: Mic, color: 'text-orange-500', pos: '-translate-x-16 translate-y-16' },
    { Icon: Mail, color: 'text-purple-500', pos: 'translate-x-16 translate-y-16' },
  ];

  return (
    <div className={`
      fixed inset-0 z-[99999] flex items-center justify-center bg-black
      transition-opacity duration-700 ease-out
      ${step === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
    `}>
      {/* BACKGROUND AURA */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] animate-pulse delay-75" />
      </div>

      {/* CONTAINER CENTRAL */}
      <div className="flex flex-col items-center justify-center z-20">
        
        {/* 1. ÁREA DO LOGO */}
        {/* Removi o w-120 h-120 que era muito grande e criava espaço vazio */}
        <div className="relative flex items-center justify-center mb-0"> 
            
            {/* Ícones Orbitando */}
            {icons.map((item, i) => (
            <div
                key={i}
                className={`
                absolute transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                ${step >= 2 ? 'translate-x-0 translate-y-0 opacity-0 scale-0' : ''} 
                ${step === 0 ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
                ${step === 1 ? item.pos : ''}
                `}
            >
                <div className={`p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl ${item.color}`}>
                <item.Icon size={48} />
                </div>
            </div>
            ))}

            {/* O LOGO "N" - AUMENTADO AQUI */}
            <div 
            className={`
                relative z-20 flex items-center justify-center
                transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${step >= 2 ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-180'}
            `}
            >
            <div className={`absolute inset-0 bg-white/30 blur-2xl rounded-full ${step >= 2 ? 'animate-ping' : ''}`} />
            
            {/* MUDANÇA: w-24->w-40, h-24->h-40 (Aumentou o quadrado) */}
            <div className="w-40 h-40 bg-gradient-to-br from-white via-zinc-200 to-zinc-500 rounded-[2rem] flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.4)] border border-white/20">
                {/* MUDANÇA: text-5xl -> text-8xl (Aumentou a letra N) */}
                <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-black to-zinc-800 tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>
                    N
                </span>
            </div>
            </div>
        </div>

        {/* 2. O NOME "NewsOS" - PUXADO PARA CIMA */}
        <div className={`
            transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-100
            ${step >= 2 ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}
            mt-8 /* Ajuste aqui: Margem positiva pequena ou negativa se quiser colar mais */
        `}>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]" style={{ fontFamily: 'Inter, sans-serif' }}>
                NewsOS
            </h1>
        </div>

      </div>
    </div>
  );
};



// --- HELPER: ABRIR VÍDEO DE FORMA NATIVA (SEM TRAVAR O APP) ---
const openVideoSafe = async (videoUrl) => {
    if (!videoUrl) return;

    try {
        // Tenta usar o Capacitor Browser (Nativo do iOS)
        // Isso abre aquela tela de "safari dentro do app" que não trava.
        await Browser.open({
            url: videoUrl,
            presentationStyle: 'fullscreen', // No iPad fica como um popup elegante, no iPhone tela cheia
            toolbarColor: '#000000'       // Barra preta para imersão
        });
    } catch (e) {
        // Fallback para Web Pura (abre nova aba)
        window.open(videoUrl, '_blank');
    }
};

// Função auxiliar para extrair URL completa do YouTube a partir de ID ou Link parcial
const getFullVideoUrl = (video) => {
    if (!video) return null;
    
    // 1. Se já tem ID, monta a URL
    if (video.videoId) return `https://www.youtube.com/watch?v=${video.videoId}`;
    
    // 2. Se é link do YouTube, retorna ele mesmo
    if (video.link && (video.link.includes('youtube.com') || video.link.includes('youtu.be'))) {
        return video.link;
    }
    
    return null;
};



// --- FUNÇÃO 1: BUSCA NA WEB (DUCKDUCKGO VIA PROXY) ---
const searchWeb = async (query) => {
    try {
        // Usa a versão HTML (Lite) do DuckDuckGo que é mais fácil de ler e não bloqueia tanto
        const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(`https://html.duckduckgo.com/html/?q=${query}&kl=br-pt`);
        
        const res = await fetch(proxyUrl);
        const html = await res.text();
        
        // Parser simples para extrair resultados do HTML cru
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const results = [];
        
        const nodes = doc.querySelectorAll('.result');
        nodes.forEach((node) => {
            const titleNode = node.querySelector('.result__a');
            const snippetNode = node.querySelector('.result__snippet');
            
            if (titleNode && snippetNode) {
                results.push({
                    title: titleNode.textContent,
                    link: titleNode.getAttribute('href'),
                    snippet: snippetNode.textContent
                });
            }
        });

        // Retorna os 5 melhores
        return results.slice(0, 5);
    } catch (e) {
        console.error("Erro na busca web:", e);
        return [];
    }
};

// --- FUNÇÃO 2: GERAR RESPOSTA IA (GEMINI) ---
const askGeminiWithContext = async (question, contextResults, apiKey) => {
    if (!apiKey) return null;

    // Monta o contexto com os dados da busca
    const contextText = contextResults.map((r, i) => 
        `[Fonte ${i+1}]: ${r.title} - ${r.snippet}`
    ).join('\n');

    const prompt = `
    PERGUNTA DO USUÁRIO: "${question}"

    INFORMAÇÕES RECENTES DA WEB:
    ${contextText}

    SUA MISSÃO:
    Responda a pergunta do usuário usando APENAS as informações fornecidas acima.
    - Seja direto, jornalístico e imparcial.
    - Se a informação não estiver no texto, diga que não encontrou resultados recentes.
    - Cite as fontes pelos números (ex: [1], [2]) quando afirmar algo.
    - Resposta em Português do Brasil. Máximo 3 parágrafos.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta.";
    } catch (e) {
        return "Erro de conexão com a IA.";
    }
};




const FEED_CACHE_PREFIX = 'newsos_cache_v1_';





// --- COMPONENTE: ASK AI MODAL ---
const AskAIModal = ({ question, answer, sources, isLoading, onClose, isDarkMode }) => {
    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            
            <div className={`
                relative w-full max-w-md rounded-3xl p-6 shadow-2xl border flex flex-col gap-4
                ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}
            `}>
                {/* Pergunta */}
                <div className="flex items-start gap-3 border-b pb-4 border-dashed border-zinc-500/20">
                    <div className="p-2 rounded-full bg-indigo-500 text-white shrink-0">
                        <Search size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Você perguntou</span>
                        <h3 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {question}
                        </h3>
                    </div>
                </div>

                {/* Resposta */}
                <div className="min-h-[100px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-3 opacity-50">
                            <Loader2 size={32} className="animate-spin text-purple-500"/>
                            <p className="text-xs font-bold uppercase">Pesquisando na web & Escrevendo...</p>
                        </div>
                    ) : (
                        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {answer}
                        </div>
                    )}
                </div>

                {/* Fontes */}
                {!isLoading && sources && sources.length > 0 && (
                    <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Fontes Consultadas</span>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {sources.map((source, i) => (
                                <a 
                                    key={i} 
                                    href={source.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={`
                                        flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold max-w-[120px] truncate border
                                        ${isDarkMode ? 'bg-zinc-800 border-white/5 hover:bg-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}
                                    `}
                                >
                                    [{i+1}] {source.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={onClose} className="absolute top-4 right-4 opacity-50 hover:opacity-100">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}



// --- COMPONENTE: STORY OVERLAY (CORRIGIDO ERRO CONFIGURAÇÃO) ---
const StoryOverlay = ({ story, onClose, onRead, onMarkAsSeen, allStories, onNavigate }) => {
  
  useEffect(() => {
    if (story && story.id && onMarkAsSeen) {
        onMarkAsSeen(story.id); 
    }
  }, [story, onMarkAsSeen]);

  const currentIndex = Array.isArray(allStories) ? allStories.findIndex(s => s.id === story.id) : -1;
  const hasPrevStory = currentIndex > 0;
  const hasNextStory = currentIndex >= 0 && currentIndex < (allStories?.length || 0) - 1;

  if (!story || !story.items || story.items.length === 0) return null;
  const currentItem = story.items[0];

  const isShort = currentItem.link?.includes('/shorts/') || currentItem.title?.toLowerCase().includes('#shorts');
  
  const match = currentItem.link?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  const videoId = currentItem.videoId || (match ? match[1] : null);

  // FUNÇÃO INTERNA CORRETA
  const handleReadFull = () => {
      onClose(); 
      if (onRead) onRead(currentItem); 
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col animate-in zoom-in-95 duration-300">
       <div className="relative w-full h-full md:max-w-[60vh] md:aspect-[9/16] md:mx-auto md:my-auto md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/5">
        
        <div className="absolute inset-0 bg-black">
            {isShort && videoId ? (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    className="w-full h-full object-cover pointer-events-auto"
                    title="Shorts Player"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            ) : (
                <>
                    <img src={currentItem.img} className="w-full h-full object-cover" alt="Story" onError={(e) => { e.target.style.display = 'none'; }}/>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
                </>
            )}
        </div>

        {/* NAVEGAÇÃO */}
        <div className="absolute inset-0 z-20 flex pointer-events-none">
            <div className="w-[20%] h-full pointer-events-auto" onClick={() => onNavigate('prev')} />
            <div className="flex-1 h-full" />
            <div className="w-[20%] h-full pointer-events-auto" onClick={() => onNavigate('next')} />
        </div>

        {/* CABEÇALHO */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-10 md:pt-8 z-30 space-y-2 pointer-events-none">
          <div className="flex gap-1.5 h-1">
              {allStories && allStories.map((s, idx) => (
                  <div key={s.id} className={`flex-1 rounded-full h-full ${idx < currentIndex ? 'bg-white' : (idx === currentIndex ? 'bg-white animate-[progress_5s_linear]' : 'bg-white/20')}`} />
              ))}
          </div>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/30 p-[2px] bg-black/20 backdrop-blur-md">
                      <img src={story.avatar} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="flex flex-col drop-shadow-md">
                      <span className="text-white font-black text-sm tracking-tight">{story.name}</span>
                      <span className="text-zinc-300 text-[10px] font-bold opacity-90">{currentItem.time}</span>
                  </div>
              </div>
              <button onClick={onClose} className="pointer-events-auto p-2.5 text-white/80 hover:text-white backdrop-blur-xl rounded-full bg-white/10 border border-white/10 active:scale-90"><X size={26} /></button>
          </div>
        </div>

        {/* BOTÃO LER CORRIGIDO */}
        {!isShort && (
            <div className="absolute bottom-0 left-0 right-0 p-8 z-30 pb-12 md:pb-10 pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-center">
                    <h2 className="text-white text-2xl md:text-3xl font-black leading-tight mb-8 drop-shadow-2xl font-serif text-center line-clamp-5">{currentItem.title}</h2>
                    
                    {/* AQUI ESTAVA O ERRO DE VARIÁVEL - AGORA CHAMA handleReadFull */}
                    <button onClick={(e) => { e.stopPropagation(); handleReadFull(); }} className="group w-full bg-white text-black font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-zinc-100">
                        <span className="text-sm uppercase tracking-widest">Ler Notícia Completa</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        )}
       </div>
       <div className="fixed inset-0 -z-10 bg-zinc-950/95 backdrop-blur-3xl md:block hidden" onClick={onClose} />
    </div>
  );
}



const generateSmartStories = (news, allClusters) => {
    if (!news || news.length === 0) return [];

    // --- CONFIGURAÇÕES DA LÓGICA ---
    const BREAKING_NEWS_SOURCES = new Set(['Terra', 'Extra', 'Veja', 'CNN Brasil', 'Times Brasil', 'UOL', 'Jovem Pan', 'Istoé', 'G1 Mundo', 'G1 Nacional', 'Metropoles', 'Leo Dias', 'Fox News']);
    const BREAKING_NEWS_KEYWORDS = ['urgente', 'agora', 'ao vivo', 'última hora', 'alerta', 'plantão', 'acontece', 'acaba de', 'últimas informações', 'exclusivo', 'bomba', 'morre', 'desastre', 'acabou de', 'breaking news', 'ultimos acontecimentos', 'operação', 'deflagra', 'deflagrada', 'crise', 'explosão'];
    const BREAKING_NEWS_TIMESPAN_MS = 45 * 60 * 1000;
    const ANCHOR_CACHE_TTL_MS = 40 * 60 * 1000;
    const ANCHOR_CACHE_KEY = 'newsos_anchor_story_cache';

    const now = Date.now();
    let breakingNewsArticle = null;
    let anchorArticle = null;

    // --- ETAPA 1: TENTAR RESTAURAR A ÂNCORA DO CACHE ---
    try {
        const cachedAnchorRaw = localStorage.getItem(ANCHOR_CACHE_KEY);
        if (cachedAnchorRaw) {
            const cachedAnchor = JSON.parse(cachedAnchorRaw);
            // Verifica se o cache ainda é válido (tempo não expirou)
            if (now - cachedAnchor.timestamp < ANCHOR_CACHE_TTL_MS) {
                // Procura o artigo exato do cache na lista de notícias ATUAIS.
                // Isso garante que a âncora só persiste se ainda for relevante no feed.
                const foundArticle = news.find(n => n && n.id === cachedAnchor.article.id);
                if (foundArticle) {
                    anchorArticle = foundArticle; // Usa a versão "fresca" do artigo
                }
            } else {
                localStorage.removeItem(ANCHOR_CACHE_KEY); // Limpa o cache se expirou
            }
        }
    } catch (e) {
        localStorage.removeItem(ANCHOR_CACHE_KEY); // Limpa se o cache estiver corrompido
    }

    // --- ETAPA 2: SE NÃO HÁ ÂNCORA NO CACHE, CALCULA UMA NOVA ---
    if (!anchorArticle) {
        if (allClusters && allClusters.length > 0 && allClusters[0].related_articles && allClusters[0].related_articles.length > 0) {
            anchorArticle = allClusters[0].related_articles[0];
        } else if (news.length > 0) {
            // Fallback: A âncora é a notícia mais recente de todas se não houver clusters
            anchorArticle = news.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())[0];
        }
        
        // Salva a nova âncora no cache, se encontrada
        if (anchorArticle) {
            try {
                localStorage.setItem(ANCHOR_CACHE_KEY, JSON.stringify({ article: anchorArticle, timestamp: now }));
            } catch (e) {
                console.warn("Falha ao salvar âncora no cache:", e);
            }
        }
    }

    // --- ETAPA 3: IDENTIFICA A BREAKING NEWS ---
    const potentialBreaking = news.filter(article => {
        if (!article) return false;
        const articleTime = new Date(article.rawDate).getTime();
        if (now - articleTime > BREAKING_NEWS_TIMESPAN_MS) return false;
        if (!BREAKING_NEWS_SOURCES.has(article.source)) return false;
        const titleLower = article.title.toLowerCase();
        return BREAKING_NEWS_KEYWORDS.some(keyword => titleLower.includes(keyword));
    });

    if (potentialBreaking.length > 0) {
        breakingNewsArticle = potentialBreaking.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())[0];
    }

    // --- ETAPA 4: MONTAGEM DA LISTA FINAL COM RECONCILIAÇÃO ---
    const finalStoryList = [];
    const usedIds = new Set();
    const usedSources = new Set(); // <<< NOVO: Para garantir que a fonte da âncora não se repita

    if (breakingNewsArticle) {
        finalStoryList.push({ ...breakingNewsArticle, isBreaking: true });
        usedIds.add(breakingNewsArticle.id);
        usedSources.add(breakingNewsArticle.source);
    }
    if (anchorArticle && !usedIds.has(anchorArticle.id)) {
        finalStoryList.push({ ...anchorArticle, isAnchor: true });
        usedIds.add(anchorArticle.id);
        usedSources.add(anchorArticle.source);
    }
    
    // --- ETAPA 5: GERAÇÃO DOS STORIES RESTANTES (EMBARALHADOS) ---
    const latestBySource = new Map();
    news.forEach(item => {
        if (item && !latestBySource.has(item.source)) {
            latestBySource.set(item.source, item);
        }
    });

    let remainingCandidates = Array.from(latestBySource.values()).filter(article => {
        if (!article) return false;
        // Garante que não vamos adicionar um story de uma fonte que já é Âncora ou Breaking News
        return !usedIds.has(article.id) && !usedSources.has(article.source);
    });

    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    remainingCandidates.sort(() => (Math.sin(dayOfYear + remainingCandidates.length) - 0.5));
    
    finalStoryList.push(...remainingCandidates);

    // --- ETAPA 6: FORMATAÇÃO FINAL PARA A UI ---
    return finalStoryList
        .filter(Boolean)
        .map(item => {
            const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'News')}&background=random&color=fff&size=800&font-size=0.33&length=3`;
            const finalImg = (item.img && item.img.length > 10) ? item.img : fallbackImage;

            return {
                id: item.id,
                name: item.source,
                avatar: item.logo || `https://ui-avatars.com/api/?name=${item.source}&background=random&color=fff`,
                isBreaking: !!item.isBreaking,
                isAnchor: !!item.isAnchor,
                items: [{ ...item, img: finalImg, origin: 'story' }]
            };
    });
};


// --- COMPONENTE PRINCIPAL (V14 - COM PERSISTÊNCIA E FETCH FEEDS INTEGRADO) ---
export default function NewsOS_V12() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('happening'); 
  const [globalClusters, setGlobalClusters] = useState(null); 
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null); 
  const [selectedStory, setSelectedStory] = useState(null);
  const navTimerRef = useRef(null); 
  const [isPodcastOpen, setIsPodcastOpen] = useState(false);
  const handleOpenPodNews = () => setIsPodcastOpen(true);
  const [glassArticle, setGlassArticle] = useState(null);
  
  // --- ESTADOS DE DADOS (Iniciam vazios e são preenchidos pelo Load) ---
  const [isDarkMode, setIsDarkMode] = useState(false); 
// --- ESTADO DE CHAVES (ARQUITETURA DE POOLS) ---
const [apiKeys, setApiKeys] = useState([
    // Pool de Widgets (Leve - Rotação Rápida)
    { id: 1, value: '', type: 'free_widget' },
    { id: 2, value: '', type: 'free_widget' },
    { id: 3, value: '', type: 'free_widget' },
    { id: 4, value: '', type: 'free_widget' },
    
    // Legado / Backup (Antigas Pagas)
    { id: 5, value: '', type: 'legacy_text' },
    { id: 6, value: '', type: 'legacy_audio' },

    // POOL USINA (AGORA COM 6)
    { id: 7, value: '', type: 'heavy_rotation' },
    { id: 8, value: '', type: 'heavy_rotation' },
    { id: 9, value: '', type: 'heavy_rotation' },
    { id: 10, value: '', type: 'heavy_rotation' },
    { id: 11, value: '', type: 'heavy_rotation' },
    { id: 15, value: '', type: 'heavy_rotation' }, // <<-- SUA 6ª CHAVE (usei ID 15)

    // Pool de Chat
    { id: 12, value: '', type: 'chat_key' },
    { id: 13, value: '', type: 'chat_key' },
]);


// --- NOVO HOOK: useLongPress ---
// Detecta um clique longo sem disparar o clique normal.
const useLongPress = (onLongPress, onClick, { threshold = 400 } = {}) => {
  const timerRef = useRef();
  const isLongPress = useRef(false);

  const start = useCallback((event) => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      onLongPress(event);
      isLongPress.current = true;
    }, threshold);
  }, [onLongPress, threshold]);

  const clear = useCallback(() => {
    timerRef.current && clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback((event) => {
    // Só dispara o clique normal se o clique longo não ocorreu.
    if (!isLongPress.current) {
      onClick(event);
    }
  }, [onClick]);

  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseUp: (e) => { clear(); handleClick(e); },
    onMouseLeave: () => clear(),
    onTouchEnd: (e) => { clear(); handleClick(e); },
  };
};

  
  // ==============================================================================
  // === INÍCIO DO BLOCO DE OTIMIZAÇÃO DE RESIZE (NOVO E COMPLETO) ===
  // ==============================================================================

  // 1. Estado para a largura "oficial" e Refs para manipulação direta
  const [panelWidth, setPanelWidth] = useState(600); // Controla a largura final
  const panelDivRef = useRef(null);      // Referência para o DIV do painel
  const isResizing = useRef(false);      // Flag para saber se estamos arrastando
  const resizeStartX = useRef(0);        // Posição X inicial do mouse/dedo
  const initialWidth = useRef(0);        // Largura inicial do painel
  const rafId = useRef(null);            // ID para o requestAnimationFrame para suavidade extra

  // 2. Função de MOVIMENTO (manipula o DOM diretamente para performance)
  const handleResizeMove = useCallback((e) => {
    if (!isResizing.current || !panelDivRef.current) return;
    
    // Previne comportamento padrão (como scroll da página no mobile)
    if(e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    // Cancela o frame de animação anterior para evitar sobrecarga
    if (rafId.current) cancelAnimationFrame(rafId.current);

    // Usa requestAnimationFrame para garantir que a manipulação do DOM seja fluida
    rafId.current = requestAnimationFrame(() => {
        const deltaX = clientX - resizeStartX.current;
        const newWidth = Math.max(300, Math.min(initialWidth.current - deltaX, window.innerWidth));
        
        // A MÁGICA: Altera o estilo diretamente no elemento do DOM, sem re-renderizar o React
        panelDivRef.current.style.width = `${newWidth}px`;
    });
  }, []);

// 3. Função de FIM (soltar o mouse/dedo, sincroniza com o React e "descongela" o fundo)
  const handleResizeUp = useCallback(() => {
    isResizing.current = false;
    
    // Devolve o comportamento normal ao navegador
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.style.touchAction = '';

    // "Descongela" a FeedTab, trazendo-a de volta ao normal suavemente
    if (mainRef.current) {
        mainRef.current.style.pointerEvents = '';
        mainRef.current.style.userSelect = '';
        mainRef.current.style.opacity = '1';
    }

    if (panelDivRef.current) {
        // Reativa a transição suave do CSS para o fechamento
        panelDivRef.current.style.transition = 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        
        // AGORA SIM: Atualiza o estado do React uma única vez com a largura final
        const finalWidth = parseInt(panelDivRef.current.style.width, 10);
        setPanelWidth(finalWidth);
    }

    if (rafId.current) cancelAnimationFrame(rafId.current);

    // Remove os 'escutadores' de evento globais
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeUp);
    window.removeEventListener('touchmove', handleResizeMove);
    window.removeEventListener('touchend', handleResizeUp);
  }, [handleResizeMove]); // A dependência garante que a versão mais recente da função seja usada

  // 4. Função de INÍCIO (clicar e segurar no puxador, "congela" o fundo)
  const handleResizeStart = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    
    e.preventDefault(); 
    e.stopPropagation();

    isResizing.current = true;
    resizeStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    initialWidth.current = panelDivRef.current.offsetWidth;
    
    // DESLIGA a transição do CSS temporariamente para o arraste ser instantâneo
    if (panelDivRef.current) {
        panelDivRef.current.style.transition = 'none';
    }
    
    // "Congela" a FeedTab para a GPU: desativa interações e a deixa semi-transparente
    if (mainRef.current) {
        mainRef.current.style.pointerEvents = 'none';
        mainRef.current.style.userSelect = 'none';
        mainRef.current.style.transition = 'opacity 0.3s ease'; // Transição suave para o "congelamento"
        mainRef.current.style.opacity = '0.7';
    }
    
    // Trava a seleção de texto e o scroll da página durante o arraste
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    document.body.style.touchAction = 'none'; // Crítico para iPad
    
    // Adiciona os 'escutadores' de evento na janela inteira
    window.addEventListener('mousemove', handleResizeMove, { passive: false });
    window.addEventListener('mouseup', handleResizeUp);
    window.addEventListener('touchmove', handleResizeMove, { passive: false });
    window.addEventListener('touchend', handleResizeUp);
  };
  
  // ==============================================================================
  // === FIM DO BLOCO DE OTIMIZAÇÃO DE RESIZE ===
  // ==============================================================================



  // --- ÍNDICES DE ROTAÇÃO (PERSISTENTES) ---
  // Usamos useRef para que o índice não resete a cada renderização
  const widgetRotationIndex = useRef(
  typeof window !== 'undefined' ? parseInt(localStorage.getItem('widgetRotationIndex') || '0', 10) : 0
);
  // 1. Inicializa o ref lendo o valor salvo no localStorage. Se não houver, começa em 0.
const heavyRotationIndex = useRef(
  typeof window !== 'undefined' ? parseInt(localStorage.getItem('heavyRotationIndex') || '0', 10) : 0
);

// 2. Adicione este useEffect em qualquer lugar dentro do NewsOS_V12
// Ele salva o valor atual do contador no localStorage toda vez que ele é atualizado.
useEffect(() => {
  const saveIndex = () => {
    localStorage.setItem('heavyRotationIndex', heavyRotationIndex.current.toString());
  };

  // Salva quando o componente é desmontado (usuário fecha a aba/navegador)
  window.addEventListener('beforeunload', saveIndex);

  return () => {
    // Garante que o último valor seja salvo ao sair
    saveIndex(); 
    window.removeEventListener('beforeunload', saveIndex);
  };
}, []); // Roda apenas uma vez, na montagem do componente.


useEffect(() => {
  const saveWidgetIndex = () => {
    localStorage.setItem('widgetRotationIndex', widgetRotationIndex.current.toString());
  };

  window.addEventListener('beforeunload', saveWidgetIndex);

  return () => {
    saveWidgetIndex(); 
    window.removeEventListener('beforeunload', saveWidgetIndex);
  };
}, []);
  const chatRotationIndex = useRef(0);

  // --- O DISTRIBUIDOR DE CHAVES (ROTAÇÃO SEQUENCIAL OTIMIZADA) ---
  const getApiKey = useCallback((purpose) => {
    
    // Pool de Widgets (sem alteração)
    if (purpose === 'widgets') {
        const freeKeys = apiKeys.filter(k => k.type === 'free_widget' && k.value && k.value.trim() !== '');
        if (freeKeys.length === 0) return null; 
        const key = freeKeys[widgetRotationIndex.current % freeKeys.length];
        widgetRotationIndex.current += 1; 
        console.log(`[Rotação Widgets] Usando chave ID: ${key.id}`);
        return key.value;
    }

    // >> POOL PESADO (ALTERAÇÃO AQUI) <<
    if (purpose === 'analysis' || purpose === 'script' || purpose === 'audio') {
        // Agora o filtro usa o 'type' em vez de IDs fixos, se adaptando automaticamente
        const heavyKeys = apiKeys.filter(k => k.type === 'heavy_rotation' && k.value && k.value.trim() !== '');
        
        if (heavyKeys.length === 0) {
             const legacyKey = apiKeys.find(k => (purpose === 'audio' ? k.id === 6 : k.id === 5))?.value;
             return legacyKey || null;
        }
        
        const key = heavyKeys[heavyRotationIndex.current % heavyKeys.length];
        heavyRotationIndex.current += 1;
        
        console.log(`[Rotação Heavy] Usando chave ID: ${key.id} para ${purpose}`);
        return key.value;
    }

    // 3. POOL CHAT - IDs 12 e 13
    if (purpose === 'chat') {
        const chatKeys = apiKeys.filter(k => k.type === 'chat_key' && k.value && k.value.trim() !== '');
        
        // Se não tiver chave de chat, tenta usar do pool de widgets como fallback
        if (chatKeys.length === 0) {
             return getApiKey('widgets'); 
        }
        
        const key = chatKeys[chatRotationIndex.current % chatKeys.length];
        chatRotationIndex.current += 1;
        
        console.log(`[Rotação Chat] Usando chave ID: ${key.id}`);
        return key.value;
    }

    return null;
  }, [apiKeys]); // Recria a função apenas se o usuário mudar as chaves nas configurações

  // Função helper para o Chat (passada como callback)
  const getChatApiKey = useCallback(() => {
      return getApiKey('chat');
  }, [getApiKey]);
  
const [userFeeds, setUserFeeds] = useState([]);
  const [savedItems, setSavedItems] = useState(SAVED_ITEMS);
  const [articleHistory, setArticleHistory] = useState({});
  const [readHistory, setReadHistory] = useState([]);
  const [likedItems, setLikedItems] = useState([]); 
    const feedMemoryBuffer = useRef({});

  // --- ESTADOS DE UI ---
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [seenStoryIds, setSeenStoryIds] = useState([]);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [youtubeChannelFilter, setYoutubeChannelFilter] = useState('all');
  
  const [realNews, setRealNews] = useState([]); 
  const [realVideos, setRealVideos] = useState([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [realPodcasts, setRealPodcasts] = useState([]);

  // --- ESTADOS ASK AI ---
  const [askQuestion, setAskQuestion] = useState(null);
  const [askAnswer, setAskAnswer] = useState(null);
  const [askSources, setAskSources] = useState([]);
  const [isAskLoading, setIsAskLoading] = useState(false);
  const [viewedInStoryId, setViewedInStoryId] = useState(null);


const heuristicClusters = useMemo(() => {
      return generateHeuristicClustersV2(realNews);
  }, [realNews]);

const storiesForHappeningTab = useMemo(() => {
    console.log("LOG: Recalculando stories inteligentes..."); // Adicione este log para depurar
    const allClusters = globalClusters || heuristicClusters;
    return generateSmartStories(realNews, allClusters);
}, [realNews, globalClusters, heuristicClusters]); // Adicione heuristicClusters aqui


 const handleAskAI = async (query) => {
      setAskQuestion(query);
      setAskAnswer(null);
      setAskSources([]);
      setIsAskLoading(true);

      // 1. Busca na Web (Gratuita)
      const results = await searchWeb(query);
      setAskSources(results);

      // 2. Pergunta pro Gemini
      // CORREÇÃO: Usamos o getApiKey para pegar uma chave de rotação (chat/widgets)
      const activeKey = getApiKey('chat'); 
      
      if (!activeKey) {
          setAskAnswer("Erro: Nenhuma chave de API configurada para o chat.");
          setIsAskLoading(false);
          return;
      }

      const aiResponse = await askGeminiWithContext(query, results, activeKey);
      
      setAskAnswer(aiResponse);
      setIsAskLoading(false);
  };

  // --- AUTENTICAÇÃO E SYNC ---
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false); 



const handleHappeningRefresh = async () => {
    // Passamos TRUE para dizer: "Ignore a RAM, ignore o Disco, vá no Supabase agora!"
    await fetchFeeds(true); 
};

const handleStoryNavigation = (direction) => {
    // MUDANÇA: Agora olhamos para 'storiesForHappeningTab' (a lista real que o usuário vê)
    if (!selectedStory || !storiesForHappeningTab) return;

    const currentIndex = storiesForHappeningTab.findIndex(s => s.id === selectedStory.id);
    if (currentIndex === -1) return;

    if (direction === 'next') {
        const nextIndex = currentIndex + 1;
        if (nextIndex < storiesForHappeningTab.length) {
            setSelectedStory(storiesForHappeningTab[nextIndex]);
        } else {
            closeStory(); // Acabou, fecha
        }
    } else if (direction === 'prev') {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            setSelectedStory(storiesForHappeningTab[prevIndex]);
        }
    }
  };

  // 1. Verificar usuário ao carregar
  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) loadUserData(session.user.id);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        if (session?.user) loadUserData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Função para Carregar Dados do Banco
  const loadUserData = async (userId) => {
      setIsSyncing(true);
      const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

      if (data) {
          if (data.feeds) setUserFeeds(data.feeds);
          if (data.saved_items) setSavedItems(data.saved_items);
          if (data.read_history) setReadHistory(data.read_history);
          if (data.liked_items) setLikedItems(data.liked_items);
          
          if (data.api_key) {
              try {
                  const parsedFromDB = JSON.parse(data.api_key);

                  if (Array.isArray(parsedFromDB)) {
                      const defaultKeysStructure = [
                          { id: 1, value: '', type: 'free_widget' }, { id: 2, value: '', type: 'free_widget' },
                          { id: 3, value: '', type: 'free_widget' }, { id: 4, value: '', type: 'free_widget' },
                          { id: 5, value: '', type: 'legacy_text' }, { id: 6, value: '', type: 'legacy_audio' },
                          { id: 7, value: '', type: 'heavy_rotation' }, { id: 8, value: '', type: 'heavy_rotation' },
                          { id: 9, value: '', type: 'heavy_rotation' }, { id: 10, value: '', type: 'heavy_rotation' },
                          { id: 11, value: '', type: 'heavy_rotation' }, { id: 15, value: '', type: 'heavy_rotation' },
                          { id: 12, value: '', type: 'chat_key' }, { id: 13, value: '', type: 'chat_key' },
                      ];

                      // ==========================================================
                      // === A MUDANÇA CRÍTICA ESTÁ AQUI ===
                      // ==========================================================
                      const mergedKeys = defaultKeysStructure.map(defaultKey => {
                          const keyFromDB = parsedFromDB.find(dbKey => dbKey.id === defaultKey.id);
                          
                          // LÓGICA DE FUSÃO SEGURA E EXPLÍCITA
                          return {
                              id: defaultKey.id,           // Usa o ID do padrão, sempre.
                              type: defaultKey.type,         // Usa o TYPE do padrão, sempre.
                              value: keyFromDB?.value || ''  // Pega o VALUE do banco, ou retorna '' se não existir.
                          };
                      });
                      
                      setApiKeys(mergedKeys);

                  } else {
                      console.warn("Formato de chaves antigo no banco. Mantendo estado padrão.");
                  }
              } catch (e) {
                  console.error("Erro ao fazer parse das chaves do banco:", e);
              }
          }
          if (data.is_dark_mode !== null) setIsDarkMode(data.is_dark_mode);
          if (data.seen_story_ids) setSeenStoryIds(data.seen_story_ids);
          if (data.article_history) setArticleHistory(data.article_history);
      } else if (!error) {
          await supabase.from('user_preferences').insert([{ user_id: userId }]);
      }
      setIsSyncing(false);
  };

  // 3. Função para Salvar (Debounced effect)
  useEffect(() => {
      if (!user || isSyncing) return;

      const saveData = async () => {
          const updates = {
              user_id: user.id,
              feeds: userFeeds,
              saved_items: savedItems,
              read_history: readHistory,
              liked_items: likedItems,
              api_key: JSON.stringify(apiKeys),
              is_dark_mode: isDarkMode,
              seen_story_ids: seenStoryIds, 
              article_history: articleHistory,
              updated_at: new Date()
          };

          const { error } = await supabase
              .from('user_preferences')
              .upsert(updates);
          
          if (error) console.error("Erro ao salvar:", error);
      };

      const timer = setTimeout(() => {
          saveData();
      }, 5000);

      return () => clearTimeout(timer);
  }, [user, userFeeds, savedItems, readHistory, likedItems, apiKeys, isDarkMode, seenStoryIds, articleHistory]);


  // --- FUNÇÕES DE AUXÍLIO ---
  const markStoryAsSeen = (id) => {
    if (!seenStoryIds.includes(id)) {
      setSeenStoryIds(prev => [...prev, id]);
    }
  };
  




  const handleSaveToArchive = (article, note) => {
      setSavedItems(prev => {
          const filtered = prev.filter(i => i.id !== article.id);
          return [{
              ...article,
              category: 'Arquivo', 
              isArchived: true,
              userNote: note,
              date: 'Editado agora'
          }, ...filtered];
      });
      alert("Artigo salvo no Arquivo!");
  };

  const handleToggleLike = (article) => {
    setLikedItems(prev => {
      if (prev.includes(article.id)) return prev.filter(id => id !== article.id);
      return [...prev, article.id];
    });
  };

 
  // --- FUNÇÃO AUXILIAR: LIMPEZA DE CACHE (Garbage Collection) ---
  const cleanUpCache = () => {
    try {
        console.log("🧹 Iniciando protocolo de limpeza de emergência...");
        const keys = Object.keys(localStorage);

        // Lista de chaves que PODEM ser apagadas (Lixo reciclável)
        // Inclui: Feeds, Trend Radar antigo e Smart Digest antigo
        const keysToRemove = keys.filter(k => 
            k.startsWith('newsos_cache_v1_') || 
            k.startsWith('newsos_trend_radar') ||
            k.startsWith('newsos_smart_digest') ||
            k.startsWith('newsos_feed_')
        );
        
        // Se a memória encheu, não adianta apagar um pouco. Apaga tudo que é cache.
        // O usuário baixa de novo o que precisar. É melhor do que o app travar.
        if (keysToRemove.length > 0) { 
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`✅ Faxina completa: ${keysToRemove.length} arquivos de cache removidos.`);
            return true; // Retorna true avisando que limpou
        }
        return false;
    } catch (e) {
        console.warn("Erro ao tentar limpar cache:", e);
        return false;
    }
};

  // --- FETCH FEEDS BLINDADO V3 (CACHE DUPLO: RAM + DISCO) ---
  const fetchFeeds = async (forceRefresh = false) => {
    if (userFeeds.length === 0) {
        setRealNews([]);
        setRealVideos([]);
        setRealPodcasts([]);
        return;
    }

    setIsLoadingFeeds(true);
    
    let allNewsItems = [];
    let allVideoItems = [];
    let allPodcastItems = [];
    let feedsThatNeedUpdate = [];
    
    let newHistoryBuffer = { ...articleHistory };

    // 20 Minutos de Cache (Segurança máxima)
    const CACHE_TTL = 20 * 60 * 1000; 

    const promises = userFeeds.map(async (feed) => {
        if (!feed.url || !feed.url.trim()) {
    console.warn(`[AVISO DE DADOS] Fonte ignorada por não ter URL:`, feed);
    return; // Pula para a próxima fonte
}
        let feedItems = [];
        let currentFeedTitle = feed.name; 
        let detectedXmlTitle = "";
        let feedLogo = null;
        let isFeedYoutube = feed.url.includes('youtube.com') || feed.url.includes('youtu.be');
        let usedCache = false;
        const cacheKey = `${FEED_CACHE_PREFIX}${feed.id}`; 

        // --- CAMADA 1: MEMÓRIA RAM (Infalível durante a sessão) ---
        // Se o usuário navegou, voltou, e o disco falhou antes, a RAM salva.
        if (!forceRefresh && feedMemoryBuffer.current[feed.id]) {
            const memData = feedMemoryBuffer.current[feed.id];
            const now = Date.now();
            if (now - memData.timestamp < CACHE_TTL) {
                // console.log(`🧠 RAM Cache OK: ${feed.name}`);
                feedItems = memData.items;
                detectedXmlTitle = memData.title;
                feedLogo = memData.logo;
                if (memData.isYoutube) isFeedYoutube = true;
                usedCache = true;
            }
        }

        // --- CAMADA 2: DISCO (Persistente, mas pode falhar) ---
        if (!usedCache && !forceRefresh) {
            try {
                const cachedRaw = localStorage.getItem(cacheKey);
                if (cachedRaw) {
                    const cachedData = JSON.parse(cachedRaw);
                    const now = Date.now();
                    if (now - cachedData.timestamp < CACHE_TTL) {
                        console.log(`💾 Disk Cache OK: ${feed.name}`);
                        feedItems = cachedData.items || [];
                        detectedXmlTitle = cachedData.title || "";
                        feedLogo = cachedData.logo || null;
                        if (cachedData.isYoutube) isFeedYoutube = true;
                        
                        // Hidrata a RAM para ficar mais rápido na próxima
                        feedMemoryBuffer.current[feed.id] = {
                            timestamp: cachedData.timestamp,
                            items: feedItems,
                            title: detectedXmlTitle,
                            logo: feedLogo,
                            isYoutube: isFeedYoutube
                        };
                        usedCache = true;
                    }
                }
            } catch (cacheErr) {
                console.warn(`Cache de disco ilegível para ${feed.name}`);
            }
        }

        // --- CAMADA 3: FETCH REAL (Custo $$) ---
     if (!usedCache) {
            const isLegacySource = feed.url.includes('uol.com.br') || 
                                   feed.url.includes('folha.uol.com.br') || 
                                   feed.url.includes('moneytimes.com.br');
            try {
                if (isLegacySource) {
                    // Proxy Gratuito
                    const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(feed.url);
                    const res = await fetch(proxyUrl);
                    if (!res.ok) throw new Error(`Proxy status: ${res.status}`);
                    const buffer = await res.arrayBuffer();
                    
                    // 1. DECLARA A VARIÁVEL AQUI FORA (O Balde Vazio)
                    let xmlText = ""; 

                    // 2. ENCHE O BALDE COM A CODIFICAÇÃO CORRETA
                    if (feed.url.includes('band.uol') || feed.url.includes('band.com') || feed.url.includes('moneytimes')) {
                         const decoder = new TextDecoder('utf-8');
                         xmlText = decoder.decode(buffer);
                    } else {
                         // Padrão antigo para Folha e UOL Clássico
                         const decoder = new TextDecoder('iso-8859-1');
                         xmlText = decoder.decode(buffer);
                    }

                    // 3. USA A VARIÁVEL PREENCHIDA (Agora ela existe e tem o texto certo)
                    const parsedData = parseXMLToNewsItems(xmlText, feed.name, feed.id);
                    
                    feedItems = parsedData.items;
                    detectedXmlTitle = parsedData.realTitle; 
                    
                    // Ajuste de logos legados
                    if (feed.url.includes('folha')) feedLogo = "https://www.google.com/s2/favicons?domain=folha.uol.com.br&sz=128";
                    else feedLogo = "https://www.google.com/s2/favicons?domain=www.uol.com.br&sz=128";

                } else {
                    // Supabase (Pago)
                    const { data, error } = await supabase.functions.invoke('parse-feed', { body: { url: feed.url, brief: true } });
                    if (!error && data && data.items) {
                        feedItems = data.items;
                        detectedXmlTitle = data.title;
                        feedLogo = data.image;
                        if (data.isYoutube) isFeedYoutube = true;
                    }
                }

                // Se baixou dados com sucesso...
                if (feedItems && feedItems.length > 0) {
                    const cachePayload = {
                        timestamp: Date.now(),
                        items: feedItems,
                        title: detectedXmlTitle,
                        logo: feedLogo,
                        isYoutube: isFeedYoutube
                    };

                    // 1. SALVA NA RAM (Garantia imediata)
                    feedMemoryBuffer.current[feed.id] = cachePayload;

                    // 2. TENTA SALVAR NO DISCO (Garantia futura)
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
                    } catch (storageError) {
                        if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                            console.warn("⚠️ Disco cheio. Usando apenas memória RAM para esta sessão.");
                            // Tenta limpar um pouco, mas sem desespero, pois a RAM já salvou o dia.
                            cleanUpCache(); 
                            try { localStorage.setItem(cacheKey, JSON.stringify(cachePayload)); } catch (e) {}
                        }
                    }
                }
            } catch (err) {
                console.error(`Erro ao baixar ${feed.name}:`, err);
            }
        }

        // --- PROCESSAMENTO FINAL ---
        if (feed.name === 'Nova Fonte' || feed.name === 'Sem Título') {
            currentFeedTitle = detectedXmlTitle || feed.name;
            feedsThatNeedUpdate.push({ id: feed.id, name: currentFeedTitle });
        }

        // --- TRATAMENTO DE LOGOS ESPECÍFICOS (MANUAL) ---
            let finalLogo = feedLogo;
            const lowerName = currentFeedTitle.toLowerCase();
            const lowerUrl = feed.url.toLowerCase(); // Adicionei para segurança

            // 1. Dicionário Manual de Ícones (Prioridade Alta)
            if (lowerName.includes('investnews')) {
                finalLogo = 'https://media.licdn.com/dms/image/v2/D4D0BAQES2TW4kCWAHg/company-logo_200_200/company-logo_200_200/0/1709575002406/investnewsbr_logo?e=2147483647&v=beta&t=8CtOWb8yD8V_BkdM-Oc82N44dygx6y6FXUYrnOPt0IM';
            } 
            else if (lowerName.includes('valor investe')) {
                // Link oficial de alta resolução
                finalLogo = 'https://s2-valor-investe.glbimg.com/aDBdPPmCO_D-Ta4FTzx4OJmuWEE=/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_f035dd6fd91c438fa04ab718d608bbaa/internal_photos/bs/2019/Q/I/KlbOBJSh6NyJ7CNJz6jA/fb-investe.png'; 
            }
            else if (lowerName.includes('valor economico') || lowerName.includes('valor econômico')) {
                // Favicon oficial
                finalLogo = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzaIMqhf99JTJqG1Cbu7Kil51_jH42uWGg0w&s';
            }
            else if (lowerName.includes('estadao investidor') || lowerName.includes('estadão e investidor')) {
                finalLogo = 'https://m2comunicacao.com.br/wp-content/uploads/2024/06/imagem_2024-06-17_155521691.png';
            }
            else if (lowerName.includes('estadao') || lowerUrl.includes('estadao.com.br')) {
                finalLogo = 'https://startse-uploader.s3.us-east-2.amazonaws.com/medium_estadao_72c3731a48.jpg';
            }
            else if (lowerName.includes('istoé dinheiro') || lowerName.includes('istoe dinheiro')) {
                finalLogo = 'https://yt3.googleusercontent.com/aLYyxdR5JLMcp4KxNttXhoXM3lEDdUh22tXJsHe3rQYf71xQhv_PDAT75xpoSFtKgaALcMCw=s900-c-k-c0x00ffffff-no-rj';
            }
            else if (lowerName.includes('uol economia') || lowerUrl.includes('uol economia')) {
                finalLogo = 'https://conteudo.imguol.com.br/c/noticias/a9/2020/06/15/logotipo-uol---junho-2020-1592225150823_v2_826x826.png';
            }
            else if (lowerName.includes('folha de sao paulo') || lowerUrl.includes('folhadesaopaulo.com.br')) {
                finalLogo = 'https://www.portaldosjornalistas.com.br/wp-content/uploads/2018/04/Folha-de-Sao-Paulo.png';
            }
            else if (lowerName.includes('uol notícias') || lowerUrl.includes('noticias.uol')) {
                finalLogo = 'https://voxnews.com.br/wp-content/uploads/2019/06/uol_logo.png';
            }
            else if (lowerName.includes('portal band') || lowerUrl.includes('band.com.br')) {
                finalLogo = 'https://www.portaldosjornalistas.com.br/wp-content/uploads/2018/01/Logo-Band.png';
            }
            else if (lowerName.includes('fox news') || lowerUrl.includes('foxnews.com')) {
                finalLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/960px-Fox_News_Channel_logo.svg.png';
            }
            else if (lowerName.includes('tech tudo') || lowerUrl.includes('techtudo.com.br')) {
                finalLogo = 'https://s2-techtudo.glbimg.com/ClxoTfu8WQM9Z32HOq8-JoIn6kQ=/0x0:1000x1000/https://i.s3.glbimg.com/v1/AUTH_08fbf48bc0524877943fe86e43087e7a/internal_photos/bs/2024/D/y/j1anEBTaq7PDyELOMlsQ/techtudo-logo.png';
            }
            else if (lowerName.includes('money times') || lowerUrl.includes('moneytimes.com.br')) {
                finalLogo = 'https://yt3.googleusercontent.com/2_4tkB-A3O4dkQUh697ksz6cNVDltiVMlSFmnWF9-7yBytKquVH_myUmtYiv3PKufBreGsYlmQ=s900-c-k-c0x00ffffff-no-rj';
            }
            else if (lowerName.includes('piaui hoje') || lowerUrl.includes('piauihoje.com')) {
                finalLogo = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6uiO4AtPH2uxKoEbqmsLXA5qR0voQ7Dd3xg&s';
            }
            else if (lowerName.includes('motor1') || lowerUrl.includes('motor1.uol.com.br')) {
                finalLogo = 'https://motor1.uol.com.br/logo_square.png';
            }
            else if (lowerName.includes('autoesporte') || lowerUrl.includes('autoesporte.globo.com')) {
                finalLogo = 'https://macmagazine.com.br/wp-content/uploads/2010/10/25-autoesporte_icon.png';
            }
            else if (lowerName.includes('extra') || lowerUrl.includes('extra.globo.com')) {
                finalLogo = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHwU53hYcTA87KGMdvumyIbxKsOi-OflNnIw&s';
            }
            
            // 2. Lógica para YouTube (Cores Dinâmicas + Foto Real)
            else if (isFeedYoutube) {
                // CORREÇÃO 1: Mudei '&background=ff0000' para '&background=random'
                // Isso garante que cada canal tenha uma cor diferente se a foto falhar.
                const letterAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentFeedTitle)}&background=random&color=fff&size=128&bold=true`;
                
                // Tenta extrair o ID do canal
                const channelIdMatch = feed.url.match(/channel_id=([^&]+)/);
                const userMatch = feed.url.match(/user=([^&]+)/);
                
                if (channelIdMatch) {
                    // Tenta Unavatar com o ID limpo
                    finalLogo = `https://unavatar.io/youtube/${channelIdMatch[1]}?fallback=${encodeURIComponent(letterAvatar)}`;
                } 
                else if (userMatch) {
                    finalLogo = `https://unavatar.io/youtube/${userMatch[1]}?fallback=${encodeURIComponent(letterAvatar)}`;
                } 
                else {
                    // Se não tiver ID, usa as letras coloridas direto
                    finalLogo = letterAvatar;
                }
            }
            
            // 3. Fallback Automático (Google Favicon)
            else if (!finalLogo) {
               try {
                   const domain = new URL(feed.url).hostname;
                   finalLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
               } catch (e) {
                   finalLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentFeedTitle)}`;
               }
            }


        let LIMIT = 20; 
        if (feed.type === 'podcast') LIMIT = 1; 
        else if (feed.type === 'youtube' || isFeedYoutube) LIMIT = 2;

        let lastAssignedTime = 0;

        const processedItems = feedItems.slice(0, LIMIT).map((item, index) => {
            const uniqueId = `${feed.id}-${item.id || stringToHash(item.title + item.link)}`;
            const rawDateString = item.pubDate || item.date || item.isoDate;
            let originalTimestamp = rawDateString ? new Date(rawDateString).getTime() : new Date().getTime();
            if (isNaN(originalTimestamp)) originalTimestamp = new Date().getTime();

            let finalTimestamp;

            if (newHistoryBuffer[uniqueId]) {
                finalTimestamp = newHistoryBuffer[uniqueId];
            } else {
                const TEN_MINUTES_MS = 10 * 60 * 1000;
                if (index === 0) {
                    finalTimestamp = originalTimestamp;
                } else {
                    if (lastAssignedTime <= originalTimestamp + 1000) { 
                            finalTimestamp = lastAssignedTime - TEN_MINUTES_MS;
                    } else {
                            finalTimestamp = originalTimestamp;
                    }
                }
                newHistoryBuffer[uniqueId] = finalTimestamp;
            }

            lastAssignedTime = finalTimestamp;
            const finalDateObj = new Date(finalTimestamp);

            // --- CORREÇÃO ESPECÍFICA PARA INVESTING BR (COM ATRASO) ---
                // Se a fonte for Investing, aplicamos uma "penalidade" de tempo.
                // Motivo: Eles enviam datas futuras ou muito recentes incorretas que poluem o topo.
                if (feed.url.includes('investing') || currentFeedTitle.toLowerCase().includes('investing')) {
                    const now = new Date();
                    // Se a data for no futuro OU se for muito recente (para evitar spam no topo)
                    if (finalDateObj > new Date(now.getTime() - 60000)) {
                        // Força a data para 30 MINUTOS ATRÁS
                        const penaltyTime = 30 * 60 * 1000; 
                        finalDateObj.setTime(now.getTime() - penaltyTime);
                        
                        // Atualiza o rastreador para que as próximas desse feed sigam essa ordem
                        lastAssignedTime = finalDateObj.getTime(); 
                    }
                }
                // ---------------------------------------------

            let primaryLink = item.link;
            const enclosureUrl = item.enclosure?.url || item.audio;
            
            if (enclosureUrl) {
                const isImage = (item.enclosure?.type && item.enclosure.type.includes('image')) || 
                                (enclosureUrl && enclosureUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp)($|\?)/i));
                if (isImage) { item.img = enclosureUrl; } 
                else { primaryLink = enclosureUrl; }
            }

            const itemImg = item.img || item.image || finalLogo;
            const itemSummary = item.summary || item.description || '';

            const isYoutubeItem = (primaryLink && (primaryLink.includes('youtube.com') || primaryLink.includes('youtu.be'))) || isFeedYoutube;
            let finalType = 'link'; 
            if (isYoutubeItem) finalType = 'video';
            else if ((primaryLink && (primaryLink.endsWith('.mp3') || primaryLink.endsWith('.m4a'))) || item.enclosure?.type?.includes('audio')) finalType = 'audio'; 

            return {
                id: uniqueId,
                source: currentFeedTitle, 
                show: currentFeedTitle,
                logo: finalLogo, 
                time: finalDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                rawDate: finalDateObj, 
                title: item.title,
                summary: itemSummary.replace(/<[^>]*>?/gm, '').slice(0, 800) + '...',
                category: feed.type === 'podcast' ? 'Podcast' : (feed.category || item.category || 'Geral'),
                type: finalType, 
                img: itemImg,
                cover: itemImg, 
                link: primaryLink, 
                url: item.link,
                videoId: item.videoId || getVideoId(item.link),
                date: finalDateObj.toLocaleDateString(),
            };
        });

        // --- DISTRIBUIÇÃO ESTRITA (RESPEITANDO SUA CONFIGURAÇÃO) ---
        if (feed.type === 'podcast') {
            processedItems.forEach(i => i.category = 'Podcast');
            allPodcastItems.push(...processedItems);
        } 
        else if (feed.type === 'youtube' || isFeedYoutube) {
            allVideoItems.push(...processedItems);
        } 
        else {
            allNewsItems.push(...processedItems);
        }
    });

    await Promise.all(promises);

    if (feedsThatNeedUpdate.length > 0) {
        setUserFeeds(prev => prev.map(f => {
            const update = feedsThatNeedUpdate.find(u => u.id === f.id);
            return update ? { ...f, name: update.name } : f;
        }));
    }

    setArticleHistory(newHistoryBuffer);

    const getSafeTime = (dateInput) => {
        if (!dateInput) return 0;
        const time = new Date(dateInput).getTime();
        return isNaN(time) ? 0 : time;
    };

    const sortFn = (a, b) => getSafeTime(b.rawDate) - getSafeTime(a.rawDate);
    
    setRealNews([...allNewsItems].sort(sortFn));
    setRealVideos([...allVideoItems].sort(sortFn));
    setRealPodcasts([...allPodcastItems].sort(sortFn));
    
    setIsLoadingFeeds(false);
  };

  // --- OTIMIZAÇÃO DE MEMÓRIA: ARRAY ÚNICO MEMORIZADO ---
  // Evita criar arrays gigantes no meio da renderização, prevenindo crashes no iOS
  const allFeedItems = useMemo(() => {
      // Combina e ordena por data (garantia extra)
      const combined = [...realNews, ...realVideos, ...realPodcasts];
      return combined.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [realNews, realVideos, realPodcasts]);


  useEffect(() => { fetchFeeds(); }, [userFeeds]);

  // FUNÇÕES GLOBAIS DE INTERFACE
  

  const handleRemoveSavedItem = (idToRemove) => {
    setSavedItems((prevItems) => prevItems.filter((item) => item.id !== idToRemove));
  };



const handleOpenArticle = async (article) => {
    if (!article || !article.link) return;

    const url = article.link;

    // 1. TENTA EXTRAIR ID DO YOUTUBE (Lógica exata do seu código antigo)
    const videoId =
        article.videoId ||
        url.match(
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        )?.[2];

    // 2. VERIFICA SE É VÍDEO
    const isYoutube = !!videoId || url.includes('youtube.com') || url.includes('youtu.be');
    const isPodcastVideo = article.category === 'Podcast' && article.type === 'video';

    // 3. SE FOR VÍDEO -> USA INAPPBROWSER (CORDOVA)
    // Essa é a parte crítica que restaura o comportamento de "janela sobre o app"
    if (isYoutube || isPodcastVideo) {
        
        // Monta a URL. Se tiver ID, força o link 'watch' para garantir o player correto.
        const youtubeUrl = videoId 
            ? `https://www.youtube.com/watch?v=${videoId}` 
            : url;

        // AS OPÇÕES MÁGICAS DO SEU CÓDIGO ANTIGO:
        // 'location=no' -> Esconde a barra de endereço (parece app, não site)
        // 'toolbar=yes' -> Mostra a barra nativa embaixo (onde fica o botão "Done" azul no iOS)
        const options = 'location=no,toolbar=yes,toolbarcolor=#000000,hidenavigationbuttons=yes,hideurlbar=yes,fullscreen=yes';

        // Chama o plugin diretamente. Sem try/catch/fallback para window.open.
        // Se o plugin estiver instalado, ele VAI abrir a janela nativa.
        InAppBrowser.create(youtubeUrl, '_blank', options);
        return; 
    }

    // 4. SITES DE TEXTO (UOL, ETC) -> CAPACITOR BROWSER
    // Mantém a leitura de sites pesados no modo leitura nativo
    const blockedDomains = ['uol.com.br', 'investing.com', 'nytimes.com'];
    if (blockedDomains.some(d => url.includes(d))) {
        await Browser.open({
            url,
            presentationStyle: 'fullscreen',
            toolbarColor: isDarkMode ? '#000000' : '#FFFFFF'
        });
        return;
    }

    // 5. ARTIGO NORMAL -> PAINEL LATERAL DE IA
    setSelectedArticle(article);
    setPanelWidth(600); 

    if (article.id && !readHistory.includes(article.id)) {
        setReadHistory(prev => [...prev, article.id]);
    }
  };
  


const handleReadNative = useCallback(async (article) => {
      if (!article || !article.link) return;
      
      const options = `location=no,toolbar=yes,toolbarcolor=${isDarkMode ? '#000000' : '#ffffff'},navigationbuttoncolor=${isDarkMode ? '#ffffff' : '#000000'},closebuttoncolor=${isDarkMode ? '#ffffff' : '#000000'}`;
      
      try { 
          await Browser.open({ url: article.link, presentationStyle: 'fullscreen' });
      } catch (e) {
          // Fallback para InAppBrowser ou Window
          try { InAppBrowser.create(article.link, '_blank', options); }
          catch (e2) { window.open(article.link, '_blank'); }
      }
      
      // Marca como lido
      if (article.id && !readHistory.includes(article.id)) {
          setReadHistory(prev => [...prev, article.id]);
      }
  }, [isDarkMode, readHistory]);


// --- FUNÇÃO DE ÁUDIO SOB DEMANDA (CHAVE 6) ---
  const handlePlayAudio = async (article) => {
      if (!article) return null; // Retorna nulo se não houver artigo

      // Se for vídeo do YouTube, abre no navegador e para por aqui.
      if (article.videoId || article.link.includes('youtube')) {
          handleReadNative(article);
          return null; // Retorna nulo pois não é áudio
      }

      // Se for um link direto de podcast (MP3), retorna a URL direto.
      if (article.link?.endsWith('.mp3')) {
          return article.link;
      }

      // --- Para notícias de texto, começa o processo de IA ---
      
      const audioKey = getApiKey('audio'); // Pega a Chave 6
      if (!audioKey) {
          alert("Chave 6 (Áudio) não configurada.");
          return null;
      }
      
      const textKey = getApiKey('analysis'); // Pega a Chave 5
      if (!textKey) {
          alert("Chave 5 (Texto) não configurada.");
          return null;
      }

      try {
          // Chama a função do Supabase para fazer todo o trabalho
          const { data, error } = await supabase.functions.invoke('generate-audio-briefing', {
              body: { 
                  article: article,
                  voiceKey: audioKey, 
                  textKey: textKey
              }
          });

          if (error) throw new Error(error.message);
          
          // Sucesso! RETORNA a URL do MP3 para a FeedTab.
          return data.audioUrl;

      } catch (err) {
          console.error("Erro na geração de áudio:", err);
          alert("Falha ao gerar áudio. Verifique suas cotas ou a função do Supabase.");
          return null; // Retorna nulo em caso de erro.
      }
  };
  




  const closeArticle = useCallback(() => {
      setSelectedArticle(null);
      setPanelWidth(0);
  }, []);

  const closeStory = useCallback(() => {
      setSelectedStory(null);
  }, []);

  const closeOutlet = useCallback(() => {
      setSelectedOutlet(null);
  }, []);

  const handleToggleSave = useCallback((article) => {
    setSavedItems((prev) => {
        const exists = prev.find((i) => i.id === article.id);
        if (exists) return prev.filter((i) => i.id !== article.id);
        return [{ ...article, readProgress: 0, date: 'Agora', source: article.source || article.name }, ...prev];
    });
  }, []); // Sem dependências externas, super estável
  // --- FUNÇÃO DE NAVEGAÇÃO ENTRE ABAS (RESTAURADA) ---
  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);

    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Reseta o timer de inatividade da barra de navegação
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => setIsNavVisible(false), 4000);
  }, []);


  useEffect(() => {
    const resetInactivityTimer = () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (isNavVisible) {
        navTimerRef.current = setTimeout(() => { setIsNavVisible(false); }, 3000); 
      }
    };
    if (isNavVisible) {
      window.addEventListener('mousedown', resetInactivityTimer);
      window.addEventListener('touchstart', resetInactivityTimer);
      window.addEventListener('scroll', resetInactivityTimer);
      resetInactivityTimer();
    }
    return () => {
      window.removeEventListener('mousedown', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
    };
  }, [isNavVisible]);

  const mainRef = useRef(null);
  const prevTab = useRef(activeTab);
 



// ==========================================================
  // ALTERAÇÃO 1: LÓGICA DE "CONGELAMENTO" E GATILHO
  // ==========================================================
  
  // A chave de análise para o painel lateral. Esta lógica está CORRETA e deve ser mantida.
  const analysisApiKey = useMemo(() => {
      // Se não houver artigo selecionado, não faz sentido pegar uma chave.
      if (!selectedArticle) return null;

      // A função é chamada aqui dentro, mas não está no array de dependências.
      // Isso é seguro porque a lógica de pegar a chave só precisa rodar
      // quando o artigo MUDA, e isso é garantido pela dependência [selectedArticle?.id].
      console.log(`useMemo: EXECUTANDO ROTAÇÃO para o artigo ID: ${selectedArticle.id}`);
      return getApiKey('analysis');
  
  // A ÚNICA DEPENDÊNCIA AGORA É O ID DO ARTIGO.
  }, [selectedArticle?.id]);
// 2. Esta lista é para a NAVEGAÇÃO. Ela contém TODOS os stories, sem filtro.
const allAvailableStories = useMemo(() => {
    if (!realNews || realNews.length === 0) return [];

    const sortedEverything = [...realNews].sort((a, b) => {
        const timeA = new Date(a.rawDate).getTime() || 0;
        const timeB = new Date(b.rawDate).getTime() || 0;
        return timeB - timeA;
    });

    const uniqueStories = [];
    const seenSources = new Set();
    
    for (const item of sortedEverything) {
        const sourceName = (item.source || "Fonte").trim();
        
        if (!seenSources.has(sourceName)) {
            seenSources.add(sourceName);

            // SEM FILTRO de 'seenStoryIds' aqui

            const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'News')}&background=random&color=fff&size=800&font-size=0.33&length=3`;
            const finalImg = (item.img && item.img.length > 10) ? item.img : fallbackImage;

            uniqueStories.push({
                id: item.id,
                name: sourceName,
                avatar: item.logo || `https://ui-avatars.com/api/?name=${sourceName}&background=random&color=fff`,
                items: [{ ...item, img: finalImg, origin: 'story' }]
            });
        }
    }
    return uniqueStories;
}, [realNews]); // Depende apenas de 'realNews', não de 'seenStoryIds'


const isMainViewReceded = !!selectedArticle || !!selectedOutlet || !!selectedStory;

const handleOpenGlassBrowser = (article) => {
    if (article) {
      setGlassArticle(article);
      if (article.id && !readHistory.includes(article.id)) {
        setReadHistory(prev => [...prev, article.id]);
      }
    }
  };


return (
    // ESTRUTURA PRINCIPAL AGORA É FLEX PARA ACOMODAR O PAINEL LATERAL
    <div className={`h-[100dvh] font-sans flex overflow-hidden selection:bg-blue-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 text-zinc-100' : 'bg-slate-100 text-zinc-900'}`}>      
      
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      {/* --- COLUNA 1: SUA ESTRUTURA ANTIGA, INTACTA --- */}
      {/* Este é o seu div antigo que continha todo o app. Agora ele é a coluna principal. */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500`}>
         
          <HeaderDashboard 
             isDarkMode={isDarkMode} 
             onOpenSettings={() => setIsSettingsOpen(true)}
             activeTab={activeTab}
             isLoading={isLoadingFeeds}
             selectedSource={sourceFilter}
             onSearch={handleAskAI} 
          />

<main ref={mainRef} className="flex-1 overflow-y-auto pb-40 scrollbar-hide pt-2">            
       {activeTab === 'happening' && (
                <HappeningTab 
                   openArticle={handleReadNative}
                   openStory={(story) => {
                        setSelectedStory(story);
                        setViewedInStoryId(story.id);
                   }}
                    isDarkMode={isDarkMode} 
                    newsData={realNews}
                    heuristicClusters={heuristicClusters}
                    // AÇÃO 1: Pull-to-Refresh
                    onRefresh={handleHappeningRefresh}
                    seenStoryIds={seenStoryIds} 
                    onMarkAsSeen={markStoryAsSeen}
                    heuristicClusters={heuristicClusters}
                    storiesToDisplay={storiesForHappeningTab}
                    savedClusters={globalClusters}
                    // AÇÃO 2: Botão de Análise de Clusters (se ele existir dentro do HappeningTab)
                    // Você precisaria passar essa função para o WhileYouWereAwayWidget
                    setSavedClusters={setGlobalClusters}
                    getApiKey={getApiKey}
                  
                />
            )}
        

            {activeTab === 'podcast' && (
                <PodcastTab 
                    isDarkMode={isDarkMode} 
                    podcastsData={realPodcasts} 
                    isLoading={isLoadingFeeds}
                    savedItems={savedItems}
                    onToggleSave={handleToggleSave}
                    onPlayAudio={async (pod) => {
                        // 1. Tenta identificar se é YouTube (Vídeo)
                        const url = pod.link || "";
                        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                        const ytId = pod.videoId || (match ? match[1] : null);

                        if (ytId) {
                            // SE FOR YOUTUBE: Manda para a função Mestra de abrir artigo (que já tem a lógica do InAppBrowser)
                            setPlayingAudio(null); // Fecha o player de áudio se tiver
                            handleOpenArticle(pod); 
                        } else {
                            // SE FOR PODCAST MP3: Toca no Player Global
                            setPlayingAudio(pod);
                        }
                    }}
                />
            
            )}
            
            {activeTab === 'feed' && (
                <FeedTab 
                onLongPressArticle={handleOpenGlassBrowser}    
                openArticle={handleOpenArticle} 
                    onReadArticle={handleReadNative}
                    onGenerateAudio={handlePlayAudio} 
                    playingAudio={playingAudio}
                    isDarkMode={isDarkMode} 
                    selectedArticleId={selectedArticle?.id}
                    savedItems={savedItems}
                    onToggleSave={handleToggleSave}
                    readHistory={readHistory}
                    newsData={realNews} 
                    isLoading={isLoadingFeeds}
                    sourceFilter={sourceFilter}
                    setSourceFilter={setSourceFilter}
                    likedItems={likedItems}
                    onToggleLike={handleToggleLike}
                    onRefresh={fetchFeeds}
                    onCategoryChange={() => {}}
                    viewedInStoryId={viewedInStoryId}
                    apiKey={analysisApiKey} 
                     getChatApiKey={getChatApiKey}
             
                />
            )}
            
            {activeTab === 'banca' && <BancaTab openOutlet={setSelectedOutlet} isDarkMode={isDarkMode} userFeeds={userFeeds} realNews={realNews} />}
            
            {activeTab === 'youtube' && (
                <YouTubeTab 
                     openStory={setSelectedStory} 
                    savedItems={savedItems} 
                    onToggleSave={handleToggleSave} 
                    isDarkMode={isDarkMode} 
                    realVideos={realVideos} 
                    isLoading={isLoadingFeeds} 
                    // MUDANÇA AQUI:
                    onPlayVideo={handleOpenArticle} // <--- CORRIGIDO (Era handleReadNative)
                    seenStoryIds={seenStoryIds}
                    onMarkAsSeen={markStoryAsSeen}
                    channelFilter={youtubeChannelFilter}
                    setChannelFilter={setYoutubeChannelFilter}
                />
            )}

            {activeTab === 'saved' && (
                <SavedTab 
                   isDarkMode={isDarkMode} 
                    openArticle={handleOpenArticle} // <--- CORRIGIDO (Era handleReadNative)
                    items={savedItems} 
                    onRemoveItem={handleRemoveSavedItem} 
                    onPlayVideo={handleOpenArticle} // <--- CORRIGIDO (Era handleReadNative)
                />
            )}

            {activeTab === 'newsletter' && <NewsletterTab openArticle={handleReadNative} isDarkMode={isDarkMode} newsData={realNews} />}
          </main>

        <div className="fixed bottom-0 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full relative">
            
            {!isNavVisible && (
                <div 
                    className="absolute bottom-0 left-0 w-full h-20 z-[110] cursor-pointer bg-transparent"
                    style={{ touchAction: 'none' }}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsNavVisible(true); if (window.navigator.vibrate) window.navigator.vibrate(10); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsNavVisible(true); }}
                />
            )}

            <nav className={`
                relative w-full overflow-hidden flex flex-col border-t shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border-white/20  
                transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
                ${isNavVisible ? 'translate-y-0' : 'translate-y-[75%]'} 
                ${isDarkMode ? 'bg-zinc-950/95' : 'bg-slate-900/95'}
                backdrop-blur-2xl
            `}>
                <div className="w-full flex justify-center pt-4 pb-2 relative z-20">
        <div className={`rounded-full transition-all duration-300 ${isNavVisible ? 'bg-white/10 w-12 h-1.5 opacity-50' : 'bg-white/60 w-24 h-2 opacity-0 shadow-[0_0_20px_rgba(255,255,255,0.4)]'}`} />
    </div>
                

                <div className={`relative z-10 w-full flex justify-center gap-2 px-2 pb-10 transition-all duration-300 ${isNavVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}> 
                    <TabButton icon={<Sparkles size={24} />} label="Agora" active={activeTab === 'happening'} onClick={() => handleTabClick('happening')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Rss size={24} />} label="Feed" active={activeTab === 'feed'} onClick={() => handleTabClick('feed')} isDarkMode={isDarkMode} />
                    <TabButton icon={<LayoutGrid size={24} />} label="Banca" active={activeTab === 'banca'} onClick={() => handleTabClick('banca')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Youtube size={24} />} label="Vídeos" active={activeTab === 'youtube'} onClick={() => handleTabClick('youtube')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Mic size={24} />} label="Pod" active={activeTab === 'podcast'} onClick={() => handleTabClick('podcast')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Mail size={24} />} label="News" active={activeTab === 'newsletter'} onClick={() => handleTabClick('newsletter')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Bookmark size={24} />} label="Salvos" active={activeTab === 'saved'} onClick={() => handleTabClick('saved')} isDarkMode={isDarkMode} />
                </div>
            </nav>
          </div>
        </div>
      </div>

{glassArticle && (
        <GlassBrowser
          article={glassArticle}
          onClose={() => setGlassArticle(null)}
          isDarkMode={isDarkMode}
        />
      )}

   {/* --- COLUNA 2: PAINEL DE ANÁLISE IA (RESTAURADO E OTIMIZADO) --- */}
      <div 
            ref={panelDivRef}
            className={`
                relative shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                z-[2000] border-l flex-shrink-0
                ${isDarkMode 
                    ? 'bg-zinc-950/90 border-white/10' // RESTAURADO
                    : 'bg-white/80 border-white/40'}   // RESTAURADO
                backdrop-blur-3xl
            `}
            style={{ 
                width: selectedArticle ? `${panelWidth}px` : '0px',
                transform: selectedArticle ? 'translateX(0)' : 'translateX(100%)',
                maxWidth: '100vw',
                // 2. A transição agora é controlada pelo JS para ser desativada durante o arraste
                transition: isResizing.current ? 'none' : 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            {/* INDICADOR DE RESIZE (ALÇA) */}
            {selectedArticle && (
                <div 
                    onMouseDown={handleResizeStart} // Mouse
                    onTouchStart={handleResizeStart} // Touch (iPad)
                    className="absolute top-0 bottom-0 left-0 w-8 z-[2001] cursor-ew-resize flex items-center justify-start pl-2 group select-none touch-none"
                    style={{ touchAction: 'none' }} // IMPEDE SCROLL NO IPAD
                    onClick={(e) => e.stopPropagation()} 
                >
                    <div className={`
                        flex items-center justify-center
                        h-24 w-5 rounded-full 
                        backdrop-blur-xl border shadow-[0_0_15px_rgba(0,0,0,0.2)]
                        transition-all duration-300
                        ${isDarkMode 
                            ? 'bg-black/60 border-white/20 text-white/50 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-400' 
                            : 'bg-white/60 border-white/40 text-black/40 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-400'}
                    `}>
                        <GripVertical size={14} />
                    </div>
                </div>
            )}

            {/* CONTEÚDO */}
            {selectedArticle && (
                <ArticlePanel 
                    article={selectedArticle} 
                    isOpen={!!selectedArticle} 
                    onClose={closeArticle}
                    onToggleSave={handleToggleSave}
                    isSaved={savedItems.some(i => i.id === selectedArticle?.id)}
                     apiKey={analysisApiKey} 
                    getChatApiKey={getChatApiKey}
                    isDarkMode={isDarkMode}
                    isResizing={isResizing.current} 
                />
            )}
        </div>

      {/* --- MODAIS GLOBAIS (FORA DAS COLUNAS) --- */}
      {askQuestion && (<AskAIModal question={askQuestion} answer={askAnswer} sources={askSources} isLoading={isAskLoading} onClose={() => setAskQuestion(null)} isDarkMode={isDarkMode} />)}
      {isSettingsOpen && (<SettingsModal onClose={() => setIsSettingsOpen(false)} isDarkMode={isDarkMode} feeds={userFeeds} setFeeds={setUserFeeds} apiKeys={apiKeys} setApiKeys={setApiKeys} user={user} />)}
      {selectedOutlet && <OutletDetail outlet={selectedOutlet} onClose={closeOutlet} openArticle={handleReadNative} isDarkMode={isDarkMode} realNews={realNews} />}
      {selectedStory && (<StoryOverlay key={selectedStory.id} story={selectedStory} onClose={closeStory} onRead={handleReadNative} onMarkAsSeen={markStoryAsSeen} allStories={storiesForHappeningTab} onNavigate={handleStoryNavigation} />)}
{playingAudio && (<GlobalAudioPlayer track={playingAudio} onClose={() => setPlayingAudio(null)} isDarkMode={isDarkMode} />)}      {isPodcastOpen && <PodNewsModal onClose={() => setIsPodcastOpen(false)} isDarkMode={isDarkMode} />}
    </div>
  );
}





// ==========================================================
// === SUBSTITUA SUA FUNÇÃO "OutletDetail" INTEIRA POR ESTA ===
// ==========================================================

// ==========================================================
// === SUBSTITUA SUA FUNÇÃO "OutletDetail" INTEIRA POR ESTA ===
// ==========================================================

function OutletDetail({ outlet, onClose, openArticle, isDarkMode, realNews }) {

  const outletNews = useMemo(() => {
    if (!realNews || !outlet) return [];
    return realNews.filter(news => news.source === outlet.name).slice(0, 10);
  }, [realNews, outlet]);

  const mainArticle = outletNews[0];
  const secondaryArticles = outletNews.slice(1);

  const stripTags = (html = "") => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };
  
  const renderLayout = () => {
    const layout = outlet.layoutType;
    
    if (!mainArticle) {
        return (
            <div className="text-center py-20 opacity-60">
                <h3 className="font-bold">Nenhuma notícia recente encontrada para esta fonte.</h3>
            </div>
        );
    }

    if (layout === 'standard') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 group">
            <div className={`aspect-video mb-4 rounded-xl overflow-hidden shadow-sm cursor-pointer ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`} onClick={() => openArticle(mainArticle)}>
              <img src={mainArticle.img} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={mainArticle.title} onError={(e) => e.target.style.display='none'} />
            </div>
            <h2 onClick={() => openArticle(mainArticle)} className={`text-4xl font-serif font-black mb-3 leading-tight cursor-pointer ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{mainArticle.title}</h2>
            <p className={`font-serif text-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{stripTags(mainArticle.summary)}</p>
          </div>
          <div className={`md:col-span-4 space-y-6 border-l pl-6 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            {secondaryArticles.slice(0, 4).map((article) => (
              <div key={article.id} className="cursor-pointer group" onClick={() => openArticle(article)}>
                <span className="text-[10px] font-bold text-blue-500 uppercase mb-1 block group-hover:underline">{article.category || 'Geral'}</span>
                <h4 className={`font-serif font-bold text-xl leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{article.title}</h4>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (layout === 'magazine') {
      return (
        <div className={`space-y-12 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
          {outletNews.slice(0, 3).map((article, i) => (
            <div key={article.id} className={`flex flex-col md:flex-row gap-8 group cursor-pointer border-b pb-8 items-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`} onClick={() => openArticle(article)}>
              <span className={`text-8xl font-black transition-colors opacity-25 md:opacity-100 ${isDarkMode ? 'text-zinc-700 group-hover:text-purple-500/20' : 'text-zinc-200 group-hover:text-purple-500/20'}`}>0{i+1}</span>
              <div className="w-full">
                <span className="text-purple-500 font-bold tracking-widest uppercase text-xs mb-2 block">{article.category || 'Destaque'}</span>
                <h3 className={`text-4xl font-bold mb-3 transition-colors ${isDarkMode ? 'text-white group-hover:text-purple-400' : 'text-zinc-900 group-hover:text-purple-600'}`}>{article.title}</h3>
                <p className="opacity-70 text-lg line-clamp-2 font-serif">{stripTags(article.summary)}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (layout === 'visual') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {outletNews.map((article, i) => (
            <div key={article.id} onClick={() => openArticle(article)} className={`relative group cursor-pointer rounded-xl overflow-hidden aspect-square
              ${i === 0 ? 'md:col-span-2 md:row-span-2 aspect-video md:aspect-square' : ''}
              ${i === 3 ? 'md:col-span-2' : ''}
            `}>
              <img src={article.img} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 bg-zinc-200" alt={article.title} onError={(e) => e.target.style.display='none'} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-white font-bold text-base leading-tight drop-shadow-lg line-clamp-2">{article.title}</h3>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (layout === 'minimal') {
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
          {outletNews.map((article) => (
            <div key={article.id} className="flex gap-4 cursor-pointer group" onClick={() => openArticle(article)}>
              <div className={`w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <img src={article.img} className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
              </div>
              <div>
                <h4 className={`font-bold text-lg mb-1 group-hover:underline decoration-purple-500 underline-offset-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>{article.title}</h4>
                <p className="text-sm opacity-60 line-clamp-2">{stripTags(article.summary)}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (layout === 'impact') {
        return (
            <div className="space-y-4">
                {mainArticle && (
                    <div className="relative rounded-2xl overflow-hidden cursor-pointer group" onClick={() => openArticle(mainArticle)}>
                        <img src={mainArticle.img} className="w-full h-96 object-cover" alt={mainArticle.title} onError={(e) => e.target.style.display='none'} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8">
                            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider mb-2 inline-block">Manchete</span>
                            <h2 className="text-5xl font-black text-white leading-none drop-shadow-xl">{mainArticle.title}</h2>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {secondaryArticles.slice(0, 3).map(article => (
                        <div key={article.id} className={`p-4 rounded-xl cursor-pointer group ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`} onClick={() => openArticle(article)}>
                             <h3 className={`font-bold text-lg leading-tight mb-2 group-hover:underline ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{article.title}</h3>
                             <p className={`text-sm opacity-60 line-clamp-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{stripTags(article.summary)}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (layout === 'grid') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {outletNews.map((article, i) => (
                    <div key={article.id} onClick={() => openArticle(article)} 
                        className={`relative group cursor-pointer rounded-xl overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                         <img src={article.img} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-zinc-200" alt={article.title} onError={(e) => e.target.style.display='none'} />
                         <div className="absolute inset-0 bg-black/40"></div>
                         <div className="absolute bottom-0 left-0 p-4">
                            <h3 className={`font-bold leading-tight text-white drop-shadow-lg ${i === 0 ? 'text-2xl' : 'text-base'}`}>{article.title}</h3>
                         </div>
                    </div>
                ))}
            </div>
        );
    }

  };

  return (
    <div className={`fixed inset-0 z-[65] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
      
      <div className={`sticky top-0 z-20 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b ${isDarkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-zinc-200'}`}>
        <button onClick={onClose} className={`flex items-center gap-1 text-sm font-bold transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
          <ChevronLeft size={20} /> Voltar
        </button>
        <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{outlet.name}</span>
        <div className="w-16" />
      </div>

    <div className={`relative w-full h-[35vh] overflow-hidden shadow-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5"></div>
        <div className="w-full h-full flex items-center justify-center p-8">
            <img 
                src={outlet.logo} 
                className="max-h-full max-w-full object-contain"
            />
        </div>
        
      </div>

      <div className={`max-w-5xl mx-auto p-4 md:p-8 min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        {renderLayout()}
      </div>
    </div>
  );
}

// --- FUNÇÃO AUXILIAR DE TRADUÇÃO (FORA DO COMPONENTE) ---
// Usa a API 'gtx' do Google (gratuita/pública) para traduzir textos mantendo estrutura
const translateText = async (text, targetLang = 'pt') => {
    if (!text || text.trim().length === 0) return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        // A API retorna um array de arrays, juntamos as partes traduzidas
        return data[0].map(item => item[0]).join('');
    } catch (e) {
        console.error("Erro na tradução:", e);
        return text; // Retorna original em caso de erro
    }
};


// --- COMPONENTE: FEED NAVIGATOR (COM DEDUPLICAÇÃO DE ITENS) ---
const FeedNavigator = React.memo(({ article, feedItems, onArticleChange, isDarkMode }) => {
    if (!article) return null;

    const [isFeedListOpen, setIsFeedListOpen] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 140 : 500 });
    const [isBtnDragging, setIsBtnDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0, hasMoved: false });

    // --- LÓGICA DE CONTEXTO ---
    const isPodcast = article.category === 'Podcast' || article.forceAudioMode || article.type === 'audio';
    const isVideo = !isPodcast && (article.videoId || (article.link && (article.link.includes('youtube') || article.link.includes('youtu.be'))));

    let statusLabel = 'LENDO';
    if (isPodcast) statusLabel = 'OUVINDO';
    else if (isVideo) statusLabel = 'ASSISTINDO';

    // --- FILTRAGEM INTELIGENTE E OTIMIZADA (EVITA CRASH) ---
    const relatedNews = useMemo(() => {
        if (!feedItems || feedItems.length === 0) return [];
        
        // 1. OTIMIZAÇÃO: Trabalhar com um subconjunto se a lista for monstro
        // Se tiver mais de 500 itens, pegamos apenas os 500 primeiros (mais recentes)
        // para evitar travar o loop de renderização do iOS.
        const sourceList = feedItems.length > 500 ? feedItems.slice(0, 500) : feedItems;

        const uniqueList = [];
        const seenIds = new Set();
        
        // Lógica de filtro simplificada para performance
        for (let i = 0; i < sourceList.length; i++) {
            const item = sourceList[i];
            
            // Filtro rápido de tipo
            let isMatch = false;
            if (isPodcast) {
                isMatch = item.category === 'Podcast' || item.type === 'audio' || item.forceAudioMode;
            } else if (isVideo) {
                // Verificação otimizada de vídeo (evita includes pesados se não tiver ID)
                isMatch = !!item.videoId || (item.category === 'Vídeo'); 
            } else {
                // Notícia normal
                isMatch = !item.videoId && item.category !== 'Podcast' && item.category !== 'Vídeo';
            }

            if (isMatch) {
                if (!seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    uniqueList.push(item);
                }
            }
            
            // Segurança: Se já achamos 50 itens relacionados, PARA.
            // Ninguém navega por 50 itens no rodapé. Isso salva muita memória.
            if (uniqueList.length >= 50) break;
        }

        return uniqueList;
    }, [feedItems, isPodcast, isVideo]); // Dependências estáveis

    const currentIndex = relatedNews.findIndex(item => item && item.id === article.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex > -1 && currentIndex < relatedNews.length - 1;

    const handlePrev = (e) => { e.stopPropagation(); if (hasPrev) onArticleChange(relatedNews[currentIndex - 1]); };
    const handleNext = (e) => { e.stopPropagation(); if (hasNext) onArticleChange(relatedNews[currentIndex + 1]); };

    useEffect(() => {
        if (isFeedListOpen && article?.id) {
            setTimeout(() => {
                const activeElement = document.getElementById(`nav-item-${article.id}`);
                if (activeElement) activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [isFeedListOpen, article?.id]);

    const handlePointerDown = (e) => { 
        if (e.target.closest('.no-drag')) return; 
        e.preventDefault(); 
        dragRef.current = { startX: e.clientX, startY: e.clientY, initialLeft: position.x, initialTop: position.y, hasMoved: false }; 
        setIsBtnDragging(true); 
        window.addEventListener('pointermove', handlePointerMoveDrag); 
        window.addEventListener('pointerup', handlePointerUpDrag); 
    };
    const handlePointerMoveDrag = (e) => { 
        const dx = e.clientX - dragRef.current.startX; 
        const dy = e.clientY - dragRef.current.startY; 
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.hasMoved = true; 
        setPosition({ x: dragRef.current.initialLeft + dx, y: dragRef.current.initialTop + dy }); 
    };
    const handlePointerUpDrag = () => { 
        setIsBtnDragging(false); 
        window.removeEventListener('pointermove', handlePointerMoveDrag); 
        window.removeEventListener('pointerup', handlePointerUpDrag); 
    };
    const handleToggle = () => { if (!dragRef.current.hasMoved) setIsFeedListOpen(!isFeedListOpen); };

    return (
        <>
          {isFeedListOpen && (<div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-[5001] transition-opacity" onClick={() => setIsFeedListOpen(false)} />)}
          
          <div className="absolute z-[5002] w-80 transition-shadow duration-300 select-none" style={{ left: position.x, top: position.y, cursor: isBtnDragging ? 'grabbing' : 'grab', touchAction: 'none' }} onPointerDown={handlePointerDown}>
              
              {/* LISTA */}
              <div className={`overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-300 border dark:border-white/10 no-drag absolute bottom-full left-0 w-full mb-2 origin-bottom ${isFeedListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                  <div className="p-3 border-b dark:border-white/10 flex justify-between items-center bg-transparent">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          {isPodcast ? 'Próximos Episódios' : (isVideo ? 'Próximos Vídeos' : 'Notícias Relacionadas')}
                      </span>
                      <button onClick={() => setIsFeedListOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><X size={14}/></button>
                  </div>
                  <div className="overflow-y-auto max-h-[40vh] p-1 space-y-1 custom-scrollbar" onPointerDown={(e) => e.stopPropagation()}>
                      {relatedNews.map((item) => (item && 
                          <div key={item.id} id={`nav-item-${item.id}`} onClick={() => { onArticleChange(item); setIsFeedListOpen(false); }} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${item.id === article?.id ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                              <img src={item.img} className="w-10 h-10 rounded-lg object-cover bg-zinc-200 shrink-0" onError={(e) => e.target.style.display = 'none'} />
                              <div className="flex-1 min-w-0">
                                  <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${item.id === article?.id ? 'text-blue-600 dark:text-blue-400' : 'dark:text-zinc-200'}`}>{item.title}</h4>
                                  <span className="text-[9px] opacity-50 truncate block">{item.source}</span>
                              </div>
                          </div>
                      ))}
                      {relatedNews.length === 0 && <div className="p-4 text-center text-xs opacity-50">Sem mais itens.</div>}
                  </div>
              </div>

              {/* BOTÃO FLUTUANTE */}
              <div onClick={handleToggle} className={`flex items-center justify-between p-2 pl-2 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-transform active:scale-95 group select-none ${isDarkMode ? 'bg-zinc-900/90' : 'bg-black/80'}`}>
                  <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                      <div className="relative">
                          <div className={`absolute inset-0 rounded-full animate-pulse opacity-20 ${isPodcast ? 'bg-orange-500' : (isVideo ? 'bg-red-500' : 'bg-green-500')}`}></div>
                          <img src={article.logo} className="relative w-8 h-8 rounded-full border border-white/20 object-cover bg-white" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                          <span className={`text-[9px] uppercase font-bold tracking-wider leading-none ${isPodcast ? 'text-orange-400' : (isVideo ? 'text-red-400' : 'text-zinc-400')}`}>
                              {isBtnDragging ? 'MOVENDO...' : statusLabel}
                          </span>
                          <span className="text-xs text-white font-bold truncate leading-tight max-w-[100px]">{article.source}</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 no-drag">
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={handlePrev} disabled={!hasPrev} className={`p-1.5 rounded-full transition-colors ${hasPrev ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronLeft size={18} /></button>
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={handleNext} disabled={!hasNext} className={`p-1.5 rounded-full transition-colors ${hasNext ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronRight size={18} /></button>
                      <div className="w-px h-4 bg-white/20 mx-1"></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFeedListOpen ? 'bg-white/20 text-white' : 'text-zinc-400 group-hover:text-white'}`}>{isBtnDragging ? <GripVertical size={14} /> : <LayoutGrid size={14} />}</div>
                  </div>
              </div>
          </div>
        </>
    );
});



// ==============================================================================
// BLoco ÚNICO E COMPLETO - PAINEL DE ANÁLISE IA
// ==============================================================================

// 1. WIDGETS AUXILIARES E SUB-COMPONENTES
// ==============================================================================

const CenterNodeModal = ({ data, onClose, isDarkMode }) => (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`relative w-full max-w-[90vw] p-6 rounded-3xl shadow-2xl border flex flex-col ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                    <BrainCircuit size={32} className="text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Tema Central da Análise</span>
                {/* CORREÇÃO: Usar data.mindmap.center */}
                <h3 className="text-2xl font-black">{data.mindmap.center}</h3>
            </div>
            
            <div className={`p-4 rounded-xl border border-dashed mt-4 ${isDarkMode ? 'border-zinc-700 bg-black/20' : 'border-zinc-200 bg-zinc-50'}`}>
                {/* CORREÇÃO: Usar data.summaries.executive */}
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{data.summaries.executive}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                <div>
                    <h4 className="font-bold mb-2 opacity-60">Pontos Principais:</h4>
                    <ul className="list-disc pl-4 space-y-1 marker:text-purple-400">
                        {/* CORREÇÃO: Usar data.summaries.bullets */}
                        {data.summaries.bullets.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-2 opacity-60">Conexões no Mapa:</h4>
                    <ul className="list-none space-y-1">
                        {/* CORREÇÃO: Usar data.mindmap.nodes */}
                        {data.mindmap.nodes.map((node, i) => <li key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>{node}</li>)}
                    </ul>
                </div>
            </div>

            <button onClick={onClose} className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-xs uppercase tracking-widest mt-6 hover:brightness-90 transition">Fechar</button>
        </div>
    </div>
);

const ConstellationWidget = ({ mindmap, onNodeClick, onCenterClick, isDarkMode }) => {
    if (!mindmap || !mindmap.nodes) return null;
    const center = { x: 50, y: 50 };
    const nodesPos = [{ x: 50, y: 15 }, { x: 85, y: 50 }, { x: 50, y: 85 }, { x: 15, y: 50 }];

    return (
        <div className="relative h-[360px] w-full mb-8 select-none">
            <div className="absolute top-0 left-0 right-0 flex justify-center">
                <div className="bg-black/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/5">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Rede Neural Semântica</h3>
                </div>
            </div>
            <div className="absolute inset-0 top-6">
                <svg className="w-full h-full pointer-events-none absolute inset-0 z-0 filter drop-shadow-[0_0_3px_rgba(139,92,246,0.5)]">
                    {mindmap.nodes.slice(0, 4).map((_, i) => (
                        <line key={i} x1={`${center.x}%`} y1={`${center.y}%`} x2={`${nodesPos[i].x}%`} y2={`${nodesPos[i].y}%`} stroke={isDarkMode ? "rgba(167, 139, 250, 0.3)" : "rgba(99, 102, 241, 0.4)"} strokeWidth="2" strokeDasharray="2 4"/>
                    ))}
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group" onClick={onCenterClick}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-40 animate-pulse-slow"></div>
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zinc-900 to-indigo-950 flex items-center justify-center text-center p-4 shadow-2xl border-4 border-indigo-500/30 group-hover:scale-105 transition-transform duration-500">
                            <span className="text-xs font-black text-white uppercase leading-tight tracking-wide drop-shadow-lg">{mindmap.center}</span>
                        </div>
                        <div className="absolute inset-[-10px] border border-white/5 rounded-full animate-spin-slow pointer-events-none"></div>
                        <div className="absolute inset-[-20px] border border-white/10 rounded-full animate-spin-reverse-slow pointer-events-none"></div>
                    </div>
                </div>
                {mindmap.nodes.slice(0, 4).map((node, i) => (
                    <button key={i} onClick={() => onNodeClick(node, { x: nodesPos[i].x, y: nodesPos[i].y })} className={`absolute z-30 px-5 py-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:border-purple-500 hover:z-40 max-w-[160px] group ${isDarkMode ? 'bg-zinc-900/80 border-white/10 text-zinc-300' : 'bg-white/90 border-zinc-200 text-zinc-800'}`} style={{ top: `${nodesPos[i].y}%`, left: `${nodesPos[i].x}%`, transform: 'translate(-50%, -50%)' }}>
                        <span className="text-[10px] font-bold leading-tight block text-center group-hover:text-purple-400 transition-colors">{node}</span>
                    </button>
                ))}
            </div>
            <style jsx="true">{`@keyframes spin-slow { to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 20s linear infinite; } .animate-spin-reverse-slow { animation: spin-slow 25s linear infinite reverse; } .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }`}</style>
        </div>
    );
};

const TimelineWidget = ({ items, isDarkMode }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className={`p-6 rounded-3xl border mb-6 ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-8 flex items-center gap-2">
                <Clock size={12}/> Linha do Tempo do Evento
            </h4>
            <div className="space-y-0">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-4 relative pb-10 last:pb-0">
                        {/* Linha Vertical Conectora */}
                        {i !== items.length - 1 && <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>}
                        
                        {/* Círculo da Etapa */}
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-black z-10 
                            ${i === items.length - 1 
                                ? 'bg-green-500 text-white shadow-lg' 
                                : (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500')}
                        `}>
                            {i + 1}
                        </div>
                        
                        {/* Conteúdo do Evento */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {/* Pílula da Data */}
                                <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                                    {item.date}
                                </div>
                                {/* Rótulo Narrativo */}
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                                    {item.label}
                                </span>
                            </div>
                            <p className={`text-sm leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                {item.event}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const FutureWidget = ({ data, isDarkMode }) => {
    if (!data) return null;
    return (
        <div className="mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4 px-2 flex items-center gap-2"><Telescope size={12}/> Cenários Futuros</h4>
            <div className="flex overflow-x-auto gap-3 pb-4 px-1 snap-x scrollbar-hide">
                <div className="snap-center flex-shrink-0 w-64 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase mb-2"><TrendingUp size={14}/> Otimista</div>
                    <p className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-100">{data.optimistic}</p>
                </div>
                <div className="snap-center flex-shrink-0 w-64 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs uppercase mb-2"><Activity size={14}/> Provável</div>
                    <p className="text-xs leading-relaxed text-blue-900 dark:text-blue-100">{data.probable}</p>
                </div>
                <div className="snap-center flex-shrink-0 w-64 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs uppercase mb-2"><TrendingDown size={14}/> Pessimista</div>
                    <p className="text-xs leading-relaxed text-rose-900 dark:text-rose-100">{data.pessimistic}</p>
                </div>
            </div>
        </div>
    );
};

const MagicPremiumView = React.memo(({ article, readerContent, isDarkMode, fontSize, highlightText }) => {
    const contentRef = useRef(null);
    
    useEffect(() => {
        if (!highlightText || !readerContent?.content) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = readerContent.content;
        const allTextNodes = Array.from(tempDiv.querySelectorAll('p, li, blockquote, h1, h2, h3'));
        
        const targetNode = allTextNodes.find(node => node.textContent.includes(highlightText));
        
        if (targetNode) {
            targetNode.innerHTML = targetNode.innerHTML.replace(
                highlightText, 
                `<mark id="highlight-target" class="bg-purple-500/30 text-white px-1 rounded">${highlightText}</mark>`
            );
            if(contentRef.current) contentRef.current.innerHTML = tempDiv.innerHTML;

            setTimeout(() => {
                const el = document.getElementById('highlight-target');
                if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
             if(contentRef.current) contentRef.current.innerHTML = readerContent.content;
        }
    }, [highlightText, readerContent]);

    const data = readerContent || article;
    if (!data) return null;
    
    return <div ref={contentRef} className="max-w-3xl mx-auto px-6 py-4" dangerouslySetInnerHTML={{ __html: readerContent?.content || `<p>${article.summary}</p>` }} />;
});


const DeepDiveWidget = ({ topic, isDarkMode }) => (
    <div className="mt-10">
        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4 px-2 flex items-center gap-2">
            <Layers size={12}/> Aprofunde-se no Assunto
        </h4>
        <div className="grid grid-cols-2 gap-3">
            <a href={`https://pt.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topic)}`} target="_blank" className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/77/Wikipedia_svg_logo.svg" className="w-6 h-6"/>
                <span className="text-xs font-bold">Ver na Wikipedia</span>
            </a>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(topic)}`} target="_blank" className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-6 h-6"/>
                <span className="text-xs font-bold">Buscar no Google</span>
            </a>
        </div>
    </div>
);

// ==============================================================================
// 1. NOVO COMPONENTE AUXILIAR: LoadingStep (A Barra de Progresso)
// ==============================================================================

const LoadingStep = ({ title, isActive, isComplete }) => {
    // Texto digitando (mantemos o efeito visual)
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (!isActive && !isComplete) {
            setDisplayText('');
            return;
        }
        if (isComplete && !displayText) {
            setDisplayText(title);
            return;
        }
        if (isActive && !isComplete) {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayText(title.substring(0, i + 1));
                i++;
                if (i > title.length) clearInterval(interval);
            }, 30); // Digitação mais rápida para acompanhar processos reais
            return () => clearInterval(interval);
        }
    }, [isActive, isComplete, title]);

    return (
        <div className="flex items-center gap-4 w-full">
            <div className={`
                flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${isComplete 
                    ? 'border-green-500 bg-green-500/20 scale-110' 
                    : (isActive ? 'border-purple-500 scale-100' : 'border-zinc-700 scale-90 opacity-50')}
            `}>
                {isComplete ? <Check size={16} className="text-green-500"/> : <Loader2 size={16} className={`transition-opacity ${isActive ? 'animate-spin text-purple-500' : 'opacity-0'}`} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-colors h-5 ${isActive || isComplete ? 'text-white' : 'text-zinc-600'}`}>
                    {isComplete ? title : displayText}
                    {isActive && !isComplete && <span className="animate-ping">_</span>}
                </p>
                
                {/* BARRA DE PROGRESSO INTELIGENTE */}
                <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                        style={{ 
                            width: isComplete ? '100%' : (isActive ? '85%' : '0%'),
                            // Se estiver ativo, cresce devagar até 85% (simula espera). Se completar, voa para 100% em 200ms.
                            transition: isComplete ? 'width 0.3s ease-out' : (isActive ? 'width 15s cubic-bezier(0.1, 0.7, 1.0, 0.1)' : 'none')
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};



// --- FUNÇÃO DE IA HÍBRIDA E FINAL ---
// 1. Defina o endereço do seu site (IMPORTANTE: Sem a barra '/' no final)
// Troque pelo seu link real se for diferente deste
const VERCEL_URL = "https://newsos-app2.vercel.app"; 

// --- FUNÇÃO DE IA HÍBRIDA (Compatível com Web e iPad) ---
const generateChatResponse = async (chatHistory, articleText, apiKey) => {
  if (!apiKey) return "Desculpe, a conexão com a IA não está configurada.";

  const userQuestion = chatHistory.findLast(m => m.from === 'user')?.text;
  if (!userQuestion) return "Não entendi sua pergunta.";

  const formattedHistory = chatHistory.map(m => `${m.from === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`).join('\n');

  const prompt = `
  Você é um Assistente de Pesquisa especialista e amigável, conversando dentro de uma interface de chat.

  CONTEXTO PRINCIPAL (A notícia que o usuário está lendo):
  ---
  ${articleText.slice(0, 4000)}
  ---
  
  HISTÓRICO DA CONVERSA ATÉ AGORA:
  ---
  ${formattedHistory}
  ---

  SUA TAREFA:
  Continue a conversa respondendo à última pergunta do "Usuário" de forma natural e conversacional.
  - Utilize o CONTEXTO PRINCIPAL para responder sobre fatos da notícia.
  - Mantenha as respostas curtas e diretas (1-3 frases).
  - AJA COMO UMA PESSOA, NÃO COMO UM ROBÔ.
  - Não repita a pergunta. Apenas dê a resposta.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a resposta. Tente novamente.";
  } catch (e) {
    return "Houve um problema ao conectar com a IA.";
  }
};



// --- NOVO COMPONENTE: WHATSAPP CHAT INTERFACE ---
const WhatsappChat = ({ articleText, apiKey, isDarkMode }) => {
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Mensagem inicial da IA
    setHistory([{ 
      from: 'ai', 
      text: `Olá! Eu li esta notícia. Sobre o que você gostaria de saber mais ou pesquisar?` 
    }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isAiTyping]);

  const handleSendMessage = async () => {
    const userQuestion = inputValue.trim();
    if (userQuestion === '' || isAiTyping) return;

    const newHistory = [...history, { from: 'user', text: userQuestion }];
    setHistory(newHistory);
    setInputValue('');
    setIsAiTyping(true);

   // O CÓDIGO ANTIGO BUSCAVA UMA NOVA CHAVE:
    // const chatApiKey = getChatApiKey(); 
    // if (!chatApiKey) { ... }
    // const aiResponse = await generateChatResponse(newHistory, articleText, chatApiKey);

    // O NOVO CÓDIGO APENAS USA A CHAVE RECEBIDA:
    if (!apiKey) {
      setHistory(prev => [...prev, { from: 'ai', text: 'Erro: Nenhuma chave de API para o chat está configurada.' }]);
      setIsAiTyping(false);
      return;
    }

    const aiResponse = await generateChatResponse(newHistory, articleText, apiKey);

    setHistory(prev => [...prev, { from: 'ai', text: aiResponse }]);
    setIsAiTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-cover bg-center" style={{ backgroundImage: isDarkMode ? "url('https://i.redd.it/qwd81h444yv51.jpg')" : "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
      {/* Histórico de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 px-3 rounded-xl shadow-md ${msg.from === 'user' ? 'bg-[#005c4b] text-white rounded-tr-none' : (isDarkMode ? 'bg-[#2a3942] text-zinc-200 rounded-tl-none' : 'bg-white text-zinc-800 rounded-tl-none')}`}>
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex justify-start">
            <div className={`max-w-[80%] p-2 px-3 rounded-xl shadow-md ${isDarkMode ? 'bg-[#2a3942] text-zinc-200 rounded-tl-none' : 'bg-white text-zinc-800 rounded-tl-none'}`}>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-2 bg-transparent">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Mensagem"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className={`w-full px-4 py-2.5 rounded-full outline-none border-none text-sm ${isDarkMode ? 'bg-[#2a3942] text-white placeholder:text-zinc-400' : 'bg-white text-black placeholder:text-zinc-500'}`}
          />
          <button onClick={handleSendMessage} className="w-11 h-11 flex items-center justify-center rounded-full bg-[#00a884] text-white shrink-0 hover:bg-[#008a6b] transition-colors">
            <ArrowRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};



// ==============================================================================
// 2. O PAINEL DE IA PRINCIPAL
// ==============================================================================

const ArticlePanel = React.memo(({ article, isOpen, onClose, onToggleSave, isSaved, isDarkMode, apiKey, isResizing, getChatApiKey }) => {
  const [aiData, setAiData] = useState(null);
  const [loadingState, setLoadingState] = useState('idle'); 
  const [viewMode, setViewMode] = useState('analysis');
  const [summaryMode, setSummaryMode] = useState('executive');
  const [fontSize, setFontSize] = useState(19);
  const [focusedNode, setFocusedNode] = useState(null); 
  const [highlightRequest, setHighlightRequest] = useState(null); 
  const [readerContent, setReaderContent] = useState(null); 
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [currentChatApiKey, setCurrentChatApiKey] = useState(null);


// 1. Estado de Etapas (Começa em -1 para 'nenhum')
  const [loadingStep, setLoadingStep] = useState(0);

  // EFEITO DE LIMPEZA (Reseta tudo ao abrir)
  useEffect(() => {
      if (isOpen && article) {
          setAiData(null);
          setReaderContent(null);
          setLoadingState('extracting');
          setViewMode('analysis');
          setFocusedNode(null);
          setHighlightRequest(null);
          setShowCenterModal(false);
          
          // Zera os passos visuais
          setLoadingStep(0);
          
          runSuperPrompt();
      }
  }, [article?.id, isOpen]);

  // A NOVA FUNÇÃO SINCRONIZADA COM A REALIDADE
const runSuperPrompt = useCallback(async () => {
      // apiKey agora vem das props, fornecida pelo pool 'analysis'
      if (!apiKey || !article.link) {
          setLoadingState('error');
          return;
      }
      
      try {
          setLoadingStep(1); // Extraindo...
          const { data: proxyData, error: proxyError } = await supabase.functions.invoke('proxy-view', { body: { url: article.link } });
          
          if (proxyError || !proxyData?.reader?.content) throw new Error("Falha na extração de texto");
          
          const fullText = proxyData.reader.textContent;
          setReaderContent(proxyData.reader); 

          setLoadingStep(2); // Analisando...
          setLoadingState('analyzing'); 

          // A MÁGICA: Chama a função local generateFullAnalysis com a chave do pool
          const result = await generateFullAnalysis(fullText, apiKey);
          
          if (!result) throw new Error("A análise da IA retornou vazia.");

          setLoadingStep(3); // Sintetizando...
          setAiData(result);
          
          setLoadingStep(4); // Finalizando...
          setLoadingState('complete');

      } catch (err) { 
          console.error("Erro no runSuperPrompt:", err);
          setLoadingState('error'); 
      }
  }, [apiKey, article]); // Depende da chave e do artigo

  
const handleNodeClick = useCallback((nodeName, position) => {
      if (!aiData?.contextualTerms) return;
      
      const nodeData = aiData.contextualTerms.find(t => t.term.toLowerCase().includes(nodeName.toLowerCase()) || nodeName.toLowerCase().includes(t.term.toLowerCase()));
      
      const dataToSet = nodeData || { name: nodeName, context: "Contexto geral.", sentiment: "neutral", evidence_quotes: [] };
      
      // Salva a posição para o CSS usar
      setFocusedNode({ ...dataToSet, position }); 
      
      setViewMode('drilldown');
  }, [aiData]);
  
  const handleQuoteClick = useCallback((quote) => { 
      setHighlightRequest(quote); 
      setViewMode('magic'); 
  }, []);

    


  
// --- return do ArticlePanel ---
return (
<div className={`h-full w-full flex flex-col rounded-l-[2.5rem] overflow-hidden ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'} border-l-2 transition-colors duration-300
    ${isResizing 
        // Se estiver redimensionando, usa um fundo sólido e mais opaco
        ? (isDarkMode ? 'bg-zinc-950/95' : 'bg-white/95')
        // Se não, usa o fundo com o efeito de desfoque pesado
        : (isDarkMode ? 'bg-zinc-950/90 backdrop-blur-3xl' : 'bg-white/80 backdrop-blur-3xl')
    }
  `}>    <style jsx="true">{`
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        @keyframes spin-reverse-slow { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 25s linear infinite; }
    `}</style>
  
    {/* --- Telas de Loading e Erro --- */}
    {(loadingState === 'extracting' || loadingState === 'analyzing') && (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-8">
        {/* ... (código do loading, que não precisa ser alterado) ... */}
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="absolute inset-[-10px] border-t-2 border-white/20 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-[-20px] border-b-2 border-blue-400/20 rounded-full animate-spin-reverse-slow"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit size={40} className="text-white animate-pulse" style={{ animationDuration: '2s' }}/>
            </div>
          </div>
          <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            NEWS OS <span className="text-white">INTELLIGENCE</span>
          </h3>
        </div>
        <div className="w-full max-w-sm space-y-6">
          <LoadingStep title="Estabelecendo conexão neural segura..." isActive={loadingStep === 0} isComplete={loadingStep > 0} />
          <LoadingStep title="Extraindo e sanitizando dados-fonte..." isActive={loadingStep === 1} isComplete={loadingStep > 1} />
          <LoadingStep title="Processando dados com IA..." isActive={loadingStep === 2} isComplete={loadingStep > 2} />
          <LoadingStep title="Sintetizando briefing de inteligência..." isActive={loadingStep === 3} isComplete={loadingStep > 3} />
        </div>
        <button onClick={onClose} className="absolute bottom-8 text-zinc-600 text-xs hover:text-white transition-colors">Cancelar Análise</button>
      </div>
    )}
    
    {loadingState === 'error' && (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4"><X size={32} className="text-red-500"/></div>
        <h3 className="font-bold text-lg mb-2">Falha na Análise</h3>
        <p className="text-sm text-zinc-500 mb-6">Não foi possível processar a notícia. O site pode estar bloqueando a extração ou a API de IA está offline.</p>
        <button onClick={onClose} className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full font-bold text-sm">Voltar</button>
      </div>
    )}

    {/* --- TELA DE CONTEÚDO (APÓS SUCESSO) --- */}
    {loadingState === 'complete' && aiData && (
      <> {/* FRAGMENTO ABERTO AQUI */}
        
        {/* CABEÇALHO DO PAINEL */}
        <div className="relative h-72 w-full flex-shrink-0 sticky top-0 z-20">
          <img src={article.img} className="w-full h-full object-cover absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
            {viewMode === 'chat' ? (
              <button onClick={() => setViewMode('analysis')} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/20 shadow-lg hover:bg-indigo-500 transition flex items-center gap-2">
                <BrainCircuit size={14}/> Voltar à Análise
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button onClick={() => onToggleSave(article)} className={`p-3 rounded-full backdrop-blur-md border ${isSaved ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/30 border-white/20 text-white'}`}><Bookmark size={20} fill={isSaved ? "currentColor" : "none"}/></button>
              <button onClick={onClose} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"><X size={20}/></button>
            </div>
          </div>
          <div className="absolute bottom-8 left-6 right-6 z-10 flex justify-between items-end gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl border-2 border-white/20 bg-white p-0.5 shadow-lg">
                  <img src={article.logo} className="w-full h-full object-contain rounded-md"/>
                </div>
                <span className="text-base font-bold text-white/80 uppercase tracking-widest drop-shadow-lg">{article.source}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight font-serif drop-shadow-2xl">{article.title}</h1>
            </div>
            {viewMode !== 'chat' && (
   <button 
    onClick={() => {
        const newKey = getChatApiKey(); 
        setCurrentChatApiKey(newKey);   
        setViewMode('chat');             
    }}
    // AS CLASSES DE ESTILO FORAM RESTAURADAS AQUI
    className="group relative px-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-600 text-white shrink-0 shadow-lg shadow-green-500/30 hover:scale-105 transition-transform"
>
    <MessageCircle size={26} />
    <span className="text-sm font-bold">Chat</span>
</button>

            )}
          </div>
        </div>
        
        {/* CONTAINER DE CONTEÚDO DINÂMICO */}
        <div className="flex-1 min-h-0">
          {viewMode === 'analysis' && (
            <div className="h-full overflow-y-auto custom-scrollbar px-4 pt-6 pb-20 animate-in fade-in">
              <div className="mb-10">
                <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-white/5 mb-4">
                  {['executive', 'tldr', 'eli5', 'bullets'].map(mode => (
                    <button key={mode} onClick={() => setSummaryMode(mode)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${summaryMode === mode ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-md' : 'text-zinc-400'}`}>
                      {mode === 'executive' ? 'Executivo' : (mode === 'tldr' ? 'Curto' : (mode === 'eli5' ? 'Simples' : 'Tópicos'))}
                    </button>
                  ))}
                </div>
                <div className={`p-6 rounded-3xl border border-dashed ${isDarkMode ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-300 bg-zinc-50'}`}>
                  {summaryMode === 'bullets' ? (
                    <ul className="list-disc pl-5 space-y-3 marker:text-indigo-400 text-sm leading-loose">
                      {aiData.summaries.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : (
                    <p className={`text-sm leading-loose ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {aiData.summaries[summaryMode]}
                    </p>
                  )}
                </div>
              </div>
              <ConstellationWidget mindmap={aiData.mindmap} onNodeClick={handleNodeClick} onCenterClick={() => setShowCenterModal(true)} isDarkMode={isDarkMode} />
              <TimelineWidget items={aiData.timeline} isDarkMode={isDarkMode} />
              <FutureWidget data={aiData.future} isDarkMode={isDarkMode} />
              <DeepDiveWidget topic={aiData.mindmap.center} isDarkMode={isDarkMode} />
            </div>
          )}
          
          {viewMode === 'chat' && (
    <WhatsappChat 
        articleText={readerContent?.textContent || article.summary}
        apiKey={currentChatApiKey} // Agora passa a CHAVE que foi armazenada
        isDarkMode={isDarkMode}
    />
)}
        </div>

        {/* MODAIS (Renderizados por cima de tudo, mas dentro da condição 'complete') */}
        {showCenterModal && (<CenterNodeModal data={aiData} onClose={() => setShowCenterModal(false)} isDarkMode={isDarkMode} />)}
        {viewMode === 'drilldown' && focusedNode && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setViewMode('analysis')}>
            <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border animate-in zoom-in-95 ${isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 opacity-70">
                  <img src={article.logo} className="w-5 h-5 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-wider">{article.source}</span>
                </div>
                <button onClick={() => setViewMode('analysis')} className="p-1 text-zinc-400 hover:text-white"><X size={16}/></button>
              </div>
              <h2 className="text-2xl font-black text-indigo-400 leading-tight mb-4">{focusedNode.name || focusedNode.term}</h2>
              {(!focusedNode.context || focusedNode.context.toLowerCase().includes('contexto geral')) ? (
                <div>
                  <p className="text-xs italic opacity-60 mb-3">Contexto detalhado não gerado. Pontos principais:</p>
                  <ul className="list-disc pl-4 space-y-1 marker:text-purple-400 text-xs">{aiData.summaries.bullets.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{focusedNode.context}</p>
              )}
              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2">
                <h4 className="text-[9px] font-black uppercase tracking-widest opacity-50">Evidências</h4>
                {focusedNode.evidence_quotes && focusedNode.evidence_quotes.length > 0 ? (
                  focusedNode.evidence_quotes.map((quote, i) => (
                    <div key={i} onClick={() => handleQuoteClick(quote)} className={`p-3 rounded-xl border cursor-pointer text-xs italic ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>"{quote}"</div>
                  ))
                ) : <p className="text-xs opacity-50 italic">Nenhuma citação direta encontrada.</p>}
              </div>
            </div>
          </div>
        )}
        {viewMode === 'magic' && (
          <div className="absolute inset-0 overflow-y-auto bg-zinc-950 z-30">
            <MagicPremiumView article={article} readerContent={readerContent} highlightText={highlightRequest} isDarkMode={isDarkMode} fontSize={fontSize} />
          </div>
        )}
      </>
    )}
  </div>
);
});




function PodNewsModal({ onClose, isDarkMode }) {
  const [status, setStatus] = useState('generating'); // 'generating' | 'playing'
  const [progress, setProgress] = useState(0);

  // Simula a IA gerando o podcast
  useEffect(() => {
    if (status === 'generating') {
      const timer = setTimeout(() => {
        setStatus('playing');
      }, 3500); // 3.5 segundos de "processamento"
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Simula o progresso do áudio
  useEffect(() => {
    if (status === 'playing') {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 0.5 : 100));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Card do Modal */}
      <div className={`
        relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-all scale-100
        ${isDarkMode ? 'bg-zinc-900 border border-white/10' : 'bg-white'}
      `}>
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}
        >
          <X size={20} />
        </button>

        {/* --- ESTADO 1: IA GERANDO --- */}
        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
            <div className="relative">
               {/* Orbe Pulsante */}
               <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-spin blur-xl opacity-70 absolute top-0 left-0" />
               <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-pulse relative z-10 flex items-center justify-center">
                  <BrainCircuit size={40} className="text-white animate-bounce" />
               </div>
            </div>
            
            <div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Criando seu PodNews
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                A IA está lendo 10 fontes das 07:00... <br/>
                Sintetizando voz neural...
              </p>
            </div>
          </div>
        )}

        {/* --- ESTADO 2: TOCANDO --- */}
        {status === 'playing' && (
          <div className="flex flex-col py-8 px-6">
             
             {/* Capa do Podcast */}
             <div className="flex gap-4 items-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                   <Headphones size={32} className="text-white" />
                </div>
                <div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Daily Briefing</span>
                   <h3 className={`text-lg font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      Resumo das 07:00
                   </h3>
                   <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      10 Notícias • 3 min
                   </span>
                </div>
             </div>

             {/* Visualizador de Onda (Fake) */}
             <div className="flex items-center justify-center gap-1 h-12 mb-6">
                {[...Array(20)].map((_, i) => (
                   <div 
                      key={i} 
                      className="w-1.5 bg-purple-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]"
                      style={{ 
                        height: `${Math.random() * 100}%`, 
                        animationDelay: `${i * 0.1}s`,
                        opacity: progress > 0 ? 1 : 0.3 
                      }} 
                   />
                ))}
             </div>

             {/* Controles */}
             <div className="space-y-2">
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                   <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                   <span>{(progress * 0.03).toFixed(2).replace('.',':')}</span>
                   <span>03:00</span>
                </div>
             </div>

             <div className="flex justify-center items-center gap-6 mt-6">
                <button className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-zinc-800'}`}><Share size={20}/></button>
                <button className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition">
                   <Pause size={24} fill="white" />
                </button>
                <button className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-zinc-800'}`}><Bookmark size={20}/></button>
             </div>

          </div>
        )}
      </div>
    </div>
  );
}

// --- MODAL DE CONFIGURAÇÕES (V3 - FINAL - COM LOGIN VIA CÓDIGO/OTP) ---
function SettingsModal({ onClose, isDarkMode, feeds, setFeeds, apiKeys, setApiKeys, user }) {
const [activeTab, setActiveTab] = useState(user ? 'sources' : 'account'); 
const [isWidgetPoolOpen, setIsWidgetPoolOpen] = useState(true); // Começa aberto por padrão

  // Auth States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(''); // O código de 6 dígitos
  const [showOtpInput, setShowOtpInput] = useState(false); // Controla se mostra o campo de código
  const [loadingAuth, setLoadingAuth] = useState(false);
  
  // Estados para adicionar nova fonte
  const [newUrl, setNewUrl] = useState('');
  const [feedType, setFeedType] = useState('news'); 
  const [targetFeed, setTargetFeed] = useState(true);
  const [targetBanca, setTargetBanca] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para Edição
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');

  // --- 1. ENVIAR O CÓDIGO ---
  const handleSendCode = async () => {
      setLoadingAuth(true);
      const { error } = await supabase.auth.signInWithOtp({
          email: email,
          // NÃO passamos redirectTo. Isso força o envio do código, não do link.
      });
      setLoadingAuth(false);
      
      if (error) {
          alert("Erro: " + error.message);
      } else {
          setShowOtpInput(true); // Mostra o campo para digitar o código
          alert("Código enviado! Verifique seu e-mail.");
      }
  };

  // --- 2. VERIFICAR O CÓDIGO ---
  const handleVerifyCode = async () => {
      setLoadingAuth(true);
      const { data, error } = await supabase.auth.verifyOtp({
          email: email,
          token: otp,
          type: 'email',
      });
      setLoadingAuth(false);

      if (error) {
          alert("Código inválido ou expirado.");
      } else {
          // Sucesso! O useEffect do componente principal vai detectar o user e baixar os dados.
          alert("Login realizado com sucesso!");
          onClose();
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setShowOtpInput(false);
      setOtp('');
      onClose(); 
  };

  // ... (Funções de Fontes - Mantidas iguais) ...
  const startEditing = (feed) => { setEditingId(feed.id); setTempName(feed.name); };
  const cancelEditing = () => { setEditingId(null); setTempName(''); };
  const saveName = (id) => { if (tempName.trim()) { setFeeds(prev => prev.map(f => f.id === id ? { ...f, name: tempName } : f)); } setEditingId(null); };
  const removeFeed = (id) => { setFeeds(feeds.filter(f => f.id !== id)); };
  
  const handleAutoDiscover = async () => {
      if (!newUrl) return;
      setIsDiscovering(true);
      let urlToCheck = newUrl.trim();
      if (!urlToCheck.startsWith('http')) urlToCheck = 'https://' + urlToCheck;
      try {
          const { data, error } = await supabase.functions.invoke('parse-feed', { body: { url: urlToCheck, type: 'discover' } });
          if (error || !data || !data.url) throw new Error("Feed não encontrado");
          setNewUrl(data.url);
          if (data.url.includes('youtube') || data.url.includes('youtu.be')) { setFeedType('youtube'); } else if (data.url.includes('pod') || data.url.includes('cast')) { setFeedType('podcast'); }
          alert(`Sucesso! Feed encontrado: ${data.url}`);
      } catch (err) { alert("Não foi possível encontrar um feed RSS automático."); } finally { setIsDiscovering(false); }
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportOPML = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const outlines = xmlDoc.getElementsByTagName("outline");
      const importedFeeds = [];
      for (let i = 0; i < outlines.length; i++) {
        const node = outlines[i];
        const xmlUrl = node.getAttribute("xmlUrl");
        if (xmlUrl) {
          importedFeeds.push({
            id: Date.now() + i + Math.random(),
            name: node.getAttribute("text") || "Fonte Importada",
            url: xmlUrl,
            category: 'Importado',
            type: 'news',
            display: { feed: true, banca: false }
          });
        }
      }
      if (importedFeeds.length > 0) setFeeds(prev => [...prev, ...importedFeeds]);
    };
    reader.readAsText(file);
  };

  const handleAddFeed = () => {
    if (!newUrl.trim()) return; 
    if (!targetFeed && !targetBanca) { alert("Selecione onde exibir."); return; }
    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith('http')) formattedUrl = 'https://' + formattedUrl;
    const newFeed = { id: Date.now(), name: 'Nova Fonte', url: formattedUrl, type: feedType, category: feedType === 'podcast' ? 'Podcast' : 'Geral', display: { feed: true, banca: false } };
    setFeeds(prev => [...prev, newFeed]);
    setNewUrl(''); setTargetFeed(true); setTargetBanca(false); setFeedType('news');
  };

const handleKeyChange = (targetId, newValue) => {
    // Essa função pega a lista antiga de chaves e atualiza só a que você está digitando
    setApiKeys(currentKeys => 
      currentKeys.map(key => 
        key.id === targetId ? { ...key, value: newValue } : key
      )
    );
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-lg">Configurações</h2>
            <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex p-2 gap-2 border-b border-white/5 bg-black/5 dark:bg-white/5 overflow-x-auto">
            <button onClick={() => setActiveTab('account')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'account' ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50 hover:opacity-100'}`}><div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`} />Conta</button>
            <button onClick={() => setActiveTab('sources')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'sources' ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50 hover:opacity-100'}`}>Fontes</button>
            <button onClick={() => setActiveTab('api')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'api' ? 'bg-purple-600 text-white' : 'opacity-50 hover:opacity-100'}`}>IA</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {/* --- ABA CONTA (MODO CÓDIGO) --- */}
            {activeTab === 'account' && (
                <div className="space-y-6 text-center">
                    {user ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                                {user.email[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Conectado</h3>
                                <p className="text-sm opacity-60">{user.email}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold w-full">
                                <CheckCircle size={16} className="inline mr-2 mb-0.5"/>
                                Sincronização Ativa
                            </div>
                            <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-red-500/50 text-red-500 font-bold hover:bg-red-500/10 transition">
                                Desconectar
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-2">
                                <CloudSun size={32} className="opacity-50"/>
                            </div>
                            <h3 className="font-bold text-xl">Login via Código</h3>
                            <p className="text-sm opacity-60 leading-relaxed max-w-xs">
                                Digite seu e-mail para receber um código de acesso rápido. Funciona em qualquer dispositivo.
                            </p>
                            
                            {!showOtpInput ? (
                                /* PASSO 1: DIGITAR EMAIL */
                                <div className="w-full mt-4 space-y-3">
                                    <input 
                                        type="email" 
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl outline-none border transition-all ${isDarkMode ? 'bg-black/30 border-white/10 focus:border-white/30' : 'bg-zinc-50 border-zinc-200 focus:border-zinc-400'}`}
                                    />
                                    <button 
                                        onClick={handleSendCode} 
                                        disabled={loadingAuth || !email}
                                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loadingAuth ? <Loader2 size={18} className="animate-spin"/> : 'Enviar Código'}
                                    </button>
                                </div>
                            ) : (
                                /* PASSO 2: DIGITAR CÓDIGO */
                                <div className="w-full mt-4 space-y-3 animate-in fade-in slide-in-from-right-4">
                                    <div className="text-left text-xs font-bold opacity-50 mb-1 pl-1">Código enviado para {email}</div>
                                    <input 
                                        type="text" 
    placeholder="Cole o código aqui"
    value={otp}
    onChange={(e) => setOtp(e.target.value)}
    className={`w-full px-4 py-3 rounded-xl outline-none border text-center text-xl font-mono transition-all ${isDarkMode ? 'bg-black/30 border-blue-500/50 focus:border-blue-500' : 'bg-zinc-50 border-blue-200 focus:border-blue-500'}`}
/>
                                    <button 
                                        onClick={handleVerifyCode} 
                                        disabled={loadingAuth || otp.length < 6}
                                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loadingAuth ? <Loader2 size={18} className="animate-spin"/> : 'Entrar'}
                                    </button>
                                    <button onClick={() => setShowOtpInput(false)} className="text-xs opacity-50 hover:opacity-100 underline">Voltar / Corrigir E-mail</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ABA FONTES (ATUALIZADA COM CATEGORIAS) */}
            {activeTab === 'sources' && (
                <div className="space-y-6">
                    {/* Botão Importar OPML (Mantido igual) */}
                    <div className="flex gap-2 mb-2">
                        <input type="file" accept=".opml,.xml" ref={fileInputRef} onChange={handleImportOPML} className="hidden" />
                        <button onClick={handleImportClick} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-zinc-300 dark:hover:bg-zinc-700 transition flex items-center justify-center gap-2">
                            <Layers size={14}/> Importar OPML
                        </button>
                    </div>

                    {/* ÁREA DE ADICIONAR NOVA FONTE */}
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3 block">Adicionar Fonte Manual</label>
                        
                        {/* Input URL */}
                        <div className="flex gap-2 mb-3">
                            <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Link RSS (ex: g1.globo.com/rss)" className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'}`} />
                            <button onClick={handleAutoDiscover} disabled={isDiscovering || !newUrl} className={`p-2 rounded-lg border w-10 flex items-center justify-center ${isDarkMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>{isDiscovering ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}</button>
                        </div>

                        {/* Seletores de Tipo e Categoria */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Tipo (News/Youtube/Pod) */}
                            <div>
                                <label className="text-[10px] font-bold uppercase opacity-50 mb-1 block">Tipo</label>
                                <select 
                                    value={feedType} 
                                    onChange={(e) => setFeedType(e.target.value)}
                                    className={`w-full p-2 rounded-lg text-xs font-bold border outline-none appearance-none ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-800'}`}
                                >
                                    <option value="news">📰 Notícia</option>
                                    <option value="youtube">▶️ Vídeo</option>
                                    <option value="podcast">🎙️ Podcast</option>
                                </select>
                            </div>

                            {/* Categoria (Para o Filtro Liquid) */}
                            <div>
                                <label className="text-[10px] font-bold uppercase opacity-50 mb-1 block">Categoria</label>
                                <select 
                                    value={targetBanca ? 'Revistas' : 'Geral'} // Fallback visual simples, mas a lógica real está no onChange ou state dedicado se quiser
                                    onChange={(e) => {
                                        // Aqui você pode criar um state para 'selectedCategory' se quiser, 
                                        // ou apenas salvar direto no objeto feed quando clicar em adicionar.
                                        // Vou assumir que vamos usar o valor direto na hora de adicionar.
                                        document.getElementById('new-feed-category').value = e.target.value;
                                    }}
                                    id="new-feed-category"
                                    className={`w-full p-2 rounded-lg text-xs font-bold border outline-none appearance-none ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-800'}`}
                                >
                                    {FEED_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                if (!newUrl.trim()) return;
                                let formattedUrl = newUrl.trim();
                                if (!formattedUrl.startsWith('http')) formattedUrl = 'https://' + formattedUrl;
                                
                                // Pega a categoria selecionada
                                const selectedCat = document.getElementById('new-feed-category')?.value || 'Geral';

                                const newFeed = { 
                                    id: Date.now(), 
                                    name: 'Nova Fonte', 
                                    url: formattedUrl, 
                                    type: feedType, 
                                    category: selectedCat, // <--- AQUI SALVA A CATEGORIA CERTA
                                    display: { feed: true, banca: false } 
                                };
                                setFeeds(prev => [...prev, newFeed]);
                                setNewUrl('');
                            }} 
                            className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold text-sm transition hover:bg-purple-500"
                        >
                            Adicionar Fonte
                        </button>
                    </div>

                    {/* LISTA DE FONTES ATIVAS */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">Fontes Ativas</label>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                            {feeds.map(feed => (
                                <div key={feed.id} className={`flex flex-col gap-2 p-3 rounded-lg border ${isDarkMode ? 'bg-zinc-800/30 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                                    
                                    {/* Linha 1: Nome e Ações */}
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {feed.type === 'podcast' ? <Mic size={14} className="text-orange-500 shrink-0"/> : feed.type === 'youtube' ? <Youtube size={14} className="text-red-500 shrink-0"/> : <Rss size={14} className="text-blue-500 shrink-0"/>}
                                            {editingId === feed.id ? (
                                                <input type="text" autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} className={`w-full text-sm bg-transparent border-b outline-none ${isDarkMode ? 'text-white border-white/30' : 'text-black border-black/20'}`} />
                                            ) : (
                                                <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{feed.name}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                           <button 
                    onClick={() => {
                        // Esta função irá alternar o estado 'display.banca'
                        setFeeds(prev => prev.map(f => 
                            f.id === feed.id 
                                ? { ...f, display: { ...f.display, banca: !f.display?.banca } } 
                                : f
                        ));
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                        feed.display?.banca 
                            ? 'text-emerald-500 bg-emerald-500/10' 
                            : 'text-zinc-400 hover:text-emerald-500'
                    }`}
                    title="Adicionar/Remover da Banca"
                >
                    <LayoutGrid size={14}/>
                </button>
                                            {editingId === feed.id ? (
                                                <><button onClick={() => saveName(feed.id)} className="text-green-500 p-1.5"><Check size={16}/></button><button onClick={cancelEditing} className="text-zinc-500 p-1.5"><X size={16}/></button></>
                                            ) : (
                                                <><button onClick={() => startEditing(feed)} className="text-zinc-400 hover:text-blue-500 p-1.5"><Pencil size={14}/></button><button onClick={() => removeFeed(feed.id)} className="text-zinc-400 hover:text-red-500 p-1.5"><Trash2 size={14}/></button></>
                                            )}
                                        </div>
                                    </div>

                                    {/* Linha 2: Seletor de Categoria (Compacto) */}
                                    <div className="flex items-center justify-between">
                                        <div className="relative group">
                                            <select 
                                                value={feed.category || 'Geral'} 
                                                onChange={(e) => {
                                                    // Atualiza a categoria do feed no estado principal
                                                    setFeeds(prev => prev.map(f => f.id === feed.id ? { ...f, category: e.target.value } : f));
                                                }}
                                                className={`
                                                    appearance-none pl-2 pr-6 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border cursor-pointer outline-none transition-colors
                                                    ${isDarkMode 
                                                        ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200' 
                                                        : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-black'}
                                                `}
                                            >
                                                {FEED_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            {/* Ícone de seta fake para ficar bonito */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <ChevronDown size={10} />
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-mono opacity-30 truncate max-w-[150px]">{feed.url}</span>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
 
   {/* ABA API (GERENCIADOR DE CHAVES) */}
            {activeTab === 'api' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                     
               {/* POOL 1: WIDGETS (Leve) - VERSÃO FINAL, SEM ACORDEÃO */}
<div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
   <div className="flex items-center gap-2 mb-3">
       <Activity size={14} className="text-blue-500"/>
       <h3 className="text-sm font-bold">Pool 1: Widgets (Leve)</h3>
   </div>
   <div className="space-y-2">
       {apiKeys.filter(k => k.type === 'free_widget').map((key) => (
           <input 
               key={key.id}
               type="text" 
               value={key.value} 
               onChange={(e) => handleKeyChange(key.id, e.target.value)} 
               placeholder={`Chave Gratuita #${key.id}`} 
               className={`w-full px-3 py-2 rounded-lg border font-mono text-[10px] outline-none focus:border-blue-500 ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-white border-zinc-300'}`} 
           />
       ))}
   </div>
</div>

                     {/* POOL 2: USINA DE IA (Pesado) */}
                     <div className={`p-4 rounded-xl border border-purple-500/30 ${isDarkMode ? 'bg-purple-900/10' : 'bg-purple-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <BrainCircuit size={14} className="text-purple-500"/>
                            <h3 className="text-sm font-bold">Pool 2: Usina de IA (Pesado)</h3>
                        </div>
                        <p className="text-[10px] opacity-60 mb-3 leading-relaxed">
                            Crie até 6 projetos <strong>sem cartão</strong> no AI Studio. O app fará o rodízio automático para análises pesadas.
                        </p>
                        
                        <div className="space-y-2">
                            {/* ========================================================== */}
                            {/* === AQUI ESTÁ A CORREÇÃO === */}
                            {/* ========================================================== */}
                            {/* Trocamos o filtro de ID fixo por um filtro de 'type' */}
                            {apiKeys.filter(k => k.type === 'heavy_rotation').map((key, index) => (
                                <div key={key.id} className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold opacity-50">#{key.id}</span>
                                    <input 
                                        type="text" 
                                        value={key.value} 
                                        onChange={(e) => handleKeyChange(key.id, e.target.value)} 
                                        placeholder={`Cole a Chave do Projeto ${index + 1} aqui...`} 
                                        className={`w-full pl-8 pr-3 py-2 rounded-lg border font-mono text-[10px] outline-none focus:border-purple-500 ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-white border-zinc-300'}`} 
                                    />
                                </div>
                            ))}
                        </div>
                     </div>

                     {/* POOL 3: CHAT */}
                     <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <MessageCircle size={14} className="text-green-500"/>
                            <h3 className="text-sm font-bold">Pool 3: Chat com IA</h3>
                        </div>
                        <div className="space-y-2">
                            {/* CORREÇÃO PARA O POOL 3: Filtrar por 'type' */}
                            {apiKeys.filter(k => k.type === 'chat_key').map((key) => (
                                <input 
                                    key={key.id}
                                    type="text" 
                                    value={key.value} 
                                    onChange={(e) => handleKeyChange(key.id, e.target.value)} 
                                    placeholder={`Chave de Chat #${key.id}`} 
                                    className={`w-full px-3 py-2 rounded-lg border font-mono text-[10px] outline-none focus:border-green-500 ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-white border-zinc-300'}`} 
                                />
                            ))}
                        </div>
                     </div>

                     {/* LEGADO (5-6) - Opcional, esconde num accordion ou deixa no fim */}
                     <div className="opacity-50 hover:opacity-100 transition-opacity">
                        <h4 className="text-[10px] uppercase font-bold mb-2">Backup / Legado</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={apiKeys.find(k=>k.id===5)?.value} onChange={(e)=>handleKeyChange(5, e.target.value)} placeholder="Chave 5 (Antiga)" className="px-2 py-1 rounded border bg-transparent text-[9px]" />
                            <input type="text" value={apiKeys.find(k=>k.id===6)?.value} onChange={(e)=>handleKeyChange(6, e.target.value)} placeholder="Chave 6 (Antiga)" className="px-2 py-1 rounded border bg-transparent text-[9px]" />
                        </div>
                     </div>

                     <div className="text-center pt-2">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-500 hover:underline">
                            + Gerar Novas Chaves
                        </a>
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function NewsletterTab({ openArticle, isDarkMode, newsData }) {
  const [copied, setCopied] = useState(false);

  // Simula endereço único do usuário
  const userEmail = "usuario.392@newsos.inbox";

  const handleCopy = () => {
    navigator.clipboard.writeText(userEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtra ou Mocka newsletters
  // Na prática, você classificaria feeds como 'Newsletter' no SettingsModal
  const newsletters = newsData.filter(n => n.source.toLowerCase().includes('newsletter') || n.source === 'Morning Brew' || n.source === 'The Skimm') 
  
  // Mock para visualização se não tiver dados
  const displayItems = newsletters.length > 0 ? newsletters : [
      { id: 'nl1', source: 'Morning Brew', title: 'Markets tumble as inflation hits record low', summary: 'Plus: The future of AI in healthcare and why tech stocks are rallying.', time: '07:00', img: null, category: 'Finance', logo: 'https://ui-avatars.com/api/?name=MB&background=000&color=fff' },
      { id: 'nl2', source: 'The Skimm', title: 'Daily Skimm: What to know about the new bill', summary: 'Breaking down the complex legislation passed yesterday in congress.', time: '08:30', img: null, category: 'Politics', logo: 'https://ui-avatars.com/api/?name=TS&background=1abc9c&color=fff' },
      { id: 'nl3', source: 'Filipe Deschamps', title: 'O bug que parou a internet ontem', summary: 'Uma análise técnica sobre a queda do AWS e como evitar.', time: 'Ontem', img: null, category: 'Tech', logo: 'https://ui-avatars.com/api/?name=FD&background=f1c40f&color=000' },
  ];

  return (
    <div className="pb-24 pt-2 animate-in fade-in duration-500 min-h-screen">
      
      {/* HEADER: SEU ENDEREÇO MÁGICO */}
      <div className="px-4 mb-8">
         <div className={`p-6 rounded-3xl relative overflow-hidden shadow-2xl ${isDarkMode ? 'bg-gradient-to-br from-indigo-900 to-purple-900 text-white' : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'}`}>
            {/* Decoração de fundo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <Mail size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Sua Inbox NewsOS</span>
                </div>
                <h2 className="text-2xl font-bold mb-4 leading-tight">
                    Receba newsletters direto aqui.
                </h2>
                <p className="text-sm opacity-70 mb-6 max-w-xs">
                    Inscreva-se em qualquer newsletter usando seu endereço exclusivo abaixo. Nós transformamos o email em feed.
                </p>

                {/* Campo de Copiar */}
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 pl-4 rounded-xl border border-white/10">
                    <span className="text-sm font-mono truncate flex-1 opacity-90">{userEmail}</span>
                    <button 
                        onClick={handleCopy}
                        className="bg-white text-indigo-900 p-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-zinc-100 transition active:scale-95"
                    >
                        {copied ? <Check size={14}/> : <Copy size={14}/>}
                        {copied ? 'Copiado' : 'Copiar'}
                    </button>
                </div>
            </div>
         </div>
      </div>

      {/* LISTA DE NEWSLETTERS (Estilo "Inbox") */}
      <div className="px-4">
        <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Últimas Edições
        </h3>

        <div className="space-y-3">
            {displayItems.map((item, idx) => (
                <div 
                    key={idx} 
                    onClick={() => openArticle(item)}
                    className={`
                        group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer
                        hover:scale-[1.01] hover:shadow-lg
                        ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500/50' : 'bg-white border-zinc-200 hover:border-indigo-200'}
                    `}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <img src={item.logo} className="w-8 h-8 rounded-full border border-black/10" alt="" />
                            <div>
                                <span className={`text-sm font-bold block ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{item.source}</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-medium opacity-50 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{item.time}</span>
                    </div>
                    
                    <h4 className={`text-lg font-bold leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {item.title}
                    </h4>
                    <p className={`text-sm line-clamp-2 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {item.summary}
                    </p>

                    {/* Botão de Ler decorativo */}
                    <div className="mt-4 flex items-center gap-2 text-indigo-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                        Ler edição completa <ArrowRight size={12} />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
