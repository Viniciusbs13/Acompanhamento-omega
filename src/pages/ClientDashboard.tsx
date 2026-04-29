import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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

export function ClientDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'report' | 'settings'>('overview');
  const [isPresenting, setIsPresenting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  const { entries, addEntry, removeEntry } = useEntries(id || '');

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl p-12">
        <AlertCircle size={48} className="text-accent-coral mb-4" />
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <button onClick={() => navigate('/clientes')} className="mt-4 text-accent-mint hover:underline">Voltar para lista</button>
      </div>
    );
  }

  const lastEntry = entries[entries.length - 1];
  const metrics = lastEntry ? calculateMetrics(lastEntry, client.businessType) : null;
  const previousEntry = entries.length > 1 ? entries[entries.length - 2] : undefined;
  const previousMetrics = previousEntry ? calculateMetrics(previousEntry, client.businessType) : undefined;
  const insights = metrics ? generateInsights(metrics, previousMetrics) : [];
  const health = metrics ? getHealthStatus(metrics, 4) : 'GOOD';

  const chartData = entries.map(e => ({
    name: new Date(e.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    investimento: e.investment,
    faturamento: e.revenue || 0,
    roas: (e.revenue || 0) / (e.investment || 1)
  }));

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'entries', label: 'Lançamentos', icon: PlusCircle },
    { id: 'report', label: 'Relatório', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div 
      ref={containerRef}
      className={cn("space-y-8 min-h-full", isPresenting && "bg-bg-base p-12 overflow-y-auto")}
    >
      {isPresenting && (
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold" style={{ backgroundColor: client!.brandColor }}>
              {client!.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-medium">{client!.name}</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Dashboard de Performance</p>
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
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-black text-3xl font-bold shadow-[0_0_40px_-5px_rgba(0,0,0,0.5)] border-4 border-white/5"
            style={{ backgroundColor: client.brandColor }}
          >
            {client.name.charAt(0)}
          </motion.div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-medium tracking-tight">{client.name}</h1>
              <HealthBadge status={health} />
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
               <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{client.businessType}</span>
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
          <button className="flex items-center gap-2 px-5 py-2.5 bg-accent-mint text-black font-bold rounded-xl hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/20">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ClientKPICard label="Faturamento" value={lastEntry?.revenue || 0} isCurrency trend={metrics && previousMetrics ? ((metrics.roas / previousMetrics.roas - 1) * 100) : 0} />
              <ClientKPICard label="Investimento" value={lastEntry?.investment || 0} isCurrency />
              <ClientKPICard label="ROAS" value={metrics?.roas || 0} isDecimal />
              <ClientKPICard label="Meta SMART" value={client.smartGoal.targetRevenue} isCurrency suffix={`/ ${client.smartGoal.durationMonths}m`} />
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
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
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
                   {metrics ? <ConversionFunnelVisual entry={lastEntry} type={client.businessType} metrics={metrics} /> : <div className="h-full flex items-center justify-center text-text-muted">Aguardando dados...</div>}
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
            className="glass rounded-3xl overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div>
                 <h3 className="font-medium text-xl">Lançamentos Mensais</h3>
                 <p className="text-sm text-text-secondary">Histórico completo de inputs e resultados.</p>
               </div>
               <button 
                onClick={() => handleManualEntry(id!, client.businessType, addEntry)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium flex items-center gap-2 border border-white/10 transition-all"
               >
                 <Plus size={16} /> Adicionar Dados
               </button>
            </div>
            <div className="p-8 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4">Período</th>
                    <th className="pb-4">Investimento</th>
                    <th className="pb-4">Faturamento</th>
                    <th className="pb-4">ROAS</th>
                    <th className="pb-4">CAC</th>
                    <th className="pb-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {entries.map(e => {
                    const m = calculateMetrics(e, client.businessType);
                    return (
                      <tr key={e.id} className="group hover:bg-white/[0.02]">
                        <td className="py-5 font-medium">{new Date(e.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                        <td className="py-5">{formatCurrency(e.investment)}</td>
                        <td className="py-5">{formatCurrency(e.revenue || 0)}</td>
                        <td className="py-5">
                           <span className={cn(
                             "px-2 py-0.5 rounded-lg text-xs font-bold",
                             m.roas >= 4 ? "bg-accent-mint/10 text-accent-mint" : m.roas >= 2.5 ? "bg-accent-amber/10 text-accent-amber" : "bg-accent-coral/10 text-accent-coral"
                           )}>
                             {m.roas.toFixed(2)}
                           </span>
                        </td>
                        <td className="py-5">{formatCurrency(m.cac)}</td>
                        <td className="py-5 text-right">
                          <button onClick={() => removeEntry(e.id)} className="p-2 hover:bg-accent-coral/20 hover:text-accent-coral rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-text-muted italic">Ainda não há dados lançados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientKPICard({ label, value, isCurrency, isDecimal, trend, suffix }: any) {
  return (
    <div className="glass p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-medium tracking-tight">
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

function ConversionFunnelVisual({ entry, type, metrics }: any) {
  const stages = useMemo(() => {
    if (type === 'SERVICE_BOOKING') {
      return [
        { label: 'Leads', value: entry.leads || 0 },
        { label: 'Agendamentos', value: entry.bookings || 0, rate: metrics.bookingRate },
        { label: 'Comparecimentos', value: entry.shows || 0, rate: metrics.showRate },
        { label: 'Vendas', value: entry.sales || 0, rate: metrics.closeRate }
      ];
    }
    // Simplification for others
    return [
      { label: 'Investimento', value: entry.investment },
      { label: 'Retorno', value: entry.revenue || 0, rate: metrics.roas * 100 }
    ];
  }, [entry, type, metrics]);

  const maxVal = Math.max(...stages.map(s => s.value), 1);

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

function handleManualEntry(clientId: string, type: string, addEntryFn: any) {
  // Mock form logic for the purpose of the demo
  const amount = window.prompt("Valor do Faturamento para Abril/2026:", "12000");
  if (!amount) return;

  const entry = {
    id: Math.random().toString(36).substr(2, 9),
    clientId,
    date: new Date(2026, 3, 1).toISOString(), // April 2026
    investment: 2500,
    revenue: parseFloat(amount),
    leads: 120,
    bookings: 45,
    shows: 32,
    sales: 12,
  };

  addEntryFn(entry);
  toast.success("Lançamento efetuado!");
}
