import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FileText, Search, ChevronRight, User, Calendar, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storage } from '../lib/storage';
import { formatCurrency, cn } from '../lib/utils';

export function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const clients = storage.getClients();
  
  const filteredClients = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [clients, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Relatórios de Performance</h1>
          <p className="text-text-muted">Gere documentos detalhados para seus clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Selecione um Cliente</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-accent-mint/50 transition-all"
              />
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {filteredClients.map(client => (
                <button 
                  key={client.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black shrink-0" style={{ backgroundColor: client.brandColor }}>
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-accent-mint transition-colors">{client.name}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{client.businessType}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl">
             <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Exportações Recentes</h3>
             <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-accent-coral/10 flex items-center justify-center text-accent-coral">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Relatório Abril/24</p>
                        <p className="text-[10px] text-text-muted">PDF • Gerado há 2 dias</p>
                      </div>
                    </div>
                    <ExternalLink size={12} className="text-text-muted group-hover:text-white transition-colors" />
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="glass rounded-3xl p-12 text-center h-[500px] flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-text-muted">
              <Filter size={32} className="opacity-20" />
            </div>
            <div className="max-w-xs">
              <h2 className="text-xl font-medium mb-2">Selecione um cliente para começar</h2>
              <p className="text-sm text-text-muted">Ao selecionar um cliente à esquerda, você poderá configurar o período e redigir a análise mensal.</p>
            </div>
            <Link 
              to="/clientes" 
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
            >
               Ir para carteira de clientes <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
