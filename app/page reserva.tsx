"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, PlayCircle, 
  Maximize2, X, ExternalLink, Globe, ArrowRight, ChevronUp,
  Sun, Moon
} from 'lucide-react';

// --- DADOS MOCKADOS (ATUALIZADOS COM LOGOS) ---

const STORIES = [
  { 
    id: 1, 
    name: 'G1', 
    avatar: 'https://ui-avatars.com/api/?name=G1&background=c0392b&color=fff',
    items: [
      { id: 101, type: 'image', duration: 5000, img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&q=80', title: 'Chuva recorde causa alagamentos na capital', time: '10 min' },
      { id: 102, type: 'image', duration: 5000, img: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&q=80', title: 'Novo imposto sobre compras internacionais é aprovado', time: '1h' },
    ]
  },
  { 
    id: 2, 
    name: 'The Verge', 
    avatar: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff',
    items: [
      { id: 201, type: 'image', duration: 5000, img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', title: 'Review: O novo processador M3 Ultra', time: '30 min' },
      { id: 202, type: 'image', duration: 5000, img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80', title: 'Apple Vision Pro 2 pode chegar em 2026', time: '2h' },
    ]
  },
  { 
    id: 3, 
    name: 'CNN', 
    avatar: 'https://ui-avatars.com/api/?name=CNN&background=e74c3c&color=fff',
    items: [
      { id: 301, type: 'image', duration: 5000, img: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=600&q=80', title: 'Bolsas asiáticas fecham em alta histórica', time: '3h' },
    ]
  },
  { 
    id: 4, 
    name: 'Folha', 
    avatar: 'https://ui-avatars.com/api/?name=FL&background=3498db&color=fff',
    items: [
      { id: 401, type: 'image', duration: 5000, img: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&q=80', title: 'Bienal do Livro espera 1 milhão de visitantes', time: '5h' },
    ]
  },
];

const FEED_NEWS = [
  { id: 1, source: 'The Verge', logo: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff&rounded=true', time: '2h', title: 'Apple Vision Pro ganha versão mais leve e barata', category: 'Tech', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80' },
  { id: 2, source: 'CNN Market', logo: 'https://ui-avatars.com/api/?name=CN&background=e74c3c&color=fff&rounded=true', time: '3h', title: 'Dólar cai abaixo de R$ 4,90 com otimismo fiscal', category: 'Finanças', img: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&q=80' },
  { id: 3, source: 'BBC Science', logo: 'https://ui-avatars.com/api/?name=BB&background=000&color=fff&rounded=true', time: '5h', title: 'Telescópio Webb descobre vapor d\'água em exoplaneta rochoso', category: 'Ciência', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80' },
  { id: 4, source: 'Vogue', logo: 'https://ui-avatars.com/api/?name=VG&background=000&color=fff&rounded=true', time: '6h', title: 'As tendências de inverno que dominaram Paris', category: 'Moda', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80' },
  { id: 5, source: 'Estadão', logo: 'https://ui-avatars.com/api/?name=ES&background=f1c40f&color=000&rounded=true', time: '8h', title: 'Novas regras de trânsito entram em vigor nesta segunda', category: 'Cotidiano', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80' },
];

const BANCA_ITEMS = [
  { id: 1, name: 'Folha de S.Paulo', color: 'from-blue-900 to-slate-900', layoutType: 'newspaper', logo: 'FSP' },
  { id: 2, name: 'Wired', color: 'from-zinc-900 to-black', layoutType: 'magazine', logo: 'WRD' },
  { id: 3, name: 'National Geo', color: 'from-yellow-600 to-yellow-900', layoutType: 'magazine', logo: 'NG' },
  { id: 4, name: 'Le Monde', color: 'from-neutral-700 to-neutral-900', layoutType: 'newspaper', logo: 'LM' },
  { id: 5, name: 'The New York Times', color: 'from-zinc-800 to-zinc-950', layoutType: 'newspaper', logo: 'NYT' },
];

const YOUTUBE_FEED = [
  { id: 1, channel: 'MKBHD', title: 'Review: O fim dos smartphones?', views: '4M', img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80' },
  { id: 2, channel: 'Manual do Mundo', title: 'Construí um submarino caseiro', views: '1M', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80' },
];

// --- COMPONENTE PRINCIPAL ---

export default function NewsOS_V5() {
  const [activeTab, setActiveTab] = useState('happening'); 
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null); 
  const [selectedStory, setSelectedStory] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // DARK MODE STATE
  const [isDarkMode, setIsDarkMode] = useState(false); // Começa no modo claro (padrão iPad)

  const closeArticle = () => { setSelectedArticle(null); setIsExpanded(false); };
  const closeOutlet = () => setSelectedOutlet(null);
  const closeStory = () => setSelectedStory(null);

  const isMainViewReceded = !!selectedArticle || !!selectedOutlet || !!selectedStory;

  return (
    <div className={`min-h-screen font-sans overflow-hidden selection:bg-emerald-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-black text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* Background Glows (Adapta ao tema) */}
      <div className={`fixed top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-200/40 mix-blend-multiply'}`} />
      <div className={`fixed bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-200/40 mix-blend-multiply'}`} />

      {/* --- CAMADA 1: FEED PRINCIPAL --- */}
      <div 
        className={`
          transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform h-screen flex flex-col
          ${isMainViewReceded ? `scale-[0.95] opacity-50 blur-[2px] pointer-events-none rounded-3xl overflow-hidden shadow-xl ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}` : 'scale-100 opacity-100'}
        `}
      >
        <div className={`max-w-5xl mx-auto w-full h-full flex flex-col relative backdrop-blur-xl border-x shadow-2xl transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/80 border-white/5' : 'bg-white/80 border-zinc-200'}`}>
          
          {/* Header */}
          <header className={`pt-12 pb-4 px-8 flex justify-between items-center backdrop-blur sticky top-0 z-20 border-b transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/90 border-white/5' : 'bg-white/90 border-zinc-100'}`}>
            <div>
              <h1 className={`text-3xl font-black tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                NewsOS
              </h1>
              <p className="text-[11px] uppercase tracking-widest text-emerald-600 font-bold mt-1">Terça-feira, 9 Dez</p>
            </div>
            
            <div className="flex items-center gap-4">
               {/* BOTÃO TOGGLE DARK/LIGHT */}
               <button 
                 onClick={() => setIsDarkMode(!isDarkMode)}
                 className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
               >
                 {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>

               <div className={`w-10 h-10 rounded-full border overflow-hidden shadow-sm ${isDarkMode ? 'bg-zinc-800 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
                  <img src="https://ui-avatars.com/api/?name=User&background=333&color=fff" alt="User" />
               </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-32 px-4 md:px-6 scrollbar-hide">
            {activeTab === 'happening' && <HappeningTab openArticle={setSelectedArticle} openStory={setSelectedStory} isDarkMode={isDarkMode} />}
            {activeTab === 'feed' && <FeedTab openArticle={setSelectedArticle} isDarkMode={isDarkMode} selectedArticleId={selectedArticle?.id} />}
            {activeTab === 'banca' && <BancaTab openOutlet={setSelectedOutlet} isDarkMode={isDarkMode} />}
            {activeTab === 'youtube' && <YouTubeTab isDarkMode={isDarkMode} />}
            {activeTab === 'saved' && <SavedTab isDarkMode={isDarkMode} />}
          </main>

          {/* Tab Bar */}
          <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none">
            <nav className={`pointer-events-auto backdrop-blur-2xl border rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-8 py-4 flex items-center gap-8 md:gap-12 min-w-[320px] justify-center transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900/80 border-white/10' : 'bg-white/80 border-white/40'}`}>
              <TabButton icon={<Sparkles size={22} />} label="Agora" active={activeTab === 'happening'} onClick={() => setActiveTab('happening')} isDarkMode={isDarkMode} />
              <TabButton icon={<Layers size={22} />} label="Feed" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} isDarkMode={isDarkMode} />
              <TabButton icon={<LayoutGrid size={22} />} label="Banca" active={activeTab === 'banca'} onClick={() => setActiveTab('banca')} isDarkMode={isDarkMode} />
              <TabButton icon={<Youtube size={22} />} label="Vídeos" active={activeTab === 'youtube'} onClick={() => setActiveTab('youtube')} isDarkMode={isDarkMode} />
              <TabButton icon={<Bookmark size={22} />} label="Salvos" active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} isDarkMode={isDarkMode} />
            </nav>
          </div>
        </div>
      </div>

      {/* --- PAINEIS --- */}
      <ArticlePanel article={selectedArticle} isOpen={!!selectedArticle} onClose={closeArticle} isExpanded={isExpanded} setIsExpanded={setIsExpanded} isDarkMode={isDarkMode} />
      {selectedOutlet && <OutletDetail outlet={selectedOutlet} onClose={closeOutlet} openArticle={setSelectedArticle} isDarkMode={isDarkMode} />}
      {selectedStory && <StoryOverlay story={selectedStory} onClose={closeStory} openArticle={setSelectedArticle} />} {/* Stories sempre dark */}
    </div>
  );
}

// --- SUB-COMPONENTES (COM LOGICA DE DARK MODE) ---

function HappeningTab({ openArticle, openStory, isDarkMode }) {
  return (
    <div className="space-y-8 pt-6 animate-in fade-in duration-700">
      {/* Stories */}
      <div className="flex space-x-6 overflow-x-auto px-2 pb-2 scrollbar-hide snap-x items-center">
        {STORIES.map((story) => (
          <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group">
            <div className="relative w-[80px] h-[80px] rounded-full p-[3px] bg-gradient-to-tr from-emerald-500 to-teal-200 group-hover:scale-105 transition-transform duration-300 shadow-sm">
               <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-black' : 'border-white'}`}>
                 <img src={story.avatar} className="w-full h-full object-cover" />
               </div>
            </div>
            <span className={`text-xs font-semibold transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-600 group-hover:text-zinc-900'}`}>{story.name}</span>
          </div>
        ))}
      </div>

      {/* Card IA Resumo (Sempre Dark para destaque, ou adaptativo?) -> Vamos adaptar levemente */}
      <div className="px-2">
        <div className={`relative overflow-hidden rounded-[32px] border p-8 shadow-2xl transition-colors ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-900 text-white border-zinc-800'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px]" />
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <div className="bg-emerald-500 text-black p-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Sparkles size={18} fill="black" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Briefing Matinal</span>
          </div>

          <div className="relative z-10 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">
                  Mercado reage positivamente ao novo pacote fiscal global.
                </h2>
                <p className="text-zinc-400 text-base leading-relaxed mb-6 font-serif">
                  A inteligência artificial analisou 12 fontes principais. O destaque vai para a decisão coordenada dos bancos centrais, impulsionando tecnologia e varejo.
                </p>
                <button 
                  onClick={() => openArticle({ title: 'Briefing IA: Resumo do Mercado', source: 'NewsOS Intelligence', img: null })}
                  className="py-3 px-6 bg-white text-black font-bold text-sm rounded-full hover:bg-zinc-200 transition active:scale-[0.98] flex items-center gap-2 shadow-lg"
                >
                  Ler Resumo Completo <ArrowRight size={16} />
                </button>
            </div>
            <div className="hidden md:flex flex-col justify-end border-l border-white/10 pl-6">
                <div className="space-y-4">
                    <div>
                        <span className="text-xs text-zinc-500 uppercase">Tendência</span>
                        <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">▲ 2.4% <span className="text-sm text-zinc-600 font-normal">Tech</span></div>
                    </div>
                    <div>
                        <span className="text-xs text-zinc-500 uppercase">Fontes</span>
                        <div className="text-lg font-bold text-white">12 Jornais</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedTab({ openArticle, isDarkMode, selectedArticleId }) {
  return (
    <div className="space-y-4 pt-4 animate-in slide-in-from-bottom-8 duration-500 pb-20">
      {FEED_NEWS.map((news) => {
        // HIGHLIGHT LOGIC: Verifica se a noticia é a selecionada
        const isSelected = selectedArticleId === news.id;

        return (
          <div 
            key={news.id} 
            onClick={() => openArticle(news)}
            className={`
              group relative p-5 rounded-2xl flex gap-6 cursor-pointer transition-all duration-300 active:scale-[0.99]
              border 
              ${isSelected 
                  ? (isDarkMode ? 'border-emerald-500 bg-emerald-900/10' : 'border-emerald-500 bg-emerald-50 shadow-md') // ESTADO SELECIONADO
                  : (isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:border-emerald-300 hover:shadow-lg') // ESTADO NORMAL
              }
            `}
          >
            {/* LOGO DA FONTE (Absolute Top Right) */}
            <div className="absolute top-4 right-4 z-10">
               <img src={news.logo} className="w-6 h-6 rounded-full shadow-sm" alt={news.source} />
            </div>

            <div className={`w-32 h-32 md:w-48 md:h-36 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
               <img src={news.img} className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-500" />
            </div>

            <div className="flex-1 flex flex-col justify-between py-1 pr-8"> {/* PR-8 para o texto não bater no logo */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{news.source}</span>
                  <span className="text-[11px] text-zinc-400 font-medium">{news.time}</span>
                </div>
                <h3 className={`text-xl md:text-2xl font-bold leading-snug mb-2 font-serif transition-colors ${isDarkMode ? 'text-zinc-100 group-hover:text-emerald-400' : 'text-zinc-900 group-hover:text-emerald-700'}`}>
                  {news.title}
                </h3>
              </div>
              <span className={`text-[10px] font-bold self-start px-3 py-1 rounded-full uppercase tracking-wide ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                {news.category}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  );
}

function BancaTab({ openOutlet, isDarkMode }) {
  return (
    <div className="pt-4 pb-24 animate-in zoom-in-95 duration-500">
      <h2 className={`text-xl font-bold mb-6 px-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
         <LayoutGrid size={20} className="text-emerald-600"/> Sua Banca
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2">
        {BANCA_ITEMS.map((item) => (
          <div key={item.id} onClick={() => openOutlet(item)} className={`relative aspect-[3/4] rounded-2xl p-6 flex flex-col justify-between cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br ${item.color}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60" />
            <div className="absolute top-0 right-0 p-5 opacity-80"><div className="w-10 h-10 rounded bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-[10px] font-black tracking-tighter text-white shadow-lg">{item.logo}</div></div>
            <div className="relative z-10 mt-auto"><span className="text-[10px] uppercase tracking-widest text-white/80 block mb-2 font-semibold">Edição Diária</span><span className="font-serif text-3xl md:text-4xl font-black leading-none text-white drop-shadow-md">{item.name}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YouTubeTab({ isDarkMode }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 pb-24 pt-4 animate-in fade-in px-2">
      {YOUTUBE_FEED.map((video) => (
        <div key={video.id} className={`rounded-3xl overflow-hidden border shadow-lg hover:shadow-xl transition-all ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'}`}>
           <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-orange-600 p-[2px]"><div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden"><img src={video.img} className="w-full h-full object-cover" /></div></div>
               <span className={`text-sm font-bold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{video.channel}</span>
             </div>
             <MoreHorizontal size={20} className="text-zinc-400" />
           </div>
           <div className={`relative aspect-video group cursor-pointer overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
             <img src={video.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors"><div className="bg-white/20 backdrop-blur-sm p-4 rounded-full"><PlayCircle size={48} className="text-white drop-shadow-lg fill-white/20" /></div></div>
           </div>
           <div className="px-5 py-4">
             <h3 className={`text-lg font-bold leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{video.title}</h3>
             <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{video.views} visualizações • Há 2 dias</p>
           </div>
        </div>
      ))}
    </div>
  );
}

function SavedTab({ isDarkMode }) { 
    return (
        <div className={`flex flex-col items-center justify-center h-[50vh] gap-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <Bookmark size={32} className={`opacity-30 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} />
            </div>
            <p className="text-sm font-medium">Seus artigos salvos aparecerão aqui.</p>
        </div>
    ); 
}

// --- ARTICLE PANEL (ADAPTATIVO) ---

function ArticlePanel({ article, isOpen, onClose, isExpanded, setIsExpanded, isDarkMode }) {
  const [viewMode, setViewMode] = useState('ai');
  useEffect(() => { if(isOpen) setViewMode('ai'); }, [isOpen]);

  return (
    <div 
      className={`
        fixed inset-y-0 right-0 border-l shadow-[0_0_80px_rgba(0,0,0,0.15)] z-[60] flex flex-col
        transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExpanded ? 'w-full' : 'w-[100%] md:w-[65%] lg:w-[55%]'}
        ${isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200'}
      `}
    >
      {/* Top Bar */}
      <div className={`px-6 py-4 flex items-center justify-between backdrop-blur-md border-b sticky top-0 z-20 ${isDarkMode ? 'bg-zinc-950/90 border-white/5' : 'bg-white/90 border-zinc-100'}`}>
        <div className="flex items-center gap-3">
           <button onClick={onClose} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'}`}>
             <X size={22} />
           </button>
           <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 rounded-full transition hidden md:block ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'}`}>
             <Maximize2 size={20} />
           </button>
        </div>

        {/* Pílula Central */}
        <div className={`p-1 rounded-full flex relative border shadow-inner ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
          <div className={`absolute top-1 bottom-1 w-[50%] rounded-full shadow-sm border transition-all duration-300 ${viewMode === 'web' ? 'left-1' : 'left-[48%]'} ${isDarkMode ? 'bg-zinc-700 border-white/10' : 'bg-white border-zinc-200'}`} />
          <button onClick={() => setViewMode('web')} className={`relative px-5 py-1.5 text-xs font-bold transition-colors z-10 ${viewMode === 'web' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-zinc-500'}`}>Web</button>
          <button onClick={() => setViewMode('ai')} className={`relative px-5 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-1 ${viewMode === 'ai' ? 'text-emerald-500' : 'text-zinc-500'}`}><Sparkles size={12} /> IA</button>
        </div>

        <div className="flex gap-2">
           <button className={`p-2 transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black'}`}><Share size={20} /></button>
        </div>
      </div>

      {/* Conteúdo */}
      {article && (
        <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
          {viewMode === 'ai' ? (
            <div className="max-w-3xl mx-auto p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-3 block">{article.category || 'News'}</span>
              <h1 className={`text-3xl md:text-5xl font-serif font-black leading-tight mb-8 tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {article.title}
              </h1>
              
              {article.img && (
                 <div className={`w-full h-[400px] rounded-2xl mb-10 overflow-hidden shadow-lg ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                    <img src={article.img} className="w-full h-full object-cover" />
                 </div>
              )}

              <div className={`prose prose-lg max-w-none font-serif leading-loose ${isDarkMode ? 'prose-invert text-zinc-300' : 'text-zinc-700'}`}>
                <p className="first-letter:text-6xl first-letter:font-bold first-letter:text-emerald-600 first-letter:float-left first-letter:mr-4 first-letter:mt-[-10px]">
                  A inteligência artificial do NewsOS processou o conteúdo original para oferecer uma leitura otimizada. Os relatórios indicam uma mudança estrutural significativa no cenário apresentado.
                </p>
                <h3 className={`font-bold mt-8 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Pontos Chave</h3>
                <ul className="list-disc pl-5 space-y-3 marker:text-emerald-500">
                   <li>O impacto financeiro superou as expectativas dos analistas em 15%.</li>
                   <li>A adoção da tecnologia tem sido mais rápida na Europa do que na América do Norte.</li>
                </ul>
                <p className="mt-6">Concluindo, o cenário é de otimismo moderado.</p>
              </div>
            </div>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center p-10 text-center ${isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-50 text-zinc-400'}`}>
               <Globe size={64} className="mb-6 opacity-20" />
               <p className="text-lg">Visualização Web Original</p>
               <p className="text-emerald-600 font-bold text-xl mb-8">{article.source}</p>
               <div className={`w-full max-w-lg h-12 rounded-full animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- STORY OVERLAY (FIXED CLOSE LOGIC) ---

function StoryOverlay({ story, onClose, openArticle }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => { setCurrentIndex(0); }, [story]);
  const handleNext = () => { if (currentIndex < story.items.length - 1) setCurrentIndex(p => p + 1); else onClose(); };
  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(p => p - 1); };
  const currentItem = story.items[currentIndex];

  // LOGICA CORRIGIDA: FECHAR STORY -> ABRIR ARTIGO
  const handleOpenArticle = (e) => {
      e.stopPropagation();
      onClose(); // Fecha o Story Overlay
      // Pequeno timeout ou chamada direta, como o React batea o estado, vai funcionar
      openArticle({ title: currentItem.title, source: story.name, img: currentItem.img, category: 'Story' });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-in zoom-in-95 duration-300">
       <div className="relative w-full h-full md:max-w-[60vh] md:aspect-[9/16] md:mx-auto md:my-auto md:rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl border border-zinc-800">
        <div className="absolute inset-0"><img src={currentItem.img} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" /></div>
        <div className="absolute top-0 left-0 right-0 p-4 pt-8 md:pt-6 z-20 space-y-3">
          <div className="flex gap-1 h-1">{story.items.map((item, idx) => (<div key={item.id} className="flex-1 bg-white/30 rounded-full overflow-hidden h-full"><div className={`h-full bg-white transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-[progress_5s_linear]' : 'w-0'}`} /></div>))}</div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full border border-white/20 p-[2px]"><img src={story.avatar} className="w-full h-full rounded-full" /></div><div><span className="text-white font-bold text-sm block shadow-black drop-shadow-md">{story.name}</span><span className="text-zinc-300 text-xs block shadow-black drop-shadow-md">{currentItem.time}</span></div></div><button onClick={onClose} className="p-2 text-white/80 hover:text-white"><X size={24} /></button></div>
        </div>
        <div className="absolute inset-0 z-10 flex"><div className="w-[30%] h-full" onClick={handlePrev} /><div className="w-[70%] h-full" onClick={handleNext} /></div>
        
        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pb-12">
            <h2 className="text-white text-2xl font-bold leading-tight mb-6 drop-shadow-xl font-serif">{currentItem.title}</h2>
            <button onClick={handleOpenArticle} className="w-full bg-white text-black font-bold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-95 transition">
                Ler Notícia Completa <ArrowRight size={16} />
            </button>
        </div>
       </div>
       <div className="fixed inset-0 -z-10 bg-zinc-900/90 backdrop-blur-xl md:block hidden" onClick={onClose} />
    </div>
  );
}

function OutletDetail({ outlet, onClose, openArticle, isDarkMode }) {
  const isMagazine = outlet.layoutType === 'magazine';
  return (
    <div className={`fixed inset-0 z-[65] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
      <div className={`sticky top-0 z-10 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b ${isDarkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-zinc-200'}`}><button onClick={onClose} className={`flex items-center gap-1 text-sm font-bold transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}><ChevronLeft size={20} /> Voltar à Banca</button><span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{outlet.name}</span><div className="w-6" /></div>
      <div className={`relative w-full ${isMagazine ? 'h-[50vh]' : 'h-[30vh]'} overflow-hidden shadow-xl`}><div className={`absolute inset-0 bg-gradient-to-br ${outlet.color}`} /><div className="absolute inset-0 bg-black/20" /><div className="absolute bottom-0 left-0 p-8 max-w-5xl mx-auto w-full"><h1 className={`${isMagazine ? 'text-7xl' : 'text-5xl'} font-black text-white tracking-tighter mb-2 drop-shadow-lg`}>{outlet.name}</h1><p className="text-white/90 uppercase tracking-widest text-sm font-bold">Edição Diária • 9 Dezembro</p></div></div>
      <div className={`max-w-5xl mx-auto p-8 min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        {isMagazine ? (
           <div className={`space-y-12 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{[1,2,3].map((i) => (<div key={i} className={`flex gap-8 group cursor-pointer border-b pb-8 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`} onClick={() => openArticle({ title: 'Artigo da Revista', source: outlet.name, category: 'Feature' })}><span className={`text-8xl font-black transition-colors ${isDarkMode ? 'text-zinc-800 group-hover:text-emerald-500/20' : 'text-zinc-100 group-hover:text-emerald-500/20'}`}>0{i}</span><div className="pt-4 w-full"><h3 className={`text-3xl font-bold mb-3 transition-colors ${isDarkMode ? 'text-white group-hover:text-emerald-400' : 'text-zinc-900 group-hover:text-emerald-600'}`}>O Grande Título da Matéria.</h3><p className="opacity-70 text-lg line-clamp-2 font-serif">Um subtítulo elegante que explica o conteúdo.</p></div></div>))}</div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
             <div className="md:col-span-8 cursor-pointer group" onClick={() => openArticle({ title: 'Manchete do Jornal', source: outlet.name, category: 'Capa' })}><div className={`aspect-video mb-4 rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><img src={`https://source.unsplash.com/random/1200x800?sig=${outlet.id}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Cover" /></div><h2 className={`text-4xl font-serif font-black mb-3 leading-tight group-hover:underline decoration-emerald-500 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>A Manchete Principal do Dia</h2><p className={`font-serif text-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p></div>
             <div className={`md:col-span-4 space-y-6 border-l pl-6 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>{[1,2,3,4].map((i) => (<div key={i} className={`cursor-pointer transition p-3 rounded-lg -ml-3 ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-zinc-50'}`} onClick={() => openArticle({ title: 'Noticia Curta', source: outlet.name, category: 'Geral' })}><span className="text-xs font-bold text-emerald-600 uppercase mb-1 block">Política</span><h4 className={`font-serif font-bold text-xl leading-snug ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Título menor de uma notícia secundária.</h4></div>))}</div>
           </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick, isDarkMode }) { 
    return (
        <button onClick={onClick} className={`relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 group ${active ? 'scale-110' : 'hover:scale-105'}`}>
            <div className={`p-2 rounded-2xl transition-colors ${active ? (isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700 shadow-sm') : (isDarkMode ? 'text-zinc-500 group-hover:text-zinc-300 group-hover:bg-zinc-800' : 'text-zinc-400 group-hover:text-zinc-600 group-hover:bg-zinc-50')}`}>
                {icon}
            </div>
            {active && <span className="absolute -bottom-3 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
        </button>
    ); 
}