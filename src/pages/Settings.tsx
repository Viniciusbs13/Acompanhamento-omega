import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Shield, Bell, Palette, Globe } from 'lucide-react';
import { storage } from '../lib/storage';

export function Settings() {
  const settings = storage.getSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Configurações</h1>
        <p className="text-text-muted">Gerencie seu perfil e preferências da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <SettingsNavButton icon={User} label="Perfil" active />
          <SettingsNavButton icon={Shield} label="Segurança" />
          <SettingsNavButton icon={Bell} label="Notificações" />
          <SettingsNavButton icon={Palette} label="Aparência" />
          <SettingsNavButton icon={Globe} label="Integrações" />
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-8 border border-white/5 space-y-8">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-accent-mint flex items-center justify-center text-black text-2xl font-bold">
                  {settings.managerName.charAt(0)}
                </div>
                <div>
                   <h3 className="text-lg font-medium">{settings.managerName}</h3>
                   <p className="text-sm text-text-muted">assessoriaomega1@gmail.com</p>
                   <button className="mt-2 text-xs font-bold text-accent-mint uppercase tracking-widest hover:underline">Alterar foto</button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nome do Gestor</label>
                  <input 
                    type="text" 
                    defaultValue={settings.managerName}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 transition-all outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Cargo / Título</label>
                  <input 
                    type="text" 
                    defaultValue="Gestor Pro"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-mint/50 transition-all outline-none" 
                  />
                </div>
             </div>

             <div className="flex justify-end pt-4">
                <button className="bg-accent-mint text-black font-bold px-8 py-3 rounded-xl hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/20">
                  Salvar Alterações
                </button>
             </div>
          </div>

          <div className="glass rounded-3xl p-8 border border-white/5">
             <h4 className="font-medium mb-4">Mudar Tema</h4>
             <div className="flex items-center gap-4">
                <div className="flex-1 p-4 rounded-2xl bg-white/10 border-2 border-accent-mint cursor-pointer">
                   <p className="text-sm font-medium text-center">Dark Mode (Padrão)</p>
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-white/5 border-2 border-transparent hover:border-white/10 cursor-pointer opacity-50 grayscale transition-all">
                   <p className="text-sm font-medium text-center">Light Mode (Beta)</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsNavButton({ icon: Icon, label, active = false }: any) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
      active ? "bg-white/10 text-white" : "text-text-muted hover:bg-white/5 hover:text-text-secondary"
    )}>
      <Icon size={18} />
      {label}
    </button>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
