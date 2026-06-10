import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Calendar, 
  Star, 
  BookOpen, 
  TrendingUp, 
  Eye, 
  Edit3, 
  Layers, 
  Video, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  X, 
  ChevronRight,
  Sparkle,
  MessageSquare,
  AlertCircle,
  FolderMinus,
  Crown
} from 'lucide-react';
import { storage } from '../lib/storage';
import { toast } from 'sonner';
import { Creative, CreativeStatus } from '../types';

export function TrafficWorkspace() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modal & Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [objectiveFilter, setObjectiveFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');

  // Form Fields State
  const [formId, setFormId] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formStatus, setFormStatus] = useState<CreativeStatus>('IDEIA');
  const [formType, setFormType] = useState<string>('Gancho de Dor');
  const [formObjective, setFormObjective] = useState<string>('Captação');
  const [formCreationDate, setFormCreationDate] = useState<string>('');
  const [formPublishDate, setFormPublishDate] = useState<string>('');
  const [formValidationDate, setFormValidationDate] = useState<string>('');
  const [formRating, setFormRating] = useState<number>(3);
  const [formValidationReason, setFormValidationReason] = useState<string>('');
  const [formScript, setFormScript] = useState<string>('');
  const [formObservations, setFormObservations] = useState<string>('');
  const [formLearnings, setFormLearnings] = useState<string>('');

  // Dropdown constants
  const creativeTypes = [
    'Gancho de Dor',
    'Storytelling',
    'Autoridade',
    'Case',
    'Lista',
    'Oferta Direta',
    'Bastidores',
    'Quebra de Objeção',
    'Tendência',
    'Outro'
  ];

  const creativeObjectives = [
    'Captação',
    'Conversão',
    'Autoridade',
    'Engajamento',
    'Remarketing'
  ];

  const statusOptions: { value: CreativeStatus; label: string; color: string; bg: string; dot: string }[] = [
    { value: 'IDEIA', label: 'Ideia', color: 'text-accent-amber', bg: 'bg-accent-amber/10 border-accent-amber/20', dot: '🔴' }, // yellow dot
    { value: 'PRODUZIDO', label: 'Produzido', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20', dot: '🔵' }, // blue dot
    { value: 'VALIDADO', label: 'Validado', color: 'text-accent-mint', bg: 'bg-accent-mint/10 border-accent-mint/20', dot: '🟢' }, // green dot
    { value: 'DESCARTADO', label: 'Descartado', color: 'text-accent-coral', bg: 'bg-accent-coral/10 border-accent-coral/20', dot: '🟡' } // red dot
  ];

  // Load Creatives
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await storage.getCreatives();
      // Sort creatives by code descending or creation date descending
      const sortedData = data.sort((a, b) => {
        return b.code.localeCompare(a.code);
      });
      setCreatives(sortedData);
    } catch (error) {
      toast.error('Erro ao carregar banco de criativos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Action: Update Status with simple click
  const handleQuickStatusChange = async (creative: Creative, newStatus: CreativeStatus) => {
    let updatedCreative = { ...creative, status: newStatus };
    
    // Auto populate dates for validation or publication
    const today = new Date().toISOString().split('T')[0];
    if (newStatus === 'VALIDADO' && !creative.validationDate) {
      updatedCreative.validationDate = today;
    } else if (newStatus === 'PRODUZIDO' && !creative.publishDate) {
      updatedCreative.publishDate = today;
    } else if (newStatus === 'IDEIA') {
      updatedCreative.publishDate = '';
      updatedCreative.validationDate = '';
    }

    try {
      await storage.saveCreative(updatedCreative);
      toast.success(`Criativo ${creative.code} atualizado para ${newStatus}`);
      loadData();
      if (selectedCreative?.id === creative.id) {
        setSelectedCreative(updatedCreative);
      }
    } catch (e) {
      toast.error('Erro ao atualizar status.');
    }
  };

  // Quick Action: Update Rating
  const handleQuickRatingChange = async (creative: Creative, newRating: number) => {
    const updated = { ...creative, rating: newRating };
    try {
      await storage.saveCreative(updated);
      toast.success(`Avaliação de ${creative.code} atualizada para ${newRating} estrelas`);
      loadData();
      if (selectedCreative?.id === creative.id) {
        setSelectedCreative(updated);
      }
    } catch (e) {
      toast.error('Erro ao atualizar nota.');
    }
  };

  // Calculate stats for top of page
  const stats = useMemo(() => {
    const total = creatives.length;
    const validados = creatives.filter(c => c.status === 'VALIDADO');
    const emProducao = creatives.filter(c => c.status === 'PRODUZIDO');
    const descartados = creatives.filter(c => c.status === 'DESCARTADO');
    
    // Validation Rate: (Validado / Total) * 100
    const validationRate = total > 0 ? ((validados.length / total) * 100).toFixed(0) : '0';
    
    // Find last validated creative (based on validationDate, or creationDate, or highest code)
    const sortedValinados = [...validados].sort((a, b) => {
      const dateA = a.validationDate || a.creationDate;
      const dateB = b.validationDate || b.creationDate;
      return dateB.localeCompare(dateA);
    });
    const lastValidated = sortedValinados[0] || null;

    return {
      total,
      validados: validados.length,
      emProducao: emProducao.length,
      descartados: descartados.length,
      validationRate: `${validationRate}%`,
      lastValidated
    };
  }, [creatives]);

  // Next automatic code calculation (AD001, AD002, AD003...)
  const nextAutomaticCode = useMemo(() => {
    if (creatives.length === 0) return 'AD001';
    let maxNum = 0;
    creatives.forEach(c => {
      const match = c.code.match(/^AD(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `AD${String(maxNum + 1).padStart(3, '0')}`;
  }, [creatives]);

  // Open Form for Adding
  const handleOpenAddForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormId(`creative_${Date.now()}`);
    setFormCode(nextAutomaticCode);
    setFormTitle('');
    setFormStatus('IDEIA');
    setFormType('Gancho de Dor');
    setFormObjective('Captação');
    setFormCreationDate(today);
    setFormPublishDate('');
    setFormValidationDate('');
    setFormRating(3);
    setFormValidationReason('');
    setFormScript('');
    setFormObservations('');
    setFormLearnings('');
    setSelectedCreative(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (creative: Creative, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormId(creative.id);
    setFormCode(creative.code);
    setFormTitle(creative.title);
    setFormStatus(creative.status);
    setFormType(creative.type);
    setFormObjective(creative.objective);
    setFormCreationDate(creative.creationDate);
    setFormPublishDate(creative.publishDate || '');
    setFormValidationDate(creative.validationDate || '');
    setFormRating(creative.rating);
    setFormValidationReason(creative.validationReason || '');
    setFormScript(creative.script || '');
    setFormObservations(creative.observations || '');
    setFormLearnings(creative.learnings || '');
    setSelectedCreative(creative);
    setIsFormOpen(true);
  };

  // Submit Form
  const handleSubmitCreative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const payload: Creative = {
      id: formId,
      code: formCode,
      title: formTitle.trim(),
      status: formStatus,
      type: formType,
      objective: formObjective,
      creationDate: formCreationDate,
      publishDate: formPublishDate || undefined,
      validationDate: formValidationDate || undefined,
      rating: formRating,
      validationReason: formValidationReason.trim() || undefined,
      script: formScript.trim() || undefined,
      observations: formObservations.trim() || undefined,
      learnings: formLearnings.trim() || undefined,
    };

    // Auto validation logic: if status is VALIDADO and validationDate is empty, fill with today
    if (formStatus === 'VALIDADO' && !payload.validationDate) {
      payload.validationDate = new Date().toISOString().split('T')[0];
    } else if (formStatus === 'PRODUZIDO' && !payload.publishDate) {
      payload.publishDate = new Date().toISOString().split('T')[0];
    }

    try {
      await storage.saveCreative(payload);
      toast.success(selectedCreative ? 'Criativo atualizado com sucesso!' : 'Criativo cadastrado com sucesso!');
      setIsFormOpen(false);
      loadData();
      if (selectedCreative && selectedCreative.id === formId) {
        setSelectedCreative(payload);
      }
    } catch (err) {
      console.error('Save creative error:', err);
      let errorMsg = 'Erro ao salvar criativo';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errorMsg += `: ${parsed.error}`;
          } else {
            errorMsg += `: ${err.message}`;
          }
        } catch {
          errorMsg += `: ${err.message}`;
        }
      }
      toast.error(errorMsg);
    }
  };

  // Delete Creative
  const handleDeleteCreative = async (id: string, code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Deseja realmente excluir o criativo ${code}?`)) return;

    try {
      await storage.deleteCreative(id);
      toast.success(`Criativo ${code} excluído com sucesso!`);
      setIsDetailOpen(false);
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir criativo');
    }
  };

  // Open Details panel/modal
  const handleOpenDetails = (creative: Creative) => {
    setSelectedCreative(creative);
    setIsDetailOpen(true);
  };

  // Filter creatives list
  const filteredCreatives = useMemo(() => {
    return creatives.filter(c => {
      // Search
      const matchesSearch = 
        c.title.toLowerCase().includes(search.toLowerCase()) || 
        c.code.toLowerCase().includes(search.toLowerCase()) || 
        (c.script && c.script.toLowerCase().includes(search.toLowerCase())) ||
        (c.learnings && c.learnings.toLowerCase().includes(search.toLowerCase()));

      // Status
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      // Type
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;

      // Objective
      const matchesObjective = objectiveFilter === 'ALL' || c.objective === objectiveFilter;

      // Rating
      const matchesRating = ratingFilter === 'ALL' || c.rating === ratingFilter;

      return matchesSearch && matchesStatus && matchesType && matchesObjective && matchesRating;
    });
  }, [creatives, search, statusFilter, typeFilter, objectiveFilter, ratingFilter]);

  // Hall of Winners (Only VALIDADO)
  const hallOfWinners = useMemo(() => {
    return creatives.filter(c => c.status === 'VALIDADO');
  }, [creatives]);

  // Formatting date functions
  const formatDateString = (dt: string | undefined) => {
    if (!dt) return '-';
    const parts = dt.split('-');
    if (parts.length !== 3) return dt;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-white bg-black/40 p-1 rounded-3xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-mono font-semibold px-2 py-0.5 rounded bg-accent-mint/10 border border-accent-mint/20 text-accent-mint">
              MKT Intelligence Lab
            </span>
            <span className="text-text-muted text-[10px] font-mono">v1.5 Premium</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-mint">
            Banco de Inteligência de Criativos
          </h1>
          <p className="text-sm text-text-secondary">
            Consórcio estratégico de roteiros, aprendizados e validações de anúncios da Omega Agency.
          </p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-2 bg-accent-mint text-black font-bold px-5 py-3 rounded-xl text-sm hover:bg-accent-mint/90 hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-accent-mint/20 shrink-0"
        >
          <Plus size={18} />
          Novo Criativo
        </button>
      </div>

      {/* DASHBOARD STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Creatives */}
        <div className="glass glass-hover p-4 rounded-2xl flex flex-col justify-between min-h-[100px] relative overflow-hidden group">
          <div className="absolute right-2 top-2 opacity-5 text-white group-hover:scale-110 transition-transform">
            <Video size={40} />
          </div>
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest leading-none">Total Criativos</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">{stats.total}</span>
            <span className="text-xs text-text-muted font-mono">unidades</span>
          </div>
        </div>

        {/* Validated */}
        <div className="glass glass-hover p-4 rounded-2xl flex flex-col justify-between min-h-[100px] relative overflow-hidden group border-accent-mint/15">
          <div className="absolute right-2 top-2 opacity-5 text-accent-mint group-hover:scale-110 transition-transform">
            <CheckCircle2 size={40} />
          </div>
          <p className="text-[10px] uppercase font-bold text-accent-mint tracking-widest leading-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" />
            Validados
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold tracking-tight text-accent-mint">{stats.validados}</span>
            <span className="text-xs text-accent-mint/50 font-mono">ativos</span>
          </div>
        </div>

        {/* In Production */}
        <div className="glass glass-hover p-4 rounded-2xl flex flex-col justify-between min-h-[100px] relative overflow-hidden group border-sky-500/15">
          <div className="absolute right-2 top-2 opacity-5 text-sky-400 group-hover:scale-110 transition-transform">
            <Clock size={40} />
          </div>
          <p className="text-[10px] uppercase font-bold text-sky-400 tracking-widest leading-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Em Produção
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold tracking-tight text-sky-400">{stats.emProducao}</span>
            <span className="text-xs text-sky-400/50 font-mono">scripts</span>
          </div>
        </div>

        {/* Discarded */}
        <div className="glass glass-hover p-4 rounded-2xl flex flex-col justify-between min-h-[100px] relative overflow-hidden group border-accent-coral/15">
          <div className="absolute right-2 top-2 opacity-10 text-accent-coral group-hover:scale-110 transition-transform">
            <FolderMinus size={40} />
          </div>
          <p className="text-[10px] uppercase font-bold text-accent-coral tracking-widest leading-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-coral" />
            Descartados
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold tracking-tight text-accent-coral">{stats.descartados}</span>
            <span className="text-xs text-accent-coral/50 font-mono">histórico</span>
          </div>
        </div>

        {/* Validation Rate */}
        <div className="glass glass-hover p-4 rounded-2xl flex flex-col justify-between min-h-[100px] relative overflow-hidden group border-accent-mint/10">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest leading-none">Taxa Validação</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold tracking-tight text-accent-mint">{stats.validationRate}</span>
          </div>
          {/* Simple progress metric */}
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-accent-mint h-full rounded-full transition-all duration-1000" 
              style={{ width: stats.validationRate }}
            />
          </div>
        </div>

        {/* Last Validated */}
        <div className="glass glass-hover p-4 rounded-2xl flex flex-col justify-between min-h-[100px] col-span-2 lg:col-span-1 border-white/5 bg-gradient-to-br from-white/[0.02] to-accent-mint/[0.02]">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest leading-none">Último Validado</p>
          {stats.lastValidated ? (
            <div 
              onClick={() => handleOpenDetails(stats.lastValidated!)}
              className="group cursor-pointer mt-2 text-left"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs bg-accent-mint/10 text-accent-mint font-mono font-bold px-1.5 py-0.5 rounded border border-accent-mint/10">
                  {stats.lastValidated.code}
                </span>
                <span className="text-xs text-white group-hover:text-accent-mint font-medium truncate flex-1 block">
                  {stats.lastValidated.title}
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-1 font-mono">
                {formatDateString(stats.lastValidated.validationDate)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-text-muted mt-2">Nenhum criativo validado ainda</p>
          )}
        </div>
      </div>

      {/* SEÇÃO ESPECIAL - HALL DOS VENCEDORES (GOLD / CROWN THEMED) */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-accent-mint/20 relative overflow-hidden bg-gradient-to-r from-accent-mint/[0.02] via-transparent to-transparent">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-accent-mint/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute left-10 bottom-0 w-48 h-48 bg-accent-amber/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-accent-amber/20 to-accent-mint/10 rounded-2xl text-accent-amber border border-accent-amber/30 shadow-[0_0_20px_-5px_rgba(255,176,32,0.3)]">
              <Crown size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                HALL DOS VENCEDORES <span className="text-xs text-accent-amber font-mono">Biblioteca de Elite</span>
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                Exibição instantânea das campanhas e ganchos validados que superaram as metas. O patrimônio intelectual da Omega.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-text-secondary shrink-0">
            {hallOfWinners.length} Criativos de Elite
          </span>
        </div>

        {hallOfWinners.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm space-y-2">
            <Sparkles className="mx-auto text-text-muted opacity-4 a-pulse" size={32} />
            <p>Selecione ou edite o status de um criativo para "Validado" para incluí-lo aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hallOfWinners.map(winner => (
              <div 
                key={winner.id}
                onClick={() => handleOpenDetails(winner)}
                className="glass hover:bg-white/[0.04] p-5 rounded-2xl border border-accent-amber/15 hover:border-accent-amber/30 cursor-pointer group flex flex-col justify-between transition-all duration-300 relative"
              >
                {/* Glow bar */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-amber to-accent-mint opacity-40 rounded-t-full group-hover:opacity-100 transition-opacity" />
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-accent-amber/10 border border-accent-amber/20 text-accent-amber">
                      {winner.code}
                    </span>
                    <div className="flex gap-1 text-accent-amber">
                      {Array.from({ length: winner.rating }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-semibold text-white group-hover:text-accent-amber text-sm leading-snug line-clamp-2 mb-2 text-left">
                    {winner.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-y border-white/5 mb-3 text-left">
                    <div>
                      <p className="text-text-muted font-normal">Tipo</p>
                      <p className="font-medium text-white max-w-[120px] truncate">{winner.type}</p>
                    </div>
                    <div>
                      <p className="text-text-muted font-normal">Objetivo</p>
                      <p className="font-medium text-white max-w-[120px] truncate">{winner.objective}</p>
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  {winner.validationReason ? (
                    <div className="bg-accent-mint/5 border border-accent-mint/10 rounded-xl p-2.5 space-y-1">
                      <p className="text-[9px] uppercase font-bold text-accent-mint tracking-wider flex items-center gap-1 leading-none">
                        <Sparkle size={10} /> Motivo da Validação
                      </p>
                      <p className="text-xs font-medium text-white leading-tight line-clamp-2">
                        {winner.validationReason}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-muted italic">Nenhum motivo registrado</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-text-muted mt-3 font-mono pt-1">
                    <span>Validação:</span>
                    <span className="text-white font-medium">{formatDateString(winner.validationDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BANCO DE CRIATIVOS - LIST, FILTERS, SEARCH */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        {/* Header & Controls */}
        <div className="p-6 md:p-8 border-b border-white/5 space-y-4 bg-gradient-to-b from-white/[0.012] to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight text-white text-left">
              Biblioteca do Laboratório
            </h2>
            <p className="text-xs text-text-secondary">
              Gerencie scripts, ideias brutas, notas internas e relacione os aprendizados coletados.
            </p>
          </div>

          {/* Filters bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Buscar código, título, roteiro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-mint/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-all placeholder:text-text-muted"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 pr-1 py-1 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-text-muted pl-3 selection:bg-none">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs text-white outline-none cursor-pointer pr-4"
              >
                <option value="ALL" className="bg-[#0A0A0B]">Qualquer um</option>
                <option value="IDEIA" className="bg-[#0A0A0B]">🟡 Ideia</option>
                <option value="PRODUZIDO" className="bg-[#0A0A0B]">🔵 Produzido</option>
                <option value="VALIDADO" className="bg-[#0A0A0B]">🟢 Validado</option>
                <option value="DESCARTADO" className="bg-[#0A0A0B]">🔴 Descartado</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 pr-1 py-1 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-text-muted pl-3">Tipo</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs text-white outline-none cursor-pointer pr-4"
              >
                <option value="ALL" className="bg-[#0A0A0B]">Qualquer um</option>
                {creativeTypes.map(type => (
                  <option key={type} value={type} className="bg-[#0A0A0B]">{type}</option>
                ))}
              </select>
            </div>

            {/* Objective Filter */}
            <div className="flex items-center gap-1.5 pr-1 py-1 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-text-muted pl-3">Meta</span>
              <select
                value={objectiveFilter}
                onChange={(e) => setObjectiveFilter(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs text-white outline-none cursor-pointer pr-4"
              >
                <option value="ALL" className="bg-[#0A0A0B]">Qualquer um</option>
                {creativeObjectives.map(obj => (
                  <option key={obj} value={obj} className="bg-[#0A0A0B]">{obj}</option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-1.5 pr-1 py-1 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-text-muted pl-3">Nota</span>
              <select
                value={String(ratingFilter)}
                onChange={(e) => setRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="flex-1 bg-transparent border-none text-xs text-white outline-none cursor-pointer pr-4"
              >
                <option value="ALL" className="bg-[#0A0A0B]">Qualquer uma</option>
                <option value="5" className="bg-[#0A0A0B]">⭐⭐⭐⭐⭐ (5)</option>
                <option value="4" className="bg-[#0A0A0B]">⭐⭐⭐⭐ (4)</option>
                <option value="3" className="bg-[#0A0A0B]">⭐⭐⭐ (3)</option>
                <option value="2" className="bg-[#0A0A0B]">⭐⭐ (2)</option>
                <option value="1" className="bg-[#0A0A0B]">⭐ (1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database List / Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-mint" />
            <p className="text-xs text-text-muted">Acessando servidores da agência...</p>
          </div>
        ) : filteredCreatives.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <AlertCircle className="mx-auto text-text-muted opacity-50" size={32} />
            <h4 className="font-semibold text-white">Nenhum criativo encontrado</h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Experimente alterar os filtros de status ou a palavra digitada na busca. Use "Novo Criativo" para registrar ganchos adicionais.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[900px] border-collapse relative">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-text-muted select-none">
                  <th className="py-4 pl-6 pr-2 w-24">Código</th>
                  <th className="py-4 px-4 w-1/3">Título</th>
                  <th className="py-4 px-4">Status (Clique)</th>
                  <th className="py-4 px-4">Tipo</th>
                  <th className="py-4 px-4">Objetivo</th>
                  <th className="py-4 px-4">Nota</th>
                  <th className="py-4 px-4">Criação</th>
                  <th className="py-4 pl-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredCreatives.map(c => {
                  const currentStatusConfig = statusOptions.find(o => o.value === c.status) || statusOptions[0];

                  return (
                    <tr 
                      key={c.id}
                      onClick={() => handleOpenDetails(c)}
                      className="hover:bg-white/[0.015] group cursor-pointer transition-colors"
                    >
                      {/* Code */}
                      <td className="py-4 pl-6 pr-2 font-mono text-xs font-semibold">
                        <span className="bg-white/5 px-2 py-1 rounded text-text-secondary border border-white/5 group-hover:text-accent-mint group-hover:border-accent-mint/20 transition-colors">
                          {c.code}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-4 px-4 text-xs font-medium text-white max-w-[280px] truncate">
                        <div className="font-semibold text-white group-hover:text-accent-mint transition-colors truncate">
                          {c.title}
                        </div>
                        {c.script && (
                          <div className="text-[10px] text-text-muted mt-1 truncate">
                            {c.script.substring(0, 70)}...
                          </div>
                        )}
                      </td>

                      {/* Dynamic Clickable Status */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <select
                            value={c.status}
                            onChange={(e) => handleQuickStatusChange(c, e.target.value as CreativeStatus)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold outline-none cursor-pointer border ${currentStatusConfig.bg} ${currentStatusConfig.color}`}
                          >
                            <option value="IDEIA" className="bg-[#0A0A0B] text-accent-amber">🟡 Ideia</option>
                            <option value="PRODUZIDO" className="bg-[#0A0A0B] text-sky-400">🔵 Produzido</option>
                            <option value="VALIDADO" className="bg-[#0A0A0B] text-accent-mint font-bold">🟢 Validado</option>
                            <option value="DESCARTADO" className="bg-[#0A0A0B] text-accent-coral">🔴 Descartado</option>
                          </select>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4 text-[11px] text-text-secondary">
                        {c.type}
                      </td>

                      {/* Objective */}
                      <td className="py-4 px-4 text-[11px] text-text-secondary">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-medium border border-white/5 text-text-secondary">
                          {c.objective}
                        </span>
                      </td>

                      {/* Clickable Rating */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-0.5 text-accent-amber cursor-pointer">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const starValue = i + 1;
                            const isFilled = starValue <= c.rating;
                            return (
                              <button 
                                key={i} 
                                onClick={() => handleQuickRatingChange(c, starValue)}
                                className="hover:scale-125 transition-transform"
                                title={`Visualizar ou alterar nota para ${starValue} estrelas`}
                              >
                                <Star 
                                  size={12} 
                                  fill={isFilled ? "currentColor" : "none"} 
                                  className={isFilled ? "text-accent-amber" : "text-white/20 hover:text-accent-amber/55"}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* creationDate */}
                      <td className="py-4 px-4 text-[11px] text-text-muted font-mono">
                        {formatDateString(c.creationDate)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right text-xs" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenDetails(c)}
                            className="p-1 px-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-accent-mint/30 hover:text-white text-text-secondary font-medium text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                            title="Ver detalhes"
                          >
                            <Eye size={12} />
                            Roteiro
                          </button>
                          
                          <button
                            onClick={() => handleOpenEditForm(c)}
                            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent-mint/50 hover:bg-accent-mint/10 text-text-secondary hover:text-accent-mint transition-all cursor-pointer"
                            title="Editar criativo"
                          >
                            <Edit3 size={13} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteCreative(c.id, c.code)}
                            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent-coral/50 hover:bg-accent-coral/10 text-text-secondary hover:text-accent-coral transition-all cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / VISUAL LAB MODAL */}
      <AnimatePresence>
        {isDetailOpen && selectedCreative && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-screen bg-[#0A0A0B] border-l border-white/10 shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-xs bg-accent-mint/10 border border-accent-mint/20 text-accent-mint font-bold font-mono px-2.5 py-1 rounded-lg">
                    {selectedCreative.code}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight truncate max-w-[340px]">
                      {selectedCreative.title}
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Roteiro e Métricas do Lab
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditForm(selectedCreative)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-accent-mint/40 text-text-secondary hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Content box */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                {/* Meta details bento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Status</p>
                    <div className="mt-1">
                      <select
                        value={selectedCreative.status}
                        onChange={(e) => handleQuickStatusChange(selectedCreative, e.target.value as CreativeStatus)}
                        className="bg-transparent border-none text-xs text-white outline-none cursor-pointer font-bold"
                      >
                        <option value="IDEIA" className="bg-[#0A0A0B]">🟡 Ideia</option>
                        <option value="PRODUZIDO" className="bg-[#0A0A0B]">🔵 Produzido</option>
                        <option value="VALIDADO" className="bg-[#0A0A0B] text-accent-mint font-bold">🟢 Validado</option>
                        <option value="DESCARTADO" className="bg-[#0A0A0B]">🔴 Descartado</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Tipo</p>
                    <p className="font-semibold text-xs text-white mt-1.5 truncate">{selectedCreative.type}</p>
                  </div>

                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Objetivo</p>
                    <p className="font-semibold text-xs text-white mt-1.5 truncate">{selectedCreative.objective}</p>
                  </div>

                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Nota Interna</p>
                    <div className="flex gap-0.5 text-accent-amber mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} fill={i < selectedCreative.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dates panel */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-text-muted">📅 Criação</p>
                    <p className="font-mono text-white mt-1">{formatDateString(selectedCreative.creationDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">🚀 Publicação</p>
                    <p className="font-mono text-white mt-1">{formatDateString(selectedCreative.publishDate) || 'Não publicado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">✅ Validação</p>
                    <p className={`font-mono mt-1 ${selectedCreative.status === 'VALIDADO' ? 'text-accent-mint font-bold' : 'text-white'}`}>
                      {formatDateString(selectedCreative.validationDate) || 'Sem validação'}
                    </p>
                  </div>
                </div>

                {/* Validation Reason */}
                {selectedCreative.status === 'VALIDADO' && (
                  <div className="p-4 bg-accent-mint/10 border border-accent-mint/20 rounded-2xl space-y-1.5">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-accent-mint flex items-center gap-1">
                      <Sparkles size={12} /> Motivo de Sucesso / Validação
                    </h4>
                    <p className="text-sm font-medium text-white">
                      {selectedCreative.validationReason || 'Nenhum motivo detalhado registrado. Adicione um para fixar as estatísticas.'}
                    </p>
                  </div>
                )}

                {/* Roteiro (Script) */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-text-muted flex items-center gap-1.5 border-b border-white/5 pb-1">
                    <BookOpen size={13} className="text-accent-mint" /> 
                    Roteiro Original (Script Coorporativo)
                  </h4>
                  {selectedCreative.script ? (
                    <div className="bg-[#050506] border border-white/5 rounded-2xl p-5 font-mono text-xs text-white/90 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto relative">
                      <div className="absolute right-3 top-3 text-[9px] text-text-muted uppercase select-none">CODE BLOCK</div>
                      {selectedCreative.script}
                    </div>
                  ) : (
                    <div className="p-6 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-center text-xs text-text-muted">
                      Roteiro vazio. Roteiros estruturados ajudam a re-utilizar ganchos fortes!
                    </div>
                  )}
                </div>

                {/* Aprendizados (Learnings) */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-text-muted flex items-center gap-1.5 border-b border-white/5 pb-1">
                    <TrendingUp size={13} className="text-accent-mint" />
                    Aprendizados e Lições de Tráfego
                  </h4>
                  {selectedCreative.learnings ? (
                    <div className="bg-accent-mint/[0.02] border border-accent-mint/10 rounded-2xl p-5 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedCreative.learnings}
                    </div>
                  ) : (
                    <div className="p-6 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-center text-xs text-text-muted">
                      Nenhum aprendizado registrado ainda. Teste o anúncio e registre métricas empíricas aqui.
                    </div>
                  )}
                </div>

                {/* Observações Supplemental */}
                {selectedCreative.observations && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-text-muted flex items-center gap-1.5">
                      <MessageSquare size={13} />
                      Notas de Laboratório Complementares
                    </h4>
                    <p className="text-xs text-text-secondary bg-white/5 p-4 rounded-2xl border border-white/5">
                      {selectedCreative.observations}
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer footer */}
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <button
                  onClick={() => handleDeleteCreative(selectedCreative.id, selectedCreative.code)}
                  className="flex items-center gap-1.5 text-accent-coral hover:bg-accent-coral/10 border border-transparent hover:border-accent-coral/20 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  Excluir Criativo
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 text-xs text-white hover:bg-white/5 font-semibold transition-all cursor-pointer"
                >
                  Fechar Painel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL FORM: CREATE OR UPDATE CREATIVE */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent-mint/10 text-accent-mint">
                    <Video size={18} />
                  </div>
                  <h3 className="font-bold text-white text-base">
                    {selectedCreative ? `Editar Criativo ${formCode}` : `Registrar Novo Criativo (${formCode})`}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 px-2.5 py-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form inputs scrolling area */}
              <form onSubmit={handleSubmitCreative} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {/* Title */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      Título do Criativo <span className="text-accent-coral">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Gancho direto de dor - Gestores Exaustos de Feedback"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-mint/50 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder:text-text-muted"
                    />
                  </div>

                  {/* Status selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      Status de Desenvolvimento
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as CreativeStatus)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-accent-mint/50 cursor-pointer"
                    >
                      <option value="IDEIA" className="bg-[#0A0A0B]">🟡 Ideia</option>
                      <option value="PRODUZIDO" className="bg-[#0A0A0B]">🔵 Produzido</option>
                      <option value="VALIDADO" className="bg-[#0A0A0B]">🟢 Validado</option>
                      <option value="DESCARTADO" className="bg-[#0A0A0B]">🔴 Descartado</option>
                    </select>
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">
                      Nota Interna (Potencial ou Qualidade)
                    </label>
                    <div className="flex items-center gap-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl h-[42px]">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starValue = i + 1;
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setFormRating(starValue)}
                            className="hover:scale-125 transition-transform"
                          >
                            <Star
                              size={18}
                              fill={starValue <= formRating ? "currentColor" : "none"}
                              className={starValue <= formRating ? "text-accent-amber" : "text-white/20"}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs text-text-muted font-mono ml-auto">({formRating}/5)</span>
                    </div>
                  </div>

                  {/* Type drop */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      Tipo de Conteúdo / Estrutura
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-accent-mint/50 cursor-pointer"
                    >
                      {creativeTypes.map(t => (
                        <option key={t} value={t} className="bg-[#0A0A0B]">{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Objective Drop */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      Objetivo de Marketing
                    </label>
                    <select
                      value={formObjective}
                      onChange={(e) => setFormObjective(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-accent-mint/50 cursor-pointer"
                    >
                      {creativeObjectives.map(o => (
                        <option key={o} value={o} className="bg-[#0A0A0B]">{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dates input block */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      📅 Data de Criação
                    </label>
                    <input
                      type="date"
                      value={formCreationDate}
                      onChange={(e) => setFormCreationDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-accent-mint/50 text-left font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      🚀 Data de Publicação (opcional)
                    </label>
                    <input
                      type="date"
                      value={formPublishDate}
                      onChange={(e) => setFormPublishDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-accent-mint/50 text-left font-mono"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      ✅ Data de Validação (opcional)
                    </label>
                    <input
                      type="date"
                      value={formValidationDate}
                      onChange={(e) => setFormValidationDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-accent-mint/50 text-left font-mono"
                    />
                  </div>

                  {/* Validation reason textarea (Required if Status is Validado) */}
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        🏆 Motivo da Validação / Sucesso
                      </label>
                      {formStatus === 'VALIDADO' && (
                        <span className="text-[9px] text-accent-amber uppercase font-bold tracking-wider animate-pulse">Recomendado</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: CPL abaixo da média de R$ 10,00 ou Gerou reuniões qualificadas no Canva"
                      value={formValidationReason}
                      onChange={(e) => setFormValidationReason(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-mint/50 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder:text-text-muted"
                    />
                    <p className="text-[9px] text-text-muted leading-relaxed">
                      Útil para organizar a biblioteca de elite. Exemplos: Alto engajamento, Excelente retenção, Cliente fechado.
                    </p>
                  </div>

                  {/* Roteiro Textarea */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      📜 Script Completo do Anúncio (Roteiro)
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Escreva ou cole o roteiro completo utilizado. Inclua ganchos fortes, dor relatada e chamada de convite final..."
                      value={formScript}
                      onChange={(e) => setFormScript(e.target.value)}
                      className="w-full bg-[#050506] border border-white/10 hover:border-white/20 focus:border-accent-mint/50 rounded-xl p-4 text-xs text-white font-mono leading-relaxed outline-none transition-all placeholder:text-text-muted resize-y"
                    />
                  </div>

                  {/* Aprendizados Textarea */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      💡 Aprendizados e Conclusões
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Vídeos com gancho direto performaram melhor que vídeos explicativos. O tempo ideal de retenção foi de 30s."
                      value={formLearnings}
                      onChange={(e) => setFormLearnings(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-mint/50 rounded-xl p-4 text-xs text-white leading-relaxed outline-none transition-all placeholder:text-text-muted resize-y"
                    />
                  </div>

                  {/* Observações Supplemental */}
                  <div className="space-y-1 md:col-span-2 pb-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      ✏️ Observações e Informações Adicionais
                    </label>
                    <input
                      type="text"
                      placeholder="Notas e links de referências visuais adicionais..."
                      value={formObservations}
                      onChange={(e) => setFormObservations(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-mint/50 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder:text-text-muted"
                    />
                  </div>
                </div>

                {/* Footer buttons inside scrolling container */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex justify-center bg-accent-mint text-black font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-accent-mint/90 transition-all cursor-pointer shadow-lg shadow-accent-mint/10"
                  >
                    Salvar Criativo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
