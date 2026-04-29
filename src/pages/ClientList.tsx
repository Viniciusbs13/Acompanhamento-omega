import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Briefcase, TrendingUp, AlertTriangle, CheckCircle2, MoreVertical, LayoutGrid, List, Users, ArrowRight } from 'lucide-react';
import { storage } from '../lib/storage';
import { Client, MetricEntry } from '../types';
import { calculateMetrics, getHealthStatus } from '../lib/calculations';
import { cn, formatCurrency } from '../lib/utils';

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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

      {filteredClients.length === 0 ? (
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
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "flex flex-col gap-2"
        )}>
          {filteredClients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
               {viewMode === 'grid' ? (
                 <ClientGridItem client={client} />
               ) : (
                 <ClientListItem client={client} />
               )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientGridItem({ client }: { client: Client }) {
  const entries = storage.getEntries(client.id);
  const last = entries[entries.length - 1];
  const metrics = last ? calculateMetrics(last, client.businessType) : null;
  const health = metrics ? getHealthStatus(metrics, 4) : 'GOOD';

  return (
    <Link 
      to={`/clientes/${client.id}`}
      className="glass glass-hover p-6 rounded-3xl block group h-full relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black font-bold text-xl" style={{ backgroundColor: client.brandColor }}>
            {client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-medium text-lg leading-none mb-1 group-hover:text-accent-mint transition-colors">{client.name}</h3>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{client.businessType}</span>
          </div>
        </div>
        <div className={cn(
           "w-2 h-2 rounded-full",
           health === 'GOOD' ? "bg-accent-mint shadow-[0_0_10px_#00D9A3]" : health === 'WARNING' ? "bg-accent-amber" : "bg-accent-coral shadow-[0_0_10px_#FF4D4D]"
        )} />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
           <span className="text-xs text-text-muted">ROAS Último Mês</span>
           <span className="text-xl font-medium tracking-tight">{metrics ? metrics.roas.toFixed(2) : '--'}</span>
        </div>
        <div className="flex justify-between items-baseline">
           <span className="text-xs text-text-muted">Faturamento</span>
           <span className="text-lg font-medium">{last ? formatCurrency(last.revenue || 0) : '--'}</span>
        </div>
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
  );
}

function ClientListItem({ client }: { client: Client }) {
  const entries = storage.getEntries(client.id);
  const last = entries[entries.length - 1];
  const metrics = last ? calculateMetrics(last, client.businessType) : null;

  return (
    <Link 
      to={`/clientes/${client.id}`}
      className="glass glass-hover px-6 py-4 rounded-xl flex items-center gap-6 group"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold" style={{ backgroundColor: client.brandColor }}>
        {client.name.charAt(0)}
      </div>
      <div className="flex-1">
        <h4 className="font-medium group-hover:text-accent-mint transition-colors">{client.name}</h4>
        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{client.businessType}</p>
      </div>
      <div className="hidden md:block w-32">
        <p className="text-[9px] text-text-muted uppercase font-bold mb-1">ROAS</p>
        <p className="text-sm font-medium">{metrics ? metrics.roas.toFixed(2) : '--'}</p>
      </div>
      <div className="hidden lg:block w-40">
        <p className="text-[9px] text-text-muted uppercase font-bold mb-1">Faturamento</p>
        <p className="text-sm font-medium">{last ? formatCurrency(last.revenue || 0) : '--'}</p>
      </div>
      <div className="flex items-center gap-1 text-text-muted group-hover:text-white transition-colors">
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}
