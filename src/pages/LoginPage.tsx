import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { VideoPlayer } from '../components/VideoPlayer';
import { ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Insira seu email para continuar');
      return;
    }
    toast.success('Bem-vindo ao Ômega!');
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <VideoPlayer 
          src="https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent to-black" />
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass p-8 rounded-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10">
            <span className="text-4xl font-bold">Ω</span>
          </div>
          
          <h1 className="text-2xl font-medium tracking-tight mb-2">
            Sua gestão de tráfego, <br />
            <span className="text-accent-mint">em um só lugar.</span>
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Entre para acessar seu dashboard premium.
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <input 
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-accent-mint/50 focus:bg-white/10 transition-all"
              />
            </div>
            <button 
              type="submit"
              className="w-full h-12 bg-accent-mint text-black font-semibold rounded-xl hover:bg-accent-mint/90 transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_-5px_#00D9A3]"
            >
              Entrar no painel
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-text-muted text-xs">
            <Lock size={12} />
            Acesso seguro via Ômega Auth
          </div>
        </div>
      </motion.div>

      {/* Footer info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-muted text-[10px] uppercase tracking-widest">
        Ômega Assessoria Group © 2026
      </div>
    </div>
  );
}
