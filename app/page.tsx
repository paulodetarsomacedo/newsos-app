
"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js'
import { Browser } from '@capacitor/browser';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser';
import { motion, AnimatePresence } from 'framer-motion';
import * as stringSimilarity from 'string-similarity';
// --- VETRA HEURISTICS (sem IA) ---
import { generateSmartHeuristicSummary } from './lib/articleSummaryEngine';
import { generateSmartHeuristicClusters } from './lib/clusterEngine';

// Coloque suas chaves reais aqui
const supabase = createClient('https://usnhoviysiaeqcwvnhcd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbmhvdml5c2lhZXFjd3ZuaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjQ1NjksImV4cCI6MjA4MTM0MDU2OX0.7K1qfEeRZ7qrJBf0noIZJ6fkT4OMKIljgwd6r2MLUXk')
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, Play, Pause, 
  Maximize2, X, Globe, ArrowRight,
  Sun, Moon, TrendingUp, TrendingDown, CloudSun, CloudMoon, MapPin, Telescope,
  Clock, DollarSign, Bitcoin, Activity, Zap, GripVertical,
  FileText, CheckCircle, Trash2, BrainCircuit, Euro, 
  Headphones, Search, ChevronRight, Rss, Calendar as CalendarIcon, Loader2, RefreshCw, Music, Disc3, SkipBack, SkipForward, Type, ALargeSmall, Minus, Plus, PenTool, Highlighter, StickyNote, Save, Archive, Pencil, Eraser, Undo, Redo, Mail, Copy, Check, Wand2, Languages, Mic, Volume2, VolumeX, Heart, ChevronDown, History, MessageCircle, ExternalLink, ArrowUpRight, SlidersHorizontal,
} from 'lucide-react';


// --- COPIE E COLA ESSA FUNÇÃO NO TOPO DO SEU PAGE.TSX ---
const smartFeedSort = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const validItems = items.filter((item) => {
    const title = String(item?.title ?? '').trim();
    const link = String(item?.link ?? item?.url ?? '').trim();
    return title.length > 0 || link.length > 0;
  }).map((item) => ({
    ...item,
    title: String(item?.title ?? item?.summary ?? item?.link ?? 'Notícia sem título').trim(),
    source: String(item?.source ?? 'Fonte').trim(),
  }));

  // 1. Ordem inicial por data (mais recente primeiro)
  let sorted = [...validItems].sort((a, b) => {
      const timeA = (a?.rawDate && !isNaN(new Date(a.rawDate).getTime())) ? new Date(a.rawDate).getTime() : 0;
      const timeB = (b?.rawDate && !isNaN(new Date(b.rawDate).getTime())) ? new Date(b.rawDate).getTime() : 0;
      return timeB - timeA;
  });

  // 2. Remoção de duplicatas (Títulos muito parecidos), blindada contra item sem título
  const unique = [];
  const seenTitles = new Set();

  for (const item of sorted) {
      const normalizedTitle = String(item?.title ?? '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
      if (!normalizedTitle) continue;
      const titleSnippet = normalizedTitle.split(/\s+/).slice(0, 4).join(' ');
      const dedupeKey = `${String(item?.source ?? '').toLowerCase()}::${titleSnippet}`;
      if (!seenTitles.has(dedupeKey)) {
          seenTitles.add(dedupeKey);
          unique.push(item);
      }
  }

  // 3. Algoritmo Anti-Cluster (Não repetir fonte seguida)
  const spaced = [];
  let lastSource = null;
  let lastLastSource = null;

  while (unique.length > 0) {
      let foundIndex = unique.findIndex(item => item.source !== lastSource && item.source !== lastLastSource);
      if (foundIndex === -1) {
           foundIndex = unique.findIndex(item => item.source !== lastSource);
      }
      if (foundIndex === -1) {
          foundIndex = 0;
      }

      const itemToInject = unique.splice(foundIndex, 1)[0];
      spaced.push(itemToInject);

      lastLastSource = lastSource;
      lastSource = itemToInject.source;
  }

  return spaced;
};

const orderByRecency = (items) => {
  const valid = (items || []).filter(it => (String(it?.title || '').trim() || String(it?.link || it?.url || '').trim()));
  return [...valid].sort((a, b) => {
    const ta = (a?.rawDate && !isNaN(new Date(a.rawDate).getTime())) ? new Date(a.rawDate).getTime() : 0;
    const tb = (b?.rawDate && !isNaN(new Date(b.rawDate).getTime())) ? new Date(b.rawDate).getTime() : 0;
    return tb - ta;
  });
};
const dedupNearTitles = (items) => {
  const seen = new Set(); const out = [];
  for (const it of items) {
    const nt = String(it?.title || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
    if (!nt) continue;
    const snippet = nt.split(/\s+/).slice(0, 4).join(' ');
    const key = `${it?.sourceId || it?.source || ''}::${snippet}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push(it);
  }
  return out;
};
const diversifyBySource = (recencyOrdered, maxPerSource = 6) => {
  const bySource = new Map();
  for (const it of recencyOrdered) {
    const key = it?.sourceId || it?.source || 'x';
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key).push(it);
  }
  const queues = Array.from(bySource.values());
  const counts = new Map(); const out = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const q of queues) {
      if (!q.length) continue;
      const key = q[0]?.sourceId || q[0]?.source || 'x';
      const c = counts.get(key) || 0;
      if (c >= maxPerSource) { q.length = 0; continue; }
      out.push(q.shift()); counts.set(key, c + 1); progressed = true;
    }
  }
  return out;
};
const safeLower = (v: any) => String(v ?? '').toLowerCase();



const useLongPress = (onLongPress, onClick, { threshold = 400 } = {}) => {
  const timerRef = useRef();
  const isLongPress = useRef(false);

  const start = useCallback((event) => {
    // Previne o menu de contexto do navegador no desktop
    event.preventDefault(); 
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
    if (!isLongPress.current) {
      onClick(event);
    }
  }, [onClick]);
  
  // Adiciona onContextMenu para garantir o bloqueio no desktop
  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseUp: (e) => { clear(); handleClick(e); },
    onMouseLeave: () => clear(),
    onTouchEnd: (e) => { clear(); handleClick(e); },
    onContextMenu: (e) => e.preventDefault(),
  };
};


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

// ===================================================================== 
// === MARCA VETRA — ícone "V" premium (substitui o antigo "N") =========
// Glyph reutilizável (header + splash). Tile/estilo vem do componente pai.
// ===================================================================== 
const VetraMark = ({ className = "" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Vetra">
    <path d="M7 7.5 L16 24" stroke="#0a1739" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 7.5 L16 24" stroke="#2563eb" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


// Glyphs locais para evitar novas dependências/imports no arquivo grande.
const WhatsAppGlyph = ({ className = "" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="WhatsApp">
    <path d="M16 3.2c-7.05 0-12.78 5.56-12.78 12.41 0 2.19.6 4.32 1.73 6.19L3.2 28.8l7.28-1.86a13.07 13.07 0 0 0 5.52 1.23c7.05 0 12.78-5.56 12.78-12.41C28.78 8.91 23.05 3.2 16 3.2Z" fill="currentColor"/>
    <path d="M22.98 19.1c-.38 1.06-1.88 1.95-2.83 2.08-.73.1-1.68.18-4.88-1.11-4.1-1.65-6.75-5.66-6.96-5.92-.2-.25-1.66-2.13-1.66-4.06 0-1.93 1.03-2.87 1.4-3.26.37-.39.8-.49 1.06-.49h.76c.24 0 .57-.09.89.67.34.8 1.15 2.75 1.25 2.95.1.2.17.44.03.7-.13.27-.2.43-.4.67-.2.24-.42.53-.6.7-.2.2-.4.42-.17.82.24.4 1.05 1.68 2.25 2.72 1.55 1.34 2.86 1.75 3.27 1.95.41.2.65.17.9-.1.24-.27 1.03-1.17 1.3-1.57.27-.4.54-.34.92-.2.37.13 2.39 1.09 2.8 1.29.41.2.68.3.78.46.1.17.1.96-.28 2.02Z" fill="white"/>
  </svg>
);

const ScaleIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 4v15M5 7h14M7 7l-3 6h6L7 7Zm10 0-3 6h6l-3-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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
                
                // --- CORREÇÃO CRÍTICA AQUI ---
                // Trocamos o link relativo pelo link absoluto do seu site na Vercel.
                const proxyUrl = `https://newsos-app2.vercel.app/api/proxy?url=${encodeURIComponent(targetUrl)}`;
                
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error('Network err');

                // O proxy agora retorna texto, então precisamos converter para JSON.
                const textData = await res.text();
                const json = JSON.parse(textData);

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
                console.error(`Erro ao buscar ${symbol}:`, err); // Adicionado log de erro
                newData[symbol] = { val: 'err', up: false }; // Indica erro na UI
            }
        }));
        setData(prev => ({ ...prev, ...newData }));
    } catch (error) {
        console.error("Erro geral no fetch de mercado:", error);
    }
  };

// (ticker movido p/ "Mercados Hoje" — busca de mercado desativada no header)

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
    <div className="relative z-20 px-1 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1">
      {currentDate && <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={handleDateChange}
        isDarkMode={isDarkMode}
      />}

      {/* ===================================================================== */}
      {/* === HEADER GLOBAL — LIQUID GLASS NAVY PREMIUM (Vetra) =============== */}
      {/* Tokens dos prints: barra inflada (realce no topo + sheen + sombra     */}
      {/* suave); cápsulas glossy (.liquid-search-inset); keycap; PRO azul.     */}
      {/* LÓGICA PRESERVADA: busca, calendário (drag+handleDateChange),         */}
      {/* aiStatus, isLoading, onOpenSettings. Ticker removido (migra p/ Home). */}
      {/* ===================================================================== */}
      <div className="liquid-header-navy relative w-full overflow-hidden rounded-[1.9rem]">
        {/* glow decorativo interno (puramente visual) */}
        <div className="absolute -top-1/2 left-[18%] w-[40%] h-[180%] bg-blue-400/8 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative px-4 sm:px-6 py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">

          {/* ---- MARCA: ícone Vetra + nome + PRO + saudação + data ---- */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-14 h-14 rounded-[1.1rem] bg-gradient-to-br from-white to-zinc-200 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_-8px_rgba(0,0,0,0.55)] border border-white/50 shrink-0">
              <VetraMark className="w-8 h-8" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-white">Vetra</span>
                <span className="liquid-badge-pro px-2.5 py-[3px] rounded-md text-[10px] font-bold uppercase tracking-wider text-white">Pro</span>
              </div>
              {/* saudação dinâmica — MOCK nome "Tiago": trocar por user real */}
              {currentDate && (() => {
                const h = currentDate.getHours();
                const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
                const Ico = h < 18 ? Sun : Moon;
                return (
                  <span className="mt-1 text-[13px] font-semibold text-white/85 flex items-center gap-1.5">
                    <Ico size={13} className="text-amber-300" /> {g}, Tiago
                  </span>
                );
              })()}
              {/* DATA — tap abre calendário, arrasto troca o dia (lógica original) */}
              {currentDate && (
                <div
                  className="cursor-pointer select-none touch-none w-fit"
                  onMouseDown={(e) => handleDragStart(e.clientX)}
                  onMouseMove={(e) => handleDragMove(e.clientX)}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                  onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                  onTouchEnd={handleDragEnd}
                  style={{ transform: `translateX(${dragOffset}px)` }}
                >
                  <span className="text-[11px] font-medium text-white/40">{formatDate(currentDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ---- BUSCA + ASK AI (cápsula glossy, Ask AI dentro) ---- */}
          <div className="flex-1 min-w-0 w-full">
            <div className="liquid-search-inset flex items-center gap-2.5 h-14 pl-4 pr-2 rounded-2xl">
              <Search size={19} className="text-white/40 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar notícias, fontes ou tópicos..."
                className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/40 text-[15px] font-medium outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { if (onSearch) { onSearch(e.target.value); } e.target.value = ''; } }}
              />
              <span className="liquid-keycap hidden sm:flex items-center gap-1 text-[11px] font-semibold text-white/55 rounded-lg px-2 py-1 shrink-0">⌘ K</span>
              <div className="hidden sm:block w-px h-7 bg-white/12 mx-1.5 shrink-0" />
              <button onClick={triggerSearch} className="flex items-center gap-2 pl-2 pr-3.5 py-2.5 rounded-xl hover:bg-white/8 active:scale-95 transition-all shrink-0">
                <Sparkles size={19} className="text-blue-300" />
                <span className="text-[15px] font-semibold text-white">Ask AI</span>
              </button>
            </div>
          </div>

          {/* ---- STATUS DO SISTEMA + AVATAR ---- */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="liquid-search-inset hidden sm:flex items-center gap-3 h-14 px-4 rounded-2xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-bold text-white">{isLoading ? 'Sincronizando…' : 'Sistema ok.'}</span>
                <span className="text-[11px] text-white/55 truncate max-w-[150px]">{isLoading ? aiStatus : 'Todos os serviços'}</span>
              </div>
            </div>
            {/* avatar abre Configurações (onOpenSettings preservado) */}
            <button onClick={onOpenSettings} className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/15 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform shrink-0">
              <img src="https://ui-avatars.com/api/?name=Tiago&background=1e3a8a&color=fff&bold=true" className="w-full h-full object-cover" alt="User" />
            </button>
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

const NewsCard = React.memo(({ 
  news, 
  isSelected, 
  isRead, 
  isSaved, 
  isLiked, 
  isDarkMode, 
  onClick, 
  onAnalyze, 
  onSwipeLeft,
  onToggleSave, 
  onToggleLike, 
  onPlay, 
  playingAudio 
}) => {
  const [activePill, setActivePill] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const touchStart = useRef(null);
  const minSwipeDistance = 50;

  // --- LÓGICA DE KEYWORDS REFEITA E MELHORADA ---
  const generateFakeKeywords = (title) => {
    if (!title) return ['#Notícias'];

    const stopWords = new Set([
      'a', 'o', 'e', 'de', 'do', 'da', 'para', 'com', 'um', 'uma', 'os', 'as', 'que', 'em', 'no', 'na',
      'dos', 'das', 'seu', 'sua', 'mas', 'foi', 'ser', 'por', 'são', 'como', 'também', 'se', 'ao', 'à',
      'pelo', 'pela', 'suas', 'seus', 'nos', 'nas', 'este', 'esta', 'esse', 'essa', 'disse', 'afirma',
      'sobre', 'após', 'ter', 'tem', 'terá', 'pode', 'deve', 'anuncia', 'divulga', 'vai', 'está', 'era'
    ]);

    // 1. NORMALIZAÇÃO: Remove acentos e converte 'ç' para 'c', mantendo a palavra.
    const normalizedTitle = safeLower(title)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, '');

    // 2. EXTRAÇÃO E RELEVÂNCIA:
    const keywords = Array.from(new Set( // Usa Set para garantir palavras únicas
      normalizedTitle
        .split(/\s+/) // Divide em palavras
        // Filtra palavras curtas e stop words
        .filter(word => word.length >= 4 && !stopWords.has(word)) 
    ))
    // Ordena as palavras candidatas pela mais longa primeiro (maior relevância)
    .sort((a, b) => b.length - a.length); 

    // 3. SELEÇÃO E FORMATAÇÃO:
    const finalKeywords = keywords
      .slice(0, 4) // Pega as 4 mais relevantes (as mais longas)
      .map(word => `#${word}`); // Formata com hashtag

    return finalKeywords.length > 0 ? finalKeywords : ['#Notícias'];
  };
  
  // --- O RESTO DO COMPONENTE CONTINUA IGUAL ---

  const onTouchStart = (e) => {
    if (e.target.closest('button')) return; 
    if (e.touches && e.touches.length === 1) {
        touchStart.current = e.targetTouches[0].clientX;
        e.currentTarget.style.transition = 'none';
    } else {
        touchStart.current = null;
    }
  };

  const onTouchMove = (e) => {
    if (!touchStart.current || !e.targetTouches[0]) return;
    const currentX = e.targetTouches[0].clientX;
    const distance = touchStart.current - currentX;
    if (distance > 0) {
        const newX = Math.min(distance, 50); 
        setTranslateX(-newX);
    } else {
        setTranslateX(0);
    }
  };

  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    e.currentTarget.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    const touchEndClientX = e.changedTouches[0].clientX;
    const distance = touchStart.current - touchEndClientX;
    if (distance > minSwipeDistance) {
        if (onSwipeLeft) onSwipeLeft(news);
    }
    setTranslateX(0);
    touchStart.current = null;
  };
  
  const stopProp = (e) => e.stopPropagation();
  const displayTime = news.rawDate ? new Date(news.rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...';
  const isPlayable = !!news.title;
  const isCurrentPlaying = playingAudio?.id === news.id;
  const isGenerating = isCurrentPlaying && playingAudio?.isGenerating;
  const estimatedRead = Math.max(2, Math.min(Math.ceil((news.title || '').length / 25), 5)) + ' min';
  
  const fakeKeywords = generateFakeKeywords(news.title);

  const InlinePlayer = () => (
    <>
        <div className={`mt-0 border-t ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-zinc-100 bg-zinc-50'} animate-in slide-in-from-top-2 duration-300`}>
            <div className="p-4 flex items-center gap-4">
                <button onClick={(e) => { stopProp(e); onPlay(news); }} className="w-12 h-12 flex-shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    {isGenerating ? <Loader2 size={20} className="animate-spin"/> : (
                        <div className="flex gap-1 items-end h-4">
                            <div className="w-1 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]"></div>
                            <div className="w-1 bg-white animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                            <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite]"></div>
                        </div>
                    )}
                </button>
                <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Ouvindo Agora</h4>
                    <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-1/3 animate-pulse"></div>
                    </div>
                </div>
                <button onClick={(e) => { stopProp(e); onPlay(null); }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
        </div>
    </>
  );

  return (
    <div 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ 
          zIndex: isSelected ? 40 : 1,
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease' : 'none'
      }}
      onClick={() => { setActivePill('read'); onClick(news); }}
      className={`glass-card group relative cursor-pointer will-change-transform overflow-hidden ${isRead ? 'opacity-60 hover:opacity-100' : ''} ${isSelected ? 'ring-2 ring-blue-500/60' : ''}`}
    >
      {/* CARTÃO HORIZONTAL — vidro discreto (Etapa 2). Lógica/handlers preservados. */}
      <div className="flex gap-4 sm:gap-5 p-3 sm:p-4">

        {/* IMAGEM À ESQUERDA */}
        <div className="relative shrink-0 w-[34%] max-w-[230px] min-w-[110px] aspect-[4/3] rounded-[1.2rem] overflow-hidden bg-zinc-200">
          {/* Placeholder: logo da fonte num tile branco; iniciais só se o logo também falhar */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800">
            <span className="absolute text-[17px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
              {(news.source || '?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
            </span>
            {news.logo && (
              <img
                src={news.logo}
                alt=""
                className="relative w-[46%] h-[46%] object-contain rounded-2xl bg-white p-2.5 shadow-sm"
                onError={(e) => {
                  const el = e.currentTarget;
                  // logo direto falhou → tenta o favicon do domínio (fonte confiável, igual ao dropdown)
                  if (!el.dataset.logoStage) {
                    el.dataset.logoStage = 'favicon';
                    const dom = getUrlDomain(news.link || news.canonicalUrl || '');
                    if (dom && !String(el.src).includes('s2/favicons')) {
                      el.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=128`;
                      return;
                    }
                  }
                  // some e deixa as iniciais aparecerem
                  el.style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Foto real do artigo — só renderiza quando há imagem de verdade (não o logo/favicon) */}
          {(!news.img || news.img === news.logo || /s2\/favicons|ui-avatars\.com/.test(String(news.img))) ? null : (
            <img
              src={news.img}
              alt={news.title}
              loading="lazy"
              className="relative w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const el = e.currentTarget;
                // 1) tenta via proxy de imagem (contorna hotlink/referer/CORS)
                if (!el.dataset.imgStage) {
                  el.dataset.imgStage = 'proxy';
                  const raw = String(news.img || '').replace(/^https?:\/\//, '');
                  if (raw && !raw.includes('images.weserv.nl')) {
                    el.src = `https://images.weserv.nl/?url=${encodeURIComponent(raw)}&w=480&h=360&fit=cover&output=webp`;
                    return;
                  }
                }
                // 2) some e deixa o placeholder de logo aparecer
                el.style.display = 'none';
              }}
            />
          )}
          {isRead && (
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider">Lida</span>
          )}
        </div>

        {/* CONTEÚDO À DIREITA */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[17px] sm:text-[19px] font-bold leading-snug text-zinc-900 line-clamp-2 tracking-tight">
              {news.title}
            </h3>
            {/* "Deslize para resumo" → abre o GlassBrowser (mesma ação do swipe-left) */}
            <button
              onClick={(e) => { stopProp(e); if (onSwipeLeft) onSwipeLeft(news); }}
              className="hidden md:flex items-center gap-1 shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors pt-1"
            >
              <span className="text-[12px] font-medium whitespace-nowrap">Deslize para resumo</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {news.summary && (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-500 line-clamp-2">
              {news.summary}
            </p>
          )}

          <div className="mt-auto pt-3 flex items-end justify-between gap-3">
            {/* FONTE */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-11 h-11 rounded-xl bg-white border border-zinc-200/70 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#1e3a8a]">
                  {(news.source||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                </span>
                {news.logo && (
                  <img
                    src={news.logo}
                    className="relative w-full h-full object-contain p-1.5 bg-white"
                    alt=""
                    onError={(e) => {
                      const el = e.currentTarget;
                      // 1) tenta o favicon do domínio (fonte confiável — a mesma do dropdown)
                      if (!el.dataset.logoStage) {
                        el.dataset.logoStage = 'favicon';
                        const dom = getUrlDomain(news.link || news.canonicalUrl || '');
                        if (dom && !String(el.src).includes('s2/favicons')) {
                          el.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=128`;
                          return;
                        }
                      }
                      // 2) some e deixa as iniciais aparecerem
                      el.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0 text-[13px]">
                <span className="font-semibold text-zinc-700 truncate">{news.source}</span>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-400 whitespace-nowrap">{displayTime}</span>
              </div>
            </div>

            {/* AÇÕES — salvar / curtir / play (handlers originais) */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={(e)=>{ stopProp(e); onToggleSave(news); }} data-active={isSaved} className="glass-iconbtn w-10 h-10 flex items-center justify-center" aria-label="Salvar">
                <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <button onClick={(e)=>{ stopProp(e); onToggleLike(news); }} data-active={isLiked} className="glass-iconbtn w-10 h-10 flex items-center justify-center" aria-label="Curtir">
                <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
              </button>
              {isPlayable && (
                <button onClick={(e)=>{ stopProp(e); onPlay(news); }} data-active={isCurrentPlaying} className="glass-iconbtn w-10 h-10 flex items-center justify-center" aria-label="Ouvir">
                  {isGenerating ? <Loader2 size={17} className="animate-spin" /> : isCurrentPlaying ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCurrentPlaying && <InlinePlayer />}
    </div>
  );
});


// ===================================================================== //
// === VETRA REFRESH — Controlador de fases + Overlay premium ========== //
// Fases: idle | pull | searching | staging | applying | done | error    //
// Reutilizável em FeedTab e HappeningTab. Não toca em backend.          //
// ===================================================================== //
function useVetraRefreshController({ applyStaged } = {}) {
  const [phase, setPhase] = useState('idle');
  const timersRef = useRef([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn, ms) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Feedback de arraste (antes de soltar)
  const setPull = useCallback((armed) => {
    setPhase((p) => (p === 'idle' || p === 'pull') ? (armed ? 'pull' : 'idle') : p);
  }, []);

  // Executa o refresh real e caminha pelas fases visuais.
  // applyStaged é idempotente/no-op-safe: aplica staging se existir, senão ignora.
  const run = useCallback(async (task) => {
    clearTimers();
    setPhase('searching');
    // Enquanto o fetch continua, migra para "montando staging"
    schedule(() => setPhase((p) => (p === 'searching' ? 'staging' : p)), 750);
    try {
      await Promise.resolve(task && task());
      setPhase('applying');
      try { applyStaged && applyStaged(); } catch (_) {}
      schedule(() => setPhase('done'), 460);
      schedule(() => setPhase('idle'), 1500);
    } catch (err) {
      console.error('Vetra refresh falhou:', err);
      setPhase('error');
      schedule(() => setPhase('idle'), 1700);
    }
  }, [clearTimers, schedule, applyStaged]);

  const isBusy = phase === 'searching' || phase === 'staging' || phase === 'applying';
  return { phase, isBusy, setPull, run };
}

function VetraRefreshOverlay({ phase = 'idle', info = null, isDarkMode = false }) {
  if (phase === 'idle') return null;

  const MAP = {
    pull:      { title: 'Puxe para renovar',      sub: 'Solte para buscar novos sinais', icon: RefreshCw, spin: false, busy: false, tone: 'blue' },
    searching: { title: 'Buscando novos sinais',  sub: 'Consultando suas fontes',        icon: Loader2,   spin: true,  busy: true,  tone: 'blue' },
    staging:   { title: 'Montando staging',       sub: 'Organizando o que mudou',        icon: Loader2,   spin: true,  busy: true,  tone: 'blue' },
    applying:  { title: 'Aplicando atualização',  sub: 'Refinando seu feed',             icon: Sparkles,  spin: false, busy: true,  tone: 'blue' },
    done:      { title: 'Tudo atualizado',        sub: 'Seu feed está em dia',           icon: Check,     spin: false, busy: false, tone: 'emerald' },
    error:     { title: 'Não foi possível agora', sub: 'Mantivemos o feed atual',        icon: X,         spin: false, busy: false, tone: 'rose' },
  };
  const s = MAP[phase] || MAP.searching;
  const Icon = s.icon;

  const orbStyle = s.tone === 'emerald'
    ? { background: 'radial-gradient(circle at 28% 16%, rgba(255,255,255,.5), transparent 32%), linear-gradient(145deg, #34d399, #059669 60%, #047857)' }
    : s.tone === 'rose'
    ? { background: 'radial-gradient(circle at 28% 16%, rgba(255,255,255,.5), transparent 32%), linear-gradient(145deg, #fb7185, #e11d48 60%, #be123c)' }
    : undefined;

  const showInfo = (phase === 'applying' || phase === 'done') && info && info.count > 0;

  return (
    <div className="vetra-refresh-backdrop" aria-live="polite" role="status">
      <div className="vetra-refresh-overlay w-[min(22rem,calc(100vw-2rem))] flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3">
          <div className="vetra-refresh-orb shrink-0" data-busy={s.busy ? 'true' : 'false'} style={orbStyle}>
            <Icon size={22} className={s.spin ? 'animate-spin' : ''} strokeWidth={2.4} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-[15px] font-black tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {s.title}
            </div>
            <div className={`text-[12px] font-semibold truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {showInfo ? `${info.count} novos sinais de ${info.sourceCount} fontes` : s.sub}
            </div>
          </div>
        </div>
        <div className="vetra-refresh-track">
          <div className="vetra-refresh-bar" data-static={s.busy ? 'false' : 'true'} />
        </div>
      </div>
    </div>
  );
}

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
  onSwipeLeftArticle,
  openArticle, // Esta é a função que abre o painel de IA
  sourceCatalog = [],
  sourceStatusMap = {},
  sourceCacheView = {},
  onEnsureSourceLoaded,
  stagedUpdateInfo,
  onApplyStagedUpdate
}) {
  
  // Estados e lógica pertencentes APENAS ao feed
  const [category, setCategory] = useState('Tudo');
  const [srcOpen, setSrcOpen] = useState(false); // dropdown 'Todas as fontes' (Etapa 2)
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
  const introAudioRef = useRef(null);
  const outroAudioRef = useRef(null);
  const prevCategory = useRef(category);

  // Overlay premium de refresh (fases) + preview seguro dos primeiros cards
  const refreshCtl = useVetraRefreshController({ applyStaged: onApplyStagedUpdate });
  const feedPreviewActive = refreshCtl.phase === 'searching' || refreshCtl.phase === 'staging';

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
  const catalogById = useMemo(() => new Map((sourceCatalog || []).map(source => [source.id, source])), [sourceCatalog]);
  const selectedSourceMeta = sourceFilter === 'all' ? null : catalogById.get(sourceFilter);
  const sourceCatalogForCategory = useMemo(() => {
      const catalog = sourceCatalog || [];
      if (category === 'Tudo') return catalog;
      return catalog.filter(source => sourceMatchesCategory(source, category, sourceCacheView?.[source.id] || []));
  }, [sourceCatalog, category, sourceCacheView]);
  const filteredByCategory = useMemo(() => category === 'Tudo' ? safeNews : safeNews.filter(n => articleMatchesCategory(n, category)), [safeNews, category]);
 const sourceSpecificBase = useMemo(() => {
      if (sourceFilter === 'all') {
          if (category === 'Tudo') return filteredByCategory;
          // Categoria + Todas as Fontes: une os caches de TODAS as fontes da categoria
          // (não depende do realNews capado em 180). Fica igual à visão por fonte.
          const union = [];
          const seen = new Set();
          for (const src of (sourceCatalog || [])) {
              if (!sourceMatchesCategory(src, category)) continue;
              for (const it of (sourceCacheView?.[src.id] || [])) {
                  const key = it.id || it.link;
                  if (seen.has(key)) continue;
                  seen.add(key); union.push(it);
              }
          }
          return union.length > 0 ? union : filteredByCategory;
      }
      const cacheItems = sourceCacheView?.[sourceFilter] || [];
      const fromCache = category === 'Tudo' ? cacheItems : cacheItems.filter(n => articleMatchesCategory(n, category));
      if (fromCache.length > 0) return fromCache;
      return filteredByCategory.filter(n => n.sourceId === sourceFilter || n.sourceKey === sourceFilter || n.source === sourceFilter || getEditorialGroupKey(n.source, n.link) === selectedSourceMeta?.groupKey);
  }, [sourceFilter, filteredByCategory, sourceCacheView, sourceCatalog, category, selectedSourceMeta]);
  const filteredBySource = sourceSpecificBase;
const sortedFeed = useMemo(() => {
    const recency = dedupNearTitles(orderByRecency(filteredBySource));
    // Categoria específica OU fonte específica: recência pura (Bug 5).
    // "Para você" (Tudo + Todas as Fontes): diversidade por fonte com teto (Bug 2).
    const base = (category !== 'Tudo' || sourceFilter !== 'all') ? recency : diversifyBySource(recency, 6);
 // Não rebaixa mais lidas: mantém na posição e apenas esmaece o card lido (isRead no NewsCard).
    return base;
}, [filteredBySource, category, sourceFilter, readHistory]);
const uniqueNews = useMemo(() => {
      const seen = new Set();
      return sortedFeed.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
      }).slice(0, 100); 
  }, [sortedFeed]);

  useEffect(() => {
      if (sourceFilter !== 'all' && onEnsureSourceLoaded) {
          const cachedCount = sourceCacheView?.[sourceFilter]?.length || 0;
          const status = sourceStatusMap?.[sourceFilter]?.status;
          if (cachedCount < 8 && status !== 'loading') onEnsureSourceLoaded(sourceFilter);
      }
  }, [sourceFilter, sourceCacheView, sourceStatusMap, onEnsureSourceLoaded]);

const handleTouchStart = (e) => { if (feedContainerRef.current?.scrollTop <= 5 && !isRefreshing) setStartY(e.touches[0].clientY); };
  const handleTouchMove = (e) => {
    if (startY === 0 || isRefreshing || (feedContainerRef.current && feedContainerRef.current.scrollTop > 5)) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      const next = Math.min(diff * 0.45, 140);
      setPullDistance(next);
      refreshCtl.setPull(next > 70); // arma o rótulo "Solte para renovar"
    }
  };
const handleTouchEnd = async () => {
    if (pullDistance > 70) {
      setIsRefreshing(true);
      // Fecha o feedback de arraste e entrega o overlay premium ao controlador.
      setPullDistance(0); setStartY(0);
      try {
        await refreshCtl.run(() => onRefresh && onRefresh());
      } finally {
        setIsRefreshing(false);
      }
      return;
    }
    refreshCtl.setPull(false);
    setPullDistance(0); setStartY(0);
  };

  
// --- NOVA LÓGICA DE SEQUÊNCIA DE ÁUDIO (Intro -> Main -> Outro) ---
  
  // Função chamada quando o áudio principal termina
  const handleMainAudioEnded = () => {
      // Tenta tocar a vinheta de saída
      if (outroAudioRef.current) {
          outroAudioRef.current.currentTime = 0;
          outroAudioRef.current.play().catch(e => {
              console.warn("Erro ao tocar vinheta final", e);
              setLocalPlayingAudio(null); // Se falhar, reseta logo
          });
          
          // Só reseta o estado QUANDO a vinheta de saída terminar
          outroAudioRef.current.onended = () => {
              setLocalPlayingAudio(null);
              setAudioUrl('');
          };
      } else {
          // Se não tiver vinheta de saída, reseta direto
          setLocalPlayingAudio(null);
          setAudioUrl('');
      }
  };

  const handleLocalPlay = async (article) => {
    // 1. PARAR TUDO (Lógica de Stop)
    if (!article || localPlayingAudio?.id === article.id) {
        if(introAudioRef.current) { introAudioRef.current.pause(); introAudioRef.current.currentTime = 0; }
        if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if(outroAudioRef.current) { outroAudioRef.current.pause(); outroAudioRef.current.currentTime = 0; } // Parar Outro também
        
        setLocalPlayingAudio(null);
        setAudioUrl('');
        return;
    }

    // 2. INICIAR FLUXO
    setLocalPlayingAudio(article);
    setAudioUrl(''); 
    setIsGenerating(true); 

    // Toca a vinheta de ENTRADA primeiro
    if (introAudioRef.current) {
        try {
            introAudioRef.current.currentTime = 0;
            await new Promise(resolve => setTimeout(resolve, 50));
            await introAudioRef.current.play();

            // Quando a INTRO acabar -> Gera e Toca o Principal
            introAudioRef.current.onended = async () => {
                const url = await onGenerateAudio(article);
                if (url) {
                    setIsGenerating(false);
                    setAudioUrl(url); 
                } else {
                    setLocalPlayingAudio(null);
                    setIsGenerating(false);
                }
            };

        } catch (error) {
            console.warn("Falha na intro, pulando...", error);
            const url = await onGenerateAudio(article);
            if (url) {
                setIsGenerating(false);
                setAudioUrl(url);
            } else {
                setLocalPlayingAudio(null);
                setIsGenerating(false);
            }
        }
    } else {
        // Fallback sem intro
        const url = await onGenerateAudio(article);
        if (url) {
            setIsGenerating(false);
            setAudioUrl(url);
        } else {
            setLocalPlayingAudio(null);
            setIsGenerating(false);
        }
    }
  };


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
      className="feed-canvas space-y-5 animate-in slide-in-from-bottom-8 duration-500 pb-24 pt-3 min-h-screen overscroll-y-none touch-pan-y custom-scrollbar"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
    >
     {/* 1. Principal: Agora chama o handleMainAudioEnded ao acabar */}
      <audio ref={audioRef} onEnded={handleMainAudioEnded} />
      
      {/* 2. Vinhetas: Com preload para garantir que toquem rápido */}
      <audio ref={introAudioRef} src="/sounds/intro.mp3" preload="auto" />
      <audio ref={outroAudioRef} src="/sounds/end.mp3" preload="auto" />
      
      {/* ===================================================================== */}
      {/* === BARRA DE FILTROS — vidro discreto (Etapa 2) ===================== */}
      {/* LÓGICA preservada: category/setCategory + sourceFilter/setSourceFilter. */}
      {/* Substitui o rail vertical + seletor recortado pela barra horizontal.   */}
      {/* ===================================================================== */}
      <div className="px-3 sm:px-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">

          {/* Dropdown "Todas as fontes" */}
          <div className="relative shrink-0">
            <button onClick={() => setSrcOpen(o => !o)} className="glass-pill flex items-center gap-2 h-10 pl-4 pr-3 text-[13px] font-semibold">
              <span className="truncate max-w-[130px]">{sourceFilter === 'all' ? 'Todas as fontes' : (selectedSourceMeta?.name || sourceFilter)}</span>
              <ChevronDown size={15} className={`transition-transform ${srcOpen ? 'rotate-180' : ''}`} />
            </button>
            {srcOpen && (
              <>
                <div className="fixed inset-0 z-[55]" onClick={() => setSrcOpen(false)} />
                {/* SOBREPOSTO: absolute + translúcido. NÃO usar .glass-card aqui (força position:relative e empurraria o layout). */}
                <div className="absolute left-0 top-12 z-[60] w-60 max-h-72 overflow-y-auto p-1.5 rounded-2xl scrollbar-hide bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl">
                  <button onClick={() => { setSourceFilter('all'); setSrcOpen(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${sourceFilter==='all' ? 'bg-[#0a1a3d] text-white' : 'text-zinc-600 hover:bg-black/5'}`}>Todas as fontes</button>
                  {(sourceCatalogForCategory?.length ? sourceCatalogForCategory : Array.from(new Map(filteredByCategory.map(n => [n.source, { id: n.source, name: n.source, logo: n.logo, groupKey: getEditorialGroupKey(n.source, n.link) }])).values())).map(n => {
                    const status = sourceStatusMap?.[n.id]?.status;
                    const count = sourceCacheView?.[n.id]?.length || filteredByCategory.filter(item => item.sourceId === n.id || item.source === n.name || getEditorialGroupKey(item.source, item.link) === n.groupKey).length;
                    return (
                    <button key={n.id} onClick={() => { setSourceFilter(n.id); setSrcOpen(false); if (onEnsureSourceLoaded) onEnsureSourceLoaded(n.id); }} className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${sourceFilter===n.id ? 'bg-[#0a1a3d] text-white' : 'text-zinc-600 hover:bg-black/5'}`}>
                      {n.logo && <img src={n.logo} className="w-5 h-5 rounded object-cover shrink-0 bg-white" onError={(e)=>e.target.style.display='none'} alt="" />}
                      <span className="truncate flex-1">{n.name}</span>
                      <span className={`text-[10px] ${sourceFilter===n.id ? 'text-white/70' : 'text-zinc-400'}`}>{status === 'loading' ? '...' : count || '—'}</span>
                    </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pills de categoria (scroll horizontal) */}
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2.5 w-max pr-2">
              {FEED_CATEGORIES.map(cat => {
                const isAtivo = category === cat;
                const label = cat === 'Tudo' ? 'Para você' : cat;
                return (
                  <button key={cat} data-active={isAtivo} onClick={() => setCategory(cat)} className="glass-pill flex items-center gap-1.5 h-10 px-4 text-[13px] font-semibold whitespace-nowrap">
                    {cat === 'Tudo' && <Sparkles size={14} className={isAtivo ? 'text-white' : 'text-blue-500'} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão de filtros (mock visual — pronto p/ futura integração) */}
          <button className="glass-iconbtn w-10 h-10 flex items-center justify-center shrink-0" aria-label="Filtros">
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>


      {stagedUpdateInfo && (
        <div className="px-3 sm:px-5 max-w-5xl mx-auto w-full animate-in slide-in-from-top-2 fade-in duration-300">
          <button
            onClick={onApplyStagedUpdate}
            className="vetra-update-ready w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="text-blue-500 shrink-0" />
              <span className="font-black text-sm text-zinc-900 truncate">{stagedUpdateInfo.count} novas notícias de {stagedUpdateInfo.sourceCount} fontes</span>
            </span>
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">Atualizar agora</span>
          </button>
        </div>
      )}

      {sourceFilter !== 'all' && uniqueNews.length < 8 && (sourceStatusMap?.[sourceFilter]?.status === 'loading' || sourceStatusMap?.[sourceFilter]?.status === 'idle') && (
        <div className="px-3 sm:px-5 max-w-5xl mx-auto w-full">
          <div className="rounded-2xl border border-white/70 bg-white/55 backdrop-blur-xl px-4 py-3 text-sm text-zinc-500 flex items-center gap-2">
            <Loader2 size={15} className="animate-spin text-blue-500" />
            Buscando mais notícias de {selectedSourceMeta?.name || 'esta fonte'}...
          </div>
        </div>
      )}

      <div style={{ height: `${pullDistance}px`, opacity: Math.min(pullDistance / 40, 1) }} className="flex items-end justify-center overflow-hidden w-full">
         <div className={`mb-4 flex items-center gap-3 px-5 py-2 rounded-full shadow-lg border ${isDarkMode ? 'bg-zinc-800 border-purple-500/30' : 'bg-white border-purple-200'}`}>
            {isRefreshing ? <><Loader2 size={16} className="animate-spin text-purple-500" /> <span className="text-xs font-bold text-purple-500">Atualizando...</span></> : <><RefreshCw size={16} style={{ transform: `rotate(${pullDistance * 3}deg)` }} /> <span className="text-xs">{pullDistance > 70 ? 'Solte para atualizar' : 'Puxe para atualizar'}</span></>}
         </div>
      </div>
      
      {/* CARTÕES — coluna centralizada, vidro discreto */}
      <div className="flex flex-col gap-4 px-3 sm:px-5 max-w-5xl mx-auto w-full">
        {uniqueNews.length === 0 && !isLoading && <div className="text-center py-10 opacity-50"><p>Nenhuma notícia encontrada.</p></div>}
        {uniqueNews.map((news, idx) => (
          <div
            key={news.id}
            className={feedPreviewActive && idx < 36 ? 'vetra-card-preview rounded-3xl' : ''}
            style={feedPreviewActive && idx < 36 ? { animationDelay: `${Math.min(idx, 35) * 22}ms` } : undefined}
          >
            <NewsCard 
              news={news} isSelected={selectedArticleId === news.id}
              playingAudio={isGenerating ? {id: localPlayingAudio?.id, isGenerating: true} : localPlayingAudio}
              onPlay={handleLocalPlay} isRead={readHistory?.includes(news.id)}
              isSaved={savedItems?.some((item) => item.id === news.id)}
              isDarkMode={isDarkMode} onClick={onReadArticle} onAnalyze={openArticle}
              onToggleSave={onToggleSave} isLiked={likedItems?.includes(news.id)}
             onToggleLike={onToggleLike}
              onSwipeLeft={onSwipeLeftArticle} 
            />
          </div>
        ))}
      </div>

      {/* Overlay premium de refresh (fases) */}
      <VetraRefreshOverlay phase={refreshCtl.phase} info={stagedUpdateInfo} isDarkMode={isDarkMode} />
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


// --- YOUTUBE: separação rígida Shorts vs vídeos horizontais ---
// Stories usam somente Shorts; cards do feed rejeitam Shorts. Sem sinal explícito, assume vídeo normal 16:9.
const isVideoShort = (video: any) => {
  if (!video) return false;
  const link = safeLower(video?.link || video?.url || video?.externalUrl || video?.guid || '');
  const title = safeLower(video?.title || '');
  const type = safeLower(video?.type || video?.format || video?.contentType || video?.kind || '');
  const duration = Number(video?.durationSeconds || video?.duration || video?.lengthSeconds || 0);
  const width = Number(video?.width || video?.thumbnailWidth || video?.mediaWidth || 0);
  const height = Number(video?.height || video?.thumbnailHeight || video?.mediaHeight || 0);
  const hasShortUrl = link.includes('/shorts/') || link.includes('youtube.com/shorts');
  const hasShortTitle = title.includes('#shorts') || title.includes(' shorts') || title.endsWith('shorts');
  const hasShortType = type === 'short' || type === 'shorts' || type.includes('youtube-short');
  const explicitFlag = video?.isShort === true || video?.short === true || video?.storyType === 'youtube-short';
  const shortDuration = duration > 0 && duration <= 90;
  const verticalSignal = width > 0 && height > 0 && height > width * 1.15;
  return hasShortUrl || hasShortTitle || hasShortType || explicitFlag || (verticalSignal && (!duration || shortDuration));
};


// --- COMPONENTE: STORY DE YOUTUBE (V5 - COM CONTROLE DE VOLUME) ---
const YouTubeStoryModal = ({ story, onClose, onWatchVideo }) => {
    const [isMuted, setIsMuted] = useState(true); // Começa mudo para permitir autoplay
    const iframeRef = useRef(null);

    // Detecção de Short
    const isShort = useMemo(() => {
        if (!story) return false;
        const titleCheck = safeLower(story?.title).includes('#shorts');
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

// --- ABA YOUTUBE (V9 - LÓGICA DE STORIES SIMPLIFICADA E CORRIGIDA) ---

function YouTubeTab({ isDarkMode, onToggleSave, savedItems, realVideos, isLoading, onPlayVideo, seenStoryIds, onMarkAsSeen, channelFilter, setChannelFilter }) {
  const [category, setCategory] = useState('Tudo');
  
  // REMOVIDO: O estado do modal não é mais necessário
  // const [activeStory, setActiveStory] = useState(null); 
  
  const safeVideos = (realVideos && realVideos.length > 0) ? realVideos : YOUTUBE_FEED;
  const displayedVideos = useMemo(() => {
    return safeVideos.filter(v => {
        const matchesCategory = category === 'Tudo' || v.category === category || v.source === category;
        const matchesChannel = channelFilter === 'all' || (v.source === channelFilter) || (v.channel === channelFilter);
        // Separação rígida: o feed em cards só mostra vídeos horizontais/longos; Shorts ficam somente nos Stories.
        return matchesCategory && matchesChannel && !isVideoShort(v);
    });
  }, [safeVideos, category, channelFilter]);

  const channelStories = useMemo(() => {
      const byChannel = new Map();
      const sorted = [...safeVideos].sort((a, b) => new Date(b?.rawDate || 0).getTime() - new Date(a?.rawDate || 0).getTime());
      const explicitShorts = sorted.filter(isVideoShort);

      // Regra principal: Stories do YouTube recebem somente Shorts detectados.
      // Fallback seguro: se o RSS do canal não expõe metadados de Shorts, usamos apenas itens marcados
      // como verticais/short pelo parser. Não rebaixamos vídeo 16:9 para Story.
      explicitShorts.forEach(video => {
          const channelName = video.channel || video.source || 'Canal';
          if (!byChannel.has(channelName)) byChannel.set(channelName, []);
          byChannel.get(channelName).push(video);
      });

      return Array.from(byChannel.values())
        .map(items => items[0])
        .filter(Boolean)
        .filter(video => !seenStoryIds?.includes(video.id))
        .sort((a, b) => new Date(b?.rawDate || 0).getTime() - new Date(a?.rawDate || 0).getTime())
        .map(video => ({ ...video, hasNew: true, isShort: true, storyType: 'youtube-short' }));
  }, [safeVideos, seenStoryIds]);

  // LÓGICA DE STORIES SIMPLIFICADA: Marca como visto e abre o player principal DIRETAMENTE
  const handleOpenStory = (story) => {
      // 1. Marca como visto (mantém a lógica original)
      if (onMarkAsSeen) {
          onMarkAsSeen(story.id);
      }
      // 2. Chama a função principal de abrir vídeo (a mesma dos cards normais)
      if (onPlayVideo) {
          onPlayVideo(story);
      }
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
                // AQUI ESTÁ A MUDANÇA PRINCIPAL
                onClick={() => handleOpenStory(story)} 
                className="flex flex-col items-center space-y-2 snap-center cursor-pointer group flex-shrink-0 animate-in zoom-in-50 duration-300"
            >
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
        {/* ... O resto do componente (lista de vídeos) permanece exatamente o mesmo ... */}
        {displayedVideos.map((video) => {
            const isSaved = savedItems?.some(i => i.id === video.id);
            const isSeen = seenStoryIds?.includes(video.id);

            return (
                 <div 
                    key={video.id} 
                    onClick={() => onPlayVideo(video)} 
                    className={`group relative md:w-[520px] rounded-3xl overflow-hidden border shadow-lg hover:shadow-xl transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'} ${isSeen ? 'opacity-60 grayscale-[0.5]' : ''}`}
                 >
                    {/* ... conteúdo interno do card ... */}
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full p-[2px] ${isSeen ? 'bg-zinc-500' : 'bg-gradient-to-r from-red-600 to-orange-600'}`}>
                                <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                                    <img src={video.logo} className="w-full h-full object-cover rounded-full" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${video.source}&rounded=true`} />
                                </div>
                            </div>
                            <div>
                                <span className={`text-xs font-bold block ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{video.channel || video.source}</span>
                                <span className="text-[10px] uppercase font-bold text-zinc-500">
                                    {new Date(video.rawDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    <span className="mx-1 opacity-50">•</span>
                                    {new Date(video.rawDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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

      {/* REMOVIDO: O modal de story foi completamente removido daqui */}
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
// --- 1. GERAR RESUMO NEUTRO (CHIP: ENTENDA O CASO) ---
const generateNeutralSummaryForCluster = async (articles, apiKey) => {
    if (!articles || articles.length < 1 || !apiKey) return null;

    // Prepara o contexto
    const context = articles.map(a => `- ${a.title}`).slice(0, 10).join('\n');

    const prompt = `
      Você é um editor sênior imparcial. Sintetize os fatos destas manchetes em um único parágrafo explicativo.
      - Foco: O que aconteceu, Quem está envolvido, Onde e Por quê.
      - Tom: Neutro, direto e jornalístico.
      - Idioma: Português do Brasil.
      - Tamanho: Mínimo 8 frases.

      MANCHETES:
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
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Resumo indisponível.";
    } catch (error) {
        console.error("Erro resumo cluster:", error);
        return null;
    }
};

// --- 2. GERAR LINHA DO TEMPO (CHIP: LINHA DO TEMPO) ---
const generateTimelineForCluster = async (articles, apiKey) => {
    if (!articles || articles.length < 1 || !apiKey) return null;

    // Envia datas para a IA entender a cronologia
    const context = articles.map(a => `[${a.date || 'Recente'}]: ${a.title}`).slice(0, 15).join('\n');

    const prompt = `
      Analise as manchetes e crie uma Linha do Tempo Cronológica dos eventos.
      - Identifique de 3 a 5 momentos chave.
      - Para cada item, defina um "time" (ex: "Ontem", "Há 2 horas", "Início do mês") e um "event" (o que houve).
      - Ordene do mais antigo para o mais recente.
      
      RETORNE APENAS JSON:
      [
        { "time": "...", "event": "..." }
      ]

      DADOS:
      ${context}
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;
        
        // Limpeza de segurança do JSON
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Erro timeline cluster:", error);
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
        return (allNews ?? []).filter(n => {
  const title = safeLower(n?.title);
  return asset.keywords.some(k => title.includes(safeLower(k)));
}).slice(0, 4);
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


// === MARKET TICKER (Etapa 4.2) — autônomo: preços reais + faixa rolante ===
// Movido p/ "Mercados Hoje". Busca própria (mesma lógica do header antigo).
const MARKET_TICKERS = [
  { id: 'USDBRL=X', label: 'USD', icon: DollarSign },
  { id: 'EURBRL=X', label: 'EUR', icon: Euro },
  { id: 'BTC-USD',  label: 'BTC', icon: Bitcoin },
  { id: '^BVSP',    label: 'IBOV', icon: Activity },
  { id: '^IXIC',    label: 'NDX',  icon: Zap },
  { id: 'VALE3.SA', label: 'VALE3', icon: TrendingUp },
  { id: 'PETR4.SA', label: 'PETR4', icon: TrendingDown },
];

const MarketTicker = ({ isDarkMode }) => {
  const [data, setData] = useState({});
  useEffect(() => {
    let alive = true;
    const fetchMarketData = async () => {
      const symbols = ['USDBRL=X', 'EURBRL=X', 'BTC-USD', '^BVSP', '^IXIC', 'VALE3.SA', 'PETR4.SA'];
      const newData = {};
      await Promise.all(symbols.map(async (symbol) => {
        try {
          const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
          const proxyUrl = `https://newsos-app2.vercel.app/api/proxy?url=${encodeURIComponent(targetUrl)}`;
          const res = await fetch(proxyUrl);
          if (!res.ok) throw new Error('net');
          const json = JSON.parse(await res.text());
          const meta = json.chart?.result?.[0]?.meta;
          if (meta) {
            const price = meta.regularMarketPrice;
            const isUp = (price - meta.chartPreviousClose) >= 0;
            let valDisplay = '...';
            if (price) {
              valDisplay = (symbol === '^BVSP' || symbol === '^IXIC' || symbol === 'BTC-USD')
                ? (price / 1000).toFixed(1) + 'k'
                : price.toFixed(2).replace('.', ',');
            }
            newData[symbol] = { val: valDisplay, up: isUp };
          }
        } catch (e) { newData[symbol] = { val: 'err', up: false }; }
      }));
      if (alive) setData(prev => ({ ...prev, ...newData }));
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return (
    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <style>{`@keyframes mkt-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      <div className="flex w-max animate-[mkt-scroll_45s_linear_infinite] hover:[animation-play-state:paused]">
        {[...MARKET_TICKERS, ...MARKET_TICKERS, ...MARKET_TICKERS].map((t, i) => {
          const d = data[t.id];
          const up = d?.up;
          const Icon = t.icon;
          return (
            <div key={`${t.id}-${i}`} className="flex items-center gap-2 px-3.5 py-2 mx-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 shadow-sm shrink-0">
              <Icon size={13} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{t.label}</span>
              <span className="text-[11px] font-bold text-zinc-900 dark:text-white">{d?.val || '...'}</span>
              <span className={up ? 'text-emerald-500' : 'text-rose-500'}>
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// === MERCADOS HOJE — grid premium 2 colunas, sparkline, status B3 e destaque do dia ===
const MARKET_CARDS = [
  { id: '^BVSP',    label: 'IBOVESPA',  kind: 'index' },
  { id: 'USDBRL=X', label: 'DÓLAR',     kind: 'brl' },
  { id: 'EURBRL=X', label: 'EURO',      kind: 'brl' },
  { id: '^GSPC',    label: 'S&P 500',   kind: 'index' },
  { id: '^IXIC',    label: 'NASDAQ',    kind: 'index' },
  { id: 'BTC-USD',  label: 'BITCOIN',   kind: 'usd' },
  { id: 'ETH-USD',  label: 'ETHEREUM',  kind: 'usd' },
  { id: 'GC=F',     label: 'OURO',      kind: 'usd' },
  { id: 'CL=F',     label: 'PETRÓLEO',  kind: 'usd' },
  { id: 'PETR4.SA', label: 'PETR4',     kind: 'brl' },
  { id: 'VALE3.SA', label: 'VALE3',     kind: 'brl' },
  { id: 'ITUB4.SA', label: 'ITUB4',     kind: 'brl' },
];

const Sparkline = ({ points, up, uid }) => {
  if (!points || points.length < 2) return <div className="h-[38px]" />;
  const w = 100, h = 38, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const range = (max - min) || 1;
  const step = w / (points.length - 1);
  const y = (p) => (pad + (h - pad * 2) - ((p - min) / range) * (h - pad * 2));
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  const color = up ? '#10b981' : '#ef4444';
  const key = String(uid || '').replace(/[^a-z0-9]/gi, '') + (up ? 'u' : 'd');
  const fillId = 'spf' + key, strokeId = 'sps' + key;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.14" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${fillId})`} />
      <path d={d} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const isB3Open = () => {
  try {
    const sp = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const day = sp.getDay();
    const mins = sp.getHours() * 60 + sp.getMinutes();
    return day >= 1 && day <= 5 && mins >= 600 && mins < 1020;
  } catch { return false; }
};

const MarketCards = ({ isDarkMode }) => {
  const [data, setData] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [marketOpen, setMarketOpen] = useState(isB3Open());

  useEffect(() => {
    let alive = true;
    const fetchAll = async () => {
      const nd = {};
      await Promise.all(MARKET_CARDS.map(async ({ id }) => {
        try {
          const { data: json, error } = await supabase.functions.invoke('market-proxy', {
            body: { symbol: id, interval: '15m', range: '1d' }
          });
          if (error || !json) throw new Error('net');
          const r = json.chart?.result?.[0];
          const meta = r?.meta;
          const closes = (r?.indicators?.quote?.[0]?.close || []).filter(v => typeof v === 'number');
          if (meta && meta.regularMarketPrice != null) {
            const price = meta.regularMarketPrice;
            const prev = meta.chartPreviousClose || meta.previousClose || price;
            const pct = prev ? ((price - prev) / prev) * 100 : 0;
            const up = (price - prev) >= 0;
            nd[id] = { price, pct, up, spark: closes.slice(-30) };
          } else { nd[id] = null; }
        } catch { nd[id] = null; }
      }));
      if (alive) { setData(prev => ({ ...prev, ...nd })); setUpdatedAt(new Date()); setMarketOpen(isB3Open()); }
    };
    fetchAll();
    const t = setInterval(fetchAll, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const fmtVal = (id, price) => {
    const c = MARKET_CARDS.find(m => m.id === id);
    if (!c) return String(price);
    if (c.kind === 'index') return price.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    if (c.kind === 'usd') return '$ ' + price.toLocaleString('en-US', { maximumFractionDigits: price >= 100 ? 0 : 2 });
    return 'R$ ' + price.toFixed(2).replace('.', ',');
  };

  const topMover = useMemo(() => {
    let best = null;
    for (const { id } of MARKET_CARDS) {
      const d = data[id];
      if (!d) continue;
      if (!best || Math.abs(d.pct) > Math.abs(best.pct)) best = { id, ...d };
    }
    return best;
  }, [data]);

  const fmtTime = (dt) => dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${marketOpen ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10' : 'text-zinc-400 border-zinc-400/25 bg-zinc-400/10'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
          B3 {marketOpen ? 'aberta' : 'fechada'}
        </span>
        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">Atualizado {fmtTime(updatedAt)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MARKET_CARDS.map(({ id, label }) => {
          const d = data[id];
          const up = d?.up ?? true;
          const isTop = topMover && topMover.id === id && Math.abs(topMover.pct) > 0.01;
          return (
            <div key={id} className={`rounded-2xl p-4 border shadow-[0_8px_24px_-16px_rgba(15,23,42,0.35)] transition-all ${isDarkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white/85 border-white/80'} ${isTop ? (up ? 'ring-1 ring-emerald-500/40' : 'ring-1 ring-rose-500/40') : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 truncate">{label}</span>
                {isTop && <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${up ? 'text-emerald-600 bg-emerald-500/12' : 'text-rose-600 bg-rose-500/12'}`}>Destaque</span>}
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-[19px] font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                  {d ? fmtVal(id, d.price) : '—'}
                </span>
                <span className={`text-[12px] font-bold tabular-nums shrink-0 ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {d ? `${up ? '▲' : '▼'} ${up ? '+' : ''}${d.pct.toFixed(2)}%` : '...'}
                </span>
              </div>
              {/* Sparkline largo: ocupa quase toda a largura do card */}
              <div className="mt-3 w-full"><Sparkline points={d?.spark} up={up} uid={id} /></div>
            </div>
          );
        })}
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
  const title = safeLower(article?.title);
  for (const asset of assets) {
    if (asset.keywords.some(k => title.includes(safeLower(k)))) {
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



// ================================================================
// generateTrendRadar (10 TEMAS + MIX DE TEMPERATURA + NUVEM)
// ================================================================
const generateTrendRadar = async (news, apiKey) => {
  if (!news || news.length === 0) return null;

  const context = news
    .slice(0, 100)
    .map((n, index) => `${index}|${n.title}`)
    .join("\n");

  const prompt = `
Você é um Analista de Dados sênior, especialista em identificar tendências emergentes.
Você receberá uma lista de TÍTULOS de notícias (índice|título).

SUA MISSÃO EM DUAS PARTES:

PARTE 1: TENDÊNCIAS (12 TEMAS)
1. Identifique as 12 tendências mais importantes agrupando títulos semanticamente.
2. Para cada tendência, crie uma micro-manchete (campo "topic", máx 9 palavras).
3. Atribua um score de impacto de 1 a 10.
4. REGRA DE TEMPERATURA: A maioria (cerca de 8) deve ser "Quente" (score 7-10). Entretanto, você DEVE incluir obrigatoriamente pelo menos 2 tendências de impacto "Médio" e 2 tendências de impacto "Frio" (score 1-6) para representar sinais fracos ou temas em resfriamento.
5. Indique os índices das notícias que compõem a tendência no campo "source_indices".

PARTE 2: NUVEM DE PALAVRAS (20 TERMOS)
1. Extraia as 20 palavras ou termos compostos mais relevantes do momento.
Priorize termos que aparecem textualmente nos títulos, quando possível.
2. Atribua um score de "relevance" (1-10) para cada uma.

REGRAS TÉCNICAS:
- Retorne APENAS o JSON, sem textos explicativos.
- O campo "topic" nunca deve ser uma palavra única.

FORMATO DO JSON:
{
  "trends": [
    {
      "topic": "Título Dinâmico da Tendência",
      "score": 9,
      "hex": "#ef4444",
      "summary": "Resumo executivo da tendência.",
      "source_indices": [1, 4, 8]
    }
  ],
  "word_cloud": [
    { "word": "Exemplo", "relevance": 10 },
    { "word": "Termo Composto", "relevance": 5 }
  ]
}

DADOS:
${context}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok || data.error) return { trends: [], word_cloud: [] };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { trends: [], word_cloud: [] };

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(cleanText);

    return {
      trends: Array.isArray(json.trends) ? json.trends : [],
      word_cloud: Array.isArray(json.word_cloud) ? json.word_cloud : [],
    };
  } catch (error) {
    console.warn("Erro Trend Radar:", error);
    return { trends: [], word_cloud: [] };
  }
};



// ==============================================================================
// === GLASSBROWSER V7: Com Proteção Contra TypeError e Botão OK ===
// ==============================================================================
const GlassBrowser = ({ article, onClose, isDarkMode, onFetchContent, onAnalyze }) => { // onAnalyze = abre painel lateral / chat WhatsApp
  const [content, setContent] = useState(''); 
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // 1. PRIMEIRA PROTEÇÃO: Se a função não foi passada, marca erro e para.
    if (!onFetchContent || typeof onFetchContent !== 'function') {
        console.error("ERRO CRÍTICO: onFetchContent não é uma função. Verifique o NewsOS_V12.");
        setStatus('error');
        return;
    }
    if (!article?.link) { setStatus('error'); return; }

    let isMounted = true;
    const fetchContent = async () => {
        setStatus('loading');
        try {
            // 2. CHAMA A FUNÇÃO RECEBIDA POR PROP
            const resultText = await onFetchContent(article.link, article.id);

            if (resultText && resultText.length > 50) {
                setContent(resultText);
                setStatus('success');
            } else {
                throw new Error("Texto otimizado muito curto.");
            }
        } catch (error) {
            if (isMounted) {
                console.error("Erro no GlassBrowser (Fetch):", error);
                setStatus('error');
            }
        }
    };
    fetchContent();
    return () => { isMounted = false; };
  }, [article, onFetchContent]); // Depende da prop de fetch

  const openOriginal = async () => {
      try {
        // CORREÇÃO DO BOTÃO: Usamos o método mais seguro de abertura
        await Browser.open({ 
            url: article.link, 
            presentationStyle: 'fullscreen', 
            toolbarColor: isDarkMode ? '#000000' : '#FFFFFF' 
        });
        onClose();
      } catch { 
          window.open(article.link, '_blank'); 
          onClose();
      }
  };


  const openArticleChatFromGlass = () => {
      if (onAnalyze && typeof onAnalyze === 'function') {
          onAnalyze(article, { initialViewMode: 'chat', source: 'glassbrowser', openWhatsAppPanel: true });
      }
      onClose();
  };


  // RESUMO INTELIGENTE — HEURÍSTICO (sem IA).
  // Abre imediatamente com generateSmartHeuristicSummary(article) e,
  // quando o proxy-lite devolve texto (state `content`), recalcula com
  // extractedText — os containers atualizam suavemente via re-render.
  // O botão "Análise IA" continua chamando onAnalyze (fluxo intacto).
  const _gbDate = article?.rawDate ? new Date(article.rawDate) : null;
  const displayDate = _gbDate
    ? _gbDate.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const smartSummary = useMemo(() => {
    try {
      const extracted = (content && content.length > 120) ? content : undefined;
      return generateSmartHeuristicSummary(article, extracted);
    } catch (e) {
      console.error('Heurística do GlassBrowser falhou (fallback mock):', e);
      return null;
    }
  }, [article, content]);
  // (FASE 1) Mapa iconKey → ícone lucide + cor da caixa.
  const SECTION_STYLE = {
    zap:          { tile: 'bg-purple-500/15 text-purple-300',  icon: <Zap size={18} /> },
    filetext:     { tile: 'bg-blue-500/15 text-blue-300',      icon: <FileText size={18} /> },
    scale:        { tile: 'bg-blue-500/15 text-blue-300',      icon: <FileText size={18} /> },
    trendingup:   { tile: 'bg-amber-500/15 text-amber-300',    icon: <TrendingUp size={18} /> },
    clock:        { tile: 'bg-violet-500/15 text-violet-300',  icon: <Clock size={18} /> },
    telescope:    { tile: 'bg-violet-500/15 text-violet-300',  icon: <Telescope size={18} /> },
    target:       { tile: 'bg-emerald-500/15 text-emerald-300',icon: <Telescope size={18} /> },
    list:         { tile: 'bg-sky-500/15 text-sky-300',        icon: <Layers size={18} /> },
    bookmark:     { tile: 'bg-sky-500/15 text-sky-300',        icon: <Bookmark size={18} /> },
    globe:        { tile: 'bg-teal-500/15 text-teal-300',      icon: <Globe size={18} /> },
    user:         { tile: 'bg-emerald-500/15 text-emerald-300',icon: <BrainCircuit size={18} /> },
    history:      { tile: 'bg-violet-500/15 text-violet-300',  icon: <History size={18} /> },
    activity:     { tile: 'bg-rose-500/15 text-rose-300',      icon: <Activity size={18} /> },
    externallink: { tile: 'bg-zinc-500/15 text-zinc-300',      icon: <ExternalLink size={18} /> },
  };
  const styleFor = (k) => SECTION_STYLE[k] || SECTION_STYLE.filetext;

  // Prefere as seções adaptativas do motor; se não houver, usa as 5 caixas antigas.
  const SUMMARY_ROWS = (smartSummary?.sections && smartSummary.sections.length > 0)
    ? smartSummary.sections.map((s) => ({
        label: s.label,
        text: s.text,
        tile: styleFor(s.iconKey).tile,
        icon: styleFor(s.iconKey).icon,
      }))
    : [
        { label: 'Em uma frase', tile: 'bg-purple-500/15 text-purple-300', icon: <Zap size={18} />,
          text: smartSummary?.one_liner || (article?.summary ? article.summary.replace(/\.\.\.$/, '') : 'Síntese principal da notícia em uma linha objetiva.') },
        { label: 'O que aconteceu?', tile: 'bg-blue-500/15 text-blue-300', icon: <FileText size={18} />,
          text: smartSummary?.what_happened || 'Resumo factual do acontecimento central reportado pela fonte.' },
        { label: 'Por que importa?', tile: 'bg-emerald-500/15 text-emerald-300', icon: <BrainCircuit size={18} />,
          text: smartSummary?.why_it_matters || 'Contexto e relevância do tema para o leitor e para o cenário atual.' },
        { label: 'Impacto provável', tile: 'bg-amber-500/15 text-amber-300', icon: <TrendingUp size={18} />,
          text: smartSummary?.likely_impact || 'Possíveis efeitos e desdobramentos a curto e médio prazo.' },
        { label: 'O que acompanhar', tile: 'bg-violet-500/15 text-violet-300', icon: <Telescope size={18} />,
          text: smartSummary?.what_to_watch || 'Próximos passos e pontos a observar no desenrolar da história.' },
      ];
  const summaryModeLabel = smartSummary
    ? (smartSummary.quality === 'good' ? 'Resumo heurístico · contexto amplo'
      : smartSummary.quality === 'medium' ? 'Resumo heurístico'
      : 'Prévia heurística')
    : 'Geração com IA';
  const QUOTES = (smartSummary?.snippets && smartSummary.snippets.length > 0)
    ? smartSummary.snippets.slice(0, 2)
    : [
      'Trechos relevantes da reportagem aparecem aqui quando a leitura otimizada é concluída.',
      'Use "Análise IA" para uma análise aprofundada do conteúdo completo.',
    ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      {/* overlay claro e suave */}
      <div className="absolute inset-0 bg-slate-500/30 backdrop-blur-md" onClick={onClose} />

      {/* ===== MODAL — FROSTED GLASS CLARO (visual conforme print glass.png) ===== */}
      <div className="glassbrowser-shell relative w-full max-w-[1120px] h-[68vh] min-h-[520px] rounded-[1.9rem] overflow-hidden flex flex-col text-zinc-900">

        {/* HERO */}
        <div className="relative h-40 sm:h-44 shrink-0">
          <img src={article.img} className="w-full h-full object-cover" onError={(e) => (e.target.style.display='none')} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute top-4 left-5 right-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-white/70 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                <img src={article.logo} className="w-full h-full object-contain p-1.5" onError={(e) => (e.target.style.display='none')} alt="" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold text-white drop-shadow">{article.source}</span>
                  <CheckCircle size={14} className="text-blue-300" />
                </div>
                {displayDate && <span className="text-[12px] text-white/85 drop-shadow">{displayDate}</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/25 border border-white/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/45 transition-colors shrink-0"><X size={18} /></button>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-5 custom-scrollbar">
          <h2 className="mt-4 text-[22px] sm:text-[26px] font-black leading-tight tracking-tight text-zinc-900">{article.title}</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {(article.category ? [article.category, 'Análise'] : ['Notícia', 'Análise']).map((c, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-[12px] font-medium text-zinc-600 bg-white/60 border border-white/70">{c}</span>
            ))}
          </div>

          {/* RESUMO INTELIGENTE (mock visual) */}
          <div className="mt-5 rounded-2xl bg-white/55 backdrop-blur-xl border border-white/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-500" />
                <span className="text-[15px] font-bold text-zinc-900">Resumo Inteligente</span>
              </div>
              <span className="text-[11px] text-zinc-400">{summaryModeLabel}</span>
            </div>
            <div className="space-y-2">
              {SUMMARY_ROWS.map((row, i) => (
                <div key={i} className="flex gap-3 items-start rounded-xl bg-white/60 border border-white/70 p-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${row.tile}`}>{row.icon}</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-zinc-900 mb-0.5">{row.label}</div>
                    <div className="text-[13px] text-zinc-500 leading-relaxed">{row.text}</div>
                  </div>
                </div>
              ))}
            </div>
            {smartSummary?.confidence_note && (
              <div className="mt-2 text-[11px] text-zinc-400 italic px-1">{smartSummary.confidence_note}</div>
            )}
          </div>

          {/* TRECHOS RELEVANTES (heurístico com fallback) */}
          <div className="mt-4 rounded-2xl bg-white/55 backdrop-blur-xl border border-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-500 text-2xl leading-none">&ldquo;</span>
              <span className="text-[15px] font-bold text-zinc-900">Trechos relevantes</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {QUOTES.map((q, i) => (
                <div key={i} className="rounded-xl bg-white/60 border border-white/70 p-3 text-[13px] italic text-zinc-600 leading-relaxed">{q}</div>
              ))}
            </div>
          </div>

          {/* estado real do fetch (discreto) — sem subcontainer "Leitura otimizada" */}
          {status === 'loading' && (
            <div className="mt-4 flex items-center gap-2 text-zinc-400 text-[12px]"><Loader2 size={14} className="animate-spin" /> Otimizando leitura…</div>
          )}
          {status === 'error' && (
            <div className="mt-4 text-zinc-400 text-[12px]">Não foi possível otimizar o conteúdo. Use &ldquo;Ler no site&rdquo;.</div>
          )}
        </div>

        {/* RODAPÉ — Ler no site (real) / Análise IA (abre painel lateral) / Chat (mock) */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-white/50 flex flex-col sm:flex-row gap-3">
          <button onClick={openOriginal} className="flex-1 h-12 rounded-xl bg-white/60 border border-white/70 text-zinc-700 text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-white/80 transition"><ExternalLink size={16} /> Ler no site</button>
          <button onClick={() => { if (onAnalyze) onAnalyze(article); onClose(); }} className="flex-1 h-12 rounded-xl liquid-button text-[13px] font-semibold flex items-center justify-center gap-2"><Sparkles size={16} /> Análise IA</button>
          <button onClick={openArticleChatFromGlass} className="flex-1 h-12 rounded-xl vetra-whatsapp-glass-button text-[13px] font-bold flex items-center justify-center gap-2"><WhatsAppGlyph className="w-5 h-5" /> Chat com a notícia</button>
        </div>
      </div>
    </div>
  );
};




const SmartDigestWidget = ({ newsData, getApiKey, isDarkMode, refreshTrigger, openArticle }) => {
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
              onFetchContent={fetchOptimizedContent}
              onAnalyze={openArticle}
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

const generateHeuristicClusters = (news) => {
    if (!news || news.length < 5) return [];

    // --- CONFIGURAÇÕES DE QUALIDADE PERCEBIDA ---
    const SOURCE_WEIGHTS = { 'G1': 3, 'CNN Brasil': 3, 'O Globo': 2.5, 'Band': 2, 'Estadão': 2, 'Folha de S.Paulo': 2, 'Jovem Pan': 1.5, 'Metropoles': 1.5, };
    const DEFAULT_WEIGHT = 1;
    const IMAGE_PREFERRED_SOURCES = new Set(['Extra','CNN Brasil', 'Band', 'O Globo', 'Veja', 'Jovem Pan', 'Metropoles', 'SBT News', 'Times Brasil', 'Estadao', 'Fox News', '180graus']);
    const IMAGE_BLOCKED_SOURCES = new Set(['ISTOÉ', 'ISTOÉ DINHEIRO', 'UOL Economia', 'Estadão E-Investidor', 'F5', 'UOL', 'Folha de S.Paulo', 'Investing', 'E-Investidor', 'UOL Noticias', 'Money Times', 'Estadão | As Últimas Notícias', 'G1', 'UOL NOTICIAS', 'Valor Investe', 'UOL ECONOMIA']);
    const SIMILARITY_THRESHOLD = 0.58;
    const CLUSTER_LIMIT = 5;

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
            let threshold = SIMILARITY_THRESHOLD;
            if (currentCluster.sourcesInCluster.has(articles[j].source)) {
                threshold = 0.85;
            }
            if (similarity >= threshold) {
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
        const impactScore = cluster.related_articles.length * sourceImpact * uniqueSources.size;
        return { ...cluster, impactScore };
    });

    const topClusters = scoredClusters.sort((a, b) => b.impactScore - a.impactScore).slice(0, CLUSTER_LIMIT);

    const finalClusters = topClusters.map(cluster => {
        let bestArticleForTitle = cluster.related_articles[0];
        let maxCentrality = 0;
        cluster.related_articles.forEach(articleA => {
            let currentCentrality = 0;
            cluster.related_articles.forEach(articleB => {
                if (articleA.id !== articleB.id) {
                    currentCentrality += stringSimilarity.compareTwoStrings(articleA.title, articleB.title);
                }
            });
            if (currentCentrality > maxCentrality) {
                maxCentrality = currentCentrality;
                bestArticleForTitle = articleA;
            }
        });

        const hasRealImageUrl = (url) => url && /\.(jpg|jpeg|png|webp)/i.test(url) && !url.includes('ui-avatars.com');
        const imageCandidates = cluster.related_articles.filter(a => !IMAGE_BLOCKED_SOURCES.has(a.source) && hasRealImageUrl(a.img));
        let representativeArticleForImage = imageCandidates.find(a => IMAGE_PREFERRED_SOURCES.has(a.source)) || imageCandidates[0] || bestArticleForTitle;

        const extractKeyEntities = (articles) => {
            const wordFrequency = {};
            const stopWords = new Set(['a', 'o', 'e', 'de', 'do', 'da', 'para', 'com', 'um', 'uma', 'os', 'as', 'que', 'em', 'no', 'na', 'dos', 'das', 'seu', 'sua']);
            articles.forEach(article => {
                const words = article.title.match(/\b[A-Z][a-zà-úA-Z]{2,}\b/g) || [];
                words.forEach(word => {
                    const cleanWord = word.toLowerCase();
                    if (!stopWords.has(cleanWord)) {
                        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                    }
                });
            });
            return Object.keys(wordFrequency).sort((a, b) => wordFrequency[b] - wordFrequency[a]).slice(0, 3);
        };

        const keyEntities = extractKeyEntities(cluster.related_articles);
        const uniqueSourcesCount = new Set(cluster.related_articles.map(a => a.source)).size;
        const baseSummary = stripTags(bestArticleForTitle.summary || '').slice(0, 150);
        let summaryText = baseSummary || `Cobertura acompanhada por ${uniqueSourcesCount} fontes, com atualizações cruzadas e sinais de consenso editorial.`;
        if (keyEntities.length > 0 && !baseSummary) {
            summaryText += ` Termos centrais: ${keyEntities.join(', ')}.`;
        }

        const sortedArticles = cluster.related_articles.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

        return {
            clusterId: getClusterFingerprint(sortedArticles, bestArticleForTitle.title),
            ai_title: bestArticleForTitle.title,
            ai_summary: summaryText,
            representative_image: representativeArticleForImage.img,
            related_articles: sortedArticles,
            keyEntities: keyEntities,
        };
    });

    return finalClusters;
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



const WhileYouWereAwaySkeleton = ({ isDarkMode }) => {
  return (
    <div className="relative p-2">
      <style jsx="true">{` @keyframes shimmer { 100% { transform: translateX(100%); } } .animate-shimmer::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.05) 20%, rgba(255, 255, 255, 0.2) 60%, rgba(255, 255, 255, 0) 100%); animation: shimmer 2s infinite; } `}</style>
      <div className={`w-full h-[535px] rounded-2xl overflow-hidden flex flex-col p-6 relative animate-shimmer ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-200'}`}>
        <div className={`absolute top-0 left-0 right-0 h-52 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
        <div className="relative z-10 mt-56">
          <div className={`h-8 w-3/4 rounded-lg mb-4 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
          <div className={`h-8 w-1/2 rounded-lg mb-6 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
          <div className="flex items-start gap-3">
            <div className={`w-1 h-12 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
            <div className="space-y-2 flex-1">
              <div className={`h-4 w-full rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
              <div className={`h-4 w-5/6 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-auto pt-6">
            <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
            <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
            <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================================
// === WIDGET DE CLUSTER FINAL (Carrossel + Imagem Grande + Chips + Logos Bonitos) ===
// ==============================================================================

// ==============================================================================
// === WIDGET DE CLUSTER FINAL (Carrossel + Imagem Grande + Chips + Logos Bonitos) ===
// ==============================================================================



const normalizeClusterArticles = (cluster) => {
  const articles = Array.isArray(cluster?.related_articles) ? cluster.related_articles.filter(Boolean) : [];
  return [...articles].sort((a, b) => {
    const timeA = a?.rawDate ? new Date(a.rawDate).getTime() : 0;
    const timeB = b?.rawDate ? new Date(b.rawDate).getTime() : 0;
    return timeB - timeA;
  });
};

const getClusterSources = (cluster) => {
  const seen = new Set();
  return normalizeClusterArticles(cluster).reduce((acc, article) => {
    const name = article?.source || article?.channel || 'Fonte';
    if (!seen.has(name)) {
      seen.add(name);
      acc.push({ name, logo: article?.logo, article });
    }
    return acc;
  }, []);
};

const getClusterConsensus = (cluster) => {
  const sources = getClusterSources(cluster).length;
  const articles = normalizeClusterArticles(cluster).length;
  return Math.max(58, Math.min(88, 50 + sources * 5 + articles * 2));
};

const stripClusterText = (value) => String(value || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

const getClusterMeta = (cluster) => {
  const articles = normalizeClusterArticles(cluster);
  const sources = getClusterSources(cluster);
  const latest = articles[0];
  const title = stripClusterText(cluster?.ai_title || latest?.title || 'Caso em foco');
  const rawSummary = stripClusterText(cluster?.ai_summary || latest?.summary || 'Cobertura agrupada a partir das fontes monitoradas pelo Vetra.');
  const summary = rawSummary.length > 210 ? `${rawSummary.slice(0, 207)}...` : rawSummary;
  const image = cluster?.representative_image || latest?.img || 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1600&q=85';
  const latestTime = latest?.rawDate ? new Date(latest.rawDate) : null;
  const consensus = getClusterConsensus(cluster);
  const category = cluster?.category || latest?.category || (title.toLowerCase().includes('ia') ? 'Tecnologia e política' : title.toLowerCase().includes('energia') ? 'Economia e meio ambiente' : 'Caso em foco');
  return { articles, sources, latest, title, summary, image, latestTime, consensus, category };
};

const formatClusterClock = (date) => {
  if (!date) return 'Agora';
  try { return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return 'Agora'; }
};

const formatClusterRecency = (date) => {
  if (!date) return 'agora';
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const getClusterInitials = (name = '') => {
  const clean = String(name || '?').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return (parts.length ? parts.slice(0, 2).map(w => w[0]).join('') : '?').toUpperCase();
};

function ClusterSourceAvatar({ source, index = 0, compact = false }) {
  const initials = getClusterInitials(source?.name);
  const gradients = [
    'linear-gradient(145deg,#061138,#132b69)',
    'linear-gradient(145deg,#075db9,#2f8cf1)',
    'linear-gradient(145deg,#e04400,#ff8a25)',
    'linear-gradient(145deg,#2e6b10,#75b82a)',
    'linear-gradient(145deg,#5f2bb8,#9b5cff)',
    'linear-gradient(145deg,#00796b,#14b8a6)',
  ];
  return (
    <div
      className={`vetra-source-orb ${compact ? 'is-compact' : ''}`}
      title={source?.name}
    >
      <div className="vetra-source-orb-inner" style={{ background: gradients[index % gradients.length] }}>
        {source?.logo ? (
          <img src={source.logo} alt={source.name || 'Fonte'} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );
}

function ClusterMetricBadge({ icon, label, tone = 'dark' }) {
  return <span className={`vetra-cluster-badge ${tone}`}>{icon}{label}</span>;
}

function ClusterTabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`vetra-cluster-tab ${active ? 'is-active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ClusterCaseHeader({ meta, sources, onClose }) {
  return (
    <>
      <div className="vetra-case-breadcrumb">
        <button onClick={onClose} className="vetra-case-back"><ChevronLeft size={18}/></button>
        <span>Clusters</span><ChevronRight size={14}/><span>Caso em Foco</span>
      </div>

      <div className="vetra-case-hero">
        <div className="vetra-case-hero-image-wrap">
          <img src={meta.image} className="vetra-case-hero-image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <ClusterMetricBadge tone="hot" icon={<Activity size={14}/>} label="Assunto quente" />
        </div>
        <div className="vetra-case-hero-content">
          <h2>{meta.title}</h2>
          <div className="vetra-case-hero-meta">
            <span>{sources.length} fontes</span><span>•</span><span>últimas {formatClusterRecency(meta.latestTime)}</span><span>•</span><b>assunto quente</b>
          </div>
          <div className="vetra-case-source-row">
            {sources.slice(0, 4).map((source, i) => <ClusterSourceAvatar key={source.name} source={source} index={i} />)}
            {sources.length > 4 && <span className="vetra-plus-orb">+{sources.length - 4}</span>}
          </div>
        </div>
      </div>
    </>
  );
}

function ClusterFooterSources({ sources, openArticle }) {
  return (
    <div className="vetra-case-footer-row">
      <div className="vetra-case-footer-title"><Rss size={17}/> Fontes que mais abordam</div>
      <div className="vetra-case-footer-pills">
        {sources.slice(0, 5).map((source, i) => (
          <button key={source.name} onClick={() => source.article && openArticle(source.article)} className="vetra-source-pill">
            <ClusterSourceAvatar source={source} index={i} compact />
            <span><b>{source.name}</b><small>{Math.max(4, 12 - i * 2)} menções</small></span>
          </button>
        ))}
        <button className="vetra-source-pill is-more"><span><b>Ver todas</b><small>{sources.length} fontes</small></span></button>
      </div>
    </div>
  );
}

function MiniWatchList() {
  const rows = [
    { icon: <Globe size={17}/>, text: 'Votação e possíveis mudanças', tag: 'Hoje', tone: 'blue' },
    { icon: <TrendingUp size={17}/>, text: 'Reação do mercado e do câmbio', tag: '24h', tone: 'green' },
    { icon: <Layers size={17}/>, text: 'Posicionamento das lideranças', tag: '48h', tone: 'purple' },
  ];
  return (
    <div className="vetra-watch-list">
      {rows.map((row, i) => (
        <div className="vetra-watch-row" key={i}>
          <span className={`watch-icon ${row.tone}`}>{row.icon}</span>
          <span>{row.text}</span>
          <b className={row.tone}>{row.tag}</b>
        </div>
      ))}
    </div>
  );
}

function ClusterCaseModal({ cluster, onClose, openArticle, getApiKey, isDarkMode }) {
  const [tab, setTab] = useState(cluster?.__startTab || 'overview');
  const [aiXray, setAiXray] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const meta = useMemo(() => getClusterMeta(cluster), [cluster]);
  const sources = meta.sources;
  const articles = meta.articles;

  const timeline = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(a?.rawDate || 0).getTime() - new Date(b?.rawDate || 0).getTime())
      .slice(0, 6)
      .map((article, idx) => ({
        time: formatClusterClock(article?.rawDate),
        source: article?.source || 'Fonte',
        title: article?.title || 'Atualização do caso',
        summary: stripClusterText(article?.summary || meta.summary),
        logo: article?.logo,
        article,
        index: idx,
      }));
  }, [articles, meta.summary]);

  const divergenceRows = [
    { label: 'Impacto de curto prazo', level: 'Alta', values: ['hot','hot','hot','high'] },
    { label: 'Efeito sobre mercado e opinião pública', level: 'Alta', values: ['mid','hot','hot','empty'] },
    { label: 'Benefícios sociais e redistribuição', level: 'Média', values: ['soft','mid','empty','empty'] },
    { label: 'Viabilidade política e institucional', level: 'Média', values: ['soft','mid','good','empty'] },
    { label: 'Riscos de longo prazo', level: 'Baixa', values: ['good','mid','empty','empty'] },
  ];

  const runXray = async () => {
    const apiKey = getApiKey?.('widgets') || getApiKey?.('analysis');
    if (!apiKey) {
      setAiXray({
        headline: 'Raio-X em modo local',
        bullets: [
          `O caso reúne ${sources.length} fontes e ${articles.length} publicações correlacionadas.`,
          `Consenso estimado em ${meta.consensus}% sobre o núcleo factual da cobertura.`,
          'As divergências aparecem principalmente na interpretação de impacto, ritmo e consequências.',
          'Acompanhe novas fontes para detectar mudança de enquadramento nas próximas horas.',
        ]
      });
      return;
    }
    setAiLoading(true);
    try {
      const context = articles.slice(0, 12).map((a, i) => `${i + 1}. ${a.source}: ${a.title}`).join('\n');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analise este cluster de notícias em português. Retorne JSON estrito com headline e 4 bullets objetivos.\n${context}` }] }],
          generationConfig: { response_mime_type: 'application/json', temperature: 0.25 }
        })
      });
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = raw ? JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()) : null;
      setAiXray(parsed || { headline: 'Raio-X indisponível', bullets: ['Não foi possível gerar a análise agora.'] });
    } catch (e) {
      setAiXray({ headline: 'Raio-X indisponível', bullets: ['A análise por IA falhou. Tente novamente depois.'] });
    }
    setAiLoading(false);
  };

  const centralParagraphs = [
    meta.summary,
    `A cobertura reúne ${sources.length} fontes e ${articles.length} matérias relacionadas, com consenso estimado em ${meta.consensus}% sobre o núcleo factual do caso.`,
    'O Vetra destaca o que é fato central, onde as fontes divergem e quais movimentos devem ser acompanhados nas próximas horas.',
  ];

const renderOverview = () => (
    <div className="flex flex-col gap-4">
      {/* 1. O Novo Resumo Premium do Caso (20s) */}
      <div className={`p-5 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
        <div className="flex items-center gap-2 mb-2 opacity-80">
          <Sparkles size={16} className="text-indigo-500" />
          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-500">Resumo do caso em 20 segundos</span>
        </div>
        <p className={`text-[15px] font-semibold leading-relaxed ${isDarkMode ? 'text-indigo-100' : 'text-indigo-950'}`}>
          {meta.summary}
        </p>
      </div>

      <div className="vetra-case-overview-grid">
        <div className="vetra-case-card fact-card">
          <div className="case-card-title"><Telescope size={20}/> O fato central</div>
          <div className="case-paragraphs">{centralParagraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
        </div>

        {/* 2. Fonte Líder Premium */}
        <div className="vetra-case-card">
          <div className="case-card-title"><Activity size={19} className="text-orange-500" /> Fonte Líder & Cobertura</div>
          <div className="space-y-4 mt-5">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Primeiro sinal</span>
              <span className="text-[12px] font-bold flex items-center gap-2">
                <img src={sources[0]?.logo || "https://logodownload.org/wp-content/uploads/2016/10/g1-logo-0.png"} className="w-5 h-5 rounded bg-white object-contain" /> {sources[0]?.name || 'G1'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Mais contexto</span>
              <span className="text-[12px] font-bold flex items-center gap-2">
                <img src={sources[1]?.logo || "https://www.google.com/s2/favicons?domain=valor.globo.com&sz=128"} className="w-5 h-5 rounded bg-white object-contain" /> {sources[1]?.name || 'Valor'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Visual & Análise</span>
              <span className="text-[12px] font-bold flex items-center gap-2">
                <img src={sources[2]?.logo || "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/CNN_Brasil.svg/1280px-CNN_Brasil.svg.png"} className="w-5 h-5 rounded bg-white object-contain" /> {sources[2]?.name || 'CNN Brasil'}
              </span>
            </div>
          </div>
        </div>

        <div className="vetra-case-card consensus-card">
          <div className="case-card-title"><CheckCircle size={19}/> Consenso entre fontes</div>
          <div className="consensus-number">{meta.consensus}%</div>
          <p>das fontes concordam sobre os objetivos e o impacto principal do caso.</p>
          <div className="consensus-bar"><span className="ok"/><span className="warn"/><span className="hot"/><span className="soft"/></div>
        </div>
        <div className="vetra-case-card watch-card">
          <div className="case-card-title"><Telescope size={19}/> O que acompanhar</div>
          <MiniWatchList />
        </div>
      </div>
    </div>
  );

  const renderPerspectives = () => (
    <div className="vetra-case-two-col">
      <div className="vetra-case-card">
        <div className="case-card-title"><Layers size={20}/> Perspectivas da cobertura <small>Índice de alinhamento</small></div>
        <div className="perspective-list">
          {sources.slice(0, 6).map((source, i) => (
            <button key={source.name} onClick={() => source.article && openArticle(source.article)} className="perspective-row">
              <ClusterSourceAvatar source={source} index={i} compact />
              <span><b>{source.name} — foco {i % 3 === 0 ? 'econômico' : i % 3 === 1 ? 'político' : 'social'}</b><small>{source.article?.title}</small></span>
              <em>{Math.max(54, meta.consensus - i * 6)}%</em>
            </button>
          ))}
        </div>
      </div>
      <div className="vetra-case-card">
        <div className="case-card-title"><ScaleIcon className="w-5 h-5"/> Diferenças de cobertura <small>Baixa divergência • Alta divergência</small></div>
        <div className="divergence-list">{divergenceRows.map((row, i) => <DivergenceRow key={i} row={row} />)}</div>
      </div>
      <div className="vetra-case-card read-card">
        <div className="case-card-title"><Zap size={19}/> Leituras do tema</div>
        <div className="reading-list">
          <p><Sparkles size={17}/> Predomínio de análises factuais nas primeiras horas de cobertura.</p>
          <p><Layers size={17}/> Divergência moderada sobre impactos e distribuição de efeitos.</p>
          <p><CheckCircle size={17}/> Consenso razoável sobre a necessidade de acompanhamento contínuo.</p>
        </div>
      </div>
      <div className="vetra-case-card watch-card compact">
        <div className="case-card-title"><Telescope size={19}/> O que acompanhar</div>
        <MiniWatchList />
      </div>
    </div>
  );

  const renderDifferences = () => (
    <div className="vetra-case-two-col emphasize-differences">
      <div className="vetra-case-card">
        <div className="case-card-title"><ScaleIcon className="w-5 h-5"/> Matriz de divergência editorial</div>
        <div className="divergence-list large">{divergenceRows.map((row, i) => <DivergenceRow key={i} row={row} />)}</div>
      </div>
      <div className="vetra-case-card">
        <div className="case-card-title"><BrainCircuit size={20}/> Onde as fontes mudam o enquadramento</div>
        <div className="difference-notes">
          <p><b>Ênfase econômica:</b> fontes priorizam impacto, custo e reação de mercado.</p>
          <p><b>Ênfase política:</b> foco em negociação, tramitação e resistência institucional.</p>
          <p><b>Ênfase social:</b> atenção a grupos afetados e consequências práticas.</p>
          <p><b>Consenso:</b> o fato central é estável, mas a leitura de consequência ainda varia.</p>
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="vetra-case-timeline-grid">
      <div className="vetra-case-card timeline-card">
        <div className="case-card-title">Linha do tempo</div>
        <div className="timeline-list">
          {timeline.map((item, i) => (
            <button key={`${item.title}-${i}`} onClick={() => item.article && openArticle(item.article)} className="timeline-item">
              <span className="timeline-dot" />
              <time>{item.time}</time>
              <ClusterSourceAvatar source={{ name: item.source, logo: item.logo }} index={i} compact />
              <span><b>{item.title}</b><small>{item.summary}</small></span>
            </button>
          ))}
        </div>
      </div>
      <div className="vetra-case-card timeline-sources-card">
        <div className="case-card-title">Fontes</div>
        <div className="source-table">
          {articles.slice(0, 6).map((article, i) => (
            <button key={article.id || i} onClick={() => openArticle(article)} className="source-table-row">
              <ClusterSourceAvatar source={{ name: article.source, logo: article.logo }} index={i} />
              <b>{article.source}</b><time>{formatClusterClock(article.rawDate)}</time><span>{article.title}</span><em>Abrir <ExternalLink size={16}/></em>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="vetra-case-card sources-full-card">
      <div className="case-card-title"><FileText size={20}/> Fontes do caso</div>
      <div className="sources-grid">
        {articles.map((article, i) => (
          <button key={article.id || i} onClick={() => openArticle(article)} className="source-detail-card">
            <ClusterSourceAvatar source={{ name: article.source, logo: article.logo }} index={i} />
            <span><b>{article.source}</b><small>{formatClusterClock(article.rawDate)}</small></span>
            <p>{article.title}</p>
            <em>Abrir fonte <ArrowUpRight size={15}/></em>
          </button>
        ))}
      </div>
    </div>
  );

  const renderXray = () => (
    <div className="vetra-case-card xray-card">
      <div className="case-card-title"><Sparkles size={20}/> Raio-X IA</div>
      {!aiXray && (
        <div className="xray-empty">
          <div className="xray-orb"><Sparkles size={34}/></div>
          <h3>Gerar leitura editorial do caso</h3>
          <p>A IA resume consenso, divergências, sinais fracos e próximos pontos de atenção sem substituir a leitura das fontes.</p>
          <button onClick={runXray} disabled={aiLoading} className="vetra-ai-gradient-button">{aiLoading ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} Gerar Raio-X com IA</button>
        </div>
      )}
      {aiXray && (
        <div className="xray-result">
          <h3>{aiXray.headline}</h3>
          <ul>{(aiXray.bullets || []).map((b, i) => <li key={i}>{b}</li>)}</ul>
          <button onClick={runXray} disabled={aiLoading} className="vetra-ai-gradient-button small">{aiLoading ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>} Atualizar análise</button>
        </div>
      )}
    </div>
  );

  const renderTab = () => {
    if (tab === 'overview') return renderOverview();
    if (tab === 'perspectives') return renderPerspectives();
    if (tab === 'differences') return renderDifferences();
    if (tab === 'timeline') return renderTimeline();
    if (tab === 'sources') return renderSources();
    return renderXray();
  };

  return (
    <div className="fixed inset-0 z-[9998] p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-100/78 backdrop-blur-xl" onClick={onClose} />
      <div className="vetra-case-shell relative mx-auto h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2.5rem)] max-w-[1540px] overflow-hidden rounded-[2.05rem] flex flex-col">
        <div className="vetra-case-scroll custom-scrollbar">
          <ClusterCaseHeader meta={meta} sources={sources} onClose={onClose} />
          <div className="vetra-tabs-wrap">
            <ClusterTabButton label="Visão Geral" icon={<LayoutGrid size={18}/>} active={tab === 'overview'} onClick={() => setTab('overview')} />
            <ClusterTabButton label="Perspectivas" icon={<Layers size={18}/>} active={tab === 'perspectives'} onClick={() => setTab('perspectives')} />
            <ClusterTabButton label="Diferenças" icon={<ScaleIcon className="w-[18px] h-[18px]"/>} active={tab === 'differences'} onClick={() => setTab('differences')} />
            <ClusterTabButton label="Linha do Tempo" icon={<History size={18}/>} active={tab === 'timeline'} onClick={() => setTab('timeline')} />
            <ClusterTabButton label="Fontes" icon={<FileText size={18}/>} active={tab === 'sources'} onClick={() => setTab('sources')} />
            <ClusterTabButton label="Raio-X IA" icon={<Sparkles size={18}/>} active={tab === 'xray'} onClick={() => setTab('xray')} />
          </div>
          <div className="vetra-case-body">{renderTab()}</div>
          <div className="vetra-case-footer">
            <ClusterFooterSources sources={sources} openArticle={openArticle} />
            <button onClick={runXray} className="vetra-ai-gradient-button footer"><Sparkles size={21}/> Gerar Raio-X com IA</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DivergenceRow({ row }) {
  return (
    <div className="divergence-row">
      <span>{row.label}</span>
      <div className="divergence-meter">
        {row.values.map((v, i) => <i key={i} className={v} />)}
      </div>
      <em className={row.level === 'Alta' ? 'high' : row.level === 'Média' ? 'mid' : 'low'}>{row.level}</em>
    </div>
  );
}


const VetraStableClusterImage = React.memo(function VetraStableClusterImage({ src, alt = '' }) {
  const initialSrc = String(src || '').trim();
  const [imageSrc, setImageSrc] = useState(initialSrc);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(!initialSrc);

  useEffect(() => {
    const nextSrc = String(src || '').trim();
    if (!nextSrc) {
      setImageSrc('');
      setHasLoaded(false);
      setHasError(true);
      return;
    }
    if (nextSrc !== imageSrc) {
      setImageSrc(nextSrc);
      setHasLoaded(false);
      setHasError(false);
    }
  }, [src, imageSrc]);

  return (
    <div className="vetra-stable-cluster-image" aria-hidden="true">
      <div className="vetra-stable-cluster-fallback" data-visible={hasError || !imageSrc ? 'true' : 'false'} />
      {imageSrc && !hasError && (
        <img
          src={imageSrc}
          alt={alt}
          draggable={false}
          decoding="async"
          loading="eager"
          onLoad={() => setHasLoaded(true)}
          onError={() => {
            setHasError(true);
            setHasLoaded(false);
          }}
          data-loaded={hasLoaded ? 'true' : 'false'}
        />
      )}
    </div>
  );
});

const VetraPremiumClusterCard = React.memo(function VetraPremiumClusterCard({ cluster, index, onOpenCluster }) {
  const meta = useMemo(() => getClusterMeta(cluster), [cluster]);
  const isFeatured = index === 0;
  return (
    <button
      data-cluster-index={index}
      onClick={() => onOpenCluster(cluster)}
      className={`vetra-premium-cluster-card ${isFeatured ? 'is-featured' : ''} group`}
      aria-label={`Abrir caso: ${meta.title}`}
    >
      <VetraStableClusterImage src={meta.image} alt="" />
      <div className="premium-cluster-vignette" />
      <div className="premium-cluster-sheen" />

      <div className="premium-cluster-topbar">
        <ClusterMetricBadge tone="consensus" icon={<CheckCircle size={15}/>} label={`${meta.consensus}% consenso`} />
        {isFeatured && <ClusterMetricBadge tone="hot" icon={<Activity size={15}/>} label="Assunto quente" />}
      </div>

      <div className="premium-cluster-body">
        <span className="case-chip">{meta.category || 'Caso em foco'}</span>
        <h2>{meta.title}</h2>
        <p>{meta.summary}</p>

        <div className="premium-cluster-meta-row">
          <div className="main-cluster-sources">
            {meta.sources.slice(0,4).map((source, i) => <ClusterSourceAvatar key={source.name} source={source} index={i} />)}
            {meta.sources.length > 4 && <span className="vetra-plus-orb dark">+{meta.sources.length - 4}</span>}
          </div>
          <span className="open-case-button">Abrir caso <ArrowUpRight size={18}/></span>
        </div>

        <div className="premium-cluster-insight">
          <Sparkles size={18}/>
          <span>{meta.sources.length} fontes · últimas {formatClusterRecency(meta.latestTime)} · {meta.summary}</span>
        </div>
      </div>
    </button>
  );
});

const RadioGlyphFallback = ({ className = "" }) => (
  <span className={`relative inline-flex h-3.5 w-3.5 ${className}`}>
    <span className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping" />
    <span className="relative m-auto h-2 w-2 rounded-full bg-current" />
  </span>
);

const MudouAgoraHorizontal = ({ isDarkMode }) => {
  const deltas = [
    { icon: <TrendingUp size={14} />, label: 'Dólar', value: '+8 matérias', tone: 'emerald', note: '12 min' },
    { icon: <Activity size={14} />, label: 'STF', value: '+4 fontes', tone: 'blue', note: 'caso ganhou corpo' },
    { icon: <Zap size={14} />, label: 'Apple/iPhone', value: 'acelerou', tone: 'violet', note: 'tech em alta' },
    { icon: <RadioGlyphFallback />, label: 'Política', value: 'breaking', tone: 'rose', note: 'novo sinal' },
  ];

  return (
    <div className={`
      w-full flex items-center p-2 px-3 gap-3 overflow-hidden h-[4.2rem] rounded-[1.4rem] relative
      border shadow-xl backdrop-blur-[40px] transition-all duration-300
      ${isDarkMode 
        ? 'bg-zinc-900/40 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
        : 'bg-white/60 border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'}
    `}>
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10 h-full flex items-center gap-2.5 shrink-0 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
          <Sparkles size={16} />
        </div>
        <div className="leading-none">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
            Mudou agora
          </div>
          <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mt-1">
            Desde o último refresh
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-black/10 dark:bg-white/10 shrink-0 relative z-10" />

      <div className="relative z-10 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2.5 h-full w-max pr-2">
          {deltas.map((item) => (
            <div
              key={item.label}
              className="group shrink-0 h-[3rem] min-w-[11rem] rounded-2xl bg-white/45 dark:bg-black/20 border border-white/50 dark:border-white/5 px-3 flex items-center gap-2.5 transition-transform active:scale-[0.98]"
            >
              <div className={`
                w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                ${item.tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''}
                ${item.tone === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : ''}
                ${item.tone === 'violet' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : ''}
                ${item.tone === 'rose' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : ''}
              `}>
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className={`text-[11px] font-black uppercase tracking-wide truncate ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  {item.label}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-200 truncate">
                    {item.value}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 truncate">
                    · {item.note}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function WhileYouWereAwayWidget({ news, openArticle, isDarkMode, getApiKey, clusters, setClusters, heuristicClusters, headerLeft }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const carouselRef = useRef(null);
  const scrollRafRef = useRef(null);

  const displayClusters = useMemo(() => {
    const base = clusters && clusters.length > 0 ? clusters : heuristicClusters;
    return (base || []).filter(c => normalizeClusterArticles(c).length > 0).slice(0, 12);
  }, [clusters, heuristicClusters]);

  const goToSlide = (idx) => {
    const el = carouselRef.current;
    if (!el) return;
    const target = el.querySelector(`[data-cluster-index="${idx}"]`);
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setActiveSlide(idx);
    }
  };

  const onCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const currentEl = carouselRef.current;
      if (!currentEl) return;
      const cards = Array.from(currentEl.querySelectorAll('[data-cluster-index]'));
      if (!cards.length) return;
      const center = currentEl.scrollLeft + currentEl.clientWidth / 2;
      let closest = 0;
      let closestDistance = Infinity;
      cards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = idx;
        }
      });
      setActiveSlide(prev => prev === closest ? prev : closest);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  const onOpenCluster = useCallback((cluster) => {
    setSelectedCluster(cluster);
  }, []);

  if (!displayClusters.length) return <WhileYouWereAwaySkeleton isDarkMode={isDarkMode} />;

  return (
    <section className="vetra-clusters-section vetra-premium-cluster-section w-full">
      {/* HEADER 100% WIDTH PARA O MUDOU AGORA */}
      <div className="w-full px-4 mb-2">
          {headerLeft && headerLeft}
      </div>

      <div ref={carouselRef} onScroll={onCarouselScroll} className="vetra-premium-cluster-rail scrollbar-hide">
        {displayClusters.map((cluster, index) => (
          <VetraPremiumClusterCard key={cluster.clusterId || `${normalizeSourceKey(cluster.ai_title || 'cluster')}-${index}`} cluster={cluster} index={index} onOpenCluster={onOpenCluster} />
        ))}
      </div>

      {displayClusters.length > 1 && (
        <div className="vetra-carousel-dots">
          {displayClusters.slice(0, 8).map((_, i) => <button key={i} onClick={() => goToSlide(i)} className={activeSlide === i ? 'active' : ''} />)}
        </div>
      )}

      {selectedCluster && <ClusterCaseModal cluster={selectedCluster} onClose={() => setSelectedCluster(null)} openArticle={openArticle} getApiKey={getApiKey} isDarkMode={isDarkMode} />}    
    </section>
  );
}


// ==============================================================================
// === LÓGICA HEURÍSTICA: ENTENDA O CASO (Resumo Automático + IA Opcional) ===
// ==============================================================================
function ClusterDetailModal({ cluster, onClose, isDarkMode, openArticle, getApiKey }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- HEURÍSTICA ROBUSTA: Construção de Resumo Automático ---
  // Pega o resumo da matéria mais relevante + um ponto extra da segunda matéria
  const heuristicSummary = useMemo(() => {
      if (!cluster.related_articles || cluster.related_articles.length === 0) return "Sem dados suficientes.";
      
      const mainArticle = cluster.related_articles[0];
      const secondArticle = cluster.related_articles[1];
      
      let text = mainArticle.summary || "";
      // Limpa tags HTML simples se houver
      text = text.replace(/<[^>]*>?/gm, '');
      
      // Se tiver uma segunda matéria com título diferente, adiciona como contexto
      if (secondArticle && secondArticle.title !== mainArticle.title) {
          text += `\n\nOutra perspectiva (${secondArticle.source}): ${secondArticle.title}.`;
      }
      
      return text;
  }, [cluster]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    const apiKey = getApiKey('analysis');
    const generatedSummary = await generateNeutralSummaryForCluster(cluster.related_articles, apiKey);
    if (generatedSummary) {
        setSummary(generatedSummary);
    } else {
        alert("A IA está indisponível. Exibindo resumo original.");
    }
    setIsLoading(false);
  };

  // Texto final: IA (se gerado) ou Heurística (padrão)
  const displayContent = summary || heuristicSummary;

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-lg h-[80vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b shrink-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 flex items-center gap-1">
                <Layers size={12}/> Entenda o Caso
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X size={18}/></button>
          </div>
          <h2 className="text-lg font-bold font-serif leading-tight">{cluster.ai_title}</h2>
        </div>
        
        {/* Área do Resumo (Híbrido: Heurístico -> IA) */}
        <div className={`p-6 shrink-0 border-b ${isDarkMode ? 'border-zinc-800 bg-zinc-800/30' : 'border-zinc-200 bg-zinc-50'}`}>
             <div className="relative">
                 {/* Ícone muda se for IA ou Original */}
                 {summary ? (
                    <Sparkles size={16} className="absolute -top-1 -left-1 text-purple-500 opacity-100 animate-pulse" />
                 ) : (
                    <FileText size={16} className="absolute -top-1 -left-1 text-zinc-400 opacity-100" />
                 )}
                 
                 <p className={`text-sm leading-relaxed pl-6 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {displayContent}
                 </p>

                 {!summary && (
                     <div className="mt-4 flex justify-end">
                         <button 
                            onClick={handleGenerateSummary} 
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider hover:bg-purple-600/20 transition active:scale-95 disabled:opacity-50"
                         >
                            {isLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            {isLoading ? "Melhorando..." : "Melhorar com IA"}
                         </button>
                     </div>
                 )}
             </div>
        </div>

        {/* Lista de Fontes */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-4 py-2 text-[10px] font-bold uppercase opacity-40 tracking-widest">Cobertura Completa</div>
          {cluster.related_articles.map(article => (
            <button key={article.id} onClick={() => openArticle(article)} className={`w-full flex items-center gap-3 p-3 text-left rounded-xl transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'}`}>
              <img src={article.logo} className="w-8 h-8 rounded-md border border-black/10 shrink-0 object-contain bg-white p-0.5" onError={(e) => e.target.style.display='none'}/>
              <div className="min-w-0">
                <p className="text-sm font-bold line-clamp-2 leading-snug">{article.title}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-purple-500 uppercase">{article.source}</span>
                    <span className="text-[10px] opacity-50">{article.time}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// === LÓGICA HEURÍSTICA: LINHA DO TEMPO (Cronologia Real + IA Opcional) ===
// ==============================================================================
function ClusterTimelineModal({ cluster, onClose, isDarkMode, getApiKey }) {
    const [aiTimeline, setAiTimeline] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- HEURÍSTICA ROBUSTA: Linha do Tempo baseada em Metadados ---
    // Ordena as notícias do cluster da mais antiga para a mais recente e formata
    const heuristicTimeline = useMemo(() => {
        if (!cluster.related_articles) return [];
        
        // Clona e ordena: Mais antigo -> Mais novo
        const sorted = [...cluster.related_articles].sort((a, b) => 
            new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
        );

        return sorted.map(article => {
            const dateObj = new Date(article.rawDate);
            // Formata hora amigável (ex: "14:30" ou "Ontem")
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return {
                time: timeStr,
                event: article.title, // Usa o título da matéria como evento
                source: article.source // Adiciona fonte para contexto
            };
        });
    }, [cluster]);

    const handleGenerateTimeline = async () => {
        setIsLoading(true);
        const apiKey = getApiKey('analysis');
        const result = await generateTimelineForCluster(cluster.related_articles, apiKey);
        if (result) setAiTimeline(result);
        else alert("A IA não conseguiu gerar uma timeline melhor.");
        setIsLoading(false);
    };

    // Dados finais: Se tiver IA, usa IA. Se não, usa a heurística (Cronologia das Notícias)
    const displayData = aiTimeline || heuristicTimeline;
    const isUsingAI = !!aiTimeline;

    return (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white'}`}>
                
                {/* Header */}
                <div className={`p-5 border-b shrink-0 flex flex-col gap-3 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1">
                            <History size={12}/> Linha do Tempo {isUsingAI ? '(IA)' : '(Cronológica)'}
                        </span>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X size={18}/></button>
                    </div>
                    
                    {/* Botão de Upgrade para IA */}
                    {!isUsingAI && (
                        <div className={`p-3 rounded-xl flex items-center justify-between ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                            <span className="text-[10px] opacity-70 leading-tight pr-2">Esta é a ordem de publicação. <br/>Quer que a IA organize os fatos narrativamente?</span>
                            <button 
                                onClick={handleGenerateTimeline} 
                                disabled={isLoading}
                                className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wide hover:bg-blue-500 transition disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={10} className="animate-spin"/> : "Gerar com IA"}
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Timeline Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="relative pl-2">
                        {/* Linha vertical */}
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>
                        
                        <div className="space-y-8">
                            {displayData.map((item, i) => (
                                <div key={i} className="flex gap-5 relative">
                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 text-xs font-bold shadow-sm border-4 ${isDarkMode ? 'bg-zinc-800 border-zinc-900 text-white' : 'bg-white border-white text-blue-600'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="pt-1 pb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wide w-max">
                                                {item.time}
                                            </div>
                                            {/* Mostra a fonte na versão heurística para contexto */}
                                            {item.source && (
                                                <span className="text-[9px] font-bold opacity-40 uppercase">{item.source}</span>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.event}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
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





// =========================================================================
// 2. COMPONENTE PRINCIPAL: TrendRadar
// =========================================================================
const TrendRadar = ({ newsData, getApiKey, isDarkMode, openArticle }) => {
  // --- Estados ---
  const [trends, setTrends] = useState(null);
  const [wordCloudItems, setWordCloudItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedBandIndex, setSelectedBandIndex] = useState(null);
  const [selectedWordData, setSelectedWordData] = useState(null);

  // Tooltip premium da régua
  const [bandTip, setBandTip] = useState(null); // { idx, x, y } | null
  const tipTimerRef = useRef(null);

  const STORAGE_KEY = "newsos_trend_radar_v9_fixed";

  // --- Definição das Faixas ---
  const temperatureBands = [
    { id: 0, min: 0, max: 2, color: "#3b82f6", label: "Frio" },
    { id: 1, min: 3, max: 4, color: "#22c55e", label: "Leve" },
    { id: 2, min: 5, max: 6, color: "#facc15", label: "Médio" },
    { id: 3, min: 7, max: 8, color: "#f97316", label: "Quente" },
    { id: 4, min: 9, max: 10, color: "#dc2626", label: "Muito Quente" },
  ];

  const getTrendStyle = (score) => {
    const s = Number(score || 0);
    const band = temperatureBands.find((b) => s >= b.min && s <= b.max) || temperatureBands[0];
    return { color: band.color, bg: `${band.color}1A` };
  };

  const getBandIndexByScore = (score) => {
    const s = Number(score || 0);
    const index = temperatureBands.findIndex((b) => s >= b.min && s <= b.max);
    return index >= 0 ? index : 0;
  };

  // --- Lógica de Drill-down ---
const handleWordClick = (word) => {
    if (!newsData) return;
    
    // 1. Divide a palavra-chave da IA em termos de busca individuais
    // Ex: "Operação PF" se torna ["operação", "pf"]
const searchTerms = safeLower(word).split(' ').filter(term => term.length > 1);

    const normalize = (str) =>
      String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const related = newsData.filter(article => {
        if (!article.title) return false;
        
        const normalizedTitle = normalize(article.title);
        
        // 2. Verifica se CADA termo de busca está presente no título do artigo
        // O método .every() garante que todos os termos ("operação" E "pf") existam
        return searchTerms.every(term => normalizedTitle.includes(normalize(term)));
    }).slice(0, 15); // Limita a 15 resultados

    setSelectedWordData({ word, articles: related });
};

  // --- Ciclo de Vida e Cache ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTrends(parsed.trends);
        setWordCloudItems(parsed.cloud);
        setHasGenerated(true);
      } catch (e) {
        console.error("Cache reset");
      }
    }
  }, []);

  const runTrendAnalysis = async () => {
    const apiKey = getApiKey("widgets");
    if (!apiKey || !newsData?.length) return alert("IA não configurada ou sem notícias.");

    setLoading(true);
    setActiveIndex(null);
    setSelectedBandIndex(null);

    const data = await generateTrendRadar(newsData, apiKey);

    if (data?.trends?.length > 0) {
      const enriched = data.trends.map((t) => ({
        ...t,
        related_articles: (t.source_indices || []).map((i) => newsData[i]).filter(Boolean),
      }));
      setTrends(enriched);
      setWordCloudItems(data.word_cloud || []);
      setHasGenerated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ trends: enriched, cloud: data.word_cloud }));
    }
    setLoading(false);
  };

  // --- Filtros ---
  const filteredTrends = useMemo(() => {
    if (!trends || selectedBandIndex === null) return [];
    return trends.filter((t) => getBandIndexByScore(t.score) === selectedBandIndex);
  }, [trends, selectedBandIndex]);

  // --- Contagens (trends e fontes) por faixa ---
  const trendsByBand = useMemo(() => {
    return temperatureBands.map((band) => {
      if (!trends) return 0;
      return trends.filter((t) => t.score >= band.min && t.score <= band.max).length;
    });
  }, [trends]);

  const sourcesByBand = useMemo(() => {
    return temperatureBands.map((band) => {
      if (!trends) return 0;
      return trends
        .filter((t) => t.score >= band.min && t.score <= band.max)
        .reduce((acc, t) => acc + (Array.isArray(t?.source_indices) ? t.source_indices.length : 0), 0);
    });
  }, [trends]);

  const maxSourcesInAnyBand = useMemo(() => Math.max(...sourcesByBand, 1), [sourcesByBand]);

  // Mantém compatibilidade com seu código existente que usa countsByBand
  const countsByBand = trendsByBand;
  const maxNewsInAnyBand = useMemo(() => Math.max(...countsByBand, 1), [countsByBand]);

  // --- Tooltip helpers ---
  const showBandTipFromEvent = (idx, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setBandTip({
      idx,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const hideBandTip = () => setBandTip(null);

  const showBandTipTouch = (idx, e) => {
    showBandTipFromEvent(idx, e);
    if (tipTimerRef.current) window.clearTimeout(tipTimerRef.current);
    tipTimerRef.current = window.setTimeout(() => setBandTip(null), 1300);
  };

  useEffect(() => {
    return () => {
      if (tipTimerRef.current) window.clearTimeout(tipTimerRef.current);
    };
  }, []);

  // --- UI Tokens ---
  const panelBg = isDarkMode ? "rgba(24, 24, 27, 0.85)" : "rgba(255, 255, 255, 0.95)";
  const borderColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)";

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-8 font-sans">
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(155, 155, 155, 0.3);
          border-radius: 10px;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-2xl">
            <Activity className="text-orange-500" size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest opacity-80">Trend Radar</h2>
            <p className="text-[10px] font-bold opacity-40 uppercase">Análise de Temperatura • 24h</p>
          </div>
        </div>
        <button
          onClick={runTrendAnalysis}
          disabled={loading}
          className={`p-4 rounded-full transition-all active:scale-95 ${
            isDarkMode ? "bg-zinc-800" : "bg-zinc-100"
          }`}
        >
          {loading ? <Loader2 className="animate-spin text-orange-500" size={22} /> : <RefreshCw size={22} />}
        </button>
      </div>

      {/* Empty State */}
      {!hasGenerated && !loading && (
        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-zinc-500/20 rounded-[3.5rem] text-center p-12">
          <Sparkles className="text-pink-500/70 mb-6" size={75} />
          <h3 className="text-xl font-black mb-3">Mapeamento de Trending News</h3>
          <p className="text-sm opacity-50 max-w-xs mb-10 leading-relaxed">
            Nossa IA analisa os trending topics das últimas 24h. Ative o radar para visualizar.
          </p>
          <button
            onClick={runTrendAnalysis}
            className="px-10 py-5 bg-orange-500 text-white rounded-full font-black shadow-2xl shadow-orange-500/30 hover:scale-105 transition-all"
          >
            ATIVAR RADAR
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="h-96 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <Activity className="text-orange-500 animate-pulse" size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Processando Temperaturas</p>
        </div>
      )}

      {hasGenerated && !loading && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          {/* NUVEM DE PALAVRAS */}
          <div className="p-5 rounded-[3rem] shadow-sm" style={{ background: panelBg, border: `1px solid ${borderColor}` }}>
            <h4 className="text-[15px] font-black uppercase tracking-[0.2em] opacity-30 text-center mb-5">Termos em Alta</h4>
            <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2">
              {wordCloudItems.map((item, i) => {
                const style = getTrendStyle(item.relevance);
                const tilt = i % 3 === 0 ? "rotate-2" : i % 2 === 0 ? "-rotate-2" : "rotate-0";
                return (
                  <button
                    key={i}
                    onClick={() => handleWordClick(item.word)}
                    className={`px-5 py-2 rounded-2xl font-black transition-all hover:scale-110 active:scale-90 ${tilt}`}
                    style={{
                      fontSize: `${12 + item.relevance * 1.5}px`,
                      color: style.color,
                      background: `${style.color}15`,
                      border: `1px solid ${style.color}25`,
                    }}
                  >
                    {item.word}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RÉGUA PREMIUM — micro-histograma + tooltip */}
          <div className="space-y-3">
            <div className="flex justify-between px-6 text-[10px] font-black uppercase tracking-widest opacity-40">
              <span>Frio</span>
              <span>Intenso</span>
            </div>

            <div
              className="h-13 rounded-3xl flex items-stretch overflow-hidden shadow-inner relative select-none"
              style={{ background: isDarkMode ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.05)" }}
            >
              {temperatureBands.map((band, idx) => {
                const isActive = selectedBandIndex === idx;
                const isSomethingSelected = selectedBandIndex !== null;

                const trendsCount = trendsByBand[idx] || 0;
                const sourcesCount = sourcesByBand[idx] || 0;

                // energia (0..1) baseada em fontes (volume real)
                const normalized = maxSourcesInAnyBand > 0 ? sourcesCount / maxSourcesInAnyBand : 0;
                const energy = 0.10 + normalized * 0.90;

                // quando algo está selecionado, as não-ativas apagam
                const dim = isSomethingSelected && !isActive ? 0.22 : 1;

                // saturação: não-ativas ficam mais “cinza”
                const saturation = isSomethingSelected && !isActive ? 0.35 : 1;

                // brilho: energia + boost se ativa
                const brightness = (0.92 + energy * 0.55) * (isActive ? 1.20 : 1) * dim;

                // glow proporcional ao volume
                const glowAlpha = (0.10 + energy * 0.55) * (isActive ? 1.45 : 1) * dim;

                // largura: ativa expande
                const flexValue = isActive ? 2.6 : 1;

                // equalizer
                const bars = 12;
                const activeBars = Math.max(1, Math.round(energy * bars));

                const bandLabel = band.label || `Faixa ${idx + 1}`;

                return (
                  <motion.button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBandIndex(isActive ? null : idx)}
                    onMouseEnter={(e) => showBandTipFromEvent(idx, e)}
                    onMouseMove={(e) => showBandTipFromEvent(idx, e)}
                    onMouseLeave={hideBandTip}
                    onTouchStart={(e) => showBandTipTouch(idx, e)}
                    className="relative h-full outline-none"
                    style={{
                      flex: flexValue,
                      background: band.color,
                      filter: `brightness(${brightness}) saturate(${saturation})`,
                      transition: "filter 450ms ease, flex 450ms ease",
                    }}
                    title={`${sourcesCount} fontes • ${trendsCount} trends • ${bandLabel}`}
                  >
                    {/* CAMADA 1 — energia interna */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: glowAlpha,
                        background:
                          "radial-gradient(circle at 50% 55%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0) 70%)",
                        mixBlendMode: "screen",
                        transition: "opacity 450ms ease",
                      }}
                    />

                    {/* CAMADA 2 — sheen animado */}
                    {sourcesCount > 0 && (
                      <motion.div
                        className="absolute inset-0"
                        initial={false}
                        animate={{
                          opacity: isSomethingSelected && !isActive ? 0.12 : 0.22 + energy * 0.22,
                          x: ["-35%", "35%"],
                        }}
                        transition={{
                          x: { duration: 2.8 + (1 - energy) * 1.6, repeat: Infinity, ease: "easeInOut" },
                          opacity: { duration: 0.45, ease: "easeOut" },
                        }}
                        style={{
                          background:
                            "linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 70%)",
                          mixBlendMode: "overlay",
                        }}
                      />
                    )}

                    {/* CAMADA 3 — glow forte quando ativo */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBandGlow"
                        className="absolute inset-0 z-10"
                        style={{
                          boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.55), 0 0 22px rgba(255,255,255,0.35), 0 0 52px ${band.color}`,
                        }}
                      />
                    )}

                    {/* MICRO-HISTOGRAMA (equalizer) */}
                    <div className="absolute inset-0 z-20 flex items-end justify-center gap-[3px] px-2 pb-[6px] pointer-events-none">
                      {Array.from({ length: bars }).map((_, b) => {
                        const isOn = b < activeBars;

                        const wave = 0.55 + 0.45 * Math.sin((b / bars) * Math.PI);
                        const height = 6 + Math.round(energy * 18 * wave);

                        return (
                          <div
                            key={b}
                            style={{
                              width: 3,
                              height,
                              borderRadius: 999,
                              opacity: isOn ? (isSomethingSelected && !isActive ? 0.18 : 0.55) : 0.12,
                              background: "rgba(19, 17, 17, 0.95)",
                              boxShadow: isOn ? "0 0 10px rgba(255,255,255,0.28)" : "none",
                              transition: "opacity 350ms ease",
                            }}
                          />
                        );
                      })}
                    </div>

                 {(isActive || bandTip?.idx === idx) && (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 0.9, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-2 py-1 rounded-full text-[10px] font-black"
    style={{
      background: "rgba(255,255,255,0.18)",
      border: "1px solid rgba(255,255,255,0.22)",
      backdropFilter: "blur(8px)",
      color: "rgba(255,255,255,0.92)",
    }}
  >
    {sourcesCount}
  </motion.div>
)}

                    {/* PONTO indicador */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-2 h-2 rounded-full bg-white shadow-lg"
                      />
                    )}
                  </motion.button>
                );
              })}

              {/* HINT central */}
              {selectedBandIndex === null && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{ opacity: isDarkMode ? 0.12 : 0.10 }}
                >
                  <div
                    className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
                    style={{
                      background: "rgba(255,255,255,0.35)",
                      border: "1px solid rgba(255,255,255,0.45)",
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    distribuição
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] opacity-40 mt-2 font-medium">
              {selectedBandIndex === null ? "Toque em uma cor para revelar os cards" : "Toque novamente para fechar"}
            </p>

            {/* TOOLTIP FLUTUANTE PREMIUM */}
            {bandTip && (
              <div
                className="fixed z-[9999] pointer-events-none"
                style={{
                  left: bandTip.x,
                  top: bandTip.y,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {(() => {
                  const idx = bandTip.idx;
                  const band = temperatureBands[idx];
                  const bandLabel = band.label || `Faixa ${idx + 1}`;
                  const trendsCount = trendsByBand[idx] || 0;
                  const sourcesCount = sourcesByBand[idx] || 0;

                  return (
                    <div
                      className="px-3 py-2 rounded-2xl text-[11px] font-black tracking-wide"
                      style={{
                        background: isDarkMode ? "rgba(0,0,0,0.68)" : "rgba(255,255,255,0.75)",
                        border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: isDarkMode ? "0 10px 30px rgba(0,0,0,0.35)" : "0 10px 30px rgba(0,0,0,0.18)",
                        color: isDarkMode ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.75)",
                      }}
                    >
                      <span style={{ color: band.color, filter: "brightness(1.05)" }}>{bandLabel}</span>
                      <span style={{ opacity: 0.65 }}> • </span>
                      <span>{sourcesCount} fontes</span>
                      <span style={{ opacity: 0.65 }}> • </span>
                      <span>{trendsCount} trends</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* GRID DE TENDÊNCIAS */}
          <AnimatePresence>
            {selectedBandIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredTrends.length > 0 ? (
                  filteredTrends.map((trend, idx) => {
                    const style = getTrendStyle(trend.score);
                    const open = activeIndex === idx;

                    return (
                      <motion.div
                        key={trend.topic}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <button
                          onClick={() => setActiveIndex(open ? null : idx)}
                          className={`w-full text-left p-7 rounded-[2.5rem] transition-all border ${
                            open ? "shadow-2xl" : "shadow-md"
                          }`}
                          style={{ background: panelBg, borderColor: open ? style.color : borderColor }}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: style.bg }}>
                              <div className="w-2 h-2 rounded-full" style={{ background: style.color }} />
                              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: style.color }}>
                                {trend.score}/10
                              </span>
                            </div>
                            <ChevronRight
                              size={18}
                              className={`transition-transform duration-300 ${
                                open ? "rotate-90 text-orange-500" : "opacity-20"
                              }`}
                            />
                          </div>

                          <h3 className="font-bold text-base leading-snug mb-2">{trend.topic}</h3>
                          <p className="text-xs opacity-70 leading-relaxed font-medium mb-2">{trend.summary}</p>

                          <AnimatePresence>
                            {open && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-3 pt-4 border-t border-zinc-500/10 mt-4">
                                  <p className="text-[9px] font-black uppercase opacity-30 tracking-[0.2em]">Fontes Consultadas</p>
                                  <div className="flex flex-col gap-2">
                                    {trend.related_articles.map((art, i) => (
                                      <div
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openArticle(art);
                                        }}
                                        className="p-3 rounded-2xl bg-zinc-500/5 hover:bg-orange-500/10 transition-colors flex items-center justify-between group cursor-pointer"
                                      >
                                        <span className="text-[11px] font-bold truncate pr-4">{art.title}</span>
                                        <img
                                          src={art.logo}
                                          alt=""
                                          className="w-5 h-5 rounded-md flex-shrink-0 border border-white/10 bg-white object-contain"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-1 md:col-span-2 py-10 text-center opacity-40">
                    <p className="text-sm font-bold">Nenhum tema encontrado nesta faixa de temperatura.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* MODAL DE DRILL-DOWN */}
      <AnimatePresence>
        {selectedWordData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setSelectedWordData(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className={`relative w-full max-w-2xl rounded-[3.5rem] overflow-hidden border ${
                isDarkMode ? "bg-zinc-900 border-white/10" : "bg-white border-black/5"
              }`}
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="text-[10px] font-black uppercase text-orange-500 mb-2 block">Contexto da Palavra</span>
                    <h3 className="text-3xl font-black tracking-tight">{selectedWordData.word}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedWordData(null)}
                    className="p-4 bg-zinc-500/10 rounded-full active:scale-90 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
                  {selectedWordData.articles.map((art, i) => (
                    <button
                      key={i}
                      onClick={() => openArticle(art)}
                      className={`w-full text-left p-4 rounded-[1.5rem] transition-all border flex items-center justify-between gap-4 group ${
                        isDarkMode
                          ? "bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10"
                          : "bg-black/5 hover:bg-black/10 border-transparent hover:border-black/10"
                      }`}
                      title={art.title}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {art.title}
                        </p>
                        <span className="text-[9px] font-black uppercase opacity-40 mt-1 block">
                          {art.source?.name || art.source || "Fonte Geral"}
                        </span>
                      </div>
                      <img
                        src={art.logo}
                        alt=""
                        className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/10 bg-white object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};







const getVetraMainScrollTop = () => {
  if (typeof document === 'undefined') return 0;
  const mainScroller = document.querySelector('main');
  const docTop = document.documentElement?.scrollTop || document.body?.scrollTop || 0;
  return Number(mainScroller?.scrollTop || window.scrollY || docTop || 0);
};

// Substitua o seu componente HappeningTab inteiro por esta versão aprimorada


function TrendingTopicModal({ topic, allTopics = [], onClose, openArticle }) {
  if (!topic) return null;
  const topicsToShow = topic.showAll ? (allTopics || []).filter(Boolean) : [topic];
  const mainTopic = topicsToShow[0] || topic;
  const groupedSources = useMemo(() => {
    const map = new Map();
    const articles = topicsToShow.flatMap(t => Array.isArray(t?.articles) ? t.articles : []);
    sortByDateSafe(articles).forEach(article => {
      const group = article?.sourceGroup || getEditorialGroupKey(article?.source, article?.link);
      const key = group || article?.source || article?.link || article?.title;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          key,
          source: article?.source || 'Fonte',
          logo: article?.logo,
          count: 0,
          articles: [],
          latest: article,
        });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (entry.articles.length < 5) entry.articles.push(article);
      if (new Date(article?.rawDate || 0).getTime() > new Date(entry.latest?.rawDate || 0).getTime()) entry.latest = article;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || new Date(b.latest?.rawDate || 0).getTime() - new Date(a.latest?.rawDate || 0).getTime()).slice(0, 18);
  }, [topic, allTopics]);

  const totalHeadlines = topicsToShow.reduce((sum, item) => sum + (item?.articles?.length || 0), 0);
  const sourceCount = groupedSources.length;

  return (
    <div className="vetra-trending-modal-overlay" onClick={onClose}>
      <div className="vetra-trending-modal-shell" onClick={(e) => e.stopPropagation()}>
        <div className="vetra-trending-modal-glow" />
        <button className="vetra-trending-modal-close" onClick={onClose}><X size={18}/></button>
        <div className="vetra-trending-modal-header">
          <span className="vetra-trending-modal-kicker"><Activity size={15}/> Trending agora</span>
          <h2>{topic.showAll ? 'Assuntos em alta' : mainTopic.t}</h2>
          <p>{sourceCount} fontes · {totalHeadlines} manchetes relacionadas. Toque em uma fonte ou notícia para abrir no leitor.</p>
        </div>

        {topic.showAll && (
          <div className="vetra-trending-topic-strip">
            {topicsToShow.map((item, index) => (
              <button key={item.t || index} onClick={() => item.articles?.[0] && openArticle(item.articles[0])}>
                <b>{index + 1}</b><span>{item.t}</span><small>{item.n}</small>
              </button>
            ))}
          </div>
        )}

        <div className="vetra-trending-source-grid">
          {groupedSources.map((entry, index) => (
            <div key={entry.key} className="vetra-trending-source-card">
              <button className="vetra-trending-source-head" onClick={() => entry.latest && openArticle(entry.latest)}>
                <ClusterSourceAvatar source={{ name: entry.source, logo: entry.logo }} index={index} compact />
                <span><b>{entry.source}</b><small>{entry.count} manchete{entry.count === 1 ? '' : 's'}</small></span>
                <ArrowUpRight size={16}/>
              </button>
              <div className="vetra-trending-source-news">
                {entry.articles.slice(0, 3).map((article, i) => (
                  <button key={article.id || article.link || i} onClick={() => openArticle(article)}>
                    <b>{article.title}</b>
                    <small>{article.rawDate ? formatClusterRecency(article.rawDate) : 'agora'} · {article.category || 'Geral'}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!groupedSources.length && (
            <div className="vetra-trending-empty">Ainda não há fontes suficientes para este tema.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function HappeningTab({ openArticle, openStory, isDarkMode, newsData, onRefresh, storiesToDisplay, onMarkAsSeen, getApiKey, savedClusters, setSavedClusters, seenStoryIds, onTriggerWidgetRotation, heuristicClusters, onOpenPodNews, stagedUpdateInfo, onApplyStagedUpdate }) { 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDigest, setShowDigest] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  
  const startY = useRef(0); 
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mesmo overlay premium de refresh do Feed (fases + staging)
  const refreshCtl = useVetraRefreshController({ applyStaged: onApplyStagedUpdate });

  const handleTouchStart = (e) => { if (getVetraMainScrollTop() <= 5 && !isRefreshing) startY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    if (startY.current === 0 || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && getVetraMainScrollTop() <= 5) {
      const next = Math.min(diff * 0.5, 220);
      setPullDistance(next);
      refreshCtl.setPull(next > 90);
    }
  };
  const handleTouchEnd = async () => {
    if (pullDistance === 0) { startY.current = 0; return; }
    if (pullDistance > 90) {
      setIsRefreshing(true); setRefreshTrigger(prev => prev + 1);
      setPullDistance(0); startY.current = 0;
      try { await refreshCtl.run(() => onRefresh && onRefresh()); }
      finally { setIsRefreshing(false); }
      return;
    }
    refreshCtl.setPull(false);
    setPullDistance(0);
    startY.current = 0;
  };

  const displayClusters = savedClusters && savedClusters.length > 0 ? savedClusters : heuristicClusters;
  const breakingHighlights = useMemo(() => computeBreakingHighlights(newsData || []), [newsData]);
  const trendingTopics = useMemo(() => computeTrendingTopics(newsData || []), [newsData]);
  const [selectedTrendingTopic, setSelectedTrendingTopic] = useState(null);

  return (
// pb-24 é suficiente agora que a base cabe em uma única linha
    <div className="animate-in fade-in duration-700 flex flex-col gap-2 pb-24 touch-pan-y w-full"
         onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>     
      
  {/* Indicador de arraste (o overlay premium assume durante o refresh) */}
      <div className="fixed left-0 right-0 z-[1000] flex justify-center pointer-events-none" style={{ top: '25%', opacity: Math.min(pullDistance / 80, 1), transform: `scale(${Math.min(pullDistance / 100, 1.2)})`, display: pullDistance > 0 && !isRefreshing ? 'flex' : 'none' }}>
         <div className={`flex flex-col items-center gap-2 p-4 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-black/80 border-white/10 shadow-purple-500/20' : 'bg-white/95 border-zinc-200 shadow-xl text-zinc-900'} backdrop-blur-md`}>
            <RefreshCw size={32} className="text-purple-500 transition-transform" style={{ transform: `rotate(${pullDistance * 3}deg)` }}/>
         </div>
      </div>

      {/* Overlay premium de refresh (fases) + banner de staging opcional */}
      <VetraRefreshOverlay phase={refreshCtl.phase} info={stagedUpdateInfo} isDarkMode={isDarkMode} />
      {stagedUpdateInfo && refreshCtl.phase === 'idle' && onApplyStagedUpdate && (
        <div className="px-4 pt-1">
          <button
            onClick={onApplyStagedUpdate}
            className="vetra-update-ready w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left animate-in slide-in-from-top-2 fade-in duration-300"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="text-blue-500 shrink-0" />
              <span className="font-black text-sm text-zinc-900 truncate">{stagedUpdateInfo.count} novas notícias de {stagedUpdateInfo.sourceCount} fontes</span>
            </span>
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">Atualizar agora</span>
          </button>
        </div>
      )}
      
      {/* 1. STORIES */}
      <div className="px-4 relative z-10 shrink-0 pt-1">
        <div className="flex space-x-4 overflow-x-auto pb-1 scrollbar-hide snap-x items-center">
            {storiesToDisplay && storiesToDisplay.filter(s => !seenStoryIds?.includes(s.id)).map((story) => (
                <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-1.5 snap-center cursor-pointer group flex-shrink-0">
                    <div className={`relative w-[64px] h-[64px] rounded-full p-[2.5px] transition-all shadow-md ${story.isBreaking ? 'bg-red-600 animate-[fast-pulse_1s_ease-in-out_infinite]' : 'bg-gradient-to-tr from-rose-600 to-orange-400'}`}>
                        <div className={`w-full h-full rounded-full border-[2px] overflow-hidden ${isDarkMode ? 'border-zinc-950 bg-zinc-900' : 'border-white bg-zinc-200'}`}>
                            <img src={story.avatar} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    </div>
                    <span className={`text-[9px] font-semibold truncate max-w-[68px] text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{story.name}</span>
                </div>
            ))}
        </div>
      </div>

      {/* 2. O PULSO (Top Grid com Alturas Cirúrgicas) */}
      <div className="vetra-home-top-grid shrink-0">
        
        {/* DESTAQUES */}
        <section className="vetra-breaking-panel">
          <div className="vetra-breaking-title"><Zap size={18} fill="currentColor" /> <span>NOTÍCIAS EM DESTAQUE</span></div>
          <div className="vetra-breaking-list">
            {(breakingHighlights || []).slice(0, 3).map((n, i) => (
                <button key={n.id || i} onClick={() => openArticle(n)} className="vetra-breaking-row group cursor-pointer">
                  <span className="vetra-breaking-rank">{i + 1}</span>
                  <span className="vetra-breaking-thumb"><img src={n.img} onError={(e) => e.currentTarget.style.display='none'} alt="" /></span>
                  <span className="vetra-breaking-copy">
                    <b>{n.title}</b>
                  </span>
                </button>
            ))}
          </div>
        </section>

        {/* TRENDING (Régua Larga e Textos Pretos) */}
        <section className="vetra-trending-panel-home">
          <div className="vetra-trending-title"><Activity size={18} fill="currentColor" /> <span>TRENDING AGORA</span></div>
          <div className="vetra-trending-list-home">
            {(trendingTopics.length ? trendingTopics : [{ t: 'Coletando...', n: '', v: 35 }]).slice(0,4).map((it, i) => {
               // Limpeza correta da string para extrair APENAS OS NÚMEROS
               const fontesStr = it.n ? it.n.split('·')[0] : '';
               const manchetesStr = it.n ? it.n.split('·')[1] : '';
               const numFontes = fontesStr.replace(/[^\d]/g, '');
               const numManchetes = manchetesStr ? manchetesStr.replace(/[^\d]/g, '') : '';

               return (
                <button key={it.t} onClick={() => setSelectedTrendingTopic(it)} className="vetra-trending-row-home group cursor-pointer">
                  <strong className={`${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{i + 1}</strong>
                  
                  {/* Nome da Trend agora é Preto/Branco e não azul */}
                  <span className={`text-[1.05rem] font-black truncate transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {it.t}
                  </span>
                  
         {/* Nova Régua Premium + Visual Badge */}
                  <div className="flex flex-col items-end gap-1.5 w-full">
                      <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden shadow-inner border border-black/5 dark:border-white/5 relative">
                          <div 
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 shadow-[0_0_12px_rgba(249,115,22,0.6)]" 
                              style={{ width: `${Math.min(100, Math.max(15, it.v))}%` }} 
                          />
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-black tracking-widest uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded shadow-sm border border-orange-500/20">
                          <Activity size={10} className="text-orange-500" /> Em Alta
                      </div>
                  </div>
                </button>
               )
            })}
          </div>
        </section>

      </div>
      
      {selectedTrendingTopic && (
        <TrendingTopicModal topic={selectedTrendingTopic} allTopics={trendingTopics} onClose={() => setSelectedTrendingTopic(null)} openArticle={openArticle} />
      )}
      
   {/* 3. OS REIS (Clusters com Mudou Agora Injetado no Header) */}
      <div className="relative flex flex-col mt-2 w-full">
        <WhileYouWereAwayWidget
          news={newsData} 
          openArticle={openArticle} 
          isDarkMode={isDarkMode} 
          getApiKey={getApiKey}
          clusters={savedClusters}
          setClusters={setSavedClusters}
          heuristicClusters={heuristicClusters}
          headerLeft={<MudouAgoraHorizontal isDarkMode={isDarkMode} />}
        />
      </div>
    
{/* 4. BASE PREMIUM OPTICAL GLASS: Ferramentas flutuando sobre a grade */}
      <div className="shrink-0 flex flex-row items-center gap-4 px-4 -mt-3 w-full">
        
        {/* AI DIGEST — agora ganha mais largura porque PodNews ficou compacto */}
        <div className="optical-glass flex-[1.25] min-w-0 h-[115px] px-5 py-4 flex items-center justify-between cursor-pointer group" onClick={() => setShowDigest(v => !v)}>
          <div className="caustic-glow bg-indigo-500 group-hover:bg-purple-500 transition-colors duration-500"></div>

          <div className="flex items-center gap-4 min-w-0 relative z-10">
             <div className="w-[5.25rem] h-[5.25rem] rounded-[1.25rem] bg-white dark:bg-zinc-800 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(0,0,0,0.05)] shrink-0 border border-zinc-100 dark:border-zinc-700 transition-transform group-hover:scale-105">
                <Sparkles size={38} className="text-indigo-600 dark:text-indigo-400" />
             </div>

             <div className="min-w-0">
                <h4 className={`text-xl font-black tracking-tight mb-1 truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>AI Digest</h4>
                <p className="text-xs uppercase tracking-widest font-bold opacity-60 truncate">Resumo do dia</p>
             </div>
          </div>

          <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner relative z-10 shrink-0">
             <ChevronRight size={24} className={showDigest ? 'rotate-90' : ''} />
          </div>
        </div>

        {/* PODNEWS — somente o quadrado/logo, maior e mais alto */}
        <button
          type="button"
          className="optical-glass w-[150px] xl:w-[166px] h-[150px] shrink-0 p-3 flex items-center justify-center cursor-pointer group"
          onClick={() => onOpenPodNews && onOpenPodNews()}
          aria-label="Abrir PodNews"
        >
          <div className="caustic-glow bg-fuchsia-500 group-hover:bg-pink-500 transition-colors duration-500"></div>

          <div className="relative z-10 w-full h-full rounded-[1.45rem] bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-[0_8px_18px_rgba(0,0,0,0.12),inset_0_-3px_6px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center gap-2 transition-transform group-hover:scale-[1.035]">
            <span className="absolute top-3 right-3 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-zinc-800 rounded-full shadow-sm" />
            <Headphones size={44} className="text-fuchsia-600 dark:text-fuchsia-400" />
            <span className={`text-[15px] font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              PodNews
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-500/80">
              áudio
            </span>
          </div>
        </button>

        {/* MERCADOS HOJE — mais largo, modal por toque/click */}
        <div className="optical-glass flex-[1.25] min-w-0 h-[115px] px-5 py-4 flex items-center justify-between cursor-pointer group" onClick={() => setIsMarketModalOpen(true)}>
            <div className="caustic-glow bg-emerald-500 group-hover:bg-green-400 transition-colors duration-500"></div>

            <div className="flex items-center gap-4 min-w-0 w-full relative z-10">
                <div className="w-[5.25rem] h-[5.25rem] rounded-[1.25rem] bg-white dark:bg-zinc-800 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(0,0,0,0.05)] shrink-0 border border-zinc-100 dark:border-zinc-700 transition-transform group-hover:scale-105">
                    <TrendingUp size={38} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5}/>
                </div>

                <div className="min-w-0 flex-1">
                   <div className="flex items-center justify-between gap-2 mb-1.5">
                       <h4 className={`text-xl font-black tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Mercados</h4>
                       <span className="px-2 py-1 rounded border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ao vivo
                       </span>
                   </div>

                    <div className="flex flex-col gap-1 mt-1.5 pr-2 w-full">
                       <div className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                           <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 truncate">
                               Ibovespa opera em alta impulsionado por NY
                           </p>
                       </div>

                       <div className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                           <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 truncate">
                               Dólar recua aguardando novos dados
                           </p>
                       </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {showDigest && (
        <div className="px-4 mt-2">
          <SmartDigestWidget newsData={newsData} getApiKey={getApiKey} isDarkMode={isDarkMode} refreshTrigger={refreshTrigger} openArticle={openArticle} />
        </div>
      )}

      {/* MODAL MERCADOS HOJE - Vidro Transparente Absoluto */}
      {isMarketModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           {/* Overlay mais escuro p/ dar contraste ao vidro */}
           <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl" onClick={() => setIsMarketModalOpen(false)} />
           
           {/* Shell 100% Vidro */}
           <div className={`relative w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] p-6 md:p-8 flex flex-col border ${isDarkMode ? 'bg-zinc-900/40 border-white/10' : 'bg-white/40 border-white/60'} backdrop-blur-3xl`}>
              
              {/* Luz ambiente volumétrica atrás do conteúdo */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-emerald-500/20 blur-[100px] pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <div>
                     <h2 className="text-3xl font-black flex items-center gap-3 text-zinc-900 dark:text-white tracking-tight">
                         <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner"><TrendingUp className="text-emerald-500" size={28} strokeWidth={2.5}/></div>
                         Panorama Global
                     </h2>
                     <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-2 ml-1">Cotações da B3 e índices mundiais em tempo real.</p>
                 </div>
                 <button onClick={() => setIsMarketModalOpen(false)} className="p-3 bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-full hover:scale-105 active:scale-95 transition backdrop-blur-md text-zinc-600 dark:text-zinc-300"><X size={20}/></button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar relative z-10 -mx-4 px-4">
                 <MarketCards isDarkMode={isDarkMode} />
              </div>
           </div>
        </div>
      )}
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
    'fox news': 'logos/fox2.png',
    'bbc news': 'https://images.seeklogo.com/logo-png/51/2/bbc-news-logo-png_seeklogo-519158.png'
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
            const feedSourceId = getFeedSourceId(feed);
            const feedGroupKey = getEditorialGroupKey(feed.name, feed.url);
            const latestHeadlines = realNews.filter(news =>
                news.sourceId === feedSourceId ||
                news.sourceGroup === feedGroupKey ||
                news.source === feed.name
            ).slice(0, 2);
            let finalLogo = resolveLogoUrl({ source: feed.name, feedUrl: feed.url, feedLogo: feed.logo, siteUrl: feed.url });
            const lowerName = safeLower(feed?.name);
            
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

  const q = safeLower(searchQuery);

const searchMatch = q === '' ||
  safeLower(item?.title).includes(q) ||
  safeLower(item?.source).includes(q);
    
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


// --- FUNÇÃO PARSE XML (V3 - À PROVA DE FALHAS DE ÁUDIO) ---

const extractImageFromContent = (content) => {
  if (!content || typeof content !== 'string') return null;
  const imgMatch = content.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
};

// --- FUNÇÃO PARSE XML (V5 - FINAL, CORRIGIDA E BLINDADA CONTRA FEEDS GIGANTES) ---

const parseXMLToNewsItems = (xmlText, feedSource, feedId, feedUrl = '') => {
  try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(String(xmlText || '').replace(/^\uFEFF/, ''), "text/xml");
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
          console.warn("Erro de parser no XML de:", feedSource, parserError.textContent);
          return { items: [], realTitle: feedSource, realLogo: null, siteLink: feedUrl };
      }
      const channel = xmlDoc.querySelector('channel') || xmlDoc.querySelector('feed') || xmlDoc;
      const detectedTitle = getNodeLocalText(channel, ['title']) || feedSource || 'Fonte';
      const siteLink = getNodeLocalText(channel, ['link']) || getNodeLocalAttr(channel, ['link'], 'href') || feedUrl;
      const channelLogoRaw = getNodeLocalText(channel, ['image url', 'url']) || getNodeLocalAttr(channel, ['itunes:image', 'image', 'logo', 'icon'], 'href') || getNodeLocalText(channel, ['logo', 'icon']);
      const realLogo = resolveLogoUrl({ source: detectedTitle, feedUrl, feedLogo: absolutizeUrl(channelLogoRaw, siteLink || feedUrl), siteUrl: siteLink });
      const allItems = Array.from(xmlDoc.querySelectorAll('item, entry'));
      const items = allItems.slice(0, 60);
      const parsedItems = items.map((node, index) => {
        const title = getNodeLocalText(node, ['title']) || 'Notícia sem título';
        const linkNode = node.querySelector('link');
        const link = linkNode?.getAttribute('href') || getNodeLocalText(node, ['link']) || getNodeLocalText(node, ['guid', 'id']) || '';
        const pubDate = getNodeLocalText(node, ['pubDate', 'published', 'updated', 'date']);
        const descriptionRaw = getNodeLocalText(node, ['description', 'summary']) || getNodeLocalText(node, ['content:encoded', 'content']);
        const contentRaw = getNodeLocalText(node, ['content:encoded', 'content']) || descriptionRaw;
        const enclosure = Array.from(node.getElementsByTagName('enclosure'))[0];
        const enclosureType = enclosure?.getAttribute('type') || '';
        const enclosureUrl = enclosure?.getAttribute('url') || '';
        let audioUrl = enclosureType.includes('audio') ? enclosureUrl : '';
        if (!audioUrl && /\.(mp3|m4a|aac|ogg)(\?|#|$)/i.test(link)) audioUrl = link;
        let img = '';
        if (enclosureType.includes('image')) img = enclosureUrl;
        if (!img) img = getNodeLocalAttr(node, ['media:thumbnail', 'thumbnail'], 'url');
        if (!img) img = getNodeLocalAttr(node, ['media:content'], 'url');
        if (!img) img = getNodeLocalAttr(node, ['itunes:image'], 'href');
        if (!img) img = getNodeLocalText(node, ['image']);
        if (!img) img = extractImageFromHtmlString(contentRaw || descriptionRaw);
        img = absolutizeUrl(img, link || siteLink || feedUrl) || realLogo;
        const videoId = getNodeLocalText(node, ['yt:videoId', 'videoId']) || getVideoId(link);
        const stableId = stringToHash(`${feedId}-${title}-${link || index}`);
        return { id: `${feedId}-${stableId}`, source: detectedTitle, logo: realLogo, rawDate: pubDate ? new Date(pubDate) : null, pubDate, title, summary: stripFeedText(descriptionRaw, 300), category: 'Geral', img, link, audioFile: audioUrl, videoId, isYoutube: Boolean(videoId || /youtube\.com|youtu\.be/i.test(link)) };
      }).filter(item => item.title || item.link);
      return { items: parsedItems, realTitle: detectedTitle, realLogo, siteLink };
  } catch (err) {
      console.error(`Erro fatal no parser de XML para a fonte "${feedSource}":`, err);
      return { items: [], realTitle: feedSource, realLogo: null, siteLink: feedUrl };
  }
};



const cleanArticleTitleForSource = (title, source = '', url = '') => {
  let clean = repairMojibakeText(stripFeedText(title || '', 260));
  const group = getEditorialGroupKey(source, url);
  if (group === 'sbtnews') {
    const areaWords = [
      'brasil', 'política', 'politica', 'economia', 'mundo', 'saúde', 'saude', 'esportes', 'justiça', 'justica',
      'polícia', 'policia', 'tecnologia', 'cultura', 'eleições', 'eleicoes', 'comprova', 'colunistas',
      'últimas notícias', 'ultimas noticias', 'sbt news', 'notícias', 'noticias'
    ];
    const areaRegex = new RegExp(`^(?:${areaWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*(?:[-–—:|•›»]+|\\s{2,})\\s*`, 'i');
    let prev = '';
    while (prev !== clean) {
      prev = clean;
      clean = clean.replace(areaRegex, '').trim();
    }
  }
  clean = clean.replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
  return clean;
};

const getYoutubeChannelLogo = (url) => {
  const s = String(url || '');
  const chan = s.match(/channel_id=(UC[A-Za-z0-9_-]{22})/i)?.[1];
  if (chan) return `https://unavatar.io/youtube/${chan}?fallback=false`;
  const user = s.match(/[?&]user=([A-Za-z0-9_.-]+)/i)?.[1];
  if (user) return `https://unavatar.io/youtube/${user}?fallback=false`;
  return null;
};
const normalizeFeedItemsForClient = (feed, rawItems, metadata = {}, historyBuffer = {}) => {
  const detectedXmlTitle = metadata.detectedXmlTitle || metadata.title || feed?.name || 'Fonte';
  const siteLink = metadata.siteLink || metadata.link || feed?.url || '';
  const displaySource = cleanSourceDisplayName(feed?.name || detectedXmlTitle, feed?.url || siteLink);
  const sourceGroup = getEditorialGroupKey(displaySource || detectedXmlTitle, feed?.url || siteLink);
  const sourceId = getFeedSourceId(feed);
  const finalLogo = resolveLogoUrl({ source: displaySource, feedUrl: feed?.url, feedLogo: metadata.feedLogo || metadata.logo || feed?.logo, siteUrl: siteLink || feed?.url });
  const isFeedYoutube = Boolean(metadata.isFeedYoutube || metadata.isYoutube || String(feed?.url ?? '').includes('youtube.com') || String(feed?.url ?? '').includes('youtu.be'));
  const youtubeChannelLogo = isFeedYoutube ? getYoutubeChannelLogo(feed?.url) : null;

  return (rawItems || []).slice(0, 40).map((item, index) => {
    const itemTitle = cleanArticleTitleForSource(item?.title || item?.name || item?.description || item?.summary || '', displaySource, item?.link || feed?.url || siteLink);
    const itemLink = item?.link || item?.url || item?.guid || '';
    const rawDateString = item?.pubDate || item?.isoDate || item?.date || item?.published || item?.updated;
    const parsedDate = new Date(rawDateString);
    const now = Date.now();
    let baseTimestamp;
    let dateEstimated = false;
    if (rawDateString && !isNaN(parsedDate.getTime())) baseTimestamp = Math.min(parsedDate.getTime(), now);
    else {
      dateEstimated = true;
      baseTimestamp = now - (2 * 60 * 60 * 1000) - (index * 7 * 60 * 1000);
    }
    const stableKey = buildArticleStableKey(feed, { title: itemTitle, link: itemLink });
    const computed = dateEstimated ? baseTimestamp : (baseTimestamp - index * 1000);
    const finalTimestamp = (historyBuffer[stableKey] != null) ? historyBuffer[stableKey] : computed;
    historyBuffer[stableKey] = finalTimestamp;
    const finalDateObj = new Date(finalTimestamp);
    const primaryLink = itemLink || item.link;
    const audioReal = item.audioFile || item.audio;
    const isYoutubeItem = (primaryLink && (primaryLink.includes('youtube.com') || primaryLink.includes('youtu.be'))) || isFeedYoutube || item.isYoutube;
    let finalType = 'link';
    if (isYoutubeItem) finalType = 'video';
    else if (audioReal || primaryLink?.match(/\.(mp3|m4a|aac|ogg)(\?|#|$)/i)) finalType = 'audio';
    const imageFromItem = item.img || item.image || item.thumbnail || item.mediaThumbnail;
    const finalImage = absolutizeUrl(imageFromItem, primaryLink || siteLink || feed?.url) || finalLogo;
    const cleanSummary = repairMojibakeText(stripFeedText(item?.summary || item?.description || item?.contentEncoded || '', 360));
    const stableHash = stringToHash(`${sourceId}-${item.id || itemTitle}-${primaryLink || index}`);
    return {
      id: `${sourceId}-${stableHash}`,
      source: displaySource,
      sourceId,
      sourceGroup,
    sourceKey: sourceId,
      logo: youtubeChannelLogo || finalLogo,
      time: finalDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rawDate: finalDateObj,
      historicalTimestamp: finalTimestamp,
      title: itemTitle || 'Notícia sem título',
      summary: cleanSummary,
      category: feed?.type === 'podcast' ? 'Podcast' : inferArticleCategory({ title: itemTitle, summary: cleanSummary, source: displaySource, feedCategory: item.category || feed?.category || 'Geral' }),
      feedCategory: normalizeFeedCategoryLabel(feed?.category || 'Geral'),
      type: finalType,
      img: finalImage,
      link: primaryLink,
      audio: audioReal || (primaryLink?.match(/\.(mp3|m4a|aac|ogg)(\?|#|$)/i) ? primaryLink : null),
     videoId: item.videoId || (isYoutubeItem ? getVideoId(primaryLink) : null),
      // contexto Vetra (aditivo — só passa adiante, não altera nada acima)
      canonicalUrl: item.canonicalUrl || primaryLink || null,
      publishedAt: item.publishedAt || null,
      contextText: item.contextText || null,
      contextLevel: item.contextLevel || null,
      contentHash: item.contentHash || null,
      eventType: item.eventType || null,
      entities: item.entities || null,
      keyphrases: item.keyphrases || null,
      normalizedTitle: item.normalizedTitle || null,
      coreWords: item.coreWords || null,
      date: finalDateObj.toLocaleDateString()
    };
  }).filter(Boolean);
};


// --- COMPONENTE: PLAYER DE ÁUDIO GLOBAL (VERSÃO COMPLETA E BLINDADA) ---
const GlobalAudioPlayer = ({ track, onClose, isDarkMode }) => {
  const audioRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isYoutube, setIsYoutube] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 1. Extração de ID Segura
  const ytId = useMemo(() => {
      if (!track) return null;
      if (track.videoId) return track.videoId;
      const match = track.link?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return match ? match[1] : null;
  }, [track]);

  // ==========================================================
  // 2. LÓGICA DE BLINDAGEM (useEffect CORRIGIDO E COMPLETO)
  // ==========================================================
  useEffect(() => {
    if (!track || track.isGenerating) return;

    // Reseta todos os estados para uma execução limpa
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    setIsYoutube(false);

    // Se for um vídeo do YouTube, ativa o modo YouTube e encerra a lógica de áudio.
    if (ytId) {
        setIsYoutube(true);
        return;
    }

    const audioSource = track.audio; // Pega a URL do arquivo .mp3 vindo do parser

    // VERIFICAÇÃO DE SEGURANÇA:
    // Se não há um 'audioSource' ou se ele não parece um arquivo de áudio, marca o erro imediatamente.
    if (!audioSource || !(audioSource.startsWith('http'))) {
        console.error("Fonte de áudio inválida ou ausente. O feed RSS pode não ter a tag <enclosure>. Fonte:", audioSource);
        setHasError(true);
        return; // NÃO TENTA TOCAR NADA. Para a execução aqui.
    }

    // SE PASSOU NA VERIFICAÇÃO, TENTA TOCAR
    if (audioRef.current) {
        try {
            audioRef.current.src = audioSource;
            audioRef.current.load();
            
            const playPromise = audioRef.current.play();
            if (playPromise) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(err => {
                        console.warn("Autoplay do navegador foi bloqueado. O usuário precisa interagir.", err);
                        setIsPlaying(false);
                    });
            }
        } catch (e) {
            console.error("Erro fatal ao tentar carregar e tocar o áudio:", e);
            setHasError(true);
        }
    }
  }, [track, ytId]);

  // --- HANDLER DE FECHAR (FORÇA BRUTA) ---
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = ''; // Limpa a fonte para parar o download
        }
    } catch (err) {
        console.warn("Erro ao pausar áudio no fechamento (ignorado):", err);
    }
    if (onClose) onClose();
  };

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
          if (isPlaying) {
              audioRef.current.pause();
          } else {
              audioRef.current.play().catch(e => console.warn("Play manual falhou:", e));
          }
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
      console.error("Erro no elemento de áudio (handleAudioError):", e.target.error);
      setHasError(true);
      setIsPlaying(false);
  };

  if (!track) return null;

  // Tela de Loading da IA (gerando TTS)
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

  // RENDERIZAÇÃO PRINCIPAL DO PLAYER
  return (
    <div className={`fixed bottom-24 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[99999] rounded-2xl p-4 shadow-2xl backdrop-blur-xl border border-white/10 animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-zinc-900/95 text-white' : 'bg-white/95 text-zinc-900'}`}>
        
        {!isYoutube && (
            <audio 
                ref={audioRef} 
                onTimeUpdate={handleNativeTimeUpdate} 
                onLoadedMetadata={(e) => setDuration(e.target.duration)} 
                onEnded={() => setIsPlaying(false)}
                onError={handleAudioError}
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
                        ? "Formato inválido ou fonte indisponível." 
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





const SplashScreen = ({ onFinish, durationMs = 6800, hasWarmSnapshot = false, ready = false }) => {
  const [step, setStep] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Duração máxima de segurança (se "ready" nunca chegar). Quando o feed fica
  // pronto (ready), dispensamos logo após um tempo mínimo — Splash REAL, não fixo.
  const maxDuration = Math.max(hasWarmSnapshot ? 1200 : 5200, durationMs);
  const minDuration = hasWarmSnapshot ? 1100 : 1600;

  useEffect(() => {
    const start = Date.now();
    const t1 = setTimeout(() => setStep(1), 160);
    const t2 = setTimeout(() => setStep(2), hasWarmSnapshot ? 480 : 1200);
    const tick = setInterval(() => setElapsed(Date.now() - start), 120);
    const statusTimer = setInterval(() => setStatusIndex(i => (i + 1) % 5), hasWarmSnapshot ? 1100 : 1450);
    const hardStop = setTimeout(onFinish, maxDuration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(hardStop); clearInterval(tick); clearInterval(statusTimer); };
  }, [onFinish, maxDuration, hasWarmSnapshot]);

  // Dispensa REAL: quando o feed está pronto e já passou o tempo mínimo.
  useEffect(() => {
    if (!ready) return;
    setStep(3);
    const remaining = Math.max(0, minDuration - elapsed);
    const t = setTimeout(onFinish, remaining + 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const loadingMessages = hasWarmSnapshot
    ? ['Recuperando seu último panorama', 'Verificando o que mudou desde agora', 'Afinando os detalhes', 'Sincronizando em segundo plano', 'Tudo pronto para você']
    : ['Reunindo as fontes mais confiáveis', 'Lendo as manchetes em tempo real', 'Cruzando ângulos e versões', 'Formando os clusters do momento', 'Compondo seu feed editorial'];

  // Progresso: quando pronto → 100; senão, avança suave com o tempo (base real de fases).
  const timedPct = Math.min(94, 10 + (elapsed / maxDuration) * 88);
  const progress = ready ? 100 : Math.round(Math.max(timedPct, 8 + step * 8 + statusIndex * 5));

  const satellites = [
    { label: 'RSS', Icon: Rss, cls: '-left-20 top-2', delay: '0ms' },
    { label: 'Feed', Icon: Layers, cls: 'left-4 -top-16', delay: '90ms' },
    { label: 'Stories', Icon: Sparkles, cls: 'right-4 -top-16', delay: '180ms' },
    { label: 'Clusters', Icon: BrainCircuit, cls: '-right-20 top-2', delay: '270ms' },
  ];

  const squares = Array.from({ length: 12 }, (_, i) => i);
  const innerSquares = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#061027] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(62,114,255,.36),transparent_36%),radial-gradient(circle_at_18%_18%,rgba(255,255,255,.08),transparent_28%),linear-gradient(180deg,#0b1733_0%,#050914_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center px-6 text-center">
        {/* LOGO 2x + anéis de quadradinhos animados */}
        <div className="relative mb-9 flex h-72 w-72 items-center justify-center">
          {/* anel externo de quadradinhos girando */}
          <div className="absolute inset-0 animate-[spin_18s_linear_infinite]">
            {squares.map(i => {
              const a = (i / squares.length) * Math.PI * 2;
              const x = 50 + Math.cos(a) * 46;
              const y = 50 + Math.sin(a) * 46;
              return (
                <span key={i}
                  className="absolute h-2.5 w-2.5 rounded-[3px] bg-gradient-to-br from-blue-200 to-indigo-300/70 shadow-[0_0_12px_rgba(147,197,253,.75)] animate-pulse"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', animationDelay: `${i * 110}ms` }}
                />
              );
            })}
          </div>
          {/* anel interno em rotação contrária, mais discreto */}
          <div className="absolute inset-6 animate-[spin_26s_linear_infinite_reverse]">
            {innerSquares.map(i => {
              const a = (i / innerSquares.length) * Math.PI * 2 + 0.4;
              const x = 50 + Math.cos(a) * 44;
              const y = 50 + Math.sin(a) * 44;
              return (
                <span key={i}
                  className="absolute h-1.5 w-1.5 rounded-[2px] bg-white/40 animate-pulse"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', animationDelay: `${i * 160}ms` }}
                />
              );
            })}
          </div>

          {satellites.map(({ label, Icon, cls, delay }) => (
            <div key={label}
              className={`absolute ${cls} transition-all duration-700 ${step >= 1 ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-sm'} ${step >= 3 ? 'opacity-0 scale-95' : ''}`}
              style={{ transitionDelay: delay }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,.18),0_18px_55px_-28px_rgba(0,0,0,.75)] backdrop-blur-2xl">
                <Icon size={26} className="text-blue-200" />
              </div>
            </div>
          ))}

          <div className="absolute h-52 w-52 rounded-full bg-white/12 blur-3xl" />
          <div className={`relative flex h-56 w-56 items-center justify-center rounded-[2.6rem] border border-white/60 bg-gradient-to-br from-white via-zinc-100 to-zinc-300 shadow-[0_0_90px_rgba(255,255,255,.4),inset_0_1px_1px_rgba(255,255,255,.95)] transition-all duration-700 ${step >= 2 ? 'scale-100 opacity-100' : 'scale-95 opacity-90'}`}>
            <VetraMark className="h-48 w-48" />
          </div>
        </div>

        {/* Nome maior */}
        <h1 className="text-7xl font-black tracking-[-0.07em] text-white drop-shadow-[0_0_32px_rgba(255,255,255,.24)] md:text-8xl">
          Vetra
        </h1>
        <p className="mt-3 text-[16px] font-semibold text-white/60">
          Central de inteligência editorial
        </p>

        {/* Barra maior + estado real */}
        <div className="mt-10 w-full rounded-[1.6rem] border border-white/12 bg-white/8 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.16),0_24px_80px_-42px_rgba(0,0,0,.88)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 text-left">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-40" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(147,197,253,.9)]" />
              </span>
              <span className="truncate text-[16px] font-bold text-white/92">
                {ready ? 'Tudo pronto para você' : loadingMessages[statusIndex]}
              </span>
            </div>
            <span className="shrink-0 text-[13px] font-black tabular-nums text-white/55">{progress}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/30 shadow-[inset_0_1px_2px_rgba(0,0,0,.55)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 shadow-[0_0_22px_rgba(147,197,253,.6)] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
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

// --- VETRA FEED ENGINE HELPERS (snapshot, logos, RSS/Atom e timeout) ---
const FEED_FETCH_TIMEOUT_MS = 4200;
const FEED_EDGE_TIMEOUT_MS = 9000;
const FEED_FIRST_PAINT_MIN_ITEMS = 60;
const FEED_FIRST_PAINT_MIN_SOURCES = 8;
const FEED_FIRST_PAINT_MAX_FEEDS = 11;
const FEED_TEXT_CONCURRENCY = 6;
const FEED_MEDIA_CONCURRENCY = 2;
const FEED_MEMORY_TTL = 8 * 60 * 1000;
const FEED_STARTUP_WINDOW_MS = 6200;
const FEED_STARTUP_HARD_LIMIT_MS = 9200;
const FEED_FAILURE_BACKOFF_MS = 35 * 1000;
const VETRA_VISIBLE_SNAPSHOT_KEY = 'vetra_visible_snapshot_v3';

const INVESTING_BRASIL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#0f172a"/>
  <circle cx="35" cy="35" r="13" fill="#f5a623"/>
  <path d="M25 82h16V52H25v30Zm31 0h16V46H56v36Zm31 0h16V34H87v48Z" fill="#ffffff" opacity=".96"/>
  <path d="M22 96h84" stroke="#f5a623" stroke-width="8" stroke-linecap="round"/>
</svg>
`)}`;


const NOTICIAS_AO_MINUTO_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ec1c24"/><stop offset="1" stop-color="#a50f15"/></linearGradient></defs>
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <circle cx="64" cy="64" r="39" fill="white" opacity=".96"/>
  <path d="M64 31a33 33 0 1 0 0 66 33 33 0 0 0 0-66Zm0 9a24 24 0 1 1 0 48 24 24 0 0 1 0-48Z" fill="#ec1c24"/>
  <path d="M63 47h8v21H51V60h12V47Z" fill="#111827"/>
  <path d="M43 102h42" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".92"/>
</svg>
`)}`;

const SBT_NEWS_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05a8ff"/><stop offset=".38" stop-color="#5b4dff"/><stop offset=".7" stop-color="#ff2d55"/><stop offset="1" stop-color="#ffcc00"/></linearGradient></defs>
  <rect width="128" height="128" rx="28" fill="#061231"/>
  <circle cx="64" cy="64" r="43" fill="url(#s)"/>
  <circle cx="64" cy="64" r="31" fill="#ffffff" opacity=".96"/>
  <text x="64" y="73" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="28" fill="#071126">SBT</text>
  <rect x="30" y="91" width="68" height="12" rx="6" fill="#ffffff" opacity=".9"/>
</svg>
`)}`;

const UOL_BRASIL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#0066cc"/>
  <circle cx="41" cy="48" r="22" fill="#ffb000"/>
  <circle cx="49" cy="43" r="20" fill="#ff5a00" opacity=".86"/>
  <text x="64" y="86" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="36" fill="#fff">uol</text>
</svg>
`)}`;

const SOURCE_LOGO_OVERRIDES = [
  { key: 'jovempan', display: 'Jovem Pan', match: ['jovem pan', 'jovempan'], domains: ['jovempan.com.br'], logo: 'https://www.google.com/s2/favicons?domain=jovempan.com.br&sz=128' },
  { key: 'oglobo', display: 'O Globo', match: ['o globo', 'oglobo'], domains: ['oglobo.globo.com'], logo: 'https://www.google.com/s2/favicons?domain=oglobo.globo.com&sz=128' },
  { key: 'metropoles', display: 'Metrópoles', match: ['metrópoles', 'metropoles'], domains: ['metropoles.com'], logo: 'https://www.google.com/s2/favicons?domain=metropoles.com&sz=128' },
  { key: 'folha', display: 'Folha de S.Paulo', match: ['folha', 'folha de s paulo', 'folha de sao paulo'], domains: ['folha.uol.com.br'], logo: 'https://www.google.com/s2/favicons?domain=folha.uol.com.br&sz=128' },
  { key: 'cnn', display: 'CNN Brasil', match: ['cnn brasil', 'cnn'], domains: ['cnnbrasil.com.br'], logo: 'https://www.google.com/s2/favicons?domain=cnnbrasil.com.br&sz=128' },
  { key: 'g1', display: 'G1', match: ['g1', 'g1 nacional', 'g1 mundo', 'g1 política', 'g1 politica'], domains: ['g1.globo.com'], logo: 'https://www.google.com/s2/favicons?domain=g1.globo.com&sz=128' },
  { key: 'timesbrasil', display: 'Times Brasil', match: ['times brasil', 'timesbrasil'], domains: ['timesbrasil.com.br'], logo: 'https://www.google.com/s2/favicons?domain=timesbrasil.com.br&sz=128' },
  { key: 'terra', display: 'Terra', match: ['terra'], domains: ['terra.com.br'], logo: 'https://www.google.com/s2/favicons?domain=terra.com.br&sz=128' },
  { key: 'extra', display: 'Extra', match: ['extra'], domains: ['extra.globo.com'], logo: 'https://www.google.com/s2/favicons?domain=extra.globo.com&sz=128' },
  { key: 'band', display: 'Portal Band', match: ['portal band', 'band notícias', 'band noticias', 'band news', 'band'], domains: ['band.uol.com.br', 'www.band.uol.com.br'], logo: 'https://www.google.com/s2/favicons?domain=band.uol.com.br&sz=128' },
  { key: 'uolnoticias', display: 'UOL Notícias', match: ['uol notícias', 'uol noticias', 'uol nacional'], domains: ['noticias.uol.com.br', 'rss.uol.com.br', 'uol.com.br'], logo: UOL_BRASIL_LOGO },
  { key: 'uoleconomia', display: 'UOL Economia', match: ['uol economia', 'economia uol'], domains: ['economia.uol.com.br', 'rss.uol.com.br'], logo: UOL_BRASIL_LOGO },
  { key: 'r7', display: 'R7', match: ['r7', 'r7.com'], domains: ['r7.com'], logo: 'https://www.google.com/s2/favicons?domain=r7.com&sz=128' },
  { key: 'sbtnews', display: 'SBT News', match: ['sbt news', 'sbtnews', 'sbt'], domains: ['sbtnews.sbt.com.br', 'sbtnews.com.br'], logo: SBT_NEWS_LOGO },
  { key: 'estadao', display: 'Estadão', match: ['estadão', 'estadao'], domains: ['estadao.com.br'], logo: 'https://www.google.com/s2/favicons?domain=estadao.com.br&sz=128' },
  { key: 'valor', display: 'Valor Econômico', match: ['valor econômico', 'valor economico'], domains: ['valor.globo.com'], logo: 'https://www.google.com/s2/favicons?domain=valor.globo.com&sz=128' },
  { key: 'infomoney', display: 'InfoMoney', match: ['infomoney'], domains: ['infomoney.com.br'], logo: 'https://www.google.com/s2/favicons?domain=infomoney.com.br&sz=128' },
  { key: 'investingbrasil', display: 'Investing Brasil', match: ['investing brasil', 'investing.com brasil', 'investing'], domains: ['br.investing.com', 'investing.com'], logo: INVESTING_BRASIL_LOGO },
  { key: 'bbc', display: 'BBC News Brasil', match: ['bbc news', 'bbc brasil', 'bbc'], domains: ['bbc.com', 'bbc.co.uk'], logo: 'https://www.google.com/s2/favicons?domain=bbc.com&sz=128' },
  { key: 'noticiasaominuto', display: 'Notícias ao Minuto', match: ['notícias ao minuto', 'noticias ao minuto', 'noticias minuto'], domains: ['noticiasaominuto.com.br', 'www.noticiasaominuto.com.br'], logo: NOTICIAS_AO_MINUTO_LOGO },
  { key: '180graus', display: '180graus', match: ['180graus', '180 graus'], domains: ['180graus.com', '180graus.com.br'], logo: 'https://www.google.com/s2/favicons?domain=180graus.com&sz=128' },
  { key: 'piauihoje', display: 'Piauí Hoje', match: ['piauí hoje', 'piaui hoje', 'piauihoje'], domains: ['piauihoje.com.br'], logo: 'https://www.google.com/s2/favicons?domain=piauihoje.com.br&sz=128' },
  { key: 'valorinveste', display: 'Valor Investe', match: ['valor investe', 'valorinveste'], domains: ['valorinveste.globo.com'], logo: 'https://www.google.com/s2/favicons?domain=valorinveste.globo.com&sz=128' },
  { key: 'exame', display: 'Exame', match: ['exame'], domains: ['exame.com'], logo: 'https://www.google.com/s2/favicons?domain=exame.com&sz=128' },
  { key: 'gp1', display: 'GP1', match: ['gp1', 'portal gp1'], domains: ['gp1.com.br'], logo: 'https://www.google.com/s2/favicons?domain=gp1.com.br&sz=128' },
  { key: 'istoe', display: 'ISTOÉ', match: ['istoé', 'istoe'], domains: ['istoe.com.br'], logo: 'https://www.google.com/s2/favicons?domain=istoe.com.br&sz=128' },
  { key: 'istoedinheiro', display: 'ISTOÉ Dinheiro', match: ['istoé dinheiro', 'istoe dinheiro', 'istoedinheiro'], domains: ['istoedinheiro.com.br'], logo: 'https://www.google.com/s2/favicons?domain=istoedinheiro.com.br&sz=128' },
  { key: 'macmagazine', display: 'MacMagazine', match: ['macmagazine'], domains: ['macmagazine.com.br'], logo: 'https://www.google.com/s2/favicons?domain=macmagazine.com.br&sz=128' },
  { key: '9to5mac', display: '9to5Mac', match: ['9to5mac', '9to5 mac'], domains: ['9to5mac.com'], logo: 'https://www.google.com/s2/favicons?domain=9to5mac.com&sz=128' },
  { key: 'foxnews', display: 'Fox News', match: ['fox news'], domains: ['foxnews.com'], logo: 'https://www.google.com/s2/favicons?domain=foxnews.com&sz=128' },
  { key: 'washingtonpost', display: 'Washington Post', match: ['washington post', 'the washington post', 'washingtonpost'], domains: ['washingtonpost.com'], logo: 'https://www.google.com/s2/favicons?domain=washingtonpost.com&sz=128' },
  { key: 'appleinsider', display: 'Apple Insider News', match: ['apple insider', 'apple insider news', 'appleinsidernews'], domains: ['appleinsider.com'], logo: 'https://media.licdn.com/dms/image/v2/C4D0BAQGfO86wS9645Q/company-logo_200_200/company-logo_200_200/0/1631364742854?e=2147483647&v=beta&t=clBv8BXjYMf-UdHovK07aPWpLM-N-a0CUoueZ17cHns' },
  { key: 'cidadeverde', display: 'Cidade Verde', match: ['cidade verde', 'cidadeverde'], domains: ['cidadeverde.com', 'cidadeverde.com.br'], logo: 'https://www.google.com/s2/favicons?domain=cidadeverde.com&sz=128' },
];

const isLikelyHttpUrl = (value) => /^https?:\/\//i.test(String(value ?? '').trim());
const normalizeSpaces = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeSourceKey = (value) => normalizeSpaces(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const repairMojibakeText = (value) => {
  let text = String(value ?? '');
  if (!text) return '';
  // Correções leves para textos que ainda cheguem com mojibake pelo fallback do navegador.
  text = text
    .replace(/Ã¡/g, 'á').replace(/Ã /g, 'à').replace(/Ã¢/g, 'â').replace(/Ã£/g, 'ã').replace(/Ã¤/g, 'ä')
    .replace(/Ã©/g, 'é').replace(/Ãª/g, 'ê').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã´/g, 'ô').replace(/Ãµ/g, 'õ')
    .replace(/Ãº/g, 'ú').replace(/Ã§/g, 'ç').replace(/Ã�/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã“/g, 'Ó')
    .replace(/Âº/g, 'º').replace(/Âª/g, 'ª').replace(/Â°/g, '°').replace(/Â/g, '')
    .replace(/�/g, '');
  return normalizeSpaces(text);
};

const getSourceOverride = (source, url = '') => {
  const sourceKey = normalizeSourceKey(repairMojibakeText(source));
  const domain = getUrlDomain(url);
  return SOURCE_LOGO_OVERRIDES.find(entry => {
    const byName = (entry.match || []).some(name => sourceKey.includes(normalizeSourceKey(name)) || normalizeSourceKey(name).includes(sourceKey));
    const byDomain = (entry.domains || []).some(item => domain.includes(item) || item.includes(domain));
    return byName || byDomain;
  }) || null;
};

const cleanSourceDisplayName = (source, url = '') => {
  const repaired = repairMojibakeText(source || 'Fonte');
  const override = getSourceOverride(repaired, url);
  if (override?.display) return override.display;
  const compact = normalizeSourceKey(repaired);
  if (compact === 'ultimas noticias' || compact === 'noticias' || compact === 'mundo' || compact === 'brasil') {
    const domain = getUrlDomain(url);
    if (domain) return domain.replace(/\.(com|com\.br|globo\.com|uol\.com\.br)$/i, '').split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  }
  return repaired;
};

const getEditorialGroupKey = (source, url = '') => {
  const override = getSourceOverride(source, url);
  if (override?.key) return override.key;
  const sourceKey = normalizeSourceKey(source);
  const domain = getUrlDomain(url);
  if (domain.includes('globo.com') || sourceKey.includes('g1')) return 'g1';
  if (domain.includes('uol.com.br') || sourceKey.includes('uol')) return sourceKey.includes('economia') ? 'uoleconomia' : 'uolnoticias';
  if (domain.includes('r7.com') || sourceKey.includes('r7')) return 'r7';
  if (domain.includes('sbt') || sourceKey.includes('sbt')) return 'sbtnews';
  if (domain.includes('band.uol') || sourceKey.includes('band')) return 'band';
  return sourceKey || domain || 'fonte';
};

const PRIORITY_SOURCE_KEYS = [
  'jovempan', 'oglobo', 'metropoles', 'folha', 'cnn', 'g1', 'timesbrasil', 'terra', 'extra', 'band', 'uolnoticias',
  'uoleconomia', 'r7', 'sbtnews', 'estadao', 'valor', 'infomoney'
];


const inferArticleCategory = ({ title = '', summary = '', source = '', feedCategory = '' } = {}) => {
  const explicit = normalizeSpaces(feedCategory || '');
  const explicitKey = normalizeSourceKey(explicit);
  if (['economia','tecnologia','local','carros','mundo','politica','política','saude','saúde','esportes','ciencia','ciência'].includes(explicitKey)) {
    if (explicitKey === 'politica') return 'Política';
    if (explicitKey === 'saude') return 'Saúde';
    if (explicitKey === 'ciencia') return 'Ciência';
    return explicit.charAt(0).toUpperCase() + explicit.slice(1);
  }
  const haystack = normalizeSourceKey(`${title} ${summary} ${source} ${feedCategory}`);
  const hasAny = (words) => words.some(word => haystack.includes(normalizeSourceKey(word)));
  if (hasAny(['dolar','economia','mercado','bolsa','ibovespa','juros','selic','inflacao','pib','banco central','preco','preços','petrobras','vale','bitcoin','cripto','imposto','fazenda','fiscal'])) return 'Economia';
  if (hasAny(['iphone','apple','google','microsoft','openai','inteligencia artificial','ia','tecnologia','app','software','chip','macbook','samsung','android','startup'])) return 'Tecnologia';
  if (hasAny(['carro','carros','automovel','automóvel','veiculo','veículo','moto','f1','formula 1','fórmula 1','volkswagen','toyota','byd','tesla'])) return 'Carros';
  if (hasAny(['eua','estados unidos','trump','china','europa','russia','rússia','ucrania','ucrânia','israel','gaza','argentina','venezuela','paraguai','alemanha','franca','frança','mundo','internacional'])) return 'Mundo';
  if (hasAny(['lula','bolsonaro','congresso','senado','camara','câmara','stf','governo','ministro','eleicao','eleição','politica','política','prefeito','governador','deputado'])) return 'Política';
  if (hasAny(['saude','saúde','anvisa','hospital','doenca','doença','vacina','virus','vírus','medico','médico','sus','cancer','câncer'])) return 'Saúde';
  if (hasAny(['copa','futebol','jogo','gol','vitoria','vitória','seleção','selecao','flamengo','palmeiras','corinthians','vasco','botafogo','atletico','atlético','esporte'])) return 'Esportes';
  if (hasAny(['ciencia','ciência','pesquisa','nasa','espaco','espaço','estudo','cientista','astronomia'])) return 'Ciência';
  if (hasAny(['teresina','piaui','piauí','maranhao','maranhão','ceara','ceará','df','rio de janeiro','sao paulo','são paulo','municipio','município','cidade','bairro'])) return 'Local';
  return 'Geral';
};

const getFeedSourceId = (feed) => String(feed?.id || feed?.url || feed?.name || '').trim();

const getFeedPriorityScore = (feed) => {
  const group = getEditorialGroupKey(feed?.name, feed?.url);
  const idx = PRIORITY_SOURCE_KEYS.indexOf(group);
  if (idx >= 0) return idx;
  const name = normalizeSourceKey(feed?.name || '');
  if (name.includes('g1') || name.includes('uol') || name.includes('cnn') || name.includes('folha')) return 25;
  return 100;
};

const sortFeedsEditorially = (feeds) => [...(feeds || [])].sort((a, b) => {
  const pa = getFeedPriorityScore(a);
  const pb = getFeedPriorityScore(b);
  if (pa !== pb) return pa - pb;
  return normalizeSourceKey(a?.name || a?.url).localeCompare(normalizeSourceKey(b?.name || b?.url));
});

const buildSourceCatalogFromFeeds = (feeds) => {
  const seen = new Set();
  return sortFeedsEditorially((feeds || []).filter(feed => String(feed?.url || '').trim()))
    .filter(feed => feed?.type !== 'youtube' && feed?.type !== 'podcast' && !String(feed?.url || '').includes('youtube.com'))
    .map(feed => {
      const id = getFeedSourceId(feed);
      const groupKey = getEditorialGroupKey(feed?.name, feed?.url);
      const displayName = cleanSourceDisplayName(feed?.name || groupKey, feed?.url);
      const logo = resolveLogoUrl({ source: displayName, feedUrl: feed?.url, feedLogo: feed?.logo, siteUrl: feed?.url });
      return { id, groupKey, name: displayName, url: feed?.url, logo, category: feed?.category || 'Geral', priority: getFeedPriorityScore(feed), feed };
    })
    .filter(item => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
};

const countDistinctEditorialGroups = (items) => new Set((items || []).map(item => item?.sourceGroup || getEditorialGroupKey(item?.source, item?.link)).filter(Boolean)).size;

const getUrlDomain = (value) => {
  try { if (!value) return ''; const normalized = isLikelyHttpUrl(value) ? value : `https://${value}`; return new URL(normalized).hostname.replace(/^www\./i, '').toLowerCase(); } catch { return ''; }
};
const absolutizeUrl = (candidate, baseUrl) => {
  let clean = String(candidate ?? '').trim().replace(/^['"]+|['"]+$/g, '').replace(/\s/g, '');
  if (!clean) return null;
  const lastHttps = clean.lastIndexOf('https://');
  const lastHttp = clean.lastIndexOf('http://');
  const lastAbsolute = Math.max(lastHttps, lastHttp);
  if (lastAbsolute > 0) clean = clean.slice(lastAbsolute);
  if (clean.startsWith('//')) return `https:${clean}`;
  if (clean.startsWith('http://')) return clean.replace(/^http:\/\//i, 'https://');
  if (clean.startsWith('https://')) return clean;
  try { return new URL(clean, baseUrl || 'https://example.com').href; } catch { return null; }
};
const resolveLogoUrl = ({ source, feedUrl, feedLogo, siteUrl }) => {
  const feedDomain = getUrlDomain(feedUrl || siteUrl);
  const siteDomain = getUrlDomain(siteUrl || feedUrl);
  const trustedLogo = String(feedLogo ?? '').trim();
  const override = getSourceOverride(source, siteUrl || feedUrl);
  if (override?.logo) return override.logo;
  if (trustedLogo && !trustedLogo.includes('ui-avatars.com') && !trustedLogo.includes('t0.gstatic.com')) return absolutizeUrl(trustedLogo, siteUrl || feedUrl) || trustedLogo;
  const domain = siteDomain || feedDomain;
  if (domain) return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanSourceDisplayName(source || 'Fonte'))}&background=random&color=fff&size=128&bold=true`;
};
const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = FEED_FETCH_TIMEOUT_MS, ...fetchOptions } = options || {};
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') return fetch(url, { ...fetchOptions, signal: AbortSignal.timeout(timeout) });
  const controller = new AbortController(); const id = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...fetchOptions, signal: controller.signal }); } finally { clearTimeout(id); }
};
const withPromiseTimeout = (promise, timeout = FEED_EDGE_TIMEOUT_MS, label = 'operação') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} excedeu ${timeout}ms`)), timeout);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};
const countDistinctSources = (items) => new Set((items || []).map(item => String(item?.source || '').trim()).filter(Boolean)).size;
const shouldDoFirstPaint = ({ items, completedTextFeeds, totalTextFeeds }) => {
  const distinctSources = countDistinctSources(items);
  if (!items?.length) return false;
  if (distinctSources >= FEED_FIRST_PAINT_MIN_SOURCES && items.length >= FEED_FIRST_PAINT_MIN_ITEMS) return true;
  if (completedTextFeeds >= Math.min(FEED_FIRST_PAINT_MAX_FEEDS, totalTextFeeds) && distinctSources >= 2) return true;
  if (completedTextFeeds >= totalTextFeeds) return true;
  return false;
};
const findXmlChildByName = (node, wantedName) => {
  const full = String(wantedName ?? '').toLowerCase();
  const localName = full.split(':').pop();
  const children = Array.from(node?.children || []);
  const byChild = children.find(child => {
    const tag = String(child?.tagName || child?.nodeName || '').toLowerCase();
    const local = String(child?.localName || '').toLowerCase();
    return tag === full || local === full || local === localName;
  });
  if (byChild) return byChild;
  try {
    const namespaced = node?.getElementsByTagName?.(wantedName)?.[0];
    if (namespaced) return namespaced;
  } catch {}
  if (!full.includes(':') && /^[a-zA-Z][\w-]*$/.test(full)) {
    try { return node?.querySelector?.(wantedName) || null; } catch {}
  }
  return null;
};
const getNodeLocalText = (node, names) => {
  const targets = Array.isArray(names) ? names : [names];
  for (const name of targets) {
    const found = findXmlChildByName(node, name);
    if (found?.textContent) return normalizeSpaces(found.textContent);
  }
  return '';
};
const getNodeLocalAttr = (node, names, attr) => {
  const targets = Array.isArray(names) ? names : [names];
  for (const name of targets) {
    const found = findXmlChildByName(node, name);
    const value = found?.getAttribute?.(attr);
    if (value) return value;
  }
  return '';
};
const extractImageFromHtmlString = (html) => {
  const content = String(html ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  if (!content) return null;
  try { const doc = new DOMParser().parseFromString(content, 'text/html'); const images = Array.from(doc.querySelectorAll('img')); for (const img of images) { const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || img.getAttribute('src'); if (src && !/pixel|spacer|blank|\.gif|\.svg|\.woff/i.test(src)) return src; } } catch {}
  const match = content.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/i); return match?.[0] || null;
};
const stripFeedText = (value, max = 500) => normalizeSpaces(String(value ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).slice(0, max);
const runConcurrentPool = async (items, limit, worker) => { let index = 0; const workerCount = Math.min(Math.max(1, limit), items.length); const workers = Array.from({ length: workerCount }, async () => { while (index < items.length) { const currentIndex = index++; await worker(items[currentIndex], currentIndex); } }); await Promise.allSettled(workers); };
const buildArticleStableKey = (feed, item) => { const titleKey = normalizeSourceKey(item?.title || item?.name || item?.description || item?.link || item?.url || 'item').slice(0, 100); return `${feed?.id ?? feed?.url ?? 'feed'}::${titleKey}`; };
const mergeSmartStoriesStable = (previousStories, nextStories, maxStories = 18, forceReset = false) => {
  const cleanNext = (nextStories || []).filter(Boolean);
  if (forceReset || !previousStories?.length) return cleanNext.slice(0, maxStories);
  const nextBySource = new Map(cleanNext.map(story => [story.name || story.source || story.id, story]));
  const used = new Set(); const merged = [];
  for (const previous of previousStories) { const key = previous.name || previous.source || previous.id; const replacement = nextBySource.get(key); if (replacement) { merged.push(replacement); used.add(key); } else merged.push(previous); }
  for (const story of cleanNext) { const key = story.name || story.source || story.id; if (!used.has(key) && !merged.some(item => item.id === story.id)) { merged.push(story); used.add(key); } }
  return merged.slice(0, maxStories);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeFeedCategoryLabel = (value) => {
  const key = normalizeSourceKey(value);
  if (!key || key === 'tudo') return 'Tudo';
  if (key === 'politica') return 'Política';
  if (key === 'saude') return 'Saúde';
  if (key === 'ciencia') return 'Ciência';
  if (key === 'tecnologia') return 'Tecnologia';
  if (key === 'economia') return 'Economia';
  if (key === 'local') return 'Local';
  if (key === 'carros') return 'Carros';
  if (key === 'mundo' || key === 'internacional') return 'Mundo';
  if (key === 'esportes' || key === 'esporte') return 'Esportes';
  if (key === 'geral' || key === 'noticias' || key === 'noticias gerais') return 'Geral';
  return value || 'Geral';
};

const articleMatchesCategory = (article, selectedCategory) => {
  if (!selectedCategory || selectedCategory === 'Tudo') return true;
  const expected = normalizeFeedCategoryLabel(selectedCategory);
  // Puro-por-fonte: a notícia pertence à categoria da FONTE definida nas Configurações.
  const sourceCategory = normalizeFeedCategoryLabel(article?.feedCategory || 'Geral');
  return sourceCategory === expected;
};

const sourceMatchesCategory = (source, selectedCategory) => {
  if (!selectedCategory || selectedCategory === 'Tudo') return true;
  const expected = normalizeFeedCategoryLabel(selectedCategory);
  // Puro-por-fonte: a fonte pertence à categoria definida nas Configurações.
  const sourceCategory = normalizeFeedCategoryLabel(source?.category || source?.feed?.category || 'Geral');
  return sourceCategory === expected;
};

const getClusterFingerprint = (articles = [], title = '') => {
  const sourcePart = (articles || [])
    .slice(0, 8)
    .map(article => `${article?.sourceGroup || getEditorialGroupKey(article?.source, article?.link)}:${normalizeSourceKey(article?.title || '').slice(0, 44)}`)
    .sort()
    .join('|');
  return `${normalizeSourceKey(title).slice(0, 80)}::${sourcePart}` || String(Date.now());
};

const getArticleTopicSignature = (article) => {
  const stop = new Set(['para','com','uma','um','que','dos','das','por','apos','após','sobre','contra','como','mais','menos','diz','afirma','segundo','nesta','neste','hoje','agora','novo','nova','anos','dia','depois']);
  return normalizeSourceKey(article?.title || '')
    .split(/\s+/)
    .filter(word => word.length >= 4 && !stop.has(word))
    .slice(0, 5)
    .join(' ');
};

const computeBreakingHighlights = (news = []) => {
  const sorted = sortByDateSafe(news).filter(item => item?.title);
  if (!sorted.length) return [];
  const firstFeedSignatures = new Set(sorted.slice(0, 4).map(getArticleTopicSignature));
  const urgentWords = ['urgente','alerta','morre','morte','ataque','explosao','explosão','acidente','prisao','prisão','queda','aumento','alta','baixa','greve','decide','anuncia','aprova','decreta','rompe','fecha','bloqueia','recorde'];
  const usedGroups = new Set();
  const usedTopics = new Set();
  const scored = sorted.slice(0, 140).map((item, idx) => {
    const ageMs = Math.max(0, Date.now() - new Date(item.rawDate || Date.now()).getTime());
    const ageMinutes = ageMs / 60000;
    const recencyScore = Math.max(0, 80 - Math.min(80, ageMinutes / 3));
    const titleKey = normalizeSourceKey(item.title || '');
    const urgencyScore = urgentWords.some(word => titleKey.includes(normalizeSourceKey(word))) ? 38 : 0;
    const sourcePriority = Math.max(0, 28 - Math.min(28, getFeedPriorityScore({ name: item.source, url: item.link }) || 100));
    const imageScore = item.img && !String(item.img).includes('favicon') && !String(item.img).includes('ui-avatars') ? 8 : 0;
    const antiTopPenalty = firstFeedSignatures.has(getArticleTopicSignature(item)) && idx < 4 ? -22 : 0;
    return { item, score: recencyScore + urgencyScore + sourcePriority + imageScore + antiTopPenalty };
  }).sort((a, b) => b.score - a.score);

  const highlights = [];
  for (const { item } of scored) {
    const group = item.sourceGroup || getEditorialGroupKey(item.source, item.link);
    const topic = getArticleTopicSignature(item);
    if (!topic || usedTopics.has(topic)) continue;
    if (usedGroups.has(group) && highlights.length < 3) continue;
    usedGroups.add(group);
    usedTopics.add(topic);
    highlights.push(item);
    if (highlights.length >= 3) break;
  }
  return highlights.length >= 3 ? highlights : sorted.slice(0, 3);
};

const computeTrendingTopics = (news = []) => {
  const items = sortByDateSafe(news).slice(0, 720).filter(item => item?.title);
  const stop = new Set([
    'para','como','mais','sobre','apos','após','entre','contra','esta','este','nesta','neste','pela','pelo','com','dos','das','uma','que','por','nas','nos','ser','vai','tem','sao','são','foi','diz','ano','anos','dia','hoje','ontem','amanha','amanhã','agora','ainda','deve','devem','pode','podem','sera','será','ter','tem','têm','durante','porque','quando','onde','qual','quais','quem','cada','todo','toda','todos','todas',
    'noticia','notícia','noticias','notícias','ultimas','últimas','minuto','minutos','veja','confira','saiba','entenda','video','vídeo','foto','fotos','abre','abrir','fechar','fecha','novo','nova','novos','novas','melhor','maior','menor','disse','afirma','segundo','revela','mostra','explica','acompanhe','vivo','tudo','destaque','destaques',
    'uol','g1','globo','sbt','cnn','band','terra','r7','folha','metropoles','jovem','pan','istoé','istoe','exame','valor','investing','noticias','minuto'
  ]);
  const badSingleWords = new Set(['brasil','mundo','governo','presidente','mercado','politica','política','economia','pessoas','cidade','estado','fonte','fontes','veja','pode','deve','hoje','agora','ultimas','noticias']);
  const strongSingleWords = new Set(['copa','trump','lula','bolsonaro','bitcoin','ibovespa','selic','paraguai','alemanha','ucrania','ucrânia','israel','gaza','iran','irã']);
  const sourceNameKeys = new Set(SOURCE_LOGO_OVERRIDES.flatMap(entry => [entry.key, entry.display, ...(entry.match || [])].map(normalizeSourceKey)).filter(Boolean));
  const map = new Map();

  const normalizeTermLabel = (term) => normalizeSpaces(repairMojibakeText(term))
    .replace(/^[,.;:!?\-–—|•]+|[,.;:!?\-–—|•]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const titleCaseTopic = (term) => {
    const keepUpper = new Set(['UOL','G1','CNN','SBT','EUA','STF','PIB','IR','IA','ONU','UE','CPI','PIX']);
    return normalizeTermLabel(term).split(/\s+/).map((word, index) => {
      const upper = word.toUpperCase();
      if (keepUpper.has(upper)) return upper;
      if (['de','da','do','dos','das','e','em','no','na','nos','nas'].includes(word.toLowerCase()) && index > 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const tokenIsGood = (word) => {
    const key = normalizeSourceKey(word);
    if (!key || key.length < 4) return false;
    if (stop.has(key) || sourceNameKeys.has(key)) return false;
    if (/^\d+$/.test(key)) return false;
    return true;
  };

  const isBadTerm = (term) => {
    const key = normalizeSourceKey(term);
    if (!key || key.length < 4) return true;
    if (stop.has(key) || sourceNameKeys.has(key)) return true;
    if (/^\d+$/.test(key)) return true;
    const parts = key.split(/\s+/).filter(Boolean);
    if (parts.some(part => stop.has(part) || sourceNameKeys.has(part))) return true;
    if (parts.length === 1 && badSingleWords.has(parts[0]) && !strongSingleWords.has(parts[0])) return true;
    if (parts.length > 4) return true;
    return false;
  };

  const register = (term, article, weight = 1) => {
    const label = titleCaseTopic(term);
    const key = normalizeSourceKey(label);
    if (isBadTerm(label)) return;
    const parts = key.split(/\s+/).filter(Boolean);
    if (parts.length === 1 && !strongSingleWords.has(parts[0])) return;
    const ageMs = Math.max(0, Date.now() - new Date(article.rawDate || Date.now()).getTime());
    const recency = Math.max(0.25, 1 - Math.min(ageMs, 30 * 60 * 60 * 1000) / (30 * 60 * 60 * 1000));
    const sourceGroup = article.sourceGroup || getEditorialGroupKey(article.source, article.link);
    const current = map.get(key) || { label, score: 0, sources: new Set(), articleKeys: new Set(), articles: [] };
    const articleKey = getArticleTopicSignature(article) || article.id || article.link || article.title;
    const phraseBonus = parts.length >= 3 ? 1.35 : parts.length === 2 ? 1.18 : 1;
    current.score += weight * phraseBonus * (1 + recency);
    current.sources.add(sourceGroup);
    if (!current.articleKeys.has(articleKey)) {
      current.articleKeys.add(articleKey);
      if (current.articles.length < 20) current.articles.push(article);
    }
    map.set(key, current);
  };

  items.forEach(article => {
    const title = repairMojibakeText(article.title || '');
    const sourceKey = normalizeSourceKey(article.source || '');
    const rawEntities = (title.match(/\b[A-ZÁÉÍÓÚÃÕÂÊÔÇ][\wÀ-ú]{2,}(?:\s+(?:de|da|do|dos|das|e|[A-ZÁÉÍÓÚÃÕÂÊÔÇ][\wÀ-ú]{2,})){0,3}/g) || [])
      .map(normalizeTermLabel)
      .filter(entity => !isBadTerm(entity));

    rawEntities.slice(0, 6).forEach(entity => {
      const parts = normalizeSourceKey(entity).split(/\s+/).filter(Boolean);
      register(entity, article, parts.length >= 2 ? 2.7 : 1.25);
    });

    const normalizedWords = normalizeSourceKey(title)
      .split(/\s+/)
      .filter(word => tokenIsGood(word) && !sourceKey.includes(word));

    for (let i = 0; i < normalizedWords.length; i++) {
      const one = normalizedWords[i];
      const two = normalizedWords[i + 1] ? `${one} ${normalizedWords[i + 1]}` : '';
      const three = normalizedWords[i + 2] ? `${one} ${normalizedWords[i + 1]} ${normalizedWords[i + 2]}` : '';
      if (three && !isBadTerm(three)) register(three, article, 2.25);
      if (two && !isBadTerm(two)) register(two, article, 1.85);
      if (strongSingleWords.has(one)) register(one, article, 1.1);
    }
  });

  const candidates = Array.from(map.values())
    .map(item => ({
      ...item,
      sourceCount: item.sources.size,
      articleCount: item.articleKeys.size,
      finalScore: item.score * (1 + Math.min(8, item.sources.size) * 0.38) * (1 + Math.min(12, item.articleKeys.size) * 0.055),
    }))
    .filter(item => item.sourceCount >= 2 && item.articleCount >= 2)
    .sort((a, b) => b.finalScore - a.finalScore);

  const selected = [];
  const selectedKeys = new Set();
  for (const item of candidates) {
    const key = normalizeSourceKey(item.label);
    const parts = key.split(/\s+/).filter(Boolean);
    const overlaps = selected.some(other => {
      const otherParts = normalizeSourceKey(other.label).split(/\s+/).filter(Boolean);
      const common = parts.filter(p => otherParts.includes(p)).length;
      const smaller = Math.min(parts.length, otherParts.length);
      return common >= Math.max(1, smaller - 1) && smaller <= 3;
    });
    if (overlaps || selectedKeys.has(key)) continue;
    selected.push(item);
    selectedKeys.add(key);
    if (selected.length >= 5) break;
  }

  const max = selected[0]?.finalScore || 1;
  return selected.map(item => ({
    t: item.label,
    n: `${item.sourceCount} fontes · ${item.articleCount} manchetes`,
    v: Math.max(24, Math.round((item.finalScore / max) * 100)),
    articles: sortByDateSafe(item.articles),
    sourceCount: item.sourceCount,
    articleCount: item.articleCount,
  }));
};


const sortByDateSafe = (items) => [...(items || [])].sort((a, b) => {
  const timeA = a?.rawDate ? new Date(a.rawDate).getTime() : 0;
  const timeB = b?.rawDate ? new Date(b.rawDate).getTime() : 0;
  return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
});

const buildSnapshotHash = (snapshot) => {
  const newsIds = (snapshot?.news || []).slice(0, 80).map(item => item?.id || item?.link || item?.title).join('|');
  const videoIds = (snapshot?.videos || []).slice(0, 20).map(item => item?.id || item?.link || item?.title).join('|');
  const podcastIds = (snapshot?.podcasts || []).slice(0, 20).map(item => item?.id || item?.link || item?.title).join('|');
  return `${newsIds}::${videoIds}::${podcastIds}`;
};

const normalizeSnapshotForStorage = (snapshot) => ({
  news: Array.isArray(snapshot?.news) ? snapshot.news.slice(0, 180) : [],
  videos: Array.isArray(snapshot?.videos) ? snapshot.videos.slice(0, 80) : [],
  podcasts: Array.isArray(snapshot?.podcasts) ? snapshot.podcasts.slice(0, 80) : [],
  clusters: Array.isArray(snapshot?.clusters) ? snapshot.clusters.slice(0, 8) : [],
  stories: Array.isArray(snapshot?.stories) ? snapshot.stories.slice(0, 24) : [],
  timestamp: snapshot?.timestamp || Date.now(),
  version: snapshot?.version || Date.now(),
});

const readVisibleSnapshotFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VETRA_VISIBLE_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.news)) return null;
    const totalItems = (parsed.news?.length || 0) + (parsed.videos?.length || 0) + (parsed.podcasts?.length || 0);
    if (totalItems === 0) return null;
    return normalizeSnapshotForStorage(parsed);
  } catch (error) {
    console.warn('Snapshot local inválido, ignorando:', error);
    return null;
  }
};

const persistVisibleSnapshot = (snapshot) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VETRA_VISIBLE_SNAPSHOT_KEY, JSON.stringify(normalizeSnapshotForStorage(snapshot)));
  } catch (error) {
    console.warn('Não foi possível salvar snapshot visível:', error);
  }
};

const isInitialSnapshotGoodEnough = (snapshot, completedAllTextFeeds = false) => {
  const news = snapshot?.news || [];
  const sourceCount = countDistinctEditorialGroups(news);
  if (sourceCount >= FEED_FIRST_PAINT_MIN_SOURCES && news.length >= FEED_FIRST_PAINT_MIN_ITEMS) return true;
  if (sourceCount >= 6 && news.length >= 36) return true;
  if (completedAllTextFeeds && sourceCount >= 4 && news.length >= 24) return true;
  if (completedAllTextFeeds && news.length >= 16) return true;
  return false;
};

const hasMeaningfulSnapshot = (snapshot) => {
  return ((snapshot?.news?.length || 0) + (snapshot?.videos?.length || 0) + (snapshot?.podcasts?.length || 0)) > 0;
};

const createFallbackEditorialClusters = (news) => {
  const sorted = sortByDateSafe(news).filter(Boolean);
  if (sorted.length < 5) return [];

  const groups = [
    { key: 'Economia', label: 'Mercado e economia concentram atenção do dia', words: ['dólar', 'dolar', 'bolsa', 'ibovespa', 'juros', 'selic', 'inflação', 'inflacao', 'mercado', 'economia', 'petr', 'vale', 'bitcoin', 'cripto'] },
    { key: 'Política', label: 'Política nacional tem novos desdobramentos', words: ['lula', 'bolsonaro', 'congresso', 'senado', 'câmara', 'camara', 'stf', 'governo', 'ministro', 'política', 'politica', 'eleição', 'eleicao'] },
    { key: 'Mundo', label: 'Cenário internacional movimenta o noticiário', words: ['eua', 'trump', 'china', 'rússia', 'russia', 'ucrânia', 'ucrania', 'israel', 'gaza', 'europa', 'argentina', 'venezuela', 'paraguai'] },
    { key: 'Brasil', label: 'Brasil reúne os principais destaques recentes', words: ['brasil', 'brasileiro', 'federal', 'polícia', 'policia', 'justiça', 'justica', 'cidade', 'estado', 'df'] },
    { key: 'Esportes', label: 'Esportes puxam forte interesse dos leitores', words: ['copa', 'futebol', 'seleção', 'selecao', 'jogo', 'vitória', 'vitoria', 'alemanha', 'brasil', 'paraguai'] },
  ];

  const usedIds = new Set();
  const clusters = [];

  for (const group of groups) {
    const related = sorted.filter(article => {
      if (usedIds.has(article.id)) return false;
      const haystack = normalizeSourceKey(`${article.title || ''} ${article.summary || ''} ${article.category || ''}`);
      return group.words.some(word => haystack.includes(normalizeSourceKey(word)));
    }).slice(0, 5);

    if (related.length >= 2) {
      related.forEach(article => usedIds.add(article.id));
      const uniqueSources = new Set(related.map(article => article.source).filter(Boolean)).size;
      const representative = related.find(article => article.img && !String(article.img).includes('ui-avatars.com')) || related[0];
      clusters.push({
        clusterId: getClusterFingerprint(related, related[0]?.title || group.label),
        ai_title: related[0]?.title || group.label,
        ai_summary: `Agrupamento editorial inicial com ${related.length} notícias e ${uniqueSources || 1} fonte${uniqueSources === 1 ? '' : 's'}. O caso pode ser refinado quando mais fontes terminarem de carregar.`,
        representative_image: representative?.img,
        related_articles: related,
        keyEntities: [group.key],
        isFallbackCluster: true,
      });
    }

    if (clusters.length >= 5) break;
  }

  if (clusters.length < 3) {
    const remaining = sorted.filter(article => !usedIds.has(article.id)).slice(0, 12);
    for (let i = 0; i < remaining.length; i += 4) {
      const related = remaining.slice(i, i + 4);
      if (related.length < 2) continue;
      const representative = related.find(article => article.img && !String(article.img).includes('ui-avatars.com')) || related[0];
      clusters.push({
        clusterId: getClusterFingerprint(related, related[0]?.title || 'Destaques recentes do momento'),
        ai_title: related[0]?.title || 'Destaques recentes do momento',
        ai_summary: `Seleção temporal inicial com ${related.length} notícias recentes. O agrupamento fica estável até o próximo refresh.`,
        representative_image: representative?.img,
        related_articles: related,
        keyEntities: ['Destaques'],
        isFallbackCluster: true,
      });
      if (clusters.length >= 5) break;
    }
  }

  return clusters.slice(0, 5);
};






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

  const isShort = String(currentItem?.link ?? '').includes('/shorts/') || safeLower(currentItem?.title).includes('#shorts');
  
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



const generateSmartStories = (news, allClusters, sourceCatalog = []) => {
    if (!news || news.length === 0) return [];

    const sortedNews = [...news]
      .filter(Boolean)
      .sort((a, b) => (b?.rawDate ? new Date(b.rawDate).getTime() : 0) - (a?.rawDate ? new Date(a.rawDate).getTime() : 0));

    const topFeedIds = new Set(sortedNews.slice(0, 24).map(item => item?.id).filter(Boolean));
    const clusterLeadIds = new Set();
    const clusterArticleIds = new Set();

    (allClusters || []).forEach(cluster => {
        const articles = typeof normalizeClusterArticles === 'function' ? normalizeClusterArticles(cluster) : (cluster?.related_articles || []);
        if (articles?.[0]?.id) clusterLeadIds.add(articles[0].id);
        articles?.forEach(article => article?.id && clusterArticleIds.add(article.id));
    });

    const byGroup = new Map();
    sortedNews.forEach((item) => {
        const group = item?.sourceGroup || getEditorialGroupKey(item?.source, item?.link);
        if (!byGroup.has(group)) byGroup.set(group, []);
        byGroup.get(group).push(item);
    });

    const hasGoodVisual = (item) => {
        const img = String(item?.img || '');
        return img.length > 12 && !img.includes('ui-avatars.com') && !img.includes('favicon') && !img.includes('s2/favicons') && !img.includes('t0.gstatic.com');
    };

    const selected = Array.from(byGroup.entries()).map(([group, items]) => {
        if (!items || items.length === 0) return null;
        const editorialCandidates = items.slice(1, 8);
        const bestSecondary = editorialCandidates.find(item =>
            !topFeedIds.has(item.id) &&
            !clusterLeadIds.has(item.id) &&
            !clusterArticleIds.has(item.id) &&
            hasGoodVisual(item)
        );
        const secondaryNonTop = editorialCandidates.find(item => !topFeedIds.has(item.id) && !clusterLeadIds.has(item.id));
        const secondaryVisual = editorialCandidates.find(item => hasGoodVisual(item));
        const secondaryAny = items[1] || items[2] || null;
        const nonCluster = items.find(item => !clusterArticleIds.has(item.id) && !clusterLeadIds.has(item.id));
        const chosen = bestSecondary || secondaryNonTop || secondaryVisual || secondaryAny || nonCluster || items[0];
        return chosen ? { ...chosen, storyGroup: group } : null;
    }).filter(Boolean);

    const deduped = [];
    const usedArticleIds = new Set();
    const usedGroups = new Set();
    selected
      .sort((a, b) => {
        const pa = PRIORITY_SOURCE_KEYS.indexOf(a.storyGroup);
        const pb = PRIORITY_SOURCE_KEYS.indexOf(b.storyGroup);
        if (pa >= 0 || pb >= 0) return (pa >= 0 ? pa : 999) - (pb >= 0 ? pb : 999);
        return (b?.rawDate ? new Date(b.rawDate).getTime() : 0) - (a?.rawDate ? new Date(a.rawDate).getTime() : 0);
      })
      .forEach(item => {
        const group = item.storyGroup || item.sourceGroup || getEditorialGroupKey(item?.source, item?.link);
        if (!item?.id || usedArticleIds.has(item.id) || usedGroups.has(group)) return;
        usedArticleIds.add(item.id);
        usedGroups.add(group);
        deduped.push(item);
      });

    const storyItems = deduped.map((item) => {
        const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent((item.title || item.source || 'News').slice(0, 40))}&background=random&color=fff&size=800&font-size=0.33&length=3`;
        const finalImg = (item.img && item.img.length > 10) ? item.img : fallbackImage;
        return {
          id: `story-${item.id}`,
          sourceArticleId: item.id,
          name: cleanSourceDisplayName(item.source, item.link),
          sourceGroup: item.sourceGroup || getEditorialGroupKey(item.source, item.link),
          avatar: item.logo || resolveLogoUrl({ source: item.source, feedUrl: item.link, feedLogo: null, siteUrl: item.link }),
          isBreaking: false,
          isAnchor: false,
          items: [{ ...item, img: finalImg, origin: 'story' }]
        };
    });

    if (storyItems.length < 10 && Array.isArray(sourceCatalog) && sourceCatalog.length) {
      const usedGroupsInStories = new Set(storyItems.map(story => story.sourceGroup).filter(Boolean));
      sourceCatalog
        .filter(source => source?.groupKey && !usedGroupsInStories.has(source.groupKey))
        .slice(0, 10 - storyItems.length)
        .forEach(source => {
          usedGroupsInStories.add(source.groupKey);
          storyItems.push({
            id: `story-placeholder-${source.id}`,
            sourceArticleId: null,
            name: source.name,
            sourceGroup: source.groupKey,
            avatar: source.logo,
            isBreaking: false,
            isAnchor: false,
            isPlaceholder: true,
            items: [{
              id: `placeholder-${source.id}`,
              title: `Coletando ${source.name}`,
              summary: 'Fonte cadastrada. As notícias entram automaticamente quando a coleta terminar.',
              source: source.name,
              sourceId: source.id,
              sourceGroup: source.groupKey,
              logo: source.logo,
              img: source.logo,
              link: source.url,
              rawDate: new Date(),
              origin: 'story-placeholder'
            }]
          });
        });
    }

    return storyItems.slice(0, 18);
};



// --- COMPONENTE PRINCIPAL (V14 - COM PERSISTÊNCIA E FETCH FEEDS INTEGRADO) ---
export default function NewsOS_V12() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('happening'); 
  const [globalClusters, setGlobalClusters] = useState(null); 
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articlePanelInitialViewMode, setArticlePanelInitialViewMode] = useState('analysis');
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
    // Pool 1: Widgets (Leve) - Agora com 6 chaves
    { id: 1, value: '', type: 'free_widget' },
    { id: 2, value: '', type: 'free_widget' },
    { id: 3, value: '', type: 'free_widget' },
    { id: 4, value: '', type: 'free_widget' },
    { id: 14, value: '', type: 'free_widget' }, // <<-- NOVA CHAVE
    { id: 16, value: '', type: 'free_widget' }, // <<-- NOVA CHAVE
    
    // Legado / Backup
    { id: 5, value: '', type: 'legacy_text' },
    { id: 6, value: '', type: 'legacy_audio' },

    // Pool 2: Usina de IA (Pesado) - Agora com 7 chaves
    { id: 7, value: '', type: 'heavy_rotation' },
    { id: 8, value: '', type: 'heavy_rotation' },
    { id: 9, value: '', type: 'heavy_rotation' },
    { id: 10, value: '', type: 'heavy_rotation' },
    { id: 11, value: '', type: 'heavy_rotation' },
    { id: 15, value: '', type: 'heavy_rotation' },
    { id: 17, value: '', type: 'heavy_rotation' }, // <<-- NOVA CHAVE

    // Pool 3: Chat - Agora com 3 chaves
    { id: 12, value: '', type: 'chat_key' },
    { id: 13, value: '', type: 'chat_key' },
    { id: 18, value: '', type: 'chat_key' }, // <<-- NOVA CHAVE
]);


// =======================================================================
// === HOOK CORRIGIDO V3: SEM preventDefault EM TOQUES (SCROLL LIVRE) ===
// =======================================================================
const useLongPress = (onLongPress, onClick, { threshold = 500 } = {}) => {
  const timerRef = useRef(null);
  const isLongPress = useRef(false);
  const isScrolling = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const start = useCallback((event) => {
    // NÃO CHAMAMOS preventDefault() AQUI. O navegador gerencia o scroll.
    
    // Reseta estados
    isLongPress.current = false;
    isScrolling.current = false;
    
    // Pega coordenadas (compatível com mouse e touch)
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    startPos.current = { x: clientX, y: clientY };

    timerRef.current = setTimeout(() => {
      // Se não moveu o dedo (não é scroll), ativa o Long Press
      if (!isScrolling.current) {
        isLongPress.current = true;
        if (onLongPress) onLongPress();
      }
    }, threshold);
  }, [onLongPress, threshold]);

  const move = useCallback((event) => {
    // Se já detectou scroll, ignora
    if (isScrolling.current) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    // Calcula distância (Teorema de Pitágoras é mais preciso que box diff)
    const diffX = Math.abs(clientX - startPos.current.x);
    const diffY = Math.abs(clientY - startPos.current.y);

    // Se moveu mais que 10px, consideramos que o usuário quer rolar a tela (SCROLL)
    if (diffX > 10 || diffY > 10) {
      isScrolling.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const end = useCallback((event) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Se não foi long press E não estava rolando a tela...
    if (!isLongPress.current && !isScrolling.current) {
      // ...então foi um clique rápido. Executa a ação de abrir.
      if (onClick) onClick();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseMove: move,
    onTouchMove: move,
    onMouseUp: end,
    onTouchEnd: end,
    // Bloqueia apenas o menu de contexto (clique direito) no desktop
    onContextMenu: (e) => e.preventDefault() 
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
  const [articleHistory, setArticleHistory] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('vetra_article_birth_lock_v1') || '{}') || {};
    } catch {
      return {};
    }
  });
  const [readHistory, setReadHistory] = useState([]);
  const [likedItems, setLikedItems] = useState([]); 
    const feedMemoryBuffer = useRef({});

  // Persistência local do selo de nascimento: evita que pubDate reescrito por RSS ressuscite notícia velha.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const entries = Object.entries(articleHistory || {}).slice(-1500);
      localStorage.setItem('vetra_article_birth_lock_v1', JSON.stringify(Object.fromEntries(entries)));
    } catch (e) {
      console.warn('Não foi possível salvar o lock histórico de notícias:', e);
    }
  }, [articleHistory]);

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


const [stableHeuristicClusters, setStableHeuristicClusters] = useState([]);
const [storiesForHappeningTab, setStoriesForHappeningTab] = useState([]);
const storyRailRef = useRef([]);
const feedRequestIdRef = useRef(0);
const visibleSnapshotRef = useRef({ news: [], videos: [], podcasts: [], clusters: [], stories: [], timestamp: 0, version: 0 });
const stagingSnapshotRef = useRef(null);
const warmingSnapshotRef = useRef({ news: [], videos: [], podcasts: [], clusters: [], stories: [], timestamp: 0, version: 0 });
const lastCommittedSnapshotHashRef = useRef('');
const feedFailureBackoffRef = useRef({});
const feedAutoFetchKeyRef = useRef('');
const lastTabRefreshAtRef = useRef(0);
const didMountTabRefreshRef = useRef(false);
const sourceCacheRef = useRef({});
const [sourceCatalog, setSourceCatalog] = useState([]);
const [sourceCacheView, setSourceCacheView] = useState({});
const [sourceStatusMap, setSourceStatusMap] = useState({});
const [stagedUpdateInfo, setStagedUpdateInfo] = useState(null);
const [feedUpdateToast, setFeedUpdateToast] = useState(null);
const heuristicClusters = stableHeuristicClusters;

const showFeedToast = useCallback((message) => {
    setFeedUpdateToast({ id: Date.now(), message });
    window.setTimeout(() => {
        setFeedUpdateToast(current => current?.message === message ? null : current);
    }, 2800);
}, []);

const buildStableSnapshot = useCallback((newsItems = [], videoItems = [], podcastItems = []) => {
    const sortedNews = smartFeedSort(newsItems);
    const sortedVideos = sortByDateSafe(videoItems);
    const sortedPodcasts = sortByDateSafe(podcastItems);
    // Cluster Engine heurístico novo (score composto, sem IA).
    // Se falhar ou render pouco, cai no motor antigo — nada é removido.
    let clusters = [];
    try {
        clusters = generateSmartHeuristicClusters(sortedNews) || [];
    } catch (e) {
        console.error('SmartClusters falhou, usando heurística antiga:', e);
        clusters = [];
    }
    if (!clusters || clusters.length < 2) {
        clusters = generateHeuristicClusters(sortedNews) || [];
    }
    if (!clusters || clusters.length < 3) {
        const fallbackClusters = createFallbackEditorialClusters(sortedNews);
        const existingKeys = new Set((clusters || []).map(cluster => normalizeSourceKey(cluster?.ai_title || '')));
        fallbackClusters.forEach(cluster => {
            const key = normalizeSourceKey(cluster?.ai_title || '');
            if (!existingKeys.has(key)) clusters.push(cluster);
        });
        clusters = clusters.slice(0, 5);
    }
    const stories = generateSmartStories(sortedNews, clusters, sourceCatalog);
    return normalizeSnapshotForStorage({
        news: sortedNews,
        videos: sortedVideos,
        podcasts: sortedPodcasts,
        clusters,
        stories,
        timestamp: Date.now(),
        version: Date.now(),
    });
}, [sourceCatalog]);

const commitVisibleSnapshot = useCallback((snapshot, options = {}) => {
    let normalized = normalizeSnapshotForStorage(snapshot);
    if (normalized.news?.length && ((!normalized.clusters || normalized.clusters.length === 0) || (!normalized.stories || normalized.stories.length === 0))) {
        normalized = buildStableSnapshot(normalized.news, normalized.videos, normalized.podcasts);
    }
    if (!hasMeaningfulSnapshot(normalized) && !options.allowEmpty) return false;

    const hash = buildSnapshotHash(normalized);
    if (!options.forceCommit && hash && hash === lastCommittedSnapshotHashRef.current) {
        if (options.toastMessage) showFeedToast(options.toastMessage);
        return false;
    }

    lastCommittedSnapshotHashRef.current = hash;
    visibleSnapshotRef.current = normalized;
    storyRailRef.current = normalized.stories || [];
    warmingSnapshotRef.current = normalized;

    setRealNews(normalized.news || []);
    setRealVideos(normalized.videos || []);
    setRealPodcasts(normalized.podcasts || []);
    setStableHeuristicClusters(normalized.clusters || []);
    setStoriesForHappeningTab(normalized.stories || []);

    if (options.updateGlobalClusters) {
        setGlobalClusters(normalized.clusters || []);
    } else {
        setGlobalClusters(prev => prev && prev.length ? prev : (normalized.clusters || []));
    }

    persistVisibleSnapshot(normalized);
    if (options.toastMessage) showFeedToast(options.toastMessage);
    return true;
}, [buildStableSnapshot, showFeedToast]);

useEffect(() => {
    const cachedSnapshot = readVisibleSnapshotFromStorage();
    if (cachedSnapshot && hasMeaningfulSnapshot(cachedSnapshot)) {
        commitVisibleSnapshot(cachedSnapshot, { reason: 'local-cache', updateGlobalClusters: true, forceCommit: true });
    }
}, [commitVisibleSnapshot]);


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

// Chave de proteção contra re-escrita automática do banco de dados
  const isInitialLoadRef = useRef(true);

  // 2. Função para Carregar Dados do Banco
  const loadUserData = async (userId) => {
      setIsSyncing(true);
      const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

      if (data) {
          // Só carrega do banco de dados se for a PRIMEIRA montagem do app
          if (isInitialLoadRef.current) {
              if (data.feeds) setUserFeeds(data.feeds);
              if (data.saved_items) setSavedItems(data.saved_items);
              if (data.read_history) setReadHistory(data.read_history);
              if (data.liked_items) setLikedItems(data.liked_items);
              
              if (data.api_key) {
                  try {
                      const parsedFromDB = JSON.parse(data.api_key);
                      if (Array.isArray(parsedFromDB)) {
                           const defaultKeysStructure = [
                                { id: 1, value: '', type: 'free_widget' },
                                { id: 2, value: '', type: 'free_widget' },
                                { id: 3, value: '', type: 'free_widget' },
                                { id: 4, value: '', type: 'free_widget' },
                                { id: 14, value: '', type: 'free_widget' },
                                { id: 16, value: '', type: 'free_widget' },
                                { id: 5, value: '', type: 'legacy_text' },
                                { id: 6, value: '', type: 'legacy_audio' },
                                { id: 7, value: '', type: 'heavy_rotation' },
                                { id: 8, value: '', type: 'heavy_rotation' },
                                { id: 9, value: '', type: 'heavy_rotation' },
                                { id: 10, value: '', type: 'heavy_rotation' },
                                { id: 11, value: '', type: 'heavy_rotation' },
                                { id: 15, value: '', type: 'heavy_rotation' },
                                { id: 17, value: '', type: 'heavy_rotation' },
                                { id: 12, value: '', type: 'chat_key' },
                                { id: 13, value: '', type: 'chat_key' },
                                { id: 18, value: '', type: 'chat_key' },
                           ];
                           const mergedKeys = defaultKeysStructure.map(defaultKey => {
                               const keyFromDB = parsedFromDB.find(dbKey => dbKey.id === defaultKey.id);
                               return {
                                   id: defaultKey.id,
                                   type: defaultKey.type,
                                   value: keyFromDB?.value || ''
                               };
                           });
                           setApiKeys(mergedKeys);
                      }
                  } catch (e) {
                      console.error("Erro ao fazer parse das chaves do banco:", e);
                  }
              }
              if (data.is_dark_mode !== null) setIsDarkMode(data.is_dark_mode);
              if (data.seen_story_ids) setSeenStoryIds(data.seen_story_ids);
              if (data.article_history) setArticleHistory(prev => ({ ...data.article_history, ...prev }));
              
              isInitialLoadRef.current = false; // Desativa novas cargas para não dar o efeito de rebote
          }
      } else if (!error) {
          await supabase.from('user_preferences').insert([{ user_id: userId }]);
      }
      setIsSyncing(false);
  };

// 3. Função para Salvar (Debounced effect)
  useEffect(() => {
      if (!user || isSyncing || isInitialLoadRef.current) return;

      const saveData = async () => {
          const updates = {
              user_id: user.id,
              feeds: userFeeds,
              saved_items: savedItems,
              // Mantém o histórico no banco de dados controlado
              read_history: readHistory.slice(-300), 
              liked_items: likedItems,
              api_key: JSON.stringify(apiKeys),
              is_dark_mode: isDarkMode,
              // Mantém as histórias vistas de forma enxuta
              seen_story_ids: seenStoryIds.slice(-200), 
              
              // REMOVIDO: O article_history não é mais persistido no banco
              // para evitar o inchaço de dados e travamento do Postgres.
              
              updated_at: new Date()
          };

          const { error } = await supabase
              .from('user_preferences')
              .upsert(updates);
          
          if (error) console.error("Erro ao salvar:", error);
      };

      // Aumentado para 15 segundos para dar folga operacional ao disco do banco
      const timer = setTimeout(() => {
          saveData();
      }, 15000); 

      return () => clearTimeout(timer);
  }, [user, userFeeds, savedItems, readHistory, likedItems, apiKeys, isDarkMode, seenStoryIds]); 
  // articleHistory e as variáveis dependentes foram retiradas das dependências 
  // para evitar disparos desnecessários.


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

// --- FUNÇÃO AUXILIAR: ORDENAÇÃO INTELIGENTE E BLINDADA ---
  const smartFeedSort = (items) => {
    if (!items || items.length === 0) return [];
    
    // 1. BLINDAGEM CONTRA O ERRO FATAL: Garante que a data é válida antes do getTime()
    let sorted = [...items].sort((a, b) => {
        const timeA = (a?.rawDate && !isNaN(new Date(a.rawDate).getTime())) ? new Date(a.rawDate).getTime() : 0;
        const timeB = (b?.rawDate && !isNaN(new Date(b.rawDate).getTime())) ? new Date(b.rawDate).getTime() : 0;
        return timeB - timeA;
    });
    
    // 2. Remoção de duplicatas
    const unique = [];
    const seenTitles = new Set();
    
    for (const item of sorted) {
        const safeTitle = String(item?.title ?? item?.summary ?? item?.link ?? '').trim();
        if (!safeTitle) continue;
        item.title = safeTitle;
        item.source = String(item?.source ?? 'Fonte').trim();
        const titleSnippet = safeTitle.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).slice(0, 4).join(' ');
        const dedupeKey = `${item.source.toLowerCase()}::${titleSnippet}`;
        if (!seenTitles.has(dedupeKey)) {
            seenTitles.add(dedupeKey);
            unique.push(item);
        }
    }

    // 3. Algoritmo Anti-Cluster (Não repetir fonte seguida)
    const spaced = [];
    let lastSource = null;
    let lastLastSource = null;

    while (unique.length > 0) {
        let foundIndex = unique.findIndex(item => item.source !== lastSource && item.source !== lastLastSource);
        if (foundIndex === -1) foundIndex = unique.findIndex(item => item.source !== lastSource);
        if (foundIndex === -1) foundIndex = 0;

        const itemToInject = unique.splice(foundIndex, 1)[0];
        spaced.push(itemToInject);
        
        lastLastSource = lastSource;
        lastSource = itemToInject.source;
    }
    return spaced;
  };


  const userFeedsStableKey = useMemo(() => {
      return (userFeeds || [])
        .map(feed => `${feed?.id || ''}|${feed?.name || ''}|${feed?.url || ''}|${feed?.type || ''}|${feed?.category || ''}|${feed?.display?.feed !== false ? '1' : '0'}`)
        .join(';;');
  }, [userFeeds]);

  useEffect(() => {
      const catalog = buildSourceCatalogFromFeeds(userFeeds || []);
      setSourceCatalog(catalog);
      setSourceStatusMap(prev => {
          const next = { ...prev };
          catalog.forEach(source => {
              if (!next[source.id]) next[source.id] = { status: 'idle', count: sourceCacheRef.current[source.id]?.length || 0, message: '' };
          });
          return next;
      });
  }, [userFeedsStableKey]);

  const applyStagedSnapshot = useCallback(() => {
      const staged = stagingSnapshotRef.current;
      if (!staged || !hasMeaningfulSnapshot(staged)) return false;
      const didCommit = commitVisibleSnapshot(staged, {
          reason: 'manual-banner',
          updateGlobalClusters: true,
          toastMessage: 'Feed atualizado',
          forceCommit: true,
      });
      if (didCommit) {
          stagingSnapshotRef.current = null;
          setStagedUpdateInfo(null);
      }
      return didCommit;
  }, [commitVisibleSnapshot]);

  const updateSourceCache = useCallback((sourceId, items, meta = {}) => {
      if (!sourceId) return;
      const sorted = smartFeedSort(items || []);
      sourceCacheRef.current[sourceId] = sorted;
      setSourceCacheView({ ...sourceCacheRef.current });
      setSourceStatusMap(prev => ({
          ...prev,
          [sourceId]: {
              status: meta.status || 'ok',
              count: sorted.length,
              message: meta.message || '',
              updatedAt: Date.now(),
          }
      }));
  }, []);

  const ensureSourceLoaded = useCallback(async (sourceId) => {
      const feed = (userFeeds || []).find(item => getFeedSourceId(item) === sourceId);
      if (!feed?.url) return;
      const currentStatus = sourceStatusMap?.[sourceId]?.status;
      const cachedCount = sourceCacheRef.current[sourceId]?.length || 0;
      if (currentStatus === 'loading') return;
      if (cachedCount >= 24 && Date.now() - (sourceStatusMap?.[sourceId]?.updatedAt || 0) < FEED_MEMORY_TTL) return;

      setSourceStatusMap(prev => ({ ...prev, [sourceId]: { ...(prev[sourceId] || {}), status: 'loading', message: 'Carregando fonte...' } }));
      const historyBuffer = { ...articleHistory };
      const applyItems = (data, sourceMeta = {}) => {
          const processed = normalizeFeedItemsForClient(feed, data.items || [], {
              detectedXmlTitle: sourceMeta.title || data.title || feed.name,
              feedLogo: sourceMeta.image || data.image || data.logo || feed.logo,
              siteLink: sourceMeta.link || data.link || data.feedUrl || feed.url,
              isFeedYoutube: sourceMeta.isYoutube ?? data.isYoutube,
          }, historyBuffer);
          updateSourceCache(sourceId, processed, { status: processed.length ? 'ok' : 'empty' });
          setArticleHistory(historyBuffer);
          return processed;
      };

      try {
          const invokeResult = await withPromiseTimeout(
              supabase.functions.invoke('parse-feed', { body: { url: feed.url, brief: false, limit: 60, enrichImages: true, allowProxy: true, sourceName: feed.name } }),
              13000,
              `parse-feed dedicado ${feed.name || feed.url}`
          );
          const data = invokeResult?.data;
          if (invokeResult?.error || !data?.items?.length) throw new Error(invokeResult?.error?.message || data?.error || 'Fonte sem itens recentes');
          const processed = applyItems(data);
          if (!processed.length) throw new Error('Fonte sem itens recentes');
      } catch (error) {
          setSourceStatusMap(prev => ({
              ...prev,
              [sourceId]: { ...(prev[sourceId] || {}), status: 'error', count: sourceCacheRef.current[sourceId]?.length || 0, message: error?.message || 'Falha temporária' }
          }));
      }
  }, [userFeeds, sourceStatusMap, articleHistory, updateSourceCache]);

  // --- FETCH FEEDS VETRA ENGINE: snapshot visível congelado + source cache + staging profissional ---
  const fetchFeeds = async (forceRefresh = false) => {
      const requestId = ++feedRequestIdRef.current;
      const isLatestRequest = () => requestId === feedRequestIdRef.current;
      const activeFeeds = (userFeeds || []).filter(f => String(f?.url ?? '').trim());
      const activeCatalog = buildSourceCatalogFromFeeds(activeFeeds);
      setSourceCatalog(activeCatalog);

      if (activeFeeds.length === 0) {
          const emptySnapshot = { news: [], videos: [], podcasts: [], clusters: [], stories: [], timestamp: Date.now(), version: Date.now() };
          visibleSnapshotRef.current = emptySnapshot;
          stagingSnapshotRef.current = null;
          warmingSnapshotRef.current = emptySnapshot;
          lastCommittedSnapshotHashRef.current = '';
          sourceCacheRef.current = {};
          setSourceCacheView({});
          setSourceStatusMap({});
          setStagedUpdateInfo(null);
          setRealNews([]);
          setRealVideos([]);
          setRealPodcasts([]);
          setStableHeuristicClusters([]);
          setStoriesForHappeningTab([]);
          storyRailRef.current = [];
          setIsLoadingFeeds(false);
          return;
      }

      const hasVisibleContent = hasMeaningfulSnapshot(visibleSnapshotRef.current);
      if (!hasVisibleContent) setIsLoadingFeeds(true);
      if (forceRefresh && !stagingSnapshotRef.current) setIsLoadingFeeds(true);

      const textFeeds = sortFeedsEditorially(activeFeeds.filter(f => f.type !== 'youtube' && f.type !== 'podcast' && !String(f?.url ?? '').includes('youtube.com')));
      const mediaFeeds = sortFeedsEditorially(activeFeeds.filter(f => f.type === 'youtube' || f.type === 'podcast' || String(f?.url ?? '').includes('youtube.com')));
      const priorityTextFeeds = textFeeds.filter(feed => getFeedPriorityScore(feed) < 30).slice(0, 18);
      const priorityIds = new Set(priorityTextFeeds.map(getFeedSourceId));
      const secondaryTextFeeds = textFeeds.filter(feed => !priorityIds.has(getFeedSourceId(feed)));

      const newHistoryBuffer = { ...articleHistory };
      let initialSnapshotCommitted = false;
      let stagedSnapshotWasCommitted = false;

      const setBatchStatus = (feeds, status, message = '') => {
          setSourceStatusMap(prev => {
              const next = { ...prev };
              feeds.forEach(feed => {
                  const sourceId = getFeedSourceId(feed);
                  if (!sourceId) return;
                  next[sourceId] = {
                      ...(next[sourceId] || {}),
                      status,
                      count: sourceCacheRef.current[sourceId]?.length || 0,
                      message,
                      updatedAt: Date.now(),
                  };
              });
              return next;
          });
      };

      const maybeCommitStagedSnapshot = () => {
          const staged = stagingSnapshotRef.current;
          if (!forceRefresh || !staged || !hasMeaningfulSnapshot(staged)) return false;
          const didCommit = commitVisibleSnapshot(staged, {
              reason: 'manual-staged',
              updateGlobalClusters: true,
              toastMessage: 'Feed atualizado',
              forceCommit: true,
          });
          if (didCommit) {
              stagedSnapshotWasCommitted = true;
              stagingSnapshotRef.current = null;
              setStagedUpdateInfo(null);
              setIsLoadingFeeds(false);
          }
          return didCommit;
      };

      maybeCommitStagedSnapshot();

      const applyWorkerSources = (feeds, sources = []) => {
          const feedById = new Map(feeds.map(feed => [getFeedSourceId(feed), feed]));
          sources.forEach(sourceResult => {
              const feed = feedById.get(sourceResult.feedId) || feeds.find(item => item.url === sourceResult.inputUrl || item.url === sourceResult.feedUrl) || null;
              if (!feed) return;
              const sourceId = getFeedSourceId(feed);
              const rawItems = Array.isArray(sourceResult.items) ? sourceResult.items : [];

              if (!sourceResult.ok && rawItems.length === 0) {
                  setSourceStatusMap(prev => ({
                      ...prev,
                      [sourceId]: {
                          ...(prev[sourceId] || {}),
                          status: 'error',
                          count: sourceCacheRef.current[sourceId]?.length || 0,
                          message: sourceResult.error || 'Falha temporária',
                          updatedAt: Date.now(),
                      }
                  }));
                  return;
              }

              const processed = normalizeFeedItemsForClient(feed, rawItems, {
                  detectedXmlTitle: sourceResult.title || feed.name,
                  feedLogo: sourceResult.image || feed.logo,
                  siteLink: sourceResult.link || sourceResult.feedUrl || feed.url,
                  isFeedYoutube: sourceResult.isYoutube,
              }, newHistoryBuffer);

              const finalLogo = resolveLogoUrl({ source: cleanSourceDisplayName(feed?.name || sourceResult.title, feed.url), feedUrl: feed.url, feedLogo: sourceResult.image || feed.logo, siteUrl: sourceResult.link || sourceResult.feedUrl || feed.url });
              feedMemoryBuffer.current[sourceId] = { timestamp: Date.now(), items: processed, title: cleanSourceDisplayName(feed?.name || sourceResult.title, feed.url), logo: finalLogo, isYoutube: !!sourceResult.isYoutube };
              updateSourceCache(sourceId, processed, { status: processed.length ? 'ok' : 'empty', message: processed.length ? '' : 'Sem itens recentes' });
              delete feedFailureBackoffRef.current[sourceId];
          });
      };

      const collectWithWorker = async (feeds, options = {}) => {
          const cleanFeeds = (feeds || []).filter(feed => feed?.url);
          if (!cleanFeeds.length) return { sources: [], articles: [] };
          setBatchStatus(cleanFeeds, 'loading', 'Coletando...');
          const invokeResult = await withPromiseTimeout(
              supabase.functions.invoke('collect-feeds', {
                  body: {
                      feeds: cleanFeeds.map(feed => ({ ...feed, id: getFeedSourceId(feed) })),
                      limit: options.limit || 42,
                      concurrency: options.concurrency || FEED_TEXT_CONCURRENCY,
                      enrichImages: options.enrichImages !== false,
                      mode: options.mode || 'background',
                  }
              }),
              options.timeout || 24000,
              `collect-feeds ${options.mode || 'background'}`
          );
          if (invokeResult?.error) throw new Error(invokeResult.error.message || 'Falha no worker collect-feeds');
          const data = invokeResult?.data || {};
          if (!Array.isArray(data.sources)) throw new Error(data.error || 'Resposta inválida do worker collect-feeds');
          applyWorkerSources(cleanFeeds, data.sources);
          return data;
      };

      const collectWithParseFallback = async (feeds, options = {}) => {
          await runConcurrentPool(feeds, options.concurrency || FEED_TEXT_CONCURRENCY, async (feed) => {
              const sourceId = getFeedSourceId(feed);
              try {
                  setBatchStatus([feed], 'loading', 'Coletando...');
                  const invokeResult = await withPromiseTimeout(
                      supabase.functions.invoke('parse-feed', {
                          body: {
                              url: feed.url,
                              sourceName: feed.name,
                              brief: false,
                              limit: options.limit || 38,
                              enrichImages: options.enrichImages !== false,
                              allowProxy: forceRefresh || options.allowProxy === true,
                          }
                      }),
                      options.timeout || 14000,
                      `parse-feed ${feed.name || feed.url}`
                  );
                  const data = invokeResult?.data;
                  if (invokeResult?.error || !data?.items?.length) throw new Error(invokeResult?.error?.message || data?.error || 'Fonte sem itens recentes');
                  applyWorkerSources([feed], [{ feedId: sourceId, ok: true, title: data.title || feed.name, link: data.link || data.feedUrl || feed.url, feedUrl: data.feedUrl || feed.url, image: data.image || data.logo || feed.logo, isYoutube: data.isYoutube, items: data.items }]);
              } catch (error) {
                  feedFailureBackoffRef.current[sourceId] = { timestamp: Date.now(), lastLog: Date.now() };
                  setSourceStatusMap(prev => ({
                      ...prev,
                      [sourceId]: { ...(prev[sourceId] || {}), status: 'error', count: sourceCacheRef.current[sourceId]?.length || 0, message: error?.message || 'Falha temporária', updatedAt: Date.now() }
                  }));
              }
          });
      };

      const collectTextBatch = async (feeds, options = {}) => {
          if (!feeds.length) return;
          // Estabilização operacional: o worker agregador em lote é útil no backend,
          // mas no app ele não pode bloquear pull-to-refresh nem staging por 28s.
          // Por isso a UI usa parse-feed por fonte, em paralelo, com timeout individual.
          await collectWithParseFallback(feeds, { ...options, timeout: Math.min(options.timeout || 14000, 12000) });
      };

      const buildSnapshotFromSourceCache = () => {
          const textIds = new Set(textFeeds.map(getFeedSourceId));
          const mediaIds = new Set(mediaFeeds.map(getFeedSourceId));
          const news = [];
          const videos = [];
          const podcasts = [];
          Object.entries(sourceCacheRef.current || {}).forEach(([sourceId, items]) => {
              const feed = activeFeeds.find(item => getFeedSourceId(item) === sourceId);
              if (!feed) return;
              if (feed.type === 'podcast') podcasts.push(...(items || []));
              else if (feed.type === 'youtube' || String(feed?.url ?? '').includes('youtube.com') || mediaIds.has(sourceId)) videos.push(...(items || []));
              else if (textIds.has(sourceId)) news.push(...(items || []));
          });
          return buildStableSnapshot(news, videos, podcasts);
      };

      try {
          const priorityPromise = collectTextBatch(priorityTextFeeds, { limit: 44, concurrency: 7, enrichImages: true, timeout: 15000, mode: 'priority' });

          if (!hasVisibleContent && !forceRefresh) {
              await Promise.race([priorityPromise, sleep(FEED_STARTUP_WINDOW_MS)]);
              if (!isLatestRequest()) return;
              let initialSnapshot = buildSnapshotFromSourceCache();
              if (!isInitialSnapshotGoodEnough(initialSnapshot, false)) {
                  await Promise.race([priorityPromise, sleep(Math.max(1200, FEED_STARTUP_HARD_LIMIT_MS - FEED_STARTUP_WINDOW_MS))]);
                  if (!isLatestRequest()) return;
                  initialSnapshot = buildSnapshotFromSourceCache();
              }
              if (hasMeaningfulSnapshot(initialSnapshot)) {
                  commitVisibleSnapshot(initialSnapshot, { reason: 'initial-priority', updateGlobalClusters: true, forceCommit: true });
                  initialSnapshotCommitted = true;
                  setIsLoadingFeeds(false);
              }
          }

          await priorityPromise.catch(() => null);
          if (!isLatestRequest()) return;

          // PATCH A: commit incremental no pull-to-refresh.
      // Sem isto, o refresh manual só trocava feed/clusters/stories
      // depois de TODO o ciclo secundário/mídia liquidar (até ~28s).
      if (forceRefresh) {
          const earlySnapshot = buildSnapshotFromSourceCache();
          if (hasMeaningfulSnapshot(earlySnapshot)) {
              commitVisibleSnapshot(earlySnapshot, {
                  reason: 'manual-priority',
                  updateGlobalClusters: true,
                  forceCommit: true,
              });
              setIsLoadingFeeds(false);
          }
      }


          const secondaryPromise = collectTextBatch(secondaryTextFeeds, { limit: 40, concurrency: 6, enrichImages: true, timeout: 28000, mode: 'complete' });
          const mediaPromise = collectTextBatch(mediaFeeds, { limit: 34, concurrency: FEED_MEDIA_CONCURRENCY, enrichImages: false, timeout: 18000, mode: 'media' });
          await Promise.allSettled([secondaryPromise, mediaPromise]);
          if (!isLatestRequest()) return;

          const finalSnapshot = buildSnapshotFromSourceCache();
          setArticleHistory(newHistoryBuffer);

          if (forceRefresh) {
              const didCommitFresh = commitVisibleSnapshot(finalSnapshot, {
                  reason: 'manual-fresh',
                  updateGlobalClusters: true,
                  toastMessage: stagedSnapshotWasCommitted ? 'Feed refinado' : 'Feed atualizado',
                  forceCommit: true,
              });
              if (!didCommitFresh && !stagedSnapshotWasCommitted) showFeedToast('Sem novas notícias agora');
              stagingSnapshotRef.current = null;
              warmingSnapshotRef.current = finalSnapshot;
              setStagedUpdateInfo(null);
          } else if (!hasMeaningfulSnapshot(visibleSnapshotRef.current)) {
              commitVisibleSnapshot(finalSnapshot, { reason: 'late-initial', updateGlobalClusters: true, forceCommit: true });
          } else {
              stagingSnapshotRef.current = finalSnapshot;
              warmingSnapshotRef.current = finalSnapshot;
              const visibleHash = buildSnapshotHash(visibleSnapshotRef.current);
              const stagingHash = buildSnapshotHash(finalSnapshot);
              const visibleIds = new Set((visibleSnapshotRef.current.news || []).map(item => item.id || item.link));
              const newItems = (finalSnapshot.news || []).filter(item => !visibleIds.has(item.id || item.link));
              const sourceCount = countDistinctEditorialGroups(newItems.length ? newItems : finalSnapshot.news);
              if (stagingHash && stagingHash !== visibleHash && (newItems.length >= 2 || finalSnapshot.news.length > visibleSnapshotRef.current.news.length)) {
                  setStagedUpdateInfo({ count: Math.max(newItems.length, Math.max(0, finalSnapshot.news.length - visibleSnapshotRef.current.news.length)), sourceCount, timestamp: Date.now() });
              }
          }
      } catch (error) {
          console.error('Erro geral ao buscar feeds:', error);
      } finally {
          if (isLatestRequest()) setIsLoadingFeeds(false);
      }
  };


  // --- OTIMIZAÇÃO DE MEMÓRIA: ARRAY ÚNICO MEMORIZADO ---
  // Evita criar arrays gigantes no meio da renderização, prevenindo crashes no iOS
  const allFeedItems = useMemo(() => {
      // Combina e ordena por data (garantia extra)
      const combined = [...realNews, ...realVideos, ...realPodcasts];
      return combined.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [realNews, realVideos, realPodcasts]);




  useEffect(() => {
      if (!userFeedsStableKey) return;
      if (feedAutoFetchKeyRef.current === userFeedsStableKey) return;
      feedAutoFetchKeyRef.current = userFeedsStableKey;
      fetchFeeds(false);
      // fetchFeeds é intencionalmente não listado: a chave estável de feeds governa a coleta.
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFeedsStableKey]);

  useEffect(() => {
      if (!userFeedsStableKey) return;
      if (!didMountTabRefreshRef.current) {
          didMountTabRefreshRef.current = true;
          return;
      }

      const staged = stagingSnapshotRef.current;
      if (staged && hasMeaningfulSnapshot(staged)) {
          const didCommit = commitVisibleSnapshot(staged, {
              reason: 'tab-change',
              updateGlobalClusters: true,
              toastMessage: 'Feed atualizado',
          });
          if (didCommit) { stagingSnapshotRef.current = null; setStagedUpdateInfo(null); }
          return;
      }

      const now = Date.now();
      if (now - lastTabRefreshAtRef.current > 120000) {
          lastTabRefreshAtRef.current = now;
          fetchFeeds(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userFeedsStableKey, commitVisibleSnapshot]);

  // FUNÇÕES GLOBAIS DE INTERFACE
  

  const handleRemoveSavedItem = (idToRemove) => {
    setSavedItems((prevItems) => prevItems.filter((item) => item.id !== idToRemove));
  };



const handleOpenArticle = async (article, options = {}) => {
    if (!article) return;

    // V4: quando o Glass Browser pede Chat/WhatsApp, NÃO roteia para Browser/InAppBrowser.
    // Abre diretamente o painel lateral no modo chat, mesmo que a URL seja YouTube/UOL/etc.
    if (options?.initialViewMode === 'chat' || options?.openWhatsAppPanel || options?.forcePanel) {
        setArticlePanelInitialViewMode('chat');
        setSelectedArticle(article);
        setPanelWidth(680);
        if (article.id && !readHistory.includes(article.id)) {
            setReadHistory(prev => [...prev, article.id]);
        }
        return;
    }

    if (!article.link) return;
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
    setArticlePanelInitialViewMode(options?.initialViewMode || 'analysis');
    setSelectedArticle(article);
    setPanelWidth(options?.initialViewMode === 'chat' ? 680 : 600); 

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
    if (!article) return null;

    // 1. Verificações de Vídeo/MP3 (Mantidas)
    if (article.videoId || (article.link && article.link.includes('youtube'))) {
        handleReadNative(article);
        return null;
    }
    if (article.link?.endsWith('.mp3')) {
        return article.link;
    }

    try {
        // 2. Preparação do Texto (Direto, sem IA de resumo)
        // Limpa HTML e limita a 600 caracteres para economizar cota e ser rápido
        const cleanSummary = (article.summary || "").replace(/<[^>]*>?/gm, '');
        const textToSpeak = `${article.title}. ${cleanSummary}`.slice(0, 600);

        // =================================================================
        // 3. SELEÇÃO DA CHAVE: POOL 1 (WIDGETS)
        // =================================================================
        // 'widgets' mapeia para type: 'free_widget' na sua função getApiKey
        const ttsKey = getApiKey('widgets'); 
        
        if (!ttsKey) {
            console.warn("Nenhuma chave do Pool 1 (Widgets) encontrada.");
            alert("Configure as chaves do Pool 1 para ouvir o áudio.");
            return null;
        }

        console.log("Gerando áudio com chave do Pool 1...");

        // 4. Chamada à API (Usando a chave do Pool 1)
        const ttsResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${ttsKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: textToSpeak },
                voice: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-B' },
                audioConfig: { audioEncoding: 'MP3' },
            }),
        });

        if (!ttsResponse.ok) {
            const errorData = await ttsResponse.json();
            // Verifica erro de "API not enabled" ou "Key restriction"
            throw new Error(`Erro API Voz: ${errorData.error.message}`);
        }

        const ttsData = await ttsResponse.json();

        if (ttsData.audioContent) {
            const audioBlob = await (await fetch(`data:audio/mp3;base64,${ttsData.audioContent}`)).blob();
            return URL.createObjectURL(audioBlob);
        } else {
            throw new Error("Sem áudio retornado.");
        }

    } catch (err) {
        console.error("Erro geração áudio:", err);
        return null;
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


  const fetchOptimizedContent = useCallback(async (url, articleId) => {
    // ESTA FUNÇÃO PRECISA DO 'supabase' QUE ESTÁ NO ESCOPO DO NewsOS_V12
    const cacheKey = `newsos_fulltext_${articleId}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) return cached; // Retorna o texto, não o JSON parseado

    // CHAMA A SUA FUNÇÃO EDGE NO SUPABASE
    const { data, error } = await supabase.functions.invoke('fetch-text-summary', {
        body: { url: url } 
    });

    if (error) throw new Error("Erro no serviço de resumo do Supabase: " + error.message);

    // Salva e retorna APENAS O TEXTO CORTADO
    if (data && data.text) {
        sessionStorage.setItem(cacheKey, data.text);
        return data.text;
    }
    
    throw new Error("Resumo otimizado não disponível.");
}, [supabase]); // Depende apenas da instância do supabase


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
      
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} durationMs={hasMeaningfulSnapshot(visibleSnapshotRef.current) ? 1500 : 6800} hasWarmSnapshot={hasMeaningfulSnapshot(visibleSnapshotRef.current)} ready={realNews.length > 0} />}
      
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
                    // AÇÃO 1: Pull-to-Refresh
                    onRefresh={handleHappeningRefresh}
                    onOpenPodNews={handleOpenPodNews}
                    seenStoryIds={seenStoryIds} 
                    onMarkAsSeen={markStoryAsSeen}
                    heuristicClusters={heuristicClusters}
                    storiesToDisplay={storiesForHappeningTab}
                    savedClusters={globalClusters}
                    // AÇÃO 2: Botão de Análise de Clusters (se ele existir dentro do HappeningTab)
                    // Você precisaria passar essa função para o WhileYouWereAwayWidget
                    setSavedClusters={setGlobalClusters}
                    getApiKey={getApiKey}
                    stagedUpdateInfo={stagedUpdateInfo}
                    onApplyStagedUpdate={applyStagedSnapshot}
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
               onSwipeLeftArticle={handleOpenGlassBrowser}  
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
                    sourceCatalog={sourceCatalog}
                    sourceStatusMap={sourceStatusMap}
                    sourceCacheView={sourceCacheView}
                    onEnsureSourceLoaded={ensureSourceLoaded}
                    stagedUpdateInfo={stagedUpdateInfo}
                    onApplyStagedUpdate={applyStagedSnapshot}
                    likedItems={likedItems}
                    onToggleLike={handleToggleLike}
                    onRefresh={() => fetchFeeds(true)}
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
          onFetchContent={fetchOptimizedContent}
          onAnalyze={handleOpenArticle}
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
                    initialViewMode={articlePanelInitialViewMode}
                />
            )}
        </div>

      {/* --- MODAIS GLOBAIS (FORA DAS COLUNAS) --- */}
      {askQuestion && (<AskAIModal question={askQuestion} answer={askAnswer} sources={askSources} isLoading={isAskLoading} onClose={() => setAskQuestion(null)} isDarkMode={isDarkMode} />)}
      {isSettingsOpen && (<SettingsModal onClose={() => setIsSettingsOpen(false)} isDarkMode={isDarkMode} feeds={userFeeds} setFeeds={setUserFeeds} apiKeys={apiKeys} setApiKeys={setApiKeys} user={user} />)}
      {selectedOutlet && <OutletDetail outlet={selectedOutlet} onClose={closeOutlet} openArticle={handleReadNative} isDarkMode={isDarkMode} realNews={realNews} />}
      <AnimatePresence>
        {feedUpdateToast && (
          <motion.div
            key={feedUpdateToast.id}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="vetra-feed-toast fixed left-1/2 -translate-x-1/2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[12000] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
          >
            <CheckCircle size={17} /> {feedUpdateToast.message}
          </motion.div>
        )}
      </AnimatePresence>

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
    const outletSourceId = getFeedSourceId(outlet);
    const outletGroupKey = getEditorialGroupKey(outlet.name, outlet.url);
    return realNews.filter(news =>
      news.sourceId === outletSourceId ||
      news.sourceGroup === outletGroupKey ||
      news.source === outlet.name
    ).slice(0, 10);
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

const ArticlePanel = React.memo(({ article, isOpen, onClose, onToggleSave, isSaved, isDarkMode, apiKey, isResizing, getChatApiKey, initialViewMode = 'analysis' }) => {
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
          const nextMode = initialViewMode === 'chat' ? 'chat' : 'analysis';
          setViewMode(nextMode);
          if (nextMode === 'chat') setCurrentChatApiKey(getChatApiKey?.());
          setFocusedNode(null);
          setHighlightRequest(null);
          setShowCenterModal(false);
          
          // Zera os passos visuais
          setLoadingStep(0);
          
          runSuperPrompt();
      }
  }, [article?.id, isOpen, initialViewMode]);

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
      
const nodeData = aiData.contextualTerms.find(t => {
  const term = safeLower(t?.term);
  const node = safeLower(nodeName);
  return term.includes(node) || node.includes(term);
});      
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
    <WhatsAppGlyph className="w-7 h-7" />
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
{(!focusedNode?.context || safeLower(focusedNode?.context).includes('contexto geral')) ? (                <div>
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
          const directFeedLike = /\.(xml|rss|atom)(\?|#|$)/i.test(urlToCheck) || /feed|rss|atom/i.test(urlToCheck);
          const { data, error } = await supabase.functions.invoke('parse-feed', { body: { url: urlToCheck, type: directFeedLike ? undefined : 'discover', brief: true } });
          if (error || !data || !(data.feedUrl || data.url || data.discovered)) throw new Error("Feed não encontrado");
          const discoveredUrl = data.feedUrl || data.url || data.discovered || urlToCheck;
          setNewUrl(discoveredUrl);
          if (data.isYoutube || discoveredUrl.includes('youtube') || discoveredUrl.includes('youtu.be')) { setFeedType('youtube'); } else if (discoveredUrl.includes('pod') || discoveredUrl.includes('cast')) { setFeedType('podcast'); }
          alert(`Sucesso! Feed encontrado: ${discoveredUrl}`);
      } catch (err) { alert("Não foi possível validar/encontrar esse feed. Teste colar a URL direta do RSS/XML."); } finally { setIsDiscovering(false); }
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
    const sourceDomain = getUrlDomain(formattedUrl);
    const newFeed = { id: Date.now(), name: 'Nova Fonte', url: formattedUrl, type: feedType, category: feedType === 'podcast' ? 'Podcast' : 'Geral', logo: resolveLogoUrl({ source: sourceDomain || 'Nova Fonte', feedUrl: formattedUrl, feedLogo: null, siteUrl: formattedUrl }), display: { feed: targetFeed, banca: targetBanca } };
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
const newsletters = (newsData ?? []).filter(n =>
  safeLower(n?.source).includes('newsletter') ||
  n?.source === 'Morning Brew' ||
  n?.source === 'The Skimm'
);
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
                    <span className="text-xs font-bold uppercase tracking-widest">Sua Inbox Vetra</span>
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
