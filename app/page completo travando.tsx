"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Headphones, Search, ChevronRight, Rss, Calendar as CalendarIcon, Loader2, RefreshCw, Music, Disc3, SkipBack, SkipForward, Type
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
  { id: 1, channel: 'MKBHD', category: 'Tech', title: 'Review: O fim dos smartphones?', views: '4M', img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80' },
  { id: 2, channel: 'Manual do Mundo', category: 'Ciência', title: 'Construí um submarino caseiro', views: '1M', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80' },
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
  const [isTyping, setIsTyping] = useState(false);
  
  // --- ESTADO DE DADOS DE MERCADO ---
  const [data, setData] = useState({});


  // --- LÓGICA DE DATA, ARRASTAR E CALENDÁRIO ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // Novo estado
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
    // Lógica Inteligente: Clique vs Arraste
    if (Math.abs(dragOffset) < 5) {
        // Se moveu menos de 5px, considera como CLIQUE -> Abre Calendário
        setIsCalendarOpen(true);
    } 
    else if (Math.abs(dragOffset) > 50) { 
      // Se moveu mais de 50px -> Troca o dia
      const newDate = new Date(currentDate);
      if (dragOffset > 0) newDate.setDate(currentDate.getDate() - 1);
      else {
        const today = new Date();
        if (newDate < today.setHours(0,0,0,0)) newDate.setDate(currentDate.getDate() + 1);
      }
      handleDateChange(newDate); // Usa função auxiliar
    }
    setDragStartX(null);
    setDragOffset(0);
  };

  // Função chamada quando a data muda (via arraste ou calendário)
  const handleDateChange = (newDate) => {
      setCurrentDate(newDate);
      
      // Simula a busca no arquivo
      const isToday = newDate.toDateString() === new Date().toDateString();
      if (isToday) {
          setAiStatus("Atualizando feed em tempo real...");
      } else {
          setAiStatus(`Carregando arquivos de ${newDate.toLocaleDateString()}...`);
          // Aqui você chamaria sua função real: fetchArchivedFeed(newDate);
      }
  };

  // --- BUSCA DE DADOS (YAHOO + AWESOMEAPI) ---
  // --- BUSCA DE DADOS (AWESOMEAPI + BRAPI) ---
  const fetchMarketData = async () => {
    const symbols = ['USDBRL=X', 'EURBRL=X', 'BTC-USD', '^BVSP', '^IXIC', 'VALE3.SA', 'PETR4.SA'];
    const newData = {};

    try {
        // Fazemos requisições em paralelo para ser mais rápido
        await Promise.all(symbols.map(async (symbol) => {
            try {
                // Endpoint v8/chart é menos bloqueado que o v7/quote
                const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                // Usamos o corsproxy.io para evitar erro de CORS no navegador
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

                    // Formatação
                    let valDisplay = '...';
                    if (price) {
                        // Se for índice ou BTC, formata com 'k' (milhares)
                        if (symbol === '^BVSP' || symbol === '^IXIC' || symbol === 'BTC-USD') {
                            valDisplay = (price / 1000).toFixed(1) + 'k';
                        } else {
                            // Moedas e Ações com 2 casas decimais
                            valDisplay = price.toFixed(2).replace('.', ',');
                        }
                    }

                    newData[symbol] = { val: valDisplay, up: isUp };
                }
            } catch (err) {
                console.warn(`Erro ao buscar ${symbol}`, err);
                // Mantém o valor anterior se falhar
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
        
      {/* --- RENDERIZA O MODAL DO CALENDÁRIO --- */}
      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={handleDateChange}
        isDarkMode={isDarkMode}
      />

      <div className={`relative w-full overflow-hidden rounded-b-[2.5rem] shadow-2xl border-b border-white/10 ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-900'}`}>
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[100%] bg-teal-600/10 blur-[80px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-soft-light"></div>

        <div className="relative px-6 pt-6 pb-4 flex flex-col gap-6">
           
           {/* --- DATA NO TOPO (ABA) --- */}
           <div 
             className="absolute top-0 right-0 z-30 cursor-ew-resize select-none touch-none group"
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
                    rounded-b-2xl rounded-t-none
                    border-x border-b border-white/10 border-t-0
                    bg-black/20 backdrop-blur-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] 
                    transition-all duration-200 ease-out
                    ${Math.abs(dragOffset) > 0 ? 'translate-y-1 bg-black/40' : 'hover:bg-black/30 hover:pt-4'}
                `}
                style={{ transform: `translateX(${dragOffset}px)` }}
                title="Clique para abrir o calendário ou arraste para mudar o dia"
              >
                  <ChevronLeft size={14} className={`text-white/40 transition-opacity ${Math.abs(dragOffset) > 0 || 'group-hover:opacity-100'} opacity-0`} />
                  
                  <div className="flex flex-col items-center leading-none">
                      
                      <span className="text-sm font-bold text-green-400 whitespace-nowrap font-medium tracking-wide flex items-center gap-2">
                          {formatDate(currentDate)}
                          <CalendarIcon size={10} className="opacity-50" />
                      </span>
                  </div>

                  <ChevronRight size={14} className={`text-white/40 transition-opacity ${Math.abs(dragOffset) > 0 || 'group-hover:opacity-100'} opacity-0`} />
              </div>
           </div>

           {/* LINHA 1: PERFIL */}
           <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-3">
                 <div onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
                    <img src="https://ui-avatars.com/api/?name=User&background=000&color=fff" className="rounded-full w-full h-full border-2 border-black" alt="User" />
                 </div>
                 <div>
                    <h1 className="text-sm font-medium text-white/60 leading-none mb-1">Bem-vindo de volta</h1>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                       <span className="text-xs font-bold text-white tracking-wide">{aiStatus}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* LINHA 2: BARRA DE PESQUISA */}
           <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
                 <div className="pl-4 pr-3 text-white/50"><Sparkles size={18} className="animate-pulse text-purple-400" /></div>
                 <input type="text" placeholder="Pergunte à NewsOS..." className="w-full bg-transparent text-white placeholder:text-white/40 text-sm font-medium py-3 outline-none" onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} />
                 <div className="pr-1.5"><button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition"><ArrowRight size={16} /></button></div>
              </div>
           </div>

           {/* LINHA 3: TICKER DE MERCADO */}
           <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
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
const SmartImage = ({ src, title, logo, isDarkMode, className }) => {
  const [hasError, setHasError] = useState(!src); // Já começa com erro se não tiver src

  // Extrai as 3 primeiras palavras
  const getDisplayTitle = () => {
    if (!title) return "News";
    // Divide por espaço, pega os 3 primeiros, junta e remove pontuação excessiva
    const words = title.split(/\s+/).slice(0, 6).join(' ');
    return words.replace(/[^\w\sà-úÀ-Ú]$/g, ""); // Remove ponto/vírgula do final
  };

  if (hasError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden ${className} ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
        
        {/* Fundo com textura sutil */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        {/* Gradiente sutil */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-zinc-800 to-zinc-900' : 'from-zinc-100 to-zinc-200'}`}></div>

        <div className="relative z-10 flex flex-col items-center gap-3">
          {/* Logo do Site (Com sombra e borda) */}
          <div className={`p-1 rounded-full shadow-sm ${isDarkMode ? 'bg-zinc-700' : 'bg-white'}`}>
             <img 
               src={logo} 
               alt="Logo" 
               className="w-10 h-10 rounded-full object-cover" 
               onError={(e) => e.target.style.display = 'none'} // Esconde se logo falhar tbm
             />
          </div>

          {/* As 3 Primeiras Palavras (Estilo Tipográfico) */}
          <h3 className={`font-black text-center leading-none tracking-tight uppercase opacity-40 select-none ${isDarkMode ? 'text-zinc-500 text-xl' : 'text-zinc-400 text-sm'}`}>
            {getDisplayTitle()}
          </h3>
          
          {/* Linha decorativa */}
          <div className={`w-8 h-1 rounded-full mt-1 ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      className={className} 
      alt={title}
      onError={() => setHasError(true)} // Se a imagem quebrar, ativa o fallback
      loading="lazy"
    />
  );
};


const NewsCard = React.memo(({ news, isSelected, isSaved, isRead, isDarkMode, openArticle, onToggleSave, index, totalItems }) => {
    return (
        <div 
          onClick={() => openArticle(news)}
          style={{ zIndex: isSelected ? 50 : (totalItems - index) }}
          className={`
            group relative cursor-pointer 
            transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] 
            flex flex-col 
            overflow-hidden rounded-3xl
            ${isSelected 
              ? (isDarkMode 
                  ? 'bg-zinc-900 scale-103 border-2 border-purple-500 shadow-2xl shadow-black/50' 
                  : 'bg-white scale-103 border-2 border-purple-500 shadow-2xl shadow-purple-900/10')
              : (isDarkMode 
                  ? 'bg-zinc-900 border border-white/5 translate-y-[5px] hover:translate-y-0 hover:bg-zinc-800' 
                  : 'bg-white border border-zinc-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] translate-y-[5px] hover:translate-y-0 hover:shadow-md')
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
                                <img src={news.logo} className="w-full h-full object-cover" alt="" onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${news.source}&background=random`}/>
                            </div>
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
});
NewsCard.displayName = 'NewsCard'; // Ajuda na depuração


// --- TAB: FEED (COMPLETA E FUNCIONAL) ---

function FeedTab({ openArticle, isDarkMode, selectedArticleId, savedItems, onToggleSave, readHistory, newsData, isLoading }) {
  const [category, setCategory] = useState('Tudo');
  const [sourceFilter, setSourceFilter] = useState('all'); 
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const safeNews = useMemo(() => (newsData && newsData.length > 0) ? newsData : FEED_NEWS, [newsData]);

  const displayedNews = useMemo(() => {
    const filteredByCategory = category === 'Tudo' ? safeNews : safeNews.filter(n => n.category === category);
    return sourceFilter === 'all' ? filteredByCategory : filteredByCategory.filter(n => n.source === sourceFilter);
  }, [category, sourceFilter, safeNews]);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY <= 5 && !isRefreshing) {
        setStartY(e.touches[0].clientY);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e) => {
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
  }, [startY, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance < 70) {
        setPullDistance(0);
        setStartY(0);
        return;
    }
    
    setIsRefreshing(true);
    setPullDistance(70); 
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    setIsRefreshing(false);
    
    setPullDistance(0);
    setStartY(0);
  }, [pullDistance]);

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
      <div className="sticky top-0 z-[1000] w-full flex justify-center py-2 pointer-events-none">
          <div className="pointer-events-auto">
             <SourceSelector news={safeNews} selectedSource={sourceFilter} onSelect={setSourceFilter} isDarkMode={isDarkMode} />
          </div>
          <LiquidFilterBar 
            categories={FEED_CATEGORIES} 
            active={category} 
            onChange={setCategory} 
            isDarkMode={isDarkMode} 
          />
      </div>

      <div 
        style={{ height: `${pullDistance}px`, opacity: Math.min(pullDistance / 40, 1), transition: isRefreshing ? 'height 0.3s ease' : 'height 0s' }} 
        className="flex items-end justify-center overflow-hidden w-full will-change-transform"
      >
         <div className={`mb-4 flex items-center gap-3 px-5 py-2 rounded-full shadow-lg border transition-all transform duration-200 ${isDarkMode ? 'bg-zinc-800 border-purple-500/30 text-white' : 'bg-white border-purple-200 text-zinc-800'} ${pullDistance > 70 ? 'scale-110' : 'scale-100'}`}>
            {isRefreshing ? (
                <><Loader2 size={20} className="animate-spin text-purple-500" /><span className="text-xs font-bold text-purple-500 animate-pulse">Atualizando...</span></>
            ) : (
                <><div style={{ transform: `rotate(${pullDistance * 3}deg)` }} className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full text-purple-600 dark:text-purple-400"><RefreshCw size={16} /></div><span className={`text-xs font-bold transition-colors ${pullDistance > 70 ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{pullDistance > 70 ? 'Solte para atualizar' : 'Puxe para atualizar'}</span></>
            )}
         </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {displayedNews.length === 0 ? (
           <div className="text-center py-10 opacity-50"><p>Nenhuma notícia encontrada nesta categoria.</p></div>
        ) : (
            displayedNews.map((news, index) => (
                <NewsCard 
                    key={news.id}
                    news={news}
                    isSelected={selectedArticleId === news.id}
                    isSaved={savedItems.some((item) => item.id === news.id)}
                    isRead={readHistory.includes(news.id)}
                    isDarkMode={isDarkMode}
                    openArticle={openArticle}
                    onToggleSave={onToggleSave}
                    index={index}
                    totalItems={displayedNews.length}
                />
            ))
        )}
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


// --- ABA YOUTUBE (VERSÃO 100% COMPLETA, FINAL E CORRIGIDA) ---

function YouTubeTab({ isDarkMode, openStory, onToggleSave, savedItems }) {
  // --- ESTADOS E FUNÇÕES (NENHUMA MUDANÇA AQUI) ---
  const [category, setCategory] = useState('Tudo');
  const [musicQuery, setMusicQuery] = useState('');
  const [musicList, setMusicList] = useState(MUSIC_FEED);
  const [searchStatus, setSearchStatus] = useState('idle');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

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
  
  const displayedVideos = category === 'Tudo' || category === 'Música' ? YOUTUBE_FEED : YOUTUBE_FEED.filter(v => v.category === category);
  const ytStories = [
    { id: 1, name: 'MKBHD', avatar: 'https://ui-avatars.com/api/?name=MK&background=000&color=fff', items: [{ id: 101, img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', title: 'New Studio Tour!', time: '10m' }] },
    { id: 2, name: 'MrBeast', avatar: 'https://ui-avatars.com/api/?name=MB&background=2980b9&color=fff', items: [{ id: 102, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', title: 'Challenge', time: '1h' }] },
  ];

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in px-2 pl-16 relative min-h-screen">
      
      <audio ref={audioRef} onTimeUpdate={() => { if (!audioRef.current) return; setCurrentTime(audioRef.current.currentTime); setProgress(audioRef.current.duration ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0); }} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={handleNext} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      <YouTubeVerticalFilter categories={YOUTUBE_CATEGORIES} active={category} onChange={setCategory} isDarkMode={isDarkMode} />
      
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
        // ===== SEÇÃO DE VÍDEOS QUE ESTAVA FALTANDO =====
        <div className="grid md:grid-cols-2 gap-6">
          {displayedVideos.map((video) => {
              const isSaved = savedItems?.some(i => i.id === video.id);
              return (
                  <div key={video.id} className={`group relative rounded-3xl overflow-hidden border shadow-lg hover:shadow-xl transition-all ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'}`}>
                      <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-orange-600 p-[2px]"><div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden"><img src={video.img} className="w-full h-full object-cover" /></div></div>
                              <div><span className={`text-sm font-bold block ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{video.channel}</span><span className="text-[10px] uppercase font-bold text-zinc-500">{video.category}</span></div>
                          </div>
                          <MoreHorizontal size={20} className="text-zinc-400" />
                      </div>
                      <div className={`relative aspect-video cursor-pointer overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                          <img src={video.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors"><div className="bg-white/20 backdrop-blur-sm p-4 rounded-full"><Play size={48} className="text-white drop-shadow-lg fill-white/20" /></div></div>
                          <button onClick={(e) => { e.stopPropagation(); if (onToggleSave) onToggleSave({ ...video, source: video.channel, category: 'Vídeo', date: 'Agora' }); }} className={`absolute bottom-3 right-3 z-20 p-2.5 rounded-full backdrop-blur-xl shadow-xl transition-all duration-300 active:scale-90 ${isSaved ? 'bg-purple-600 text-white shadow-purple-500/40' : 'bg-black/50 text-white/80 hover:bg-black/70 hover:text-white border border-white/10'}`}><Bookmark size={18} fill={isSaved ? "currentColor" : "none"} /></button>
                      </div>
                      <div className="px-5 py-4"><h3 className={`text-lg font-bold leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{video.title}</h3></div>
                  </div>
              )
          })}
        </div>
        // ================================================
      )}

      {currentSong && (
        <div className={`fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl border flex flex-col gap-2 transition-all animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-black/80 border-white/10 text-white' : 'bg-white/90 border-zinc-200 text-zinc-900'}`}>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shadow-md flex-shrink-0 relative"><img src={currentSong.cover} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0"><h4 className="font-bold text-sm truncate leading-tight">{currentSong.title}</h4><p className={`text-xs truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{currentSong.artist}</p></div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full"><SkipBack size={20} /></button>
                    <button onClick={togglePlay} className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-500 active:scale-95 transition">{isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1"/>}</button>
                    <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full"><SkipForward size={20} /></button>
                    <a href={`https://music.youtube.com/search?q=${encodeURIComponent(currentSong.title + ' ' + currentSong.artist)}`} target="_blank" rel="noopener noreferrer" title="Ouvir a música completa no YouTube Music" className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-full transition-colors">
                      <Youtube size={20} />
                    </a>
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

function HappeningTab({ openArticle, openStory, isDarkMode }) {
  // Estado local para o modal do Podcast
  const [isPodcastOpen, setIsPodcastOpen] = useState(false);

  // Dados mockados mantidos...
  const trending = [
    { id: 1, title: 'IA Generativa: O novo marco regulatório começa a valer hoje na Europa', source: 'Politico', time: '15m', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80' },
    { id: 2, title: 'Final da Champions: Real Madrid e City se enfrentam em jogo histórico', source: 'ESPN', time: '45m', img: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=600&q=80' },
    { id: 3, title: 'Bitcoin atinge nova máxima histórica com aprovação de ETF', source: 'Bloomberg', time: '2h', img: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80' },
    { id: 4, title: 'Novo carro elétrico da Xiaomi surpreende em testes de autonomia', source: 'AutoEsporte', time: '3h', img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&q=80' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* --- HEADER: STORIES + PODCAST BUTTON --- */}
      <div className="flex items-center gap-4 px-2">
        
        {/* Lado Esquerdo: Stories (Scroll Horizontal) */}
        <div className="flex-1 min-w-0"> {/* min-w-0 é crucial para scroll dentro de flex */}
            <div className="flex space-x-5 overflow-x-auto pb-2 scrollbar-hide snap-x items-center">
                {STORIES.map((story) => (
                <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group flex-shrink-0">
                    <div className="relative w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-blue-500 to-teal-200 group-hover:scale-105 transition-transform duration-300 shadow-md">
                        <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950' : 'border-white'}`}>
                            <img src={story.avatar} className="w-full h-full object-cover" alt={story.name} />
                        </div>
                    </div>
                    <span className={`text-[10px] font-semibold truncate max-w-[70px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{story.name}</span>
                </div>
                ))}
            </div>
        </div>

        {/* Lado Direito: Botão PodNews (Fixo) */}
        <div className="flex-shrink-0 pl-2 border-l border-dashed border-zinc-300 dark:border-zinc-700">
            <button 
                onClick={() => setIsPodcastOpen(true)}
                className={`
                    group relative flex flex-col items-center justify-center gap-1.5
                    w-20 h-auto py-2 rounded-2xl transition-all duration-300
                    hover:scale-105 active:scale-95
                `}
            >
                {/* Ícone com Fundo Gradiente */}
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                    <Sparkles size={14} className="absolute top-1 right-1 text-white/60 animate-pulse" />
                    <Headphones size={20} className="text-white" />
                    {/* Badge "NOVO" */}
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-100 dark:border-slate-900">
                        IA
                    </div>
                </div>
                
                {/* Texto */}
                <div className="text-center leading-none">
                    <span className={`block text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                        PodNews
                    </span>
                    <span className="text-[8px] text-purple-500 font-bold">07:00</span>
                </div>
            </button>
        </div>

      </div>

      {/* --- Restante do Conteúdo (Cards) --- */}
      
      {/* Resumo do Momento */}
      <div className="px-1">
        <div className={`relative overflow-hidden rounded-[32px] border p-8 shadow-2xl transition-all hover:scale-[1.01] duration-500 ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-gradient-to-br from-zinc-900 to-black text-white border-transparent'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 blur-[90px]" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-blue-400 text-black p-2 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)]"><Sparkles size={20} fill="black" /></div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">Resumo do Momento</span>
          </div>
          <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">Mercado global reage: Pacote fiscal e avanços em IA dominam a pauta.</h2>
              <p className="text-zinc-300 text-base leading-relaxed mb-8 font-serif">Nossa IA processou 14 fontes para criar este resumo.</p>
              <button onClick={() => openArticle({ title: 'Briefing IA', source: 'NewsOS Intelligence', img: null })} className="py-3.5 px-8 bg-white text-black font-bold text-sm rounded-full hover:bg-zinc-200 transition active:scale-[0.98] flex items-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">Ler Briefing Completo <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Destaque Imersivo */}
      <div className="px-1">
         <div onClick={() => openArticle({ title: 'SpaceX lança novo foguete Starship', source: 'SpaceX Live', img: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80' })} className="group relative h-[400px] w-full rounded-[32px] overflow-hidden cursor-pointer shadow-2xl transition-all duration-500 hover:shadow-orange-500/20">
            <img src="https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="SpaceX" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-400/30 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
               <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
               <span className="text-white text-[10px] font-bold uppercase tracking-widest">Ao Vivo • Cabo Canaveral</span>
            </div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
               <div className="flex items-center gap-2 mb-2 opacity-80"><span className="text-orange-400 font-bold text-xs uppercase tracking-wider">Ciência & Espaço</span><span className="text-zinc-400 text-xs">•</span><span className="text-zinc-300 text-xs">Há 10 min</span></div>
               <h2 className="text-3xl font-bold text-white leading-tight mb-2 group-hover:underline decoration-orange-500 underline-offset-4 decoration-2">SpaceX prepara lançamento histórico da Starship V3.</h2>
               <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:translate-x-2 transition-transform"><div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><Play size={12} fill="white" /></div>Assistir Transmissão</div>
            </div>
         </div>
      </div>

      {/* Em Alta */}
      <div className="px-2 pt-4">
        <div className="flex items-center gap-2 mb-4 px-1"><TrendingUp size={20} className="text-blue-500" /><h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Em Alta Agora</h3></div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {trending.map(item => (
            <div key={item.id} onClick={() => openArticle(item)} className={`min-w-[280px] md:min-w-[320px] rounded-2xl p-4 cursor-pointer snap-center border transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:shadow-lg'}`}>
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 flex-shrink-0 relative"><img src={item.img} className="w-full h-full object-cover" /><div className="absolute top-0 left-0 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-br-lg text-white text-[10px] font-bold">#{item.id}</div></div>
                <div><span className="text-[10px] font-bold text-blue-500 uppercase">{item.source} • {item.time}</span><h4 className={`font-bold leading-snug mt-1 line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{item.title}</h4></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL DO PODCAST (RENDERIZAÇÃO) --- */}
      {isPodcastOpen && (
        <PodNewsModal 
            onClose={() => setIsPodcastOpen(false)} 
            isDarkMode={isDarkMode} 
        />
      )}

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

function SavedTab({ isDarkMode, openArticle, items, onRemoveItem }) {
  const [filter, setFilter] = useState('Tudo');
  const [searchQuery, setSearchQuery] = useState('');
  
  const SAVED_FILTERS_WITH_ICONS = [
    { label: 'Tudo', icon: Layers },
    { label: 'Notícias', icon: FileText },
    { label: 'Vídeos', icon: Youtube },
    { label: 'Músicas', icon: Music },
    { label: 'Links', icon: Globe },
  ];

  const safeItems = items || [];

  const getItemType = (item) => {
    if (item.category === 'Música') return 'Músicas';
    if (item.category === 'Vídeo') return 'Vídeos';
    if (item.category === 'Link') return 'Links';
    return 'Notícias';
  };
  
  const filteredItems = safeItems.filter(item => {
    const typeMatch = filter === 'Tudo' || getItemType(item) === filter;
    const searchMatch = searchQuery === '' || 
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase()));
    return typeMatch && searchMatch;
  });

  return (
    <div className="pt-2 pb-24 animate-in fade-in duration-500 min-h-screen">
      
      {/* --- CABEÇALHO E FILTRO (Sem alterações) --- */}
      <div className="px-4 mb-4">
        <h2 className={`text-2xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Sua Biblioteca</h2>
        <div className={`relative flex items-center w-full p-1 rounded-full border ...`}>
          <div className="pl-3 pr-2 text-zinc-500"><Search size={18}/></div>
          <input type="text" placeholder="Buscar em seus itens salvos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 bg-transparent text-sm font-medium outline-none" />
        </div>
      </div>
      <div className="px-4 my-6">
        <UnderlineFilterBar 
          categories={SAVED_FILTERS_WITH_ICONS} 
          active={filter} 
          onChange={setFilter} 
          isDarkMode={isDarkMode} 
        />
      </div>

      {/* --- GRID DE CARDS COM LIXEIRA SEMPRE VISÍVEL --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mt-2">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-16 opacity-50">
            <Bookmark size={40} className="mx-auto mb-4"/>
            <h3 className="font-bold">Nenhum item salvo aqui</h3>
            <p className="text-sm">Salve artigos, vídeos e links para ler depois.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemType = getItemType(item);

            switch(itemType) {
              
              case 'Músicas':
                return (
                  <div key={item.id} onClick={() => openArticle(item)} className={`group relative w-full flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                      // ===== CORREÇÃO APLICADA AQUI: removido 'scale-0 group-hover:scale-100' =====
                      className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 text-white/70 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title}/>
                    </div>
                    <div className="bg-red-600 p-11 flex items-center gap-3">
                      <Music size={24} className="text-white flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-white text-sm font-bold leading-snug truncate">{item.title}</h3>
                        <p className="text-white/70 text-xs truncate">{item.source}</p>
                      </div>
                    </div>
                  </div>
                );

              case 'Vídeos':
                return (
                  <div key={item.id} onClick={() => openArticle(item)} className={`group relative w-full flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                      // ===== CORREÇÃO APLICADA AQUI: removido 'scale-0 group-hover:scale-100' =====
                      className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 text-white/70 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title}/>
                    </div>
                    <div className="bg-black p-11 flex items-center gap-3">
                      <Youtube size={24} className="text-red-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-white text-sm font-bold leading-snug truncate">{item.title}</h3>
                        <p className="text-white/70 text-xs truncate">{item.source}</p>
                      </div>
                    </div>
                  </div>
                );

       case 'Links':
  return (
    <div key={item.id} onClick={() => openArticle(item)} className={`group relative w-full h-full flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-purple-500' : 'bg-white border-zinc-200 hover:border-purple-500 hover:shadow-lg'}`}>
      
      {/* Botão de lixeira agora é um overlay */}
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
          {/* O botão foi movido para fora daqui */}
        </div>
        <h3 className={`text-lg font-bold leading-snug font-serif ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{item.title}</h3>
      </div>
      <p className={`text-xs truncate mt-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.url || 'Link salvo'}</p>
    </div>
  );


              default: // Notícias
                return (
                  <div key={item.id} onClick={() => openArticle(item)} className={`group relative w-full rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                      // ===== CORREÇÃO APLICADA AQUI: removido 'scale-0 group-hover:scale-100' =====
                      className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 text-white/70 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className={`aspect-video w-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                     <SmartImage src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title}/>
                    </div>
                    <div className="p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{item.source}</span>
                      <h3 className={`text-base font-bold leading-snug line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{item.title}</h3>
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.date}</p>
                    </div>
                  </div>
                );
            }
          })
        )}
      </div>
    </div>
  );
}


function TabButton({ icon, label, active, onClick, isDarkMode }) { return (<button onClick={onClick} className={`relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 group ${active ? 'scale-125 -translate-y-2' : 'hover:scale-110'}`}><div className={`p-2 rounded-full transition-all shadow-lg ${active ? 'bg-sky-500 text-white' : (isDarkMode ? 'text-blue-500 group-hover:text-zinc-300' : 'text-blue-400 group-hover:text-zinc-600')}`}>{icon}</div></button>); }

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
    const link = linkNode?.getAttribute("href") || linkNode?.textContent || "";

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
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [userFeeds, setUserFeeds] = useState([
      { id: 1, name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', display: { feed: true } },
      { id: 2, name: 'G1', url: 'https://g1.globo.com/dynamo/rss2.xml', category: 'Local', display: { feed: true } }
  ]);
  const [realNews, setRealNews] = useState([]); 
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);

  const [savedItems, setSavedItems] = useState(SAVED_ITEMS);
  const [readHistory, setReadHistory] = useState([]);

  // --- BUSCA DE RSS ---
  const fetchFeeds = useCallback(async () => {
    if (userFeeds.length === 0) return;
    setIsLoadingFeeds(true);
    
    let allItems = [];
    let feedsThatNeedUpdate = []; 

    const promises = userFeeds.map(async (feed) => {
        if (!feed.display?.feed && !feed.display?.banca) return;
        if (!feed.url) return;

        try {
            const { data, error } = await supabase.functions.invoke('parse-feed', {
                body: { url: feed.url }
            });

            if (error || (data && data.error)) {
                console.warn(`🚫 Feed ignorado por erro (${feed.name}):`, error || data.error);
                return;
            }

            if (!data || !data.items) return;

            if (feed.name === 'Nova Fonte' || feed.name === 'Sem Título') {
                feedsThatNeedUpdate.push({ id: feed.id, name: data.title });
            }

            const sourceName = data.title || feed.name;
            const sourceLogo = data.image || `https://ui-avatars.com/api/?name=${sourceName}&background=random`;

            const items = data.items.map(item => ({
                id: `${feed.id}-${item.id || Math.random()}`,
                source: sourceName,
                logo: sourceLogo,
                time: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoje',
                rawDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                title: item.title,
                summary: item.summary ? item.summary.slice(0, 150) + '...' : '',
                category: feed.category || 'Geral',
                img: item.img || null, 
                link: item.link,
                origin: 'rss'
            }));

            allItems.push(...items);

        } catch (err) {
            console.error(`Erro de conexão no feed ${feed.name}`);
        }
    });

    await Promise.all(promises);

    if (feedsThatNeedUpdate.length > 0) {
        setUserFeeds(prev => prev.map(f => {
            const update = feedsThatNeedUpdate.find(u => u.id === f.id);
            return update ? { ...f, name: update.name } : f;
        }));
    }

    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
    uniqueItems.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    setRealNews(uniqueItems);
    setIsLoadingFeeds(false);
  }, [userFeeds]); // A dependência garante que a função só é recriada se `userFeeds` mudar.


  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // OTIMIZAÇÃO: Funções envolvidas em `useCallback`
  const handleToggleSave = useCallback((article) => {
    setSavedItems((prev) => {
      const exists = prev.find((i) => i.id === article.id);
      if (exists) {
        return prev.filter((i) => i.id !== article.id);
      } else {
        return [{ ...article, readProgress: 0, date: 'Agora', source: article.source || article.name }, ...prev];
      }
    });
  }, []);

  const handleRemoveSavedItem = useCallback((idToRemove) => {
    setSavedItems((prevItems) => prevItems.filter((item) => item.id !== idToRemove));
  }, []);

  const handleOpenArticle = useCallback((article) => {
    setSelectedArticle(article);
    setReadHistory((prev) => {
      if (!prev.includes(article.id)) {
        return [...prev, article.id];
      }
      return prev;
    });
  }, []);

  const closeArticle = useCallback(() => setSelectedArticle(null), []);
  const closeOutlet = useCallback(() => setSelectedOutlet(null), []);
  const closeStory = useCallback(() => setSelectedStory(null), []);
  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  
  const isMainViewReceded = !!selectedArticle || !!selectedOutlet || !!selectedStory;
  
  const navTimerRef = useRef(null);
  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => setIsNavVisible(false), 3000);
  }, []);

  const showNavBar = useCallback(() => {
    if (!isNavVisible) setIsNavVisible(true);
  }, [isNavVisible]);

  return (
    <div className={`min-h-[100dvh] font-sans overflow-hidden selection:bg-blue-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 text-zinc-100' : 'bg-slate-100 text-zinc-900'}`}>      
      
      <div className={`transition-all duration-500 transform h-[100dvh] flex flex-col ${isMainViewReceded ? `scale-[0.9] pointer-events-none` : 'scale-100 opacity-100'}`}>
         
          <HeaderDashboard isDarkMode={isDarkMode} onOpenSettings={openSettings} />

          <main className="flex-1 overflow-y-auto pb-40 px-4 md:px-6 scrollbar-hide pt-2">
            {activeTab === 'happening' && <HappeningTab openArticle={handleOpenArticle} openStory={setSelectedStory} isDarkMode={isDarkMode} />}
            {activeTab === 'feed' && <FeedTab openArticle={handleOpenArticle} isDarkMode={isDarkMode} selectedArticleId={selectedArticle?.id} savedItems={savedItems} onToggleSave={handleToggleSave} readHistory={readHistory} newsData={realNews} isLoading={isLoadingFeeds} />}
            {activeTab === 'banca' && <BancaTab openOutlet={setSelectedOutlet} isDarkMode={isDarkMode} />}
            {activeTab === 'youtube' && <YouTubeTab openStory={setSelectedStory} savedItems={savedItems} onToggleSave={handleToggleSave} isDarkMode={isDarkMode} />}
            {activeTab === 'saved' && <SavedTab isDarkMode={isDarkMode} openArticle={handleOpenArticle} items={savedItems} onRemoveItem={handleRemoveSavedItem}/>}
          </main>

        <div className="fixed bottom-0 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
          <nav onClick={showNavBar} className={`pointer-events-auto w-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isNavVisible ? 'translate-y-0' : 'translate-y-[85%] cursor-pointer hover:translate-y-[82%]'} relative overflow-hidden flex flex-col border-t shadow-[0_0_20px_rgba(0,0,0,0.5)] border-white/60 rounded-t-[2rem] rounded-b-none ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-900'}`}>
            <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-blue-600/20 blur-[60px] rounded-full animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[200%] bg-emerald-600/10 blur-[50px] rounded-full pointer-events-none" />
            <div className="w-full flex justify-center pt-1 pb-1 relative z-20"><div className={`w-12 h-1.5 rounded-full transition-all duration-300 ${isNavVisible ? 'bg-white/10' : 'bg-white/40 w-20 shadow-[0_0_10px_rgba(255,255,255,0.3)]'}`} /></div>
            <div className={`relative z-10 w-full flex justify-between items-center max-w-7xl mx-auto px-8 pb-4 pt-2 transition-opacity duration-300 ${isNavVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}> 
                <TabButton icon={<Sparkles size={24} />} label="Agora" active={activeTab === 'happening'} onClick={() => handleTabClick('happening')} isDarkMode={isDarkMode} />
                <TabButton icon={<Rss size={24} />} label="Feed" active={activeTab === 'feed'} onClick={() => handleTabClick('feed')} isDarkMode={isDarkMode} />
                <TabButton icon={<LayoutGrid size={24} />} label="Banca" active={activeTab === 'banca'} onClick={() => handleTabClick('banca')} isDarkMode={isDarkMode} />
                <TabButton icon={<Youtube size={24} />} label="Vídeos" active={activeTab === 'youtube'} onClick={() => handleTabClick('youtube')} isDarkMode={isDarkMode} />
                <TabButton icon={<Bookmark size={24} />} label="Salvos" active={activeTab === 'saved'} onClick={() => handleTabClick('saved')} isDarkMode={isDarkMode} />
            </div>
          </nav>
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
          article={selectedArticle} 
          feedItems={realNews.length > 0 ? realNews : FEED_NEWS} 
          isOpen={!!selectedArticle} 
          onClose={closeArticle} 
          onArticleChange={handleOpenArticle} 
          onToggleSave={handleToggleSave}
          isSaved={savedItems.some(i => i.id === selectedArticle?.id)}
          isDarkMode={isDarkMode} 
      />
      
      {selectedOutlet && <OutletDetail outlet={selectedOutlet} onClose={closeOutlet} openArticle={handleOpenArticle} isDarkMode={isDarkMode} />}
      
      {selectedStory && (
          <StoryOverlay 
              story={selectedStory} 
              onClose={closeStory} 
              openArticle={handleOpenArticle} 
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

function StoryOverlay({ story, onClose, openArticle }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reinicia o índice se mudar de story
  useEffect(() => { setCurrentIndex(0); }, [story]);

  const handleNext = () => { 
    if (currentIndex < story.items.length - 1) setCurrentIndex(p => p + 1); 
    else onClose(); 
  };
  
  const handlePrev = () => { 
    if (currentIndex > 0) setCurrentIndex(p => p - 1); 
  };

  const currentItem = story.items[currentIndex];

  const handleOpenArticleFromStory = () => {
      onClose(); // Fecha o story
      // Abre o artigo completo passando os dados do story
      openArticle({ 
        id: currentItem.id || 999, // ID de segurança
        title: currentItem.title, 
        source: story.name, 
        img: currentItem.img, 
        category: 'Story',
        time: currentItem.time,
        summary: 'Resumo gerado a partir do story visual...', // Texto genérico para preencher
        origin: 'story' 
      });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-in zoom-in-95 duration-300">
       {/* Container Central (simula celular) */}
       <div className="relative w-full h-full md:max-w-[60vh] md:aspect-[9/16] md:mx-auto md:my-auto md:rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl border border-zinc-800">
        
        {/* Imagem de Fundo */}
        <div className="absolute inset-0">
            <img src={currentItem.img} className="w-full h-full object-cover" alt="Story" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        </div>

        {/* Barra de Progresso e Cabeçalho */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-8 md:pt-6 z-20 space-y-3">
          {/* Barras */}
          <div className="flex gap-1 h-1">
              {story.items.map((item, idx) => (
                  <div key={item.id} className="flex-1 bg-white/30 rounded-full overflow-hidden h-full">
                      <div className={`h-full bg-white transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-[progress_5s_linear]' : 'w-0'}`} />
                  </div>
              ))}
          </div>

          {/* Info do Canal e Botão Fechar */}
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-white/20 p-[2px]">
                      <img src={story.avatar} className="w-full h-full rounded-full" alt="Avatar" />
                  </div>
                  <div>
                      <span className="text-white font-bold text-sm block shadow-black drop-shadow-md">{story.name}</span>
                      <span className="text-zinc-300 text-xs block shadow-black drop-shadow-md">{currentItem.time}</span>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/80 hover:text-white backdrop-blur-sm rounded-full bg-white/10">
                  <X size={24} />
              </button>
          </div>
        </div>

        {/* Áreas de Toque (Esquerda/Direita) */}
        <div className="absolute inset-0 z-10 flex">
            <div className="w-[30%] h-full" onClick={handlePrev} />
            <div className="w-[70%] h-full" onClick={handleNext} />
        </div>
        {/* --- SETINHAS ESTILO INSTAGRAM (NOVO) --- */}
{/* Seta Esquerda (só aparece se não for o primeiro) */}
{currentIndex > 0 && (
  <button 
    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 group"
  >
    <div className="bg-white/10 rounded-full p-1 group-hover:scale-110 transition-transform">
      <ChevronLeft size={24} />
    </div>
  </button>
)}

{/* Seta Direita */}
<button 
  onClick={(e) => { e.stopPropagation(); handleNext(); }}
  className="absolute right-2 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 group"
>
  <div className="bg-white/10 rounded-full p-1 group-hover:scale-110 transition-transform">
    <ChevronRight size={24} />
  </div>
</button>

        {/* Rodapé com Título e Botão de Ação */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pb-12 md:pb-6">
            <h2 className="text-white text-2xl font-bold leading-tight mb-6 drop-shadow-xl font-serif">
                {currentItem.title}
            </h2>
            <button 
                onClick={(e) => { e.stopPropagation(); handleOpenArticleFromStory(); }} 
                className="w-full bg-white text-black font-bold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
            >
                Ler Notícia Completa <ArrowRight size={16} />
            </button>
        </div>
       </div>

       {/* Fundo desfocado para telas grandes */}
       <div className="fixed inset-0 -z-10 bg-zinc-900/90 backdrop-blur-xl md:block hidden" onClick={onClose} />
    </div>
  );
}

function ArticlePanel({ article, feedItems, isOpen, onClose, onArticleChange, onToggleSave, isSaved, isDarkMode }) {
  const [viewMode, setViewMode] = useState('web'); 
  const [htmlContent, setHtmlContent] = useState('');
  const [readerContent, setReaderContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isStoryMode = article?.origin === 'story';
  
  // Estados para redimensionamento
  const [width, setWidth] = useState(60); 
  const [isDragging, setIsDragging] = useState(false);

  // Estado do Navegador de Feed
  const [isFeedListOpen, setIsFeedListOpen] = useState(false);

  // Efeito ao abrir
  useEffect(() => {
    if (isOpen && article?.link && !isStoryMode) {
      if (viewMode === 'ai') setViewMode('web');
      
      setHtmlContent('');
      setReaderContent(null);
      setError(false);
      setIsLoading(true);
      setIsFeedListOpen(false); 

      const loadSite = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('proxy-view', {
                body: { url: article.link }
            });
            if (error || !data) throw new Error("Falha no proxy");
            setHtmlContent(data.html); 
            setReaderContent(data.reader); 
        } catch (err) {
            console.warn("Erro ao carregar site:", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
      };
      loadSite();
    }
  }, [isOpen, article]);
  
  // Lógica de Redimensionamento
  const handleStart = (e) => {
      e.preventDefault();
      setIsDragging(true);
  };
  const handleMove = (clientX) => {
    if (!isDragging) return;
    const newWidth = ((window.innerWidth - clientX) / window.innerWidth) * 100;
    if (newWidth > 30 && newWidth < 95) setWidth(newWidth);
  };
  const handleEnd = () => {
      setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const baseClasses = `fixed z-[5000] flex flex-col overflow-hidden shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`;
  
  // CORREÇÃO: Voltamos ao modelo de painel lateral
  const feedClasses = `inset-y-0 right-0 md:rounded-l-[2.5rem] border-l ${isDarkMode ? 'border-white/10' : 'border-zinc-200'} ${isDragging ? 'transition-none duration-0' : ''} ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
  
  // CORREÇÃO: O estilo dinâmico de largura está de volta
  const feedStyle = { 
    width: isOpen ? 
      (typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${width}%`) 
      : '0%' 
  };
  
  const openExternal = () => { if (article?.link) window.open(article.link, '_blank'); };
  const toggleAudio = () => setIsPlaying(!isPlaying);

  // ... (O componente FeedNavigator continua igual) ...
  const FeedNavigator = () => {
      if (!isOpen) return null;
      const relatedNews = Array.isArray(feedItems) ? feedItems.filter(item => item && item.id) : [];
      const currentIndex = relatedNews.findIndex(item => item.id === article?.id);
      const hasPrev = currentIndex > 0;
      const hasNext = currentIndex > -1 && currentIndex < relatedNews.length - 1;
      const handlePrev = (e) => { e.stopPropagation(); if (hasPrev) onArticleChange(relatedNews[currentIndex - 1]); };
      const handleNext = (e) => { e.stopPropagation(); if (hasNext) onArticleChange(relatedNews[currentIndex + 1]); };
      const [position, setPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 140 : 500 });
      const [isDraggable, setIsDraggable] = useState(false);
      const dragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0, hasMoved: false });
      const handlePointerDown = (e) => {
          if (e.target.closest('.no-drag')) return;
          e.preventDefault();
          dragRef.current = { startX: e.clientX, startY: e.clientY, initialLeft: position.x, initialTop: position.y, hasMoved: false };
          setIsDraggable(true);
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
          setIsDraggable(false);
          window.removeEventListener('pointermove', handlePointerMoveDrag);
          window.removeEventListener('pointerup', handlePointerUpDrag);
      };
      const handleToggle = () => { if (!dragRef.current.hasMoved) setIsFeedListOpen(!isFeedListOpen); };

      return (
          <>
            {isFeedListOpen && (<div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-[5001] transition-opacity" onClick={() => setIsFeedListOpen(false)} />)}
            <div className="absolute z-[5002] w-80 transition-shadow duration-300" style={{ left: position.x, top: position.y, cursor: isDraggable ? 'grabbing' : 'grab', touchAction: 'none' }} onPointerDown={handlePointerDown}>
                <div className={`overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-300 border dark:border-white/10 no-drag absolute bottom-full left-0 w-full mb-2 origin-bottom ${isFeedListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                    <div className="p-3 border-b dark:border-white/10 flex justify-between items-center bg-transparent"><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Seu Feed</span><button onClick={() => setIsFeedListOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><X size={14}/></button></div>
                    <div className="overflow-y-auto max-h-[40vh] p-1 space-y-1 custom-scrollbar" onPointerDown={(e) => e.stopPropagation()}>{relatedNews.map((item) => (<div key={item.id} onClick={() => { onArticleChange(item); setIsFeedListOpen(false); }} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${item.id === article?.id ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}><img src={item.img} className="w-10 h-10 rounded-lg object-cover bg-zinc-200 shrink-0" onError={(e) => e.target.style.display = 'none'} /><div className="flex-1 min-w-0"><h4 className={`text-xs font-bold leading-snug line-clamp-2 ${item.id === article?.id ? 'text-blue-600 dark:text-blue-400' : 'dark:text-zinc-200'}`}>{item.title}</h4><span className="text-[9px] opacity-50 truncate block">{item.source}</span></div></div>))}</div>
                </div>
                <div onClick={handleToggle} className={`flex items-center justify-between p-2 pl-2 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-transform active:scale-95 group select-none ${isDarkMode ? 'bg-zinc-900/80' : 'bg-black/80'}`}><div className="flex items-center gap-3 min-w-0 pointer-events-none"><div className="relative"><div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-20"></div><img src={article?.logo} className="relative w-8 h-8 rounded-full border border-white/20 object-cover bg-white" onError={(e) => e.target.style.display = 'none'} /></div><div className="flex flex-col min-w-0 pr-1"><span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider leading-none">{isDraggable ? 'Movendo...' : 'Lendo'}</span><span className="text-xs text-white font-bold truncate leading-tight max-w-[100px]">{article?.source}</span></div></div><div className="flex items-center gap-1 no-drag"><button onPointerDown={(e) => e.stopPropagation()} onClick={handlePrev} disabled={!hasPrev} className={`p-1.5 rounded-full transition-colors ${hasPrev ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronLeft size={18} /></button><button onPointerDown={(e) => e.stopPropagation()} onClick={handleNext} disabled={!hasNext} className={`p-1.5 rounded-full transition-colors ${hasNext ? 'text-white hover:bg-white/20' : 'text-zinc-600 cursor-not-allowed'}`}><ChevronRight size={18} /></button><div className="w-px h-4 bg-white/20 mx-1"></div><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFeedListOpen ? 'bg-white/20 text-white' : 'text-zinc-400 group-hover:text-white'}`}>{isDraggable ? <GripVertical size={14} /> : <LayoutGrid size={14} />}</div></div></div>
            </div>
          </>
      )
  }

  return (
    <div className={`${baseClasses} ${feedClasses}`} style={feedStyle}>
        
        {/* --- ALÇA DE REDIMENSIONAMENTO (DENTRO do painel) --- */}
        {!isStoryMode && (
             <div 
                onMouseDown={handleStart} 
                onTouchStart={handleStart}
                className="absolute left-0 top-0 bottom-0 w-8 z-50 hidden md:flex items-center justify-center cursor-ew-resize touch-none group"
            >
                <div className={`h-24 w-1.5 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-blue-500 scale-y-110' : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'}`}>
                    <GripVertical size={16} className={`transition-opacity duration-300 ${isDragging ? 'text-white' : 'text-transparent group-hover:text-zinc-500 dark:group-hover:text-zinc-400'}`} />
                </div>
            </div>
        )}

        {/* --- ESTRUTURA INTERNA DO PAINEL --- */}
        <div className="flex-1 w-full flex flex-col overflow-hidden">
            
            {/* CABEÇALHO */}
            <div className={`flex-shrink-0 px-4 py-3 flex items-center justify-between border-b backdrop-blur-xl z-20 ${isDarkMode ? 'bg-zinc-900/90 border-white/5' : 'bg-white/90 border-zinc-200'}`}>
                <button onClick={onClose} className={`flex items-center gap-1 pr-4 py-2 text-sm font-medium transition ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    <ChevronLeft size={22} />
                </button>
                <div className={`p-1 rounded-full flex relative border shadow-sm mx-auto ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
                    <div className={`absolute top-1 bottom-1 w-[50%] rounded-full shadow-sm border transition-all duration-300 ${viewMode !== 'ai' ? 'left-1' : 'left-[48%]'} ${isDarkMode ? 'bg-zinc-800 border-white/10' : 'bg-white border-zinc-200'}`} />
                    <button onClick={() => setViewMode('web')} className={`relative px-6 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-2 ${viewMode !== 'ai' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-zinc-500'}`}><Globe size={14} /> Web</button>
                    <button onClick={() => setViewMode('ai')} className={`relative px-6 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-2 ${viewMode === 'ai' ? 'text-purple-500' : 'text-zinc-500'}`}><Sparkles size={14} /> IA</button>
                </div>
                <div className="flex items-center justify-end gap-2 w-20">
                    <button onClick={() => setViewMode(viewMode === 'reader' ? 'web' : 'reader')} className={`p-2 rounded-full transition ${viewMode === 'reader' ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black')}`}><Type size={20} /></button>
                    <button onClick={() => onToggleSave(article)} className={`p-2 rounded-full transition ${isSaved ? 'text-purple-500 bg-purple-500/10' : (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black')}`}><Bookmark size={20} fill={isSaved ? "currentColor" : "none"} /></button>
                    <button className={`p-2 rounded-full transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black'}`}><Share size={20} /></button>
                </div>
            </div>

            {/* ÁREA DE CONTEÚDO */}
            <div className="flex-1 relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {isOpen && article && (
                    <>
                        {viewMode === 'web' && ( <div className="w-full h-full relative">{isLoading ? (<div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 z-10"><Loader2 size={32} className="animate-spin text-blue-500 mb-3" /><p className="text-xs font-bold uppercase tracking-wider opacity-50">Carregando Site...</p></div>) : error ? (<div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 z-10"><div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4"><Globe size={32}/></div><h3 className="text-lg font-bold mb-2">Não foi possível carregar aqui</h3><button onClick={openExternal} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition">Abrir no Safari</button></div>) : htmlContent && (<><iframe srcDoc={htmlContent} className="w-full h-full border-none bg-white" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" title="Web Browser" /><FeedNavigator /></>)}</div>)}
                        {viewMode === 'reader' && (<div className="max-w-3xl mx-auto p-8 md:p-12 overflow-y-auto h-full pb-32 animate-in fade-in bg-white dark:bg-zinc-950">{isLoading && !readerContent ? (<div className="flex flex-col items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-zinc-400 mb-2"/><p className="text-sm opacity-50">Formatando texto...</p></div>) : readerContent ? (<><span className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-4 block">{readerContent.siteName || article?.source}</span><h1 className={`text-3xl md:text-5xl font-serif font-black leading-tight mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{readerContent.title || article?.title}</h1>{article?.img && (<div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-sm"><img src={article.img} className="w-full h-full object-cover" /></div>)}<div className={`prose prose-lg prose-zinc max-w-none font-serif leading-loose ${isDarkMode ? 'prose-invert text-zinc-300' : 'text-zinc-800'}`} dangerouslySetInnerHTML={{ __html: readerContent.content }} /></>) : !isLoading && (<div className="text-center py-20 opacity-50"><p>Não foi possível extrair o texto completo.</p></div>)}<FeedNavigator /></div>)}
                        {viewMode === 'ai' && ( <div className="max-w-2xl mx-auto p-8 overflow-y-auto h-full pb-32 animate-in fade-in bg-white dark:bg-zinc-950"><span className="text-purple-500 font-bold text-xs uppercase tracking-widest mb-4 block">Inteligência Artificial</span><h1 className={`text-3xl md:text-4xl font-serif font-black leading-tight mb-8 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{article?.title}</h1><div className={`prose prose-lg ${isDarkMode ? 'prose-invert' : ''}`}><p className="font-bold text-xl opacity-80">Em análise...</p></div></div>)}
                    </>
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
  const fileInputRef = useRef(null);

  // --- LÓGICA DE IMPORTAÇÃO OPML (NOVA) ---
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
        alert(`${importedFeeds.length} fontes importadas!`);
      } else {
        alert("Nenhum feed válido encontrado.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddFeed = () => {
    if (!newUrl) return;
    if (!targetFeed && !targetBanca) {
        alert("Selecione pelo menos um destino.");
        return;
    }
    const newFeed = { 
        id: Date.now(), 
        name: 'Nova Fonte', 
        url: newUrl, 
        category: 'Personalizado',
        display: { feed: targetFeed, banca: targetBanca }
    };
    setFeeds([...feeds, newFeed]);
    setNewUrl('');
    setTargetFeed(true);
    setTargetBanca(false);
  };

  const removeFeed = (id) => {
    setFeeds(feeds.filter(f => f.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">Configurações</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="flex p-1 m-4 mb-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button onClick={() => setActiveTab('sources')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'sources' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>Fontes</button>
            <button onClick={() => setActiveTab('api')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'api' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>IA & API</button>
        </div>

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

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3 block">Adicionar Manualmente</label>
                        <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://site.com/rss" className={`w-full mb-4 px-3 py-2 rounded-lg text-sm outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'}`} />
                        
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

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">Fontes Ativas ({feeds.length})</label>
                        <div className="space-y-2">
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

