"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, Play, Pause, 
  Maximize2, X, Globe, ArrowRight, // <--- Adicionado ArrowRight e ChevronLeft aqui
  Sun, Moon, TrendingUp, CloudSun, CloudMoon, MapPin
} from 'lucide-react';

// --- DADOS MOCKADOS ---

const STORIES = [
  { id: 1, name: 'G1', avatar: 'https://ui-avatars.com/api/?name=G1&background=c0392b&color=fff', items: [{ id: 101, type: 'image', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&q=80', title: 'Chuva recorde', time: '10 min' }] },
  { id: 2, name: 'Verge', avatar: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff', items: [{ id: 201, type: 'image', img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', title: 'Review M3', time: '30 min' }] },
  { id: 3, name: 'CNN', avatar: 'https://ui-avatars.com/api/?name=CN&background=e74c3c&color=fff', items: [{ id: 301, type: 'image', img: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=600&q=80', title: 'Bolsas asiáticas', time: '3h' }] },
];

const FEED_NEWS = [
  { id: 1, source: 'The Verge', logo: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff&rounded=false&font-size=0.5', time: '2h', title: 'Apple Vision Pro ganha versão mais leve', category: 'Tecnologia', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80' },
  { id: 2, source: 'CNN Market', logo: 'https://ui-avatars.com/api/?name=CN&background=e74c3c&color=fff&rounded=false&font-size=0.5', time: '3h', title: 'Dólar cai abaixo de R$ 4,90 com otimismo', category: 'Economia', img: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&q=80' },
  { id: 3, source: 'BBC Science', logo: 'https://ui-avatars.com/api/?name=BB&background=000&color=fff&rounded=false&font-size=0.5', time: '5h', title: 'Telescópio Webb descobre vapor d\'água', category: 'Tecnologia', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80' },
  { id: 4, source: 'Vogue', logo: 'https://ui-avatars.com/api/?name=VG&background=000&color=fff&rounded=false&font-size=0.5', time: '6h', title: 'As tendências de inverno em Paris', category: 'Local', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80' },
  { id: 5, source: 'Politico', logo: 'https://ui-avatars.com/api/?name=PO&background=000&color=fff', time: '7h', title: 'Senado aprova nova lei de trânsito', category: 'Política', img: 'https://images.unsplash.com/photo-1555848960-8c3fd4479802?w=800&q=80' },
];

const BANCA_ITEMS = [
  { id: 1, name: 'Folha de S.Paulo', color: 'bg-[#004990]', layoutType: 'standard', logo: 'FOLHA', headline: 'Reforma Tributária' },
  { id: 2, name: 'Wired', color: 'bg-black', layoutType: 'magazine', logo: 'WIRED', headline: 'Future of AI' },
  { id: 3, name: 'National Geo', color: 'bg-[#FFCC00] text-black', layoutType: 'visual', logo: 'NAT GEO', headline: 'Ocean Secrets' },
  { id: 4, name: 'Le Monde', color: 'bg-[#D6CFC7] text-black', layoutType: 'minimal', logo: 'Le Monde', headline: 'La crise politique' },
  { id: 5, name: 'The NY Times', color: 'bg-zinc-900', layoutType: 'standard', logo: 'The New York Times', headline: 'Global Rally' },
];

const YOUTUBE_FEED = [
  { id: 1, channel: 'MKBHD', category: 'Tech', title: 'Review: O fim dos smartphones?', views: '4M', img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80' },
  { id: 2, channel: 'Manual do Mundo', category: 'Ciência', title: 'Construí um submarino caseiro', views: '1M', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80' },
];

// CATEGORIAS
const FEED_CATEGORIES = ['Tudo', 'Política', 'Tecnologia', 'Economia', 'Saúde', 'Local', 'Carros'];
const YOUTUBE_CATEGORIES = ['Tudo', 'Tech', 'Finanças', 'Ciência', 'Música'];

// --- HEADER DINÂMICO (CORRIGIDO) ---

function HeaderDashboard({ isDarkMode, onToggleTheme }) {
  const [time, setTime] = useState(new Date());
  const [bgImage, setBgImage] = useState(null); // Iniciado com null para evitar erro de hidratação
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    // Relógio
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Lógica Dia/Noite e Imagem
    const hour = new Date().getHours();
    const night = hour < 6 || hour >= 18;
    setIsNight(night);

    // URLs de imagens
    const dayImg = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80"; 
    const nightImg = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80";

    setBgImage(night ? nightImg : dayImg);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-4 md:px-6 pt-4 pb-2 z-20">
      <div className={`relative w-full h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-2xl group ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
        
        {/* Imagem de Fundo (Renderiza apenas se bgImage existir) */}
        <div className="absolute inset-0 transition-transform duration-[10s] ease-linear group-hover:scale-105">
           {bgImage && <img src={bgImage} alt="City Background" className="w-full h-full object-cover" />}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        </div>

        <div className="absolute inset-0 p-8 flex flex-col justify-between">
           {/* Topo */}
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <MapPin size={14} className="text-emerald-400" />
                <span className="text-white text-xs font-bold tracking-wide">São Paulo, BR</span>
              </div>
              <div className="flex gap-3">
                <button onClick={onToggleTheme} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition">
                   {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md">
                   <img src="https://ui-avatars.com/api/?name=Editor&background=10b981&color=fff" alt="User" />
                </div>
              </div>
           </div>

           {/* Base */}
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-1 block">
                  {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">
                  Bom dia, Editor.
                </h1>
                <p className="text-white/80 text-sm mt-2 font-medium max-w-md">
                   O mercado financeiro abre em alta e a previsão é de {isNight ? 'noite clara' : 'sol forte'} na capital.
                </p>
              </div>

              {/* Widgets */}
              <div className="flex gap-3">
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex items-center gap-3 min-w-[100px]">
                    {isNight ? <CloudMoon className="text-blue-300" /> : <CloudSun className="text-yellow-400 animate-pulse" />}
                    <div>
                      <span className="block text-white font-bold text-lg leading-none">24°</span>
                      <span className="text-white/60 text-[10px] uppercase font-bold">Sensação 26°</span>
                    </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex flex-col justify-center min-w-[100px]">
                    <span className="text-white/60 text-[9px] uppercase font-bold mb-1">Dólar PTAX</span>
                    <span className="text-emerald-400 font-bold text-sm">R$ 4,92 ▼</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---

export default function NewsOS_V12() {
  const [activeTab, setActiveTab] = useState('happening'); 
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null); 
  const [selectedStory, setSelectedStory] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); 

  const closeArticle = () => { setSelectedArticle(null); setIsExpanded(false); };
  const closeOutlet = () => setSelectedOutlet(null);
  const closeStory = () => setSelectedStory(null);
  const isMainViewReceded = !!selectedArticle || !!selectedOutlet || !!selectedStory;

  return (
    <div className={`min-h-screen font-sans overflow-hidden selection:bg-emerald-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-black text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* Background Glows */}
      <div className={`fixed top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[130px] pointer-events-none transition-colors duration-700 ${isDarkMode ? 'bg-emerald-900/10' : 'bg-emerald-300/30 mix-blend-multiply'}`} />
      <div className={`fixed bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[130px] pointer-events-none transition-colors duration-700 ${isDarkMode ? 'bg-blue-900/10' : 'bg-blue-300/30 mix-blend-multiply'}`} />

      {/* --- CAMADA 1: FEED PRINCIPAL --- */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform h-screen flex flex-col ${isMainViewReceded ? `scale-[0.95] opacity-50 blur-[2px] pointer-events-none rounded-3xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}` : 'scale-100 opacity-100'}`}>
        <div className={`max-w-5xl mx-auto w-full h-full flex flex-col relative backdrop-blur-3xl border-x shadow-2xl transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/60 border-white/5' : 'bg-white/60 border-zinc-200'}`}>
          
          <HeaderDashboard isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-40 px-4 md:px-6 scrollbar-hide pt-2">
            {activeTab === 'happening' && <HappeningTab openArticle={setSelectedArticle} openStory={setSelectedStory} isDarkMode={isDarkMode} />}
            {activeTab === 'feed' && <FeedTab openArticle={setSelectedArticle} isDarkMode={isDarkMode} selectedArticleId={selectedArticle?.id} />}
            {activeTab === 'banca' && <BancaTab openOutlet={setSelectedOutlet} isDarkMode={isDarkMode} />}
            {activeTab === 'youtube' && <YouTubeTab openStory={setSelectedStory} isDarkMode={isDarkMode} />}
            {activeTab === 'saved' && <SavedTab isDarkMode={isDarkMode} />}
          </main>

          {/* BARRA INFERIOR SÓLIDA */}
          <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center pointer-events-none">
            <nav className={`pointer-events-auto rounded-full px-8 py-4 flex items-center gap-8 md:gap-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 border ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-100'}`}>
              <TabButton icon={<Sparkles size={24} />} label="Agora" active={activeTab === 'happening'} onClick={() => setActiveTab('happening')} isDarkMode={isDarkMode} />
              <TabButton icon={<Layers size={24} />} label="Feed" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} isDarkMode={isDarkMode} />
              <TabButton icon={<LayoutGrid size={24} />} label="Banca" active={activeTab === 'banca'} onClick={() => setActiveTab('banca')} isDarkMode={isDarkMode} />
              <TabButton icon={<Youtube size={24} />} label="Vídeos" active={activeTab === 'youtube'} onClick={() => setActiveTab('youtube')} isDarkMode={isDarkMode} />
              <TabButton icon={<Bookmark size={24} />} label="Salvos" active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} isDarkMode={isDarkMode} />
            </nav>
          </div>
        </div>
      </div>

      {/* --- PAINEIS --- */}
      <ArticlePanel article={selectedArticle} isOpen={!!selectedArticle} onClose={closeArticle} isExpanded={isExpanded} setIsExpanded={setIsExpanded} isDarkMode={isDarkMode} />
      {selectedOutlet && <OutletDetail outlet={selectedOutlet} onClose={closeOutlet} openArticle={setSelectedArticle} isDarkMode={isDarkMode} />}
      {selectedStory && <StoryOverlay story={selectedStory} onClose={closeStory} openArticle={setSelectedArticle} />}
    </div>
  );
}

// --- LIQUID FILTER ---

function LiquidFilterBar({ categories, active, onChange, isDarkMode, accentColor = 'emerald' }) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-4 -mx-4 px-4 sticky top-0 z-10 bg-transparent">
      <div className={`inline-flex items-center p-1.5 rounded-full border shadow-inner ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-200/60 border-zinc-200'}`}>
        {categories.map((cat) => {
          const isActive = active === cat;
          const activeStyle = isActive 
            ? (accentColor === 'red' 
                ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]' 
                : 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]')
            : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-black');
          return (
            <button key={cat} onClick={() => onChange(cat)} className={`relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activeStyle} ${!isActive && 'hover:bg-black/5'}`}>
              {cat}
            </button>
          )
        })}
      </div>
    </div>
  );
}

// --- TAB: FEED ---

function FeedTab({ openArticle, isDarkMode, selectedArticleId }) {
  const [category, setCategory] = useState('Tudo');
  const displayedNews = category === 'Tudo' ? FEED_NEWS : FEED_NEWS.filter(n => n.category === category);

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-500 pb-20">
      <LiquidFilterBar categories={FEED_CATEGORIES} active={category} onChange={setCategory} isDarkMode={isDarkMode} accentColor="emerald" />
      {displayedNews.map((news) => {
        const isSelected = selectedArticleId === news.id;
        return (
          <div key={news.id} onClick={() => openArticle(news)} className={`group relative p-5 rounded-2xl flex gap-6 cursor-pointer transition-all duration-300 active:scale-[0.99] border ${isSelected ? (isDarkMode ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-emerald-500 bg-emerald-50/50 shadow-md') : (isDarkMode ? 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:border-emerald-300 hover:shadow-lg')}`}>
            <div className={`absolute top-5 right-5 z-10 px-2 py-1 rounded-md shadow-sm border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-100'}`}><img src={news.logo} className="h-5 w-auto object-contain opacity-90" alt={news.source} /></div>
            <div className={`w-28 h-28 md:w-40 md:h-32 rounded-xl overflow-hidden flex-shrink-0 relative shadow-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><img src={news.img} className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-500" /></div>
            <div className="flex-1 flex flex-col justify-between py-1 pr-16">
              <div><div className="flex items-center gap-3 mb-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /><span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{news.time}</span></div><h3 className={`text-lg md:text-xl font-bold leading-snug mb-2 font-serif transition-colors ${isDarkMode ? 'text-zinc-100 group-hover:text-emerald-400' : 'text-zinc-900 group-hover:text-emerald-700'}`}>{news.title}</h3></div>
              <span className={`text-[10px] font-bold self-start px-2.5 py-1 rounded-md uppercase tracking-wide border ${isDarkMode ? 'bg-zinc-800 text-zinc-400 border-white/5' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>{news.category}</span>
            </div>
          </div>
        )
      })}
    </div>
  );
}

// --- TAB: YOUTUBE ---

function YouTubeTab({ isDarkMode, openStory }) {
  const [category, setCategory] = useState('Tudo');
  const displayedVideos = category === 'Tudo' ? YOUTUBE_FEED : YOUTUBE_FEED.filter(v => v.category === category);
  
  // YouTube Stories Mock
  const ytStories = [
    { id: 1, name: 'MKBHD', avatar: 'https://ui-avatars.com/api/?name=MK&background=000&color=fff', items: [{ id: 101, img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', title: 'New Studio Tour! (Short)', time: '10m' }] },
    { id: 2, name: 'MrBeast', avatar: 'https://ui-avatars.com/api/?name=MB&background=2980b9&color=fff', items: [{ id: 102, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', title: 'Challenge teaser', time: '1h' }] },
  ];

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in px-2">
      <div className="flex space-x-6 overflow-x-auto pb-2 scrollbar-hide snap-x items-center">
        {ytStories.map((story) => (
          <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group">
            <div className="relative w-[76px] h-[76px] rounded-full p-[3px] bg-gradient-to-tr from-red-600 to-orange-500 group-hover:scale-105 transition-transform duration-300 shadow-lg">
               <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950' : 'border-white'}`}><img src={story.avatar} className="w-full h-full object-cover" /></div>
               <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-1 border-2 border-white"><Play size={10} fill="white" className="text-white"/></div>
            </div>
            <span className={`text-[11px] font-semibold transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`}>{story.name}</span>
          </div>
        ))}
      </div>

      <LiquidFilterBar categories={YOUTUBE_CATEGORIES} active={category} onChange={setCategory} isDarkMode={isDarkMode} accentColor="red" />

      <div className="grid md:grid-cols-2 gap-6">
        {displayedVideos.map((video) => (
            <div key={video.id} className={`rounded-3xl overflow-hidden border shadow-lg hover:shadow-xl transition-all ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-orange-600 p-[2px]"><div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden"><img src={video.img} className="w-full h-full object-cover" /></div></div><div><span className={`text-sm font-bold block ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{video.channel}</span><span className="text-[10px] uppercase font-bold text-zinc-500">{video.category}</span></div></div><MoreHorizontal size={20} className="text-zinc-400" /></div>
            <div className={`relative aspect-video group cursor-pointer overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><img src={video.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors"><div className="bg-white/20 backdrop-blur-sm p-4 rounded-full"><Play size={48} className="text-white drop-shadow-lg fill-white/20" /></div></div></div>
            <div className="px-5 py-4"><h3 className={`text-lg font-bold leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{video.title}</h3></div>
            </div>
        ))}
      </div>
    </div>
  );
}

// --- OUTROS COMPONENTES ---

function HappeningTab({ openArticle, openStory, isDarkMode }) {
  const trending = [{ id: 1, title: 'IA Generativa', source: 'Politico', time: '15m', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80' }];
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex space-x-6 overflow-x-auto px-2 pb-2 scrollbar-hide snap-x items-center">{STORIES.map((story) => (<div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group"><div className="relative w-[76px] h-[76px] rounded-full p-[3px] bg-gradient-to-tr from-emerald-500 to-teal-200 group-hover:scale-105 transition-transform duration-300 shadow-lg"><div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950' : 'border-white'}`}><img src={story.avatar} className="w-full h-full object-cover" /></div></div><span className={`text-[11px] font-semibold transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`}>{story.name}</span></div>))}</div>
      <div className="px-1"><div className={`relative overflow-hidden rounded-[32px] border p-8 shadow-2xl transition-all hover:scale-[1.01] duration-500 ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-gradient-to-br from-zinc-900 to-black text-white border-transparent'}`}><div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/30 blur-[90px]" /><div className="flex items-center gap-3 mb-6 relative z-10"><div className="bg-emerald-400 text-black p-2 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)]"><Sparkles size={20} fill="black" /></div><span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Resumo do Momento</span></div><div className="relative z-10 grid md:grid-cols-3 gap-8"><div className="md:col-span-2"><h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">Mercado global reage: Pacote fiscal e avanços em IA dominam a pauta.</h2><p className="text-zinc-300 text-base leading-relaxed mb-8 font-serif">Nossa IA processou 14 fontes.</p><button onClick={() => openArticle({ title: 'Briefing IA', source: 'NewsOS Intelligence', img: null })} className="py-3.5 px-8 bg-white text-black font-bold text-sm rounded-full hover:bg-zinc-200 transition active:scale-[0.98] flex items-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">Ler Briefing Completo <ArrowRight size={16} /></button></div></div></div></div>
      <div className="px-2"><div className="flex items-center gap-2 mb-4"><TrendingUp size={20} className="text-emerald-500" /><h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Em Alta Agora</h3></div><div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">{trending.map(item => (<div key={item.id} onClick={() => openArticle(item)} className={`min-w-[280px] md:min-w-[320px] rounded-2xl p-4 cursor-pointer snap-center border transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:shadow-lg'}`}><div className="flex gap-4 items-center"><div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 flex-shrink-0"><img src={item.img} className="w-full h-full object-cover" /></div><div><span className="text-[10px] font-bold text-emerald-500 uppercase">{item.source} • {item.time}</span><h4 className={`font-bold leading-snug mt-1 line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{item.title}</h4></div></div></div>))}</div></div>
    </div>
  );
}

function BancaTab({ openOutlet, isDarkMode }) { return (<div className="pt-4 pb-24 animate-in zoom-in-95 duration-500"><h2 className={`text-xl font-bold mb-6 px-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}><LayoutGrid size={20} className="text-emerald-600"/> Sua Banca</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2">{BANCA_ITEMS.map((item) => (<div key={item.id} onClick={() => openOutlet(item)} className={`relative aspect-[3/4] rounded-2xl flex flex-col cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${item.color}`}><div className="p-4 flex justify-center border-b border-white/20 relative z-20 bg-black/10 backdrop-blur-sm"><span className={`font-black tracking-tighter text-2xl uppercase ${item.id === 3 || item.id === 4 ? 'text-black' : 'text-white'}`}>{item.logo}</span></div><div className="flex-1 relative p-4 flex flex-col justify-end"><div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:10px_10px]"></div><div className="relative z-10 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10"><span className={`text-[9px] uppercase tracking-widest font-bold mb-1 block ${item.id === 3 || item.id === 4 ? 'text-black/60' : 'text-white/60'}`}>Manchete do Dia</span><h3 className={`font-serif font-bold leading-tight text-lg ${item.id === 3 || item.id === 4 ? 'text-black' : 'text-white'}`}>{item.headline}</h3></div></div><div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10 pointer-events-none" /></div>))}</div></div>); }
function SavedTab({ isDarkMode }) { return (<div className={`flex flex-col items-center justify-center h-[50vh] gap-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className={`w-20 h-20 rounded-full flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}><Bookmark size={32} className={`opacity-30 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} /></div><p className="text-sm font-medium">Seus artigos salvos aparecerão aqui.</p></div>); }
function TabButton({ icon, label, active, onClick, isDarkMode }) { return (<button onClick={onClick} className={`relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 group ${active ? 'scale-125 -translate-y-2' : 'hover:scale-110'}`}><div className={`p-2 rounded-full transition-all shadow-lg ${active ? 'bg-emerald-500 text-white' : (isDarkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-600')}`}>{icon}</div></button>); }
function ArticlePanel({ article, isOpen, onClose, isExpanded, setIsExpanded, isDarkMode }) { const [viewMode, setViewMode] = useState('web'); const [isPlaying, setIsPlaying] = useState(false); useEffect(() => { if(isOpen) { setViewMode('web'); setIsPlaying(false); } }, [isOpen]); const toggleAudio = () => setIsPlaying(!isPlaying); return (<div className={`fixed inset-y-0 right-0 border-l shadow-[0_0_100px_rgba(0,0,0,0.4)] z-[60] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${isExpanded ? 'w-full' : 'w-[100%] md:w-[65%] lg:w-[55%]'} ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200'}`}><div className={`px-6 py-4 flex items-center justify-between backdrop-blur-md border-b sticky top-0 z-20 ${isDarkMode ? 'bg-zinc-950/90 border-white/5' : 'bg-white/90 border-zinc-100'}`}><div className="flex items-center gap-3"><button onClick={onClose} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'}`}><X size={22} /></button><button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 rounded-full transition hidden md:block ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'}`}><Maximize2 size={20} /></button></div><div className={`p-1 rounded-full flex relative border shadow-inner ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}><div className={`absolute top-1 bottom-1 w-[50%] rounded-full shadow-sm border transition-all duration-300 ${viewMode === 'web' ? 'left-1' : 'left-[48%]'} ${isDarkMode ? 'bg-zinc-700 border-white/10' : 'bg-white border-zinc-200'}`} /><button onClick={() => setViewMode('web')} className={`relative px-5 py-1.5 text-xs font-bold transition-colors z-10 ${viewMode === 'web' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-zinc-500'}`}>Web</button><button onClick={() => setViewMode('ai')} className={`relative px-5 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-1 ${viewMode === 'ai' ? 'text-emerald-500' : 'text-zinc-500'}`}><Sparkles size={12} /> IA</button></div><div className="flex gap-2"><button className={`p-2 transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black'}`}><Share size={20} /></button></div></div>{article && (<div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-zinc-950' : 'bg-white'} relative`}>{viewMode === 'ai' ? (<div className="max-w-3xl mx-auto p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32"><span className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-3 block">{article.category || 'News'}</span><h1 className={`text-3xl md:text-4xl font-serif font-black leading-tight mb-8 tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{article.title}</h1><div className={`rounded-full p-2 pr-6 mb-8 border flex items-center gap-4 transition-all shadow-sm ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}><button onClick={toggleAudio} className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-md transition active:scale-95 flex-shrink-0">{isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-1" />}</button><div className="flex-1"><div className="flex justify-between items-center mb-1"><span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Google Cloud Voice</span><span className={`text-[10px] font-bold font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>01:24 / 03:00</span></div><div className={`h-1.5 w-full rounded-full relative overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}><div className="absolute top-0 left-0 bottom-0 bg-emerald-500 rounded-full transition-all duration-300" style={{ width: '30%' }} /></div></div></div><div className={`prose prose-lg max-w-none font-serif leading-loose ${isDarkMode ? 'prose-invert text-zinc-300' : 'text-zinc-700'}`}><p>Resumo IA aqui...</p><ul className="list-disc pl-5 space-y-3 marker:text-emerald-500"><li>Ponto 1</li><li>Ponto 2</li></ul></div></div>) : (<div className={`h-full flex flex-col items-center justify-center p-10 text-center ${isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-50 text-zinc-400'}`}><Globe size={64} className="mb-6 opacity-20" /><p className="text-lg">Carregando Site Oficial...</p><p className="text-emerald-500 font-bold text-xl mb-8">{article.source}</p><div className={`w-full max-w-lg h-12 rounded-full animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} /><p className="mt-4 text-xs opacity-50">(Aqui entraria o `iframe` do site real)</p></div>)}</div>)}</div>); }
function OutletDetail({ outlet, onClose, openArticle, isDarkMode }) { const renderLayout = () => { const layout = outlet.layoutType; const articles = [1,2,3,4,5,6]; if (layout === 'standard') { return (<div className="grid grid-cols-1 md:grid-cols-12 gap-8"><div className="md:col-span-8 cursor-pointer group" onClick={() => openArticle({ title: 'Manchete do Jornal', source: outlet.name, category: 'Capa' })}><div className={`aspect-video mb-4 rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><img src={`https://source.unsplash.com/random/1200x800?sig=${outlet.id}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /></div><h2 className={`text-4xl font-serif font-black mb-3 leading-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>A Manchete Principal do Dia</h2><p className={`font-serif text-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Um resumo detalhado sobre o principal acontecimento.</p></div><div className={`md:col-span-4 space-y-6 border-l pl-6 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>{articles.slice(0, 4).map((i) => (<div key={i} className="cursor-pointer" onClick={() => openArticle({ title: 'Noticia Curta', source: outlet.name, category: 'Geral' })}><span className="text-[10px] font-bold text-emerald-500 uppercase mb-1 block">Política</span><h4 className={`font-serif font-bold text-xl leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Notícia secundária de grande impacto.</h4></div>))}</div></div>); } if (layout === 'magazine') { return (<div className={`space-y-12 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{articles.slice(0, 3).map((i) => (<div key={i} className={`flex gap-8 group cursor-pointer border-b pb-8 items-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`} onClick={() => openArticle({ title: 'Artigo da Revista', source: outlet.name, category: 'Feature' })}><span className={`text-8xl font-black transition-colors ${isDarkMode ? 'text-zinc-800 group-hover:text-emerald-500/20' : 'text-zinc-100 group-hover:text-emerald-500/20'}`}>0{i}</span><div className="w-full"><span className="text-emerald-500 font-bold tracking-widest uppercase text-xs mb-2 block">Destaque da Semana</span><h3 className={`text-4xl font-bold mb-3 transition-colors ${isDarkMode ? 'text-white group-hover:text-emerald-400' : 'text-zinc-900 group-hover:text-emerald-600'}`}>O Futuro da Tecnologia.</h3><p className="opacity-70 text-lg line-clamp-2 font-serif">Uma análise profunda e visual.</p></div></div>))}</div>); } if (layout === 'visual') { return (<div className="grid grid-cols-2 md:grid-cols-3 gap-4">{articles.map((i) => (<div key={i} onClick={() => openArticle({ title: 'Visual Story', source: outlet.name, category: 'Photo' })} className={`relative group cursor-pointer rounded-xl overflow-hidden aspect-square ${i === 1 ? 'md:col-span-2 md:row-span-2' : ''}`}><img src={`https://source.unsplash.com/random/800x800?sig=${outlet.id + i}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition" /><div className="absolute bottom-0 left-0 p-4"><h3 className="text-white font-bold text-lg leading-tight">Uma história contada através de imagens impactantes.</h3></div></div>))}</div>); } if (layout === 'minimal') { return (<div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{articles.map((i) => (<div key={i} className="flex gap-4 cursor-pointer group" onClick={() => openArticle({ title: 'Quick Read', source: outlet.name, category: 'Brief' })}><div className={`w-16 h-16 rounded bg-zinc-200 flex-shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`} /><div><h4 className={`font-bold text-lg mb-1 group-hover:underline decoration-emerald-500 underline-offset-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Manchete rápida e direta número {i}</h4><p className="text-sm opacity-60 line-clamp-2">Um breve resumo do que aconteceu, sem imagens grandes.</p></div></div>))}</div>); } }; return (<div className={`fixed inset-0 z-[65] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}><div className={`sticky top-0 z-10 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b ${isDarkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-zinc-200'}`}><button onClick={onClose} className={`flex items-center gap-1 text-sm font-bold transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}><ChevronLeft size={20} /> Voltar</button><span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{outlet.name}</span><div className="w-6" /></div><div className={`relative w-full h-[30vh] overflow-hidden shadow-xl`}><div className={`absolute inset-0 ${outlet.color}`} /><div className="absolute inset-0 bg-black/20" /><div className="absolute bottom-0 left-0 p-8 max-w-5xl mx-auto w-full flex items-end justify-between"><div><h1 className="text-6xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">{outlet.logo}</h1><p className="text-white/90 uppercase tracking-widest text-sm font-bold">Edição de Terça-feira</p></div><div className="hidden md:block"><span className="text-white/80 text-xs font-mono border border-white/30 px-2 py-1 rounded">Layout: {outlet.layoutType.toUpperCase()}</span></div></div></div><div className={`max-w-5xl mx-auto p-8 min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>{renderLayout()}</div></div>); }
function StoryOverlay({ story, onClose, openArticle }) { const [currentIndex, setCurrentIndex] = useState(0); useEffect(() => { setCurrentIndex(0); }, [story]); const handleNext = () => { if (currentIndex < story.items.length - 1) setCurrentIndex(p => p + 1); else onClose(); }; const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(p => p - 1); }; const currentItem = story.items[currentIndex]; const handleOpenArticle = (e) => { e.stopPropagation(); onClose(); openArticle({ title: currentItem.title, source: story.name, img: currentItem.img, category: 'Story' }); }; return (<div className="fixed inset-0 z-[70] bg-black flex flex-col animate-in zoom-in-95 duration-300"><div className="relative w-full h-full md:max-w-[60vh] md:aspect-[9/16] md:mx-auto md:my-auto md:rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl border border-zinc-800"><div className="absolute inset-0"><img src={currentItem.img} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" /></div><div className="absolute top-0 left-0 right-0 p-4 pt-8 md:pt-6 z-20 space-y-3"><div className="flex gap-1 h-1">{story.items.map((item, idx) => (<div key={item.id} className="flex-1 bg-white/30 rounded-full overflow-hidden h-full"><div className={`h-full bg-white transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-[progress_5s_linear]' : 'w-0'}`} /></div>))}</div><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full border border-white/20 p-[2px]"><img src={story.avatar} className="w-full h-full rounded-full" /></div><div><span className="text-white font-bold text-sm block shadow-black drop-shadow-md">{story.name}</span><span className="text-zinc-300 text-xs block shadow-black drop-shadow-md">{currentItem.time}</span></div></div><button onClick={onClose} className="p-2 text-white/80 hover:text-white"><X size={24} /></button></div></div><div className="absolute inset-0 z-10 flex"><div className="w-[30%] h-full" onClick={handlePrev} /><div className="w-[70%] h-full" onClick={handleNext} /></div><div className="absolute bottom-0 left-0 right-0 p-6 z-20 pb-12"><h2 className="text-white text-2xl font-bold leading-tight mb-6 drop-shadow-xl font-serif">{currentItem.title}</h2><button onClick={handleOpenArticle} className="w-full bg-white text-black font-bold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-95 transition">Ler Notícia Completa <ArrowRight size={16} /></button></div></div><div className="fixed inset-0 -z-10 bg-zinc-900/90 backdrop-blur-xl md:block hidden" onClick={onClose} /></div>); }