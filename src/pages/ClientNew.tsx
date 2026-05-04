import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ShoppingCart, Briefcase, MessageSquare, ChevronRight, ChevronLeft, Check, Plus, Trash2, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BusinessType, Client } from '../types';
import { storage } from '../lib/storage';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';

const schema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  accountManager: z.string().min(2, "Nome do gestor é obrigatório"),
  brandColor: z.string().default("#00D9A3"),
  currentRevenue: z.number().min(0).default(0),
  targetRevenue: z.number().min(0).default(0),
  durationMonths: z.number().min(1).default(6),
  adSpend: z.number().min(0).default(0),
  ticket: z.number().min(0).default(0),
  ownerNames: z.string().optional(),
  planValue: z.number().min(0).default(0),
  planScope: z.string().optional(),
  contractUrl: z.string().optional(),
});

export function ClientNew() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<BusinessType>('SERVICE_BOOKING');
  const [channels, setChannels] = useState<string[]>(['Meta Ads', 'Google Ads']);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [customFunnelSteps, setCustomFunnelSteps] = useState<{ id: string, label: string }[]>([]);
  const navigate = useNavigate();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          // Redimensionar e comprimir para garantir que fique abaixo do limite do Firestore (1MB)
          const compressed = await compressImage(base64, 400, 400);
          setLogoBase64(compressed);
        } catch (error) {
          console.error('Erro ao processar imagem:', error);
          toast.error("Erro ao processar imagem. Tente outro formato.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      brandColor: '#00D9A3',
      accountManager: '',
      currentRevenue: 0,
      targetRevenue: 0,
      durationMonths: 6,
      adSpend: 0,
      ticket: 0,
    }
  });

  const onFormError = (errors: any) => {
    console.error('Erros de validação:', errors);
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      toast.error(`Existem ${errorCount} campo(s) com erro. Verifique os passos anteriores.`);
      
      // Determine which step to go back to based on error keys
      const errorKeys = Object.keys(errors);
      if (errorKeys.some(key => ['name', 'accountManager'].includes(key))) {
        setStep(1);
      } else if (errorKeys.some(key => ['currentRevenue', 'targetRevenue', 'durationMonths', 'adSpend', 'ticket'].includes(key))) {
        setStep(3);
      }
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const newClient: Client = {
        id: Math.random().toString(36).substring(2, 11),
        name: data.name,
        accountManager: data.accountManager,
        logo: logoBase64 || null,
        brandColor: data.brandColor,
        businessType: selectedType,
        smartGoal: {
          currentRevenue: data.currentRevenue,
          targetRevenue: data.targetRevenue,
          durationMonths: data.durationMonths,
          adSpend: data.adSpend,
          ticket: data.ticket,
          funnelSteps: [], // Managed by business logic later
        },
        channels: channels,
        createdAt: new Date().toISOString(),
        customFunnelSteps: customFunnelSteps,
        ownerNames: data.ownerNames,
        planValue: data.planValue,
        planScope: data.planScope,
        contractUrl: data.contractUrl,
        managementStatus: 'GREEN',
      };

      console.log('Tentando salvar cliente:', newClient);
      await storage.saveClient(newClient);
      toast.success("Cliente criado com sucesso!");
      navigate(`/clientes/${newClient.id}`);
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      let errorMessage = "Erro ao criar cliente. Tente novamente.";
      
      if (error.message) {
        try {
           const parsed = JSON.parse(error.message);
           if (parsed.error) errorMessage = `Erro no Firestore: ${parsed.error}`;
        } catch {
           errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const businessTypes = [
    { id: 'SERVICE_BOOKING', icon: Building2, label: 'Serviço com Agendamento', desc: 'Clínicas, consultórios, advogados' },
    { id: 'ECOMMERCE', icon: ShoppingCart, label: 'E-commerce', desc: 'Lojas online com checkout direto' },
    { id: 'INFO_PRODUCTS', icon: ShoppingCart, label: 'Infoprodutos', desc: 'Cursos online, comunidades, mentorias' },
    { id: 'B2B_LEADS', icon: Briefcase, label: 'Captação Leads B2B', desc: 'Consultorias, serviços corporativos' },
    { id: 'REAL_ESTATE', icon: Building2, label: 'Imobiliária', desc: 'Venda e aluguel de imóveis, lançamentos' },
    { id: 'LOCAL_BUSINESS', icon: ShoppingCart, label: 'Negócio Local', desc: 'Lanchonetes, lojas físicas, farmácias' },
    { id: 'WHATSAPP', icon: MessageSquare, label: 'WhatsApp / Direto', desc: 'Vendas via chat, delivery' },
  ];

  const defaultFunnels: Record<string, { id: string, label: string }[]> = {
    SERVICE_BOOKING: [
      { id: 'leads', label: 'Leads' },
      { id: 'bookings', label: 'Agendamentos' },
      { id: 'shows', label: 'Comparecimentos' },
      { id: 'sales', label: 'Vendas' }
    ],
    ECOMMERCE: [
       { id: 'sessions', label: 'Sessões' },
       { id: 'addCart', label: 'Carrinhos' },
       { id: 'purchases', label: 'Vendas' }
    ],
    INFO_PRODUCTS: [
      { id: 'leads', label: 'Leads' },
      { id: 'sales', label: 'Vendas' }
    ],
    B2B_LEADS: [
      { id: 'leads', label: 'Leads' },
      { id: 'mqls', label: 'MQLs' },
      { id: 'sales', label: 'Vendas' }
    ],
    REAL_ESTATE: [
      { id: 'leads', label: 'Leads' },
      { id: 'bookings', label: 'Visitas' },
      { id: 'sales', label: 'Vendas' }
    ],
    LOCAL_BUSINESS: [
       { id: 'leads', label: 'Contatos' },
       { id: 'sales', label: 'Vendas' }
    ],
    WHATSAPP: [
       { id: 'waClicks', label: 'Cliques' },
       { id: 'waConversations', label: 'Conversas' },
       { id: 'sales', label: 'Vendas' }
    ]
  };

  const handleTypeSelect = (type: BusinessType) => {
    setSelectedType(type);
    setCustomFunnelSteps(defaultFunnels[type] || []);
  };

  const addFunnelStep = () => {
    setCustomFunnelSteps([...customFunnelSteps, { id: `step_${Date.now()}`, label: 'Nova Etapa' }]);
  };

  const removeFunnelStep = (index: number) => {
    setCustomFunnelSteps(customFunnelSteps.filter((_, i) => i !== index));
  };

  const updateFunnelStep = (index: number, label: string) => {
    const newSteps = [...customFunnelSteps];
    newSteps[index].label = label;
    setCustomFunnelSteps(newSteps);
  };

  const availableChannels = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Pinterest Ads', 'YouTube Ads'];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Stepper Header */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Novo Cliente</h1>
          <p className="text-text-secondary text-sm">Configure o perfil e metas estratégicas.</p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 w-12 rounded-full transition-all duration-500",
                step >= i ? "bg-accent-mint" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-8 min-h-[500px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-start gap-8">
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    id="logo-upload"
                  />
                  <div className={cn(
                    "w-28 h-28 rounded-2xl glass flex flex-col items-center justify-center border-dashed border-white/20 text-text-muted transition-all overflow-hidden",
                    logoBase64 ? "border-accent-mint" : "hover:border-accent-mint hover:text-accent-mint"
                  )}>
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} />
                        <span className="text-[10px] font-bold mt-2 uppercase">Logo</span>
                      </>
                    )}
                  </div>
                  {logoBase64 && (
                    <button 
                      type="button"
                      onClick={() => setLogoBase64(null)}
                      className="absolute -top-2 -right-2 bg-accent-coral text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Nome do Cliente</label>
                      <input 
                        {...register('name')}
                        placeholder="Ex: Ômega Fitness"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium"
                      />
                      {errors.name && <p className="text-accent-coral text-[10px] mt-1 font-bold">{errors.name.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Gestor Responsável</label>
                      <input 
                        {...register('accountManager')}
                        placeholder="Nome do gestor"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium"
                      />
                      {errors.accountManager && <p className="text-accent-coral text-[10px] mt-1 font-bold">{errors.accountManager.message as string}</p>}
                    </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Editor Visual</label>
                     <div className="flex gap-4 items-center">
                        <input type="color" {...register('brandColor')} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                        <span className="text-sm text-text-secondary">Escolha a cor primária do dashboard.</span>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-medium">Qual o modelo de negócio?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {businessTypes.map((type) => (
                  <label 
                    key={type.id}
                    className={cn(
                      "cursor-pointer p-6 rounded-2xl glass border-2 transition-all flex flex-col gap-4",
                      selectedType === type.id ? "border-accent-mint bg-accent-mint/5" : "border-transparent glass-hover"
                    )}
                  >
                    <input 
                      type="radio" 
                      className="sr-only" 
                      checked={selectedType === type.id} 
                      onChange={() => handleTypeSelect(type.id as BusinessType)} 
                    />
                    <type.icon size={32} className={selectedType === type.id ? "text-accent-mint" : "text-text-muted"} />
                    <div>
                      <h3 className="font-bold">{type.label}</h3>
                      <p className="text-xs text-text-secondary">{type.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
               <h2 className="text-xl font-medium">Meta SMART</h2>
               <div className="glass p-8 rounded-2xl space-y-6">
                  <div className="text-xl leading-relaxed font-light text-text-secondary">
                    "O cliente fatura hoje <input type="number" {...register('currentRevenue', { valueAsNumber: true })} className="w-24 bg-transparent border-b border-accent-mint text-white text-center outline-none px-2" /> e quer chegar em <input type="number" {...register('targetRevenue', { valueAsNumber: true })} className="w-24 bg-transparent border-b border-accent-mint text-white text-center outline-none px-2" /> em <input type="number" {...register('durationMonths', { valueAsNumber: true })} className="w-16 bg-transparent border-b border-fuchsia-400 text-white text-center outline-none px-2" /> meses, com investimento de <input type="number" {...register('adSpend', { valueAsNumber: true })} className="w-24 bg-transparent border-b border-white/40 text-white text-center outline-none px-2" /> por mês."
                  </div>
                  <div className="pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div>
                        <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Ticket Médio Estimado</label>
                        <input type="number" {...register('ticket', { valueAsNumber: true })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" />
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-medium">Canais de Aquisição</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableChannels.map((channel) => (
                  <label 
                    key={channel}
                    className={cn(
                      "flex items-center gap-3 p-4 glass rounded-xl cursor-pointer transition-all border-2",
                      channels.includes(channel) ? "border-accent-mint bg-accent-mint/5" : "border-transparent"
                    )}
                  >
                    <input 
                      type="checkbox"
                      checked={channels.includes(channel)}
                      onChange={() => {
                        if (channels.includes(channel)) setChannels(channels.filter(c => c !== channel));
                        else setChannels([...channels, channel]);
                      }}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      channels.includes(channel) ? "bg-accent-mint border-accent-mint" : "border-white/20"
                    )}>
                      {channels.includes(channel) && <Check size={10} className="text-black" />}
                    </div>
                    <span className="text-sm">{channel}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium">Funil de Vendas Personalizado</h2>
                <button 
                  type="button"
                  onClick={addFunnelStep}
                  className="flex items-center gap-2 text-accent-mint text-sm font-bold hover:underline"
                >
                  <Plus size={16} /> Adicionar Etapa
                </button>
              </div>
              
              <div className="space-y-3">
                {customFunnelSteps.map((stepItem, index) => (
                  <div key={stepItem.id} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-text-muted">
                      {index + 1}
                    </div>
                    <input 
                      value={stepItem.label}
                      onChange={(e) => updateFunnelStep(index, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50"
                    />
                    <button 
                      type="button"
                      onClick={() => removeFunnelStep(index)}
                      className="p-2 text-text-muted hover:text-accent-coral opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                {customFunnelSteps.length === 0 && (
                  <div className="py-8 text-center glass rounded-2xl border-dashed">
                    <p className="text-text-secondary">Defina as etapas do funil para este cliente.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-medium">Gestão e Contrato</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Nome dos Donos/Sócios</label>
                  <input 
                    {...register('ownerNames')}
                    placeholder="Ex: João Silva e Maria Oliveira"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Valor Mensal do Plano (BRL)</label>
                  <input 
                    type="number"
                    {...register('planValue', { valueAsNumber: true })}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">O que está incluso no Plano (Escopo)</label>
                <textarea 
                  {...register('planScope')}
                  placeholder="Ex: Gestão de Meta Ads, 4 campanhas, 1 reunião mensal..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Link do Contrato Assinado</label>
                <input 
                  {...register('contractUrl')}
                  placeholder="https://link-do-contrato.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer controls */}
        <div className="pt-10 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-text-secondary hover:text-white disabled:opacity-0 transition-all font-medium"
          >
            <ChevronLeft size={20} />
            Voltar
          </button>
          
          {step < 6 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !step1ValuesAreValid()) return; // Manual check if needed
                setStep(s => s + 1);
              }}
              className="px-8 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
            >
              Continuar
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              className="px-8 py-3 bg-accent-mint text-black font-bold rounded-xl hover:bg-accent-mint/90 transition-all shadow-[0_0_30px_-5px_#00D9A3]"
            >
              Finalizar Cadastro
            </button>
          )}
        </div>
      </form>
    </div>
  );

  function step1ValuesAreValid() {
    return true; // Simplified for now
  }
}
