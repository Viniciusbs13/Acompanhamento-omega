import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  TrendingUp, TrendingDown, Clock, Plus, FileText, 
  BarChart3, Settings, Share2, Maximize2, Download,
  ArrowRight, Users, CreditCard, DollarSign, Target, PlusCircle, Trash2, Edit2, ChevronDown, CheckCircle2, AlertCircle, Info, Minimize2
} from 'lucide-react';
import { useEntries } from '../hooks/useMetrics';
import { storage } from '../lib/storage';
import { calculateMetrics, getHealthStatus, generateInsights } from '../lib/calculations';
import { cn, formatCurrency, formatPercent, formatNumber } from '../lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'sonner';

const BUSINESS_CONFIGS: Record<string, any> = {
  REAL_ESTATE: {
    label: 'Imobiliária',
    funnel: ['leads', 'bookings', 'sales'],
    labels: { leads: 'Leads', bookings: 'Visitas', sales: 'Contratos' },
    hideCac: true,
    hideProfit: true
  },
  INFO_PRODUCTS: {
    label: 'Infoprodutos',
    funnel: ['leads', 'sales'],
    labels: { leads: 'Leads', sales: 'Vendas' }
  },
  LOCAL_BUSINESS: {
    label: 'Negócio Local',
    funnel: ['leads', 'sales'],
    labels: { leads: 'Contatos', sales: 'Vendas' }
  },
  ECOMMERCE: {
    label: 'E-commerce',
    funnel: ['sessions', 'addCart', 'purchases'],
    labels: { sessions: 'Sessões', addCart: 'Carrinhos', purchases: 'Vendas' }
  },
  SERVICE_BOOKING: {
    label: 'Serviço com Agendamento',
    funnel: ['leads', 'bookings', 'shows', 'sales'],
    labels: { leads: 'Leads', bookings: 'Agendam.', shows: 'Comparec.', sales: 'Vendas' }
  },
  B2B_LEADS: {
    label: 'Captação Leads B2B',
    funnel: ['leads', 'mqls', 'sales'],
    labels: { leads: 'Leads', mqls: 'MQLs', sales: 'Vendas' }
  },
  WHATSAPP: {
    label: 'WhatsApp',
    funnel: ['waClicks', 'waConversations', 'sales'],
    labels: { waClicks: 'Cliques', waConversations: 'Conversas', sales: 'Vendas' }
  }
};

export function ClientDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'report' | 'settings'>('overview');
  const [isPresenting, setIsPresenting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [client, setClient] = useState<any>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  
  useEffect(() => {
    if (id) {
      storage.getClients().then(clients => {
        const found = clients.find(c => c.id === id);
        setClient(found);
        setLoadingClient(false);
      });
    }
  }, [id]);
  
  useEffect(() => {
    const handleFsChange = () => {
      setIsPresenting(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const togglePresentation = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        setIsPresenting(true); // Fallback to viewport-only fullscreen if API fails
      });
    } else {
      document.exitFullscreen();
    }
  };
  const { entries, addEntry, removeEntry, loading: loadingEntries } = useEntries(id || '');
  const [newEntry, setNewEntry] = useState<any>({
    date: new Date().toISOString().substring(0, 7),
    investment: '',
    revenue: '',
    profit: '',
    cac: '',
    customData: {}
  });

  const handleAddField = (field: string, value: string) => {
    setNewEntry((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAddCustomField = (id: string, value: string) => {
    setNewEntry((prev: any) => ({
      ...prev,
      customData: {
        ...(prev.customData || {}),
        [id]: value
      }
    }));
  };

  const handleSaveEntry = async () => {
    if (!newEntry.investment || !newEntry.revenue || !newEntry.date) {
      toast.error("Data, Investimento e Faturamento são obrigatórios");
      return;
    }

    const toastId = toast.loading("Salvando lançamento...");
    try {
      // Process custom data strings to numbers
      const processedCustomData: Record<string, number> = {};
      if (newEntry.customData) {
        Object.entries(newEntry.customData).forEach(([key, val]) => {
          processedCustomData[key] = parseInt(val as string) || 0;
        });
      }

      const entryData = {
        id: Math.random().toString(36).substring(2, 11),
        clientId: id!,
        date: new Date(newEntry.date + "-01T12:00:00Z").toISOString(),
        investment: parseFloat(newEntry.investment),
        revenue: parseFloat(newEntry.revenue),
        profit: parseFloat(newEntry.profit) || 0,
        cac: parseFloat(newEntry.cac) || 0,
        leads: parseInt(newEntry.leads) || 0,
        bookings: parseInt(newEntry.bookings) || 0,
        shows: parseInt(newEntry.shows) || 0,
        sales: parseInt(newEntry.sales) || 0,
        customData: processedCustomData
      };

      await addEntry(entryData as any);
      setNewEntry({
        date: new Date().toISOString().substring(0, 7),
        investment: '',
        revenue: '',
        profit: '',
        cac: '',
        customData: {}
      });
      toast.success("Lançamento realizado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
      toast.error("Erro ao salvar lançamento.", { id: toastId });
    }
  };

  const lastEntry = useMemo(() => entries[entries.length - 1], [entries]);
  const metrics = useMemo(() => lastEntry ? calculateMetrics(lastEntry, client?.businessType) : null, [lastEntry, client?.businessType]);
  const previousEntry = useMemo(() => entries.length > 1 ? entries[entries.length - 2] : undefined, [entries]);
  const previousMetrics = useMemo(() => previousEntry ? calculateMetrics(previousEntry, client?.businessType) : undefined, [previousEntry, client?.businessType]);
  const insights = useMemo(() => metrics ? generateInsights(metrics, previousMetrics) : [], [metrics, previousMetrics]);
  const health = useMemo(() => metrics ? getHealthStatus(metrics, 4) : 'GOOD', [metrics]);

  const chartData = useMemo(() => entries.map(e => ({
    name: new Date(e.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    investimento: e.investment,
    faturamento: e.revenue || 0,
    roas: (e.revenue || 0) / (e.investment || 1)
  })), [entries]);

  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    
    const toastId = toast.loading("Gerando PDF...");
    try {
      const element = containerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0A0A0B',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Workaround for html2canvas not supporting modern CSS color functions like oklab/oklch
          const styleElements = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleElements.length; i++) {
            const style = styleElements[i];
            if (style.innerHTML.includes('oklch') || style.innerHTML.includes('oklab')) {
              style.innerHTML = style.innerHTML
                .replace(/oklch\([^)]+\)/g, '#ffffff')
                .replace(/oklab\([^)]+\)/g, '#ffffff');
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Relatorio-${client?.name || 'Cliente'}-${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF exportado com sucesso!", { id: toastId });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error("Erro ao gerar PDF. Tente novamente.", { id: toastId });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'entries', label: 'Lançamentos', icon: PlusCircle },
    { id: 'report', label: 'Relatório', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const config = useMemo(() => BUSINESS_CONFIGS[client?.businessType] || BUSINESS_CONFIGS.SERVICE_BOOKING, [client?.businessType]);

  if (loadingClient || loadingEntries) {
    return (
      <div className="py-32 flex justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-accent-mint animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl p-12">
        <AlertCircle size={48} className="text-accent-coral mb-4" />
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <button onClick={() => navigate('/clientes')} className="mt-4 text-accent-mint hover:underline">Voltar para lista</button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("space-y-8 min-h-full", isPresenting && "bg-bg-base p-12 overflow-y-auto")}
    >
      {isPresenting && (
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold overflow-hidden" style={{ backgroundColor: client!.brandColor }}>
              {client!.logo ? (
                <img src={client!.logo} alt={client!.name} className="w-full h-full object-cover" />
              ) : (
                client!.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-xl font-medium">{client!.name}</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Dashboard de Performance | {config.label}</p>
            </div>
          </div>
          <button 
            onClick={togglePresentation}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Minimize2 size={16} />
            Sair da Apresentação
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <motion.div 
            layoutId="client-logo"
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-black text-3xl font-bold shadow-[0_0_40px_-5px_rgba(0,0,0,0.5)] border-4 border-white/5 overflow-hidden shrink-0"
            style={{ backgroundColor: client.brandColor }}
          >
            {client.logo ? (
              <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
            ) : (
              client.name.charAt(0)
            )}
          </motion.div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-medium tracking-tight">{client.name}</h1>
              <HealthBadge status={health} />
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
               <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{config.label}</span>
               {client.accountManager && (
                 <span className="flex items-center gap-1.5"><Users size={14} /> Gestor: {client.accountManager}</span>
               )}
               <span className="flex items-center gap-1.5"><Clock size={14} /> Ativo há 6 meses</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={togglePresentation}
            className="flex items-center gap-2 px-4 py-2.5 glass glass-hover rounded-xl text-sm font-medium"
          >
            <Maximize2 size={16} />
            Modo Apresentação
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-mint text-black font-bold rounded-xl hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/20"
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!isPresenting && (
        <div className="flex items-center gap-2 border-b border-white/5 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative border-b-2",
                activeTab === tab.id 
                  ? "text-accent-mint border-accent-mint" 
                  : "text-text-muted border-transparent hover:text-text-secondary"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <ClientKPICard label="Faturamento" value={lastEntry?.revenue || 0} isCurrency trend={metrics && previousMetrics ? ((metrics.roas / previousMetrics.roas - 1) * 100) : 0} />
              <ClientKPICard label="Investimento" value={lastEntry?.investment || 0} isCurrency />
              {!config.hideProfit && <ClientKPICard label="Lucro" value={lastEntry?.profit || 0} isCurrency color="text-accent-mint" />}
              {!config.hideCac && <ClientKPICard label="CAC" value={metrics?.cac || 0} isCurrency color="text-accent-coral" />}
              <ClientKPICard label="ROAS" value={metrics?.roas || 0} isDecimal />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Block */}
              <div className="lg:col-span-2 glass rounded-3xl p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="font-medium text-lg">Evolução do Faturamento</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      <div className="w-2 h-2 rounded-full bg-accent-mint" /> Realizado
                      <div className="w-2 h-2 rounded-full bg-white/40" /> Meta
                    </div>
                 </div>
                 <div className="h-[300px] min-w-0 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50} key={`chart-${activeTab}`}>
                       <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="clientColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={client.brandColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={client.brandColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                          <Tooltip 
                            contentStyle={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="faturamento" stroke={client.brandColor} strokeWidth={3} fillOpacity={1} fill="url(#clientColor)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Conversion Funnel Widget */}
              <div className="glass rounded-3xl p-8 flex flex-col">
                 <h3 className="font-medium text-lg mb-8">Funil de Conversão</h3>
                 <div className="flex-1">
                   {metrics ? <ConversionFunnelVisual entry={lastEntry} client={client} metrics={metrics} /> : <div className="h-full flex items-center justify-center text-text-muted">Aguardando dados...</div>}
                 </div>
              </div>
            </div>

            {/* Bottom Row - Projections and Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="glass rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Insights Automáticos</h3>
                    <Info size={16} className="text-text-muted" />
                  </div>
                  <div className="space-y-4">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-accent-mint/10 flex items-center justify-center text-accent-mint shrink-0">
                          <TrendingUp size={16} />
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{insight}</p>
                      </div>
                    ))}
                    {insights.length === 0 && <p className="text-sm text-text-muted italic">Dados insuficientes para gerar novos insights este mês.</p>}
                  </div>
               </div>

               <div className="glass rounded-3xl p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium mb-1">Projeção da Meta</h3>
                    <p className="text-xs text-text-secondary">Ritmo atual para atingir {formatCurrency(client.smartGoal.targetRevenue)}</p>
                  </div>
                  <div className="py-8 space-y-4">
                     <div className="flex justify-between items-end">
                        <span className="text-3xl font-medium tracking-tighter">
                          {formatPercent(lastEntry ? (lastEntry.revenue || 0) / client.smartGoal.targetRevenue * 100 : 0)}
                        </span>
                        <span className="text-[10px] font-bold text-text-muted uppercase">CONCLUÍDO</span>
                     </div>
                     <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, lastEntry ? (lastEntry.revenue || 0) / client.smartGoal.targetRevenue * 100 : 0)}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-accent-mint shadow-[0_0_20px_rgba(0,217,163,0.4)]"
                        />
                     </div>
                     <p className="text-xs text-text-muted">Você está a {formatCurrency(Math.max(0, client.smartGoal.targetRevenue - (lastEntry?.revenue || 0)))} de distância da meta.</p>
                  </div>
                  <button className="text-accent-mint text-sm font-medium flex items-center gap-2 hover:translate-x-1 transition-transform">
                    Simular próximos meses <ArrowRight size={14} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'entries' && (
          <motion.div
            key="entries"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl p-8 border border-white/5">
              <h3 className="font-medium text-xl mb-6">Novo Lançamento Mensal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Data do Lançamento</label>
                  <input 
                    type="month" 
                    value={newEntry.date}
                    onChange={(e) => handleAddField('date', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Investimento (BRL)</label>
                  <input 
                    type="number" 
                    value={newEntry.investment}
                    onChange={(e) => handleAddField('investment', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 outline-none" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Faturamento (BRL)</label>
                  <input 
                    type="number" 
                    value={newEntry.revenue}
                    onChange={(e) => handleAddField('revenue', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 outline-none" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {!config.hideProfit && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Lucro (BRL)</label>
                    <input 
                      type="number" 
                      value={newEntry.profit}
                      onChange={(e) => handleAddField('profit', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 outline-none" 
                      placeholder="0.00" 
                    />
                  </div>
                )}
                {!config.hideCac && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">CAC (Manual opcional)</label>
                    <input 
                      type="number" 
                      value={newEntry.cac}
                      onChange={(e) => handleAddField('cac', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 outline-none" 
                      placeholder="0.00" 
                    />
                  </div>
                )}

                {/* Dynamic Fields based on config.funnel or custom funnel */}
                {client.customFunnelSteps && client.customFunnelSteps.length > 0 ? (
                   client.customFunnelSteps.map((stepItem: any) => {
                     // Check if it's a standard field or customData field
                     const isStandard = ['leads', 'bookings', 'shows', 'sales', 'sessions', 'addCart', 'purchases', 'mqls', 'waClicks', 'waConversations'].includes(stepItem.id);
                     return (
                       <div key={stepItem.id} className="space-y-2">
                         <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                           {stepItem.label}
                         </label>
                         <input 
                           type="number" 
                           value={isStandard ? (newEntry[stepItem.id] || '') : (newEntry.customData?.[stepItem.id] || '')}
                           onChange={(e) => isStandard ? handleAddField(stepItem.id, e.target.value) : handleAddCustomField(stepItem.id, e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 outline-none" 
                           placeholder="0" 
                         />
                       </div>
                     );
                   })
                ) : (
                  config.funnel.map((field: string) => {
                    // Skip investment/revenue as they are in the row above
                    if (['investment', 'revenue', 'sessions', 'profit'].includes(field)) return null;
                    
                    return (
                      <div key={field} className="space-y-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          {config.labels[field] || field}
                        </label>
                        <input 
                          type="number" 
                          value={(newEntry as any)[field] || ''}
                          onChange={(e) => handleAddField(field, e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 outline-none" 
                          placeholder="0" 
                        />
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSaveEntry}
                  className="bg-accent-mint text-black font-bold px-8 py-3 rounded-xl hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/20"
                >
                  Salvar Lançamento
                </button>
              </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden">
              <div className="p-8 border-b border-white/5">
                <h3 className="font-medium text-xl">Histórico</h3>
              </div>
              <div className="p-8 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4">Período</th>
                      <th className="pb-4">Investiment.</th>
                      <th className="pb-4">Faturamento</th>
                      <th className="pb-4">Lucro</th>
                      <th className="pb-4">Leads</th>
                      <th className="pb-4">Vendas</th>
                      <th className="pb-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {entries.map(e => (
                      <tr key={e.id} className="group hover:bg-white/[0.02]">
                        <td className="py-5 font-medium">{new Date(e.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                        <td className="py-5">{formatCurrency(e.investment)}</td>
                        <td className="py-5">{formatCurrency(e.revenue || 0)}</td>
                        <td className="py-5 text-accent-mint font-medium">{formatCurrency(e.profit || 0)}</td>
                        <td className="py-5">{e.leads || 0}</td>
                        <td className="py-5">{e.sales || 0}</td>
                        <td className="py-5 text-right">
                          <button onClick={() => removeEntry(e.id)} className="p-2 hover:bg-accent-coral/20 hover:text-accent-coral rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'report' && (
          <motion.div
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">Análise de Performance</h3>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase">De:</label>
                          <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none">
                             {entries.map(e => (
                               <option key={e.id} value={e.date}>{new Date(e.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}</option>
                             ))}
                          </select>
                       </div>
                       <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Até:</label>
                          <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none">
                             {entries.map(e => (
                               <option key={e.id} value={e.date}>{new Date(e.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Leads</p>
                        <p className="text-xl font-medium">{entries.reduce((acc, curr) => acc + (curr.leads || 0), 0)}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Agendam.</p>
                        <p className="text-xl font-medium">{entries.reduce((acc, curr) => acc + (curr.bookings || 0), 0)}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Vendas</p>
                        <p className="text-xl font-medium">{entries.reduce((acc, curr) => acc + (curr.sales || 0), 0)}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Lucro Total</p>
                        <p className="text-xl font-medium text-accent-mint">{formatCurrency(entries.reduce((acc, curr) => acc + (curr.profit || 0), 0))}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Relatório Estratégico</label>
                    <textarea 
                      placeholder="Descreva os principais pontos positivos, gargalos e o plano de ação para o próximo período..."
                      className="w-full min-h-[250px] bg-white/5 border border-white/10 rounded-2xl p-6 text-sm leading-relaxed resize-none focus:border-accent-mint/50 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                    <button className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-all">Salvar rascunho</button>
                    <button 
                      onClick={handleExportPDF}
                      className="px-6 py-2.5 rounded-xl bg-accent-mint text-black font-bold text-sm transition-all hover:bg-accent-mint/90 shadow-lg shadow-accent-mint/20"
                    >
                      Exportar Relatório
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass rounded-3xl p-8">
                  <h4 className="font-medium mb-6">Métricas do Período</h4>
                  <div className="space-y-6">
                    <SummaryItem label="ROAS Médio" value={`${(metrics?.roas || 0).toFixed(2)}x`} />
                    <SummaryItem label="CAC Médio" value={formatCurrency(metrics?.cac || 0)} />
                    <SummaryItem label="ROI Médio" value={`${(metrics?.roi || 0).toFixed(1)}%`} />
                    <SummaryItem label="Faturamento" value={formatCurrency(entries.reduce((acc, curr) => acc + (curr.revenue || 0), 0))} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="glass rounded-3xl p-8 border border-white/5 max-w-2xl mx-auto">
              <h3 className="text-xl font-medium mb-8">Configurações do Cliente</h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedClient = {
                  ...client,
                  name: formData.get('name') as string,
                  accountManager: formData.get('accountManager') as string,
                  brandColor: formData.get('brandColor') as string,
                  ownerNames: formData.get('ownerNames') as string,
                  planValue: parseFloat(formData.get('planValue') as string) || 0,
                  planScope: formData.get('planScope') as string,
                  contractUrl: formData.get('contractUrl') as string,
                  managementStatus: formData.get('managementStatus') as string,
                };
                await storage.saveClient(updatedClient);
                toast.success("Configurações atualizadas!");
                setClient(updatedClient);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Nome da Empresa</label>
                    <input name="name" defaultValue={client.name} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Gestor Responsável</label>
                    <input name="accountManager" defaultValue={client.accountManager} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Donos / Sócios</label>
                      <input name="ownerNames" defaultValue={client.ownerNames} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Valor do Plano (Mensal)</label>
                      <input type="number" name="planValue" defaultValue={client.planValue} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Escopo do Plano</label>
                   <textarea name="planScope" defaultValue={client.planScope} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium resize-none" />
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Link do Contrato</label>
                   <input name="contractUrl" defaultValue={client.contractUrl} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Cor da Marca</label>
                      <div className="flex items-center gap-4">
                        <input type="color" name="brandColor" defaultValue={client.brandColor} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                        <span className="text-sm text-text-secondary">Cor primária do dashboard.</span>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Status de Gestão (Flag)</label>
                      <select name="managementStatus" defaultValue={client.managementStatus || 'GREEN'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium">
                         <option value="GREEN">Saudável (Green Flag)</option>
                         <option value="YELLOW">Instável (Yellow Flag)</option>
                         <option value="RED">Crítico (Red Flag)</option>
                      </select>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted">Funil de Vendas</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const newSteps = [...(client.customFunnelSteps || [])];
                        newSteps.push({ id: `step_${Date.now()}`, label: 'Nova Etapa' });
                        setClient({ ...client, customFunnelSteps: newSteps });
                      }}
                      className="flex items-center gap-2 text-accent-mint text-[10px] font-bold uppercase hover:underline"
                    >
                      <Plus size={14} /> Adicionar Etapa
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(client.customFunnelSteps || []).map((step: any, index: number) => (
                      <div key={step.id || index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-bold text-text-muted">
                          {index + 1}
                        </div>
                        <input 
                          value={step.label}
                          onChange={(e) => {
                            const newSteps = [...client.customFunnelSteps];
                            newSteps[index] = { ...newSteps[index], label: e.target.value };
                            setClient({ ...client, customFunnelSteps: newSteps });
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-mint/50"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newSteps = client.customFunnelSteps.filter((_: any, i: number) => i !== index);
                            setClient({ ...client, customFunnelSteps: newSteps });
                          }}
                          className="p-2 text-text-muted hover:text-accent-coral transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    
                    {(!client.customFunnelSteps || client.customFunnelSteps.length === 0) && (
                      <p className="text-xs text-text-muted italic">Usando funil padrão do setor. Adicione etapas para personalizar.</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Deseja realmente excluir este cliente e todos os dados vinculados?")) {
                        await storage.deleteClient(client.id);
                        toast.success("Cliente removido!");
                        navigate('/clientes');
                      }
                    }}
                    className="text-accent-coral text-xs font-bold uppercase hover:underline flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Excluir Cliente
                  </button>
                  <button type="submit" className="bg-accent-mint text-black font-bold px-8 py-3 rounded-xl hover:bg-accent-mint/90 transition-all">Salvar Alterações</button>
                </div>
              </form>
            </div>

            <div className="glass rounded-3xl p-8 border border-white/5 max-w-2xl mx-auto border-accent-coral/20">
               <h3 className="text-lg font-medium text-accent-coral mb-2">Zona de Perigo</h3>
               <p className="text-sm text-text-muted mb-6">Ao apagar este cliente, todos os registros e relatórios serão permanentemente removidos.</p>
               <button 
                 onClick={async () => {
                   if(window.confirm("Certeza absoluta? Esta ação não pode ser desfeita.")) {
                     await storage.deleteClient(client.id);
                     navigate('/clientes');
                     toast.success("Cliente removido.");
                   }
                 }}
                 className="flex items-center gap-2 px-6 py-3 bg-accent-coral/10 text-accent-coral rounded-xl text-sm font-bold border border-accent-coral/20 hover:bg-accent-coral/20 transition-all"
               >
                  <Trash2 size={16} /> Apagar Cliente
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientKPICard({ label, value, isCurrency, isDecimal, trend, suffix, color }: any) {
  return (
    <div className="glass p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-3xl font-medium tracking-tight", color)}>
           {isCurrency ? formatCurrency(value).replace('R$', '').trim() : isDecimal ? value.toFixed(2) : value}
        </span>
        {suffix && <span className="text-xs text-text-muted font-bold">{suffix}</span>}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={cn("text-[10px] font-bold flex items-center gap-1", trend > 0 ? "text-accent-mint" : "text-accent-coral")}>
           {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
           {Math.abs(trend).toFixed(1)}% vs anterior
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ConversionFunnelVisual({ entry, client, metrics }: any) {
  if (!client || !entry || !metrics) return null;
  const type = client?.businessType;
  const config = BUSINESS_CONFIGS[type] || BUSINESS_CONFIGS.SERVICE_BOOKING;
  const customSteps = client?.customFunnelSteps;
  
  const stages = useMemo(() => {
    if (customSteps && customSteps.length > 0) {
      return customSteps.map((step: any, idx: number) => {
        // Try to find value in standard fields first, then customData
        const standardFields = ['leads', 'bookings', 'shows', 'sales', 'sessions', 'addCart', 'purchases', 'mqls', 'waClicks', 'waConversations'];
        let value = 0;
        if (standardFields.includes(step.id)) {
          value = entry[step.id] || 0;
        } else {
          value = entry.customData?.[step.id] || 0;
        }

        let rate = undefined;
        // Basic conversion from previous step if available
        if (idx > 0) {
          const prevStep = customSteps[idx-1];
          let prevValue = 0;
          if (standardFields.includes(prevStep.id)) {
            prevValue = entry[prevStep.id] || 0;
          } else {
            prevValue = entry.customData?.[prevStep.id] || 0;
          }
          if (prevValue > 0) rate = (value / prevValue) * 100;
        }

        return {
          label: step.label,
          value,
          rate
        };
      });
    }

    return config.funnel.map((key: string) => {
      let value = entry[key] || 0;
      let rate = undefined;
      
      // Calculate rates based on stage
      if (key === 'bookings') rate = metrics.bookingRate;
      if (key === 'shows') rate = metrics.showRate;
      if (key === 'sales' || key === 'purchases') rate = metrics.conversion;
      if (key === 'waConversations') rate = metrics.waResponseRate;
      if (key === 'mqls') rate = metrics.mqlRate;
      if (key === 'addCart') rate = (100 - (metrics.abandonRate || 0));

      return {
        label: config.labels[key] || key,
        value,
        rate
      };
    });
  }, [entry, type, metrics, config, customSteps]);

  const maxVal = Math.max(...stages.map((s: any) => s.value), 1);

  return (
    <div className="space-y-6">
      {stages.map((stage, idx) => (
         <div key={idx} className="space-y-2">
            <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-wider">
               <span className="text-text-secondary">{stage.label}</span>
               <div className="flex items-center gap-2">
                  {stage.rate !== undefined && (
                    <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-accent-mint">{stage.rate.toFixed(1)}%</span>
                  )}
                  <span className="text-white">{formatNumber(stage.value)}</span>
               </div>
            </div>
            <div className="h-6 bg-white/5 rounded-lg relative overflow-hidden group">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(stage.value / maxVal) * 100}%` }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className={cn(
                  "h-full bg-gradient-to-r transition-all",
                  idx === 0 ? "from-accent-mint/20 to-accent-mint" : "from-accent-mint/40 to-accent-mint/80"
                )}
               />
               <div className="absolute inset-x-2 inset-y-0 flex items-center">
                  <span className="text-[10px] font-bold text-black drop-shadow-sm opacity-60">{formatNumber(stage.value)}</span>
               </div>
            </div>
         </div>
      ))}
    </div>
  );
}

function HealthBadge({ status }: { status: string }) {
  const configs = {
    GOOD: { text: 'Em Dia', color: 'bg-accent-mint', glow: 'shadow-[0_0_10px_rgba(0,217,163,0.5)]' },
    WARNING: { text: 'Alerta', color: 'bg-accent-amber', glow: 'shadow-[0_0_10px_rgba(255,176,32,0.5)]' },
    CRITICAL: { text: 'Abaixo da Meta', color: 'bg-accent-coral', glow: 'shadow-[0_0_10px_rgba(255,77,77,0.5)]' },
  }[status as 'GOOD' | 'WARNING' | 'CRITICAL'];

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full glass border-white/5">
       <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", configs.color, configs.glow)} />
       <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">{configs.text}</span>
    </div>
  );
}
