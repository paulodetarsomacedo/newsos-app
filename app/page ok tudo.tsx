"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js'

// Coloque suas chaves reais aqui
const supabase = createClient('https://usnhoviysiaeqcwvnhcd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbmhvdml5c2lhZXFjd3ZuaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjQ1NjksImV4cCI6MjA4MTM0MDU2OX0.7K1qfEeRZ7qrJBf0noIZJ6fkT4OMKIljgwd6r2MLUXk')
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, Play, Pause, 
  Maximize2, X, Globe, ArrowRight,
  Sun, Moon, TrendingUp, TrendingDown, CloudSun, CloudMoon, MapPin, 
  Clock, DollarSign, Bitcoin, Activity, Zap, GripVertical,
  FileText, CheckCircle, Trash2, BrainCircuit, Euro, 
  Headphones, Search, ChevronRight, Rss, Calendar as CalendarIcon, Loader2, RefreshCw, Music, Disc3, SkipBack, SkipForward, Type, ALargeSmall, Minus, Plus, PenTool, Highlighter, StickyNote, Save, Archive, Pencil, Eraser, Undo, Redo, Mail, Copy, Check, MagicWand
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
const YOUTUBE_CATEGORIES = ['Tudo', 'Tech', 'Finanças', 'Ciência', 'Música'];

const MUSIC_FEED = [
  { id: 'm1-1440854284', title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/9a/14/d6/9a14d61a-5153-e30d-6394-1a3556218132/mzaf_13114949113889159505.plus.aac.p.m4a' },
  { id: 'm2-1440836511', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', cover: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=600&q=80', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/9c/93/63/9c936306-a06d-411a-8535-b895ded538a2/mzaf_14110368369282348425.plus.aac.p.m4a' },
  { id: 'm3-1440650800', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&q=80', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/39/3a/57/393a5702-8959-8693-782a-502a559ad6d3/mzaf_1642398598463833714.plus.aac.p.m4a' },
  { id: 'm4-1440828749', title: 'Instant Crush', artist: 'Daft Punk', album: 'RAM', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/33/08/42/330842c4-754c-b476-6512-19e487103f19/mzaf_10292534563428981584.plus.aac.p.m4a' },
];


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


// --- HEADER "AI COMMAND CENTER" (MODERNO) ---


function HeaderDashboard({ isDarkMode, onOpenSettings }) {
  const [aiStatus, setAiStatus] = useState("Atualizando feed em tempo real...");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [data, setData] = useState({});

  // --- LÓGICA DE DATA, ARRASTAR E CALENDÁRIO ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

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
          setAiStatus("Atualizando feed em tempo real...");
      } else {
          setAiStatus(`Arquivos de ${newDate.toLocaleDateString()}...`);
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
           <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-3">
                 <div onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-lg">
                    <img src="https://ui-avatars.com/api/?name=User&background=000&color=fff" className="rounded-full w-full h-full border-2 border-black" alt="User" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-[10px] font-black uppercase text-white/40 tracking-[0.15em] leading-none mb-1">System Status</h1>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                       <span className="text-xs font-bold text-white tracking-wide">{aiStatus}</span>
                    </div>
                 </div>
              </div>

              {/* BOTÃO GATILHO */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`
                    relative z-[60] p-2.5 rounded-2xl transition-all duration-500 flex items-center gap-2 border
                    ${isSearchOpen 
                        ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-90' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 active:scale-95'}
                `}
              >
                {isSearchOpen ? <X size={18} /> : <Sparkles size={18} className="text-purple-400 animate-pulse" />}
                {!isSearchOpen && <span className="text-[10px] font-black uppercase tracking-widest px-1">Ask AI</span>}
              </button>
           </div>

           {/* LINHA 2: BARRA DE PESQUISA COM EFEITO "MORPH" DE EXPANSÃO */}
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
        flex items-center
        overflow-x-auto scrollbar-hide snap-x
        max-w-[95%] 
        rounded-full border gap-1 
        p-0.5             /* Respiro para o efeito 3D aparecer */
        h-10               /* Altura estabilizada */
        shadow-sm
        backdrop-blur-xl
        ${isDarkMode 
          ? `bg-black/60 ${borderColor.dark}`
          : `bg-white/70 ${borderColor.light}`
        }
      `}>
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onChange(cat)} 
              className={`
                relative px-6 rounded-full text-sm transition-all duration-300 whitespace-nowrap snap-center min-w-fit font-black
                h-full flex items-center justify-center
                
                ${isActive 
                  ? `
                    /* --- EFEITO 3D NA PÍLULA ATIVA --- */
                    bg-gradient-to-b from-[#6d28d9] to-[#4c1d95] /* Gradiente para dar curvatura */
                    text-white
                    
                    /* Borda multidirecional: Luz em cima, sombra embaixo */
                    border-t border-t-white/30 
                    border-b-2 border-b-black/40
                    border-x border-x-white/10
                    
                    /* Sombras combinadas: Sombra externa + Brilho interno no topo */
                    shadow-[0_4px_12px_rgba(76,29,149,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]
                    
                    /* Feedback de profundidade ao clicar */
                    active:translate-y-[1px] active:shadow-inner active:border-b
                    `
                  : (isDarkMode 
                      ? 'text-zinc-900 hover:text-white hover:bg-white/5' 
                      : 'text-zinc-600 hover:text-blue-600 hover:bg-black/5')
                }
              `}
            >
              {/* Leve sombra no texto para profundidade extra */}
              <span className={isActive ? "drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" : ""}>
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

// --- TAB: FEED (COMPLETA E FUNCIONAL) ---

const NewsCard = React.memo(({ news, isSelected, isRead, isSaved, isDarkMode, onClick, onToggleSave }) => {
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
                        {/* LOGO PEQUENO */}
                        <div className={`relative z-20 w-8 h-8 rounded-lg overflow-hidden border shadow-sm shrink-0 ${isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'}`}>
                            <img src={news.logo} className="w-full h-full object-cover" alt="" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${news.source}&background=random`}/>
                        </div>
                        {/* NOME FONTE */}
                        <div className={`relative z-10 -ml-3 pl-4 pr-3 py-1 rounded-lg border-y border-r border-l-0 text-[10px] font-bold tracking-tight uppercase flex items-center h-7.5 mt-0.6 ${isDarkMode ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-white/80 border-zinc-300 text-zinc-600'}`}>
                            {news.source}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isRead && !isSelected && (
                         <div className="flex items-center gap-1 bg-zinc-500/10 px-1.5 py-0.5 rounded text-zinc-500" title="Notícia já lida">
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

      {/* RODAPÉ DO CARD */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border backdrop-blur-md select-none ${isDarkMode ? 'bg-black/20 border-white/5 text-zinc-400' : 'bg-white/40 border-black/5 text-zinc-500'}`}>
              <Clock size={10} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{news.readTime || '3 min'}</span>
          </div>

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
    prev.isDarkMode === next.isDarkMode
  );
});


function FeedTab({ openArticle, isDarkMode, selectedArticleId, savedItems, onToggleSave, readHistory, newsData, isLoading }) {
  const [category, setCategory] = useState('Tudo');
  const [sourceFilter, setSourceFilter] = useState('all'); 

  // --- ESTADOS DO PULL-TO-REFRESH ---
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- LÓGICA DE DADOS REAIS VS MOCKADOS ---
  const safeNews = (newsData && newsData.length > 0) ? newsData : FEED_NEWS;

  // Lógica de Filtragem
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
        // Simulação
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
        {displayedNews.length === 0 && (
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
            />
        ))}
      </div>
    </div>
  );
}


// --- OUTROS COMPONENTES E FILTROS ---

function YouTubeVerticalFilter({ categories, active, onChange, isDarkMode }) {
  // Remove "Música" da lista padrão para não duplicar
  const standardCategories = categories.filter(c => c !== 'Música');

  return (
    // Container Wrapper (Posiciona tudo na esquerda)
    <div className="fixed left-2 top-[260px] z-30 flex flex-col items-center gap-4 pointer-events-none">
      
      {/* --- 1. A BARRA PRINCIPAL (Categorias + Busca) --- */}
      <div className={`
        pointer-events-auto flex flex-col gap-2 p-1.5 rounded-2xl border shadow-xl backdrop-blur-xl transition-colors duration-300 items-center
        ${isDarkMode ? 'bg-zinc-900/80 border-red-900/30' : 'bg-white/80 border-red-100'}
      `}>
        {/* Lista de Categorias de Texto */}
        {standardCategories.map((cat) => {
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

        {/* Barra de Pesquisa (MANTIDA AQUI DENTRO) */}
        <div className="relative w-8 h-32 flex items-center justify-center py-2">
            <div className={`absolute flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-300 w-32 
                ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white focus-within:border-red-500' : 'bg-zinc-100 border-zinc-200 text-zinc-800 focus-within:border-red-500'}
            `} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center' }}>
                <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider w-full placeholder:text-zinc-500" />
                <Search size={14} className={`flex-shrink-0 rotate-90 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </div>
        </div>
      </div>

      {/* --- 2. BOTÃO DE MÚSICA (SEPARADO E ABAIXO) --- */}
      <button
          onClick={() => onChange('Música')}
          className={`
              pointer-events-auto
              w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group
              border shadow-xl backdrop-blur-xl
              ${active === 'Música' 
                  ? 'bg-rose-600 border-rose-500 text-white shadow-rose-500/40 scale-110' 
                  : (isDarkMode ? 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:border-rose-500/50' : 'bg-white/80 border-red-100 text-zinc-500 hover:text-rose-600 hover:border-rose-200')}
          `}
          title="YouTube Music"
      >
          {/* Ícone anima levemente no hover */}
          {active === 'Música' 
            ? <Disc3 size={24} className="animate-spin-slow" /> 
            : <Music size={24} className="group-hover:scale-110 transition-transform" />}
      </button>

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


// --- ABA YOUTUBE (VERSÃO 100% COMPLETA, FINAL E CORRIGIDA) ---

function YouTubeTab({ isDarkMode, openStory, onToggleSave, savedItems, realVideos, isLoading }) {
  // --- ESTADOS DE FILTRO E MÚSICA ---
  const [category, setCategory] = useState('Tudo');
  const [musicQuery, setMusicQuery] = useState('');
  const [musicList, setMusicList] = useState(MUSIC_FEED);
  const [searchStatus, setSearchStatus] = useState('idle');

  // --- ESTADOS DO PLAYER DE ÁUDIO (MÚSICA) ---
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // --- ESTADO DO PLAYER DE VÍDEO (YOUTUBE) ---
  const [playingVideo, setPlayingVideo] = useState(null);

  // --- LÓGICA DE DADOS (VÍDEOS) ---
  const safeVideos = (realVideos && realVideos.length > 0) ? realVideos : YOUTUBE_FEED;
  const displayedVideos = (category === 'Tudo' || category === 'Música') 
      ? safeVideos 
      : safeVideos.filter(v => v.category === category || v.source === category);

  // Helper para extrair ID do YouTube
  const getVideoId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url?.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  // --- EFEITOS DO PLAYER DE MÚSICA ---
  useEffect(() => {
    if (audioRef.current && currentSong?.previewUrl) {
      audioRef.current.src = currentSong.previewUrl;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => setIsPlaying(true)).catch(error => { console.error("Playback impedido:", error); setIsPlaying(false); });
      }
    }
  }, [currentSong]);

  const togglePlay = () => { if (!audioRef.current) return; isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); };
  const handleNext = () => { if (!currentSong) return; const currentIndex = musicList.findIndex(m => m.id === currentSong.id); const nextIndex = (currentIndex + 1) % musicList.length; setCurrentSong(musicList[nextIndex]); };
  const handlePrev = () => { if (!currentSong) return; const currentIndex = musicList.findIndex(m => m.id === currentSong.id); const prevIndex = (currentIndex - 1 + musicList.length) % musicList.length; setCurrentSong(musicList[prevIndex]); };
  const handleSeek = (e) => { if (!audioRef.current) return; const newTime = (Number(e.target.value) / 100) * duration; audioRef.current.currentTime = newTime; };
  const formatTime = (time) => { if (isNaN(time) || time === 0) return "0:00"; const min = Math.floor(time / 60); const sec = Math.floor(time % 60); return `${min}:${sec < 10 ? '0' + sec : sec}`; };

  // Busca API iTunes
  const searchMusic = async (e) => {
    if (e.key === 'Enter' && musicQuery.trim()) {
        setSearchStatus('loading');
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(musicQuery)}&media=music&entity=song&limit=50`);
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            const formattedMusic = data.results.map(item => ({ id: String(item.trackId), title: item.trackName, artist: item.artistName, album: item.collectionName || 'Single', cover: item.artworkUrl100.replace('100x100bb', '600x600bb'), previewUrl: item.previewUrl }));
            setMusicList(formattedMusic);
            setSearchStatus('success');
        } catch (error) {
            console.error("Search Error:", error);
            setSearchStatus('error');
        }
    }
  };

  // Mock Stories
  const ytStories = [
    { id: 1, name: 'MKBHD', avatar: 'https://ui-avatars.com/api/?name=MK&background=000&color=fff', items: [{ id: 101, img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', title: 'New Studio Tour!', time: '10m' }] },
    { id: 2, name: 'MrBeast', avatar: 'https://ui-avatars.com/api/?name=MB&background=2980b9&color=fff', items: [{ id: 102, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', title: 'Challenge', time: '1h' }] },
  ];

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in px-2 pl-16 relative min-h-screen">
      
      {/* Audio Element Invisível */}
      <audio ref={audioRef} onTimeUpdate={() => { if (!audioRef.current) return; setCurrentTime(audioRef.current.currentTime); setProgress(audioRef.current.duration ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0); }} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={handleNext} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      {/* Filtro Lateral */}
      <YouTubeVerticalFilter categories={YOUTUBE_CATEGORIES} active={category} onChange={setCategory} isDarkMode={isDarkMode} />
      
      {/* Stories (Apenas se não for Música) */}
      {category !== 'Música' && (
        <div className="flex space-x-6 overflow-x-auto pb-2 scrollbar-hide snap-x items-center">
          {ytStories.map((story) => (
            <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group">
              <div className="relative w-[76px] h-[76px] rounded-full p-[3px] bg-gradient-to-tr from-red-600 to-orange-500 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950' : 'border-white'}`}><img src={story.avatar} className="w-full h-full object-cover" /></div>
              </div>
              <span className={`text-[11px] font-semibold transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`}>{story.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* --- SEÇÃO DE MÚSICA --- */}
      {category === 'Música' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="flex flex-col gap-4 mb-6 px-1">
              <div className="flex items-center gap-2 opacity-80"><Music size={18} className="text-purple-500" /><h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{musicList === MUSIC_FEED ? 'Mixagens para você' : `Resultados da busca`}</h3></div>
              <div className={`relative flex items-center px-4 py-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 focus-within:border-purple-500' : 'bg-white border-zinc-200 focus-within:border-purple-500'}`}>
                  <Search size={18} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                  <input type="text" placeholder="Pesquise artistas, músicas..." className="w-full bg-transparent outline-none ml-3 text-sm font-medium disabled:opacity-50" value={musicQuery} onChange={(e) => setMusicQuery(e.target.value)} onKeyDown={searchMusic} disabled={searchStatus === 'loading'}/>
                  {searchStatus === 'loading' && <Loader2 size={18} className="animate-spin text-purple-500" />}
              </div>
          </div>
          {searchStatus === 'error' && (<div className="text-center py-10 text-red-500"><p>Ocorreu um erro ao buscar. Tente novamente.</p></div>)}
          {searchStatus === 'success' && musicList.length === 0 && (<div className="text-center py-10 opacity-60"><p>Nenhum resultado encontrado para "{musicQuery}".</p></div>)}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {musicList.map((music) => {
                  const isSaved = savedItems?.some(i => i.id === music.id);
                  const isActive = currentSong?.id === music.id;
                  return (
                      <div key={music.id} className={`group relative flex flex-col gap-3 p-3 rounded-2xl border transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:shadow-lg'}`}>
                          <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg bg-zinc-800">
                              <img src={music.cover} className={`w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-110 opacity-60' : 'group-hover:scale-110'}`} />
                              <div onClick={() => setCurrentSong(music)} className={`absolute inset-0 flex items-center justify-center backdrop-blur-[1px] cursor-pointer transition-opacity ${isActive ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100 bg-black/40'}`}>{isActive ? (<div className="flex gap-1 items-end h-6"><div className="w-1 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]" style={{height: '60%'}}></div><div className="w-1 bg-white animate-[music-bar_0.8s_ease-in-out_infinite]" style={{height: '100%'}}></div><div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite]" style={{height: '40%'}}></div></div>) : (<div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl scale-0 group-hover:scale-100 transition-transform duration-300"><Play size={20} fill="black" className="ml-1"/></div>)}</div>
                              <button onClick={(e) => { e.stopPropagation(); if (onToggleSave) onToggleSave({ ...music, img: music.cover, source: music.artist, category: 'Música', date: 'Agora' }); }} className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 ${isSaved ? 'bg-purple-600 text-white shadow-lg' : 'bg-black/30 text-white hover:bg-black/50'}`}><Bookmark size={14} fill={isSaved ? "currentColor" : "none"} /></button>
                          </div>
                          <div><h4 className={`font-bold text-sm leading-tight line-clamp-1 ${isActive ? 'text-purple-500' : (isDarkMode ? 'text-white' : 'text-zinc-900')}`}>{music.title}</h4><div className="flex items-center gap-1 mt-1"><span className={`text-xs truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{music.artist}</span></div></div>
                      </div>
                  );
              })}
          </div>
        </div>
      ) : (
        // --- SEÇÃO DE VÍDEOS (YOUTUBE) ---
        <div className="grid md:grid-cols-1 gap-10">
          {isLoading && safeVideos === YOUTUBE_FEED && (
            <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-50">
                <Loader2 size={30} className="animate-spin mb-2"/>
                <p>Atualizando feed do YouTube...</p>
            </div>
          )}

          {displayedVideos.map((video) => {
              const isSaved = savedItems?.some(i => i.id === video.id);
              return (
                  <div 
                    key={video.id} 
                    onClick={() => setPlayingVideo(video)} // Abre o Modal
                    className={`group relative  md:w-[520px] rounded-3xl overflow-hidden border shadow-lg hover:shadow-xl transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`}
                  >
                      <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-orange-600 p-[2px]">
                                  <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                                      <img 
                                        src={video.logo || video.img} 
                                        className="w-full h-full object-cover rounded-full" 
                                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${video.source}&rounded=true`} 
                                      />
                                  </div>
                              </div>
                              <div>
                                  <span className={`text-lx font-bold block ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{video.channel || video.source}</span>
                                  <span className="text-lx uppercase font-bold text-zinc-500">{video.time || 'YouTube'}</span>
                              </div>
                          </div>
                          <MoreHorizontal size={20} className="text-zinc-400" />
                      </div>
                      <div className={`relative aspect-video overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                          <img src={video.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full"><Play size={48} className="text-white drop-shadow-lg fill-white/20" /></div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); if (onToggleSave) onToggleSave({ ...video, source: video.channel, category: 'Vídeo', date: 'Agora' }); }} className={`absolute bottom-3 right-3 z-20 p-2.5 rounded-full backdrop-blur-xl shadow-xl transition-all active:scale-90 ${isSaved ? 'bg-purple-600 text-white' : 'bg-black/50 text-white'}`}><Bookmark size={18} fill={isSaved ? "currentColor" : "none"} /></button>
                      </div>
                      <div className="px-5 py-4"><h3 className={`text-lg font-bold leading-tight mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{video.title}</h3></div>
                  </div>
              )
          })}
        </div>
      )}

      {/* --- MODAL PLAYER DE VÍDEO --- */}
          {playingVideo && (
        <div 
            className="fixed inset-0 z-[50000] bg-black w-screen h-[100dvh] flex flex-col justify-center items-center overflow-hidden touch-none"
            // touch-none: Impede que o usuário "role" a página de fundo sem querer
        >
            
            {/* BOTÃO FECHAR */}
            <button 
                onClick={() => setPlayingVideo(null)} 
                className="absolute top-6 right-6 z-[50001] p-3 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md rounded-full text-white border border-white/10 transition-transform active:scale-90"
            >
                <X size={28} />
            </button>
            
            {/* CONTAINER DO VÍDEO */}
            <div className="w-full h-full flex items-center justify-center bg-black">
                {(() => {
                    const finalId = playingVideo.videoId || getVideoId(playingVideo.link);
                    
                    if (!finalId) {
                        return (
                            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                                <p>Vídeo não encontrado.</p>
                                <button onClick={() => setPlayingVideo(null)} className="px-4 py-2 bg-zinc-800 rounded-full">Fechar</button>
                            </div>
                        )
                    }

                    return (
                        <iframe 
                            src={`https://www.youtube.com/embed/${finalId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`} 
                            title={playingVideo.title}
                            className="w-full h-full"
                            style={{ width: '100%', height: '100%' }}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            webkitallowfullscreen="true"
                            mozallowfullscreen="true"
                        />
                    );
                })()}
            </div>
            
            {/* TÍTULO NO RODAPÉ */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-[50001]">
                 <h2 className="text-white font-bold text-lg text-center drop-shadow-md line-clamp-2 px-4">
                    {playingVideo.title}
                 </h2>
            </div>
        </div>
      )}



      {/* --- PLAYER FLUTUANTE DE MÚSICA --- */}
      {currentSong && (
        <div className={`fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl border flex flex-col gap-2 transition-all animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-black/80 border-white/10 text-white' : 'bg-white/90 border-zinc-200 text-zinc-900'}`}>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shadow-md flex-shrink-0 relative"><img src={currentSong.cover} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0"><h4 className="font-bold text-sm truncate leading-tight">{currentSong.title}</h4><p className={`text-xs truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{currentSong.artist}</p></div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full"><SkipBack size={20} /></button>
                    <button onClick={togglePlay} className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-500 active:scale-95 transition">{isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1"/>}</button>
                    <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full"><SkipForward size={20} /></button>
                </div>
            </div>
            <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] w-8 text-right font-mono opacity-60">{formatTime(currentTime)}</span>
                <input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} className="flex-1 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" />
                <span className="text-[10px] w-8 font-mono opacity-60">{formatTime(duration)}</span>
            </div>
        </div>
      )}

      <style>{`@keyframes music-bar { 0%, 100% { height: 40%; } 50% { height: 100%; } }`}</style>
    </div>
  );
}


function HappeningTab({ openArticle, openStory, isDarkMode, newsData, onRefresh, seenStoryIds = [] }) {
  const [isPodcastOpen, setIsPodcastOpen] = useState(false);
  
  // --- ESTADOS DO PULL-TO-REFRESH ---
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- LÓGICA DE STORIES (APENAS A ÚLTIMA DE CADA FONTE + FILTRO DE VISTOS) ---
  const storiesToDisplay = useMemo(() => {
    // Se não houver dados reais, não mostramos os mocks para não confundir o usuário
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
            
            // REGRA: Se foi visto, ele não entra na lista (ele some)
            // Ele só reaparecerá quando o ID mudar (nova notícia)
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
        
        if (onRefresh) {
            await onRefresh();
        }
        
        // Mantém o ícone visível por 1 segundo após o término
        setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
        }, 1000);
    } else {
        setPullDistance(0);
    }
    setStartY(0);
  };

  // Dados para os cards estáticos
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
                    {/* CÍRCULO DINÂMICO: Vermelho/Rosa se novo, Azul se lido (embora o filtro remova os lidos) */}
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

      {/* --- CARDS ORIGINAIS --- */}
      <div className="px-1">
        <div className={`relative overflow-hidden rounded-[32px] border p-8 shadow-2xl transition-all hover:scale-[1.01] duration-500 ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-gradient-to-br from-zinc-900 to-black text-white border-transparent'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 blur-[90px]" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-blue-400 text-black p-2 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)]"><Sparkles size={20} fill="black" /></div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">Resumo do Momento</span>
          </div>
          <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">Mercado global reage: Pacote fiscal e avanços em IA dominam a pauta.</h2>
              <p className="text-zinc-300 text-base leading-relaxed mb-8 font-serif">Nossa IA processou {newsData?.length || 0} fontes para criar este resumo.</p>
              <button onClick={() => openArticle({ title: 'Briefing IA', source: 'NewsOS Intelligence', img: null, origin: 'rss' })} className="py-3.5 px-8 bg-white text-black font-bold text-sm rounded-full hover:bg-zinc-200 transition active:scale-[0.98] flex items-center gap-2">Ler Briefing Completo <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>

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
    { label: 'Músicas', icon: Music },
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

  // ESTADO DE FEEDS
  const [userFeeds, setUserFeeds] = useState([
      { id: 1, name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', display: { feed: true } },
      { id: 2, name: 'G1', url: 'https://g1.globo.com/dynamo/rss2.xml', category: 'Local', display: { feed: true } }
  ]);
  const [realNews, setRealNews] = useState([]); 
  const [realVideos, setRealVideos] = useState([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);

  const [savedItems, setSavedItems] = useState(SAVED_ITEMS);
  const [readHistory, setReadHistory] = useState([]);

 const fetchFeeds = async () => {
    // SE NÃO TIVER FONTES, LIMPA AS NOTÍCIAS E VÍDEOS!
    if (userFeeds.length === 0) {
        setRealNews([]);
        setRealVideos([]);
        return;
    }

    setIsLoadingFeeds(true);
    let allNewsItems = [];
    let allVideoItems = [];
    let feedsThatNeedUpdate = []; 

    const promises = userFeeds.map(async (feed) => {
        if (!feed.display?.feed && !feed.display?.banca && !feed.url) return;

        try {
            const { data, error } = await supabase.functions.invoke('parse-feed', {
                body: { url: feed.url }
            });

            if (error || (data && data.error)) return;
            if (!data || !data.items) return;

            let finalLogo = data.image; 
            const sourceName = data.title || feed.name;
            let realDomain = "";
            try {
                if (data.items && data.items.length > 0 && data.items[0].link) {
                    const urlObj = new URL(data.items[0].link);
                    realDomain = urlObj.hostname;
                } else {
                    const urlObj = new URL(feed.url);
                    realDomain = urlObj.hostname;
                }
            } catch (e) { console.log(e); }

            if (data.isYoutube) {
                finalLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(sourceName)}&background=random&color=fff&size=128&rounded=true&bold=true&length=2`;
            } else {
                finalLogo = `https://www.google.com/s2/favicons?domain=${realDomain}&sz=128`;
            }

            if (feed.name === 'Nova Fonte' || feed.name === 'Sem Título') {
                feedsThatNeedUpdate.push({ id: feed.id, name: data.title });
            }

            const items = data.items.map(item => ({
                id: `${feed.id}-${item.id}`,
                source: sourceName,
                logo: finalLogo,
                time: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoje',
                rawDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                title: item.title,
                summary: item.summary ? item.summary.slice(0, 150) + '...' : '',
                category: item.category || 'Geral',
                img: item.img || null, 
                link: item.link,
                origin: item.origin,
                channel: sourceName,
                views: 'Novidade',
                videoId: item.videoId || getVideoId(item.link) 
            }));

            if (data.isYoutube) allVideoItems.push(...items);
            else allNewsItems.push(...items);

        } catch (err) { console.error(`Erro no feed ${feed.name}`, err); }
    });

    await Promise.all(promises);

    if (feedsThatNeedUpdate.length > 0) {
        setUserFeeds(prev => prev.map(f => {
            const update = feedsThatNeedUpdate.find(u => u.id === f.id);
            return update ? { ...f, name: update.name } : f;
        }));
    }

    const sortFn = (a, b) => b.rawDate - a.rawDate;
    setRealNews(Array.from(new Map(allNewsItems.map(i => [i.id, i])).values()).sort(sortFn));
    setRealVideos(Array.from(new Map(allVideoItems.map(i => [i.id, i])).values()).sort(sortFn));
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
  
// Lógica de Inatividade (5 segundos)
useEffect(() => {
  const resetInactivityTimer = () => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    
    // Se a barra estiver visível, começa a contagem de 5s
    if (isNavVisible) {
      navTimerRef.current = setTimeout(() => {
        setIsNavVisible(false);
      }, 3000); // 5000ms = 5 segundos
    }
  };

  // Se a barra aparecer, ativa os sensores de toque/clique na tela inteira
  if (isNavVisible) {
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    
    // Inicia o timer imediatamente ao abrir a barra
    resetInactivityTimer();
  }

  // Limpa os sensores quando a barra some ou o app fecha
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

  return (
    <div className={`min-h-[100dvh] font-sans overflow-hidden selection:bg-blue-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 text-zinc-100' : 'bg-slate-100 text-zinc-900'}`}>      
      
      <div className={`transition-all duration-500 transform h-[100dvh] flex flex-col ${isMainViewReceded ? `scale-[0.9] pointer-events-none` : 'scale-100 opacity-100'}`}>
         
          <HeaderDashboard isDarkMode={isDarkMode} onOpenSettings={() => setIsSettingsOpen(true)} />

          <main ref={mainRef} className="flex-1 overflow-y-auto pb-40 px-4 md:px-6 scrollbar-hide pt-2">
            
            {/* --- AQUI ESTAVA O ERRO --- ADICIONEI newsData={realNews} */}
            {activeTab === 'happening' && (
                <HappeningTab 
                    openArticle={handleOpenArticle} 
                    openStory={setSelectedStory} 
                    isDarkMode={isDarkMode} 
                    newsData={realNews} 
                    onRefresh={fetchFeeds}
                    seenStoryIds={seenStoryIds} 
                    onMarkAsSeen={markStoryAsSeen}
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
                />
            )}
            
            {activeTab === 'banca' && <BancaTab openOutlet={setSelectedOutlet} isDarkMode={isDarkMode} />}
            {activeTab === 'youtube' && <YouTubeTab openStory={setSelectedStory} savedItems={savedItems} onToggleSave={handleToggleSave} isDarkMode={isDarkMode} realVideos={realVideos} isLoading={isLoadingFeeds} onPlayVideo={setPlayingVideo} />}
            {activeTab === 'saved' && <SavedTab isDarkMode={isDarkMode} openArticle={handleOpenArticle} items={savedItems} onRemoveItem={handleRemoveSavedItem} onPlayVideo={setPlayingVideo}/>}
            {activeTab === 'newsletter' && <NewsletterTab openArticle={handleOpenArticle} isDarkMode={isDarkMode} newsData={realNews} />}
          </main>

<div className="fixed bottom-0 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
  <div className="pointer-events-auto w-full relative">
    
    {/* 1. SUPER GATILHO (Só aparece quando a barra está oculta) */}
    {/* Esta div é um 'escudo' que impede qualquer clique nos botões e apenas abre a barra */}
    {!isNavVisible && (
        <div 
            className="absolute bottom-0 left-0 w-full h-20 z-[110] cursor-pointer bg-transparent"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsNavVisible(true);
                // Se o navegador suportar, dá um feedback vibratório curto
                if (window.navigator.vibrate) window.navigator.vibrate(10);
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsNavVisible(true);
            }}
        />
    )}

    {/* 2. A ESTRUTURA DA NAV */}
    <nav className={`
        relative w-full overflow-hidden flex flex-col border-t shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border-white/20  
        transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        ${isNavVisible ? 'translate-y-0' : 'translate-y-[75%]'} 
        ${isDarkMode ? 'bg-zinc-950/95' : 'bg-slate-900/95'}
        backdrop-blur-2xl
    `}>
        
        {/* Puxador (Maior e mais fácil de ver quando fechado) */}
        <div className="w-full flex justify-center pt-4 pb-2 relative z-20">
            <div className={`
                rounded-full transition-all duration-300 
                ${isNavVisible 
                    ? 'bg-white/10 w-12 h-1.5 opacity-50' 
                    : 'bg-white/60 w-24 h-2 opacity-0 shadow-[0_0_20px_rgba(255,255,255,0.4)]'}
            `} />
        </div>

        {/* 3. BOTÕES (Interatividade bloqueada por CSS se isNavVisible for false) */}
        <div className={`
            relative z-10 w-full flex justify-center gap-2 px-2 pb-10 transition-all duration-300
            ${isNavVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}> 
            <TabButton icon={<Sparkles size={24} />} label="Agora" active={activeTab === 'happening'} onClick={() => handleTabClick('happening')} isDarkMode={isDarkMode} />
            <TabButton icon={<Rss size={24} />} label="Feed" active={activeTab === 'feed'} onClick={() => handleTabClick('feed')} isDarkMode={isDarkMode} />
            <TabButton icon={<LayoutGrid size={24} />} label="Banca" active={activeTab === 'banca'} onClick={() => handleTabClick('banca')} isDarkMode={isDarkMode} />
            <TabButton icon={<Youtube size={24} />} label="Vídeos" active={activeTab === 'youtube'} onClick={() => handleTabClick('youtube')} isDarkMode={isDarkMode} />
            <TabButton icon={<Mail size={24} />} label="News" active={activeTab === 'newsletter'} onClick={() => handleTabClick('newsletter')} isDarkMode={isDarkMode} />
            <TabButton icon={<Bookmark size={24} />} label="Salvos" active={activeTab === 'saved'} onClick={() => handleTabClick('saved')} isDarkMode={isDarkMode} />
        </div>

        {/* Brilhos de Fundo */}
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

function ArticlePanel({ article, feedItems, isOpen, onClose, onArticleChange, onToggleSave, isSaved, isDarkMode, onSaveToArchive }) {
  // --- Estados ---
  const [viewMode, setViewMode] = useState('web'); 
  const [iframeUrl, setIframeUrl] = useState(null);     
  const [readerContent, setReaderContent] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Estados de Personalização
  const [fontSize, setFontSize] = useState(20); 
  const [fontFamily, setFontFamily] = useState('serif');

  // Estados de Edição
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [activeTool, setActiveTool] = useState(null); 
  const [userNote, setUserNote] = useState('');
  
  // Refs
  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null); 
  const scrollPositionRef = useRef(0);     

  // Estados de Interface
  const isStoryMode = article?.origin === 'story';
  const [width, setWidth] = useState(60); 
  const [isDragging, setIsDragging] = useState(false);
  const [isFeedListOpen, setIsFeedListOpen] = useState(false);

  // --- OTIMIZAÇÃO: FECHAMENTO RÁPIDO ---
  const handleCloseFast = () => {
      // 1. Limpa o conteúdo pesado IMEDIATAMENTE para liberar a thread
      setIframeUrl(null);
      setReaderContent(null);
      
      // 2. Chama o fechamento do painel (animação)
      // O setTimeout dá 1 frame de respiro para o React limpar a memória antes de animar
      setTimeout(() => {
          onClose();
      }, 0);
  };

  // --- EFEITOS DE SCROLL E LIMPEZA ---
  useLayoutEffect(() => {
      if (viewMode === 'reader' && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositionRef.current;
      }
  }, [readerContent]);

  useEffect(() => {
      return () => {
          if (iframeUrl) {
              URL.revokeObjectURL(iframeUrl); 
          }
      };
  }, [iframeUrl]);

  // --- LÓGICA DE MARCAÇÃO ---
  const handleSelection = () => {
    if (!activeTool || !contentRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) return;
    const range = selection.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) return;

    if (scrollContainerRef.current) scrollPositionRef.current = scrollContainerRef.current.scrollTop;

    try {
        if (activeTool === 'eraser') {
            document.execCommand('removeFormat', false, null);
            const parent = range.commonAncestorContainer.parentElement;
            if (parent && parent.tagName === 'SPAN' && (parent.className.includes('bg-yellow') || parent.className.includes('text-red'))) {
                const text = document.createTextNode(parent.innerText);
                parent.parentNode.replaceChild(text, parent);
            }
        }
        else {
            const span = document.createElement('span');
            if (activeTool === 'highlight') span.className = "bg-yellow-200 dark:bg-yellow-900/60 text-black dark:text-yellow-100 px-1 rounded box-decoration-clone";
            else if (activeTool === 'pen') span.className = "text-red-600 dark:text-red-400 font-bold decoration-red-500 underline decoration-wavy decoration-2 underline-offset-2";
            range.surroundContents(span);
        }
        selection.removeAllRanges();
        if (contentRef.current) {
            setReaderContent(prev => ({ ...prev, content: contentRef.current.innerHTML }));
        }
    } catch (e) { console.warn("Seleção complexa ignorada."); }
  };

  // --- CARREGAMENTO DO SITE (ULTRA-RÁPIDO) ---
  useEffect(() => {
    if (!isOpen || !article?.link || isStoryMode) {
        setIframeUrl(null);
        return;
    }

    if (viewMode === 'ai') setViewMode('web'); 
    setIframeUrl(null); 
    setReaderContent(null);
    setError(false);
    setIsLoading(true);
    setIsFeedListOpen(false);
    setIsAnnotationMode(false);
    setUserNote('');
    setActiveTool(null);

    const controller = new AbortController();

    // REDUZIDO DE 500ms PARA 10ms (Resposta quase instantânea)
    const timer = setTimeout(async () => {
        try {
            const { data, error } = await supabase.functions.invoke('proxy-view', {
                body: { url: article.link }
            });

            if (error || !data) throw new Error("Falha no proxy");
            
            // PREPARAÇÃO DO DOM EM BACKGROUND
            requestAnimationFrame(() => {
                let originalHtml = data.html || "";
                const baseTag = `<base href="${article.link}" target="_blank">`;
                
                // Injeção de string (Mais rápido que parsear tudo de novo)
                if (originalHtml.includes('<head>')) {
                    originalHtml = originalHtml.replace('<head>', `<head>${baseTag}`);
                } else {
                    originalHtml = `${baseTag}${originalHtml}`;
                }

                const blob = new Blob([originalHtml], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                setIframeUrl(blobUrl);
                setReaderContent(data.reader);
                setIsLoading(false);
            });

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn("Erro ao carregar site:", err);
                setError(true);
            }
            setIsLoading(false);
        }
    }, 10); // <--- AQUI ESTÁ A MUDANÇA DE VELOCIDADE

    return () => {
        clearTimeout(timer);
        controller.abort();
    };
  }, [isOpen, article?.id]);
  
  // --- REDIMENSIONAMENTO ---
  const handleStart = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleMove = (clientX) => { if (!isDragging || isStoryMode) return; const newWidth = ((window.innerWidth - clientX) / window.innerWidth) * 100; if (newWidth > 30 && newWidth < 95) setWidth(newWidth); };
  const handleEnd = () => { setIsDragging(false); };
  useEffect(() => { 
      const handleMouseMove = (e) => handleMove(e.clientX); 
      const handleTouchMove = (e) => handleMove(e.touches[0].clientX); 
      if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleEnd); window.addEventListener('touchmove', handleTouchMove); window.addEventListener('touchend', handleEnd); } 
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleEnd); window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('touchend', handleEnd); }; 
  }, [isDragging]);

  const openExternal = () => { if (article?.link) window.open(article.link, '_blank'); };

  // --- FeedNavigator ---
  const FeedNavigator = () => {
      if (!isOpen) return null;
      const relatedNews = feedItems || [];
      const currentIndex = relatedNews.findIndex(item => item && item.id === article?.id);
      const hasPrev = currentIndex > 0;
      const hasNext = currentIndex > -1 && currentIndex < relatedNews.length - 1;
      const handlePrev = (e) => { e.stopPropagation(); if (hasPrev) onArticleChange(relatedNews[currentIndex - 1]); };
      const handleNext = (e) => { e.stopPropagation(); if (hasNext) onArticleChange(relatedNews[currentIndex + 1]); };
      
      const [position, setPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 140 : 500 });
      const [isBtnDragging, setIsBtnDragging] = useState(false);
      const dragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0, hasMoved: false });
      
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

      const handlePointerDown = (e) => { if (e.target.closest('.no-drag')) return; e.preventDefault(); dragRef.current = { startX: e.clientX, startY: e.clientY, initialLeft: position.x, initialTop: position.y, hasMoved: false }; setIsBtnDragging(true); window.addEventListener('pointermove', handlePointerMoveDrag); window.addEventListener('pointerup', handlePointerUpDrag); };
      const handlePointerMoveDrag = (e) => { const dx = e.clientX - dragRef.current.startX; const dy = e.clientY - dragRef.current.startY; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.hasMoved = true; setPosition({ x: dragRef.current.initialLeft + dx, y: dragRef.current.initialTop + dy }); };
      const handlePointerUpDrag = () => { setIsBtnDragging(false); window.removeEventListener('pointermove', handlePointerMoveDrag); window.removeEventListener('pointerup', handlePointerUpDrag); };
      const handleToggle = () => { if (!dragRef.current.hasMoved) setIsFeedListOpen(!isFeedListOpen); };

      return (
          <>
            {isFeedListOpen && (<div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-[5001] transition-opacity" onClick={() => setIsFeedListOpen(false)} />)}
            <div className="absolute z-[5002] w-80 transition-shadow duration-300" style={{ left: position.x, top: position.y, cursor: isBtnDragging ? 'grabbing' : 'grab', touchAction: 'none' }} onPointerDown={handlePointerDown}>
                <div className={`overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-300 border dark:border-white/10 no-drag absolute bottom-full left-0 w-full mb-2 origin-bottom ${isFeedListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                    <div className="p-3 border-b dark:border-white/10 flex justify-between items-center bg-transparent"><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Seu Feed</span><button onClick={() => setIsFeedListOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><X size={14}/></button></div>
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
                <div onClick={handleToggle} className={`flex items-center justify-between p-2 pl-2 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-transform active:scale-95 group select-none ${isDarkMode ? 'bg-zinc-900/80' : 'bg-black/80'}`}><div className="flex items-center gap-3 min-w-0 pointer-events-none"><div className="relative"><div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-20"></div><img src={article?.logo} className="relative w-8 h-8 rounded-full border border-white/20 object-cover bg-white" onError={(e) => e.target.style.display = 'none'} /></div><div className="flex flex-col min-w-0 pr-1"><span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider leading-none">{isBtnDragging ? 'Movendo...' : 'Lendo'}</span><span className="text-xs text-white font-bold truncate leading-tight max-w-[100px]">{article?.source}</span></div></div><div className="flex items-center gap-1 no-drag"><button onPointerDown={(e) => e.stopPropagation()} onClick={handlePrev} disabled={!hasPrev} className={`p-1.5 rounded-full transition-colors ${hasPrev ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronLeft size={18} /></button><button onPointerDown={(e) => e.stopPropagation()} onClick={handleNext} disabled={!hasNext} className={`p-1.5 rounded-full transition-colors ${hasNext ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronRight size={18} /></button><div className="w-px h-4 bg-white/20 mx-1"></div><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFeedListOpen ? 'bg-white/20 text-white' : 'text-zinc-400 group-hover:text-white'}`}>{isBtnDragging ? <GripVertical size={14} /> : <LayoutGrid size={14} />}</div></div></div>
            </div>
          </>
      )
  };

  const baseClasses = `fixed inset-0 z-[5000] flex flex-col transition-transform duration-300 ease-out ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`;

  return (
    <div className={`${baseClasses} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {!isStoryMode && (
             <div onMouseDown={handleStart} onTouchStart={handleStart} className="absolute left-0 top-0 bottom-0 w-8 z-50 hidden md:flex items-center justify-center cursor-ew-resize touch-none group">
                <div className={`h-24 w-1.5 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-blue-500 scale-y-110 shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'}`}><GripVertical size={16} className={`transition-opacity duration-300 ${isDragging ? 'text-white' : 'text-transparent group-hover:text-zinc-500 dark:group-hover:text-zinc-400'}`} /></div>
            </div>
        )}

        <div className="relative flex-1 w-full flex flex-col md:pl-2 h-full overflow-hidden">
            
            {/* CABEÇALHO */}
            <div className={`relative flex-shrink-0 px-4 py-3 flex items-center justify-between border-b backdrop-blur-xl z-30 overflow-visible ${isDarkMode ? 'bg-zinc-950/90 border-white/5' : 'bg-white/90 border-zinc-200'}`}>
                {/* Botões do cabeçalho mantidos */}
                <button onClick={handleCloseFast} className={`flex items-center gap-1 pr-4 py-2 text-sm font-medium transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    <ChevronLeft size={22} /> Voltar
                </button>
                <div className={`hidden md:flex p-1 rounded-full relative border shadow-sm mx-auto ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
                    <div className={`absolute top-1 bottom-1 w-[50%] rounded-full shadow-sm border transition-all duration-300 ${viewMode !== 'ai' ? 'left-1' : 'left-[48%]'} ${isDarkMode ? 'bg-zinc-800 border-white/10' : 'bg-white border-zinc-200'}`} />
                    <button onClick={() => setViewMode('web')} className={`relative px-6 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-2 ${viewMode !== 'ai' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-zinc-500'}`}><Globe size={14} /> Web</button>
                    <button onClick={() => setViewMode('ai')} className={`relative px-6 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-2 ${viewMode === 'ai' ? 'text-purple-500' : 'text-zinc-500'}`}><Sparkles size={14} /> IA</button>
                </div>
                <div className="flex items-center justify-end gap-2 w-auto">
                    <button onClick={() => setViewMode(viewMode === 'reader' ? 'web' : 'reader')} className={`p-2 rounded-full transition border ${viewMode === 'reader' ? (isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (isDarkMode ? 'text-zinc-400 border-transparent hover:bg-white/10' : 'text-zinc-400 border-transparent hover:bg-zinc-100')}`}><ALargeSmall size={20} /></button>
                    <button onClick={() => onToggleSave(article)} className={`p-2 rounded-full transition ${isSaved ? 'text-purple-500 bg-purple-500/10' : (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black')}`}><Bookmark size={20} fill={isSaved ? "currentColor" : "none"} /></button>
                    <button className={`p-2 rounded-full transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black'}`}><Share size={20} /></button>
                </div>

          {/* --- BARRA AURA DE PROGRESSO (ANIMAÇÃO DE CRESCIMENTO) --- */}
            <div className="absolute bottom-[-1px] left-0 right-0 h-1 z-50 pointer-events-none">
                {isLoading ? (
                    // Se estiver carregando, mostra a barra animada
                    <>
                        <div 
                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 blur-[2px]"
                            style={{ animation: 'progress-aura 1s ease-out forwards' }}
                        />
                        <style>{`
                            @keyframes progress-aura {
                                0% { width: 0%; opacity: 0; }
                                50% { width: 50%; opacity: 0.5; }
                                100% { width: 100%; opacity: 1; }
                            }
                        `}</style>
                    </>
                ) : (
                    // Se terminou de carregar, não mostra nada (ou uma linha estática se preferir)
                    <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 transition-opacity"
                        style={{ width: '100%' }}
                    />
                )}
            </div>
            </div>
            
      

            <div className="flex-1 relative w-full h-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                
                {/* 1. MODO WEB */}
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${viewMode === 'web' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 z-20">
                            <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
                            <p className="text-xs font-bold uppercase tracking-wider opacity-50">Carregando Site...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 z-20">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4"><Globe size={32}/></div>
                            <h3 className="text-lg font-bold mb-2">Não foi possível carregar aqui</h3>
                            <button onClick={openExternal} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition">Abrir no Safari</button>
                        </div>
                    ) : iframeUrl && (
                        <>
                            <iframe 
                                src={iframeUrl} 
                                className="w-full h-full border-none bg-white" 
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms" 
                                title="Web Browser" 
                            />
                            <FeedNavigator />
                        </>
                    )}
                </div>

                {/* 2. MODO LEITURA */}
                {viewMode === 'reader' && (
                    <div 
                        ref={scrollContainerRef}
                        className="absolute inset-0 w-full h-full z-20 bg-white dark:bg-zinc-950 overflow-y-auto animate-in fade-in slide-in-from-bottom-2"
                        onMouseUp={handleSelection} 
                        onTouchEnd={handleSelection}
                    >
                        
                        {/* Toolbar */}
                        <div className={`sticky top-0 z-30 flex flex-col border-b backdrop-blur-md transition-all ${isDarkMode ? 'bg-zinc-950/90 border-white/10' : 'bg-white/90 border-zinc-100'}`}>
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
                                        <button onClick={() => setFontFamily('sans')} className={`px-3 py-1 text-xs font-bold rounded-full transition ${fontFamily === 'sans' ? 'bg-white dark:bg-zinc-600 shadow-sm' : 'opacity-50'}`}>Sans</button>
                                        <button onClick={() => setFontFamily('serif')} className={`px-3 py-1 text-xs font-bold rounded-full transition ${fontFamily === 'serif' ? 'bg-white dark:bg-zinc-600 shadow-sm' : 'opacity-50'}`}>Serif</button>
                                    </div>
                                    <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1.5">
                                        <button onClick={() => setFontSize(s => Math.max(14, s - 2))} className="active:scale-90"><Minus size={14}/></button>
                                        <span className="text-xs font-bold w-4 text-center">{fontSize}</span>
                                        <button onClick={() => setFontSize(s => Math.min(32, s + 2))} className="active:scale-90"><Plus size={14}/></button>
                                    </div>
                                </div>
                                <button onClick={() => setIsAnnotationMode(!isAnnotationMode)} className={`p-2 rounded-full transition ${isAnnotationMode ? 'bg-yellow-400 text-black shadow-lg scale-110' : (isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-black hover:bg-zinc-200')}`}><Pencil size={18} fill={isAnnotationMode ? "currentColor" : "none"} /></button>
                            </div>

                            {/* Anotação */}
                            {isAnnotationMode && (
                                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                    <div className={`p-3 rounded-2xl flex flex-col gap-3 shadow-inner border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <button onClick={() => setActiveTool('highlight')} className={`p-2 rounded-xl transition ${activeTool === 'highlight' ? 'bg-yellow-400 text-black shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} title="Marcador"><Highlighter size={20} /></button>
                                                <button onClick={() => setActiveTool('pen')} className={`p-2 rounded-xl transition ${activeTool === 'pen' ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} title="Caneta"><PenTool size={20} /></button>
                                                <button onClick={() => setActiveTool('eraser')} className={`p-2 rounded-xl transition ${activeTool === 'eraser' ? 'bg-red-500 text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} title="Limpar Seleção"><Eraser size={20} /></button>
                                                <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1"></div>
                                                <button className="p-2 opacity-50 cursor-not-allowed"><Undo size={18}/></button>
                                                <button className="p-2 opacity-50 cursor-not-allowed"><Redo size={18}/></button>
                                            </div>
                                            <button onClick={() => { if(onSaveToArchive) { onSaveToArchive(article, userNote); setIsAnnotationMode(false); } else { alert("Função salvar não disponível"); } }} className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm shadow-lg active:scale-95 transition hover:bg-zinc-800 dark:hover:bg-zinc-200">
                                                <Archive size={16} /> Salvar no Arquivo
                                            </button>
                                        </div>
                                        {activeTool === 'note' && (
                                            <textarea value={userNote} onChange={(e) => setUserNote(e.target.value)} placeholder="Escreva sua nota pessoal sobre este artigo..." className={`w-full p-3 rounded-xl text-sm font-medium outline-none resize-none h-24 shadow-sm border focus:ring-2 focus:ring-blue-500/50 transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`} autoFocus />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TEXTO FORMATADO */}
                        <div ref={contentRef} className="max-w-3xl mx-auto p-6 md:p-12 pb-32 selection:bg-yellow-200 selection:text-black">
                            {isLoading && !readerContent ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <Loader2 size={24} className="animate-spin text-zinc-400 mb-2"/>
                                    <p className="text-sm opacity-50">Formatando texto...</p>
                                </div>
                            ) : readerContent ? (
                                <>
                                    <style jsx="true">{`
                                        .reader-content { text-align: justify; hyphens: auto; }
                                        .reader-content p { text-indent: 3rem; margin-bottom: 2.5rem !important; line-height: 1.8 !important; display: block; }
                                        .reader-content h1, .reader-content h2, .reader-content h3 { text-align: left; text-indent: 0; margin-top: 3rem !important; margin-bottom: 1.5rem !important; }
                                        .reader-content img { text-indent: 0; margin: 2rem auto; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                                        .reader-content blockquote { text-align: left; text-indent: 0; border-left: 4px solid #6366f1; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; opacity: 0.85; }
                                        .reader-content ul, .reader-content ol { text-indent: 0; margin-bottom: 2rem; padding-left: 2rem; }
                                        .reader-content li { margin-bottom: 0.5rem; }
                                    `}</style>

                                    <span className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-4 block">{readerContent.siteName || article?.source}</span>
                                    <h1 className={`text-3xl md:text-5xl font-black leading-tight mb-8 ${isDarkMode ? 'text-white' : 'text-zinc-900'} ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>{readerContent.title || article?.title}</h1>
                                    {article?.img && (<div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-10 shadow-sm"><img src={article.img} className="w-full h-full object-cover" /></div>)}
                                    
                                    <div 
                                        className={`reader-content prose prose-lg max-w-none ${isDarkMode ? 'prose-invert text-gray-300' : 'text-gray-800'} ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`} 
                                        style={{ fontSize: `${fontSize}px`, cursor: activeTool ? 'text' : 'auto' }} 
                                        dangerouslySetInnerHTML={{ __html: readerContent.content }} 
                                    />
                                </>
                            ) : !isLoading && (<div className="text-center py-20 opacity-50"><p>Não foi possível extrair o texto completo.</p></div>)}
                        </div>
                    </div>
                )}
                
                {/* MODO IA */}
                {viewMode === 'ai' && (
                     <div className="absolute inset-0 w-full h-full z-20 bg-white dark:bg-zinc-950 overflow-y-auto max-w-2xl mx-auto p-8 pb-32 animate-in fade-in">
                        <span className="text-purple-500 font-bold text-xs uppercase tracking-widest mb-4 block">Inteligência Artificial</span>
                        <h1 className={`text-3xl md:text-4xl font-serif font-black leading-tight mb-8 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{article?.title}</h1>
                        <div className={`prose prose-lg ${isDarkMode ? 'prose-invert' : ''}`}>
                            <p className="font-bold text-xl opacity-80">Em análise...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

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
  const [targetFeed, setTargetFeed] = useState(true);
  const [targetBanca, setTargetBanca] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const fileInputRef = useRef(null);

  // --- FUNÇÃO 1: AUTO DESCOBERTA (MÁGICA) ---
  const handleAutoDiscover = async () => {
      if (!newUrl) return;
      setIsDiscovering(true);
      
      // Adiciona protocolo se faltar para evitar erro no backend
      let urlToCheck = newUrl.trim();
      if (!urlToCheck.startsWith('http')) urlToCheck = 'https://' + urlToCheck;

      try {
          // Chama a Edge Function com type='discover'
          const { data, error } = await supabase.functions.invoke('parse-feed', {
              body: { url: urlToCheck, type: 'discover' }
          });

          if (error || !data || !data.url) throw new Error("Feed não encontrado");

          setNewUrl(data.url); // Atualiza o input com a URL do RSS encontrada
          alert(`Sucesso! Feed RSS encontrado: ${data.url}`);

      } catch (err) {
          console.error(err);
          alert("Não foi possível encontrar um feed RSS automático neste site. Tente buscar por 'Nome do Site RSS' no Google.");
      } finally {
          setIsDiscovering(false);
      }
  };

  // --- FUNÇÃO 2: IMPORTAR OPML ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
            name: node.getAttribute("text") || node.getAttribute("title") || "Fonte Importada",
            url: xmlUrl,
            category: 'Importado',
            display: { feed: true, banca: false }
          });
        }
      }

      if (importedFeeds.length > 0) {
        setFeeds(prev => [...prev, ...importedFeeds]);
        alert(`${importedFeeds.length} fontes importadas com sucesso!`);
      } else {
        alert("Nenhum feed válido encontrado no arquivo OPML.");
      }
    };
    reader.readAsText(file);
  };

  // --- FUNÇÃO 3: ADICIONAR FEED MANUALMENTE ---
  const handleAddFeed = () => {
    if (!newUrl.trim()) return; 
    if (!targetFeed && !targetBanca) {
        alert("Selecione pelo menos um destino (Feed ou Banca).");
        return;
    }

    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newFeed = { 
        id: Date.now(), 
        name: 'Nova Fonte', // O backend atualizará o nome depois
        url: formattedUrl,
        category: 'Personalizado',
        display: { feed: targetFeed, banca: targetBanca }
    };
    
    setFeeds(prevFeeds => [...prevFeeds, newFeed]);
    setNewUrl('');
    setTargetFeed(true);
    setTargetBanca(false);
  };

  // --- FUNÇÃO 4: REMOVER FEED ---
  const removeFeed = (id) => {
    setFeeds(feeds.filter(f => f.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Card */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">Configurações</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 m-4 mb-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button onClick={() => setActiveTab('sources')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'sources' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>Fontes</button>
            <button onClick={() => setActiveTab('api')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'api' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>IA & API</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            {activeTab === 'sources' && (
                <div className="space-y-6">
                    {/* Botão de Importar */}
                    <div className="flex gap-2 mb-2">
                        <input type="file" accept=".opml,.xml" ref={fileInputRef} onChange={handleImportOPML} className="hidden" />
                        <button onClick={handleImportClick} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-zinc-300 dark:hover:bg-zinc-700 transition flex items-center justify-center gap-2">
                            <Layers size={14}/> Importar OPML
                        </button>
                    </div>

                    {/* Área de Adicionar Feed (Com Magic Wand) */}
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3 block">Adicionar Fonte</label>
                        
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={newUrl} 
                                onChange={(e) => setNewUrl(e.target.value)} 
                                placeholder="ex: theverge.com ou link RSS" 
                                className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'}`} 
                            />
                            <button 
                                onClick={handleAutoDiscover} 
                                disabled={isDiscovering || !newUrl}
                                className={`p-2 rounded-lg border transition-all flex items-center justify-center w-10 
                                    ${isDarkMode ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-indigo-100 border-indigo-200 text-indigo-700 hover:bg-indigo-200'} 
                                    disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="Auto-detectar RSS do site"
                            >
                                {isDiscovering ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div onClick={() => setTargetFeed(!targetFeed)} className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all select-none ${targetFeed ? 'bg-blue-600 border-blue-600 text-white' : (isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400')}`}>
                                <Rss size={16} /> <span className="font-bold text-sm">Feed</span> {targetFeed && <CheckCircle size={16} className="ml-auto" />}
                            </div>
                            <div onClick={() => setTargetBanca(!targetBanca)} className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all select-none ${targetBanca ? 'bg-emerald-600 border-emerald-600 text-white' : (isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400')}`}>
                                <LayoutGrid size={16} /> <span className="font-bold text-sm">Banca</span> {targetBanca && <CheckCircle size={16} className="ml-auto" />}
                            </div>
                        </div>

                        <button onClick={handleAddFeed} disabled={!newUrl || (!targetFeed && !targetBanca)} className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 hover:bg-purple-500 disabled:opacity-50">Confirmar</button>
                    </div>

                    {/* Lista de Feeds Ativos */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">Fontes Ativas ({feeds.length})</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {feeds.map(feed => (
                                <div key={feed.id} className={`flex justify-between items-center p-3 rounded-lg border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="min-w-0 pr-2">
                                        <p className="font-bold text-sm truncate">{feed.name}</p>
                                        <p className="text-[10px] opacity-60 truncate">{feed.url}</p>
                                    </div>
                                    <button onClick={() => removeFeed(feed.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'api' && (
                <div className="space-y-4">
                     <p className="text-sm opacity-70">Cole sua chave da API do Google Gemini aqui para habilitar os resumos inteligentes.</p>
                     <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300'}`} />
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
