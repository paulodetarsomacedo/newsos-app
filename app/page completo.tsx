"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Layers, LayoutGrid, Youtube, Bookmark, 
  ChevronLeft, Share, MoreHorizontal, Play, Pause, 
  Maximize2, X, Globe, ArrowRight,
  Sun, Moon, TrendingUp, TrendingDown, CloudSun, CloudMoon, MapPin, 
  Clock, DollarSign, Bitcoin, Activity, Zap, GripVertical,
  FileText, CheckCircle, Trash2, BrainCircuit, Euro, Headphones// <--- FileText está aqui agora
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
  { id: 103, source: 'Medium', title: 'Por que o Design Minimalista está morrendo?', category: 'Design', readProgress: 30, date: '2 dias atrás', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80' },
  { id: 104, source: 'BBC', title: 'Descoberta arqueológica muda o que sabíamos sobre os Maias', category: 'Ciência', readProgress: 100, date: 'Semana passada', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80' },
];

const SAVED_CATEGORIES = ['Tudo', 'Tech', 'Economia', 'Design', 'Ciência'];

// CATEGORIAS
const FEED_CATEGORIES = ['Tudo', 'Política', 'Tecnologia', 'Economia', 'Saúde', 'Local', 'Carros'];
const YOUTUBE_CATEGORIES = ['Tudo', 'Tech', 'Finanças', 'Ciência', 'Música'];

// --- HEADER DINÂMICO (CORRIGIDO) ---

// --- HEADER DINÂMICO ATUALIZADO (CARROSSEL INFINITO) ---

// --- HEADER DINÂMICO CORRIGIDO ---

// --- HEADER "AI COMMAND CENTER" (MODERNO) ---

function HeaderDashboard({ isDarkMode, onToggleTheme }) {
  // Estado para simular o "pensamento" da IA
  const [aiStatus, setAiStatus] = useState("Atualizando feed em tempo real...");
  const [isTyping, setIsTyping] = useState(false);

  // Dados de Mercado (Mantidos para o Ticker)
  const [data, setData] = useState({
    usd:  { val: '4.92', up: false },
    eur:  { val: '5.35', up: true },
    btc:  { val: '342k', up: true },
    ibov: { val: '128k', up: true },
    ndaq: { val: '16k',  up: false },
    ifix: { val: '3.3k', up: true },   
    aapl: { val: '192',  up: true },   
    bbas: { val: '56.40', up: false }, 
    vale: { val: '68.10', up: false }, 
  });

  const TICKERS = [
      { id: 'usd', label: 'USD', icon: DollarSign },
      { id: 'eur', label: 'EUR', icon: Euro },
      { id: 'btc', label: 'BTC', icon: Bitcoin },
      { id: 'ibov', label: 'IBOV', icon: Activity },
      { id: 'aapl', label: 'AAPL', icon: Zap },
      { id: 'vale', label: 'VALE3', icon: TrendingUp },
  ];

  // Efeito de digitação da IA
  useEffect(() => {
    const phrases = [
      "IA analisando 14.000 fontes...",
      "Cruzando dados do mercado financeiro...",
      "Detectando tendências em Brasília...",
      "Personalizando seu resumo matinal..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setAiStatus(phrases[i]);
      i = (i + 1) % phrases.length;
    }, 4000); // Troca a frase a cada 4s
    return () => clearInterval(interval);
  }, []);

  // Componente Ticker Minimalista
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
      <div className={`
        relative w-full overflow-hidden 
        rounded-b-[2.5rem] shadow-2xl border-b border-white/10
        ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-900'}
      `}>
        {/* --- FUNDO AURORA ANIMADO --- */}
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[100%] bg-teal-600/10 blur-[80px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-soft-light"></div>

        <div className="relative px-6 pt-6 pb-4 flex flex-col gap-6">
           
           {/* LINHA 1: PERFIL & TOGGLE */}
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
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

              <button onClick={onToggleTheme} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
                 {isDarkMode ? <Moon size={16} className="text-white"/> : <Sun size={16} className="text-yellow-400"/>}
              </button>
           </div>

           {/* LINHA 2: BARRA DE PESQUISA "AI OMNIBOX" (O GRANDE DESTAQUE) */}
           <div className="relative group">
              {/* Brilho atrás da barra */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur group-hover:opacity-60 transition duration-500"></div>
              
              <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
                 <div className="pl-4 pr-3 text-white/50">
                    <Sparkles size={18} className="animate-pulse text-purple-400" />
                 </div>
                 <input 
                    type="text" 
                    placeholder="Pergunte à NewsOS..." 
                    className="w-full bg-transparent text-white placeholder:text-white/40 text-sm font-medium py-3 outline-none"
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                 />
                 <div className="pr-1.5">
                    <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition">
                       <ArrowRight size={16} />
                    </button>
                 </div>
              </div>
           </div>

           {/* LINHA 3: TICKER DE MERCADO (Mais limpo e integrado) */}
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
  // Estado para visibilidade da barra
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navTimerRef = useRef(null); // Referência para o timer
  const touchStartY = useRef(0);    // Referência para detectar o deslize

  // 1. CRIAR O ESTADO DE HISTÓRICO DE LEITURA
  const [readHistory, setReadHistory] = useState([]);

  // 2. MODIFICAR A FUNÇÃO QUE ABRE A NOTÍCIA
  // Substitua a lógica de abrir o artigo por esta que também marca como lido:
  const handleOpenArticle = (article) => {
    setSelectedArticle(article);
    
    // Se ainda não estiver na lista, adiciona
    if (!readHistory.includes(article.id)) {
      setReadHistory((prev) => [...prev, article.id]);
    }
  };

  // Função chamada ao clicar em um botão da barra
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    
    // 1. Limpa timer anterior se houver
    if (navTimerRef.current) clearTimeout(navTimerRef.current);

    // 2. Define novo timer de 3 segundos para esconder
    navTimerRef.current = setTimeout(() => {
      setIsNavVisible(false);
    }, 3000);
  };

  // Função para mostrar a barra novamente (ao clicar nela quando escondida)
  const showNavBar = () => {
    if (!isNavVisible) {
      setIsNavVisible(true);
      // Opcional: Se quiser que ela suma de novo após 3s sem interação, descomente abaixo:
      // if (navTimerRef.current) clearTimeout(navTimerRef.current);
      // navTimerRef.current = setTimeout(() => setIsNavVisible(false), 3000);
    }
  };

  // Lógica de "Deslizar para baixo" (Swipe Down)
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const distance = touchEndY - touchStartY.current;

    // Se deslizou mais de 30px para baixo, esconde a barra
    if (distance > 30) {
      if (navTimerRef.current) clearTimeout(navTimerRef.current); // Cancela o timer automático
      setIsNavVisible(false);
    }
  };
  

  return (
<div className={`min-h-[100dvh] font-sans overflow-hidden selection:bg-blue-500/30 transition-colors duration-500 bg-slate-900 text-zinc-900`}>      
      {/* Background Glows */}
      <div className={`fixed top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[130px] pointer-events-none transition-colors duration-700 bg-blue-600/10`} />
    <div className={`fixed bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[130px] pointer-events-none transition-colors duration-700 bg-emerald-600/10`} />

      {/* --- CAMADA 1: FEED PRINCIPAL --- */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform h-[100dvh] flex flex-col ${isMainViewReceded ? `scale-[0.9] pointer-events-none` : 'scale-100 opacity-100'}`}>
 <div className={` w-full h-[100dvh] flex flex-col relative border-x shadow-2xl transition-colors duration-300 border-white/5 bg-transparent`}> transform ${isMainViewReceded ? 'scale-[0.9] translate-y-[-20px] rounded-3xl' : 'scale-100 translate-y-0 rounded-none'}
`         
          
          <HeaderDashboard isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-40 px-4 md:px-6 scrollbar-hide pt-2 text-zinc-100">
            {activeTab === 'happening' && <HappeningTab openArticle={setSelectedArticle} openStory={setSelectedStory} isDarkMode={isDarkMode} />}
            {activeTab === 'feed' && <FeedTab openArticle={setSelectedArticle} isDarkMode={isDarkMode} selectedArticleId={selectedArticle?.id} />}
            {activeTab === 'banca' && <BancaTab openOutlet={setSelectedOutlet} isDarkMode={isDarkMode} />}
            {activeTab === 'youtube' && <YouTubeTab openStory={setSelectedStory} isDarkMode={isDarkMode} />}
           {activeTab === 'saved' && <SavedTab isDarkMode={isDarkMode} openArticle={setSelectedArticle} />}
          </main>

{/* BARRA INFERIOR "AURORA" COM AUTO-HIDE E HANDLE */}
<div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
  <nav 
    // Eventos para restaurar e detectar deslize
    onClick={showNavBar}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}

    className={`
      pointer-events-auto 
      w-full 
      
      // ANIMAÇÃO DE ENTRADA/SAÍDA
      transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
      ${isNavVisible ? 'translate-y-0' : 'translate-y-[85%] cursor-pointer hover:translate-y-[82%]'}

      // ESTILOS VISUAIS BASE
      relative overflow-hidden 
      flex flex-col // Mudado para coluna para acomodar o "Handle" no topo
      
      border-t 
      shadow-[0_0_20px_rgba(0,0,0,0.5)] 
      border-white/60 

      rounded-t-[2rem] rounded-b-none 
      
      // Cores de Fundo
      ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-900'}
  `}>

    {/* --- EFEITO AURORA (BACKGROUND) --- */}
    <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-blue-600/20 blur-[60px] rounded-full animate-pulse pointer-events-none" />
    <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[200%] bg-emerald-600/10 blur-[50px] rounded-full pointer-events-none" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

    {/* --- O "HANDLE" (BARRA FINA NO TOPO) --- */}
    {/* Essa área serve para puxar ou indicar que há algo ali quando escondido */}
    <div className="w-full flex justify-center pt-1 pb-1 relative z-20">
      <div className={`
          w-12 h-1.5 rounded-full transition-all duration-300
          ${isNavVisible ? 'bg-white/10' : 'bg-white/40 w-20 shadow-[0_0_10px_rgba(255,255,255,0.3)]'}
      `} />
    </div>

    {/* --- CONTEÚDO DOS BOTÕES --- */}
    {/* Usamos opacity para apagar os ícones quando a barra desce, para ficar mais limpo */}
    <div className={`
        relative z-10 w-full flex justify-between items-center max-w-7xl mx-auto px-8 pb-4 pt-2
        transition-opacity duration-300
        ${isNavVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}> 
        <TabButton icon={<Sparkles size={24} />} label="Agora" active={activeTab === 'happening'} onClick={() => handleTabClick('happening')} isDarkMode={isDarkMode} />
        <TabButton icon={<Layers size={24} />} label="Feed" active={activeTab === 'feed'} onClick={() => handleTabClick('feed')} isDarkMode={isDarkMode} />
        <TabButton icon={<LayoutGrid size={24} />} label="Banca" active={activeTab === 'banca'} onClick={() => handleTabClick('banca')} isDarkMode={isDarkMode} />
        <TabButton icon={<Youtube size={24} />} label="Vídeos" active={activeTab === 'youtube'} onClick={() => handleTabClick('youtube')} isDarkMode={isDarkMode} />
        <TabButton icon={<Bookmark size={24} />} label="Salvos" active={activeTab === 'saved'} onClick={() => handleTabClick('saved')} isDarkMode={isDarkMode} />
    </div>

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

// --- LIQUID FILTER (MODIFICADO) ---

// --- LIQUID FILTER (EFEITO CAMALEÃO / DIFFERENCE) ---

// --- LIQUID FILTER (CORRIGIDO: SEM BLUR PARA O BLEND FUNCIONAR) ---

function LiquidFilterBar({ categories, active, onChange, isDarkMode, accentColor = 'blue', borderColor = { light: 'border-black-200', dark: 'border-white/5' } }) {
  return (
    <div className="w-full flex justify-center sticky top-0 z-30 py-2 pointer-events-none ">
      
      <div className={`
        pointer-events-auto
        flex overflow-x-auto scrollbar-hide snap-x items-center
        max-w-[95%] 
        rounded-full border gap-1 
        p-1.5
        shadow-sm
    
        
        /* O SEGREDO DO VIDRO: */
        backdrop-blur-xl  /* Desfoca o que passa por baixo para não brigar com o texto */
        
        /* COR DE FUNDO SEMI-TRANSPARENTE */
        ${isDarkMode 
          ? `bg-blue/60 border-green/600`   /* Vidro Escuro */
          : `bg-blue/70 border-white-400`   /* Vidro Claro */
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
                  /* BOTÃO ATIVO (Sólido) */
                  ? (accentColor === 'red' 
                      ? 'bg-red-600 text-white shadow-md' 
                      : accentColor === 'yellow'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : accentColor === 'purple'
                      ? 'bg-[#4c1d95] text-white shadow-md shadow-purple-500/20'
      : 'bg-sky-600 text-white shadow-md')
                  
                  : /* BOTÃO INATIVO (LIMPO) */
                    /* Lógica: Se for Dark Mode -> Texto Cinza Claro. Se for Light Mode -> Texto Azul Escuro/Cinza */
                    (isDarkMode 
                      ? 'text-zinc-900 hover:text-white hover:bg-white/10' 
                      : 'text-white hover:text-blue hover:bg-blue-50 ') // Aqui o azul no hover do modo claro
                }
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

// --- TAB: FEED ---

function FeedTab({ openArticle, isDarkMode, selectedArticleId, savedItems, onToggleSave }) {
  const [category, setCategory] = useState('Tudo');
  const displayedNews = category === 'Tudo' ? FEED_NEWS : FEED_NEWS.filter(n => n.category === category);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-24 pt-2 ">
      
      {/* Filtro Líquido */}
      <LiquidFilterBar 
        categories={FEED_CATEGORIES} 
        active={category} 
        onChange={setCategory} 
        isDarkMode={isDarkMode} 
        accentColor="purple" 
       borderColor={{ 
    light: 'border-[white]', 
    dark: 'border-[#a78bfa]' 
  }} 
      />
      
      <div className="flex flex-col gap-4">
        {displayedNews.map((news, index) => {
          const isSelected = selectedArticleId === news.id;
          const isSaved = savedItems?.some((item) => item.id === news.id); 
        

return (
  <div 
    key={news.id} 
    onClick={() => openArticle(news)}
    
    /* [1] LÓGICA DE Z-INDEX DECRESCENTE */
    /* Se selecionado: Z-index máximo (50). 
       Se não: Calcula com base no tamanho da lista menos o índice atual.
       Isso garante que o 1º card fique visualmente "em cima" do 2º, e assim por diante. */
    style={{ zIndex: isSelected ? 50 : (displayedNews.length - index) }}
    
    className={`
      group relative p-4 cursor-pointer 
      
      /* Aumentei a duração para 500ms para o movimento de "flutuar" ser mais elegante */
      transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] 
      
      flex flex-row gap-5 items-stretch
      overflow-visible
      rounded-3xl

      /* [2] EFEITO DE OFFSET (MOVIMENTO Y) */
      ${isSelected 
        ? /* ATIVO: Sobe (-5px) e estilo Ticker/Vidro */
          (isDarkMode 
            ? 'bg-white/5 backdrop-blur-md border border-white/10 -translate-y-[5px] -translate-x-2 shadow-2xl shadow-black/50' 
            : 'bg-black/5 backdrop-blur-md border border-black/10 -translate-y-[5px] -translate-x-2 shadow-2xl shadow-black/20')


        : /* INATIVO: Desce levemente (5px) e fica mais "apagado" */
          (isDarkMode 
            ? 'bg-zinc-900 border border-red/5 translate-y-[5px] hover:translate-y-0 hover:bg-zinc-800' 
            : 'bg-white/60 backdrop-blur-md border border-white/40 -translate-y-[5px] -translate-x-2 shadow-[inset_0_2px_4px_rgba(255,255,255,2.0),inset_0_-2px_4px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.1)]')
            
      }
    `}
  >
    
    {/* IMAGEM */}
    <div className={`
        relative overflow-hidden rounded-2xl flex-shrink-0 shadow-sm
        w-28 h-28 md:w-36 md:h-36
        ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}
    `}>
        <img 
          src={news.img} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={news.title}
        />
        {/* Overlay Roxo na imagem se selecionado */}
        {isSelected && <div className="absolute inset-0 bg-[#4c1d95]/10 mix-blend-overlay" />}
    </div>

    {/* CONTEÚDO DE TEXTO */}
    <div className="flex-1 flex flex-col justify-start gap-1 py-1 min-w-0">
      
      <div>
          {/* CABEÇALHO (LOGO + TEMPO) */}
          <div className="flex justify-between items-center mb-2">
              <div className={`
                  flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border w-fit transition-colors
                  ${isDarkMode 
                     ? 'bg-zinc-950/50 border-white/10 text-zinc-200' 
                     : 'bg-white border-zinc-200 text-zinc-800'}
              `}>
                 <img src={news.logo} className="w-5 h-5 rounded-full" alt="" />
                 <span className="text-xs font-bold tracking-tight">{news.source}</span>
              </div>

              <span className={`text-[10px] font-bold tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {news.time}
              </span>
          </div>

          {/* INDICADOR LENDO AGORA (ROXO) */}
          {isSelected && (
              <div className="flex items-center gap-2 mb-1.5 animate-pulse">
                  <Sparkles size={40} className="text-green-600 dark:text-[#a78bfa]" />
                  <span className="text-[18px] text-[#39ff14] uppercase tracking-widest text-[#4c1d95] dark:text-[#a78bfa] drop-shadow-[0_0_5px_rgba(76,29,149,0.3)]">
                      Lendo Agora
                  </span>
              </div>
          )}

          {/* TÍTULO (AQUI ESTÁ A COR SOLICITADA) */}
          <h3 className={`
              text-lg font-bold leading-snug tracking-tight transition-colors
              ${isSelected 
                 /* MODO CLARO: #4c1d95 (Roxo Escuro) | MODO ESCURO: #a78bfa (Roxo Claro para leitura) */
                 ? 'text-[#4c1d95] dark:text-[#a78bfa]' 
                 : (isDarkMode ? 'text-zinc-100 group-hover:text-purple-400' : 'text-zinc-800 group-hover:text-[#4c1d95]')}
          `}>
            {news.title}
          </h3>
      </div>

      {/* RESUMO */}
      <p className={`
         text-sm leading-relaxed line-clamp-2 font-medium mt-0
         ${isSelected 
            ? (isDarkMode ? 'text-zinc-300' : 'text-zinc-600') 
            : (isDarkMode ? 'text-zinc-500' : 'text-zinc-500')}
      `}>
         {news.summary}
      </p>
{/* --- BARRA DE AÇÕES (CANTO INFERIOR DIREITO) --- */}
{/* Criamos um container Flex para alinhar Tempo, Áudio e Salvar */}
<div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
    
    {/* 1. MICRO-ETIQUETA DE TEMPO DE LEITURA */}
    {/* Só aparece se o mouse estiver em cima (group-hover) ou sempre visível se preferir. 
        Aqui deixei sempre visível mas discreto. */}
    <div className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded-lg border backdrop-blur-md select-none
        transition-colors duration-300
        ${isDarkMode 
           ? 'bg-black/20 border-white/5 text-zinc-400' 
           : 'bg-white/40 border-black/5 text-zinc-500'}
    `}>
        <Clock size={10} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
        <span className="text-[9px] font-bold uppercase tracking-wider">
            {news.readTime || '3 min'}
        </span>
    </div>

    {/* 2. BOTÃO DE ÁUDIO (OUVIR) */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        alert(`Iniciando leitura por IA de: ${news.title}`); // Aqui entraria sua lógica de player
      }}
      className={`
        p-2 rounded-full transition-all duration-300 active:scale-90 group/audio relative overflow-hidden
        ${isDarkMode 
          ? 'bg-black/20 hover:bg-[#4c1d95] text-zinc-400 hover:text-white' 
          : 'bg-white/40 hover:bg-[#4c1d95] text-zinc-500 hover:text-white'}
      `}
      title="Ouvir Resumo"
    >
       <Headphones size={18} className="relative z-10" />
    </button>

    {/* 3. BOTÃO SALVAR (MANTIDO E INTEGRADO) */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleSave(news);
      }}
      className={`
        p-2 rounded-full transition-all duration-300 active:scale-75 group/save
        ${isSaved
          ? 'bg-[#4c1d95] text-white shadow-lg shadow-purple-500/30'
          : (isDarkMode 
              ? 'bg-black/20 hover:bg-[#4c1d95]/20 text-zinc-400 hover:text-[#a78bfa]' 
              : 'bg-white/40 hover:bg-[#4c1d95]/10 text-zinc-500 hover:text-[#4c1d95]')
        }
      `}
      title="Salvar para ler depois"
    >
      <Bookmark 
        size={18} 
        fill={isSaved ? "currentColor" : "none"} 
        className="transition-transform group-hover/save:scale-110" 
      />
    </button>

</div>
    </div>
    
  </div>
)
        })}
      </div>
    </div>
  );
}

import { Search } from 'lucide-react'; // Certifique-se de importar o Search

// --- FILTRO VERTICAL ESQUERDO (YOUTUBE) - AJUSTADO ---
function YouTubeVerticalFilter({ categories, active, onChange, isDarkMode }) {
  return (
    <div className="fixed left-2 top-[400px] z-30 flex flex-col items-center pointer-events-none">
      
      <div className={`
        pointer-events-auto
        flex flex-col gap-2 p-1.5
        rounded-2xl border shadow-xl backdrop-blur-xl
        transition-colors duration-300
        items-center
        ${isDarkMode 
          ? 'bg-zinc-900/80 border-red-900/30' 
          : 'bg-white/80 border-red-100'
        }
      `}>
        {/* LISTA DE CATEGORIAS */}
        {categories.map((cat) => {
          const isActive = active === cat;
          
          return (
            <button 
              key={cat} 
              onClick={() => onChange(cat)} 
              className={`
                relative 
                px-1 py-4
                text-sm
                rounded-2xl font-bold transition-all duration-300
                flex items-center justify-center
                ${isActive 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105' 
                  : (isDarkMode ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300' : 'text-zinc-400 hover:bg-black/5 hover:text-red-600')
                }
              `}
            >
              <span 
                style={{ 
                    writingMode: 'vertical-rl', 
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)' 
                }} 
                className="uppercase tracking-wider whitespace-nowrap"
              >
                {cat}
              </span>
            </button>
          )
        })}

        {/* --- DIVISÓRIA --- */}
        <div className={`w-full h-[1px] my-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />

        {/* --- BARRA DE PESQUISA VERTICAL --- */}
        {/* O container externo mantém o layout da coluna */}
        <div className="relative w-8 h-32 flex items-center justify-center py-2">
            
            {/* O container interno gira -90 graus para ficar vertical */}
            <div className={`
                absolute
                flex items-center gap-2 px-3 py-2
                rounded-2xl border transition-all duration-300
                w-32 /* Largura vira Altura visualmente */
                ${isDarkMode 
                    ? 'bg-zinc-800 border-white/10 text-white focus-within:border-red-500' 
                    : 'bg-zinc-100 border-zinc-200 text-zinc-800 focus-within:border-red-500'}
            `}
            style={{
                transform: 'rotate(-90deg)', // Gira para ficar em pé
                transformOrigin: 'center center'
            }}
            >
                {/* O input funciona normalmente, mas visualmente está deitado */}
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider w-full placeholder:text-zinc-500"
                />
                
                {/* Ícone de Busca (gira 90 graus para ficar 'em pé' em relação ao usuário) */}
                <Search size={14} className={`flex-shrink-0 rotate-90 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </div>

        </div>

      </div>
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
    // ADICIONADO 'pl-16': Cria espaço na esquerda para a barra vertical
    <div className="space-y-6 pb-24 pt-4 animate-in fade-in px-2 pl-16">
      
      {/* Barra Vertical Nova */}
      <YouTubeVerticalFilter 
         categories={YOUTUBE_CATEGORIES} 
         active={category} 
         onChange={setCategory} 
         isDarkMode={isDarkMode} 
      />

      {/* Stories (Carrossel Horizontal) */}
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

      {/* Grid de Vídeos */}
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
  
  // 1. DADOS MOCKADOS EXPANDIDOS (EM ALTA)
  const trending = [
    { 
      id: 1, 
      title: 'IA Generativa: O novo marco regulatório começa a valer hoje na Europa', 
      source: 'Politico', 
      time: '15m', 
      img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80' 
    },
    { 
      id: 2, 
      title: 'Final da Champions: Real Madrid e City se enfrentam em jogo histórico', 
      source: 'ESPN', 
      time: '45m', 
      img: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=600&q=80' 
    },
    { 
      id: 3, 
      title: 'Bitcoin atinge nova máxima histórica com aprovação de ETF', 
      source: 'Bloomberg', 
      time: '2h', 
      img: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80' 
    },
    { 
      id: 4, 
      title: 'Novo carro elétrico da Xiaomi surpreende em testes de autonomia', 
      source: 'AutoEsporte', 
      time: '3h', 
      img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&q=80' 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* --- STORIES (MANTIDO IGUAL) --- */}
      <div className="flex space-x-6 overflow-x-auto px-2 pb-2 scrollbar-hide snap-x items-center">
        {STORIES.map((story) => (
          <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center space-y-2 snap-center cursor-pointer group">
            <div className="relative w-[76px] h-[76px] rounded-full p-[3px] bg-gradient-to-tr from-blue-500 to-teal-200 group-hover:scale-105 transition-transform duration-300 shadow-lg">
               <div className={`w-full h-full rounded-full border-[3px] overflow-hidden ${isDarkMode ? 'border-zinc-950' : 'border-white'}`}>
                 <img src={story.avatar} className="w-full h-full object-cover" />
               </div>
            </div>
            <span className={`text-[11px] font-semibold transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`}>{story.name}</span>
          </div>
        ))}
      </div>

      {/* --- CARD 1: RESUMO DO MOMENTO (ESTILO BRIEFING / TEXTO) --- */}
      <div className="px-1">
        <div className={`
            relative overflow-hidden rounded-[32px] border p-8 shadow-2xl transition-all hover:scale-[1.01] duration-500 
            ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-gradient-to-br from-zinc-900 to-black text-white border-transparent'}
        `}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 blur-[90px]" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-blue-400 text-black p-2 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)]">
              <Sparkles size={20} fill="black" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">Resumo do Momento</span>
          </div>
          
          <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">
                Mercado global reage: Pacote fiscal e avanços em IA dominam a pauta.
              </h2>
              <p className="text-zinc-300 text-base leading-relaxed mb-8 font-serif">
                Nossa IA processou 14 fontes para criar este resumo.
              </p>
              <button onClick={() => openArticle({ title: 'Briefing IA', source: 'NewsOS Intelligence', img: null })} className="py-3.5 px-8 bg-white text-black font-bold text-sm rounded-full hover:bg-zinc-200 transition active:scale-[0.98] flex items-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
                Ler Briefing Completo <ArrowRight size={16} />
              </button>
          </div>
        </div>
      </div>

      {/* --- CARD 2: NOVO DESTAQUE (ESTILO IMERSIVO / FOTO) --- */}
      {/* Diferença: Este usa imagem de fundo e texto sobreposto no rodapé */}
      <div className="px-1">
         <div 
            onClick={() => openArticle({ title: 'SpaceX lança novo foguete Starship', source: 'SpaceX Live', img: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80' })}
            className="group relative h-[400px] w-full rounded-[32px] overflow-hidden cursor-pointer shadow-2xl transition-all duration-500 hover:shadow-orange-500/20"
         >
            {/* Imagem de Fundo com Zoom no Hover */}
            <img 
              src="https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="SpaceX"
            />
            
            {/* Overlay Escuro (Gradiente) para leitura */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Badge "AO VIVO" pulsante */}
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-400/30 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
               <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
               <span className="text-white text-[10px] font-bold uppercase tracking-widest">Ao Vivo • Cabo Canaveral</span>
            </div>

            {/* Conteúdo na parte inferior */}
            <div className="absolute bottom-0 left-0 p-8 w-full">
               <div className="flex items-center gap-2 mb-2 opacity-80">
                  <span className="text-orange-400 font-bold text-xs uppercase tracking-wider">Ciência & Espaço</span>
                  <span className="text-zinc-400 text-xs">•</span>
                  <span className="text-zinc-300 text-xs">Há 10 min</span>
               </div>
               <h2 className="text-3xl font-bold text-white leading-tight mb-2 group-hover:underline decoration-orange-500 underline-offset-4 decoration-2">
                  SpaceX prepara lançamento histórico da Starship V3.
               </h2>
               <p className="text-zinc-300 text-sm line-clamp-2 mb-4">
                  Acompanhe em tempo real as imagens exclusivas da plataforma de lançamento da NASA.
               </p>
               
               {/* Botão de Play Transparente */}
               <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:translate-x-2 transition-transform">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                     <Play size={12} fill="white" />
                  </div>
                  Assistir Transmissão
               </div>
            </div>
         </div>
      </div>

      {/* --- EM ALTA (CARROSSEL COM MAIS ITENS) --- */}
      <div className="px-2 pt-4">
        <div className="flex items-center gap-2 mb-4 px-1">
          <TrendingUp size={20} className="text-blue-500" />
          <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Em Alta Agora</h3>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {trending.map(item => (
            <div 
                key={item.id} 
                onClick={() => openArticle(item)} 
                className={`
                    min-w-[280px] md:min-w-[320px] rounded-2xl p-4 cursor-pointer snap-center border transition-all hover:scale-[1.02] 
                    ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:shadow-lg'}
                `}
            >
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 flex-shrink-0 relative">
                   <img src={item.img} className="w-full h-full object-cover" />
                   {/* Número do ranking sobre a imagem */}
                   <div className="absolute top-0 left-0 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-br-lg text-white text-[10px] font-bold">
                     #{item.id}
                   </div>
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

    </div>
  );
}

// --- NAV LATERAL ESTILO MARCADOR (BANCA) ---
function BancaBookmarkNav({ categories, active, onChange, isDarkMode }) {
  return (
    <div className="fixed right-0 top-[25%] z-30 flex flex-col gap-1 items-end pointer-events-none">
      {categories.map((cat) => {
        const isActive = active === cat;
        
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`
              pointer-events-auto
              relative 
              flex items-center justify-center
              w-10  /* Largura do marcador */
              py-6  /* Altura do marcador */
              rounded-l-xl rounded-r-none /* Cantos arredondados só na esquerda */
              shadow-lg border-y border-l border-r-0 /* Borda só na esquerda/cima/baixo */
              transition-all duration-300 ease-out
              
              /* ESTILOS DE COR E POSIÇÃO */
              ${isActive
                ? 'bg-purple-500 text-white border-white-400 font-bold translate-x-0 w-12 shadow-yellow-500/20' // Ativo: Sai para fora e brilha
                : (isDarkMode 
                    ? 'bg-zinc-900 text-zinc-500 border-zinc-800 translate-x-2 hover:translate-x-0 hover:bg-zinc-800' // Inativo Dark
                    : 'bg-zinc-200 text-zinc-400 border-zinc-300 translate-x-2 hover:translate-x-0 hover:bg-white') // Inativo Light
              }
            `}
          >
            {/* TEXTO VERTICAL */}
            <span 
                className="text-[12px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ 
                    writingMode: 'vertical-rl', // Texto na vertical
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)' // Vira para ler de baixo para cima (padrão de lombada de livro)
                }}
            >
              {cat}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BancaTab({ openOutlet, isDarkMode }) {
  const [category, setCategory] = useState('Tudo');
  // Lógica de filtro
  const displayedItems = category === 'Tudo' ? BANCA_ITEMS : BANCA_ITEMS.filter(i => i.category === category);

  return (
    // Adicionado 'pr-16' para compensar a barra lateral
    <div className="pt-2 pb-24 pr-16 animate-in zoom-in-95 duration-500 min-h-screen">
      
      {/* NOVO NAV LATERAL (Marcadores) */}
      <BancaBookmarkNav 
        categories={BANCA_CATEGORIES} 
        active={category} 
        onChange={setCategory} 
        isDarkMode={isDarkMode} 
      />
      
      <h2 className={`text-xl font-bold mb-6 px-2 mt-4 flex items-center gap-2 'text-white' : 'text-zinc-900'}`}>
        <LayoutGrid size={20} className="text-emerald-600"/> Banca de Jornais
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2">
        {displayedItems.map((item) => (
          <div key={item.id} onClick={() => openOutlet(item)} className={`relative aspect-[3/4] rounded-2xl flex flex-col cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${item.color}`}>
            <div className="p-4 flex justify-center border-b border-white/20 relative z-20 bg-black/10 backdrop-blur-sm">
                <span className={`font-black tracking-tighter text-2xl uppercase ${item.id === 3 || item.id === 4 ? 'text-black' : 'text-white'}`}>{item.logo}</span>
            </div>
            
            <div className="flex-1 relative p-4 flex flex-col justify-end">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:10px_10px]"></div>
                <div className="relative z-10 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
                    <span className={`text-[9px] uppercase tracking-widest font-bold mb-1 block ${item.id === 3 || item.id === 4 ? 'text-black/60' : 'text-white/60'}`}>Manchete do Dia</span>
                    <h3 className={`font-serif font-bold leading-tight text-lg ${item.id === 3 || item.id === 4 ? 'text-black' : 'text-white'}`}>{item.headline}</h3>
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  ); 
}

function TabButton({ icon, label, active, onClick, isDarkMode }) { return (<button onClick={onClick} className={`relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 group ${active ? 'scale-125 -translate-y-2' : 'hover:scale-110'}`}><div className={`p-2 rounded-full transition-all shadow-lg ${active ? 'bg-sky-500 text-white' : (isDarkMode ? 'text-blue-500 group-hover:text-zinc-300' : 'text-blue-400 group-hover:text-zinc-600')}`}>{icon}</div></button>); }
function SavedTab({ isDarkMode, openArticle }) {
  const [category, setCategory] = useState('Tudo');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filtra os itens
  const displayedItems = category === 'Tudo' ? SAVED_ITEMS : SAVED_ITEMS.filter(i => i.category === category);

  // Simula a IA gerando resumo
  const handleGenerateDigest = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert("Resumo gerado! (Aqui abriria o modal com o texto da IA)");
    }, 2000);
  };

  return (
    <div className="pt-2 pb-24 animate-in fade-in duration-500">
      
      {/* Header e Botão IA */}
      <div className="px-4 mb-6">
        <h2 className={`text-2xl font-black mb-4 'text-white' : 'text-zinc-900'}`}>Sua Biblioteca</h2>
        
        {/* Botão Resumo Inteligente */}
        <button 
          onClick={handleGenerateDigest}
          className={`
            w-full relative overflow-hidden rounded-2xl p-[1px] group transition-all active:scale-[0.98] shadow-lg
            ${isDarkMode ? 'bg-zinc-800' : 'bg-white border border-zinc-200'}
          `}
        >
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${isGenerating ? 'animate-pulse' : ''}`} />
          <div className={`relative rounded-xl p-4 flex items-center justify-between ${isDarkMode ? 'bg-zinc-900/90' : 'bg-white/90'}`}>
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                   {isGenerating ? <Sparkles size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
                </div>
                <div className="text-left">
                   <span className={`block font-bold text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                     {isGenerating ? 'Lendo seus artigos...' : 'Resumo Semanal IA'}
                   </span>
                   <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                     Criar um boletim único dos salvos
                   </span>
                </div>
             </div>
             <ChevronLeft size={16} className={`rotate-180 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
          </div>
        </button>
      </div>

      {/* Filtros */}
      <LiquidFilterBar categories={SAVED_CATEGORIES} active={category} onChange={setCategory} isDarkMode={isDarkMode} accentColor="purple" borderColor={{ light: 'border-white-100', dark: 'border-white-100' }} />

      {/* Lista de Artigos */}
      <div className="space-y-3 px-4 mt-2">
        {displayedItems.map((item) => (
          <div 
            key={item.id} 
            className={`
              flex gap-4 p-3 rounded-2xl border transition-all cursor-pointer group
              ${isDarkMode 
                ? 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800' 
                : 'bg-white border-zinc-100 hover:shadow-md hover:border-zinc-200'}
            `}
            onClick={() => openArticle({ ...item, source: item.source })}
          >
            {/* Imagem com Progresso */}
            <div className={`w-24 h-24 rounded-xl flex-shrink-0 overflow-hidden relative ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
               <img src={item.img} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
               {item.readProgress > 0 && (
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                    <div className="h-full bg-blue-500" style={{ width: `${item.readProgress}%` }} />
                 </div>
               )}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 flex flex-col justify-between py-1">
               <div>
                 <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {item.source}
                    </span>
                    {/* Botão Texto Limpo */}
                    <div className={`p-1 rounded-md ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-400'}`} title="Modo Leitura">
                        <FileText size={12} />
                    </div>
                 </div>
                 <h3 className={`text-sm md:text-base font-bold leading-snug mt-1 line-clamp-2 font-serif ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>
                   {item.title}
                 </h3>
               </div>

               <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {item.date}
                  </span>
                  
                  {/* Ações */}
                  <div className="flex gap-2">
                     <button className={`p-1.5 rounded-full hover:bg-blue-500/10 hover:text-blue-500 transition ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        <CheckCircle size={16} />
                     </button>
                     <button className={`p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticlePanel({ article, isOpen, onClose, isExpanded, setIsExpanded, isDarkMode }) {
  const [viewMode, setViewMode] = useState('web');
  const [isPlaying, setIsPlaying] = useState(false);
  const [width, setWidth] = useState(60); 
  const [isDragging, setIsDragging] = useState(false);
  
  // --- NOVO: Estado de Salvo ---
  const [isSaved, setIsSaved] = useState(false);

  // Verifica se veio do Story
  const isStoryMode = article?.origin === 'story';

  useEffect(() => {
    if (isOpen) {
      setViewMode('web');
      setIsPlaying(false);
      // Resetar estado ao abrir nova noticia (num app real, checaria o banco de dados aqui)
      setIsSaved(false); 
    }
  }, [isOpen, article]);

  const toggleAudio = () => setIsPlaying(!isPlaying);

  // --- NOVO: Função de Salvar ---
  const toggleSave = () => {
    setIsSaved(!isSaved);
  };

  // Lógica de Resize
  const handleStart = (clientX) => { if(!isStoryMode) setIsDragging(true); };
  const handleMove = (clientX) => {
    if (!isDragging || isStoryMode) return;
    const newWidth = ((window.innerWidth - clientX) / window.innerWidth) * 100;
    if (newWidth > 30 && newWidth < 95) setWidth(newWidth);
  };
  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onUp = () => handleEnd();
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onUp); window.addEventListener('touchmove', onTouchMove); window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  // Classes
  const baseClasses = `z-[60] flex flex-col overflow-hidden shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`;
  const storyClasses = `fixed top-0 left-0 right-0 h-[92vh] rounded-b-[2.5rem] border-b border-white/10 ${isOpen ? '-translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`;
  const feedClasses = `fixed inset-y-0 right-0 rounded-l-[2.5rem] border-l ${isDarkMode ? 'border-white/10' : 'border-zinc-200'} ${isDragging ? 'transition-none duration-0' : 'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]'} ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
  const feedStyle = { width: isOpen ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${width}%`) : '0%' };

  return (
    <>
      {isOpen && (<div onClick={onClose} className="fixed inset-0 z-[50] bg-black/10 transition-opacity duration-300" />)}

      <div className={`${baseClasses} ${isStoryMode ? storyClasses : feedClasses}`} style={!isStoryMode ? feedStyle : {}}>
        
        {/* Alça de Resize */}
        {!isStoryMode && (
            <div onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }} onTouchStart={(e) => { handleStart(e.touches[0].clientX); }} className="absolute left-0 top-0 bottom-0 w-10 z-50 flex items-center justify-center cursor-ew-resize touch-none">
                <div className={`h-24 w-1.5 rounded-full flex items-center justify-center shadow-sm transition-colors ${isDragging ? 'bg-sky-500' : (isDarkMode ? 'bg-zinc-700 hover:bg-zinc-500' : 'bg-zinc-300 hover:bg-zinc-400')}`}>
                    <GripVertical size={12} className={`${isDragging ? 'text-white' : (isDarkMode ? 'text-zinc-900' : 'text-zinc-500')}`} />
                </div>
            </div>
        )}

        {/* Top Bar */}
        <div className={`px-6 py-4 flex items-center justify-between backdrop-blur-md border-b sticky top-0 z-20 ${!isStoryMode && 'pl-12'} ${isDarkMode ? 'bg-zinc-950/90 border-white/5' : 'bg-white/90 border-zinc-100'}`}>
            <div className="flex items-center gap-3">
                <button onClick={onClose} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'}`}><X size={22} /></button>
                {!isStoryMode && (<button onClick={() => setWidth(width > 90 ? 60 : 100)} className={`p-2 rounded-full transition hidden md:block ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'}`}><Maximize2 size={20} /></button>)}
            </div>

            <div className={`p-1 rounded-full flex relative border shadow-inner ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                <div className={`absolute top-1 bottom-1 w-[50%] rounded-full shadow-sm border transition-all duration-300 ${viewMode === 'web' ? 'left-1' : 'left-[48%]'} ${isDarkMode ? 'bg-zinc-700 border-white/10' : 'bg-white border-zinc-200'}`} />
                <button onClick={() => setViewMode('web')} className={`relative px-5 py-1.5 text-xs font-bold transition-colors z-10 ${viewMode === 'web' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-zinc-500'}`}>Web</button>
                <button onClick={() => setViewMode('ai')} className={`relative px-5 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-1 ${viewMode === 'ai' ? 'text-sky-500' : 'text-zinc-500'}`}><Sparkles size={12} /> IA</button>
            </div>

            <div className="flex gap-2">
                {/* --- BOTÃO SALVAR --- */}
                <button 
                    onClick={toggleSave} 
                    className={`
                        p-2 rounded-full transition-all duration-300 active:scale-90
                        ${isSaved 
                            ? 'bg-sky-500/10 text-sky-500' 
                            : (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black')
                        }
                    `}
                    title={isSaved ? "Remover dos Salvos" : "Salvar Notícia"}
                >
                    <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                </button>
                {/* ------------------- */}

                <button className={`p-2 transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-black'}`}><Share size={20} /></button>
            </div>
        </div>

        {/* Conteúdo */}
        {article && (
            <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-zinc-950' : 'bg-white'} relative`}>
            {viewMode === 'ai' ? (
                <div className="max-w-3xl mx-auto p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
                <span className="text-sky-500 font-bold text-xs uppercase tracking-widest mb-3 block">{article.category || 'News'}</span>
                <h1 className={`text-3xl md:text-4xl font-serif font-black leading-tight mb-8 tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{article.title}</h1>
                <div className={`rounded-full p-2 pr-6 mb-8 border flex items-center gap-4 transition-all shadow-sm ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                    <button onClick={toggleAudio} className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md transition active:scale-95 flex-shrink-0">{isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-1" />}</button>
                    <div className="flex-1"><div className="flex justify-between items-center mb-1"><span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Google Cloud Voice</span><span className={`text-[10px] font-bold font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>01:24 / 03:00</span></div><div className={`h-1.5 w-full rounded-full relative overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}><div className="absolute top-0 left-0 bottom-0 bg-sky-500 rounded-full transition-all duration-300" style={{ width: '30%' }} /></div></div></div>
                <div className={`prose prose-lg max-w-none font-serif leading-loose ${isDarkMode ? 'prose-invert text-zinc-300' : 'text-zinc-700'}`}><p>Resumo IA aqui...</p><ul className="list-disc pl-5 space-y-3 marker:text-sky-500"><li>Ponto 1</li><li>Ponto 2</li></ul></div></div>
            ) : (
                <div className={`h-full flex flex-col items-center justify-center p-10 text-center ${isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-50 text-zinc-400'}`}><Globe size={64} className="mb-6 opacity-20" /><p className="text-lg">Carregando Site Oficial...</p><p className="text-sky-500 font-bold text-xl mb-8">{article.source}</p><div className={`w-full max-w-lg h-12 rounded-full animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} /><p className="mt-4 text-xs opacity-50">(Aqui entraria o `iframe` do site real)</p></div>
            )}
            </div>
        )}
      </div>
    </>
  );
}
function OutletDetail({ outlet, onClose, openArticle, isDarkMode }) { const renderLayout = () => { const layout = outlet.layoutType; const articles = [1,2,3,4,5,6]; if (layout === 'standard') { return (<div className="grid grid-cols-1 md:grid-cols-12 gap-8"><div className="md:col-span-8 cursor-pointer group" onClick={() => openArticle({ title: 'Manchete do Jornal', source: outlet.name, category: 'Capa' })}><div className={`aspect-video mb-4 rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><img src={`https://source.unsplash.com/random/1200x800?sig=${outlet.id}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /></div><h2 className={`text-4xl font-serif font-black mb-3 leading-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>A Manchete Principal do Dia</h2><p className={`font-serif text-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Um resumo detalhado sobre o principal acontecimento.</p></div><div className={`md:col-span-4 space-y-6 border-l pl-6 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>{articles.slice(0, 4).map((i) => (<div key={i} className="cursor-pointer" onClick={() => openArticle({ title: 'Noticia Curta', source: outlet.name, category: 'Geral' })}><span className="text-[10px] font-bold text-blue-500 uppercase mb-1 block">Política</span><h4 className={`font-serif font-bold text-xl leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Notícia secundária de grande impacto.</h4></div>))}</div></div>); } if (layout === 'magazine') { return (<div className={`space-y-12 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{articles.slice(0, 3).map((i) => (<div key={i} className={`flex gap-8 group cursor-pointer border-b pb-8 items-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`} onClick={() => openArticle({ title: 'Artigo da Revista', source: outlet.name, category: 'Feature' })}><span className={`text-8xl font-black transition-colors ${isDarkMode ? 'text-zinc-800 group-hover:text-blue-500/20' : 'text-zinc-100 group-hover:text-blue-500/20'}`}>0{i}</span><div className="w-full"><span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-2 block">Destaque da Semana</span><h3 className={`text-4xl font-bold mb-3 transition-colors ${isDarkMode ? 'text-white group-hover:text-blue-400' : 'text-zinc-900 group-hover:text-blue-600'}`}>O Futuro da Tecnologia.</h3><p className="opacity-70 text-lg line-clamp-2 font-serif">Uma análise profunda e visual.</p></div></div>))}</div>); } if (layout === 'visual') { return (<div className="grid grid-cols-2 md:grid-cols-3 gap-4">{articles.map((i) => (<div key={i} onClick={() => openArticle({ title: 'Visual Story', source: outlet.name, category: 'Photo' })} className={`relative group cursor-pointer rounded-xl overflow-hidden aspect-square ${i === 1 ? 'md:col-span-2 md:row-span-2' : ''}`}><img src={`https://source.unsplash.com/random/800x800?sig=${outlet.id + i}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition" /><div className="absolute bottom-0 left-0 p-4"><h3 className="text-white font-bold text-lg leading-tight">Uma história contada através de imagens impactantes.</h3></div></div>))}</div>); } if (layout === 'minimal') { return (<div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{articles.map((i) => (<div key={i} className="flex gap-4 cursor-pointer group" onClick={() => openArticle({ title: 'Quick Read', source: outlet.name, category: 'Brief' })}><div className={`w-16 h-16 rounded bg-zinc-200 flex-shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`} /><div><h4 className={`font-bold text-lg mb-1 group-hover:underline decoration-blue-500 underline-offset-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Manchete rápida e direta número {i}</h4><p className="text-sm opacity-60 line-clamp-2">Um breve resumo do que aconteceu, sem imagens grandes.</p></div></div>))}</div>); } }; return (<div className={`fixed inset-0 z-[65] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}><div className={`sticky top-0 z-10 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b ${isDarkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-zinc-200'}`}><button onClick={onClose} className={`flex items-center gap-1 text-sm font-bold transition ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}><ChevronLeft size={20} /> Voltar</button><span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{outlet.name}</span><div className="w-6" /></div><div className={`relative w-full h-[30vh] overflow-hidden shadow-xl`}><div className={`absolute inset-0 ${outlet.color}`} /><div className="absolute inset-0 bg-black/20" /><div className="absolute bottom-0 left-0 p-8 max-w-5xl mx-auto w-full flex items-end justify-between"><div><h1 className="text-6xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">{outlet.logo}</h1><p className="text-white/90 uppercase tracking-widest text-sm font-bold">Edição de Terça-feira</p></div><div className="hidden md:block"><span className="text-white/80 text-xs font-mono border border-white/30 px-2 py-1 rounded">Layout: {outlet.layoutType.toUpperCase()}</span></div></div></div><div className={`max-w-5xl mx-auto p-8 min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>{renderLayout()}</div></div>); }
function StoryOverlay({ story, onClose, openArticle }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => { setCurrentIndex(0); }, [story]);
  const handleNext = () => { if (currentIndex < story.items.length - 1) setCurrentIndex(p => p + 1); else onClose(); };
  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(p => p - 1); };
  const currentItem = story.items[currentIndex];

  const handleOpenArticle = (e) => {
      e.stopPropagation();
      onClose();
      // AQUI ESTÁ A MUDANÇA: Adicionei origin: 'story'
      openArticle({ 
        title: currentItem.title, 
        source: story.name, 
        img: currentItem.img, 
        category: 'Story',
        origin: 'story' // <--- Flag importante
      });
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