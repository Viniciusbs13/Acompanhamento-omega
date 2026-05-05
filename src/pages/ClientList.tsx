import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Briefcase, TrendingUp, AlertTriangle, CheckCircle2, MoreVertical, LayoutGrid, List, Users, ArrowRight, Trash2 } from 'lucide-react';
import { storage } from '../lib/storage';
import { Client } from '../types';
import { calculateMetrics, getHealthStatus } from '../lib/calculations';
import { cn, formatCurrency } from '../lib/utils';
import { useVisibility } from '../contexts/VisibilityContext';
import { toast } from 'sonner';

export function ClientList() {
  const { isVisible } = useVisibility();
  const [clients, setClients] = useState<Client[]>([]);
  const [allEntries, setAllEntries] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  
  const refreshClients = async () => {
    setLoading(true);
    const data = await storage.getClients();
    setClients(data);
    
    // Fetch entries for all clients in parallel to avoid many Waterfall requests
    const entriesMap: Record<string, any[]> = {};
    if (data.length > 0) {
      await Promise.all(data.map(async (client) => {
         const ent = await storage.getEntries(client.id);
         entriesMap[client.id] = ent;
      }));
    }
    setAllEntries(entriesMap);
    setLoading(false);
  };

  useEffect(() => {
    refreshClients();
  }, []);

  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Tem certeza que deseja remover este cliente? Todos os dados vinculados serão apagados.")) {
      const toastId = toast.loading("Removendo cliente...");
      try {
        await storage.deleteClient(id);
        await refreshClients();
        toast.success("Cliente removido com sucesso", { id: toastId });
      } catch (error: any) {
        console.error("Erro ao deletar cliente:", error);
        toast.error("Erro ao remover cliente. Verifique suas permissões.", { id: toastId });
      }
    }
  };

  const categorizedClients = useMemo(() => {
    const base = clients.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    return {
      monthly: base.filter(c => c.billingModel !== 'ONE_OFF'),
      single: base.filter(c => c.billingModel === 'ONE_OFF')
    };
  }, [clients, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-medium tracking-tight">Clientes</h1>
          <p className="text-text-secondary text-sm">Gerencie sua carteira de contas e faturamentos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mr-2">
             <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white/10 text-white" : "text-text-muted hover:text-white")}><LayoutGrid size={16} /></button>
             <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white/10 text-white" : "text-text-muted hover:text-white")}><List size={16} /></button>
          </div>
          <Link 
            to="/clientes/novo"
            className="flex items-center gap-2 px-5 py-3 bg-accent-mint text-black font-bold rounded-xl hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/10"
          >
            <Plus size={18} />
            Cadastrar Cliente
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 p-2 glass rounded-2xl">
        <div className="flex-1 flex items-center gap-3 px-4 py-2">
          <Search size={18} className="text-text-muted" />
          <input 
            placeholder="Buscar por cliente ou plataforma..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-xl transition-colors">
          <Filter size={16} className="text-text-muted" />
          <span>Filtrar</span>
        </button>
      </div>

      {loading ? (
        <div className="py-32 flex justify-center">
          <div className="w-8 h-8 rounded-full border-t-2 border-accent-mint animate-spin" />
        </div>
      ) : (categorizedClients.monthly.length === 0 && categorizedClients.single.length === 0) ? (
        <div className="py-32 flex flex-col items-center text-center glass rounded-3xl border-dashed">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <Users size={32} className="text-text-muted" />
          </div>
          <h2 className="text-xl font-medium mb-1">Crie seu primeiro cliente</h2>
          <p className="text-text-secondary text-sm max-w-xs mb-8">
            Adicione os dados da empresa para começar a acompanhá-la profissionalmente.
          </p>
          <Link to="/clientes/novo" className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all">
            Começar configuração
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {categorizedClients.monthly.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-mint" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Planos Mensais</h3>
              </div>
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col gap-2"
              )}>
                {categorizedClients.monthly.map((client, i) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                     {viewMode === 'grid' ? (
                       <ClientGridItem client={client} entries={allEntries[client.id] || []} onDelete={handleDeleteClient} />
                     ) : (
                       <ClientListItem client={client} entries={allEntries[client.id] || []} onDelete={handleDeleteClient} />
                     )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {categorizedClients.single.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Trabalhos Únicos</h3>
              </div>
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col gap-2"
              )}>
                {categorizedClients.single.map((client, i) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                     {viewMode === 'grid' ? (
                       <ClientGridItem client={client} entries={allEntries[client.id] || []} onDelete={handleDeleteClient} />
                     ) : (
                       <ClientListItem client={client} entries={allEntries[client.id] || []} onDelete={handleDeleteClient} />
                     )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClientGridItem({ client, entries, onDelete }: { client: Client; entries: any[]; onDelete: (id: string, e: React.MouseEvent) => void }) {
  const { isVisible } = useVisibility();
  const last = entries[entries.length - 1];
  const metrics = last ? calculateMetrics(last, client.businessType) : null;
  const health = metrics ? getHealthStatus(metrics, 4) : 'GOOD';

  return (
    <div className="relative group h-full">
      <Link 
        to={`/clientes/${client.id}`}
        className="glass glass-hover p-6 rounded-3xl block h-full overflow-hidden"
      >
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black font-bold text-xl overflow-hidden" style={{ backgroundColor: client.brandColor }}>
              {client.logo ? (
                <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
              ) : (
                client.name.charAt(0)
              )}
            </div>
            <div>
              <h3 className="font-medium text-lg leading-none mb-1 group-hover:text-accent-mint transition-colors">{client.name}</h3>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{client.businessType}</span>
                {client.accountManager && (
                  <span className="text-[9px] text-accent-mint/70 font-medium">Gestor: {client.accountManager}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className={cn(
                "w-2 h-2 rounded-full",
                health === 'GOOD' ? "bg-accent-mint shadow-[0_0_10px_#00D9A3]" : health === 'WARNING' ? "bg-accent-amber" : "bg-accent-coral shadow-[0_0_10px_#FF4D4D]"
             )} />
          </div>
        </div>

        <div className="space-y-4">
          {client.performanceMode === 'LEADS' ? (
            <>
              <div className="flex justify-between items-baseline">
                 <span className="text-xs text-text-muted">Leads Totais</span>
                 <span className="text-xl font-medium tracking-tight">{last?.leads || 0}</span>
              </div>
              <div className="flex justify-between items-baseline">
                 <span className="text-xs text-text-muted">Vendas</span>
                 <span className="text-lg font-medium">{last?.sales || 0}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-baseline">
                 <span className="text-xs text-text-muted">ROAS Último Mês</span>
                 <span className="text-xl font-medium tracking-tight">{isVisible ? (metrics ? (metrics.roas || 0).toFixed(2) : '--') : '•••••'}</span>
              </div>
              <div className="flex justify-between items-baseline">
                 <span className="text-xs text-text-muted">Faturamento</span>
                 <span className="text-lg font-medium">{isVisible ? (last ? formatCurrency(last.revenue || 0) : '--') : '•••••'}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex -space-x-1.5">
            {client.channels.slice(0, 3).map((ch, i) => (
               <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-bg-base flex items-center justify-center text-[8px] font-bold" title={ch}>
                 {ch.charAt(0)}
               </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-accent-mint flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            DETALHES <TrendingUp size={10} />
          </span>
        </div>
      </Link>
      
      <button 
        onClick={(e) => onDelete(client.id, e)}
        className="absolute top-6 right-6 p-2 rounded-xl bg-bg-base/80 backdrop-blur-md border border-white/5 text-text-muted hover:bg-accent-coral/20 hover:text-accent-coral transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Excluir Cliente"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function ClientListItem({ client, entries, onDelete }: { client: Client; entries: any[]; onDelete: (id: string, e: React.MouseEvent) => void }) {
  const { isVisible } = useVisibility();
  const last = entries[entries.length - 1];
  const metrics = last ? calculateMetrics(last, client.businessType) : null;

  return (
    <div className="relative group">
      <Link 
        to={`/clientes/${client.id}`}
        className="glass glass-hover px-6 py-4 rounded-xl flex items-center gap-6"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold overflow-hidden shrink-0" style={{ backgroundColor: client.brandColor }}>
          {client.logo ? (
            <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
          ) : (
            client.name.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium group-hover:text-accent-mint transition-colors truncate">{client.name}</h4>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{client.businessType}</p>
            {client.accountManager && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <p className="text-[10px] text-accent-mint/60 font-medium">Gestor: {client.accountManager}</p>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:block w-32">
          <p className="text-[9px] text-text-muted uppercase font-bold mb-1">{client.performanceMode === 'LEADS' ? 'Leads' : 'ROAS'}</p>
          <p className="text-sm font-medium">
            {client.performanceMode === 'LEADS' 
              ? (last?.leads || 0)
              : (isVisible ? (metrics ? (metrics.roas || 0).toFixed(2) : '--') : '•••••')
            }
          </p>
        </div>
        <div className="hidden lg:block w-40">
          <p className="text-[9px] text-text-muted uppercase font-bold mb-1">{client.performanceMode === 'LEADS' ? 'Vendas' : 'Faturamento'}</p>
          <p className="text-sm font-medium">
            {client.performanceMode === 'LEADS'
              ? (last?.sales || 0)
              : (isVisible ? (last ? formatCurrency(last.revenue || 0) : '--') : '•••••')
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ArrowRight size={16} className="text-text-muted group-hover:text-white transition-colors" />
        </div>
      </Link>
      
      <button 
        onClick={(e) => onDelete(client.id, e)}
        className="absolute right-12 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-text-muted hover:bg-accent-coral/20 hover:text-accent-coral transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Excluir Cliente"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
