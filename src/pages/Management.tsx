import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Flag, 
  ExternalLink, 
  Users, 
  Search,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  CreditCard,
  Check,
  Play,
  Camera
} from 'lucide-react';
import { storage } from '../lib/storage';
import { Client, ManagementFlag, MonthlyPayment } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useVisibility } from '../contexts/VisibilityContext';
import { toast } from 'sonner';

const getClientMonthStats = (client: any) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const isRecurringClient = client.billingModel === 'RECURRING';

  const stats = {
    contentTotal: 0,
    contentDone: 0,
    capturesTotal: 0,
    capturesDone: 0
  };

  const isInMonth = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const checkDateOccurs = (date: Date, evt: any) => {
    const dateStr = date.toISOString().split('T')[0];
    if (evt.deletedDates?.includes(dateStr)) return false;
    const rType = evt.recurrenceType || (evt.isRecurring ? 'MONTHLY_DAY' : (evt.recurringDays && evt.recurringDays.length > 0) ? 'WEEKLY' : 'NONE');
    const effectiveR = (evt.type === 'content' && isRecurringClient && rType === 'NONE' && evt.isRecurring === undefined) ? 'MONTHLY_DAY' : rType;
    
    switch (effectiveR) {
      case 'DAILY': return true;
      case 'WEEKLY': return evt.recurringDays?.includes(date.getDay());
      case 'MONTHLY_DAY': return date.getDate() === new Date((evt.targetDate || evt.date) + "T12:00:00").getDate();
      case 'MONTHLY_ORDINAL': {
        if (!evt.ordinalWeekday) return false;
        const { ordinal, day } = evt.ordinalWeekday;
        if (date.getDay() !== day) return false;
        return Math.ceil(date.getDate() / 7) === ordinal;
      }
      default: return false;
    }
  };

  client.contentPlan?.items?.forEach((item: any) => {
    const isRecurring = item.recurrenceType 
      ? item.recurrenceType !== 'NONE'
      : (item.isRecurring || (item.recurringDays && item.recurringDays.length > 0) || (isRecurringClient && !item.recurringDays));

    if (isRecurring) {
      for (let d = 1; d <= daysInMonth; d++) {
        const checkDate = new Date(currentYear, currentMonth, d);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (checkDateOccurs(checkDate, { ...item, type: 'content' })) {
          stats.contentTotal++;
          if (item.completedDates?.includes(checkDateStr)) {
            stats.contentDone++;
          }
        }
      }
    } else {
      const itemDate = item.targetDate || item.date;
      if (itemDate && isInMonth(itemDate)) {
        stats.contentTotal++;
        if (item.status === 'POSTED') {
          stats.contentDone++;
        }
      }
    }
  });

  client.captures?.forEach((item: any) => {
    const isRecurring = item.recurrenceType ? item.recurrenceType !== 'NONE' : item.isRecurring;
    if (isRecurring) {
      for (let d = 1; d <= daysInMonth; d++) {
        const checkDate = new Date(currentYear, currentMonth, d);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (checkDateOccurs(checkDate, { ...item, type: 'capture' })) {
          stats.capturesTotal++;
          if (item.completedDates?.includes(checkDateStr)) {
            stats.capturesDone++;
          }
        }
      }
    } else {
      const itemDate = item.date;
      if (itemDate && isInMonth(itemDate)) {
        stats.capturesTotal++;
        if (item.status === 'DONE') {
          stats.capturesDone++;
        }
      }
    }
  });

  return stats;
};

const isContentDelayed = (client: any) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const isInMonth = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isRecurringClient = client.billingModel === 'RECURRING';

  // Check Content
  if (client.contentPlan?.items?.some((item: any) => {
    const isRecurring = item.recurrenceType 
      ? item.recurrenceType !== 'NONE'
      : (item.isRecurring || (item.recurringDays && item.recurringDays.length > 0) || (isRecurringClient && !item.recurringDays));

    if (isRecurring) {
      // Check days in current month up to yesterday
      const lastDayToCheck = today.getDate() - 1;
      if (lastDayToCheck < 1) return false;
      
      for (let d = 1; d <= lastDayToCheck; d++) {
        const checkDate = new Date(currentYear, currentMonth, d);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        const dateOccurs = (date: Date, evt: any) => {
          const rType = evt.recurrenceType || (evt.isRecurring ? 'MONTHLY_DAY' : (evt.recurringDays && evt.recurringDays.length > 0) ? 'WEEKLY' : 'NONE');
          const effectiveR = (evt.type === 'content' && isRecurringClient && rType === 'NONE' && evt.isRecurring === undefined) ? 'MONTHLY_DAY' : rType;
          if (evt.deletedDates?.includes(checkDateStr)) return false;

          switch (effectiveR) {
            case 'DAILY': return true;
            case 'WEEKLY': return evt.recurringDays?.includes(date.getDay());
            case 'MONTHLY_DAY': return date.getDate() === new Date((evt.targetDate || evt.date) + "T12:00:00").getDate();
            case 'MONTHLY_ORDINAL': {
              if (!evt.ordinalWeekday) return false;
              const { ordinal, day } = evt.ordinalWeekday;
              if (date.getDay() !== day) return false;
              return Math.ceil(date.getDate() / 7) === ordinal;
            }
            default: return false;
          }
        };

        if (dateOccurs(checkDate, { ...item, type: 'content' }) && !item.completedDates?.includes(checkDateStr)) {
          return true;
        }
      }
      return false;
    } else {
      const itemDate = item.targetDate || item.date;
      return item.status === 'PLANNED' && itemDate < todayStr && isInMonth(itemDate);
    }
  })) return true;

  // Check Captures/Meetings (similar logic)
  if (client.captures?.some((item: any) => {
    const itemDate = item.date;
    if (item.isRecurring) return false;
    return item.status === 'PLANNED' && itemDate < todayStr && isInMonth(itemDate);
  })) return true;

  if (client.meetings?.some((item: any) => {
    const itemDate = item.date;
    if (item.isRecurring) return false;
    return item.status === 'PLANNED' && itemDate < todayStr && isInMonth(itemDate);
  })) return true;
  
  return false;
};

export function Management() {
  const { isVisible } = useVisibility();
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const currentMonthNum = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [clientsData, paymentsData] = await Promise.all([
      storage.getClients(),
      storage.getPayments(currentMonthNum, currentYear)
    ]);
    setClients(clientsData);
    setPayments(paymentsData);
    setLoading(false);
  };

  const togglePayment = async (client: Client) => {
    const existingPayment = payments.find(p => p.clientId === client.id);
    const newStatus = existingPayment?.status === 'PAID' ? 'PENDING' : 'PAID';
    
    const payment: MonthlyPayment = {
      id: `${currentYear}-${currentMonthNum}-${client.id}`,
      clientId: client.id,
      month: currentMonthNum,
      year: currentYear,
      status: newStatus,
      value: client.planValue || 0,
      paidAt: newStatus === 'PAID' ? new Date().toISOString() : undefined
    };

    try {
      await storage.savePayment(payment);
      setPayments(prev => {
        const other = prev.filter(p => p.clientId !== client.id);
        return [...other, payment];
      });
      toast.success(newStatus === 'PAID' ? `Pagamento de ${client.name} confirmado` : `Pagamento de ${client.name} marcado como pendente`);
    } catch (error) {
      toast.error('Erro ao salvar pagamento');
    }
  };

  const categorizedClients = useMemo(() => {
    const base = clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.ownerNames?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return {
      monthly: base.filter(c => c.billingModel !== 'ONE_OFF'),
      single: base.filter(c => c.billingModel === 'ONE_OFF')
    };
  }, [clients, searchTerm]);

  const stats = useMemo(() => {
    const active = clients.length;
    const mrr = clients.filter(c => c.billingModel === 'RECURRING' || !c.billingModel).reduce((acc, c) => acc + (c.planValue || 0), 0);
    const projects = clients.filter(c => c.billingModel === 'ONE_OFF').reduce((acc, c) => acc + (c.planValue || 0), 0);
    const healthy = clients.filter(c => c.managementStatus === 'GREEN').length;
    return { active, mrr, projects, healthy };
  }, [clients]);

  const updateClientStatus = async (clientId: string, status: ManagementFlag) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const updatedClient = { ...client, managementStatus: status };
    
    try {
      await storage.saveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-accent-mint animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Gestão de Carteira</h1>
          <p className="text-text-muted text-sm">Controle administrativo e financeiro da agência</p>
        </div>
        
        <div className="relative group w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-accent-mint transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou dono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-accent-mint/50 transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard 
          label="Recorrência (MRR)" 
          value={stats.mrr} 
          isCurrency 
          icon={<DollarSign size={20} className="text-accent-mint" />}
          color="accent-mint"
        />
        <KPICard 
          label="Projetos Únicos" 
          value={stats.projects} 
          isCurrency 
          icon={<TrendingUp size={20} className="text-blue-400" />}
          color="blue-400"
        />
        <KPICard 
          label="Total em Carteira" 
          value={stats.mrr + stats.projects} 
          isCurrency 
          icon={<CheckCircle2 size={20} className="text-fuchsia-400" />}
          color="fuchsia-400"
        />
        <KPICard 
          label="Status Saudável" 
          value={`${Math.round((stats.healthy / stats.active) * 100 || 0)}%`} 
          icon={<CheckCircle2 size={20} className="text-white" />}
          color="white"
        />
      </div>

      {/* Financeiro / Pagamentos Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-mint/10 rounded-lg">
              <Calendar className="text-accent-mint" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-medium tracking-tight">Fluxo de Caixa: {monthNames[currentMonthNum]}</h2>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">Confirmação de recebimento mensal</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-mint/5 rounded-full border border-accent-mint/10">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-mint">Pago</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-coral/5 rounded-full border border-accent-coral/10">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-coral" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-coral">Pendente</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categorizedClients.monthly.map((client) => {
            const payment = payments.find(p => p.clientId === client.id);
            const isPaid = payment?.status === 'PAID';
            
            return (
              <motion.div 
                key={client.id}
                whileHover={{ y: -4 }}
                onClick={() => togglePayment(client)}
                className={cn(
                  "glass p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                  isPaid ? "border-accent-mint/30 bg-accent-mint/[0.03]" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-black shrink-0 shadow-lg transition-transform group-hover:scale-105" style={{ backgroundColor: client.brandColor }}>
                        {client.logo ? <img src={client.logo} className="w-full h-full object-cover rounded-xl" alt="" /> : client.name.charAt(0)}
                      </div>
                      {isPaid && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-mint rounded-full flex items-center justify-center text-black shadow-lg border-2 border-bg-base">
                          <Check size={10} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-white leading-tight truncate">{client.name}</span>
                      <span className="text-[10px] text-text-secondary mt-0.5">
                        {isVisible ? formatCurrency(client.planValue || 0) : '•••••'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                   {isPaid ? (
                     <div className="flex flex-col">
                        <span className="text-[10px] text-accent-mint font-bold uppercase tracking-tighter">Confirmado</span>
                        <span className="text-[8px] text-text-muted mt-0.5">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('pt-BR') : ''}</span>
                     </div>
                   ) : (
                     <div className="flex flex-col">
                        <span className="text-[10px] text-accent-coral font-bold uppercase tracking-tighter">Não Recebido</span>
                        <div className="flex items-center gap-1 mt-0.5">
                           <div className="w-1 h-1 rounded-full bg-accent-coral animate-pulse" />
                           <span className="text-[8px] text-text-muted italic">Aguardando...</span>
                        </div>
                     </div>
                   )}
                   
                   <button className={cn(
                     "px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all",
                     isPaid ? "hover:bg-accent-coral/20 hover:text-accent-coral text-text-muted" : "bg-accent-mint text-black"
                   )}>
                     {isPaid ? 'Estornar' : 'Confirmar'}
                   </button>
                </div>
                
                {/* Visual indicator corner */}
                <div className={cn(
                  "absolute top-0 right-0 w-8 h-8 -mr-4 -mt-4 rotate-45 transition-colors",
                  isPaid ? "bg-accent-mint/20" : "bg-transparent"
                )} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="space-y-12">
        {categorizedClients.monthly.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-mint" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Planos Mensais</h3>
            </div>
            <div className="glass rounded-3xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Conteúdo / Captação</th>
                      <th className="px-6 py-4">Dono / Sócios</th>
                      <th className="px-6 py-4">Gestor</th>
                      <th className="px-6 py-4">Valor do Plano</th>
                      <th className="px-6 py-4">Status / Flag</th>
                      <th className="px-6 py-4">Contrato</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {categorizedClients.monthly.map((client) => (
                      <ClientRow key={client.id} client={client} updateStatus={updateClientStatus} isVisible={isVisible} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {categorizedClients.single.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Trabalhos Únicos</h3>
            </div>
            <div className="glass rounded-3xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Conteúdo / Captação</th>
                      <th className="px-6 py-4">Dono / Sócios</th>
                      <th className="px-6 py-4">Gestor</th>
                      <th className="px-6 py-4">Valor do Trabalho</th>
                      <th className="px-6 py-4">Status / Flag</th>
                      <th className="px-6 py-4">Contrato</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {categorizedClients.single.map((client) => (
                      <ClientRow key={client.id} client={client} updateStatus={updateClientStatus} isVisible={isVisible} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {categorizedClients.monthly.length === 0 && categorizedClients.single.length === 0 && (
          <div className="py-20 text-center glass rounded-3xl border-dashed">
            <p className="text-text-muted italic">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientRow({ client, updateStatus, isVisible }: any) {
  const stats = getClientMonthStats(client);

  return (
    <tr key={client.id} className="hover:bg-white/[0.01] transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black shrink-0" style={{ backgroundColor: client.brandColor }}>
              {client.logo ? <img src={client.logo} className="w-full h-full object-cover rounded-lg" alt="" /> : client.name.charAt(0)}
            </div>
            {isContentDelayed(client) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-coral rounded-full border-2 border-bg-base animate-pulse shadow-[0_0_8px_rgba(255,77,77,0.8)]" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={cn("font-medium text-sm transition-colors", isContentDelayed(client) ? "text-accent-coral" : "text-white")}>{client.name}</span>
            {isContentDelayed(client) && (
              <span className="text-[8px] font-bold text-accent-coral uppercase leading-none mt-0.5">Postagem Atrasada</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-1.5">
                <Play size={12} className="text-accent-mint" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Vídeos</span>
             </div>
             <span className="text-xs font-medium text-white">{stats.contentDone}/{stats.contentTotal}</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-accent-mint transition-all" 
               style={{ width: `${(stats.contentDone / Math.max(stats.contentTotal, 1)) * 100}%` }} 
             />
          </div>
          
          <div className="flex items-center justify-between gap-4 mt-1">
             <div className="flex items-center gap-1.5">
                <Camera size={12} className="text-fuchsia-400" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Captação</span>
             </div>
             <span className="text-xs font-medium text-white">{stats.capturesDone}/{stats.capturesTotal}</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-fuchsia-400 transition-all" 
               style={{ width: `${(stats.capturesDone / Math.max(stats.capturesTotal, 1)) * 100}%` }} 
             />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-text-secondary italic">
        {client.ownerNames || 'Não informado'}
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
          client.accountManager === 'Não tem gestor' ? "bg-accent-coral/10 text-accent-coral border border-accent-coral/20" : "bg-white/5 text-text-secondary"
        )}>
          {client.accountManager || 'Pendente'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isVisible ? formatCurrency(client.planValue || 0) : '•••••'}
            </span>
            <span className={cn(
              "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
              client.billingModel === 'ONE_OFF' ? "bg-blue-400/10 text-blue-400 border border-blue-400/20" : "bg-accent-mint/10 text-accent-mint border border-accent-mint/20"
            )}>
              {client.billingModel === 'ONE_OFF' ? 'Projeto' : 'Mensal'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusDropdown 
          status={client.managementStatus || 'GREEN'} 
          onChange={(s) => updateStatus(client.id, s)} 
        />
      </td>
      <td className="px-6 py-4">
        {client.contractUrl ? (
          <a 
            href={client.contractUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 text-accent-mint hover:underline text-xs font-medium"
          >
            <FileText size={14} /> Link do Contrato
          </a>
        ) : (
          <span className="text-xs text-text-muted">Sem link</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <Link to={`/clientes/${client.id}`} className="p-2 hover:bg-white/5 rounded-lg inline-block text-text-muted hover:text-white transition-colors">
          <ExternalLink size={16} />
        </Link>
      </td>
    </tr>
  );
}

function KPICard({ label, value, isCurrency = false, icon, color }: any) {
  const { isVisible } = useVisibility();
  return (
    <div className="glass p-6 rounded-2xl relative group overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-white transition-colors">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-medium tracking-tighter">
          {isVisible ? (isCurrency ? formatCurrency(value).replace('R$', '').trim() : value) : '•••••'}
        </span>
        {isVisible && isCurrency && <span className="text-sm text-text-muted font-bold">BRL</span>}
      </div>
      <div className={cn(
        "absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent opacity-0 group-hover:opacity-100 transition-opacity",
        `via-${color}/20`
      )} />
    </div>
  );
}

function StatusDropdown({ status, onChange }: { status: ManagementFlag, onChange: (s: ManagementFlag) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const configs = {
    GREEN: { label: 'Saudável', color: 'bg-accent-mint', icon: CheckCircle2, text: 'text-accent-mint' },
    YELLOW: { label: 'Instável', color: 'bg-yellow-400', icon: AlertTriangle, text: 'text-yellow-400' },
    RED: { label: 'Crítico', color: 'bg-accent-coral', icon: XCircle, text: 'text-accent-coral' },
  };

  const current = configs[status];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-wider",
          status === 'GREEN' ? "border-accent-mint/20 bg-accent-mint/5 text-accent-mint" :
          status === 'YELLOW' ? "border-yellow-400/20 bg-yellow-400/5 text-yellow-400" :
          "border-accent-coral/20 bg-accent-coral/5 text-accent-coral"
        )}
      >
        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", current.color)} />
        {current.label}
        <ChevronDown size={12} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-40 bg-bg-elevated border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            {(Object.keys(configs) as ManagementFlag[]).map((s) => {
              const conf = configs[s];
              return (
                <button
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left"
                >
                  <div className={cn("w-2 h-2 rounded-full", conf.color)} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", conf.text)}>{conf.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
