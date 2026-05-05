import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Target, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Trash2,
  Edit2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  Search,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from '../lib/storage';
import { Sale, CommercialGoal, Client } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function Commercial() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [goals, setGoals] = useState<CommercialGoal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAddSale, setShowAddSale] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  // Month navigation
  const nextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  const prevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  
  const monthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
  const monthDisplay = selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  useEffect(() => {
    loadData();
  }, [monthKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allSales, allGoals, allClients] = await Promise.all([
        storage.getSales(),
        storage.getGoals(),
        storage.getClients()
      ]);
      setSales(allSales);
      setGoals(allGoals);
      setClients(allClients);
    } catch (error) {
      toast.error('Erro ao carregar dados comerciais');
    } finally {
      setLoading(false);
    }
  };

  // Filtered data for selected month
  const monthlySales = useMemo(() => {
    return sales.filter(s => s.date.startsWith(monthKey));
  }, [sales, monthKey]);

  const monthlyGoal = useMemo(() => {
    return goals.find(g => g.id === monthKey) || { id: monthKey, month: selectedMonth.getMonth() + 1, year: selectedMonth.getFullYear(), target: 0 };
  }, [goals, monthKey, selectedMonth]);

  // Metrics
  const totalRevenue = useMemo(() => monthlySales.reduce((acc, s) => acc + s.value, 0), [monthlySales]);
  const salesCount = monthlySales.length;
  const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
  const progress = monthlyGoal.target > 0 ? (totalRevenue / monthlyGoal.target) * 100 : 0;
  const isGoalReached = progress >= 100;

  // Previous Month Stats
  const prevMonthDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthSales = sales.filter(s => s.date.startsWith(prevMonthKey));
  const prevTotalRevenue = prevMonthSales.reduce((acc, s) => acc + s.value, 0);
  const growth = prevTotalRevenue > 0 ? ((totalRevenue / prevTotalRevenue) - 1) * 100 : 0;

  // Chart Data
  const chartData = useMemo(() => {
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const data = [];
    let cumulative = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${monthKey}-${String(i).padStart(2, '0')}`;
      const dayRevenue = monthlySales
        .filter(s => s.date.startsWith(dayStr))
        .reduce((acc, s) => acc + s.value, 0);
      
      cumulative += dayRevenue;
      data.push({
        day: i,
        venda: dayRevenue,
        acumulado: cumulative
      });
    }
    return data;
  }, [monthlySales, monthKey, selectedMonth]);

  const handleSaveGoal = async (target: number) => {
    const newGoal: CommercialGoal = { ...monthlyGoal, target };
    await storage.saveGoal(newGoal);
    setGoals(prev => prev.some(g => g.id === newGoal.id) ? prev.map(g => g.id === newGoal.id ? newGoal : g) : [...prev, newGoal]);
    setShowEditGoal(false);
    toast.success('Meta atualizada com sucesso');
  };

  const handleAddSale = async (data: any) => {
    let clientId = data.clientId;
    let clientName = '';

    if (clientId === 'new') {
      const newClientId = Math.random().toString(36).substring(7);
      const newClient: Client = {
        id: newClientId,
        name: data.newClientName,
        brandColor: '#00D9A3',
        businessType: 'B2B_LEADS',
        smartGoal: { currentRevenue: 0, targetRevenue: 0, durationMonths: 1, adSpend: 0, funnelSteps: [], ticket: 0 },
        channels: [],
        createdAt: new Date().toISOString(),
        ownerNames: data.newClientName,
        planScope: data.newClientContact, 
        billingModel: data.contractType || 'RECURRING',
      };
      await storage.saveClient(newClient);
      setClients(prev => [...prev, newClient]);
      clientId = newClientId;
      clientName = data.newClientName;
    } else {
      const client = clients.find(c => c.id === clientId);
      clientName = client?.name || 'Cliente Avulso';
    }

    const newSale: Sale = {
      id: Math.random().toString(36).substring(7),
      clientId,
      clientName,
      service: data.service || '',
      value: Number(data.value) || 0,
      date: data.date || new Date().toISOString(),
      status: (data.status as any) || 'PAID',
      origin: data.origin || 'Instagram'
    };
    await storage.saveSale(newSale);
    setSales(prev => [newSale, ...prev]);
    setShowAddSale(false);
    toast.success('Venda registrada!');
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('Deseja excluir esta venda?')) {
      try {
        await storage.deleteSale(id);
        setSales(prev => prev.filter(s => s.id !== id));
        toast.success('Venda excluída');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Erro ao excluir venda. Verifique as permissões.');
      }
    }
  };

  const getProgressColor = (val: number) => {
    if (val < 50) return 'bg-accent-coral';
    if (val < 80) return 'bg-yellow-500';
    return 'bg-accent-mint';
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-medium tracking-tight">Comercial</h1>
          <p className="text-text-secondary mt-1">Gestão de vendas, metas e performance</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
          <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 py-1">
            <Calendar size={18} className="text-accent-mint" />
            <span className="text-sm font-bold uppercase tracking-widest min-w-[140px] text-center capitalize">
              {monthDisplay}
            </span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="Faturamento Total" 
          value={totalRevenue} 
          isCurrency 
          icon={DollarSign} 
          color="text-accent-mint"
          trend={growth}
        />
        <SummaryCard 
          label="Meta Mensal" 
          value={monthlyGoal.target} 
          isCurrency 
          icon={Target} 
          action={() => setShowEditGoal(true)}
          color={isGoalReached ? "text-accent-mint" : "text-white"}
        />
        <SummaryCard 
          label="Vendas Realizadas" 
          value={salesCount} 
          icon={ShoppingCart} 
          trend={prevMonthSales.length > 0 ? ((salesCount / prevMonthSales.length) - 1) * 100 : 0}
        />
        <SummaryCard 
          label="Ticket Médio" 
          value={avgTicket} 
          isCurrency 
          icon={TrendingUp} 
        />
      </div>

      {/* Progress & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn(
          "lg:col-span-2 glass rounded-3xl p-8 space-y-8 relative overflow-hidden transition-all duration-1000",
          isGoalReached && "border-accent-mint/30 shadow-[0_0_50px_-15px_rgba(0,217,163,0.2)]"
        )}>
          {isGoalReached && (
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-8 text-4xl"
            >
              🎯
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Desempenho da Meta</h3>
              {isGoalReached && (
                <p className="text-xs text-accent-mint font-bold uppercase mt-1 animate-pulse">Meta batida! Parabéns! 🎉</p>
              )}
            </div>
            <div className="text-right">
               <span className={cn("text-2xl font-medium tracking-tighter", isGoalReached ? "text-accent-mint" : "text-white")}>
                {progress.toFixed(1)}%
               </span>
               <p className="text-[10px] font-bold uppercase text-text-muted">da meta batida</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                className={cn("h-full transition-all duration-1000", getProgressColor(progress))}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-text-muted">
              <span>R$ 0</span>
              <span className="text-white">R$ {totalRevenue.toLocaleString()}</span>
              <span>R$ {monthlyGoal.target.toLocaleString()}</span>
            </div>
          </div>

          <div className="h-[200px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D9A3" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00D9A3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="acumulado" stroke="#00D9A3" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 flex flex-col justify-between">
           <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Previsão de Ritmo</h3>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-mint/10 flex items-center justify-center text-accent-mint">
                       <BarChart3 size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase text-text-muted">Faturamento Previsto</p>
                       <p className="text-xl font-medium tracking-tight">
                         R$ {((totalRevenue / (new Date().getDate())) * (new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate())).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 text-sm">
                 <div className="flex justify-between items-center py-2 border-b border-white/5">
                   <span className="text-text-secondary">Faltam para meta</span>
                   <span className="font-medium text-accent-coral">
                     R$ {Math.max(0, monthlyGoal.target - totalRevenue).toLocaleString()}
                   </span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-white/5">
                   <span className="text-text-secondary">Ritmo diário</span>
                   <span className="font-medium">
                     R$ {(totalRevenue / (new Date().getDate())).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                   </span>
                 </div>
              </div>
           </div>

           <button 
             onClick={() => setShowAddSale(true)}
             className="w-full py-4 bg-accent-mint text-black rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
           >
             <Plus size={20} /> Nova Venda
           </button>
        </div>
      </div>

      {/* Sales Registry */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Registro de Vendas</h3>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Buscar venda..." 
                  className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-accent-mint/50 transition-all"
                />
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 opacity-50">
               <Filter size={14} /> Filtros
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-left">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Cliente</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Serviço/Produto</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Origem</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Valor</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Data</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthlySales.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-accent-mint/10 flex items-center justify-center text-accent-mint">
                          <Users size={14} />
                       </div>
                       <span className="font-medium text-sm">{sale.clientName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-text-secondary">{sale.service}</td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded-full text-text-muted uppercase tracking-widest">
                      {sale.origin}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-medium text-accent-mint">
                    R$ {sale.value.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-xs text-text-muted">
                    {new Date(sale.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest",
                      sale.status === 'PAID' ? "text-accent-mint" : "text-yellow-500"
                    )}>
                      {sale.status === 'PAID' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {sale.status === 'PAID' ? 'Pago' : 'Pendente'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDeleteSale(sale.id)}
                      className="p-2 text-text-muted hover:text-accent-coral transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 active:scale-95"
                      title="Excluir venda"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {monthlySales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-text-muted italic">
                    Nenhuma venda registrada para este mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditGoal && (
          <Modal title="Editar Meta Mensal" onClose={() => setShowEditGoal(false)}>
             <div className="space-y-6">
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Valor da Meta (R$)</label>
                   <input 
                    type="number" 
                    defaultValue={monthlyGoal.target} 
                    onChange={(e) => monthlyGoal.target = Number(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium text-xl"
                   />
                </div>
                <button 
                  onClick={() => handleSaveGoal(monthlyGoal.target)}
                  className="w-full py-4 bg-accent-mint text-black rounded-xl font-bold uppercase tracking-widest"
                >
                  Salvar Meta
                </button>
             </div>
          </Modal>
        )}

        {showAddSale && (
          <Modal title="Nova Venda" onClose={() => setShowAddSale(false)}>
             <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.currentTarget);
               handleAddSale(Object.fromEntries(formData.entries()));
             }} className="space-y-6">
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Cliente</label>
                      <select 
                        name="clientId" 
                        id="clientSelect"
                        onChange={(e) => {
                          const target = document.getElementById('newClientInput');
                          if (target) target.style.display = e.target.value === 'new' ? 'block' : 'none';
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium"
                        required
                      >
                         <option value="">Selecione um cliente...</option>
                         {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         <option value="new" className="text-accent-mint font-bold">+ Cadastrar Novo Cliente</option>
                      </select>
                   </div>
                   
                   <div id="newClientInput" style={{ display: 'none' }} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Dados do Novo Cliente</label>
                        <input 
                          name="newClientName" 
                          placeholder="Nome Completo"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium mb-3" 
                        />
                        <input 
                          name="newClientContact" 
                          placeholder="WhatsApp ou Email"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium mb-3" 
                        />
                        <div className="grid grid-cols-2 gap-2">
                           <label className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:border-accent-mint/50 transition-colors">
                              <input type="radio" name="contractType" value="RECURRING" defaultChecked className="accent-accent-mint" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Mensal</span>
                           </label>
                           <label className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:border-accent-mint/50 transition-colors">
                              <input type="radio" name="contractType" value="ONE_OFF" className="accent-accent-mint" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Único</span>
                           </label>
                        </div>
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Serviço/Produto</label>
                    <input name="service" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Valor (R$)</label>
                    <input type="number" name="value" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Data</label>
                    <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Origem</label>
                    <select name="origin" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium">
                       <option value="Instagram">Instagram</option>
                       <option value="Indicação">Indicação</option>
                       <option value="Tráfego Pago">Tráfego Pago</option>
                       <option value="YouTube">YouTube</option>
                       <option value="Eventos">Eventos</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-accent-mint text-black rounded-xl font-bold uppercase tracking-widest">
                  Confirmar Venda
                </button>
             </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value, isCurrency, icon: Icon, color = "text-white", action, trend }: any) {
  return (
    <div 
      onClick={action}
      className={cn(
        "glass p-6 rounded-3xl space-y-4 group transition-all",
        action && "cursor-pointer hover:border-accent-mint/30 shadow-[0_0_20px_-10px_rgba(255,255,255,0)] hover:shadow-[0_0_20px_-10px_rgba(255,255,255,0.1)]"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-accent-mint transition-colors">
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg",
            trend >= 0 ? "bg-accent-mint/10 text-accent-mint" : "bg-accent-coral/10 text-accent-coral"
          )}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
        {action && !trend && <Plus size={16} className="text-text-muted" />}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
        <p className={cn("text-2xl font-medium tracking-tight mt-1", color)}>
          {isCurrency ? `R$ ${value.toLocaleString()}` : value}
        </p>
      </div>
    </div>
  );
}

function TrendingDown({ size, className }: any) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="glass w-full max-w-lg rounded-[32px] overflow-hidden border border-white/10"
      >
        <div className="p-8 flex items-center justify-between border-b border-white/5">
           <h2 className="text-xl font-medium tracking-tight">{title}</h2>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
             <ChevronLeft size={20} className="rotate-180" />
           </button>
        </div>
        <div className="p-8">
           {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
