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
  FileText
} from 'lucide-react';
import { storage } from '../lib/storage';
import { Client, ManagementFlag } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';

export function Management() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const data = await storage.getClients();
    setClients(data);
    setLoading(false);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.ownerNames?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  const stats = useMemo(() => {
    const active = clients.length;
    const mrr = clients.reduce((acc, c) => acc + (c.planValue || 0), 0);
    const healthy = clients.filter(c => c.managementStatus === 'GREEN').length;
    return { active, mrr, healthy };
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          label="Receita Mensal (MRR)" 
          value={stats.mrr} 
          isCurrency 
          icon={<DollarSign size={20} className="text-accent-mint" />}
          color="accent-mint"
        />
        <KPICard 
          label="Contratos Ativos" 
          value={stats.active} 
          icon={<Briefcase size={20} className="text-fuchsia-400" />}
          color="fuchsia-400"
        />
        <KPICard 
          label="Retenção Saudável" 
          value={`${Math.round((stats.healthy / stats.active) * 100 || 0)}%`} 
          icon={<CheckCircle2 size={20} className="text-blue-400" />}
          color="blue-400"
        />
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Dono / Sócios</th>
                <th className="px-6 py-4">Valor do Plano</th>
                <th className="px-6 py-4">Status / Flag</th>
                <th className="px-6 py-4">Contrato</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black shrink-0" style={{ backgroundColor: client.brandColor }}>
                        {client.logo ? <img src={client.logo} className="w-full h-full object-cover rounded-lg" alt="" /> : client.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary italic">
                    {client.ownerNames || 'Não informado'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{formatCurrency(client.planValue || 0)}</span>
                      <span className="text-[10px] text-text-muted truncate max-w-[150px]">{client.planScope || 'Escopo básico'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusDropdown 
                      status={client.managementStatus || 'GREEN'} 
                      onChange={(s) => updateClientStatus(client.id, s)} 
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
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <p className="text-text-muted italic">Nenhum cliente encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, isCurrency = false, icon, color }: any) {
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
          {isCurrency ? formatCurrency(value).replace('R$', '').trim() : value}
        </span>
        {isCurrency && <span className="text-sm text-text-muted font-bold">BRL</span>}
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
