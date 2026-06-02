import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Link2, ExternalLink, Save, Edit2, AlertCircle } from 'lucide-react';
import { storage } from '../lib/storage';
import { toast } from 'sonner';

export function TrafficWorkspace() {
  const [panelUrl, setPanelUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    storage.getSettings().then((data) => {
      setSettings(data);
      const url = data?.trafficPanelUrl || 'https://ai.studio/apps/a3348766-2773-4917-a7ed-9d3db94c4618';
      setPanelUrl(url);
      if (!data?.trafficPanelUrl) {
        // Automatically save the default so it persists in the user settings
        const updatedSettings = {
          ...data,
          trafficPanelUrl: url,
        };
        storage.saveSettings(updatedSettings);
      }
      setIsEditing(false);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let formattedUrl = panelUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const updatedSettings = {
        ...settings,
        trafficPanelUrl: formattedUrl,
      };
      await storage.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      setPanelUrl(formattedUrl);
      setIsEditing(false);
      toast.success('Workspace de tráfego integrado!');
    } catch (error) {
      toast.error('Erro ao salvar as configurações.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-mint" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Workspace de Tráfego</h1>
          <p className="text-text-muted">Acesse seu painel integrado ou configure um novo link direto</p>
        </div>
        
        {panelUrl && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-accent-mint/30 px-4 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-white transition-all"
            >
              <Edit2 size={16} />
              Configurar Painel
            </button>
            <a
              href={panelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-accent-mint text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/10"
            >
              <ExternalLink size={16} />
              Abrir em Nova Aba
            </a>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass rounded-3xl p-8 border border-white/5 space-y-6">
              <div className="flex items-center gap-3 text-accent-mint">
                <div className="w-10 h-10 rounded-xl bg-accent-mint/10 flex items-center justify-center">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Integração Externa</h3>
                  <p className="text-xs text-text-muted">Insira a URL do seu outro dashboard ou site</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">URL do Painel (iframe)</label>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                      type="text"
                      placeholder="Ex: https://lookerstudio.google.com/embed/..."
                      value={panelUrl}
                      onChange={(e) => setPanelUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-accent-mint/50 transition-all outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Você pode colar o link do Looker Studio, Planilha do Google, ou o link do seu outro applet no AI Studio (seja a URL do editor <code className="bg-white/5 px-1 rounded">ai.studio/apps/...</code> ou a <code className="bg-white/5 px-1 rounded">Shared App URL (URL Compartilhada)</code> obtida nas configurações dele).
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3 text-xs text-text-secondary leading-relaxed">
                  <AlertCircle size={16} className="text-accent-coral shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Dica de Incorporação:</span> Link do AI Studio editor (<code className="bg-white/5 px-1 rounded">ai.studio/apps/...</code>) necessita de login Google para renderizar. Se preferir carregar a aplicação diretamente no painel de forma transparente e otimizada, use a **Shared App URL** ou **Development App URL** daquele projeto.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  {panelUrl && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-semibold hover:bg-white/5 transition-all text-text-secondary"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-accent-mint text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/20"
                  >
                    <Save size={16} />
                    Salvar e Visualizar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-[calc(100vh-180px)] bg-black/20 rounded-3xl overflow-hidden border border-white/5 relative"
          >
            {panelUrl ? (
              <iframe
                src={panelUrl}
                className="w-full h-full border-none"
                title="Workspace de Tráfego"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <p className="text-text-muted">Nenhum painel configurado.</p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-accent-mint text-black font-semibold px-4 py-2 rounded-xl text-sm"
                >
                  Configurar link do Painel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
