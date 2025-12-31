"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js'
import { Browser } from '@capacitor/browser';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser';

// Coloque suas chaves reais aqui
const supabase = createClient('https://usnhoviysiaeqcwvnhcd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbmhvdml5c2lhZXFjd3ZuaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjQ1NjksImV4cCI6MjA4MTM0MDU2OX0.7K1qfEeRZ7qrJBf0noIZJ6fkT4OMKIljgwd6r2MLUXk')
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, Play, Pause, 
  Maximize2, X, Globe, ArrowRight,
  Sun, Moon, TrendingUp, TrendingDown, CloudSun, CloudMoon, MapPin, Telescope,
  Clock, DollarSign, Bitcoin, Activity, Zap, GripVertical,
  FileText, CheckCircle, Trash2, BrainCircuit, Euro, 
  Headphones, Search, ChevronRight, Rss, Calendar as CalendarIcon, Loader2, RefreshCw, Music, Disc3, SkipBack, SkipForward, Type, ALargeSmall, Minus, Plus, PenTool, Highlighter, StickyNote, Save, Archive, Pencil, Eraser, Undo, Redo, Mail, Copy, Check, Wand2, Languages, Mic, Volume2, VolumeX, Heart, ChevronDown
} from 'lucide-react';


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

const FEED_CATEGORIES = ['Tudo', 'Geral', 'Política', 'Tecnologia', 'Economia', 'Saúde', 'Local', 'Carros', 'Esportes', 'Mundo', 'Ciência'];
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


function HeaderDashboard({ isDarkMode, onOpenSettings, activeTab, isLoading, selectedSource }) {
  const [aiStatus, setAiStatus] = useState("Inicializando sistemas...");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [data, setData] = useState({});

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
      {/* O CalendarModal só é renderizado se a data existir */}
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
                className={`
                    flex items-center gap-3 px-5 py-3 
                    rounded-b-2xl border-x border-b border-white/10
                    bg-black/20 backdrop-blur-xl shadow-lg
                    transition-all duration-200 ease-out
                    ${Math.abs(dragOffset) > 0 ? 'translate-y-1 bg-black/40' : 'hover:bg-black/30 hover:pt-4'}
                `}
                style={{ transform: `translateX(${dragOffset}px)` }}
              >
                  <ChevronLeft size={14} className={`text-white/40 transition-opacity ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                  <span className="text-sm font-bold text-green-400 whitespace-nowrap tracking-wide flex items-center gap-2 uppercase text-[10px]">
                      {/* --- CORREÇÃO DE HIDRATAÇÃO APLICADA AQUI --- */}
                      {/* 3. Renderiza a data apenas se ela já foi definida no cliente */}
                      {currentDate ? formatDate(currentDate) : <>&nbsp;</>}
                      {/* --- FIM DA CORREÇÃO --- */}
                      <CalendarIcon size={10} className="opacity-50" />
                  </span>
                  <ChevronRight size={14} className={`text-white/40 transition-opacity ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'group-hover:opacity-100'}`} />
              </div>
           </div>

           <div className="flex justify-between items-center mt-10">
              <div className="flex items-center gap-3">
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
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`
                    relative z-[60] p-2.5 rounded-xl transition-all duration-500 flex items-center gap-2 border -mr-6
                    ${isSearchOpen 
                        ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-90' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 active:scale-95'}
                `}
              >
                {isSearchOpen ? <X size={18} /> : <Sparkles size={18} className="text-purple-400 animate-pulse" />}
                {!isSearchOpen && <span className="text-[10px] font-black uppercase tracking-widest px-4">Ask AI</span>}
              </button>
           </div>
           <div className={`
              grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${isSearchOpen ? 'grid-rows-[1fr] mt-2 mb-2' : 'grid-rows-[0fr] mt-0 mb-0'}
           `}>
              <div className="overflow-hidden">
                <div 
                    className={`
                        transition-all duration-500 delay-[50ms] origin-top-right
                        ${isSearchOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 -translate-y-4'}
                    `}
                >
                    <div className="relative flex items-center bg-white/5 backdrop-blur-3xl border border-white/20 rounded-2xl p-1 shadow-inner">
                        <div className="pl-4 pr-3 text-white/30"><Search size={18} /></div>
                        <input 
                            type="text" 
                            autoFocus={isSearchOpen}
                            placeholder="O que você deseja saber?" 
                            className="w-full bg-transparent text-white placeholder:text-white/30 text-sm font-medium py-3 outline-none" 
                        />
                        <div className="pr-1.5">
                            <button className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
              </div>
           </div>
           <div className={`
              relative w-full overflow-hidden transition-all duration-700
              [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]
              ${isSearchOpen ? 'opacity-20  scale-95 pointer-events-none' : 'opacity-100 scale-100'}
           `}>
              <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
              <div className="flex w-max animate-[scroll_40s_linear_infinite] hover:[animation-play-state:paused]">
                  {[...TICKERS, ...TICKERS, ...TICKERS].map((item, index) => (
                      <TickerItem 
                        key={`${item.id}-${index}`} 
                        label={item.label} 
                        value={data[item.id]?.val || '...'} 
                        up={data[item.id]?.up} 
                        icon={item.icon} 
                      />
                  ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- LIQUID FILTER ---

function LiquidFilterBar({ categories, active, onChange, isDarkMode }) {
  return (
    // Adicionei pl-14 para empurrar a barra para a direita, livrando o botão de fontes (SourceSelector)
    <div className="w-full flex justify-start pl-14 pr-4 sticky top-0 z-30 py-2 pointer-events-none">
      
      <div className={`
        pointer-events-auto
        flex overflow-x-auto scrollbar-hide snap-x items-center
        w-full
        rounded-2xl 
        p-1
        shadow-lg
        ${isDarkMode 
          ? 'bg-zinc-900/95 shadow-black/20' // Removi a borda externa cinza
          : 'bg-white/95 shadow-zinc-200/50' // Removi a borda externa cinza
        }
      `}>
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onChange(cat)} 
              className={`
                relative px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap snap-center flex-shrink-0
                ${isActive 
                  ? 'bg-purple-600 text-white shadow-md'
                  : (isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-black hover:bg-zinc-100')}
              `}
            >
              {cat}
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
           <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
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
                 w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all
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
                     className={`
                       relative w-10 h-10 rounded-full p-[2px] transition-transform hover:scale-110 flex-shrink-0
                       ${selectedSource === item.source ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : ''}
                     `}
                     title={item.source}
                   >
                     <img 
                       src={item.logo} 
                       alt={item.source} 
                       className="w-full h-full rounded-full object-cover border border-black/10 bg-white"
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
    <div className="absolute left-180 top-25 z-[1001]">
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
             <button onClick={() => { onSelect('all'); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selectedChannel === 'all' ? 'bg-purple-600 text-white' : (isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')}`}>
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
          {/* Mantive o logo pequeno pois ajuda na identificação */}
          <div className="p-1 rounded-full shadow-lg bg-white/20 backdrop-blur-md border border-white/30">
             <img 
               src={logo} 
               alt="Logo" 
               className="w-6 h-6 rounded-full object-cover" 
               onError={(e) => e.target.style.display = 'none'} 
             />
          </div>

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

const NewsCard = React.memo(({ news, isSelected, isRead, isSaved, isLiked, isDarkMode, onClick, onToggleSave, onToggleLike }) => {
  const displayTime = news.rawDate 
    ? new Date(news.rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '...';

  return (
    <div 
      onClick={() => onClick(news)}
      style={{ zIndex: isSelected ? 50 : 1 }}
      className={`
        group relative cursor-pointer 
        transition-transform duration-200 ease-out will-change-transform
        flex flex-col overflow-hidden rounded-3xl
        ${isSelected 
          ? (isDarkMode 
              ? 'bg-zinc-900 scale-[1.02] border-2 border-purple-500 shadow-2xl shadow-black/50' 
              : 'bg-white scale-[1.02] border-2 border-purple-500 shadow-2xl shadow-purple-900/10')
          : (isDarkMode 
              ? 'bg-zinc-900 border border-white/5 active:scale-[0.98]' 
              : 'bg-white border border-zinc-200 shadow-sm active:scale-[0.98]')
        }
      `}
    >
      {/* OTIMIZAÇÃO: Auras de blur removidas para não travar o iPad */}
      
      <div className="relative z-10 flex flex-row gap-5 w-full p-3 items-start">
          <div className={`relative overflow-hidden rounded-2xl flex-shrink-0 shadow-sm w-28 h-28 md:w-36 md:h-36 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
            <SmartImage src={news.img} title={news.title} logo={news.logo} sourceName={news.source} isDarkMode={isDarkMode} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
            {isSelected && <div className="absolute inset-0 bg-[#4c1d95]/10 mix-blend-overlay pointer-events-none" />}
          </div>

          <div className="flex-1 flex flex-col justify-start gap-1 py-1 min-w-0">
            <div>
                <div className="flex justify-between items-center mb-2">
                    {/* RESTAURADO: O bloco do Logo Quadrado + Nome da Fonte */}
                    <div className="flex items-center">
                        <div className={`relative z-20 w-8 h-8 rounded-lg overflow-hidden border shadow-sm shrink-0 ${isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'}`}>
                            <img src={news.logo} className="w-full h-full object-cover" alt="" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${news.source}&background=random`}/>
                        </div>
                        <div className={`relative z-10 -ml-3 pl-4 pr-3 py-1 rounded-lg border-y border-r border-l-0 text-[10px] font-bold tracking-tight uppercase flex items-center h-7.5 mt-0.6 ${isDarkMode ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-white/80 border-zinc-300 text-zinc-600'}`}>
                            {news.source}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isRead && !isSelected && (<div className="flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded text-white" title="Notícia já lida"><CheckCircle size={10} /><span className="text-[9px] font-bold uppercase">Lido</span></div>)}
                      <span className={`text-[10px] font-bold tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{displayTime}</span>
                    </div>
                </div>
                
                {isSelected && (<div className="flex items-center gap-2 mb-1.5 animate-pulse"><Sparkles size={16} className="text-[#047857] dark:text-[#4ade80]" /><span className="text-[16px] font-black font-bold uppercase tracking-widest text-[green] dark:text-[#4ade80] drop-shadow-sm">Lendo Agora</span></div>)}
                
                <h3 className={`text-lg font-bold leading-snug tracking-tight transition-colors line-clamp-3 ${isSelected ? 'text-[purple] dark:text-[#4ade80]' : isRead ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : (isDarkMode ? 'text-zinc-100 group-hover:text-purple-400' : 'text-zinc-800 group-hover:text-[#4c1d95]')}`}>{news.title}</h3>
            </div>
            <p className={`text-sm leading-relaxed line-clamp-2 font-medium mt-0 ${isRead ? 'text-zinc-500/60' : (isSelected ? (isDarkMode ? 'text-zinc-300' : 'text-zinc-600') : (isDarkMode ? 'text-zinc-500' : 'text-zinc-500'))}`}>{news.summary}</p>
          </div>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border backdrop-blur-md select-none ${isDarkMode ? 'bg-black/20 border-white/5 text-zinc-400' : 'bg-white/40 border-black/5 text-zinc-500'}`}><Clock size={10} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} /><span className="text-[9px] font-bold uppercase tracking-wider">{news.readTime || '3 min'}</span></div>
          
          <button onClick={(e) => { e.stopPropagation(); if (onToggleLike) onToggleLike(news);}} className={`p-2 rounded-full transition-all duration-300 active:scale-75 group/like ${isLiked ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : (isDarkMode ? 'bg-black/20 text-zinc-400 hover:text-rose-500' : 'bg-white/40 text-zinc-500 hover:text-rose-500')}`} title="Curtir"><Heart size={18} fill={isLiked ? "currentColor" : "none"} className="transition-transform group-hover/like:scale-110" /></button>
          
          {/* RESTAURADO: Botão de Áudio/Resumo */}
          <button onClick={(e) => { e.stopPropagation(); alert(`Iniciando leitura por IA de: ${news.title}`); }} className={`p-2 rounded-full transition-all duration-300 active:scale-90 group/audio ${isDarkMode ? 'bg-black/20 hover:bg-[#4c1d95] text-zinc-400 hover:text-white' : 'bg-white/40 hover:bg-[#4c1d95] text-zinc-500 hover:text-white'}`} title="Ouvir Resumo"><Headphones size={18} /></button>
          
          <button onClick={(e) => { e.stopPropagation(); onToggleSave(news); }} className={`p-2 rounded-full transition-all duration-300 active:scale-75 group/save ${isSaved ? 'bg-[#4c1d95] text-white shadow-lg shadow-purple-500/30' : (isDarkMode ? 'bg-black/20 hover:bg-[#4c1d95]/20 text-zinc-400 hover:text-[#a78bfa]' : 'bg-white/40 hover:bg-[#4c1d95]/10 text-zinc-500 hover:text-[#4c1d95]')}`} title="Salvar para ler depois"><Bookmark size={18} fill={isSaved ? "currentColor" : "none"} className="transition-transform group-hover/save:scale-110" /></button>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.news.id === next.news.id &&
    prev.isSelected === next.isSelected &&
    prev.isRead === next.isRead &&
    prev.isSaved === next.isSaved &&
    prev.isLiked === next.isLiked &&
    prev.isDarkMode === next.isDarkMode
  );
});

// --- TAB: FEED (COM PROTEÇÃO CONTRA DUPLICATAS) ---
function FeedTab({ openArticle, isDarkMode, selectedArticleId, savedItems, onToggleSave, readHistory, newsData, isLoading, onPlayVideo, sourceFilter, setSourceFilter, likedItems, onToggleLike, onRefresh }) {
  const [category, setCategory] = useState('Tudo');
  
  // Estado de Dados Estáveis
  const [stableData, setStableData] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Estados Pull-to-Refresh
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inicialização
  useEffect(() => {
    if (newsData && newsData.length > 0 && !hasLoaded) {
        setStableData(newsData);
        setHasLoaded(true);
    }
  }, [newsData, hasLoaded]);

  // Atualização Forçada
  useEffect(() => {
      if (stableData.length === 0 && newsData && newsData.length > 0) {
          setStableData(newsData);
      }
  }, [newsData, stableData.length]);

  const safeNews = (stableData && stableData.length > 0) ? stableData : []; // Removi FEED_NEWS mockado para evitar mistura

// 1. Filtra categorias e fonte selecionada
  const filteredByCategory = category === 'Tudo' ? safeNews : safeNews.filter(n => n.category === category);
  const filteredBySource = sourceFilter === 'all' ? filteredByCategory : filteredByCategory.filter(n => n.source === sourceFilter);

  // 2. CORREÇÃO DA ORDEM NO FEED:
  // Cria uma nova lista e força o sort por timestamp seguro
  const sortedFeed = useMemo(() => {
      return [...filteredBySource].sort((a, b) => {
          const tA = new Date(a.rawDate).getTime() || 0;
          const tB = new Date(b.rawDate).getTime() || 0;
          return tB - tA; // Mais recente no topo
      });
  }, [filteredBySource]);

  // 3. Remove duplicatas (mantendo a ordem do sort acima)
  const uniqueNews = useMemo(() => {
      const seen = new Set();
      const filtered = sortedFeed.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
      });
      // SEGURANÇA PWA: Renderiza no máximo 50 notícias por vez na aba Feed.
      // Isso impede que a memória estoure ao renderizar listas infinitas.
      return filtered.slice(0, 50); 
  }, [sortedFeed]);
  // Funções de Toque
  const handleTouchStart = (e) => {
    if (window.scrollY <= 5 && !isRefreshing) {
        setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0 || isRefreshing) return;
    if (window.scrollY > 5) {
        setPullDistance(0);
        return;
    }
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
        if (e.cancelable) e.preventDefault(); 
        const newPull = Math.min(diff * 0.45, 140); 
        setPullDistance(newPull);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance === 0) {
        setStartY(0);
        return;
    }
    
    if (pullDistance > 70) {
        setIsRefreshing(true);
        setPullDistance(70); 
        
        if (onRefresh) await onRefresh();
        
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        if (newsData && newsData.length > 0) {
            setStableData(newsData);
        }

        setIsRefreshing(false);
    }
    setPullDistance(0);
    setStartY(0);
  };

  if (isLoading && (!stableData || stableData.length === 0)) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 size={40} className="animate-spin text-purple-500" />
          <p className={`text-sm font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Buscando notícias...</p>
       </div>
     );
  }

  return (
    <div 
      className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-24 pt-2 min-h-screen overscroll-y-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* CABEÇALHO */}
      <div className="sticky top-0 z-[1000] w-full flex justify-center py-2 pointer-events-none">
          <div className="pointer-events-auto">
             <SourceSelector news={safeNews} selectedSource={sourceFilter} onSelect={setSourceFilter} isDarkMode={isDarkMode} />
          </div>
          <LiquidFilterBar 
            categories={FEED_CATEGORIES} 
            active={category} 
            onChange={setCategory} 
            isDarkMode={isDarkMode} 
            accentColor="purple" 
            borderColor={{ light: 'border-white', dark: 'border-[#a78bfa]' }} 
          />
      </div>

      {/* LOADING */}
      <div 
        style={{ 
            height: `${pullDistance}px`, 
            opacity: Math.min(pullDistance / 40, 1), 
            transition: isRefreshing ? 'height 0.3s ease' : 'height 0s' 
        }} 
        className="flex items-end justify-center overflow-hidden w-full will-change-transform"
      >
         <div className={`mb-4 flex items-center gap-3 px-5 py-2 rounded-full shadow-lg border transition-all transform duration-200 ${isDarkMode ? 'bg-zinc-800 border-purple-500/30 text-white' : 'bg-white border-purple-200 text-zinc-800'} ${pullDistance > 70 ? 'scale-110' : 'scale-100'}`}>
            {isRefreshing ? (
                <>
                    <Loader2 size={20} className="animate-spin text-purple-500" />
                    <span className="text-xs font-bold text-purple-500 animate-pulse">Atualizando...</span>
                </>
            ) : (
                <>
                    <div style={{ transform: `rotate(${pullDistance * 3}deg)` }} className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full text-purple-600 dark:text-purple-400">
                        <RefreshCw size={16} />
                    </div>
                    <span className={`text-xs font-bold transition-colors ${pullDistance > 70 ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {pullDistance > 70 ? 'Solte para atualizar' : 'Puxe para atualizar'}
                    </span>
                </>
            )}
         </div>
      </div>
      
     {/* LISTA DE CARDS */}
      <div className="flex flex-col gap-4">
        
        {isLoading && stableData.length === 0 && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <NewsCardSkeleton key={i} isDarkMode={isDarkMode} />
              ))}
            </>
        )}

        {!isLoading && uniqueNews.length === 0 && stableData.length > 0 && (
           <div className="text-center py-10 opacity-50">
             <p>Nenhuma notícia encontrada nesta categoria.</p>
           </div>
        )}
        
        {/* Usamos uniqueNews em vez de displayedNewsRaw */}
        {uniqueNews.map((news) => (
            <NewsCard 
              key={news.id}
              news={news}
              isSelected={selectedArticleId === news.id}
              isRead={readHistory?.includes(news.id)}
              isSaved={savedItems?.some((item) => item.id === news.id)}
              isDarkMode={isDarkMode}
              onClick={openArticle}
              onToggleSave={onToggleSave}
              isLiked={likedItems?.includes(news.id)}
              onToggleLike={onToggleLike}
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

        {/* Barra de Pesquisa */}
        <div className="relative w-8 h-32 flex items-center justify-center py-2">
            <div className={`absolute flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-300 w-32 
                ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white focus-within:border-red-500' : 'bg-zinc-100 border-zinc-200 text-zinc-800 focus-within:border-red-500'}
            `} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center' }}>
                <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider w-full placeholder:text-zinc-500" />
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

// --- FUNÇÃO DE IA: ANÁLISE COMPLETA (ABA AI) ---
const generateFullAnalysis = async (text, apiKey) => {
  if (!text || text.length < 100 || !apiKey) return null;

  // Limpa e corta para economizar tokens
  const cleanText = text.replace(/<[^>]*>?/gm, ' ').slice(0, 12000);

  const prompt = `
  Aja como um Analista de Inteligência. Analise o texto:
  GERE UM JSON ESTRITO (PT-BR):
  {
    "summaries": {
      "executive": "Resumo formal (3 parágrafos).",
      "tldr": "Resumo em 1 frase.",
      "eli5": "Explicação para criança de 5 anos.",
      "bullets": ["Ponto 1", "Ponto 2", "Ponto 3"]
    },
    "mindmap": {
      "center": "Tema Central",
      "nodes": ["A", "B", "C", "D"]
    },
    "timeline": [
      { "time": "Passado", "event": "Causa" },
      { "time": "Hoje", "event": "Fato" }
    ],
    "future": {
      "optimistic": "Melhor caso",
      "pessimistic": "Pior caso",
      "probable": "Realista"
    }
  }
  TEXTO: ${cleanText}
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

    const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text
        .replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro Full Analysis:", error);
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
  Identificar os 4 (QUATRO) maiores acontecimentos do momento e criar grupos.
  
  PARA CADA GRUPO, CRIE UM TÍTULO QUE SEJA UMA FRASE JORNALÍSTICA COMPLETA.
  - NÃO faça listas de palavras (ex: "Mercado, Dólar, Bolsa").
  - FAÇA uma frase explicativa (ex: "Dólar cai e Bolsa sobe com otimismo sobre juros nos EUA").
  - O título deve ser claro, direto e em Português do Brasil.
  
  RETORNE APENAS JSON:
  [
    {
      "ai_title": "Frase jornalística explicativa (Máx 12 palavras)",
      "representative_index": 0, (Índice da melhor imagem para capa)
      "related_indices": [0, 5, 8] (Pelo menos 2 índices que formam este grupo)
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
            representative_image: repImage,
            related_articles: uniqueArticles 
        };
    }).filter(c => c.related_articles.length > 0); 

    // Garante que retornamos no máximo 4, conforme pedido, caso a IA se empolgue
    return Array.isArray(hydratedJson) ? hydratedJson.slice(0, 4) : null;

  } catch (error) {
    console.error("Erro Smart Clustering:", error);
    return null;
  }
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
const generateTrendRadar = async (news, apiKey) => {
  if (!news || news.length === 0) return null;

  const context = news.slice(0, 40).map((n, index) => 
    `${index}|${n.title}|${n.summary ? n.summary.slice(0, 60) : ''}`
  ).join('\n');

  const prompt = `
  Identifique 6 Tópicos quentes. Retorne JSON:
  [ { "topic": "Nome", "score": 1-10, "hex": "#hex", "summary": "Fato..." } ]
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
    
    if (!response.ok || data.error) return null;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanText);

    if (Array.isArray(json)) return json;
    const possibleArray = Object.values(json).find(val => Array.isArray(val));
    if (possibleArray) return possibleArray;

    return []; 

  } catch (error) {
    console.warn("Erro Trend Radar:", error);
    return []; 
  }
};

// --- WIDGET: SMART DIGEST (DESIGN EDITORIAL PREMIUM) ---



// 1. Sub-componente do Mini Navegador (VERSÃO MAXIMIZADA)
const GlassBrowser = ({ article, onClose, isDarkMode }) => {
    
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

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
                onClick={onClose} 
            />

            {/* AQUI ESTÁ A MUDANÇA DE TAMANHO: w-[95vw] h-[90vh] */}
            <div className={`
                relative w-[95vw] h-[85vh] md:w-[800px] md:h-[90vh]
                rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col 
                transition-all transform scale-100 animate-in zoom-in-95 duration-300
                ${isDarkMode 
                    ? 'bg-zinc-900/95 border-white/10 shadow-purple-500/20' 
                    : 'bg-white/95 border-white/40 shadow-xl'}
                backdrop-blur-2xl
            `}>
                
                {/* Imagem de Capa (Hero) - Aumentei a altura também */}
                <div className="relative h-56 md:h-72 w-full flex-shrink-0">
                    <img 
                        src={article.img || article.logo} 
                        className="w-full h-full object-cover" 
                        onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white backdrop-blur-md border border-white/20 hover:bg-black/50 transition active:scale-90"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                        <img src={article.logo} className="w-6 h-6 rounded-full border border-white/50 bg-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest shadow-black drop-shadow-md">
                            {article.source}
                        </span>
                    </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-6 md:p-8 flex flex-col flex-1 overflow-y-auto">
                    <h2 className={`text-2xl md:text-3xl font-black leading-tight mb-4 font-serif ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {article.title}
                    </h2>
                    
                    <div className="flex-1">
                        <p className={`text-base md:text-lg leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {article.summary || "Toque abaixo para ler a matéria completa diretamente na fonte original."}
                        </p>
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

const SmartDigestWidget = ({ newsData, apiKey, isDarkMode, refreshTrigger }) => {
  const [digest, setDigest] = useState(null);
  const [status, setStatus] = useState('idle'); 
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [glassArticle, setGlassArticle] = useState(null);

  // MUDANÇA 1: Nome da chave e uso de SessionStorage
  const SESSION_KEY = 'newsos_current_session_digest';
  
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // 1. CARREGAR DADOS DA SESSÃO ATUAL
  useEffect(() => {
      // Tenta ler da memória temporária da sessão
      const savedData = sessionStorage.getItem(SESSION_KEY);
      
      if (savedData) {
          try {
              const parsed = JSON.parse(savedData);
              // Validade de 2 horas (para garantir que não fique velho demais)
              const now = Date.now();
              const isValidTime = parsed.timestamp && (now - parsed.timestamp < 2 * 60 * 60 * 1000);

              if (parsed && parsed.data && parsed.data.topics && isValidTime) {
                  setDigest(parsed.data);
                  setStatus('success');
              } else {
                  // Se for velho ou inválido, limpa
                  sessionStorage.removeItem(SESSION_KEY);
              }
          } catch (e) {
              console.error("Erro ao carregar Digest da sessão", e);
          }
      }
  }, []); // Roda apenas ao montar o componente (troca de aba)

  useEffect(() => {
      return () => cancelSpeech();
  }, []);

  const handleGenerate = async () => {
    if (!apiKey) {
        alert("Configure sua API Key nas configurações primeiro.");
        return;
    }
    setStatus('loading');
    
    // Pequeno delay para UX
    await new Promise(r => setTimeout(r, 800));

    const result = await generateBriefing(newsData, apiKey);
    
    if (result) {
        setDigest(result);
        setStatus('success');
        
        // MUDANÇA 2: Salva na SessionStorage (Morre ao fechar o app)
        // Adicionamos o timestamp para controlar a validade
        const sessionPayload = {
            timestamp: Date.now(),
            data: result
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        
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
      if (isSpeaking) { cancelSpeech(); return; }

      setIsSpeaking(true);
      const intro = `Briefing Executivo. ${digest.vibe_title}.`;
      const content = digest.topics.map(t => `${t.tag}. ${t.summary}`).join('. ');
      const finalText = `${intro} ${content}.`;

      const utterance = new SpeechSynthesisUtterance(finalText);
      utterance.lang = 'pt-BR'; 
      utterance.rate = 1.1; 
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
  };

  const toggleExpand = (index) => {
      setExpandedIndex(expandedIndex === index ? null : index);
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
        <div className={`relative overflow-hidden rounded-[2rem] p-8 border transition-all shadow-lg ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
           <div className="flex flex-col items-center text-center relative z-10">
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                 <Sparkles size={24} className="text-white animate-pulse" />
              </div>
              <h2 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Briefing Inteligente</h2>
              <p className={`text-sm mb-6 max-w-[260px] leading-relaxed opacity-70 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                A IA analisa {newsData?.length || 0} fatos e cria um resumo executivo para você.
              </p>
              <button onClick={handleGenerate} className={`group relative px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest overflow-hidden shadow-xl active:scale-95 transition-all ${isDarkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}>
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="flex items-center gap-2 relative z-10"><Zap size={14} fill="currentColor"/> Gerar Agora</span>
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="px-1 mb-6">
        <div className={`h-[350px] rounded-[2rem] flex flex-col items-center justify-center border relative overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
           <div className="w-16 h-16 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin mb-6" />
           <div className="text-center space-y-1 relative z-10">
               <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Redigindo Briefing...</p>
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
                <button onClick={handleGenerate} className="text-xs font-bold underline decoration-red-500 underline-offset-4 opacity-80 hover:opacity-100">Tentar Novamente</button>
            </div>
        </div>
      );
  }

  // --- ÁREA DE IMAGENS (COLLAGE) ---
  const topicImages = digest.topics.slice(0, 4).map(t => {
      const articleWithImg = t.articles?.find(a => a.img && a.img.length > 10);
      return articleWithImg ? articleWithImg.img : null;
  });

  return (
    <>
    <div className="px-1 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className={`
        relative p-0 overflow-hidden rounded-[2.5rem] shadow-2xl border transition-all
        ${isDarkMode 
            ? 'bg-zinc-950 border-white/10' 
            : 'bg-white border-white/40 shadow-indigo-500/10'}
      `}>
         
         {/* BANNER DE IMAGENS */}
         <div className="relative w-full h-32 flex">
             {topicImages.map((img, idx) => (
                 <div key={idx} className="flex-1 relative h-full overflow-hidden">
                     {img ? (
                         <img src={img} className="w-full h-full object-cover scale-110" />
                     ) : (
                         <div className={`w-full h-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                     )}
                     <div className={`absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent ${idx === topicImages.length - 1 ? 'to-transparent' : (isDarkMode ? 'to-zinc-950/50' : 'to-white/30')}`} />
                     <div className={`absolute inset-0 ${isDarkMode ? 'bg-indigo-900/20 mix-blend-overlay' : 'bg-indigo-500/10 mix-blend-overlay'}`} />
                 </div>
             ))}
             <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t ${isDarkMode ? 'from-zinc-950' : 'from-white'} to-transparent`} />
             
             <button 
                onClick={handlePlayBriefing}
                className="absolute bottom-3 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-full border border-white/20 shadow-lg active:scale-95 transition-transform"
             >
                {isSpeaking ? <Pause size={16} fill="white"/> : <Play size={16} fill="white" className="ml-0.5"/>}
             </button>
         </div>

         {/* CONTEÚDO EDITORIAL */}
         <div className="px-6 pb-8 relative z-10 -mt-2">
             
             <div className="flex flex-col items-start text-left mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2 flex items-center gap-2">
                    <Sparkles size={12} /> Briefing Executivo
                </span>
                <h2 className={`text-2xl md:text-3xl font-serif font-black leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {digest.vibe_title}
                </h2>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {digest.topics?.map((topic, i) => {
                    const isExpanded = expandedIndex === i;
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => toggleExpand(i)}
                            className={`
                                group relative p-5 rounded-2xl transition-all duration-300 cursor-pointer border
                                ${isDarkMode 
                                    ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800' 
                                    : 'bg-zinc-50 border-zinc-200 hover:bg-white'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${getTag3DStyle(i)}`}>
                                    {topic.tag}
                                </span>
                                <ChevronRight size={14} className={`opacity-30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                            
                            <p className={`text-sm font-medium leading-relaxed font-serif ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                {topic.summary}
                            </p>

                            {/* FONTES */}
                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-dashed border-zinc-500/20 animate-in slide-in-from-top-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Fontes Analisadas:</p>
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
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => e.target.style.display = 'none'}
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

             <div className="mt-6 flex justify-between items-center opacity-40">
                <span className="text-[10px] font-mono">Análise via Gemini 2.5</span>
                <button onClick={handleGenerate} className="p-2 hover:text-indigo-500 transition-colors" title="Atualizar Briefing"><RefreshCw size={14}/></button>
             </div>
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
    </>
  );
};
const generateHeuristicClusters = (news) => {
    if (!news || news.length < 5) return [];

    const clusters = {};
    const articlesUsed = new Set();

    // 1. Encontra palavras-chave importantes (substantivos) nos primeiros 30 títulos
    const keywordScores = {};
    const stopWords = new Set(['a', 'o', 'e', 'de', 'do', 'da', 'para', 'com', 'um', 'uma', 'os', 'as', 'que', 'em']);
    
    news.slice(0, 30).forEach(article => {
        const words = article.title.toLowerCase().replace(/[^a-zà-ú\s]/g, '').split(/\s+/);
        words.forEach(word => {
            if (word.length > 4 && !stopWords.has(word)) {
                keywordScores[word] = (keywordScores[word] || 0) + 1;
            }
        });
    });

    // 2. Pega as 5 palavras-chave mais frequentes
    const topKeywords = Object.keys(keywordScores).sort((a, b) => keywordScores[b] - keywordScores[a]).slice(0, 5);

    // 3. Monta os cards baseados nessas palavras-chave
    topKeywords.forEach(keyword => {
        // Encontra a primeira notícia sobre esse tema que ainda não foi usada
        const representativeArticle = news.find(article => 
            !articlesUsed.has(article.id) && article.title.toLowerCase().includes(keyword)
        );

        if (representativeArticle) {
            // Pega todas as outras fontes que falam sobre o mesmo tema
            const relatedArticles = news.filter(article => 
                article.title.toLowerCase().includes(keyword)
            );
            
            // Cria o "cluster falso"
            clusters[keyword] = {
                ai_title: representativeArticle.title,
                representative_image: representativeArticle.img,
                related_articles: relatedArticles.slice(0, 4) // Limita a 4 logos
            };
            
            // Marca como usadas
            relatedArticles.forEach(a => articlesUsed.add(a.id));
        }
    });

    return Object.values(clusters);
};



// --- WIDGET: CONTEXTO GLOBAL (V2 - SEM TÍTULO INTERNO) ---
const WhileYouWereAwayWidget = ({ news, openArticle, isDarkMode, apiKey, clusters, setClusters, onContextReady }) => {
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const heuristicClusters = useMemo(() => {
      if (clusters && clusters.length > 0) return [];
      return generateHeuristicClusters(news);
  }, [news, clusters]);

  const runAI = async () => {
      if (!apiKey) {
          alert("Configure sua API Key nas configurações primeiro.");
          return;
      }
      if (!news || news.length < 10) {
          alert("Aguarde o carregamento de mais notícias para uma análise completa.");
          return;
      }
      setLoading(true);
      setClusters(null); 
      await new Promise(r => setTimeout(r, 800));
      const result = await generateSmartClustering(news, apiKey, 300);
      if (result) {
          setClusters(result);
      } else {
          alert("A IA não encontrou correlações suficientes no momento. Tente novamente mais tarde.");
      }
      setLoading(false);
  };
  
  useEffect(() => {
    if (heuristicClusters && heuristicClusters.length > 0 && onContextReady) {
        onContextReady();
    }
  }, [heuristicClusters, onContextReady]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex !== activeIndex) setActiveIndex(newIndex);
    }
  };

  const getSentimentGlow = (sentiment) => {
      if (sentiment === 'positive') return 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]';
      if (sentiment === 'negative') return 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';
      return 'border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]';
  };
  
  const displayClusters = clusters && clusters.length > 0 ? clusters : heuristicClusters;

  if (loading) {
      return (
        <div className="relative w-full">
            <div className={`h-[480px] w-full flex flex-col items-center justify-center relative overflow-hidden ${isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-100/50'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent h-full w-full animate-[shimmer_2s_infinite] translate-y-[-100%]" />
                <div className="flex flex-col items-center gap-4 z-10">
                    <Loader2 size={48} className="animate-spin text-purple-500" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse opacity-60">Analisando 300 Fontes</span>
                </div>
            </div>
        </div>
      );
  }

  if (!displayClusters || displayClusters.length === 0) {
      return (
        <div className="relative w-full animate-pulse">
            <div className={`h-[480px] w-full rounded-b-[2.25rem] ${isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-200'}`}></div>
        </div>
      );
  }

  return (
    <div className="animate-in fade-in duration-1000">
        <div className="relative w-full">
            
            {/* CABEÇALHO MODIFICADO: Apenas o botão, alinhado à direita */}
            <div className="relative z-10 flex items-center justify-end mb-4 px-4 pt-4">
                <button 
                    onClick={runAI}
                    className={`
                        group relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider
                        transition-all duration-300 active:scale-95 shadow-lg
                        ${clusters ? 'bg-white/10 border border-white/10 text-zinc-300 hover:bg-white/20' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/30'}
                    `}
                >
                    {clusters ? (
                        <div className="flex items-center gap-2"><RefreshCw size={12} /><span>Atualizar</span></div>
                    ) : (
                        <div className="flex items-center gap-2"><Sparkles size={14} className="text-yellow-300" /><span>Ativar SmartNews</span></div>
                    )}
                </button>
            </div>

            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4 px-2"
            >
                {displayClusters.map((cluster, idx) => (
                    <div key={cluster.ai_title + idx} className="w-full flex-shrink-0 snap-center p-2">
                        <div className="group relative h-[420px] w-full rounded-[2.5rem] overflow-hidden cursor-default border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                            <img src={cluster.representative_image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900 to-purple-900" /> 
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                            <div className="absolute top-6 left-6"><div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg"><Globe size={14} className="text-blue-400" /><span className="text-white text-[10px] font-black uppercase tracking-[0.15em]">{cluster.related_articles.length} {cluster.related_articles.length > 1 ? 'Fontes' : 'Fonte'}</span></div></div>
                            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end">
                                <h2 className="text-3xl font-black text-white leading-tight mb-6 drop-shadow-lg tracking-tight">{cluster.ai_title}</h2>
                                <div className="flex flex-wrap items-center gap-4">
                                   {cluster.related_articles.map(article => (
                                       <button key={article.id} onClick={() => openArticle(article)} className={`relative w-12 h-12 rounded-full p-[2px] transition-all duration-300 hover:scale-125 hover:z-10 bg-black/40 backdrop-blur-sm border-2 ${getSentimentGlow(article.ai_sentiment)}`} title={`${article.source}: ${article.title}`}>
                                           <img src={article.logo} className="w-full h-full object-cover rounded-full" onError={(e) => e.target.style.display='none'} />
                                       </button>
                                   ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {displayClusters.length > 1 && (
              <div className="flex justify-center gap-2 mt-2 pb-4">
                  {displayClusters.map((_, idx) => (
                      <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${activeIndex === idx ? 'bg-indigo-500 w-8' : 'bg-zinc-700 w-2'}`} />
                  ))}
              </div>
            )}
        </div>
    </div>
  );
};






// ==========================================================
// FUNÇÃO DE IA: ANÁLISE DE MERCADO (VERSÃO CORRIGIDA)
// ==========================================================
const generateMarketAnalysis = async (news, apiKey) => {
  if (!apiKey) {
      alert("A chave de API para Análise de Mercado não está configurada.");
      return null;
  }
  
  // Reutilizamos a mesma lógica de filtro da heurística para dar à IA o melhor contexto
  const financialSources = ['Uol Economia', 'Investing', 'Istoé Dinheiro', 'Valor Econômico'];
  const marketNews = news.filter(n => financialSources.includes(n.source)).slice(0, 40); // Limita a 40 notícias para a IA

  if (marketNews.length < 3) {
      alert("Não há notícias financeiras suficientes para uma análise de IA no momento.");
      return null;
  }

  const context = marketNews.map(n => `ID: ${n.id} | TÍTULO: ${n.title}`).join('\n');
  
  const prompt = `
  Aja como um Analista Financeiro Sênior da Bloomberg. Analise as manchetes de mercado fornecidas.

  MANCHETES:
  ${context}

  SUAS TAREFAS:
  1.  **Sentimento Geral:** Determine o humor do mercado (Ex: "Otimista", "Pessimista", "Neutro com Viés de Alta", "Cauteloso").
  2.  **Resumo Executivo:** Escreva uma única frase, curta e impactante, que resuma a principal narrativa do mercado hoje.
  3.  **Principais Movimentos (Movers):** Identifique os 2 ou 3 ativos mais importantes mencionados. Para cada um:
      - Determine a tendência (up, down, neutral).
      - Explique o **motivo** do movimento em uma frase curta, baseando-se nas notícias.
      - Associe o ID da notícia mais relevante para aquele movimento.

  RETORNE APENAS O OBJETO JSON VÁLIDO COM ESTA ESTRUTURA ESTRITA:
  {
    "market_status": "Otimismo Cauteloso",
    "summary": "Juros futuros impulsionam otimismo na bolsa, mas dólar volátil gera cautela nos investidores.",
    "movers": [
      { 
        "asset": "Ibovespa", 
        "trend": "up", 
        "reason": "Reage positivamente à expectativa de corte na taxa Selic.",
        "news_id": "id_da_noticia_exato_sobre_ibov"
      },
      { 
        "asset": "Dólar", 
        "trend": "neutral", 
        "reason": "Opera com instabilidade aguardando dados de inflação dos EUA.",
        "news_id": "id_da_noticia_exato_sobre_dolar"
      }
    ]
  }
  `;

  try {
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();



    // --- FUNÇÃO DE IA: ANÁLISE COMPLETA 360º (1 Chamada = Tudo) ---
const generateFullAnalysis = async (text, apiKey) => {
  if (!text || text.length < 100 || !apiKey) return null;

  // Limpa e corta para não estourar tokens desnecessariamente
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
      "center": "O tema central (2 palavras)",
      "nodes": ["Conceito A", "Pessoa B", "Consequência C", "Causa D"] (Máximo 4 nós conectados)
    },
    "timeline": [
      { "time": "Passado", "event": "O que causou isso?" },
      { "time": "Ontem/Recente", "event": "O gatilho recente" },
      { "time": "Hoje", "event": "O fato da notícia" }
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
    if (!response.ok || data.error) throw new Error(data.error?.message || "Erro API");

    const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text
        .replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro Full Analysis:", error);
    return null;
  }
};




    // ==========================================================
    // CORREÇÃO FINAL: Sintaxe correta para acessar os arrays
    // ==========================================================
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("Resposta da IA de mercado vazia.");
    }
    
    // A limpeza do JSON já estava correta
    const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    
    // Hidratação: Adiciona o objeto de notícia completo aos movers
    if (json.movers) {
        json.movers = json.movers.map(mover => {
            const article = news.find(n => n.id === mover.news_id);
            return { ...mover, article }; 
        }).filter(mover => mover.article);
    }

    return json;

  } catch (error) {
    console.error("Erro na Análise de Mercado IA:", error);
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




// --- COMPONENTE TREND RADAR (PERSISTENTE + MANUAL) ---
const TrendRadar = ({ newsData, apiKey, isDarkMode }) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Chave para salvar no celular
  const STORAGE_KEY = 'newsos_trend_radar_data_v1';

  // 1. CARREGAR DADOS SALVOS AO INICIAR
  useEffect(() => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
          try {
              const parsed = JSON.parse(savedData);
              // Verifica se tem dados válidos
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setTrends(parsed);
                  setHasGenerated(true);
              }
          } catch (e) {
              console.error("Erro ao ler Trend Radar salvo", e);
          }
      }
  }, []); // Roda apenas uma vez na montagem

  // --- LÓGICA DE ESTILO FÍSICO ---
  const getTrendStyle = (score) => {
      if (score >= 9) return { color: '#ef4444', bottomHeight: '4px', shadow: '0 0 15px rgba(239, 68, 68, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)', scale: 'scale(1.05)' };
      if (score >= 7) return { color: '#f97316', bottomHeight: '3px', shadow: '0 0 10px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)', scale: 'scale(1.02)' };
      if (score >= 5) return { color: '#10b981', bottomHeight: '2px', shadow: 'inset 0 1px 0 rgba(255,255,255,0.2)', scale: 'scale(1)' };
      return { color: '#3b82f6', bottomHeight: '2px', shadow: 'none', scale: 'scale(0.98)' };
  };

  const runTrendAnalysis = async () => {
    if (!apiKey) {
        alert("Configure sua API Key primeiro.");
        return;
    }
    if (!newsData || newsData.length === 0) {
        alert("Aguarde as notícias carregarem.");
        return;
    }

    setLoading(true);
    setActiveIndex(null);
    
    // Pequeno delay para UX
    await new Promise(r => setTimeout(r, 600)); 
    
    // Chama a função otimizada (Custo Zero)
    const data = await generateTrendRadar(newsData, apiKey);
    
    if (data && Array.isArray(data) && data.length > 0) {
        setTrends(data);
        setHasGenerated(true);
        // 2. SALVAR NO LOCALSTORAGE ASSIM QUE A IA RESPONDER
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
        alert("A IA não identificou tendências claras agora. Tente mais tarde.");
    }
    setLoading(false);
  };

  const handleToggle = (idx) => {
      setActiveIndex(activeIndex === idx ? null : idx);
  };

  const activeItem = activeIndex !== null && trends ? trends[activeIndex] : null;

  // RENDERIZAÇÃO
  return (
    <div className="relative z-[50] mb-6 animate-in fade-in duration-1000 slide-in-from-right-8 px-2">
      
      {/* Cabeçalho / Botão de Ativação */}
      <div className="flex items-center justify-between mb-4 px-2">
         <div className={`flex items-center gap-2 transition-all duration-500 ${loading ? 'opacity-100' : 'opacity-70'}`}>
             <Activity size={14} className="text-orange-500" />
             <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                 Trend Radar AI
             </span>
         </div>

         {/* BOTÃO PARA GERAR (SÓ GASTA SE CLICAR) */}
         <button 
            onClick={runTrendAnalysis}
            disabled={loading}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all active:scale-95
                ${hasGenerated 
                    ? (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-200 text-zinc-600 hover:text-black') 
                    : 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'}
            `}
         >
            {loading ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
            {loading ? 'Analisando...' : (hasGenerated ? 'Atualizar Radar' : 'Ativar Radar')}
         </button>
      </div>

      {loading ? (
         <div className="flex justify-center gap-4 overflow-hidden px-2 opacity-50 pb-8">
            {[1,2,3,4].map(i => (
                <div key={i} className={`h-9 w-24 rounded-full animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            ))}
         </div>
      ) : (
         <div className="flex flex-col w-full">
             
             {/* SÓ MOSTRA SE TIVER DADOS GERADOS */}
             {trends && (
                 <>
                     {/* 1. LISTA DE PÍLULAS */}
                     <div className="flex justify-start md:justify-center items-center gap-4 overflow-x-auto scrollbar-hide px-4 pt-2 pb-8 snap-x relative z-20">
                        {trends.map((item, idx) => {
                            const style = getTrendStyle(item.score);
                            const isActive = activeIndex === idx;
                            
                            return (
                                <div key={idx} className="relative flex-shrink-0 snap-center flex flex-col items-center">
                                    <button 
                                        onClick={() => handleToggle(idx)}
                                        className={`
                                            relative group cursor-pointer transition-all duration-200 flex items-center gap-2 rounded-full
                                            ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-800'}
                                        `}
                                        style={{ 
                                            borderColor: style.color,
                                            borderStyle: 'solid',
                                            borderWidth: '1px', 
                                            borderBottomWidth: isActive ? '1px' : style.bottomHeight,
                                            boxShadow: style.shadow,
                                            padding: '8px 20px',
                                            transform: isActive ? `translateY(${parseInt(style.bottomHeight) - 1}px)` : 'translateY(0)',
                                        }}
                                    >
                                        {item.score >= 9 && <span className="text-[10px] animate-bounce">🔥</span>}
                                        <span className="text-xs font-bold whitespace-nowrap tracking-tight">{item.topic}</span>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.color }} />
                                    </button>
                                    {isActive && (
                                        <div 
                                            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] animate-in fade-in zoom-in duration-300 z-30"
                                            style={{ borderBottomColor: style.color }}
                                        />
                                    )}
                                </div>
                            )
                        })}
                     </div>

                     {/* 2. ÁREA DE DETALHES */}
                     <div className={`relative w-full px-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden ${activeItem ? 'max-h-[200px] opacity-100 mt-0' : 'max-h-0 opacity-0 mt-0'}`}>
                        {activeItem && (
                            <div 
                                className={`w-full md:max-w-md mx-auto p-5 rounded-3xl border-2 shadow-2xl backdrop-blur-xl flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300 ${isDarkMode ? 'bg-zinc-950/95 text-zinc-200' : 'bg-white/95 text-zinc-800'}`}
                                style={{ borderColor: getTrendStyle(activeItem.score).color, boxShadow: `0 10px 40px -10px ${getTrendStyle(activeItem.score).color}20` }}
                            >
                                <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: getTrendStyle(activeItem.score).color }}>Impacto: {activeItem.score}/10</span>
                                    <div className="h-1.5 w-20 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${activeItem.score * 10}%`, backgroundColor: getTrendStyle(activeItem.score).color }} /></div>
                                </div>
                                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white' : 'text-black'}`}>{activeItem.summary}</p>
                            </div>
                        )}
                     </div>
                 </>
             )}
         </div>
      )}
    </div>
  );
};



// Substitua o seu componente HappeningTab inteiro por esta versão aprimorada

function HappeningTab({ openArticle, openStory, isDarkMode, newsData, onRefresh, storiesToDisplay, onMarkAsSeen, apiKey, savedClusters, setSavedClusters  }) {
  const [isPodcastOpen, setIsPodcastOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);



  // --- NOVO ESTADO ---
  // Este estado será atualizado pelo componente filho (WhileYouWereAwayWidget)
  const [isContextLoading, setIsContextLoading] = useState(true);

  const handleTouchStart = (e) => {
    if (window.scrollY <= 5 && !isRefreshing) setStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e) => {
    if (startY === 0 || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0 && window.scrollY <= 5) {
      if (e.cancelable) e.preventDefault();
      const newPull = Math.min(diff * 0.5, 220);
      setPullDistance(newPull);
    }
  };
  const handleTouchEnd = async () => {
    if (pullDistance > 90) {
      setIsRefreshing(true);
      setPullDistance(120);
      setRefreshTrigger(prev => prev + 1);
      if (onRefresh) await onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  const trending = [
    { id: 1, title: 'IA Generativa: O novo marco regulatório começa a valer hoje na Europa', source: 'Politico', time: '15m', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80' },
    { id: 2, title: 'Final da Champions: Real Madrid e City se enfrentam em jogo histórico', source: 'ESPN', time: '45m', img: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=600&q=80' },
    { id: 3, title: 'Bitcoin atinge nova máxima histórica com aprovação de ETF', source: 'Bloomberg', time: '2h', img: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80' }
  ];



  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 min-h-screen touch-pan-y relative" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      
      <style jsx="true">{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        /* Animação de texto cintilante */
        @keyframes shimmer-text {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
        }
        .animate-shimmer-text {
            background-size: 200% auto;
            animation: shimmer-text 3s linear infinite;
        }
      `}</style>
      
      {/* Indicador de Loading (Pull to refresh) */}
      <div className="fixed left-0 right-0 z-[1000] flex justify-center pointer-events-none" style={{ top: '35%', opacity: Math.min(pullDistance / 80, 1), transform: `scale(${Math.min(pullDistance / 100, 1.2)})`, display: pullDistance > 0 || isRefreshing ? 'flex' : 'none' }}>
         <div className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] shadow-2xl border ${isDarkMode ? 'bg-black/5 border-white/10 shadow-purple-500/20' : 'bg-white/90 border-white shadow-xl text-zinc-900'}`}>
            {isRefreshing ? <Loader2 size={42} className="animate-spin text-purple-500" /> : <RefreshCw size={42} className="text-purple-500 transition-transform" style={{ transform: `rotate(${pullDistance * 3}deg)` }}/>}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{isRefreshing ? 'Atualizando Feed' : 'Solte para Atualizar'}</span>
         </div>
      </div>
      
      {/* Área de Stories */}
      <div className="flex items-center gap-4 px-2 pt-2 relative z-10">
        <div className="flex-1 min-w-0"> 
            <div className="flex space-x-5 overflow-x-auto pb-2 scrollbar-hide snap-x items-center min-h-[100px]">
                {storiesToDisplay && storiesToDisplay.length === 0 && <div className="flex flex-col justify-center h-full pl-2 opacity-50"><span className="text-[10px] font-bold uppercase tracking-widest">Nada de novo por aqui</span><span className="text-[9px]">Puxe para atualizar o feed</span></div>}
                {storiesToDisplay && storiesToDisplay.map((story) => <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group flex-shrink-0"><div className="relative w-[76px] h-[76px] rounded-full p-[3px] transition-all duration-500 bg-gradient-to-tr from-rose-600 via-pink-500 to-orange-400 shadow-lg shadow-rose-500/20"><div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950 bg-zinc-900' : 'border-white bg-zinc-200'}`}><img src={story.avatar} className="w-full h-full object-cover" alt="" /></div></div><span className={`text-[10px] font-semibold truncate max-w-[76px] text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{story.name}</span></div>)}
            </div>
        </div>
        <div className="flex-shrink-0 pl-2 border-l border-dashed border-zinc-300 dark:border-zinc-700">
            <button onClick={() => setIsPodcastOpen(true)} className="group relative flex flex-col items-center justify-center gap-1.5 w-20 transition-all hover:scale-105 active:scale-95"><div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20"><Sparkles size={14} className="absolute top-1 right-1 text-white/60 animate-pulse" /><Headphones size={20} className="text-white" /></div><div className="text-center leading-none"><span className={`block text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>PodNews</span><span className="text-[8px] text-purple-500 font-bold">07:00</span></div></button>
        </div>
      </div>
      
      <TrendRadar newsData={newsData} apiKey={apiKey} isDarkMode={isDarkMode} refreshTrigger={refreshTrigger} />

  {/* --- SEÇÃO DO CONTEXTO GLOBAL ATUALIZADA COM LAYOUT CORRIGIDO --- */}
      <div className="space-y-4 px-2">
        {/* TÍTULO PRINCIPAL DA SEÇÃO */}
        <div className="flex items-center gap-3 px-4">
            <div className={`p-2 rounded-xl shadow-lg ${isDarkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-indigo-600 shadow-indigo-200'}`}>
                <Sparkles size={18} />
            </div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-shimmer-text">
                As principais notícias, em múltiplos ângulos.
            </h3>
        </div>

        {/* CONTORNO AURA ENVOLVENDO O WIDGET */}
        <div 
          className="rounded-[2.5rem] p-1" // O padding cria a borda
          style={{ background: 'linear-gradient(135deg, #4f46e5, #a855f7, #ec4899, #f97316)' }}
        >
          <div className={`rounded-[2.25rem] overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
            <WhileYouWereAwayWidget 
              news={newsData} 
              openArticle={openArticle} 
              isDarkMode={isDarkMode} 
              apiKey={apiKey} 
              clusters={savedClusters}
              setClusters={setSavedClusters}
              onContextReady={() => {}} // onContextReady pode ser ajustado se necessário
            />
          </div>
        </div>
      </div>

      <SmartDigestWidget 
          newsData={newsData} 
          apiKey={apiKey} 
          isDarkMode={isDarkMode} 
          refreshTrigger={refreshTrigger} 
      />
      
     {/* --- NOVA SEÇÃO DE MERCADOS --- */}
      <div className="space-y-4 px-2">
          {/* TÍTULO DA SEÇÃO */}
          <div className="flex items-center gap-3 px-4">
              <div className={`p-2 rounded-xl shadow-lg ${isDarkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-indigo-600 shadow-indigo-200'}`}>
                  <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-shimmer-text">
                  Mercados Hoje
              </h3>
          </div>

          {/* CONTORNO ROXO ENVOLVENDO O WIDGET */}
          <div className="rounded-[1.75rem] p-1 bg-gradient-to-br from-purple-500/50 via-purple-500/20 to-transparent">
            <div className={`rounded-[1.5rem] p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
              <MarketPulseWidget 
                newsData={newsData}
                apiKey={apiKey} 
                isDarkMode={isDarkMode}
                openArticle={openArticle}
              />
            </div>
          </div>
      </div>

      {isPodcastOpen && <PodNewsModal onClose={() => setIsPodcastOpen(false)} isDarkMode={isDarkMode} />}
    </div>
  );
}



function BancaTab({ openOutlet, isDarkMode }) {
  const [category, setCategory] = useState('Tudo');
  const displayedItems = category === 'Tudo' ? BANCA_ITEMS : BANCA_ITEMS.filter(i => i.category === category);

  return (
    <div className="pt-2 pb-24 pr-16 animate-in zoom-in-95 duration-500 min-h-screen">
      <div className="fixed right-0 top-[25%] z-30 flex flex-col gap-1 items-end pointer-events-none">
          {BANCA_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={`pointer-events-auto relative flex items-center justify-center w-10 py-6 rounded-l-xl rounded-r-none shadow-lg border-y border-l border-r-0 transition-all duration-300 ${category === cat ? 'bg-purple-500 text-white border-white-400 translate-x-0 w-12' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border-zinc-800 translate-x-2 hover:translate-x-0' : 'bg-zinc-200 text-zinc-400 border-zinc-300 translate-x-2 hover:translate-x-0')}`}>
                  <span className="text-[12px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>{cat}</span>
              </button>
          ))}
      </div>
      <h2 className={`text-xl font-bold mb-6 px-2 mt-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}><LayoutGrid size={20} className="text-emerald-600"/> Banca de Jornais</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2">
        {displayedItems.map((item) => (
          <div key={item.id} onClick={() => openOutlet(item)} className={`relative aspect-[3/4] rounded-2xl flex flex-col cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group ${item.color}`}>
            <div className="p-4 flex justify-center border-b border-white/20 relative z-20 bg-black/10 backdrop-blur-sm"><span className={`font-black tracking-tighter text-2xl uppercase ${item.id === 3 || item.id === 4 ? 'text-black' : 'text-white'}`}>{item.logo}</span></div>
            <div className="flex-1 relative p-4 flex flex-col justify-end"><h3 className={`font-serif font-bold leading-tight text-lg ${item.id === 3 || item.id === 4 ? 'text-black' : 'text-white'}`}>{item.headline}</h3></div>
          </div>
        ))}
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
        w-14 h-9 /* Um pouco maior para a aura ter espaço */
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

// --- COMPONENTE: PLAYER GLOBAL (YOUTUBE EMBED + MP3) ---
const GlobalAudioPlayer = ({ track, onClose, isDarkMode }) => {
  const audioRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isYoutube, setIsYoutube] = useState(false);

  // Extrai ID do YouTube de forma robusta
  const ytId = useMemo(() => {
      if (!track) return null;
      // Suporta link normal, encurtado, shorts, embed
      const match = track.link?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return track.videoId || (match ? match[1] : null);
  }, [track]);

  useEffect(() => {
    if (!track) return;

    // Reset
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    if (ytId) {
        setIsYoutube(true);
        // YouTube não precisa de "load()" manual aqui, o iframe carrega sozinho
    } else {
        setIsYoutube(false);
        if (audioRef.current) {
            audioRef.current.src = track.link;
            audioRef.current.load();
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log("Autoplay áudio bloqueado", e));
        }
    }
  }, [track, ytId]);

  // Sincronização de Tempo para YouTube (Simulado visualmente)
  useEffect(() => {
      let interval = null;
      if (isYoutube && isPlaying) {
          interval = setInterval(() => {
              setCurrentTime(prev => prev + 0.5);
              if (duration > 0) setProgress((currentTime / duration) * 100);
          }, 500);
      }
      return () => clearInterval(interval);
  }, [isYoutube, isPlaying, currentTime, duration]);

  // Métodos de Áudio Nativo
  const handleNativeTimeUpdate = () => {
      if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          if (audioRef.current.duration) {
              setDuration(audioRef.current.duration);
              setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
          }
      }
  };

  const togglePlay = () => {
      if (isYoutube) {
          // No modo Iframe simples, o botão de play/pause externo é difícil de sincronizar 
          // sem a API pesada do Google. 
          // SOLUÇÃO UX: O usuário clica no vídeo para pausar/tocar.
          // O botão aqui vira apenas um indicador visual ou "Mute".
          setIsPlaying(!isPlaying); 
      } else {
          if (audioRef.current) {
              if (isPlaying) audioRef.current.pause();
              else audioRef.current.play();
              setIsPlaying(!isPlaying);
          }
      }
  };

  const formatTime = (t) => {
      if (!t || isNaN(t)) return "0:00";
      const min = Math.floor(t / 60);
      const sec = Math.floor(t % 60);
      return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  if (!track) return null;

  return (
    <div className={`fixed bottom-24 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[99999] rounded-2xl p-4 shadow-2xl backdrop-blur-xl border border-white/10 animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-zinc-900/95 text-white' : 'bg-white/95 text-zinc-900'}`}>
        
        {/* ENGINE MP3 (Nativo) */}
        {!isYoutube && (
            <audio 
                ref={audioRef} 
                onTimeUpdate={handleNativeTimeUpdate} 
                onLoadedMetadata={(e) => setDuration(e.target.duration)} 
                onEnded={() => setIsPlaying(false)}
                playsInline 
            />
        )}
        
        {/* BARRA DE PROGRESSO (Visual apenas no YouTube) */}
        <div className="absolute top-0 left-4 right-4 -mt-1.5 h-4 flex items-center z-20">
             <div className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
             </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
            
            {/* --- AQUI FICA O VÍDEO --- */}
            <div className="w-20 h-14 rounded-lg bg-black flex-shrink-0 overflow-hidden relative shadow-md border border-white/10">
                {isYoutube ? (
                    // IFRAME DO YOUTUBE REAL
                    <iframe
                        width="100%"
                        height="100%"
                        // playsinline=1 é OBRIGATÓRIO para não ir para fullscreen no iOS
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&playsinline=1&controls=0&modestbranding=1&rel=0`}
                        title="YouTube Player"
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        style={{ pointerEvents: 'auto' }} // Garante que o toque funcione
                    />
                ) : (
                    // Capa para Podcast Normal
                    <img src={track.cover} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                )}
            </div>
            
            {/* INFO */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold leading-tight truncate">{track.title}</h4>
                <p className="text-[10px] opacity-60 truncate flex items-center gap-1 mt-1">
                    {isYoutube ? (
                        <span className="text-red-500 font-bold flex items-center gap-1"><Youtube size={10}/> YouTube</span>
                    ) : (
                        <span className="text-blue-500 font-bold flex items-center gap-1"><Mic size={10}/> Podcast</span>
                    )}
                    <span>• {isYoutube ? "Ao Vivo / Tocando" : `${formatTime(currentTime)} / ${formatTime(duration)}`}</span>
                </p>
            </div>

            {/* CONTROLES */}
            <div className="flex items-center gap-3">
                {!isYoutube && (
                    <button onClick={togglePlay} className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg bg-orange-500 hover:scale-105 active:scale-95 transition">
                        {isPlaying ? <Pause size={18} fill="white"/> : <Play size={18} fill="white" className="ml-1"/>}
                    </button>
                )}
                
                {isYoutube && (
                    <div className="text-[9px] text-zinc-500 font-bold uppercase w-16 text-right leading-tight">
                        Toque no vídeo para pausar
                    </div>
                )}
                
                <button onClick={() => { setIsPlaying(false); onClose(); }} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500"><X size={20} /></button>
            </div>
        </div>
    </div>
  );
};


// --- COMPONENTE: SPLASH SCREEN (LOGO + NOME COM AURA) ---
const SplashScreen = ({ onFinish }) => {
  const [step, setStep] = useState(0); // 0: Init, 1: Converge, 2: Explode N + Texto, 3: FadeOut

  useEffect(() => {
    // Sequência de Animação
    const t1 = setTimeout(() => setStep(1), 100);  // Entrar ícones
    const t2 = setTimeout(() => setStep(2), 1200); // Convergir, Revelar N e Texto
    const t3 = setTimeout(() => setStep(3), 2500); // Fade Out da tela
    const t4 = setTimeout(onFinish, 3000);         // Desmontar

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onFinish]);

  const icons = [
    { Icon: Rss, color: 'text-blue-500', pos: '-translate-x-12 -translate-y-12' },
    { Icon: Youtube, color: 'text-red-500', pos: 'translate-x-12 -translate-y-12' },
    { Icon: Mic, color: 'text-orange-500', pos: '-translate-x-12 translate-y-12' },
    { Icon: Mail, color: 'text-purple-500', pos: 'translate-x-12 translate-y-12' },
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

      {/* CONTAINER CENTRAL (LOGO + TEXTO) */}
      <div className="flex flex-col items-center justify-center z-20">
        
        {/* ÁREA DO LOGO */}
        <div className="relative w-120 h-120 flex items-center justify-center mb-2">
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

            {/* O LOGO "N" */}
            <div 
            className={`
                relative z-20 flex items-center justify-center
                transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${step >= 2 ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-180'}
            `}
            >
            <div className={`absolute inset-0 bg-white/30 blur-2xl rounded-full ${step >= 2 ? 'animate-ping' : ''}`} />
            
            <div className="w-24 h-24 bg-gradient-to-br from-white via-zinc-200 to-zinc-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] border border-white/20">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-black to-zinc-800 tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>
                    N
                </span>
            </div>
            </div>
        </div>

        {/* --- O NOME "NewsOS" (NOVO CÓDIGO) --- */}
        <div className={`
            transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-100
            ${step >= 2 ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}
        `}>
            <h1 className="text-10xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]" style={{ fontFamily: 'Inter, sans-serif' }}>
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



const FEED_CACHE_PREFIX = 'newsos_cache_v1_';





// --- COMPONENTE PRINCIPAL (V14 - COM PERSISTÊNCIA E FETCH FEEDS INTEGRADO) ---
export default function NewsOS_V12() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('happening'); 
  const [globalClusters, setGlobalClusters] = useState(null); 
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null); 
  const [selectedStory, setSelectedStory] = useState(null);
  const navTimerRef = useRef(null); 
  
  // --- ESTADOS DE DADOS (Iniciam vazios e são preenchidos pelo Load) ---
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [apiKey, setApiKey] = useState('');
  const [readerApiKey, setReaderApiKey] = useState(''); // Chave 2 (Leitura - NOVA)
  
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

  // --- AUTENTICAÇÃO E SYNC ---
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false); 



const handleHappeningRefresh = async () => {
    // Passamos TRUE para dizer: "Ignore a RAM, ignore o Disco, vá no Supabase agora!"
    await fetchFeeds(true); 
};

const handleStoryNavigation = (direction) => {
    // AQUI, use 'allAvailableStories'
    if (!selectedStory || !allAvailableStories) return;

    const currentIndex = allAvailableStories.findIndex(s => s.id === selectedStory.id);
    if (currentIndex === -1) return;

    if (direction === 'next') {
        const nextIndex = currentIndex + 1;
        if (nextIndex < allAvailableStories.length) {
            setSelectedStory(allAvailableStories[nextIndex]);
        } else {
            closeStory();
        }
    } else if (direction === 'prev') {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            setSelectedStory(allAvailableStories[prevIndex]);
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
                  // Tenta ler como JSON (formato novo com 2 chaves)
                  const parsedKeys = JSON.parse(data.api_key);
                  if (typeof parsedKeys === 'object') {
                      setApiKey(parsedKeys.feed || '');
                      setReaderApiKey(parsedKeys.reader || '');
                  } else {
                      // Se não for objeto, é o formato antigo (string simples)
                      setApiKey(data.api_key);
                  }
              } catch (e) {
                  // Se der erro no parse, é string antiga
                  setApiKey(data.api_key);
              }
          }
          if (data.is_dark_mode !== null) setIsDarkMode(data.is_dark_mode);
          if (data.seen_story_ids) setSeenStoryIds(data.seen_story_ids);
          
          // --- NOVO: Carrega o histórico de horários corrigidos ---
          if (data.article_history) setArticleHistory(data.article_history);
      } else if (!error) {
          // Se não tem dados, cria a primeira entrada
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
              api_key: JSON.stringify({ 
                  feed: apiKey, 
                  reader: readerApiKey 
              }),
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
      }, 2000);

      return () => clearTimeout(timer);
  }, [user, userFeeds, savedItems, readHistory, likedItems, apiKey, isDarkMode, seenStoryIds, articleHistory]);


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
        if (!feed.url) return;

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
            const isLegacySource = feed.url.includes('uol.com.br') || feed.url.includes('folha.uol.com.br');

            try {
                if (isLegacySource) {
                    // Proxy Gratuito
                    const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(feed.url);
                    const res = await fetch(proxyUrl);
                    if (!res.ok) throw new Error(`Proxy status: ${res.status}`);
                    const buffer = await res.arrayBuffer();
                    const decoder = new TextDecoder('iso-8859-1'); 
                    const parsedData = parseXMLToNewsItems(decoder.decode(buffer), feed.name, feed.id);
                    feedItems = parsedData.items;
                    detectedXmlTitle = parsedData.realTitle; 
                    if (feed.url.includes('folha')) feedLogo = "https://www.google.com/s2/favicons?domain=folha.uol.com.br&sz=128";
                    else feedLogo = "https://www.google.com/s2/favicons?domain=www.uol.com.br&sz=128";

                } else {
                    // Supabase (Pago)
                    const { data, error } = await supabase.functions.invoke('parse-feed', { body: { url: feed.url } });
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
            
            // 2. Lógica para YouTube (Avatar Colorido se não tiver imagem)
            else if (isFeedYoutube && !finalLogo) {
                finalLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentFeedTitle)}&background=ff0000&color=fff&size=128&bold=true`;
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

    // --- DETECÇÃO DE YOUTUBE / VÍDEO (Mantém essa lógica separada) ---
    const videoId =
        article.videoId ||
        url.match(
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        )?.[2];

    const isYoutube = !!videoId;
    const isPodcastVideo =
        article.category === 'Podcast' && article.type === 'video';

    // 1. Se for YouTube ou Vídeo de Podcast -> Abre no Player InAppBrowser (Para tocar vídeo em tela cheia)
    if (isYoutube || isPodcastVideo) {
        const youtubeUrl = videoId 
            ? `https://www.youtube.com/watch?v=${videoId}` 
            : url;

        const options = 'location=no,toolbar=yes,toolbarcolor=#000000,hidenavigationbuttons=yes,hideurlbar=yes,fullscreen=yes';
        InAppBrowser.create(youtubeUrl, '_blank', options);
        return;
    }

    // 2. TODO O RESTO (UOL, Investing, G1, etc) -> ABRE NO PAINEL INTERNO (ArticlePanel)
    // Isso é essencial para que a IA consiga ler o texto amanhã.
    setSelectedArticle(article);

    if (article.id && !readHistory.includes(article.id)) {
        setReadHistory(prev => [...prev, article.id]);
    }
  };






  




  const closeArticle = useCallback(() => {
      setSelectedArticle(null);
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
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
  }, [activeTab]);



  // Adicione este bloco de código dentro de NewsOS_V12, antes do `return (`

const storiesForHappeningTab = useMemo(() => {
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

            // A lógica de filtro permanece AQUI
            if (seenStoryIds.includes(item.id)) {
                continue;
            }

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
}, [realNews, seenStoryIds]);


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

  return (
    <div className={`min-h-[100dvh] font-sans overflow-hidden selection:bg-blue-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 text-zinc-100' : 'bg-slate-100 text-zinc-900'}`}>      
      {/* --- SPLASH SCREEN --- */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div className={`transition-all duration-500 transform h-[100dvh] flex flex-col ${isMainViewReceded ? `scale-[0.9] pointer-events-none` : 'scale-100 opacity-100'}`}>
         
          <HeaderDashboard 
             isDarkMode={isDarkMode} 
             onOpenSettings={() => setIsSettingsOpen(true)}
             activeTab={activeTab}
             isLoading={isLoadingFeeds}
             selectedSource={sourceFilter}
          />

          <main ref={mainRef} className="flex-1 overflow-y-auto pb-40 px-4 md:px-6 scrollbar-hide pt-2">
            
            {activeTab === 'happening' && (
                <HappeningTab 
                    openArticle={handleOpenArticle} 
        openStory={setSelectedStory} 
        isDarkMode={isDarkMode} 
        newsData={realNews} // Garanta que esta linha está presente
        onRefresh={handleHappeningRefresh}
        
        onMarkAsSeen={markStoryAsSeen}
        apiKey={apiKey}
        storiesToDisplay={storiesForHappeningTab}
        savedClusters={globalClusters}
                    setSavedClusters={setGlobalClusters}
                    
                />
            )}

            {activeTab === 'podcast' && (
                <PodcastTab 
                    isDarkMode={isDarkMode} 
                    podcastsData={realPodcasts} 
                    isLoading={isLoadingFeeds}
                    savedItems={savedItems}
                    onToggleSave={handleToggleSave}
                    onPlayAudio={(pod) => {
                        // MUDANÇA: NÃO abrimos mais o Browser.open.
                        // Mandamos TUDO para o Player Interno (GlobalAudioPlayer).
                        // O Player Interno saberá lidar com o YouTube.
                        
                        handleOpenArticle(null); // Garante que fecha modais de texto
                        setPlayingAudio(pod);    // Abre a barra inferior
                    }}
                />
            )}
            
            {activeTab === 'feed' && (
                <FeedTab 
                    openArticle={handleOpenArticle} 
                    isDarkMode={isDarkMode} 
                    selectedArticleId={selectedArticle?.id}
                    savedItems={savedItems}
                    onToggleSave={handleToggleSave}
                    readHistory={readHistory}
                    newsData={realNews} 
                    isLoading={isLoadingFeeds}
                    onPlayVideo={handleOpenArticle} 
                    sourceFilter={sourceFilter}
                    setSourceFilter={setSourceFilter}
                    likedItems={likedItems}
                    onToggleLike={handleToggleLike}
                />
            )}
            
            {activeTab === 'banca' && <BancaTab openOutlet={setSelectedOutlet} isDarkMode={isDarkMode} />}
            
            {activeTab === 'youtube' && (
                <YouTubeTab 
                    openStory={setSelectedStory} 
                    savedItems={savedItems} 
                    onToggleSave={handleToggleSave} 
                    isDarkMode={isDarkMode} 
                    realVideos={realVideos} 
                    isLoading={isLoadingFeeds} 
                    onPlayVideo={handleOpenArticle} 
                    seenStoryIds={seenStoryIds}
                    onMarkAsSeen={markStoryAsSeen}
                    channelFilter={youtubeChannelFilter}
                    setChannelFilter={setYoutubeChannelFilter}
                />
            )}

            {activeTab === 'saved' && (
                <SavedTab 
                    isDarkMode={isDarkMode} 
                    openArticle={handleOpenArticle} 
                    items={savedItems} 
                    onRemoveItem={handleRemoveSavedItem} 
                    onPlayVideo={handleOpenArticle} 
                />
            )}

            {activeTab === 'newsletter' && <NewsletterTab openArticle={handleOpenArticle} isDarkMode={isDarkMode} newsData={realNews} />}
          </main>

        <div className="fixed bottom-0 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full relative">
            
            {!isNavVisible && (
                <div 
                    className="absolute bottom-0 left-0 w-full h-20 z-[110] cursor-pointer bg-transparent"
                    style={{ touchAction: 'none' }}
                    onPointerDown={(e) => {
                        e.preventDefault(); e.stopPropagation(); setIsNavVisible(true);
                        if (window.navigator.vibrate) window.navigator.vibrate(10);
                    }}
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
                    <div className={`
                        rounded-full transition-all duration-300 
                        ${isNavVisible ? 'bg-white/10 w-12 h-1.5 opacity-50' : 'bg-white/60 w-24 h-2 opacity-0 shadow-[0_0_20px_rgba(255,255,255,0.4)]'}
                    `} />
                </div>

                <div className={`
                    relative z-10 w-full flex justify-center gap-2 px-2 pb-10 transition-all duration-300
                    ${isNavVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                `}> 
                    <TabButton icon={<Sparkles size={24} />} label="Agora" active={activeTab === 'happening'} onClick={() => handleTabClick('happening')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Rss size={24} />} label="Feed" active={activeTab === 'feed'} onClick={() => handleTabClick('feed')} isDarkMode={isDarkMode} />
                    <TabButton icon={<LayoutGrid size={24} />} label="Banca" active={activeTab === 'banca'} onClick={() => handleTabClick('banca')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Youtube size={24} />} label="Vídeos" active={activeTab === 'youtube'} onClick={() => handleTabClick('youtube')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Mic size={24} />} label="Pod" active={activeTab === 'podcast'} onClick={() => handleTabClick('podcast')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Mail size={24} />} label="News" active={activeTab === 'newsletter'} onClick={() => handleTabClick('newsletter')} isDarkMode={isDarkMode} />
                    <TabButton icon={<Bookmark size={24} />} label="Salvos" active={activeTab === 'saved'} onClick={() => handleTabClick('saved')} isDarkMode={isDarkMode} />
                </div>

                <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[200%] bg-purple-600/10 blur-[50px] rounded-full pointer-events-none" />
            </nav>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
          <SettingsModal 
              onClose={() => setIsSettingsOpen(false)}
              isDarkMode={isDarkMode}
              feeds={userFeeds}
              setFeeds={setUserFeeds}
              apiKey={apiKey}
              setApiKey={setApiKey}
              readerApiKey={readerApiKey}      // <--- NOVA PROP
              setReaderApiKey={setReaderApiKey} // <--- NOVA PROP
              user={user} 
          />
      )}
      
      <ArticlePanel 
          // SEM KEY! O React vai reaproveitar a mesma instância
    article={selectedArticle} 
    feedItems={allFeedItems} // Passa array novo, mas o memo vai tratar
    isOpen={!!selectedArticle} 
    onClose={closeArticle} 
    onArticleChange={handleOpenArticle} 
    onToggleSave={handleToggleSave}
    isSaved={savedItems.some(i => i.id === selectedArticle?.id)}
    apiKey={apiKey}             // Chave Geral
    readerApiKey={readerApiKey} // Chave Leitor (Nova)
    isDarkMode={isDarkMode} 
    // Remova props que não usamos mais, como setIsExpanded
      />
      
      {selectedOutlet && <OutletDetail outlet={selectedOutlet} onClose={closeOutlet} openArticle={handleOpenArticle} isDarkMode={isDarkMode} />}
      
{selectedStory && <StoryOverlay story={selectedStory} onClose={closeStory} openArticle={handleOpenArticle} onMarkAsSeen={markStoryAsSeen} allStories={allAvailableStories}  onNavigate={handleStoryNavigation}/>}
      {playingAudio && (
          <GlobalAudioPlayer 
              track={playingAudio} 
              onClose={() => setPlayingAudio(null)} 
              isDarkMode={isDarkMode} 
          />
      )}

      
    </div>
  );
}




function OutletDetail({ outlet, onClose, openArticle, isDarkMode }) {
  const renderLayout = () => {
    const layout = outlet.layoutType;
    const articles = [1, 2, 3, 4, 5, 6];

    if (layout === 'standard') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 cursor-pointer group" onClick={() => openArticle({ title: 'Manchete do Jornal', source: outlet.name, category: 'Capa', img: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80` })}>
            <div className={`aspect-video mb-4 rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <img src={`https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Cover" />
            </div>
            <h2 className={`text-4xl font-serif font-black mb-3 leading-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>A Manchete Principal do Dia</h2>
            <p className={`font-serif text-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Um resumo detalhado sobre o principal acontecimento do mercado global e político.</p>
          </div>
          <div className={`md:col-span-4 space-y-6 border-l pl-6 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
            {articles.slice(0, 4).map((i) => (
              <div key={i} className="cursor-pointer" onClick={() => openArticle({ title: `Notícia Secundária ${i}`, source: outlet.name, category: 'Geral', img: null })}>
                <span className="text-[10px] font-bold text-blue-500 uppercase mb-1 block">Política</span>
                <h4 className={`font-serif font-bold text-xl leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Notícia secundária de grande impacto no cenário nacional.</h4>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (layout === 'magazine') {
      return (
        <div className={`space-y-12 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
          {articles.slice(0, 3).map((i) => (
            <div key={i} className={`flex gap-8 group cursor-pointer border-b pb-8 items-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`} onClick={() => openArticle({ title: 'Artigo da Revista', source: outlet.name, category: 'Feature', img: `https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80` })}>
              <span className={`text-8xl font-black transition-colors ${isDarkMode ? 'text-zinc-800 group-hover:text-blue-500/20' : 'text-zinc-100 group-hover:text-blue-500/20'}`}>0{i}</span>
              <div className="w-full">
                <span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-2 block">Destaque da Semana</span>
                <h3 className={`text-4xl font-bold mb-3 transition-colors ${isDarkMode ? 'text-white group-hover:text-blue-400' : 'text-zinc-900 group-hover:text-blue-600'}`}>O Futuro da Tecnologia e da Humanidade.</h3>
                <p className="opacity-70 text-lg line-clamp-2 font-serif">Uma análise profunda, visual e detalhada sobre os próximos passos da IA.</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (layout === 'visual') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {articles.map((i) => (
            <div key={i} onClick={() => openArticle({ title: 'Visual Story', source: outlet.name, category: 'Photo', img: `https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80` })} className={`relative group cursor-pointer rounded-xl overflow-hidden aspect-square ${i === 1 ? 'md:col-span-2 md:row-span-2' : ''}`}>
              <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=800&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 bg-zinc-200" alt="Visual" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition" />
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-white font-bold text-lg leading-tight">Uma história contada através de imagens impactantes.</h3>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (layout === 'minimal') {
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
          {articles.map((i) => (
            <div key={i} className="flex gap-4 cursor-pointer group" onClick={() => openArticle({ title: 'Quick Read', source: outlet.name, category: 'Brief', img: null })}>
              <div className={`w-16 h-16 rounded bg-zinc-200 flex-shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
              <div>
                <h4 className={`font-bold text-lg mb-1 group-hover:underline decoration-blue-500 underline-offset-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Manchete rápida e direta número {i}</h4>
                <p className="text-sm opacity-60 line-clamp-2">Um breve resumo do que aconteceu, sem imagens grandes para leitura rápida.</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className={`fixed inset-0 z-[65] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
      
      {/* Header Sticky */}
      <div className={`sticky top-0 z-10 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b ${isDarkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-zinc-200'}`}>
        <button onClick={onClose} className={`flex items-center gap-1 text-sm font-bold transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
          <ChevronLeft size={20} /> Voltar
        </button>
        <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{outlet.name}</span>
        <div className="w-6" />
      </div>

      {/* Hero Section (Capa) */}
      <div className={`relative w-full h-[35vh] overflow-hidden shadow-xl`}>
        <div className={`absolute inset-0 ${outlet.color}`} />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 p-8 max-w-5xl mx-auto w-full flex items-end justify-between">
          <div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">{outlet.logo}</h1>
            <p className="text-white/90 uppercase tracking-widest text-sm font-bold">Edição de Hoje • Exclusivo NewsOS</p>
          </div>
          <div className="hidden md:block">
            <span className="text-white/80 text-xs font-mono border border-white/30 px-2 py-1 rounded">Layout: {outlet.layoutType?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className={`max-w-5xl mx-auto p-4 md:p-8 min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        {renderLayout()}
      </div>
    </div>
  );
}

function StoryOverlay({ story, onClose, openArticle, onMarkAsSeen, allStories, onNavigate }) {
  
  // --- INÍCIO DO BLOCO DE DIAGNÓSTICO ---
  console.log("--- DEBUG STORY OVERLAY ---");
  console.log("Story atual recebido (prop 'story'):", story);
  console.log("ID que estamos procurando:", story?.id);
  console.log("Lista completa recebida (prop 'allStories'):", allStories);
  console.log("A lista 'allStories' é um array?", Array.isArray(allStories));
  if (Array.isArray(allStories)) {
    console.log("Total de stories na lista:", allStories.length);
    console.log("IDs presentes na lista:", allStories.map(s => s.id));
  }
  // --- FIM DO BLOCO DE DIAGNÓSTICO ---

  useEffect(() => {
    if (story && story.id && onMarkAsSeen) {
        onMarkAsSeen(story.id); 
    }
  }, [story, onMarkAsSeen]);

  // Esta linha é o ponto de falha. Vamos logar o resultado dela.
  const currentIndex = Array.isArray(allStories) ? allStories.findIndex(s => s.id === story.id) : -1;
  console.log("Resultado do findIndex (currentIndex):", currentIndex);

  const hasPrevStory = currentIndex > 0;
  const hasNextStory = currentIndex >= 0 && currentIndex < (allStories?.length || 0) - 1;
  
  console.log("hasPrevStory:", hasPrevStory, "| hasNextStory:", hasNextStory);
  console.log("--------------------------");


  if (!story || !story.items || story.items.length === 0) return null;

  const currentItem = story.items[0];

  const handleOpenFullArticle = () => {
      onClose();
      openArticle({ 
        ...currentItem, 
        source: story.name, 
        category: 'Story',
        origin: 'rss' 
      });
  };

  // O resto do componente continua igual, apenas o início foi modificado para os logs.
  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col animate-in zoom-in-95 duration-300">
       <div className="relative w-full h-full md:max-w-[60vh] md:aspect-[9/16] md:mx-auto md:my-auto md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/5">
        <div className="absolute inset-0">
            <img src={currentItem.img} className="w-full h-full object-cover" alt="Fundo do Story" onError={(e) => { e.target.style.display = 'none'; }}/>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        </div>
        <div className="absolute top-0 left-0 right-0 p-4 pt-10 md:pt-8 z-30 space-y-4">
          <div className="flex gap-1.5 h-1">
              {allStories && allStories.map((s, idx) => (
                  <div key={s.id} className={`flex-1 rounded-full h-full ${idx < currentIndex ? 'bg-white' : (idx === currentIndex ? 'bg-white animate-[progress_5s_linear]' : 'bg-white/20')}`} />
              ))}
          </div>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/30 p-[2px] bg-black/20 backdrop-blur-md">
                      <img src={story.avatar} className="w-full h-full rounded-full object-cover" alt="Logo" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-white font-black text-sm drop-shadow-md tracking-tight">{story.name}</span>
                      <span className="text-zinc-300 text-[10px] font-bold drop-shadow-md opacity-90">{currentItem.rawDate ? new Date(currentItem.rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
              </div>
              <button onClick={onClose} className="p-2.5 text-white/80 hover:text-white backdrop-blur-xl rounded-full bg-white/10 border border-white/10 transition-transform active:scale-90"><X size={26} /></button>
          </div>
        </div>
        <div className="absolute inset-0 z-20 flex">
            <div className="w-[30%] h-full" onClick={() => onNavigate('prev')} />
            <div className="w-[70%] h-full" onClick={() => onNavigate('next')} />
        </div>
        {hasPrevStory && ( <button onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white transition-all"><ChevronLeft size={28} /></button> )}
        {hasNextStory && ( <button onClick={(e) => { e.stopPropagation(); onNavigate('next'); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white transition-all"><ChevronRight size={28} /></button> )}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-30 pb-12 md:pb-10 pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center">
                <h2 className="text-white text-2xl md:text-3xl font-black leading-tight mb-8 drop-shadow-2xl font-serif text-center line-clamp-5">{currentItem.title}</h2>
                <button onClick={(e) => { e.stopPropagation(); handleOpenFullArticle(); }} className="group w-full bg-white text-black font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-zinc-100"><span className="text-sm uppercase tracking-widest">Ler Notícia Completa</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></button>
            </div>
        </div>
       </div>
       <div className="fixed inset-0 -z-10 bg-zinc-950/95 backdrop-blur-3xl md:block hidden" onClick={onClose} />
       <style jsx="true">{`@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
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
// COMPONENTE ARTICLE PANEL (V22 - FINAL - COM SUPORTE NATIVO A VÍDEO E TEXTO)
// ==============================================================================

// 1. FUNÇÕES AUXILIARES DE ESTILO
const getBrandIdentity = (sourceName) => {
    const name = sourceName?.toLowerCase() || "";
    if (name.match(/times|post|folha|estadao|journal|herald|politico/)) {
        return { type: 'newspaper', fontHeader: "'Chomsky', 'UnifrakturMaguntia', serif", fontBody: "'Merriweather', serif", align: 'center' };
    }
    if (name.match(/verge|wired|tech|code|mac|tecmundo|canaltech|ign|g1|globo|uol|noticias|minuto/)) {
        return { type: 'tech', fontHeader: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", align: 'left' };
    }
    if (name.match(/vogue|elle|vanity|gq|bazaar|veja|exame|marie/)) {
        return { type: 'magazine', fontHeader: "'Bodoni Moda', serif", fontBody: "'Lato', sans-serif", align: 'center' };
    }
    if (name.match(/cnn|bbc|nbc|espn|r7|band|jovem/)) {
        return { type: 'broadcast', fontHeader: "'Oswald', sans-serif", fontBody: "'Roboto', sans-serif", align: 'left' };
    }
    return { type: 'default', fontHeader: "'Playfair Display', serif", fontBody: "'Source Serif Pro', serif", align: 'center' };
};

const resolveBrandColor = (sourceName, isDarkMode) => {
    if (!sourceName) return isDarkMode ? '#ffffff' : '#000000';
    const name = sourceName.toLowerCase().replace(/\s+/g, '');

    const BRANDS = {
        'g1': '#C4170C', 'globo': '#006497', 'folha': '#004990', 'estadao': '#003B5C',
        'uol': '#F99D1C', 'cnn': '#CC0000', 'bbc': '#BB1919', 'verge': '#E219E6',
        'wired': '#000000', 'nytimes': '#000000', 'bloomberg': '#000000', 'vogue': '#000000',
        'espn': '#CD122D', 'noticiasaominuto': '#ff6600'
    };
    for (const [key, color] of Object.entries(BRANDS)) if (name.includes(key)) return color;
    
    const SAFE_PALETTE = ['#1E3A8A', '#B91C1C', '#0F766E', '#7C3AED', '#BE123C', '#C2410C', '#374151', '#000000'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return SAFE_PALETTE[Math.abs(hash) % SAFE_PALETTE.length];
};

// 2. SUB-COMPONENTES DE VISUALIZAÇÃO
const MagicPremiumView = React.memo(({ article, readerContent, isDarkMode, fontSize }) => {
    const data = readerContent || article;
    if (!data) return null;

    const identity = getBrandIdentity(article.source);
    const brandColor = resolveBrandColor(article.source, isDarkMode);
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(article.rawDate || Date.now()));

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 bg-transparent w-full transform-gpu">
             <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,900;1,6..96,400&family=Inter:wght@300;400;800;900&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Roboto:wght@300;400;700&family=UnifrakturMaguntia&family=Source+Serif+Pro:wght@400;600&display=swap');
                :root { --brand-color: ${brandColor}; }
                .magic-body { font-family: ${identity.fontBody}; line-height: 1.8; color: ${isDarkMode ? '#e4e4e7' : '#111'}; }
                .magic-body p { margin-bottom: 1.5em; font-size: 1.1em; letter-spacing: -0.01em; }
                .magic-body h1, .magic-body h2, .magic-body h3 { font-family: ${identity.type === 'tech' ? identity.fontHeader : identity.fontBody}; font-weight: 800; margin-top: 2em; margin-bottom: 0.5em; line-height: 1.1; color: ${isDarkMode ? '#fff' : '#000'}; }
                .magic-body a { color: var(--brand-color); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; font-weight: 600; }
                .magic-body blockquote { border-left: 4px solid var(--brand-color); padding-left: 1.5em; font-style: italic; margin: 2em 0; font-size: 1.2em; font-weight: 500; color: ${isDarkMode ? '#fff' : '#000'}; background: ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}; padding: 1rem; }
                .magic-body img { width: 100%; height: auto; display: block; margin: 2.5em 0; border-radius: 0; }
                .magic-body ul, .magic-body ol { margin-left: 1.5em; margin-bottom: 1.5em; }
                .magic-body li { margin-bottom: 0.5em; padding-left: 0.5em; }
                ${(identity.type === 'newspaper' || identity.type === 'magazine') ? `.magic-body > p:first-of-type::first-letter { float: left; font-size: 4.8em; line-height: 0.8em; padding-right: 0.1em; padding-top: 0.1em; font-family: ${identity.fontHeader}; font-weight: 900; color: var(--brand-color); }` : ''}
                .masthead-newspaper { border-bottom: 1px double ${isDarkMode ? '#fff' : '#000'}; border-top: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}; padding: 2rem 0; text-align: center; }
                .masthead-tech { text-align: left; border-top: 6px solid var(--brand-color); padding: 2rem 0; background: ${isDarkMode ? 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' : 'linear-gradient(to right, rgba(0,0,0,0.03), transparent)'}; }
                .masthead-magazine { text-align: center; padding: 3rem 0; border-bottom: 1px solid ${isDarkMode ? '#fff' : '#000'}; }
                .masthead-broadcast { display: flex; align-items: center; gap: 1rem; padding: 1.5rem 0; border-bottom: 4px solid var(--brand-color); }
                .masthead-default { text-align: center; padding: 2rem 0; border-bottom: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; }
            `}</style>
            
            <div className={`w-full ${isDarkMode ? 'bg-zinc-950' : 'bg-[#f8f9fa]'}`}>
                <div className="max-w-3xl mx-auto px-6">
                    {identity.type === 'newspaper' && (<div className="masthead-newspaper"><div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex justify-center gap-4 opacity-60"><span>{formattedDate}</span><span>•</span><span>{article.category}</span></div><h1 className="text-5xl md:text-7xl mb-2 text-current" style={{ fontFamily: identity.fontHeader, fontWeight: 400 }}>{article.source}</h1></div>)}
                    {identity.type === 'tech' && (<div className="masthead-tech pl-4"><div className="flex items-center gap-3 mb-4"><img src={article.logo} className="w-8 h-8 rounded-md" /><span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>/ {article.category}</span></div><h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none" style={{ fontFamily: identity.fontHeader, letterSpacing: '-0.05em' }}>{article.source}</h1></div>)}
                    {identity.type === 'magazine' && (<div className="masthead-magazine"><h1 className="text-6xl md:text-8xl font-bold uppercase leading-none mb-2" style={{ fontFamily: identity.fontHeader, letterSpacing: '0.05em' }}>{article.source}</h1><div className="w-16 h-1 mx-auto mb-4" style={{ backgroundColor: brandColor }}></div><div className="flex justify-between border-t border-b border-current py-1 text-[10px] font-bold uppercase tracking-[0.2em]"><span>Exclusive</span><span>Story</span><span>NewsOS</span></div></div>)}
                    {identity.type === 'broadcast' && (<div className="masthead-broadcast"><div className="text-white p-2 px-3 font-bold text-3xl tracking-tighter rounded-sm" style={{ backgroundColor: brandColor, fontFamily: identity.fontHeader }}>{article.source.substring(0, 4).toUpperCase()}</div><div className="h-8 w-[1px] bg-current opacity-20"></div><div className="flex flex-col"><span className="text-xs font-bold uppercase tracking-wider opacity-60">{formattedDate}</span><span className="text-sm font-black uppercase tracking-tight" style={{ color: brandColor }}>Breaking News</span></div></div>)}
                    {identity.type === 'default' && (<div className="masthead-default"><img src={article.logo} className="w-16 h-16 mx-auto mb-4 rounded-full shadow-md border-4 border-white dark:border-zinc-800" /><h1 className="text-3xl font-black uppercase tracking-widest opacity-90">{article.source}</h1><div className="w-8 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: brandColor }}></div></div>)}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 pb-32">
                <h2 className={`text-3xl md:text-5xl leading-[1.1] mb-8 ${identity.align === 'center' ? 'text-center' : 'text-left'} ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: identity.type === 'tech' ? identity.fontHeader : (identity.type === 'newspaper' ? identity.fontHeader : identity.fontBody), fontWeight: identity.type === 'newspaper' ? 400 : 900, letterSpacing: identity.type === 'tech' ? '-0.03em' : 'normal' }}>{data.title}</h2>
                <div className={`flex items-center gap-4 mb-10 border-t border-b py-3 border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider opacity-60 ${identity.align === 'center' ? 'justify-center' : 'justify-start'}`}><span>Por Redação</span><span className="w-1 h-1 bg-current rounded-full"></span><span>{article.readTime || '3 min'}</span></div>
                {article.img && (<figure className="w-full mb-12"><img src={article.img} className="w-full h-auto object-cover shadow-sm" alt={article.title} /><figcaption className="text-[10px] mt-2 opacity-60 font-sans text-center uppercase tracking-wide">Foto: Reprodução / {article.source}</figcaption></figure>)}
                <div className="magic-body" style={{ fontSize: `${fontSize}px` }} dangerouslySetInnerHTML={{ __html: readerContent?.content || `<p>${article.summary}</p>` }} />
            </div>
        </div>
    );
});

const AppleReaderView = React.memo(({ article, readerContent, isDarkMode, fontSize }) => {
    const data = readerContent || article;
    if (!data) return null;
    return (
        <div className={`animate-in fade-in duration-500 min-h-full transform-gpu ${isDarkMode ? 'bg-black text-[#d1d5db]' : 'bg-[#f9f9f9] text-[#333]'}`}>
            <div className="max-w-[680px] mx-auto px-6 py-12 pb-32 font-sans leading-relaxed">
                <h1 className={`text-3xl md:text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>{data.title}</h1>
                <div className={`text-sm font-medium mb-8 pb-8 border-b ${isDarkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>{article.source} • {article.time}</div>
                <div style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: readerContent?.content || `<p>${article.summary}</p>` }} />
            </div>
        </div>
    );
});

const AIAnalysisView = React.memo(({ article, isDarkMode }) => (
      <div className="max-w-2xl mx-auto p-8 pt-12 animate-in fade-in slide-in-from-bottom-4 transform-gpu">
          <div className={`p-6 rounded-3xl border mb-8 ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200 shadow-xl'}`}>
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center"><BrainCircuit size={20} className="text-white" /></div><div><h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>NewsOS Intelligence</h3><p className="text-xs opacity-60">Análise IA</p></div></div>
              <div className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}><p className="mb-4">Este artigo discute <strong>{article.title}</strong>.</p><ul className="list-disc pl-5 space-y-2 mb-4 opacity-80"><li>Impacto no setor de {article.category}.</li><li>Reações do mercado.</li></ul></div>
          </div>
      </div>
));


// --- WIDGETS VISUAIS DA ABA AI ---

// 1. Mindmap (Visual Teia)
const MindMapWidget = ({ data, isDarkMode }) => (
    <div className={`p-6 rounded-3xl border mb-6 relative overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2"><Share size={12}/> Mapa Mental</h4>
        <div className="flex flex-col items-center relative z-10">
            {/* Nó Central */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-center shadow-lg shadow-indigo-500/30 mb-8 z-20 relative">
                {data.center}
                {/* Linhas (CSS Puro) */}
                <div className="absolute top-full left-1/2 w-0.5 h-8 bg-indigo-500/30 -translate-x-1/2"></div>
                <div className="absolute top-full left-0 w-full h-0.5 bg-indigo-500/30 translate-y-8"></div>
            </div>
            {/* Nós Filhos */}
            <div className="grid grid-cols-2 gap-4 w-full">
                {data.nodes.map((node, i) => (
                    <div key={i} className={`p-3 rounded-xl text-xs font-medium text-center border relative ${isDarkMode ? 'bg-black/20 border-white/10 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>
                        {/* Linhas verticais conectando na linha horizontal */}
                        <div className={`absolute bottom-full left-1/2 w-0.5 h-4 bg-indigo-500/30 -translate-x-1/2`}></div>
                        {node}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// 2. Timeline (Contexto Histórico)
const TimelineWidget = ({ items, isDarkMode }) => (
    <div className={`p-6 rounded-3xl border mb-6 ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2"><Clock size={12}/> Contexto Temporal</h4>
        <div className="space-y-0">
            {items.map((item, i) => (
                <div key={i} className="flex gap-4 relative pb-8 last:pb-0">
                    {/* Linha Vertical */}
                    {i !== items.length - 1 && <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>}
                    
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold z-10 ${i === items.length-1 ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500')}`}>
                        {i === items.length-1 ? 'HOJE' : i+1}
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">{item.time}</span>
                        <p className={`text-sm leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.event}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// 3. Cenários Futuros (What's Next)
const FutureWidget = ({ data, isDarkMode }) => (
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



// ==============================================================================
// COMPONENTE ARTICLE PANEL - OTIMIZADO PARA NAVEGAÇÃO RÁPIDA (FEED NAVIGATOR)
// ==============================================================================

const ArticlePanel = React.memo(({ article, feedItems, isOpen, onClose, onArticleChange, onToggleSave, isSaved, isDarkMode, apiKey, readerApiKey  }) => {
  const [viewMode, setViewMode] = useState('web'); 
  const [iframeUrl, setIframeUrl] = useState(null);     
  const [readerContent, setReaderContent] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(19); 
  
  // Estado da Animação de Entrada do Painel
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  const scrollContainerRef = useRef(null); 

  // --- LÓGICA DE TRADUÇÃO ---
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState(null);

  const videoId = useMemo(() => {
      if (!article) return null;
      return article.videoId || getVideoId(article.link);
  }, [article]);

  const [aiData, setAiData] = useState(null); // Guarda o Super JSON
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryMode, setSummaryMode] = useState('executive'); // 'executive', 'tldr', 'eli5', 'bullets'
  useEffect(() => {
      // Sempre que abrir uma nova notícia (article.id mudou),
      // limpamos os dados da IA anterior para não misturar as bolas.
      setAiData(null);
      setAiLoading(false);
      setSummaryMode('executive'); // Volta para o padrão
  }, [article?.id]);

  // --- ESTILOS INJETADOS DINAMICAMENTE PARA OS DESTAQUES ---
const highlightStyles = `
  .ai-highlight {
    background: linear-gradient(120deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
    border-bottom: 2px solid #d946ef;
    cursor: pointer;
    border-radius: 4px;
    padding: 0 2px;
    transition: all 0.2s;
    font-weight: 600;
    color: inherit;
  }
  .ai-highlight:hover {
    background: linear-gradient(120deg, rgba(168, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.4) 100%);
    color: #d946ef;
  }
  .dark .ai-highlight {
    color: #e879f9;
  }
`;

// --- COMPONENTE: TOOLTIP DE CONTEXTO (O CARD DE VIDRO) ---
const ContextTooltip = ({ data, onClose, isDarkMode }) => (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} /> {/* Fecha ao clicar fora */}
        
        <div className={`
            relative w-full max-w-xs p-6 rounded-3xl shadow-2xl border
            flex flex-col gap-3 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
            ${isDarkMode 
                ? 'bg-zinc-900/90 border-purple-500/30 shadow-purple-500/20 text-white' 
                : 'bg-white/90 border-white/50 shadow-xl text-zinc-900'}
            backdrop-blur-xl
        `}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500 animate-pulse"/>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">NewsOS Context</span>
                </div>
                <button onClick={onClose}><X size={18} className="opacity-50 hover:opacity-100"/></button>
            </div>
            
            <h3 className="text-xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                {data.term}
            </h3>
            
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {data.context}
            </p>
        </div>
    </div>
);

// --- COMPONENTE: GAVETA DE LISTA (PARA VER TUDO DE UMA VEZ) ---
const ContextDrawer = ({ items, onClose, isDarkMode }) => (
    <div className="fixed inset-0 z-[6000] flex flex-col justify-end animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`
            relative w-full max-h-[70vh] overflow-y-auto rounded-t-[2.5rem] p-6 shadow-2xl border-t
            animate-in slide-in-from-bottom-full duration-500
            ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200'}
        `}>
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-800 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><BrainCircuit size={24}/></div>
                <div>
                    <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Raio-X Completo</h3>
                    <p className="text-xs opacity-50">Principais conceitos explicados pela IA.</p>
                </div>
            </div>

            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                        <h4 className={`font-bold text-sm mb-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{item.term}</h4>
                        <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.context}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


// ... (Mantenha sanitizeHtml, handleClosePanel, handleOpenInBrowser, handleToggleTranslation inalterados) ...
  const PROBLEMATIC_DOMAINS = ['cnnbrasil.com.br', 'estadao.com.br', 'noticiasaominuto.com.br'];
  const isProblematicSite = useMemo(() => {
      if (!article?.link) return false;
      return PROBLEMATIC_DOMAINS.some(domain => article.link.includes(domain));
  }, [article?.link]);

  const sanitizeHtml = (html) => {
      if (!html) return "";
      let clean = html;
      
      // 1. Remove TODOS os scripts (agressivo)
      clean = clean.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
      
      // 2. Remove iframes (para evitar aninhamento infinito e erros de X-Frame)
      clean = clean.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "");
      
      // 3. Remove manipuladores de eventos inline (onload, onclick, etc) que causam erros de segurança
      clean = clean.replace(/ on\w+="[^"]*"/g, "");

      // 4. Corrige caminhos de imagem preguiçosos (Lazy Load)
      clean = clean.replace(/data-src=/gi, 'src=').replace(/data-srcset=/gi, 'srcset=').replace(/loading="lazy"/gi, ''); 

      const headInjection = `<base href="${article.link}" target="_blank"><meta name="referrer" content="no-referrer"><style>
        /* Esconde banners de cookie, ads e popups conhecidos */
        .onetrust-banner, #onetrust-consent-sdk, .fc-ab-root, 
        [class*="cookie"], [class*="popup"], [class*="modal"], 
        [class*="ads"], [id*="google_ads"], iframe { display: none !important; } 
        body { overflow-x: hidden; padding-bottom: 100px; -webkit-font-smoothing: antialiased; }
      </style>`;

      if (clean.includes('<head>')) return clean.replace('<head>', `<head>${headInjection}`);
      return `${headInjection}${clean}`;
  };




  // --- ESTADOS PARA O RAIO-X IA ---
  const [analysisItems, setAnalysisItems] = useState(null); // Guarda os termos
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Loading
  const [activeTooltip, setActiveTooltip] = useState(null); // Qual termo foi clicado
  const [showDrawer, setShowDrawer] = useState(false); // Mostrar gaveta

  // --- ALGORITMO DE INJEÇÃO DE DESTAQUES ---
  const runAnalysis = async () => {
      // 1. Verifica se tem texto para analisar
      const textToAnalyze = readerContent?.content || article.summary;
      if (!textToAnalyze) return;

      setIsAnalyzing(true);

      // 2. Chama a IA (usando a chave Reader que passamos via props ou a geral)
      // OBS: Precisamos garantir que 'apiKey' aqui seja a chave correta.
      // Se você separou as chaves no NewsOS_V12, passe a 'readerApiKey' como prop para este componente.
      // Vou assumir que você está passando 'apiKey' (a geral) ou 'readerApiKey' como prop.
      // Ajuste aqui conforme o nome da prop que você passou:
      const terms = await generateNewsContext(textToAnalyze, readerApiKey); // <--- USE A CHAVE CERTA AQUI

      if (terms && Array.isArray(terms)) {
          setAnalysisItems(terms);

          // 3. INJEÇÃO NO HTML (Se estiver no modo Magic/Leitor)
          if (readerContent && readerContent.content) {
              let newHtml = readerContent.content;
              
              terms.forEach(item => {
                  // Regex segura para substituir apenas texto fora de tags HTML
                  // Procura o termo (case insensitive) e envolve com span
                  const regex = new RegExp(`(?<!<[^>]*)\\b(${item.term})\\b`, 'gi');
                  
                  // O truque: Injetamos o JSON do contexto dentro do atributo data-context
                  // para recuperarmos ao clicar.
                  const safeContext = encodeURIComponent(JSON.stringify(item));
                  
                  newHtml = newHtml.replace(regex, 
                      `<span class="ai-highlight" data-context="${safeContext}">$1</span>`
                  );
              });

              // Atualiza o conteúdo do leitor com os destaques
              setReaderContent({ ...readerContent, content: newHtml });
          }
          
          // Se estivermos em um modo que não permite injeção, abrimos a gaveta direto
          if (!readerContent) {
              setShowDrawer(true);
          }
      }
      setIsAnalyzing(false);
  };

  // --- HANDLER DE CLIQUE NO TEXTO (DELEGAÇÃO DE EVENTOS) ---
  const handleContentClick = (e) => {
      // Verifica se clicou num destaque
      if (e.target.classList.contains('ai-highlight')) {
          e.preventDefault();
          e.stopPropagation();
          try {
              const data = JSON.parse(decodeURIComponent(e.target.dataset.context));
              setActiveTooltip(data);
          } catch (err) { console.error(err); }
      }
  };

  // Dispara a análise completa quando entra na aba AI
  const loadFullAnalysis = async () => {
      // Evita chamar se já tiver dados ou estiver carregando
      if (aiData || aiLoading) return;
      
      const textToAnalyze = readerContent?.content || article.summary;
      if (!textToAnalyze) return;

      setAiLoading(true);
      
      // Usa a Reader Key (Nova) ou fallback para a Geral
      const activeKey = readerApiKey || apiKey; 
      
      const result = await generateFullAnalysis(textToAnalyze, activeKey);
      
      if (result) {
          setAiData(result);
      }
      setAiLoading(false);
  };

  // Efeito para chamar automaticamente ao mudar para a aba AI
  useEffect(() => {
      if (viewMode === 'ai') {
          loadFullAnalysis();
      }
  }, [viewMode]);

  // 1. EFEITO DE ABERTURA DO PAINEL (Só roda quando isOpen muda)
  useEffect(() => {
        let timer;
        if (isOpen) {
            // Inicia a animação de entrada
            timer = setTimeout(() => setIsAnimationDone(true), 450);
        } else {
            // Se fechar, reseta tudo
            setIsAnimationDone(false);
            setIframeUrl(null);
            setReaderContent(null);
        }
        return () => clearTimeout(timer);
    }, [isOpen]); // ATENÇÃO: removi article.id daqui para não re-animar na troca
  
    // 2. EFEITO DE CARREGAMENTO DO CONTEÚDO (Roda quando article.id muda)
    useEffect(() => {
      if (!isOpen || !article?.link || videoId) return;
      
      // --- O SEGREDO DA FLUIDEZ NO NAVIGATOR ---
      // 1. Reseta o scroll para o topo imediatamente
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      
      // 2. Limpa o conteúdo anterior para mostrar que está carregando o novo
      setReaderContent(null);
      setIframeUrl(null);
      setTranslatedData(null);
      setIsTranslated(false);
      setIsLoading(true);
  
      const fetchContent = async () => {
        setIsLoading(true);
        try {
            // 1. TENTA BUSCAR DO CACHE PRIMEIRO
            let { data: cachedData } = await supabase
                .from('article_cache')
                .select('content')
                .eq('url', article.link)
                .single();

            if (cachedData && cachedData.content) {
                // SUCESSO! Usamos o cache.
                console.log("Artigo carregado do CACHE.");
                setReaderContent(cachedData.content);
                
                // Constrói HTML para o modo Webview baseado no cache
                const cachedHtml = `<html><head><title>${cachedData.content.title}</title></head><body><h1>${cachedData.content.title}</h1>${cachedData.content.content}</body></html>`;
                const cleanHtml = sanitizeHtml(cachedHtml);
                const blob = new Blob([cleanHtml], { type: 'text/html' });
                setIframeUrl(URL.createObjectURL(blob));

            } else {
                // 2. SE NÃO ACHOU NO CACHE, invoca a Edge Function
                console.log("Cache miss. Buscando via Edge Function...");
                const { data, error } = await supabase.functions.invoke('proxy-view', { body: { url: article.link } });
                
                if (error || !data) throw new Error("Falha no proxy-view");
                
                const cleanHtml = sanitizeHtml(data.html);
                const blob = new Blob([cleanHtml], { type: 'text/html' });
                setIframeUrl(URL.createObjectURL(blob));
                setReaderContent(data.reader);

                // 3. SALVA O RESULTADO NO CACHE PARA A PRÓXIMA VEZ
                if (data.reader) {
                    await supabase.from('article_cache').upsert({
                        url: article.link,
                        content: data.reader,
                    });
                     console.log("Artigo salvo no cache para uso futuro.");
                }
            }
        } catch (err) {
            console.warn("Falha ao buscar conteúdo, mudando para modo Magic:", err);
            setViewMode('magic');
        } finally {
            setIsLoading(false);
        }
    };
    
      
      // Pequeno delay se a animação do painel ainda estiver rolando (primeira abertura)
      if (!isAnimationDone) {
          setTimeout(fetchContent, 500);
      } else {
          fetchContent(); // Troca instantânea se já estiver aberto (Navigator)
      }
  
    }, [article?.id, isOpen, videoId]); // Depende do ID do artigo
  
   
  

  

  const handleClosePanel = useCallback(() => {
      onClose(); 
  }, [onClose]);

  const handleOpenInBrowser = useCallback(async () => {
    if (!article?.link) return;

    // A MÁGICA DO CAPACITOR:
    // Chama o mesmo plugin nativo que usamos para o YouTube,
    // mas agora com o link do artigo.
    await Browser.open({
        url: article.link,
        presentationStyle: 'fullscreen', // Garante tela cheia no iPad
        toolbarColor: isDarkMode ? '#000000' : '#FFFFFF',
        controlsColor: isDarkMode ? '#FFFFFF' : '#000000'
    });
  }, [article, isDarkMode]);

  const handleToggleTranslation = async () => {
      if (translatedData) { setIsTranslated(!isTranslated); return; }
      const contentToTranslate = readerContent || article;
      if (!contentToTranslate) return;
      setIsTranslating(true);
      try {
          const newTitle = await translateText(contentToTranslate.title);
          const parser = new DOMParser();
          const doc = parser.parseFromString(contentToTranslate.content || article.summary || '', 'text/html');
          const textNodes = [];
          const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while (node = walker.nextNode()) { if (node.nodeValue.trim().length > 0) textNodes.push(node); }
          const BATCH_SIZE = 5; 
          for (let i = 0; i < textNodes.length; i += BATCH_SIZE) {
              const batch = textNodes.slice(i, i + BATCH_SIZE);
              await Promise.all(batch.map(async (textNode) => {
                  try { const translated = await translateText(textNode.nodeValue); textNode.nodeValue = translated; } catch(e){}
              }));
          }
          setTranslatedData({ title: newTitle, content: doc.body.innerHTML });
          setIsTranslated(true);
          if (viewMode === 'web') setViewMode('magic');
      } catch (err) { console.error(err); } finally { setIsTranslating(false); }
  };

  const activeContent = (isTranslated && translatedData) ? translatedData : (readerContent || article);
  const safeContent = activeContent || {}; 
  const safeArticle = article || {};
  const activeArticleData = { ...safeArticle, ...safeContent };
  const activeReaderData = { content: safeContent.content, title: safeContent.title };

  // Define classes baseadas no estado da animação para performance
  const containerClasses = isAnimationDone && isOpen
      ? `fixed inset-0 z-[5000] flex flex-col ${videoId ? 'bg-black' : (isDarkMode ? 'bg-zinc-950' : 'bg-white')}`
      : `fixed inset-0 z-[5000] flex flex-col transition-transform duration-300 ease-out will-change-transform ${videoId ? 'bg-black' : (isDarkMode ? 'bg-zinc-950' : 'bg-white')} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;

  return (
    <div className={containerClasses}>
        <div className="relative flex-1 w-full flex flex-col h-full overflow-hidden">
            
            {/* TOP BAR */}
            <div className={`flex-shrink-0 px-3 py-3 flex items-center justify-between border-b z-50 ${videoId ? 'bg-black/90 border-white/10 text-white' : (isDarkMode ? 'bg-zinc-950 border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-900')}`}>
                <button onClick={handleClosePanel} className={`flex items-center gap-1 py-2 pr-3 text-sm font-black transition active:scale-95 ${videoId ? 'text-zinc-300 hover:text-white' : (isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-black')}`}><ChevronLeft size={24} /> <span className="hidden md:inline">VOLTAR</span></button>
                
                {!videoId && (
                    <>
                   {/* Aumentei o padding do container para p-1.5 */}
                        <div className={`flex p-1.5 rounded-xl relative border shadow-sm ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
                            
                            {/* Ajustei o top/bottom do slider para acompanhar o padding do container */}
                            <div className={`absolute top-1.5 bottom-1.5 w-[48%] rounded-lg shadow-sm transition-all duration-300 ease-out ${viewMode === 'ai' ? 'left-[50%]' : 'left-1.5'} ${isDarkMode ? 'bg-zinc-800' : 'bg-white'} ${viewMode === 'magic' || viewMode === 'reader' ? 'opacity-0' : 'opacity-100'}`} />
                            
                            {/* BOTÃO WEB: Aumentei px-6, py-2.5 e text-xs */}
                            <button onClick={() => setViewMode('web')} className={`relative px-6 md:px-8 py-2.5 text-xs font-black transition-colors z-10 flex items-center gap-2 ${viewMode === 'web' && viewMode !== 'magic' && viewMode !== 'reader' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-zinc-500'}`}>
                                WEB
                            </button>
                            
                            {/* BOTÃO AI: Aumentei px-6, py-2.5, text-xs e o ícone para size={12} */}
                            <button onClick={() => setViewMode('ai')} className={`relative px-6 md:px-8 py-2.5 text-xs font-black transition-colors z-10 flex items-center gap-2 ${viewMode === 'ai' ? 'text-purple-500' : 'text-zinc-500'}`}>
                                <Sparkles size={12} /> AI
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                             {/* BOTÃO RAIO-X */}
                            <button 
                                onClick={runAnalysis} 
                                disabled={isAnalyzing}
                                className={`relative px-4 md:px-6 py-1.5 text-[14px] font-black transition-all z-10 flex items-center gap-2 ${isAnalyzing ? 'opacity-50 cursor-wait' : (analysisItems ? 'text-purple-500' : 'text-zinc-500 hover:text-purple-600')}`}
                            >
                                {isAnalyzing ? <Loader2 size={10} className="animate-spin"/> : <BrainCircuit size={12} />}
                                {analysisItems ? 'RAIO-X ATIVO' : 'RAIO-X'}
                            </button>
                            
                            {/* BOTÃO LISTA (Só aparece se já tiver analisado) */}
                            {analysisItems && (
                                <button onClick={() => setShowDrawer(true)} className="px-3 py-1.5 text-zinc-400 hover:text-purple-500 transition">
                                    <FileText size={14}/>
                                </button>
                            )}
                             <button onClick={() => setViewMode(viewMode === 'magic' ? 'web' : 'magic')} className={`p-2.5 rounded-xl border ${viewMode === 'magic' ? 'bg-purple-600 text-white border-purple-500' : (isDarkMode ? 'text-zinc-400 border-white/10' : 'text-zinc-500 border-zinc-200')}`}><Wand2 size={20} /></button>
                             <button onClick={handleToggleTranslation} className={`p-2.5 rounded-xl border ${isTranslated ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-zinc-400 border-white/10' : 'text-zinc-500 border-zinc-200')}`}>{isTranslating ? <Loader2 size={20} className="animate-spin" /> : <Languages size={20} />}</button>
                             <button onClick={() => setViewMode(viewMode === 'reader' ? 'web' : 'reader')} className={`p-2.5 rounded-xl border ${viewMode === 'reader' ? 'bg-black text-white' : (isDarkMode ? 'text-zinc-400 border-white/10' : 'text-zinc-500 border-zinc-200')}`}><ALargeSmall size={20} /></button>
                             <button onClick={handleOpenInBrowser} className={`p-2.5 rounded-xl border ${isDarkMode ? 'text-zinc-400 border-white/10' : 'text-zinc-500 border-zinc-200'}`}><Globe size={20} /></button>
                             <button onClick={() => onToggleSave(article)} className={`p-2.5 rounded-xl ${isSaved ? 'text-purple-500 bg-purple-500/10' : 'text-zinc-400'}`}><Bookmark size={22} fill={isSaved ? "currentColor" : "none"} /></button>
                        </div>
                    </>
                )}
                 {/* Barra de progresso */}
                 <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] z-[60] pointer-events-none overflow-hidden">{isLoading && isAnimationDone ? <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-[1px] animate-progress-aura" style={{ width: '100%' }} /> : <div className="h-full bg-transparent" />}</div>
            </div>

            {/* ÁREA DE CONTEÚDO */}
            <div ref={scrollContainerRef} className={`flex-1 relative w-full h-full overflow-y-auto overscroll-contain ${videoId ? 'bg-black text-white' : (isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900')}`}>
                
                {/* Só mostra loading se estiver sem conteúdo ou carregando */}
                {(!isAnimationDone || (isLoading && !readerContent && !iframeUrl)) ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                        <Loader2 size={32} className="animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <>
                        {/* Conteúdo Web */}
                        {viewMode === 'web' && (
                            <div className="w-full h-full">
                                {iframeUrl ? (
                                    <iframe src={iframeUrl} className="w-full h-full border-none" sandbox={isProblematicSite ? "allow-same-origin allow-popups" : "allow-same-origin allow-scripts allow-popups allow-forms"} title="Web" loading="lazy" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-12 text-center text-zinc-500"><div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-6"><Globe size={40} className="opacity-40" /></div><h3 className="font-black text-xl mb-2">Web Indisponível</h3><p className="max-w-xs text-sm opacity-60 mb-6">Conteúdo bloqueado.</p></div>
                                )}
                            </div>
                        )}
                        {viewMode === 'ai' && (
                            <div className="px-6 py-8 pb-32 animate-in fade-in slide-in-from-bottom-4">
                                {aiLoading ? (
                                    <div className="flex flex-col items-center justify-center h-64 opacity-50 space-y-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                                            <BrainCircuit size={48} className="text-purple-500 animate-bounce relative z-10"/>
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest">Processando Inteligência...</p>
                                    </div>
                                ) : aiData ? (
                                    <>
                                        {/* 1. SELETORES DE RESUMO */}
                                        <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 mb-6 overflow-x-auto">
                                            {['executive', 'tldr', 'eli5', 'bullets'].map(mode => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setSummaryMode(mode)}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                                                        ${summaryMode === mode 
                                                            ? 'bg-white dark:bg-zinc-700 text-purple-600 shadow-sm' 
                                                            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}
                                                    `}
                                                >
                                                    {mode === 'executive' ? 'Executivo' : mode === 'tldr' ? 'Curto' : mode === 'eli5' ? 'Didático' : 'Tópicos'}
                                                </button>
                                            ))}
                                        </div>

                                        {/* 2. ÁREA DO RESUMO */}
                                        <div className="mb-10 animate-in fade-in duration-300" key={summaryMode}>
                                            <h2 className={`text-2xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                {summaryMode === 'executive' ? 'Análise Executiva' : summaryMode === 'tldr' ? 'Em uma frase' : summaryMode === 'eli5' ? 'Explicação Simples' : 'Pontos Chave'}
                                            </h2>
                                            
                                            <div className={`text-sm leading-loose ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                                {summaryMode === 'bullets' ? (
                                                    <ul className="list-disc pl-5 space-y-2">
                                                        {aiData.summaries.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                                    </ul>
                                                ) : (
                                                    <p>{aiData.summaries[summaryMode]}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. WIDGETS VISUAIS */}
                                        {aiData.mindmap && <MindMapWidget data={aiData.mindmap} isDarkMode={isDarkMode} />}
                                        {aiData.timeline && <TimelineWidget items={aiData.timeline} isDarkMode={isDarkMode} />}
                                        {aiData.future && <FutureWidget data={aiData.future} isDarkMode={isDarkMode} />}
                                        
                                        {/* Créditos */}
                                        <div className="text-center opacity-30 mt-8">
                                            <p className="text-[10px] font-mono">Powered by Gemini 2.5 Flash</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-20 opacity-50">
                                        <p>Falha na análise. Tente novamente.</p>
                                        <button onClick={loadFullAnalysis} className="mt-4 text-xs font-bold underline">Reconectar</button>
                                    </div>
                                )}
                            </div>
                        )}
{viewMode === 'magic' && (
                            // Envolvemos com uma div para capturar os cliques nos spans injetados
                            <div onClick={handleContentClick}>
                                <style>{highlightStyles}</style> {/* Injeta o CSS do marca-texto */}
                                <MagicPremiumView article={activeArticleData} readerContent={activeReaderData} isDarkMode={isDarkMode} fontSize={fontSize} />
                            </div>
                        )}
                        
                        {viewMode === 'reader' && (
                            // Envolvemos com uma div para capturar os cliques nos spans injetados
                            <div onClick={handleContentClick}>
                                <style>{highlightStyles}</style> {/* Injeta o CSS do marca-texto */}
                                <AppleReaderView article={activeArticleData} readerContent={activeReaderData} isDarkMode={isDarkMode} fontSize={fontSize} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {isAnimationDone && !videoId && (viewMode === 'magic' || viewMode === 'reader') && (
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
                    <button onClick={() => setFontSize(s => Math.max(14, s - 2))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition active:scale-90 bg-zinc-100 dark:bg-white/5"><Minus size={16}/></button>
                    <span className="text-xs font-black w-8 text-center">{fontSize}px</span>
                    <button onClick={() => setFontSize(s => Math.min(32, s + 2))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition active:scale-90 bg-zinc-100 dark:bg-white/5"><Plus size={16}/></button>
                </div>
            )}
            
            {/* Feed Navigator */}
            {isOpen && isAnimationDone && article && feedItems && (
                <FeedNavigator article={article} feedItems={feedItems} onArticleChange={onArticleChange} isDarkMode={isDarkMode} />
            )}

            {/* Renderiza Tooltip se houver um ativo */}
            {activeTooltip && (
                <ContextTooltip 
                    data={activeTooltip} 
                    onClose={() => setActiveTooltip(null)} 
                    isDarkMode={isDarkMode} 
                />
            )}

            {/* Renderiza Gaveta se solicitado */}
            {showDrawer && analysisItems && (
                <ContextDrawer 
                    items={analysisItems} 
                    onClose={() => setShowDrawer(false)} 
                    isDarkMode={isDarkMode} 
                />
            )}

        </div>
        <style jsx="true">{`@keyframes progress-aura { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } .animate-progress-aura { animation: progress-aura 1.5s infinite linear; }`}</style>
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
function SettingsModal({ onClose, isDarkMode, feeds, setFeeds, apiKey, setApiKey, readerApiKey, setReaderApiKey, user }) {
  const [activeTab, setActiveTab] = useState(user ? 'sources' : 'account'); 
  
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
    const newFeed = { id: Date.now(), name: 'Nova Fonte', url: formattedUrl, type: feedType, category: feedType === 'podcast' ? 'Podcast' : 'Geral', display: { feed: targetFeed, banca: targetBanca } };
    setFeeds(prev => [...prev, newFeed]);
    setNewUrl(''); setTargetFeed(true); setTargetBanca(false); setFeedType('news');
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
            
       {/* ABA API (AGORA COM DUAS CHAVES) */}
            {activeTab === 'api' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                     <div className={`p-6 rounded-3xl text-center ${isDarkMode ? 'bg-zinc-900 border border-purple-500/20' : 'bg-white border border-purple-100'}`}>
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-purple-500 rounded-2xl shadow-lg shadow-purple-500/30">
                                <Sparkles size={24} className="text-white"/>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-black mb-1">Cérebro IA</h3>
                        <p className="text-xs opacity-60 mb-6">Configure chaves separadas para manter a gratuidade.</p>

                        {/* CAMPO 1: CHAVE GERAL (Feed/Briefing) */}
                        <div className="text-left mb-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1">
                                <Activity size={10}/> Chave Geral (Feed & Trends)
                            </label>
                            <input 
                                type="text" 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)} 
                                placeholder="Chave do Projeto 1..." 
                                className={`w-full px-4 py-3 mt-1 rounded-xl border font-mono text-xs outline-none transition-all ${isDarkMode ? 'bg-black/40 border-white/10 focus:border-purple-500' : 'bg-zinc-50 border-zinc-200 focus:border-purple-500'}`} 
                            />
                        </div>

                        {/* CAMPO 2: CHAVE READER (NOVO) */}
                        <div className="text-left mb-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 flex items-center gap-1">
                                <FileText size={10}/> Chave Leitor (Raio-X & Análise)
                            </label>
                            <input 
                                type="text" 
                                // ATENÇÃO: Você precisará passar 'readerApiKey' e 'setReaderApiKey' como props para o SettingsModal
                                value={readerApiKey} 
                                onChange={(e) => setReaderApiKey(e.target.value)} 
                                placeholder="Chave do Projeto 2..." 
                                className={`w-full px-4 py-3 mt-1 rounded-xl border font-mono text-xs outline-none transition-all ${isDarkMode ? 'bg-black/40 border-white/10 focus:border-blue-500' : 'bg-zinc-50 border-zinc-200 focus:border-blue-500'}`} 
                            />
                        </div>

                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-purple-500 hover:underline">
                            Gerar chaves no Google AI Studio <ArrowRight size={12}/>
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
