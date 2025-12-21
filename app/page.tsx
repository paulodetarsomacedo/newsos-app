// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js'
import ReactPlayer from 'react-player/youtube';

// Coloque suas chaves reais aqui
const supabase = createClient('https://usnhoviysiaeqcwvnhcd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbmhvdml5c2lhZXFjd3ZuaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjQ1NjksImV4cCI6MjA4MTM0MDU2OX0.7K1qfEeRZ7qrJBf0noIZJ6fkT4OMKIljgwd6r2MLUXk')
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, Play, Pause, 
  Maximize2, X, Globe, ArrowRight,
  Sun, Moon, TrendingUp, TrendingDown, CloudSun, CloudMoon, MapPin, 
  Clock, DollarSign, Bitcoin, Activity, Zap, GripVertical,
  FileText, CheckCircle, Trash2, BrainCircuit, Euro, 
  Headphones, Search, ChevronRight, Rss, Calendar as CalendarIcon, Loader2, RefreshCw, Music, Disc3, SkipBack, SkipForward, Type, ALargeSmall, Minus, Plus, PenTool, Highlighter, StickyNote, Save, Archive, Pencil, Eraser, Undo, Redo, Mail, Copy, Check, Wand2, Languages, Mic, Volume2, VolumeX, Heart
} from 'lucide-react';


// --- DADOS MOCKADOS ---

const STORIES = [
  { id: 1, name: 'G1', avatar: 'https://ui-avatars.com/api/?name=G1&background=c0392b&color=fff', items: [{ id: 101, type: 'image', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&q=80', title: 'Chuva recorde', time: '10 min' }] },
  { id: 2, name: 'Verge', avatar: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff', items: [{ id: 201, type: 'image', img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', title: 'Review M3', time: '30 min' }] },
  { id: 3, name: 'CNN', avatar: 'https://ui-avatars.com/api/?name=CN&background=e74c3c&color=fff', items: [{ id: 301, type: 'image', img: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=600&q=80', title: 'Bolsas asiáticas', time: '3h' }] },
];

const FEED_NEWS = [
  { 
    id: 1, 
    source: 'The Verge', 
    logo: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff&rounded=false&font-size=0.5', 
    time: '2h', 
    title: 'Apple Vision Pro ganha versão mais leve e barata', 
    summary: 'A gigante de Cupertino planeja lançar uma versão "Air" do seu headset espacial focado no consumo de mídia e conforto prolongado.',
    category: 'Tecnologia', 
    img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    readTime: '4 min'
  },
  { 
    id: 2, 
    source: 'CNN Market', 
    logo: 'https://ui-avatars.com/api/?name=CN&background=e74c3c&color=fff&rounded=false&font-size=0.5', 
    time: '3h', 
    title: 'Dólar cai abaixo de R$ 4,90 com otimismo fiscal', 
    summary: 'Investidores estrangeiros voltam a aportar capital no Brasil após a aprovação das novas metas fiscais pelo Senado.',
    category: 'Economia', 
    img: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&q=80',
    readTime: '2 min' 
  },
  { 
    id: 3, 
    source: 'BBC Science', 
    logo: 'https://ui-avatars.com/api/?name=BB&background=000&color=fff&rounded=false&font-size=0.5', 
    time: '5h', 
    title: 'Telescópio Webb descobre vapor d\'água em exoplaneta', 
    summary: 'A descoberta no planeta K2-18b reacende o debate sobre a possibilidade de vida fora do sistema solar em zonas habitáveis.',
    category: 'Tecnologia', 
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    readTime: '3 min' 
  },
  { 
    id: 4, 
    source: 'Vogue', 
    logo: 'https://ui-avatars.com/api/?name=VG&background=000&color=fff&rounded=false&font-size=0.5', 
    time: '6h', 
    title: 'As tendências de inverno que dominaram Paris', 
    summary: 'Casacos oversized e tons terrosos foram os protagonistas da Fashion Week, ditando o que veremos nas vitrines.',
    category: 'Local', 
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80', 
    readTime: '4 min' 
  },
  { 
    id: 5, 
    source: 'Politico', 
    logo: 'https://ui-avatars.com/api/?name=PO&background=000&color=fff', 
    time: '7h', 
    title: 'Senado aprova nova lei de trânsito para elétricos', 
    summary: 'Novas regras exigem adaptação de postos de recarga e criam incentivos fiscais para a troca de frota nas capitais.',
    category: 'Política', 
    img: 'https://images.unsplash.com/photo-1555848960-8c3fd4479802?w=800&q=80', 
    readTime: '5 min' 
  },
];

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

const FEED_CATEGORIES = ['Tudo', 'Política', 'Tecnologia', 'Economia', 'Saúde', 'Local', 'Carros'];
const YOUTUBE_CATEGORIES = ['Tudo', 'Tech', 'Finanças', 'Ciência'];



// --- ABA PODCAST (NOVA) ---

const PodcastTab = React.memo(({ isDarkMode, onPlayAudio, savedItems, onToggleSave, podcastsData, isLoading }: any) => {  
  const [filter, setFilter] = useState('Todos');
  
  // LOGICA 1: CATEGORIAS DINÂMICAS (Baseado no que tem no feed)
  // Se não tiver nada, mostra categorias padrão
  const uniqueCategories = useMemo(() => {
      if (!podcastsData || podcastsData.length === 0) return ['Todos'];
      const cats = new Set(podcastsData.map(p => p.source)); // Usamos a Fonte como "Filtro" inicial
      return ['Todos', ...Array.from(cats).slice(0, 5)];
  }, [podcastsData]);

  // LOGICA 2: FILTRAGEM
  const displayedPodcasts = useMemo(() => {
      if (!podcastsData) return [];
      if (filter === 'Todos') return podcastsData;
      return podcastsData.filter(p => p.source === filter);
  }, [podcastsData, filter]);

  return (
    <div className="pt-2 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      
      {/* 1. Header & Filtros */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                <Mic size={24} className="text-orange-500" /> Podcasts
            </h2>
            {/* Indicador de Quantidade */}
            <span className="text-xs font-bold opacity-50 border px-2 py-1 rounded-full">
                {podcastsData?.length || 0} eps
            </span>
        </div>
        
        {/* Barra de Filtros (Canais) */}
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

      {/* 2. Estado de Loading ou Vazio */}
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

      {/* 3. Lista de Episódios Reais */}
      <div className="px-4 space-y-4">
         {displayedPodcasts.map((pod) => (
             <div key={pod.id} className={`group relative p-3 rounded-2xl border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900' : 'bg-white border-zinc-100 hover:shadow-lg'}`}>
                 <div className="flex gap-4">
                     {/* Capa (Quadrada Padrão Podcast) */}
                     <div className="w-16 h-16 rounded-xl bg-zinc-800 flex-shrink-0 relative overflow-hidden cursor-pointer shadow-sm" onClick={() => onPlayAudio(pod)}>
                         <img 
                            src={pod.cover || pod.img} 
                            className="w-full h-full object-cover" 
                            onError={(e) => e.target.style.display = 'none'}
                         />
                         {/* Badge de Tipo (Video ou Audio) */}
                         <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] text-white font-bold flex items-center gap-1">
                             {pod.type === 'video' ? <Youtube size={8} /> : <Rss size={8} />}
                             {pod.type === 'video' ? 'Vídeo' : 'Áudio'}
                         </div>
                     </div>

                     {/* Info */}
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <div className="flex justify-between items-start">
                             <span className="text-[10px] font-bold text-orange-500 uppercase truncate pr-2">
                                {pod.source}
                             </span>
                             <span className="text-[9px] font-bold opacity-40 whitespace-nowrap">{pod.date}</span>
                         </div>
                         
                         <h4 className={`text-sm font-bold leading-tight mt-1 mb-2 line-clamp-2 cursor-pointer hover:underline ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} onClick={() => onPlayAudio(pod)}>
                             {pod.title}
                         </h4>
                         
                         <div className="flex items-center gap-3">
                             <button onClick={() => onToggleSave(pod)} className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${savedItems?.some(i => i.id === pod.id) ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                 <Bookmark size={12} fill={savedItems?.some(i => i.id === pod.id) ? "currentColor" : "none"} /> Salvar
                             </button>
                             
                             {/* Botão de Resumo IA */}
                             <button className="flex items-center gap-1 text-[10px] font-bold text-purple-500 hover:text-purple-400 transition-colors bg-purple-500/10 px-2 py-0.5 rounded-full" onClick={(e) => { e.stopPropagation(); alert("A IA está ouvindo e resumindo este episódio..."); }}>
                                 <Sparkles size={10} /> Resumo
                             </button>
                         </div>
                     </div>
                 </div>
                 
                 {/* Botão Play Flutuante (Hover) */}
                 <div className="absolute right-4 bottom-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                     <button onClick={() => onPlayAudio(pod)} className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition">
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

  // --- LÓGICA DE DATA, ARRASTAR E CALENDÁRIO ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

  // --- BRAIN: FRASES INTELIGENTES ---
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

  // --- EFEITO: ATUALIZA O STATUS BASEADO NO CONTEXTO ---
  useEffect(() => {
    // 1. Prioridade: Loading
    if (isLoading) {
        setAiStatus(getRandomPhrase('loading'));
        return;
    }

    // 2. Prioridade: Fonte Específica no Feed
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

    // 3. Prioridade: Abas Gerais
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
      if (isToday) {
          // Status atualizado pelo useEffect principal
      } else {
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
      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={handleDateChange}
        isDarkMode={isDarkMode}
      />

      <div className={`
        relative w-full overflow-hidden rounded-b-[2.5rem] shadow-2xl border-b border-white/10 
        transition-all duration-500 ease-in-out
        ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-900'}
      `}>
        {/* Background Effects */}
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[100%] bg-teal-600/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-soft-light pointer-events-none"></div>

        <div className="relative px-6 pt-6 pb-4 flex flex-col gap-4">
           
           {/* DATA ABA */}
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
                      {formatDate(currentDate)}
                      <CalendarIcon size={10} className="opacity-50" />
                  </span>
                  <ChevronRight size={14} className={`text-white/40 transition-opacity ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'group-hover:opacity-100'}`} />
              </div>
           </div>

           {/* LINHA 1: PERFIL + BOTÃO */}
           <div className="flex justify-between items-center mt-10">
              <div className="flex items-center gap-3">
                 <div onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-lg">
                    <img src="https://ui-avatars.com/api/?name=User&background=000&color=fff" className="rounded-full w-full h-full border-2 border-black" alt="User" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-[10px] font-black uppercase text-white/40 tracking-[0.15em] leading-none mb-1">System Status</h1>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                       {/* AQUI É ONDE A MÁGICA ACONTECE */}
                       <span className="text-xs font-bold text-white tracking-wide animate-in fade-in slide-in-from-left-2 duration-500 key={aiStatus}">
                           {aiStatus}
                       </span>
                    </div>
                 </div>
              </div>

              {/* BOTÃO GATILHO */}
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

           {/* LINHA 2: BARRA DE PESQUISA */}
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

           {/* LINHA 3: TICKER DE MERCADO */}
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

function LiquidFilterBar({ categories, active, onChange, isDarkMode, accentColor = 'blue', borderColor = { light: 'border-white', dark: 'border-white/5' } }) {
  return (
    <div className="w-full flex justify-center sticky top-0 z-30 py-2 pointer-events-none">
      <div className={`
        pointer-events-auto
        flex overflow-x-auto scrollbar-hide snap-x items-center
        max-w-[95%] 
        rounded-full border gap-1 
        p-1.5
        shadow-sm
        backdrop-blur-xl
        ${isDarkMode 
          ? `bg-blue/60 ${borderColor.dark}`
          : `bg-blue/70 ${borderColor.light}`
        }
      `}>
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onChange(cat)} 
              className={`
                relative px-6 py-1.5 rounded-full text-sm transition-all duration-300 whitespace-nowrap snap-center min-w-fit font-bold
                ${isActive 
                  ? 'bg-[#4c1d95] text-white shadow-md shadow-purple-500/20'
                  : (isDarkMode ? 'text-zinc-900 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-blue hover:bg-blue-50')}
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

  // 1. Extrai fontes únicas das notícias para montar o menu
  // (Num app real, viria do seu userFeeds, mas aqui extraímos do que temos na tela)
  const uniqueSources = Array.from(new Set(news.map(n => n.source)))
    .map(sourceName => {
      return news.find(n => n.source === sourceName);
    });

  return (
    <div className="absolute left-0 top-2 z-[1001]">
      
      {/* --- O BOTÃO "CORTADO" (TRIGGER) --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center
          h-[42px] w-12 pl-1
          rounded-r-2xl rounded-l-none /* Arredonda só a direita */
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
           // Se tiver uma fonte selecionada, tenta mostrar o logo pequeno
           <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
              <img 
                src={uniqueSources.find(s => s.source === selectedSource)?.logo} 
                className="w-full h-full object-cover"
              />
           </div>
        )}
      </button>

      {/* --- MENU SUSPENSO (ICONES) --- */}
      {isOpen && (
        <>
          {/* Backdrop invisível para fechar ao clicar fora */}
          <div className="fixed inset-0 z-[1000" onClick={() => setIsOpen(false)} />

          <div className={`
             absolute top-[50px] left-2 z-[101]
             flex flex-col gap-2 p-2
             rounded-2xl border shadow-xl backdrop-blur-xl
             animate-in slide-in-from-left-2 duration-200
             ${isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white/90 border-zinc-200'}
          `}>
             
             {/* Opção "Todas" */}
             <button
               onClick={() => { onSelect('all'); setIsOpen(false); }}
               className={`
                 w-10 h-10 rounded-full flex items-center justify-center transition-all
                 ${selectedSource === 'all' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : (isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')}
               `}
               title="Todas as Fontes"
             >
                <LayoutGrid size={20} />
             </button>

             <div className={`h-[1px] w-full ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`} />

             {/* Lista de Logos */}
             {uniqueSources.map((item) => (
               <button
                 key={item.source}
                 onClick={() => { onSelect(item.source); setIsOpen(false); }}
                 className={`
                   relative w-10 h-10 rounded-full p-[2px] transition-transform hover:scale-110
                   ${selectedSource === item.source ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : ''}
                 `}
                 title={item.source}
               >
                 <img 
                   src={item.logo} 
                   alt={item.source} 
                   className="w-full h-full rounded-full object-cover border border-black/10"
                 />
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

const NewsCard = React.memo(({ news, isSelected, isRead, isSaved, isLiked, isDarkMode, onClick, onToggleSave, onToggleLike }: any) => {
  return (
    <div 
      onClick={() => onClick(news)}
      style={{ zIndex: isSelected ? 50 : 1 }}
      className={`
        group relative cursor-pointer 
        transition-transform duration-300 ease-out will-change-transform
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
      {/* EFEITOS DE FUNDO */}
      <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px] pointer-events-none transition-opacity duration-700 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-200/50'}`} />
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-opacity duration-700 ${isSelected ? 'opacity-80' : 'opacity-0'} ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-200/50'}`} />

      <div className="relative z-10 flex flex-row gap-5 w-full p-3 items-start">
          {/* IMAGEM */}
          <div className={`relative overflow-hidden rounded-2xl flex-shrink-0 shadow-sm w-28 h-28 md:w-36 md:h-36 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
            <SmartImage 
                src={news.img} 
                title={news.title} 
                logo={news.logo} 
                sourceName={news.source} 
                isDarkMode={isDarkMode}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {isSelected && <div className="absolute inset-0 bg-[#4c1d95]/10 mix-blend-overlay pointer-events-none" />}
          </div>

          {/* CONTEÚDO */}
          <div className="flex-1 flex flex-col justify-start gap-1 py-1 min-w-0">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <div className={`relative z-20 w-8 h-8 rounded-lg overflow-hidden border shadow-sm shrink-0 ${isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'}`}>
                            <img src={news.logo} className="w-full h-full object-cover" alt="" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${news.source}&background=random`}/>
                        </div>
                        <div className={`relative z-10 -ml-3 pl-4 pr-3 py-1 rounded-lg border-y border-r border-l-0 text-[10px] font-bold tracking-tight uppercase flex items-center h-7.5 mt-0.6 ${isDarkMode ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-white/80 border-zinc-300 text-zinc-600'}`}>
                            {news.source}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isRead && !isSelected && (
                         <div className="flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded text-white" title="Notícia já lida">
                            <CheckCircle size={10} />
                            <span className="text-[9px] font-bold uppercase">Lido</span>
                         </div>
                      )}
                      <span className={`text-[10px] font-bold tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {news.time}
                      </span>
                    </div>
                </div>

                {isSelected && (
                    <div className="flex items-center gap-2 mb-1.5 animate-pulse">
                        <Sparkles size={16} className="text-[#047857] dark:text-[#4ade80]" />
                        <span className="text-[16px] font-black font-bold uppercase tracking-widest text-[green] dark:text-[#4ade80] drop-shadow-sm">
                            Lendo Agora
                        </span>
                    </div>
                )}

                <h3 className={`text-lg font-bold leading-snug tracking-tight transition-colors line-clamp-3 ${isSelected ? 'text-[purple] dark:text-[#4ade80]' : isRead ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : (isDarkMode ? 'text-zinc-100 group-hover:text-purple-400' : 'text-zinc-800 group-hover:text-[#4c1d95]')}`}>
                  {news.title}
                </h3>
            </div>

            <p className={`text-sm leading-relaxed line-clamp-2 font-medium mt-0 ${isRead ? 'text-zinc-500/60' : (isSelected ? (isDarkMode ? 'text-zinc-300' : 'text-zinc-600') : (isDarkMode ? 'text-zinc-500' : 'text-zinc-500'))}`}>
               {news.summary}
            </p>
          </div>
      </div>

      {/* RODAPÉ DO CARD (Botões) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border backdrop-blur-md select-none ${isDarkMode ? 'bg-black/20 border-white/5 text-zinc-400' : 'bg-white/40 border-black/5 text-zinc-500'}`}>
              <Clock size={10} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{news.readTime || '3 min'}</span>
          </div>

          {/* --- BOTÃO DE CURTIR CORRIGIDO --- */}
<button 
  onClick={(e) => { 
      e.stopPropagation(); 
      // Se a função existir, chama ela. Se não, não faz nada (sem alert chato)
      if (onToggleLike) onToggleLike(news);
  }} 
  className={`
      p-2 rounded-full transition-all duration-300 active:scale-75 group/like
      ${isLiked 
          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' // Vermelho forte quando curtido
          : (isDarkMode ? 'bg-black/20 text-zinc-400 hover:text-rose-500' : 'bg-white/40 text-zinc-500 hover:text-rose-500')
      }
  `} 
  title="Curtir"
>
   {/* fill={isLiked ? "currentColor" : "none"} garante que fique preenchido */}
   <Heart size={18} fill={isLiked ? "currentColor" : "none"} className="transition-transform group-hover/like:scale-110" />
</button>

          <button onClick={(e) => { e.stopPropagation(); alert(`Iniciando leitura por IA de: ${news.title}`); }} className={`p-2 rounded-full transition-all duration-300 active:scale-90 group/audio ${isDarkMode ? 'bg-black/20 hover:bg-[#4c1d95] text-zinc-400 hover:text-white' : 'bg-white/40 hover:bg-[#4c1d95] text-zinc-500 hover:text-white'}`} title="Ouvir Resumo">
             <Headphones size={18} />
          </button>

          <button onClick={(e) => { e.stopPropagation(); onToggleSave(news); }} className={`p-2 rounded-full transition-all duration-300 active:scale-75 group/save ${isSaved ? 'bg-[#4c1d95] text-white shadow-lg shadow-purple-500/30' : (isDarkMode ? 'bg-black/20 hover:bg-[#4c1d95]/20 text-zinc-400 hover:text-[#a78bfa]' : 'bg-white/40 hover:bg-[#4c1d95]/10 text-zinc-500 hover:text-[#4c1d95]')}`} title="Salvar para ler depois">
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} className="transition-transform group-hover/save:scale-110" />
          </button>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.news.id === next.news.id &&
    prev.isSelected === next.isSelected &&
    prev.isRead === next.isRead &&
    prev.isSaved === next.isSaved &&
    prev.isLiked === next.isLiked && // Adicionei verificação para evitar re-render desnecessário
    prev.isDarkMode === next.isDarkMode
  );
});

function FeedTab({ openArticle, isDarkMode, selectedArticleId, savedItems, onToggleSave, readHistory, newsData, isLoading, onPlayVideo, sourceFilter, setSourceFilter, likedItems, onToggleLike }) {
  const [category, setCategory] = useState('Tudo');
  
  // --- ESTADOS DO PULL-TO-REFRESH ---
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- LÓGICA DE DADOS REAIS VS MOCKADOS ---
  const safeNews = (newsData && newsData.length > 0) ? newsData : FEED_NEWS;

  // Lógica de Filtragem (Agora usa sourceFilter que vem das props)
  const filteredByCategory = category === 'Tudo' ? safeNews : safeNews.filter(n => n.category === category);
  const displayedNews = sourceFilter === 'all' ? filteredByCategory : filteredByCategory.filter(n => n.source === sourceFilter);

  // --- FUNÇÕES DE TOQUE ---
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
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        setIsRefreshing(false);
    }
    setPullDistance(0);
    setStartY(0);
  };

  if (isLoading && (!newsData || newsData.length === 0)) {
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
      
      {/* CABEÇALHO STICKY */}
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

      {/* ÁREA DE LOADING ANIMADA */}
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
      
     {/* LISTA DE CARDS OTIMIZADA */}
      <div className="flex flex-col gap-4">
        
        {/* MOSTRA SKELETONS SE ESTIVER CARREGANDO */}
        {isLoading && safeNews === FEED_NEWS && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <NewsCardSkeleton key={i} isDarkMode={isDarkMode} />
              ))}
            </>
        )}

        {!isLoading && displayedNews.length === 0 && (
           <div className="text-center py-10 opacity-50">
             <p>Nenhuma notícia encontrada nesta categoria.</p>
           </div>
        )}
        {displayedNews.map((news) => (
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

function YouTubeTab({ isDarkMode, openStory, onToggleSave, savedItems, realVideos, isLoading, onPlayVideo, seenStoryIds, onMarkAsSeen }) {
  const [category, setCategory] = useState('Tudo');
  const [activeStory, setActiveStory] = useState(null); 
  
  const safeVideos = (realVideos && realVideos.length > 0) ? realVideos : YOUTUBE_FEED;
  const displayedVideos = category === 'Tudo' ? safeVideos : safeVideos.filter(v => v.category === category || v.source === category);

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
      setActiveStory(story);
      // Marca como visto imediatamente ao abrir
      if (onMarkAsSeen) onMarkAsSeen(story.id);
  };

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in px-2 pl-16 relative min-h-screen">
      
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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

// --- PRINCIPAL (ATUALIZADO PARA 4 TÓPICOS) ---
const generateBriefing = async (news, apiKey) => {
  if (!news || news.length === 0) return null;
  if (!apiKey) {
      alert("API Key não configurada! Vá em Ajustes > Inteligência IA.");
      return null;
  }

  const context = news.slice(0, 30).map(n => {
      const cleanSummary = n.summary ? n.summary.replace(/<[^>]*>?/gm, '').slice(0, 400) : "Sem detalhes.";
      return `[FONTE: ${n.source}] MANCHETE: ${n.title} | CONTEXTO: ${cleanSummary}`;
  }).join('\n\n');

  const prompt = `
  Você é o Editor-Chefe de uma newsletter premium e inteligente (estilo Morning Brew ou Axios).
  
  SUA MISSÃO:
  Ler as notícias fornecidas abaixo, identificar os 4 (QUATRO) maiores temas do momento e escrever resumos EXPLICATIVOS, fluídos e concatenados.
  
  REGRAS EDITORIAIS:
  1. CONTEXTUALIZE: Não apenas repita o título. Explique o "porquê".
  2. AGRUPE: Junte notícias parecidas no mesmo tópico.
  3. TOM DE VOZ: Profissional, direto, mas conversacional.
  4. TAMANHO: O campo "summary" deve ter entre 25 a 40 palavras.

  MATÉRIA PRIMA:
  ${context}

  RETORNE APENAS ESTE JSON (Exatamente 4 itens em 'topics'):
  {
    "vibe_emoji": "Um único emoji que defina o humor global",
    "vibe_title": "Uma manchete de capa impactante e curta (3 a 6 palavras)",
    "topics": [
      { 
        "tag": "Categoria 1 (Ex: Política)", 
        "summary": "Texto explicativo rico..." 
      },
      { 
        "tag": "Categoria 2 (Ex: Economia)", 
        "summary": "Texto explicativo rico..." 
      },
      { 
        "tag": "Categoria 3 (Ex: Tech/Mundo)", 
        "summary": "Texto explicativo rico..." 
      },
      { 
        "tag": "Categoria 4 (Ex: Brasil/Cultura)", 
        "summary": "Texto explicativo rico..." 
      }
    ]
  }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();

    if (data.error) {
        console.warn(`Erro Principal (${data.error.message}). Fallback...`);
        return await generateBriefingFallback(news, apiKey);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        return await generateBriefingFallback(news, apiKey);
    }

    const finalData = parseAndNormalize(text);
    
    if (!finalData || !finalData.topics || finalData.topics.length === 0) {
        return await generateBriefingFallback(news, apiKey);
    }

    return finalData;

  } catch (error) {
    console.warn("Erro fatal. Fallback...", error);
    return await generateBriefingFallback(news, apiKey);
  }
};

// --- FUNÇÃO TREND RADAR (V4 - SINGLE FACT FOCUS) ---
const generateTrendRadar = async (news, apiKey) => {
  if (!news || news.length === 0) return null;

  // Enviamos Título + Snippet para a IA ter contexto
  const context = news.slice(0, 40).map(n => `- ${n.title} (${n.summary ? n.summary.slice(0, 80) : ''})`).join('\n');

  const prompt = `
  Analise estas manchetes. Agrupe por temas e identifique os 6 Tópicos mais quentes.
  
  Para cada tópico, siga esta lógica OBRIGATÓRIA:
  1. Identifique a notícia "Capitânia" (a mais importante/impactante daquele grupo).
  2. Esqueça as outras notícias menores do grupo. Foco total na Capitânia.
  3. Escreva um resumo de 2 a 3 linhas explicando ESSE FATO específico.
  
  Gere este JSON:
  - "topic": Nome curto do tema (Ex: "Mercosul", "SpaceX").
  - "score": 1 a 10.
  - "hex": Cor hexadecimal.
  - "summary": O texto explicando o fato principal.
  
  EXEMPLO DE SUMMARY (O que eu quero):
  "Lula endurece discurso e exige que União Europeia retire taxas ambientais para fechar o acordo ainda hoje."
  
  EXEMPLO DO QUE NÃO FAZER (Genérico):
  "Discussões sobre taxas e clima continuam no bloco econômico."

  DADOS:
  ${context}

  RETORNE APENAS A LISTA JSON:
  [ { "topic": "...", "score": 9, "hex": "#...", "summary": "..." } ]
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
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

// ==========================================================
// NOVO COMPONENTE SMART DIGEST (DESIGN BENTO GRID)
// ==========================================================

const SmartDigestWidget = ({ newsData, apiKey, isDarkMode, refreshTrigger }) => {
  const [digest, setDigest] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  // 1. LÓGICA DE RESET AUTOMÁTICO (Ao puxar a aba para atualizar)
  useEffect(() => {
    if (refreshTrigger > 0) {
        setDigest(null);
        setStatus('idle');
    }
  }, [refreshTrigger]);

  const handleGenerate = async () => {
    if (!apiKey) {
        alert("Configure sua API Key nas configurações primeiro.");
        return;
    }
    setStatus('loading');
    
    // Pequeno delay para a animação ser sentida
    await new Promise(r => setTimeout(r, 800));

    const result = await generateBriefing(newsData, apiKey);
    
    if (result) {
        setDigest(result);
        setStatus('success');
    } else {
        setStatus('error');
    }
  };

  // Cores para as tags (para não ficar tudo cinza)
  const getTagStyle = (index) => {
      const styles = [
          'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
          'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
          'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
      ];
      return styles[index % styles.length];
  };

  // --- 1. ESTADO INICIAL (CONVITE) ---
  if (status === 'idle') {
    return (
      <div className="px-1 mb-6">
        <div className={`relative overflow-hidden rounded-[2rem] p-8 border transition-all shadow-lg ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
           
           <div className="flex flex-col items-center text-center relative z-10">
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                 <Sparkles size={24} className="text-white animate-pulse" />
              </div>
              <h2 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>O que está acontecendo?</h2>
              <p className={`text-sm mb-6 max-w-[260px] leading-relaxed opacity-70 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Deixe a IA ler {newsData?.length || 0} manchetes e explicar o mundo para você em segundos.
              </p>
              <button 
                onClick={handleGenerate}
                className={`
                    group relative px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest overflow-hidden shadow-xl active:scale-95 transition-all
                    ${isDarkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white'}
                `}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="flex items-center gap-2 relative z-10"><Zap size={14} fill="currentColor"/> Gerar Smart Digest</span>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // --- 2. ESTADO LOADING (COM PERSONALIDADE) ---
  if (status === 'loading') {
    return (
      <div className="px-1 mb-6">
        <div className={`h-[350px] rounded-[2rem] flex flex-col items-center justify-center border relative overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="w-16 h-16 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin mb-6" />
           <div className="text-center space-y-1 relative z-10">
               <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Processando Fatos...</p>
               <p className="text-xs font-mono opacity-50 uppercase tracking-widest">Lendo Fontes • Analisando Viés</p>
           </div>
        </div>
      </div>
    );
  }

  // --- 3. ESTADO ERRO (RETRY FÁCIL) ---
  if (status === 'error' || !digest) {
      return (
        <div className="px-1 mb-6">
            <div className="p-6 rounded-[2rem] bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-center">
                <p className="text-red-500 font-bold text-sm mb-2">A IA falhou ao processar.</p>
                <button onClick={handleGenerate} className="text-xs font-bold underline decoration-red-500 underline-offset-4 opacity-80 hover:opacity-100">Tentar Novamente</button>
            </div>
        </div>
      );
  }

  // --- 4. ESTADO FINAL (BENTO GRID LAYOUT) ---
  return (
    <div className="px-1 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`relative p-5 rounded-[2.5rem] shadow-2xl border ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
         
         {/* CABEÇALHO HERO */}
         <div className="flex flex-col items-center text-center mb-8 pt-2">
            <div className="text-5xl mb-3 animate-bounce shadow-xl rounded-full">{digest.vibe_emoji}</div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-1">
                Vibe do Momento
            </span>
            <h2 className={`text-2xl md:text-3xl font-black leading-tight max-w-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {digest.vibe_title}
            </h2>
         </div>

         {/* GRID DE TÓPICOS */}
         <div className="grid grid-cols-1 gap-3">
            {digest.topics?.map((topic, i) => (
                <div 
                    key={i} 
                    className={`
                        group relative p-5 rounded-3xl border transition-all hover:scale-[1.01]
                        ${isDarkMode ? 'bg-black/40 border-white/5 hover:bg-white/5' : 'bg-zinc-50 border-zinc-100 hover:shadow-md'}
                    `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${getTagStyle(i)}`}>
                            {topic.tag}
                        </span>
                        {/* Indicador visual pequeno */}
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {topic.summary}
                    </p>
                </div>
            ))}
         </div>

         {/* RODAPÉ E REFRESH MANUAL */}
         <div className="mt-6 flex justify-between items-center px-2">
            <div className="flex items-center gap-1.5 opacity-30">
                <BrainCircuit size={12} />
                <span className="text-[10px] font-mono">Gemini 2.0 Flash</span>
            </div>
            <button 
                onClick={handleGenerate} 
                className={`p-2 rounded-full transition-all active:rotate-180 ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
                title="Regerar análise"
            >
                <RefreshCw size={16}/>
            </button>
         </div>
      </div>
    </div>
  );
};



const TrendRadar = ({ newsData, apiKey, isDarkMode, refreshTrigger }) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  // Lógica de Cores Personalizada
  const getHeatColor = (score) => {
      if (score >= 9) return '#ef4444'; // Vermelho (Explosivo)
      if (score >= 7) return '#f97316'; // Laranja (Quente)
      if (score >= 5) return '#10b981'; // Verde (Médio)
      return '#3b82f6';                 // Azul (Frio)
  };

  useEffect(() => {
    if (!apiKey || !newsData || newsData.length === 0) return;
    
    const loadTrends = async () => {
        setLoading(true);
        setActiveIndex(null); 
        await new Promise(r => setTimeout(r, 600)); 
        const data = await generateTrendRadar(newsData, apiKey);
        
        if (data && Array.isArray(data)) {
            // Mantendo a ordem original da IA (Misturada/Orgânica) conforme solicitado
            setTrends(data);
        }
        setLoading(false);
    };

    loadTrends();
  }, [newsData, apiKey, refreshTrigger]);

  const handleToggle = (idx) => {
      setActiveIndex(activeIndex === idx ? null : idx);
  };

  if ((!trends || !Array.isArray(trends)) && !loading) return null;

  return (
    <div className="px-1 mb-2 animate-in fade-in duration-1000 slide-in-from-right-8 relative z-30">
      
      {/* Título */}
      <div className="flex items-center justify-center gap-2 mb-2 opacity-70">
         <div className="relative">
            <Activity size={14} className="text-orange-500" />
            <div className="absolute inset-0 bg-orange-500 blur-[8px] opacity-50 animate-pulse" />
         </div>
         <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Trend Radar</span>
      </div>

      {loading ? (
         <div className="flex justify-center gap-4 overflow-hidden px-2 opacity-50 pb-8">
            {[1,2,3,4].map(i => (
                <div key={i} className={`h-9 w-24 rounded-full animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            ))}
         </div>
      ) : (
         // Usei gap-4 para dar um espaçamento uniforme e elegante
         <div className="flex justify-start md:justify-center items-start gap-4 overflow-x-auto scrollbar-hide px-4 pb-47 pt-2 snap-x">
            {trends.map((item, idx) => {
                const color = getHeatColor(item.score);
                const isActive = activeIndex === idx;
                const isExplosive = item.score >= 9;
                
                // Escala uniforme: Todos 100%, crescem só na interação para manter alinhamento
                const scale = isActive ? 'scale-105' : 'scale-100 hover:scale-105';
                
                // Lógica de posição do balão (Anti-corte)
                const isFirst = idx === 0;
                const isLast = idx === trends.length - 1;
                
                let balloonAlignClass = "-translate-x-1/2 left-1/2"; 
                if (isFirst) balloonAlignClass = "left-0";           
                if (isLast) balloonAlignClass = "right-0";           
                
                let arrowAlignClass = "-translate-x-1/2 left-1/2";   
                if (isFirst) arrowAlignClass = "left-8";             
                if (isLast) arrowAlignClass = "right-8";             

                return (
                    <div key={idx} className={`relative flex-shrink-0 snap-center flex flex-col items-center`}>
                        
                        {/* BOTÃO */}
                        <div 
                            onClick={() => handleToggle(idx)}
                            className={`
                                relative group cursor-pointer transition-all duration-300 ${scale}
                                ${isActive ? 'z-30' : 'z-10'}
                            `}
                        >
                            {/* AURA (Para todos, seguindo a cor do score) */}
                            <div 
                                className="absolute inset-0 rounded-full blur-md opacity-50 animate-pulse"
                                style={{ backgroundColor: color }}
                            />

                            <div 
                                className={`
                                    relative px-5 py-2.5 rounded-full border flex items-center gap-2 shadow-sm backdrop-blur-md transition-colors
                                    ${isDarkMode ? 'bg-zinc-900/90 text-white' : 'bg-white/90 text-zinc-800'}
                                    ${isActive || isExplosive ? 'border-2' : 'border'}
                                `}
                                style={{ 
                                    borderColor: isActive ? color : color, 
                                    boxShadow: `0 4px 15px ${color}30`
                                }}
                            >
                                {isExplosive && <span className="text-[10px] animate-bounce">🔥</span>}
                                <span className="text-xs font-bold whitespace-nowrap tracking-tight">{item.topic}</span>
                                
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            </div>
                        </div>

                        {/* O BALÃO */}
                        {isActive && (
                            <div className={`absolute top-full mt-4 w-80 z-50 animate-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top ${balloonAlignClass}`}>
                                {/* Seta */}
                                <div 
                                    className={`absolute -top-2 w-4 h-4 rotate-45 border-l border-t ${arrowAlignClass}`}
                                    style={{ 
                                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                                        borderColor: color,
                                        borderWidth: '1px'
                                    }}
                                />
                                
                                {/* Conteúdo */}
                                <div 
                                    className={`
                                        relative p-5 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-2
                                        ${isDarkMode ? 'bg-zinc-950/95 text-zinc-200' : 'bg-white/95 text-zinc-800'}
                                    `}
                                    style={{ borderColor: color, boxShadow: `0 10px 50px -10px ${color}60` }}
                                >
                                    <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-2 mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: color}}/>
                                            <span 
                                                className="text-[10px] font-black uppercase tracking-widest opacity-80"
                                                style={{ color: color }}
                                            >
                                                SCORE: {item.score}/10
                                            </span>
                                        </div>
                                        {/* Barra de progresso visual */}
                                        <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${item.score * 10}%`, backgroundColor: color }} />
                                        </div>
                                    </div>
                                    
                                    <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                        {item.summary}
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                )
            })}
         </div>
      )}
    </div>
  );
};

function HappeningTab({ openArticle, openStory, isDarkMode, newsData, onRefresh, seenStoryIds = [], apiKey }) {
  const [isPodcastOpen, setIsPodcastOpen] = useState(false);
  
  // Estado para sinalizar o reset do Smart Digest quando atualizar a página
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // --- ESTADOS DO PULL-TO-REFRESH ---
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- LÓGICA DE STORIES (APENAS A ÚLTIMA DE CADA FONTE + FILTRO DE VISTOS) ---
  const storiesToDisplay = useMemo(() => {
    // Se não houver dados reais, retorna vazio
    if (!newsData || newsData.length === 0) return [];

    const uniqueStories = [];
    const seenSources = new Set(); 
    
    newsData.forEach((item) => {
        const sourceName = item.source || "Fonte"; 
        
        // Pega apenas a primeira vez que a fonte aparece (a mais recente)
        if (!seenSources.has(sourceName)) {
            seenSources.add(sourceName);

            // Verifica se este ID específico já foi visto
            const isSeen = seenStoryIds.includes(item.id);
            
            // REGRA: Se foi visto, ele não entra na lista (ele some da barra de stories)
            if (isSeen) return;

            // Gerador de imagem de fallback elegante caso o RSS não tenha imagem
            const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'News')}&background=random&color=fff&size=800&font-size=0.33&length=3`;
            const finalImg = (item.img && item.img.length > 10) ? item.img : fallbackImage;

            uniqueStories.push({
                id: item.id, // O ID do story é o ID da própria notícia
                name: sourceName,
                avatar: item.logo || `https://ui-avatars.com/api/?name=${sourceName}&background=random&color=fff`,
                isSeen: isSeen,
                items: [{
                    ...item,
                    img: finalImg,
                    origin: 'story'
                }]
            });
        }
    });

    return uniqueStories;
  }, [newsData, seenStoryIds]);

  // --- FUNÇÕES DE GESTO (PULL TO REFRESH) ---
  const handleTouchStart = (e) => {
    if (window.scrollY <= 5 && !isRefreshing) {
        setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0 || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0 && window.scrollY <= 5) {
        if (e.cancelable) e.preventDefault();
        // Efeito elástico (puxar fica mais pesado conforme desce)
        const newPull = Math.min(diff * 0.5, 220); 
        setPullDistance(newPull);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 90) {
        setIsRefreshing(true);
        setPullDistance(120); // Trava na posição de loading
        
        // --- AQUI ESTÁ O SEGREDO: Reseta o Smart Digest ---
        setRefreshTrigger(prev => prev + 1);
        
        if (onRefresh) {
            await onRefresh();
        }
        
        // Mantém o ícone visível por 1 segundo após o término para feedback visual
        setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
        }, 1000);
    } else {
        setPullDistance(0);
    }
    setStartY(0);
  };

  // Dados para os cards estáticos de "Em Alta"
  const trending = [
    { id: 1, title: 'IA Generativa: O novo marco regulatório começa a valer hoje na Europa', source: 'Politico', time: '15m', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80' },
    { id: 2, title: 'Final da Champions: Real Madrid e City se enfrentam em jogo histórico', source: 'ESPN', time: '45m', img: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=600&q=80' },
    { id: 3, title: 'Bitcoin atinge nova máxima histórica com aprovação de ETF', source: 'Bloomberg', time: '2h', img: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80' }
  ];

  return (
    <div 
        className="space-y-8 animate-in fade-in duration-700 pb-10 min-h-screen touch-pan-y relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      
      {/* --- INDICADOR DE LOADING FLUTUANTE (CENTRALIZADO) --- */}
      <div 
        className="fixed left-0 right-0 z-[1000] flex justify-center pointer-events-none"
        style={{ 
            top: '35%', 
            opacity: Math.min(pullDistance / 80, 1),
            transform: `scale(${Math.min(pullDistance / 100, 1.2)})`,
            display: pullDistance > 0 || isRefreshing ? 'flex' : 'none'
        }}
      >
         <div className={`
            flex flex-col items-center gap-3 p-6 rounded-[2.5rem] 
             shadow-2xl border
            ${isDarkMode 
                ? 'bg-black/5 border-white/10 shadow-purple-500/20' 
                : 'bg-white/90 border-white shadow-xl text-zinc-900'}
         `}>
            {isRefreshing ? (
                <Loader2 size={42} className="animate-spin text-purple-500" />
            ) : (
                <RefreshCw 
                    size={42} 
                    className="text-purple-500 transition-transform" 
                    style={{ transform: `rotate(${pullDistance * 3}deg)` }}
                />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                {isRefreshing ? 'Atualizando Feed' : 'Solte para Atualizar'}
            </span>
         </div>
      </div>

      {/* --- ÁREA DE STORIES --- */}
      <div className="flex items-center gap-4 px-2 pt-2 relative z-10">
        <div className="flex-1 min-w-0"> 
            <div className="flex space-x-5 overflow-x-auto pb-2 scrollbar-hide snap-x items-center min-h-[100px]">
                
                {/* Caso todos os stories tenham sido vistos */}
                {storiesToDisplay.length === 0 && (
                    <div className="flex flex-col justify-center h-full pl-2 opacity-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Nada de novo por aqui</span>
                        <span className="text-[9px]">Puxe para atualizar o feed</span>
                    </div>
                )}

                {storiesToDisplay.map((story) => (
                <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group flex-shrink-0">
                    <div className={`
                        relative w-[76px] h-[76px] rounded-full p-[3px] transition-all duration-500
                        bg-gradient-to-tr 
                        ${story.isSeen 
                            ? 'from-blue-500 to-cyan-400 opacity-50' 
                            : 'from-rose-600 via-pink-500 to-orange-400 shadow-lg shadow-rose-500/20'}
                    `}>
                        <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950 bg-zinc-900' : 'border-white bg-zinc-200'}`}>
                            <img src={story.avatar} className="w-full h-full object-cover" alt="" />
                        </div>
                    </div>
                    <span className={`text-[10px] font-semibold truncate max-w-[76px] text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {story.name}
                    </span>
                </div>
                ))}
            </div>
        </div>

        {/* BOTÃO PODNEWS */}
        <div className="flex-shrink-0 pl-2 border-l border-dashed border-zinc-300 dark:border-zinc-700">
            <button onClick={() => setIsPodcastOpen(true)} className="group relative flex flex-col items-center justify-center gap-1.5 w-20 transition-all hover:scale-105 active:scale-95">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Sparkles size={14} className="absolute top-1 right-1 text-white/60 animate-pulse" />
                    <Headphones size={20} className="text-white" />
                </div>
                <div className="text-center leading-none">
                    <span className={`block text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>PodNews</span>
                    <span className="text-[8px] text-purple-500 font-bold">07:00</span>
                </div>
            </button>
        </div>
      </div>

{/* --- NOVO RADAR DE TENDÊNCIAS --- */}
      <TrendRadar 
          newsData={newsData} 
          apiKey={apiKey} 
          isDarkMode={isDarkMode} 
          refreshTrigger={refreshTrigger} 
      />

      {/* --- SMART DIGEST (BENTO GRID) --- */}
      {/* Substitui o antigo card "Resumo do Momento" */}
      <SmartDigestWidget 
          newsData={newsData} 
          apiKey={apiKey} 
          isDarkMode={isDarkMode} 
          refreshTrigger={refreshTrigger} // Prop para resetar o componente
      />

      {/* --- OUTRO CARD DE DESTAQUE (SPACEX) --- */}
      <div className="px-1">
         <div onClick={() => openArticle({ title: 'SpaceX prepara lançamento histórico', source: 'SpaceX Live', img: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80', origin: 'rss' })} className="group relative h-[400px] w-full rounded-[32px] overflow-hidden cursor-pointer shadow-2xl transition-all duration-500 hover:shadow-orange-500/20">
            <img src="https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="SpaceX" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-400/30">
               <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
               <span className="text-white text-[10px] font-bold uppercase tracking-widest">Ao Vivo • Cabo Canaveral</span>
            </div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
               <div className="flex items-center gap-2 mb-2 opacity-80"><span className="text-orange-400 font-bold text-xs uppercase tracking-wider">Ciência & Espaço</span><span className="text-zinc-300 text-xs">Há 10 min</span></div>
               <h2 className="text-3xl font-bold text-white leading-tight mb-2">SpaceX prepara lançamento histórico da Starship V3.</h2>
               <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:translate-x-2 transition-transform"><div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><Play size={12} fill="white" /></div>Assistir Transmissão</div>
            </div>
         </div>
      </div>

      {/* --- SEÇÃO EM ALTA --- */}
      <div className="px-2 pt-4">
        <div className="flex items-center gap-2 mb-4 px-1"><TrendingUp size={20} className="text-blue-500" /><h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Em Alta Agora</h3></div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {trending.map(item => (
            <div key={item.id} onClick={() => openArticle({...item, origin: 'rss'})} className={`min-w-[280px] md:min-w-[320px] rounded-2xl p-4 cursor-pointer snap-center border transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:shadow-lg'}`}>
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 flex-shrink-0 relative">
                    <img src={item.img} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-0 left-0 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-br-lg text-white text-[10px] font-bold">#{item.id}</div>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">{item.source} • {item.time}</span>
                    <h4 className={`font-bold leading-snug mt-1 line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{item.title}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DO PODCAST (SE ABERTO) */}
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


// --- NOVO: Função que lê XML (RSS/Atom) e converte para nosso formato ---
const parseXMLToNewsItems = (xmlText, feedSource, feedId) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  
  // 1. TENTATIVA DE DESCOBRIR O NOME REAL E LINK DO SITE
  let detectedTitle = feedSource;
  let siteLink = "";
  
  const channelTitle = xmlDoc.querySelector("channel > title") || xmlDoc.querySelector("title");
  if (channelTitle && channelTitle.textContent) {
      detectedTitle = channelTitle.textContent.trim();
  }

  const channelLink = xmlDoc.querySelector("channel > link") || xmlDoc.querySelector("link");
  if (channelLink) {
      siteLink = channelLink.textContent || channelLink.getAttribute("href") || "";
  }

  // --- LOGICA DE LOGO AUTOMÁTICA (FAVICON DO GOOGLE) ---
  // Se achamos o link do site (ex: https://g1.globo.com), pedimos o ícone pro Google
  let autoLogo = `https://ui-avatars.com/api/?name=${detectedTitle}&background=random`;
  if (siteLink) {
      try {
          const domain = new URL(siteLink).hostname;
          autoLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch (e) { /* ignora erro de url */ }
  }

  // Agora processamos os itens
  const items = Array.from(xmlDoc.querySelectorAll("item, entry"));
  
  const parsedItems = items.map((node, index) => {
    const getTxt = (tag) => node.querySelector(tag)?.textContent || "";
    
    // Tenta links de várias formas
    const linkNode = node.querySelector("link");
    let link = linkNode?.getAttribute("href") || linkNode?.textContent || "";

    // MELHORIA: Suporte específico para feeds do YouTube (Atom)
    // Feeds do YouTube costumam colocar o ID na tag <yt:videoId>
    const ytId = getTxt("yt:videoId") || getTxt("videoId");
    if (ytId) {
        // Se achou o ID direto no XML, reconstrói o link perfeito
        link = `https://www.youtube.com/watch?v=${ytId}`;
    }

    const pubDate = getTxt("pubDate") || getTxt("published") || getTxt("updated") || new Date().toISOString();
    const description = getTxt("description") || getTxt("summary") || getTxt("content");

    // Imagem (Lógica melhorada)
    let img = null;
    const mediaContent = node.getElementsByTagNameNS("*", "content");
    if (mediaContent.length > 0) img = mediaContent[0].getAttribute("url");
    if (!img) {
        const enclosure = node.querySelector("enclosure");
        if (enclosure) img = enclosure.getAttribute("url");
    }
    if (!img) {
        img = extractImageFromContent(description);
    }

    return {
      id: `${feedId}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      source: detectedTitle, // USA O NOME REAL DESCOBERTO
      logo: autoLogo,        // USA A LOGO REAL DO GOOGLE
      time: new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rawDate: new Date(pubDate),
      title: getTxt("title"),
      summary: description.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...',
      category: 'Geral',
      img: img,
      readTime: '3 min',
      link: link,
      origin: 'rss'
    };
  });

  return { items: parsedItems, realTitle: detectedTitle, realLogo: autoLogo };
};

// Função Auxiliar (pode ficar fora ou antes do componente)
const extractImageFromContent = (content, enclosure) => {
  if (enclosure?.link) return enclosure.link;
  const imgMatch = content?.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  return null;
};


const VideoPlayerModal = ({ video, onClose }) => {
  const [activated, setActivated] = useState(false);
  const finalId = video.videoId || getVideoId(video.link);

  if (!finalId) return null;

  // --- CONFIGURAÇÃO DE IDENTIDADE PARA O GOOGLE ---
  // Pegamos a URL exata do seu app (ex: https://newsos.netlify.app)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Montamos a URL oficial de embed
  // 1. Voltamos para o domínio padrão do youtube.com (mais compatível com a sua Chave API)
  // 2. Passamos o 'origin' e o 'widget_referrer' -> Isso mata o Erro 153
  const embedUrl = `https://www.youtube.com/embed/${finalId}?` + 
                   `autoplay=1&` +
                   `playsinline=1&` +
                   `enablejsapi=1&` +
                   `widget_referrer=${encodeURIComponent(origin)}&` + 
                   `origin=${encodeURIComponent(origin)}&` +
                   `rel=0`;

  return (
    /* Usamos o finalId como key para garantir que o modal resete ao trocar de vídeo */
    <div key={finalId} className="fixed inset-0 z-[60000] bg-black flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Botão Fechar */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white z-[60002] backdrop-blur-md transition-all active:scale-90"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-5xl aspect-video bg-zinc-950 rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/5">
        
        {!activated ? (
          /* ESTADO 1: CAPA (O toque aqui autoriza o áudio e vídeo no iPad) */
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
            onClick={() => setActivated(true)}
          >
            <img 
              src={video.img || video.cover} 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" 
              alt="Capa"
            />
            <div className="relative bg-red-600 p-6 rounded-full shadow-2xl group-hover:scale-110 transition-all duration-300">
              <Play size={48} fill="white" className="text-white ml-1" />
            </div>
            <div className="mt-6 text-center">
                <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Toque para Assistir</p>
                <p className="text-white/30 text-[9px] font-bold uppercase mt-2">Conexão Autenticada</p>
            </div>
          </div>
        ) : (
          /* ESTADO 2: IFRAME COM IDENTIDADE RECONHECIDA */
          <iframe
            src={embedUrl}
            className="w-full h-full border-none"
            /* IMPORTANTE: Removido o no-referrer que causou o Erro 153 */
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      
      <div className="mt-8 text-center px-8 max-w-3xl animate-in slide-in-from-bottom-4">
        <h2 className="text-white text-xl md:text-3xl font-black leading-tight mb-2 line-clamp-2">
            {video.title}
        </h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{video.source}</p>
      </div>

      {/* Força o hardware do iPad a processar o vídeo separadamente para não congelar */}
      <style dangerouslySetInnerHTML={{ __html: `
        iframe {
            -webkit-backface-visibility: hidden !important;
            -webkit-transform: translate3d(0,0,0) !important;
        }
      `}} />
    </div>
  );
};


// --- COMPONENTE: PLAYER DE ÁUDIO GLOBAL ---
const GlobalAudioPlayer = ({ track, onClose, isDarkMode }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!track || !track.link) return;

    // Se o link for do YouTube ou não for de áudio, aborta para não gerar erro
    if (track.link.includes('youtube.com') || track.link.includes('youtu.be')) {
        setLoadError(true);
        return;
    }

    const playAudio = async () => {
        try {
            setLoadError(false);
            setIsPlaying(false);
            setProgress(0);
            
            if (audioRef.current) {
                audioRef.current.src = track.link;
                audioRef.current.load();
                
                // Tenta tocar e captura o AbortError se o usuário trocar rápido
                await audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            // Ignora AbortError (normal em navegação rápida)
            if (error.name !== 'AbortError') {
                console.error("Erro de reprodução:", error);
                // Se der NotSupportedError, marcamos erro na UI
                if (error.name === 'NotSupportedError') setLoadError(true);
            }
        }
    };

    playAudio();

  }, [track]);

  const togglePlay = () => {
      if (!audioRef.current) return;
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {}); // Catch vazio para ignorar erros de interação
      setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
  };

  const handleSeek = (e) => {
      if (!audioRef.current) return;
      const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
      if(isFinite(newTime)) {
          audioRef.current.currentTime = newTime;
          setProgress(Number(e.target.value));
      }
  };

  const skipTime = (seconds) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime += seconds;
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
        <audio 
            ref={audioRef} 
            onTimeUpdate={handleTimeUpdate} 
            onLoadedMetadata={(e) => setDuration(e.target.duration)} 
            onEnded={() => setIsPlaying(false)}
            onError={() => { 
                console.log("Erro no audio tag");
                setLoadError(true); 
                setIsPlaying(false); 
            }}
        />
        
        <div className="absolute top-0 left-4 right-4 -mt-1.5 h-4 group cursor-pointer flex items-center">
             <input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full transition-all accent-orange-500" />
        </div>

        <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden relative shadow-md">
                <img src={track.cover} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold leading-tight truncate">{track.title}</h4>
                <p className="text-[10px] opacity-60 truncate">
                    {loadError ? <span className="text-red-500 font-bold">Erro: Formato de áudio inválido</span> : `${track.source} • ${formatTime(currentTime)} / ${formatTime(duration)}`}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => skipTime(-15)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><span className="text-[10px] font-bold">-15s</span></button>
                <button onClick={togglePlay} disabled={loadError} className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition ${loadError ? 'bg-zinc-500 opacity-50' : 'bg-orange-500 hover:scale-105 active:scale-95'}`}>
                    {isPlaying ? <Pause size={20} fill="white"/> : <Play size={20} fill="white" className="ml-1"/>}
                </button>
                <button onClick={() => { setIsPlaying(false); onClose(); }} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500"><X size={24} /></button>
            </div>
        </div>
    </div>
  );
};

export default function NewsOS_V12() {
  const [activeTab, setActiveTab] = useState('happening'); 
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null); 
  const [selectedStory, setSelectedStory] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null); 
  const [seenStoryIds, setSeenStoryIds] = useState([]);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  // --- ESTADO NOVO: FILTRO DE FONTE (ELEVADO DA FEEDTAB) ---
  const [sourceFilter, setSourceFilter] = useState('all');

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

  const [userFeeds, setUserFeeds] = useState([
      { id: 1, name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', display: { feed: true } },
      { id: 2, name: 'G1', url: 'https://g1.globo.com/dynamo/rss2.xml', category: 'Local', display: { feed: true } }
  ]);
  const [realNews, setRealNews] = useState([]); 
  const [realVideos, setRealVideos] = useState([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [realPodcasts, setRealPodcasts] = useState([]);
  const [savedItems, setSavedItems] = useState(SAVED_ITEMS);
  const [readHistory, setReadHistory] = useState([]);
  const [likedItems, setLikedItems] = useState([]); 

useEffect(() => {
    setMounted(true);
  }, []);

  // NOVA FUNÇÃO PARA ALTERNAR O LIKE
  const handleToggleLike = (article) => {
    setLikedItems(prev => {
      if (prev.includes(article.id)) {
        // Se já curtiu, remove (descurtir)
        return prev.filter(id => id !== article.id);
      } else {
        // Se não curtiu, adiciona
        return [...prev, article.id];
      }
    });
  };


  // --- FUNÇÃO FETCH FEEDS (V9 - LIMITES DINÂMICOS: 5 POD / 10 VID / 20 NEWS) ---
  const fetchFeeds = async () => {
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

    const promises = userFeeds.map(async (feed) => {
        if (!feed.url) return;

        try {
            const { data, error } = await supabase.functions.invoke('parse-feed', {
                body: { url: feed.url }
            });

            if (error || !data || !data.items) return;

            let finalLogo = data.image; 
            const sourceName = data.title || feed.name;
            
            if (feed.name === 'Nova Fonte' || feed.name === 'Sem Título') {
                feedsThatNeedUpdate.push({ id: feed.id, name: data.title });
            }

            const isFeedYoutube = feed.url.includes('youtube.com') || feed.url.includes('youtu.be') || data.isYoutube;

            if (isFeedYoutube) {
                finalLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(sourceName)}&background=random&color=fff&size=128&rounded=true&bold=true&length=2`;
            } else if (!finalLogo) {
               try {
                   const domain = new URL(data.link || feed.url).hostname;
                   finalLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
               } catch (e) {
                   finalLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(sourceName)}`;
               }
            }

            // --- DEFINIÇÃO DO LIMITE DINÂMICO ---
            let LIMIT = 20; // Padrão (Notícias)
            
            if (feed.type === 'podcast') {
                LIMIT = 1; // Podcasts: Apenas os 5 mais recentes
            } else if (feed.type === 'youtube' || isFeedYoutube) {
                LIMIT = 3; // Vídeos: Apenas os 10 mais recentes
            }

            const items = data.items.slice(0, LIMIT).map(item => {
                
                let mediaLink = item.link;
                let hasEnclosure = false;

                if (item.enclosure?.url) {
                    mediaLink = item.enclosure.url;
                    hasEnclosure = true;
                } else if (item.audio) {
                    mediaLink = item.audio;
                    hasEnclosure = true;
                }

                const isYoutubeItem = (mediaLink && (mediaLink.includes('youtube.com') || mediaLink.includes('youtu.be'))) || isFeedYoutube;
                
                let finalType = 'link'; 

                if (isYoutubeItem) {
                    finalType = 'video';
                } else if (hasEnclosure || (mediaLink && (mediaLink.endsWith('.mp3') || mediaLink.endsWith('.m4a') || mediaLink.endsWith('.wav')))) {
                    finalType = 'audio'; 
                }

                return {
                    id: `${feed.id}-${item.id || Math.random().toString(36).substr(2, 9)}`,
                    source: sourceName,
                    show: sourceName,
                    logo: finalLogo,
                    time: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoje',
                    rawDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                    title: item.title,
                    summary: item.summary ? item.summary.slice(0, 150) + '...' : '',
                    category: feed.type === 'podcast' ? 'Podcast' : (item.category || 'Geral'),
                    type: finalType, 
                    img: item.img || finalLogo,
                    cover: item.img || finalLogo, 
                    link: mediaLink, 
                    url: item.link,  
                    videoId: item.videoId || getVideoId(item.link),
                    date: new Date(item.pubDate || Date.now()).toLocaleDateString(),
                };
            });

            if (feed.type === 'podcast') {
                allPodcastItems.push(...items);
            } else if (feed.type === 'youtube' || (isFeedYoutube && feed.type !== 'news')) {
                allVideoItems.push(...items);
            } else {
                allNewsItems.push(...items);
            }

        } catch (err) { console.error(`Erro no feed ${feed.name}`, err); }
    });

    await Promise.all(promises);

    if (feedsThatNeedUpdate.length > 0) {
        setUserFeeds(prev => prev.map(f => {
            const update = feedsThatNeedUpdate.find(u => u.id === f.id);
            return update ? { ...f, name: update.name } : f;
        }));
    }

    const sortFn = (a, b) => new Date(b.rawDate) - new Date(a.rawDate);
    
    setRealNews(allNewsItems.sort(sortFn));
    setRealVideos(allVideoItems.sort(sortFn));
    setRealPodcasts(allPodcastItems.sort(sortFn));
    
    setIsLoadingFeeds(false);
  };
  
  useEffect(() => {
    fetchFeeds();
  }, [userFeeds]);

  // FUNÇÕES GLOBAIS
  const handleToggleSave = (article) => {
    const exists = savedItems.find((i) => i.id === article.id);
    if (exists) { setSavedItems((prev) => prev.filter((i) => i.id !== article.id)); } 
    else { setSavedItems((prev) => [{ ...article, readProgress: 0, date: 'Agora', source: article.source || article.name }, ...prev]); }
  };

  const handleRemoveSavedItem = (idToRemove) => {
    setSavedItems((prevItems) => prevItems.filter((item) => item.id !== idToRemove));
  };

  const handleOpenArticle = (article) => {
    setSelectedArticle(article);
    if (!readHistory.includes(article.id)) setReadHistory((prev) => [...prev, article.id]);
  };

  const closeArticle = () => setSelectedArticle(null);
  const closeOutlet = () => setSelectedOutlet(null);
  const closeStory = () => setSelectedStory(null);
  const isMainViewReceded = !!selectedArticle || !!selectedOutlet || !!selectedStory;
  
  const navTimerRef = useRef(null);
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => setIsNavVisible(false), 4000);
  };
  
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (isNavVisible) {
        navTimerRef.current = setTimeout(() => {
          setIsNavVisible(false);
        }, 3000); 
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

  if (!mounted) return null; 
  return (
    <div className={`min-h-[100dvh] font-sans overflow-hidden selection:bg-blue-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 text-zinc-100' : 'bg-slate-100 text-zinc-900'}`}>      
      
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
                    newsData={realNews} 
                    onRefresh={fetchFeeds}
                    seenStoryIds={seenStoryIds} 
                    onMarkAsSeen={markStoryAsSeen}
                    apiKey={apiKey}
                />
            )}

            {activeTab === 'podcast' && (
                <PodcastTab 
                    isDarkMode={isDarkMode} 
                    podcastsData={realPodcasts} 
                    isLoading={isLoadingFeeds}
                    onPlayAudio={(pod) => {
                        if (pod.type === 'video') {
                            setPlayingAudio(null); 
                            setPlayingVideo(pod); 
                        } else {
                            setPlayingVideo(null);
                            setPlayingAudio(pod);
                        }
                    }}
                    savedItems={savedItems}
                    onToggleSave={handleToggleSave}
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
                    onPlayVideo={setPlayingVideo}
                    sourceFilter={sourceFilter}
                    setSourceFilter={setSourceFilter}
                    likedItems={likedItems}       // A lista de IDs curtidos
        onToggleLike={handleToggleLike} // A função para curtir
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
                    onPlayVideo={setPlayingVideo}
                    seenStoryIds={seenStoryIds}
                    onMarkAsSeen={markStoryAsSeen}
                />
            )}

            {activeTab === 'saved' && <SavedTab isDarkMode={isDarkMode} openArticle={handleOpenArticle} items={savedItems} onRemoveItem={handleRemoveSavedItem} onPlayVideo={setPlayingVideo}/>}

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
          />
      )}
      
      <ArticlePanel 
          key={selectedArticle?.id || 'empty-panel'} 
          article={selectedArticle} 
          feedItems={realNews.length > 0 ? realNews : FEED_NEWS} 
          isOpen={!!selectedArticle} 
          onClose={closeArticle} 
          onArticleChange={handleOpenArticle} 
          onToggleSave={handleToggleSave}
          isSaved={savedItems.some(i => i.id === selectedArticle?.id)}
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
          isDarkMode={isDarkMode} 
          onSaveToArchive={handleSaveToArchive}
      />
      
      {selectedOutlet && <OutletDetail outlet={selectedOutlet} onClose={closeOutlet} openArticle={handleOpenArticle} isDarkMode={isDarkMode} />}
      
      {selectedStory && <StoryOverlay story={selectedStory} onClose={closeStory} openArticle={handleOpenArticle} onMarkAsSeen={markStoryAsSeen}  />}

      {/* MODAL DE VÍDEO / PODCAST */}
      {playingVideo && (
          <VideoPlayerModal 
              video={playingVideo} 
              onClose={() => setPlayingVideo(null)} 
          />
      )}

      {/* PLAYER DE ÁUDIO GLOBAL */}
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

function StoryOverlay({ story, onClose, openArticle, onMarkAsSeen }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reinicia o índice se mudar de story
  useEffect(() => { setCurrentIndex(0); }, [story]);

  // EFEITO: Marcar como visto assim que abrir o Story
  useEffect(() => {
    if (story && story.id && onMarkAsSeen) {
        // Disparamos o "visto" imediatamente para o ID da notícia atual
        onMarkAsSeen(story.id); 
    }
  }, [story, onMarkAsSeen]);

  if (!story || !story.items || story.items.length === 0) return null;

  const handleNext = () => { 
    if (currentIndex < story.items.length - 1) setCurrentIndex(prev => prev + 1); 
    else onClose(); 
  };
  
  const handlePrev = () => { 
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1); 
  };

  const currentItem = story.items[currentIndex];

  const handleOpenFullArticle = () => {
      onClose(); // Fecha o overlay de story
      
      // Abre o painel de artigo completo
      openArticle({ 
        ...currentItem, 
        source: story.name, 
        category: 'Story',
        // Mudamos para 'rss' para garantir que o leitor carregue o site real
        origin: 'rss' 
      });
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col animate-in zoom-in-95 duration-300">
       
       {/* Container Central - TAMANHO MD:MAX-W-[60VH] RESTAURADO */}
       <div className="relative w-full h-full md:max-w-[60vh] md:aspect-[9/16] md:mx-auto md:my-auto md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/5">
        
        {/* Imagem de Fundo em tela cheia */}
        <div className="absolute inset-0">
            <img 
                src={currentItem.img} 
                className="w-full h-full object-cover" 
                alt="Fundo do Story" 
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Gradientes para melhorar legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        </div>

        {/* Barra de Progresso Superior e Cabeçalho */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-10 md:pt-8 z-30 space-y-4">
          
          {/* Indicador de "slides" */}
          <div className="flex gap-1.5 h-1">
              {story.items.map((item, idx) => (
                  <div key={idx} className="flex-1 bg-white/20 rounded-full overflow-hidden h-full">
                      <div 
                        className={`h-full bg-white transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-[progress_5s_linear]' : 'w-0'}`} 
                      />
                  </div>
              ))}
          </div>

          {/* Info do Canal e Botão Fechar */}
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/30 p-[2px] bg-black/20 backdrop-blur-md">
                      <img src={story.avatar} className="w-full h-full rounded-full object-cover" alt="Logo" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-white font-black text-sm drop-shadow-md tracking-tight">{story.name}</span>
                      <span className="text-zinc-300 text-[10px] font-bold drop-shadow-md opacity-90">{currentItem.time}</span>
                  </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2.5 text-white/80 hover:text-white backdrop-blur-xl rounded-full bg-white/10 border border-white/10 transition-transform active:scale-90"
              >
                  <X size={26} />
              </button>
          </div>
        </div>

        {/* Áreas de Toque Invisíveis para Navegação */}
        <div className="absolute inset-0 z-20 flex">
            <div className="w-[30%] h-full" onClick={handlePrev} />
            <div className="w-[70%] h-full" onClick={handleNext} />
        </div>

        {/* Setas de Apoio (Estilo Instagram) */}
        {currentIndex > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <ChevronLeft size={28} />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white transition-all"
        >
          <ChevronRight size={28} />
        </button>

        {/* Rodapé: Título e Botão de Ação */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-30 pb-12 md:pb-10 pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center">
                
                <h2 className="text-white text-2xl md:text-3xl font-black leading-tight mb-8 drop-shadow-2xl font-serif text-center line-clamp-5">
                    {currentItem.title}
                </h2>
                
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        handleOpenFullArticle(); 
                    }} 
                    className="group w-full bg-white text-black font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-zinc-100"
                >
                    <span className="text-sm uppercase tracking-widest">Ler Notícia Completa</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
       </div>

       {/* Fundo desfocado para telas grandes (Desktop) */}
       <div className="fixed inset-0 -z-10 bg-zinc-950/95 backdrop-blur-3xl md:block hidden" onClick={onClose} />
       
       <style jsx="true">{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
       `}</style>
    </div>
  );
}


// --- COMPONENTE: PAINEL DE ARTIGO (V18 - PERFORMANCE MÁXIMA & GPU) ---

// 1. Extraímos as funções auxiliares para fora do componente para não serem recriadas
const getBrandIdentity = (sourceName) => {
    const name = sourceName?.toLowerCase() || "";
    if (name.match(/times|post|folha|estadao|journal|herald|politico/)) {
        return { type: 'newspaper', fontHeader: "'Chomsky', 'UnifrakturMaguntia', serif", fontBody: "'Merriweather', serif", align: 'center' };
    }
    if (name.match(/verge|wired|tech|code|mac|tecmundo|canaltech|ign|g1|globo|uol/)) {
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
        'espn': '#CD122D'
    };
    for (const [key, color] of Object.entries(BRANDS)) if (name.includes(key)) return color;
    
    if (name.includes('money') || name.includes('finance')) return '#118C4F'; 
    if (name.includes('tech') || name.includes('code')) return '#3B82F6'; 
    if (name.includes('sport') || name.includes('futebol')) return '#16A34A'; 
    if (name.includes('pink') || name.includes('woman')) return '#EC4899'; 
    if (name.includes('auto') || name.includes('car')) return '#DC2626'; 

    const SAFE_PALETTE = ['#1E3A8A', '#B91C1C', '#0F766E', '#7C3AED', '#BE123C', '#C2410C', '#374151', '#000000'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return SAFE_PALETTE[Math.abs(hash) % SAFE_PALETTE.length];
};

// 2. Componentes de Visualização MEMOIZADOS (evita re-render desnecessário)
const MagicPremiumView = React.memo(({ article, readerContent, isDarkMode, fontSize }: any) => {
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

const AppleReaderView = React.memo(({ article, readerContent, isDarkMode, fontSize }: any) => {
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

const AIAnalysisView = React.memo(({ article, isDarkMode }: any) => (
      <div className="max-w-2xl mx-auto p-8 pt-12 animate-in fade-in slide-in-from-bottom-4 transform-gpu">
          <div className={`p-6 rounded-3xl border mb-8 ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200 shadow-xl'}`}>
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center"><BrainCircuit size={20} className="text-white" /></div><div><h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>NewsOS Intelligence</h3><p className="text-xs opacity-60">Análise IA</p></div></div>
              <div className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}><p className="mb-4">Este artigo discute <strong>{article.title}</strong>.</p><ul className="list-disc pl-5 space-y-2 mb-4 opacity-80"><li>Impacto no setor de {article.category}.</li><li>Reações do mercado.</li></ul></div>
          </div>
      </div>
));


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


// --- COMPONENTE: FEED NAVIGATOR (ISOLADO PARA PERFORMANCE) ---
// Este componente gerencia seu próprio estado de arrasto (drag) para não
// causar re-renderizações pesadas no ArticlePanel principal.

const FeedNavigator = React.memo(({ article, feedItems, onArticleChange, isDarkMode } : any) => {
    // Se não tiver artigo, não exibe nada
    if (!article) return null;

    const [isFeedListOpen, setIsFeedListOpen] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 140 : 500 });
    const [isBtnDragging, setIsBtnDragging] = useState(false);
    
    // Refs para lógica de arrasto sem re-render desnecessário durante o cálculo
    const dragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0, hasMoved: false });

    const relatedNews = feedItems || [];
    const currentIndex = relatedNews.findIndex(item => item && item.id === article.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex > -1 && currentIndex < relatedNews.length - 1;

    const handlePrev = (e) => { e.stopPropagation(); if (hasPrev) onArticleChange(relatedNews[currentIndex - 1]); };
    const handleNext = (e) => { e.stopPropagation(); if (hasNext) onArticleChange(relatedNews[currentIndex + 1]); };

    // Auto-scroll para o item ativo quando a lista abrir
    useEffect(() => {
        if (isFeedListOpen && article?.id) {
            setTimeout(() => {
                const activeElement = document.getElementById(`nav-item-${article.id}`);
                if (activeElement) {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [isFeedListOpen, article?.id]);

    // Lógica de Arrasto (Pointer Events para funcionar bem em Touch e Mouse)
    const handlePointerDown = (e) => { 
        if (e.target.closest('.no-drag')) return; 
        e.preventDefault(); // Impede scroll da página enquanto arrasta
        dragRef.current = { startX: e.clientX, startY: e.clientY, initialLeft: position.x, initialTop: position.y, hasMoved: false }; 
        setIsBtnDragging(true); 
        window.addEventListener('pointermove', handlePointerMoveDrag); 
        window.addEventListener('pointerup', handlePointerUpDrag); 
    };
    
    const handlePointerMoveDrag = (e) => { 
        const dx = e.clientX - dragRef.current.startX; 
        const dy = e.clientY - dragRef.current.startY; 
        // Pequena tolerância para diferenciar clique de arrasto
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.hasMoved = true; 
        setPosition({ x: dragRef.current.initialLeft + dx, y: dragRef.current.initialTop + dy }); 
    };
    
    const handlePointerUpDrag = () => { 
        setIsBtnDragging(false); 
        window.removeEventListener('pointermove', handlePointerMoveDrag); 
        window.removeEventListener('pointerup', handlePointerUpDrag); 
    };
    
    const handleToggle = () => { 
        if (!dragRef.current.hasMoved) setIsFeedListOpen(!isFeedListOpen); 
    };

    return (
        <>
          {/* Backdrop para fechar a lista ao clicar fora */}
          {isFeedListOpen && (<div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-[5001] transition-opacity" onClick={() => setIsFeedListOpen(false)} />)}
          
          <div 
            className="absolute z-[5002] w-80 transition-shadow duration-300 select-none" 
            style={{ left: position.x, top: position.y, cursor: isBtnDragging ? 'grabbing' : 'grab', touchAction: 'none' }} 
            onPointerDown={handlePointerDown}
          >
              {/* Lista de Notícias (Pop-up) */}
              <div className={`overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-300 border dark:border-white/10 no-drag absolute bottom-full left-0 w-full mb-2 origin-bottom ${isFeedListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                  <div className="p-3 border-b dark:border-white/10 flex justify-between items-center bg-transparent">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Navegação Rápida</span>
                      <button onClick={() => setIsFeedListOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><X size={14}/></button>
                  </div>
                  <div className="overflow-y-auto max-h-[40vh] p-1 space-y-1 custom-scrollbar" onPointerDown={(e) => e.stopPropagation()}>
                      {relatedNews.map((item) => (item && 
                          <div 
                              key={item.id} 
                              id={`nav-item-${item.id}`}
                              onClick={() => { onArticleChange(item); setIsFeedListOpen(false); }} 
                              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${item.id === article?.id ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                          >
                              <img src={item.img} className="w-10 h-10 rounded-lg object-cover bg-zinc-200 shrink-0" onError={(e) => e.target.style.display = 'none'} />
                              <div className="flex-1 min-w-0">
                                  <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${item.id === article?.id ? 'text-blue-600 dark:text-blue-400' : 'dark:text-zinc-200'}`}>{item.title}</h4>
                                  <span className="text-[9px] opacity-50 truncate block">{item.source}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* O Botão Flutuante (Cápsula) */}
              <div 
                  onClick={handleToggle} 
                  className={`flex items-center justify-between p-2 pl-2 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-transform active:scale-95 group select-none ${isDarkMode ? 'bg-zinc-900/90' : 'bg-black/80'}`}
              >
                  <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                      <div className="relative">
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-20"></div>
                          <img src={article.logo} className="relative w-8 h-8 rounded-full border border-white/20 object-cover bg-white" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider leading-none">{isBtnDragging ? 'Movendo...' : 'Lendo'}</span>
                          <span className="text-xs text-white font-bold truncate leading-tight max-w-[100px]">{article.source}</span>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-1 no-drag">
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={handlePrev} disabled={!hasPrev} className={`p-1.5 rounded-full transition-colors ${hasPrev ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronLeft size={18} /></button>
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={handleNext} disabled={!hasNext} className={`p-1.5 rounded-full transition-colors ${hasNext ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronRight size={18} /></button>
                      <div className="w-px h-4 bg-white/20 mx-1"></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFeedListOpen ? 'bg-white/20 text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                          {isBtnDragging ? <GripVertical size={14} /> : <LayoutGrid size={14} />}
                      </div>
                  </div>
              </div>
          </div>
        </>
    );
});


const ArticlePanel = React.memo(({ article, feedItems, isOpen, onClose, onArticleChange, onToggleSave, isSaved, isDarkMode, onSaveToArchive }: any) => {
  const [viewMode, setViewMode] = useState('web'); 
  const [iframeUrl, setIframeUrl] = useState(null);     
  const [readerContent, setReaderContent] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(19); 
  
  // Estados de Tradução
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState(null);

  const scrollContainerRef = useRef(null); 

  // --- LISTA NEGRA: SITES QUE PRECISAM DE BLOQUEIO TOTAL DE SCRIPTS ---
  // Adicione aqui sites que travam o app ou redirecionam sozinhos
  const PROBLEMATIC_DOMAINS = ['cnnbrasil.com.br', 'estadao.com.br'];

  // Verifica se o artigo atual é de um site problemático
  const isProblematicSite = useMemo(() => {
      if (!article?.link) return false;
      return PROBLEMATIC_DOMAINS.some(domain => article.link.includes(domain));
  }, [article?.link]);

  // --- FUNÇÃO DE LIMPEZA ADAPTATIVA ---
  const sanitizeHtml = (html) => {
      if (!html) return "";
      
      let clean = html;

      // 1. INJEÇÃO OBRIGATÓRIA (Para todos): Meta tags para imagens funcionarem
      // 'no-referrer' resolve o bloqueio de imagens da Globo/CidadeVerde
      const headInjection = `
        <base href="${article.link}" target="_blank">
        <meta name="referrer" content="no-referrer">
        <style>
            /* Esconde apenas anúncios e popups óbvios */
            .onetrust-banner, #onetrust-consent-sdk, .fc-ab-root, 
            [class*="cookie"], [class*="popup"], [class*="modal"] { display: none !important; }
            body { overflow-x: hidden; padding-bottom: 100px; -webkit-font-smoothing: antialiased; }
        </style>
      `;

      // 2. LIMPEZA AGRESSIVA (Apenas para sites problemáticos como CNN)
      if (isProblematicSite) {
          // Remove Scripts (Mata o cnnbrasil.js que trava)
          clean = clean.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
          // Remove Iframes de terceiros
          clean = clean.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "");
          
          // Força imagens a carregarem (Substitui Lazy Load por src normal)
          // Isso é necessário pq removemos o JS que faria isso
          clean = clean.replace(/data-src=/gi, 'src=');
          clean = clean.replace(/data-srcset=/gi, 'srcset=');
          clean = clean.replace(/loading="lazy"/gi, ''); 
      }

      if (clean.includes('<head>')) {
          return clean.replace('<head>', `<head>${headInjection}`);
      }
      return `${headInjection}${clean}`;
  };

  // Reset
  useEffect(() => {
      setIsTranslated(false);
      setTranslatedData(null);
      setIsTranslating(false);
  }, [article?.id]);

  const handleClosePanel = useCallback(() => {
      onClose(); 
      setTimeout(() => {
        if (iframeUrl) URL.revokeObjectURL(iframeUrl);
        setIframeUrl(null);
        setReaderContent(null);
        setViewMode('web');
        setIsTranslated(false); 
      }, 400); 
  }, [onClose, iframeUrl]);

  const handleOpenInBrowser = useCallback(() => {
    if (article?.link) window.open(article.link, '_blank');
  }, [article]);

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

  useEffect(() => {
    if (!isOpen || !article?.link) return;
    setIsLoading(true);
    const fetchContent = async () => {
        try {
            await new Promise(r => setTimeout(r, 10)); 
            const { data, error } = await supabase.functions.invoke('proxy-view', { body: { url: article.link } });
            if (error || !data) throw new Error();
            
            // Aplica a limpeza (Agressiva ou Leve dependendo do site)
            const cleanHtml = sanitizeHtml(data.html);
            
            const blob = new Blob([cleanHtml], { type: 'text/html' });
            setIframeUrl(URL.createObjectURL(blob));
            setReaderContent(data.reader);
        } catch (err) {
            setViewMode('magic');
        } finally {
            setIsLoading(false);
        }
    };
    fetchContent();
  }, [isOpen, article?.id, isProblematicSite]);

  const activeContent = (isTranslated && translatedData) ? translatedData : (readerContent || article);
  const safeContent = activeContent || {}; 
  const safeArticle = article || {};
  const activeArticleData = { ...safeArticle, ...safeContent };
  const activeReaderData = { content: safeContent.content, title: safeContent.title };

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) will-change-transform transform-gpu backface-hidden ${isDarkMode ? 'bg-zinc-950' : 'bg-white'} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="relative flex-1 w-full flex flex-col h-full overflow-hidden">
            
            {/* NAV BAR */}
            <div className={`flex-shrink-0 px-3 py-3 flex items-center justify-between border-b backdrop-blur-xl z-50 ${isDarkMode ? 'bg-zinc-950/90 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
                <button onClick={handleClosePanel} className={`flex items-center gap-1 py-2 pr-3 text-sm font-black transition active:scale-95 ${isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-black'}`}><ChevronLeft size={24} /> <span className="hidden md:inline">VOLTAR</span></button>
                <div className={`flex p-1 rounded-xl relative border shadow-sm ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
                    <div className={`absolute top-1 bottom-1 w-[48%] rounded-lg shadow-sm transition-all duration-300 ease-out ${viewMode === 'ai' ? 'left-[50%]' : 'left-1'} ${isDarkMode ? 'bg-zinc-800' : 'bg-white'} ${viewMode === 'magic' || viewMode === 'reader' ? 'opacity-0' : 'opacity-100'}`} />
                    <button onClick={() => setViewMode('web')} className={`relative px-4 md:px-6 py-1.5 text-[10px] font-black transition-colors z-10 flex items-center gap-2 ${viewMode === 'web' && viewMode !== 'magic' && viewMode !== 'reader' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-zinc-500'}`}>WEB VIEW</button>
                    <button onClick={() => setViewMode('ai')} className={`relative px-4 md:px-6 py-1.5 text-[10px] font-black transition-colors z-10 flex items-center gap-2 ${viewMode === 'ai' ? 'text-purple-500' : 'text-zinc-500'}`}><Sparkles size={10} /> AI ANALYSIS</button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setViewMode(viewMode === 'magic' ? 'web' : 'magic')} title="Reconstrução Editorial" className={`p-2.5 rounded-xl transition-all border active:scale-90 ${viewMode === 'magic' ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : (isDarkMode ? 'text-zinc-400 border-white/10 hover:bg-white/10' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100')}`}><Wand2 size={20} className={viewMode === 'magic' ? 'animate-pulse' : ''} /></button>
                    <button onClick={handleToggleTranslation} disabled={isTranslating} className={`p-2.5 rounded-xl transition-all border active:scale-90 relative overflow-hidden ${isTranslated ? 'bg-blue-600 text-white border-blue-500 shadow-md' : (isDarkMode ? 'text-zinc-400 border-white/10 hover:bg-white/10' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100')}`}>{isTranslating ? <Loader2 size={20} className="animate-spin" /> : <Languages size={20} />}</button>
                    <button onClick={() => setViewMode(viewMode === 'reader' ? 'web' : 'reader')} title="Modo Leitura Limpo" className={`p-2.5 rounded-xl transition border active:scale-90 ${viewMode === 'reader' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : (isDarkMode ? 'text-zinc-400 border-white/10 hover:bg-white/10' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100')}`}><ALargeSmall size={20} /></button>
                    <button onClick={handleOpenInBrowser} title="Abrir no Browser" className={`p-2.5 rounded-xl transition border active:scale-90 ${isDarkMode ? 'text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100 hover:text-blue-600'}`}><Globe size={20} /></button>
                    <button onClick={() => onToggleSave(article)} title="Salvar" className={`p-2.5 rounded-xl transition active:scale-75 ${isSaved ? 'text-purple-500 bg-purple-500/10' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'}`}><Bookmark size={22} fill={isSaved ? "currentColor" : "none"} /></button>
                </div>
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] z-[60] pointer-events-none overflow-hidden">{isLoading ? <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-[1px] animate-progress-aura" style={{ width: '100%' }} /> : <div className="h-full bg-transparent" />}</div>
            </div>

            {/* AREA DE CONTEUDO */}
            <div ref={scrollContainerRef} className={`flex-1 relative w-full h-full overflow-y-auto overscroll-contain transform-gpu ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
                {isLoading && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-inherit z-50"><Loader2 size={48} className="animate-spin text-purple-600 mb-4" /><p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Carregando...</p></div>)}
                
                {/* 
                   MODO WEB HÍBRIDO:
                   - Se isProblematicSite (CNN): Bloqueia scripts (allow-scripts REMOVIDO).
                   - Se Site Normal: Permite scripts (para imagens carregarem).
                */}
                {viewMode === 'web' && (
                    <div className="w-full h-full">
                        {iframeUrl ? (
                            <iframe 
                                src={iframeUrl} 
                                className="w-full h-full border-none" 
                                // AQUI ESTÁ A LÓGICA DE SANDBOX DINÂMICA
                                sandbox={isProblematicSite ? "allow-same-origin allow-popups" : "allow-same-origin allow-scripts allow-popups allow-forms"}
                                title="Web" 
                                loading="lazy"
                            />
                        ) : !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-zinc-500"><div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-6"><Globe size={40} className="opacity-40" /></div><h3 className="font-black text-xl mb-2">Web Indisponível</h3><p className="max-w-xs text-sm opacity-60 mb-6">Conteúdo bloqueado. Use os modos de leitura.</p><div className="flex gap-2"><button onClick={() => setViewMode('magic')} className="px-6 py-3 bg-purple-600 text-white rounded-full font-bold shadow-xl hover:bg-purple-500 transition active:scale-95 flex items-center gap-2"><Wand2 size={16}/> Varinha</button></div></div>
                        )}
                    </div>
                )}
                
                {viewMode === 'ai' && <AIAnalysisView article={activeArticleData} isDarkMode={isDarkMode} />}
                {viewMode === 'magic' && <MagicPremiumView article={activeArticleData} readerContent={activeReaderData} isDarkMode={isDarkMode} fontSize={fontSize} />}
                {viewMode === 'reader' && <AppleReaderView article={activeArticleData} readerContent={activeReaderData} isDarkMode={isDarkMode} fontSize={fontSize} />}
            </div>

            {(viewMode === 'magic' || viewMode === 'reader') && (
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
                    <button onClick={() => setFontSize(s => Math.max(14, s - 2))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition active:scale-90 bg-zinc-100 dark:bg-white/5"><Minus size={16}/></button>
                    <span className="text-xs font-black w-8 text-center">{fontSize}px</span>
                    <button onClick={() => setFontSize(s => Math.min(32, s + 2))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition active:scale-90 bg-zinc-100 dark:bg-white/5"><Plus size={16}/></button>
                </div>
            )}
            
            {isOpen && article && feedItems && (
                <FeedNavigator 
                    article={article} 
                    feedItems={feedItems} 
                    onArticleChange={onArticleChange} 
                    isDarkMode={isDarkMode} 
                />
            )}
            
        </div>
        <style jsx="true">{`@keyframes progress-aura { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } .animate-progress-aura { animation: progress-aura 1.5s infinite linear; } .backface-hidden { backface-visibility: hidden; }`}</style>
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

function SettingsModal({ onClose, isDarkMode, feeds, setFeeds, apiKey, setApiKey }) {
  const [activeTab, setActiveTab] = useState('sources');
  const [newUrl, setNewUrl] = useState('');
  
  // --- ESTADOS: TIPO (Novo) + DESTINO (Restaurado) ---
  const [feedType, setFeedType] = useState('news'); 
  const [targetFeed, setTargetFeed] = useState(true);
  const [targetBanca, setTargetBanca] = useState(false);
  
  const [isDiscovering, setIsDiscovering] = useState(false);
  const fileInputRef = useRef(null);

  // --- AUTO DESCOBERTA ---
  const handleAutoDiscover = async () => {
      if (!newUrl) return;
      setIsDiscovering(true);
      let urlToCheck = newUrl.trim();
      if (!urlToCheck.startsWith('http')) urlToCheck = 'https://' + urlToCheck;

      try {
          const { data, error } = await supabase.functions.invoke('parse-feed', {
              body: { url: urlToCheck, type: 'discover' }
          });

          if (error || !data || !data.url) throw new Error("Feed não encontrado");

          setNewUrl(data.url);
          
          if (data.url.includes('youtube') || data.url.includes('youtu.be')) {
              setFeedType('youtube');
          } else if (data.url.includes('pod') || data.url.includes('cast')) {
              setFeedType('podcast');
          }
          
          alert(`Sucesso! Feed encontrado: ${data.url}`);
      } catch (err) {
          console.error(err);
          alert("Não foi possível encontrar um feed RSS automático.");
      } finally {
          setIsDiscovering(false);
      }
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
    
    if (!targetFeed && !targetBanca) {
        alert("Selecione onde exibir (Feed ou Banca).");
        return;
    }

    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith('http')) formattedUrl = 'https://' + formattedUrl;

    const newFeed = { 
        id: Date.now(), 
        name: 'Nova Fonte', 
        url: formattedUrl,
        type: feedType, 
        category: feedType === 'podcast' ? 'Podcast' : 'Geral',
        display: { feed: targetFeed, banca: targetBanca }
    };
    
    setFeeds(prev => [...prev, newFeed]);
    setNewUrl('');
    setTargetFeed(true);
    setTargetBanca(false);
    setFeedType('news');
  };

  const removeFeed = (id) => setFeeds(feeds.filter(f => f.id !== id));

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
        
        {/* HEADER */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-lg">Configurações</h2>
            <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* --- AQUI ESTAVA FALTANDO: A BARRA DE NAVEGAÇÃO ENTRE ABAS --- */}
        <div className="flex p-2 gap-2 border-b border-white/5 bg-black/5 dark:bg-white/5">
            <button 
                onClick={() => setActiveTab('sources')} 
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'sources' ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
                Minhas Fontes
            </button>
            <button 
                onClick={() => setActiveTab('api')} 
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'api' ? 'bg-purple-600 text-white' : 'opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
                <BrainCircuit size={14}/> Inteligência IA
            </button>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {/* CONTEÚDO DA ABA FONTES */}
            {activeTab === 'sources' && (
                <div className="space-y-6">
                    <div className="flex gap-2 mb-2">
                        <input type="file" accept=".opml,.xml" ref={fileInputRef} onChange={handleImportOPML} className="hidden" />
                        <button onClick={handleImportClick} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-zinc-300 dark:hover:bg-zinc-700 transition flex items-center justify-center gap-2">
                            <Layers size={14}/> Importar OPML
                        </button>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3 block">Adicionar Fonte</label>
                        
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={newUrl} 
                                onChange={(e) => setNewUrl(e.target.value)} 
                                placeholder="Link RSS (Site ou YouTube)" 
                                className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'}`} 
                            />
                            <button onClick={handleAutoDiscover} disabled={isDiscovering || !newUrl} className={`p-2 rounded-lg border w-10 flex items-center justify-center ${isDarkMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                {isDiscovering ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase opacity-50 mb-1.5 block">Tipo de Conteúdo</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setFeedType('news')} className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${feedType === 'news' ? 'bg-blue-600 border-blue-500 text-white' : 'opacity-50 hover:opacity-100'}`}>
                                    <FileText size={16}/> Notícia
                                </button>
                                <button onClick={() => setFeedType('youtube')} className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${feedType === 'youtube' ? 'bg-red-600 border-red-500 text-white' : 'opacity-50 hover:opacity-100'}`}>
                                    <Youtube size={16}/> Vídeo
                                </button>
                                <button onClick={() => setFeedType('podcast')} className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${feedType === 'podcast' ? 'bg-orange-500 border-orange-400 text-white' : 'opacity-50 hover:opacity-100'}`}>
                                    <Mic size={16}/> Podcast
                                </button>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase opacity-50 mb-1.5 block">Onde Exibir?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div onClick={() => setTargetFeed(!targetFeed)} className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all select-none ${targetFeed ? 'bg-zinc-800 border-zinc-600 text-white shadow-inner' : (isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400')}`}>
                                    <Rss size={16} /> <span className="font-bold text-sm">No Feed</span> {targetFeed && <CheckCircle size={16} className="ml-auto text-green-500" />}
                                </div>
                                <div onClick={() => setTargetBanca(!targetBanca)} className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all select-none ${targetBanca ? 'bg-zinc-800 border-zinc-600 text-white shadow-inner' : (isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400')}`}>
                                    <LayoutGrid size={16} /> <span className="font-bold text-sm">Na Banca</span> {targetBanca && <CheckCircle size={16} className="ml-auto text-green-500" />}
                                </div>
                            </div>
                        </div>

                        <button onClick={handleAddFeed} disabled={!newUrl || (!targetFeed && !targetBanca)} className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold text-sm transition hover:bg-purple-500 disabled:opacity-50">Adicionar Fonte</button>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">Fontes Ativas</label>
                        <div className="space-y-2">
                            {feeds.map(feed => (
                                <div key={feed.id} className={`flex justify-between items-center p-3 rounded-lg border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        {feed.type === 'podcast' ? <Mic size={14} className="text-orange-500"/> : feed.type === 'youtube' ? <Youtube size={14} className="text-red-500"/> : <Rss size={14} className="text-blue-500"/>}
                                        <div className="min-w-0">
                                            <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{feed.name}</p>
                                            <div className="flex gap-2 text-[9px] opacity-60"><span>{feed.type === 'podcast' ? 'Podcast' : feed.type === 'youtube' ? 'Canal' : 'Site'}</span></div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFeed(feed.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* CONTEÚDO DA ABA API (Melhorei o visual aqui também) */}
            {activeTab === 'api' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                     <div className={`p-6 rounded-3xl text-center ${isDarkMode ? 'bg-gradient-to-b from-purple-900/50 to-zinc-900 border border-purple-500/20' : 'bg-gradient-to-b from-purple-50 to-white border border-purple-100'}`}>
                        <div className="w-16 h-16 mx-auto bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                            <Sparkles size={32} className="text-white animate-pulse"/>
                        </div>
                        <h3 className="text-xl font-black mb-2">Google Gemini AI</h3>
                        <p className="text-sm opacity-70 mb-6 leading-relaxed">
                            Para ativar o <strong>Smart Digest</strong> e a <strong>Análise de Notícias</strong>, você precisa de uma chave gratuita do Google AI Studio.
                        </p>
                        
                        <div className="text-left mb-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">Sua API Key</label>
                            <div className="relative mt-1">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"><BrainCircuit size={16}/></div>
                                <input 
                                    type="text" 
                                    value={apiKey} 
                                    onChange={(e) => setApiKey(e.target.value)} 
                                    placeholder="Cole sua chave aqui (AIza...)" 
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border font-mono text-sm outline-none transition-all ${isDarkMode ? 'bg-black/50 border-purple-500/30 focus:border-purple-500 text-purple-300' : 'bg-white border-purple-200 focus:border-purple-500 text-purple-700 shadow-inner'}`} 
                                />
                            </div>
                        </div>

                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-purple-500 hover:underline">
                            Obter chave no Google AI Studio <ArrowRight size={12}/>
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
