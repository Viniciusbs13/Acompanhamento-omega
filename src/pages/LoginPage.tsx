import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { VideoPlayer } from '../components/VideoPlayer';
import { LogIn, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success('Bem-vindo ao Ômega!');
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'Erro desconhecido';
      const errorCode = error.code || 'sem-codigo';
      toast.error(`Erro ao fazer login (${errorCode}): ${errorMessage}`);
    }
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
            Faça login para acessar seu backup seguro na nuvem.
          </p>

          <button 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-3 group"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Entrar com Google
          </button>

          <div className="mt-8 flex items-center gap-2 text-text-muted text-xs">
            <Lock size={12} />
            Backup 100% Sincronizado e Seguro
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
