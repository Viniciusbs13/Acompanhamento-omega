import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, DollarSign, Wallet2, Plus, ArrowRight, Activity, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storage } from '../lib/storage';
import { calculateMetrics, getHealthStatus } from '../lib/calculations';
import { formatCurrency, cn } from '../lib/utils';
import { ResponsiveContainer, ComposedChart, Bar, Line, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardStats {
  totalInvested: number;
  totalRevenue: number;
  activeClients: number;
  averageRoas: number;
  globalChartData: any[];
  clientEntries: Record<string, any[]>;
}

export function Dashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvested: 0,
    totalRevenue: 0,
    activeClients: 0,
    averageRoas: 0,
    globalChartData: [],
    clientEntries: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const allClients = await storage.getClients();
      setClients(allClients);

      const entriesMap: Record<string, any[]> = {};
      let totalInvested = 0;
      let totalRevenue = 0;
      const dateMap = new Map<string, { investment: number; revenue: number }>();

      await Promise.all(allClients.map(async (client) => {
        const entries = await storage.getEntries(client.id);
        entriesMap[client.id] = entries;
        
        if (entries.length > 0) {
          const last = entries[entries.length - 1];
          totalInvested += last.investment || 0;
          totalRevenue += last.revenue || 0;
        }

        entries.forEach(entry => {
          const dateKey = new Date(entry.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          const current = dateMap.get(dateKey) || { investment: 0, revenue: 0 };
          dateMap.set(dateKey, {
            investment: current.investment + entry.investment,
            revenue: current.revenue + (entry.revenue || 0)
          });
        });
      }));

      const averageRoas = totalInvested > 0 ? totalRevenue / totalInvested : 0;
      const globalChartData = Array.from(dateMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Simplified sort
        .map(([name, data]) => ({ name, ...data }));

      setStats({
        totalInvested,
        totalRevenue,
        activeClients: allClients.length,
        averageRoas,
        globalChartData,
        clientEntries: entriesMap
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-32 flex justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-accent-mint animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Faturamento" value={stats.totalRevenue} isCurrency icon={<DollarSign size={20} />} variation={12.5} />
        <KPICard label="Investimento" value={stats.totalInvested} isCurrency icon={<Wallet2 size={20} />} variation={-4.2} />
        <KPICard label="ROAS Médio" value={stats.averageRoas} icon={<TrendingUp size={20} />} variation={7.8} />
        <KPICard label="Clientes" value={stats.activeClients} icon={<Users size={20} />} />
      </div>

      <div className="glass p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Evolução Consolidada</h2>
            <p className="text-text-muted text-sm">Performance agregada de todos os clientes</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent-mint" /> Faturamento</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-white/20" /> Investimento</span>
          </div>
        </div>

        <div className="h-[400px]">
          {stats.globalChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.globalChartData}>
                <defs>
                  <linearGradient id="globalRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D9A3" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00D9A3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                <YAxis hide />
                <RechartsTooltip 
                  contentStyle={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => formatCurrency(val)}
                />
                <Bar dataKey="revenue" fill="url(#globalRev)" radius={[6, 6, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="investment" stroke="rgba(255,255,255,0.3)" strokeWidth={2} dot={{ r: 4, fill: '#00D9A3', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-text-muted italic opacity-40">
               Nenhum dado consolidado disponível.
             </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium tracking-tight">Performance por Cliente</h2>
          <Link to="/clientes" className="text-accent-mint font-medium hover:underline text-sm flex items-center gap-1">
            Ver carteira completa <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length > 0 ? clients.slice(0, 6).map((client, i) => (
             <GlobalClientCard key={client.id} client={client} index={i} entries={stats.clientEntries[client.id] || []} />
          )) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center glass rounded-3xl border-dashed">
              <PlusCircle size={40} className="text-text-muted mb-4 opacity-20" />
              <p className="text-text-secondary font-medium">Você ainda não possui clientes ativos.</p>
              <Link to="/clientes/novo" className="text-accent-mint text-sm mt-3 font-bold hover:underline">Adicionar meu primeiro cliente</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, isCurrency = false, variation, icon }: any) {
  return (
    <div className="glass p-6 rounded-2xl glass-hover relative group overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-accent-mint transition-colors">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-medium tracking-tighter">
          {isCurrency ? formatCurrency(value).replace('R$', '').trim() : typeof value === 'number' ? value.toFixed(value < 10 ? 2 : 0) : value}
        </span>
        {isCurrency && <span className="text-sm text-text-muted">BRL</span>}
      </div>
      {variation && (
        <div className={cn("text-[10px] font-bold mt-2 flex items-center gap-1", variation > 0 ? "text-accent-mint" : "text-accent-coral")}>
           {variation > 0 ? '↑' : '↓'} {Math.abs(variation)}% 
           <span className="text-text-muted opacity-60">vs mês anterior</span>
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-mint/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function GlobalClientCard({ client, index, entries }: any) {
  const last = entries[entries.length - 1];
  const metrics = last ? calculateMetrics(last, client.businessType) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        to={`/clientes/${client.id}`}
        className="glass glass-hover p-6 rounded-3xl block group relative"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold" style={{ backgroundColor: client.brandColor }}>
            {client.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-medium group-hover:text-accent-mint transition-colors">{client.name}</h4>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{client.businessType}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 p-3 rounded-2xl">
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">ROAS</p>
              <p className="text-lg font-medium">{metrics ? metrics.roas.toFixed(2) : '--'}</p>
           </div>
           <div className="bg-white/5 p-3 rounded-2xl">
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">FATURAMENTO</p>
              <p className="text-lg font-medium tracking-tight text-white/90">{last ? formatCurrency(last.revenue || 0).replace('R$', '').trim() : '--'}</p>
           </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-1.5">
             <Activity size={12} className="text-accent-mint" />
             <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Saudável</span>
           </div>
           <ArrowRight size={14} className="text-text-muted group-hover:translate-x-1 group-hover:text-white transition-all" />
        </div>
      </Link>
    </motion.div>
  );
}
