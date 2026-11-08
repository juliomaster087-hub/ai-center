import { useMemo, useState } from "react";
import {
  Activity, ArrowDown, ArrowRight, Atom, BookOpen, Bot, Check,
  Code2, Command, FileText, Globe2, Image, Languages, LayoutDashboard,
  Menu, MessageCircle, Moon, Search, Send, Settings2,
  ShieldCheck, Sparkles, Stars, WandSparkles, X, Zap
} from "lucide-react";

type Tool = { id: string; title: string; description: string; category: string; icon: typeof Sparkles; color: string; prompt: string };
const tools: Tool[] = [
  { id: "writer", title: "AI Writer", description: "Crie, revise e transforme textos com facilidade.", category: "Escrita", icon: FileText, color: "violet", prompt: "Ajude-me a escrever um texto claro e bem estruturado sobre: " },
  { id: "study", title: "AI Study", description: "Aprenda assuntos e organize seus estudos.", category: "Educação", icon: BookOpen, color: "blue", prompt: "Explique este assunto de forma didática, com exemplos: " },
  { id: "code", title: "AI Code", description: "Entenda códigos e resolva dúvidas de programação.", category: "Tecnologia", icon: Code2, color: "cyan", prompt: "Ajude-me com programação. Minha dúvida é: " },
  { id: "translate", title: "AI Translator", description: "Traduza e adapte textos para outros idiomas.", category: "Idiomas", icon: Languages, color: "pink", prompt: "Traduza o texto a seguir para inglês, mantendo o sentido: " },
  { id: "summary", title: "AI Summarizer", description: "Resuma conteúdos e destaque os pontos principais.", category: "Produtividade", icon: FileText, color: "orange", prompt: "Faça um resumo organizado deste conteúdo, destacando os pontos principais: " },
  { id: "chat", title: "AI Assistant", description: "Converse com um assistente para suas ideias e perguntas.", category: "Assistente", icon: Bot, color: "green", prompt: "" },
];

const categories = ["Todas", "Assistente", "Escrita", "Educação", "Tecnologia", "Idiomas", "Produtividade"];

export default function App() {
  const [active, setActive] = useState("Início");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; provider?: string; model?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [apiUrl] = useState(import.meta.env.VITE_API_URL || "");

  const filteredTools = useMemo(() => tools.filter(t =>
    (category === "Todas" || t.category === category) &&
    (t.title + t.description + t.category).toLowerCase().includes(query.toLowerCase())
  ), [category, query]);

  function openTool(tool: Tool) {
    setSelectedTool(tool);
    setMessages([]);
    setActive("Ferramentas");
    setNotice("");
  }

  async function sendMessage() {
    if (!query.trim() || busy) return;
    const text = (selectedTool?.prompt || "") + query.trim();
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setQuery("");
    setBusy(true);
    setNotice("");
    if (!apiUrl) {
      setMessages([...next, { role: "assistant", content: "A interface do AI Center está pronta! Para ativar as respostas reais, falta conectar o endereço do nosso serviço de IA na configuração VITE_API_URL e publicar o Worker da Cloudflare. Consulte o README do projeto para concluir essa etapa." }]);
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(apiUrl.replace(/\/$/, "") + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: selectedTool?.id || "chat", messages: next.slice(-12) }),
      });
      if (!response.ok) throw new Error("O serviço não conseguiu responder. Tente novamente em instantes.");
      const data = await response.json();
      setMessages([...next, { role: "assistant", content: data.response || data.result?.response || "Não foi possível obter uma resposta.", provider: data.provider, model: data.model }]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erro de conexão.");
    } finally {
      setBusy(false);
    }
  }

  const nav = [
    { label: "Início", icon: LayoutDashboard },
    { label: "Ferramentas", icon: WandSparkles },
    { label: "Assistente", icon: MessageCircle },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Atom size={21}/></div><span>AI <b>Center</b><small>INTELLIGENCE HUB</small></span><button className="icon-btn sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18}/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>{nav.map(item => <button key={item.label} className={`nav-item ${active === item.label ? "active" : ""}`} onClick={() => { if (item.label === "Assistente") { openTool(tools.find(t => t.id === "chat")!); } else { setActive(item.label); setSelectedTool(null); } setMobileOpen(false); }}><item.icon size={18}/>{item.label}{item.label === "Ferramentas" && <span className="nav-count">06</span>}</button>)}</nav>
        <div className="sidebar-divider"/>
        <div className="workspace-label">FERRAMENTAS</div>
        {tools.slice(0, 4).map(tool => <button className="mini-tool" key={tool.id} onClick={() => openTool(tool)}><tool.icon size={16}/>{tool.title}</button>)}
        <div className="sidebar-bottom"><div className="usage-card"><div className="usage-icon"><Zap size={16}/></div><b>Um universo de possibilidades</b><p>Várias ferramentas inteligentes em um só lugar.</p><span>Conheça os recursos <ArrowRight size={13}/></span></div><button className="profile-row" onClick={() => setNotice("Contas e perfis serão adicionados em uma próxima etapa.")}><div className="avatar">G</div><span><b>Visitante</b><small>Acesso público</small></span><Settings2 size={17}/></button></div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"/>}
      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={20}/></button><span className="breadcrumb">Workspace <span>/</span> <b>{selectedTool?.title || active}</b></span></div><div className="topbar-actions"><div className="status-pill"><span/> Sistemas em preparação</div><button className="icon-btn" aria-label="Tema escuro"><Moon size={18}/></button><div className="avatar small-avatar">G</div></div></header>
        <div className="content">
          {selectedTool ? <section className="tool-workspace">
            <button className="back-link" onClick={() => { setSelectedTool(null); setActive("Ferramentas"); }}><ArrowRight size={15}/> Todas as ferramentas</button>
            <div className="tool-heading"><div className={`tool-icon ${selectedTool.color}`}><selectedTool.icon size={24}/></div><div><div className="eyebrow">{selectedTool.category}</div><h1>{selectedTool.title}</h1><p>{selectedTool.description}</p></div></div>
            <div className="chat-panel"><div className="chat-top"><div><b><Sparkles size={16}/> AI Center Assistant</b><small>Assistente inteligente</small></div><span className="online-dot">● Disponível após configuração</span></div><div className="chat-body">{messages.length === 0 ? <div className="empty-chat"><div className="empty-orb"><Bot size={30}/></div><h2>O que vamos criar hoje?</h2><p>Escreva sua pergunta ou envie uma tarefa para começar.</p><div className="suggestions">{["Explique um conceito de forma simples","Ajude-me a organizar minhas ideias","Crie um roteiro passo a passo"].map(s => <button key={s} onClick={() => setQuery(s)}>{s}<ArrowRight size={14}/></button>)}</div></div> : messages.map((m, i) => <div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === "assistant" ? <Sparkles size={15}/> : "G"}</div><div className="message-content"><small>{m.role === "assistant" ? `AI Center${m.provider ? ` · ${m.provider}` : ""}${m.model ? ` · ${m.model}` : ""}` : "Você"}</small><p>{m.content}</p></div></div>)}{busy && <div className="message assistant"><div className="message-avatar"><Sparkles size={15}/></div><div className="typing"><i/><i/><i/></div></div>}</div><div className="composer"><textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Digite sua mensagem..." rows={2}/><div className="composer-footer"><span><ShieldCheck size={14}/> Não compartilhe informações pessoais sensíveis.</span><button className="send-btn" onClick={() => void sendMessage()} disabled={!query.trim() || busy}><Send size={16}/> Enviar</button></div></div>{notice && <div className="notice">{notice}</div>}</div>
          </section> : <>
            <section className="hero"><div className="hero-glow glow-one"/><div className="hero-glow glow-two"/><div className="hero-content"><div className="hero-kicker"><Stars size={14}/> SEU ESPAÇO DE INTELIGÊNCIA ARTIFICIAL</div><h1>Ideias extraordinárias.<br/><span>Possibilidades infinitas.</span></h1><p>Descubra ferramentas inteligentes para criar, aprender, trabalhar e transformar suas ideias em realidade.</p><button className="primary-btn" onClick={() => { setActive("Ferramentas"); setSelectedTool(null); document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" }); }}>Explorar ferramentas <ArrowRight size={17}/></button><div className="hero-meta"><span><Check size={14}/> Acesso público</span><span><Check size={14}/> Interface gratuita</span><span><Check size={14}/> Sempre evoluindo</span></div></div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="core"><Atom size={55}/><span>AI</span></div><div className="float-chip chip-a"><Code2 size={17}/> Code</div><div className="float-chip chip-b"><Image size={17}/> Create</div><div className="float-chip chip-c"><MessageCircle size={17}/> Chat</div><div className="float-chip chip-d"><Globe2 size={17}/> Explore</div></div></section>
            <section className="stats-row"><div><span className="stat-icon"><WandSparkles size={18}/></span><b>06</b><small>Ferramentas planejadas</small></div><div><span className="stat-icon"><Globe2 size={18}/></span><b>Global</b><small>Feito para todos</small></div><div><span className="stat-icon"><Activity size={18}/></span><b>Em evolução</b><small>Novos recursos em breve</small></div></section>
            <section className="tools-section" id="tools"><div className="section-heading"><div><div className="eyebrow">EXPLORE O ECOSSISTEMA</div><h2>Ferramentas para ir além</h2><p>Escolha uma ferramenta e descubra novas possibilidades.</p></div><button className="text-link" onClick={() => setActive("Ferramentas")}>Ver todas <ArrowRight size={15}/></button></div>
              <div className="tool-grid">{tools.map(tool => <button className="tool-card" key={tool.id} onClick={() => openTool(tool)}><div className={`tool-icon ${tool.color}`}><tool.icon size={21}/></div><div className="card-arrow"><ArrowDown size={15}/></div><h3>{tool.title}</h3><p>{tool.description}</p><span className="card-category">{tool.category}</span></button>)}</div>
            </section>
            <section className="bottom-banner"><div className="banner-icon"><Command size={23}/></div><div><b>Uma plataforma. Muitas possibilidades.</b><p>Estamos construindo um espaço para tornar a inteligência artificial mais acessível.</p></div><button onClick={() => setNotice("Novidades e novas ferramentas serão anunciadas aqui.")}>Saiba mais <ArrowRight size={15}/></button></section>
          </>}
          {!selectedTool && active === "Ferramentas" && <section className="directory"><div className="section-heading"><div><div className="eyebrow">BIBLIOTECA</div><h2>Explore as ferramentas</h2><p>Encontre o recurso ideal para sua tarefa.</p></div></div><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar ferramentas..."/></div><div className="category-list">{categories.map(c => <button key={c} className={category === c ? "chosen" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="tool-grid">{filteredTools.map(tool => <button className="tool-card" key={tool.id} onClick={() => openTool(tool)}><div className={`tool-icon ${tool.color}`}><tool.icon size={21}/></div><h3>{tool.title}</h3><p>{tool.description}</p><span className="card-category">{tool.category}</span></button>)}</div>{filteredTools.length === 0 && <p className="no-results">Nenhuma ferramenta encontrada.</p>}</section>}
          <footer><span>© 2026 AI Center</span><span>Construído para ampliar possibilidades.</span><a href="https://github.com/juliomaster087-hub/ai-center" target="_blank" rel="noreferrer">Código aberto no GitHub <ArrowRight size={13}/></a></footer>
        </div>
      </main>
    </div>
  );
}