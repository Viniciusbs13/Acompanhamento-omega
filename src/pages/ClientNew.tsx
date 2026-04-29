import { useState } from 'react';
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

const schema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  brandColor: z.string().default("#00D9A3"),
  currentRevenue: z.number().min(0).default(0),
  targetRevenue: z.number().min(0).default(0),
  durationMonths: z.number().min(1).default(6),
  adSpend: z.number().min(0).default(0),
  ticket: z.number().min(0).default(0),
});

export function ClientNew() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<BusinessType>('SERVICE_BOOKING');
  const [channels, setChannels] = useState<string[]>(['Meta Ads', 'Google Ads']);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      brandColor: '#00D9A3',
      currentRevenue: 0,
      targetRevenue: 0,
      durationMonths: 6,
      adSpend: 0,
      ticket: 0,
    }
  });

  const onSubmit = (data: any) => {
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
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
    };

    storage.saveClient(newClient);
    toast.success("Cliente criado com sucesso!");
    navigate(`/clientes/${newClient.id}`);
  };

  const businessTypes = [
    { id: 'SERVICE_BOOKING', icon: Building2, label: 'Serviço com Agendamento', desc: 'Clínicas, consultórios, advogados' },
    { id: 'ECOMMERCE', icon: ShoppingCart, label: 'E-commerce', desc: 'Lojas online com checkout direto' },
    { id: 'B2B_LEADS', icon: Briefcase, label: 'Captação Leads B2B', desc: 'Consultorias, infoprodutos high-ticket' },
    { id: 'WHATSAPP', icon: MessageSquare, label: 'WhatsApp / Direto', desc: 'Comércios locais, pequenos serviços' },
  ];

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
          {[1, 2, 3, 4].map(i => (
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 min-h-[500px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 rounded-2xl glass flex flex-col items-center justify-center border-dashed border-white/20 text-text-muted hover:border-accent-mint hover:text-accent-mint cursor-pointer transition-all">
                   <Camera size={24} />
                   <span className="text-[10px] font-bold mt-2 uppercase">Logo</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Nome do Cliente</label>
                    <input 
                      {...register('name')}
                      placeholder="Ex: Ômega Fitness"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-mint/50 transition-all font-medium"
                    />
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Cor da Marca</label>
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
                      onChange={() => setSelectedType(type.id as BusinessType)} 
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
          
          {step < 4 ? (
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
