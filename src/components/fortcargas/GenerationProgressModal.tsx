/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Loader2, Check, FileText, Cloud, Send, Printer, Download, Share2 } from 'lucide-react';

interface ProgressStep {
  label: string;
  status: 'waiting' | 'running' | 'done';
  icon: any;
}

interface GenerationProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'pedido' | 'recibo';
  isComplete?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
}

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({ 
  isOpen, 
  onClose, 
  documentType,
  isComplete = false,
  onDownload = () => {},
  onShare = () => {}
}) => {
  const [steps, setSteps] = useState<ProgressStep[]>([
    { label: 'Sincronizando dados em nuvem...', status: 'running', icon: Cloud },
    { label: 'Desenhando layout do documento...', status: 'waiting', icon: FileText },
    { label: 'Renderizando PDF em alta resolução...', status: 'waiting', icon: Printer },
    { label: 'Preparando WhatsApp para envio...', status: 'waiting', icon: Send },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(5);
      setSteps([
        { label: 'Sincronizando dados em nuvem...', status: 'running', icon: Cloud },
        { label: 'Desenhando layout do documento...', status: 'waiting', icon: FileText },
        { label: 'Renderizando PDF em alta resolução...', status: 'waiting', icon: Printer },
        { label: 'Preparando WhatsApp para envio...', status: 'waiting', icon: Send },
      ]);
      return;
    }

    // Intervalo para atualizar os passos e o progresso simulando a renderização pesada do PDF
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 12);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Controla a transição visual de cada uma das etapas do progresso
    const stepTimeouts = [
      setTimeout(() => {
        setSteps(prev => {
          const next = [...prev];
          next[0].status = 'done';
          next[1].status = 'running';
          return next;
        });
        setCurrentStepIndex(1);
      }, 400),
      setTimeout(() => {
        setSteps(prev => {
          const next = [...prev];
          next[1].status = 'done';
          next[2].status = 'running';
          return next;
        });
        setCurrentStepIndex(2);
      }, 750),
      setTimeout(() => {
        setSteps(prev => {
          const next = [...prev];
          next[2].status = 'done';
          next[3].status = 'running';
          return next;
        });
        setCurrentStepIndex(3);
      }, 1100),
      setTimeout(() => {
        setSteps(prev => {
          const next = [...prev];
          next[3].status = 'done';
          return next;
        });
      }, 1400)
    ];

    return () => {
      stepTimeouts.forEach(t => clearTimeout(t));
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Tela de Sucesso PWA Nativo — Permite ao usuário escolher compartilhar ou baixar
  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-opacity duration-300">
        <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md mx-4 shadow-2xl border border-sky-100 flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-200 select-none">
          
          {/* Big Green Success Checkmark */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping scale-125 duration-1000" />
            <div className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white p-5 rounded-2xl shadow-lg shadow-emerald-100 relative">
              <Check className="h-8 w-8" />
            </div>
          </div>

          {/* Title / Info */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-800">
              Documento Pronto!
            </h3>
            <p className="text-xs text-sky-600 font-bold uppercase tracking-wider">
              {documentType === 'pedido' ? 'Pedido de Carregamento' : 'Recibo de Pagamento'}
            </p>
          </div>

          <div className="w-full border-t border-slate-100 my-1" />

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            {/* Share via WhatsApp */}
            <button
              onClick={onShare}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Share2 className="h-4.5 w-4.5" />
              Compartilhar no WhatsApp
            </button>

            {/* Download PDF */}
            <button
              onClick={onDownload}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Download className="h-4.5 w-4.5" />
              Apenas Baixar PDF
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-full text-slate-400 hover:text-slate-600 py-2.5 font-bold text-xs text-center transition-colors"
            >
              Concluir e Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md mx-4 shadow-2xl border border-sky-100 flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Ícone de Progresso Pulsante */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-sky-500/10 rounded-full animate-ping scale-150 duration-1000" />
          <div className="bg-gradient-to-tr from-sky-600 to-sky-400 text-white p-5 rounded-2xl shadow-lg shadow-sky-200 relative">
            <Printer className="h-8 w-8 animate-bounce" />
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-slate-800">
            Gerando {documentType === 'pedido' ? 'Pedido' : 'Recibo'}
          </h3>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Processando documento digital
          </p>
        </div>

        {/* Barra de Progresso Realista */}
        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-[10px] font-black text-sky-600">
            <span>PROGRESSO</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
            <div 
              className="h-full bg-sky-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Lista de Etapas */}
        <div className="w-full space-y-3 pt-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  step.status === 'running' 
                    ? 'bg-sky-50/70 border-sky-100 text-sky-700' 
                    : step.status === 'done'
                      ? 'bg-emerald-50/40 border-emerald-100/50 text-slate-600'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center shrink-0">
                  {step.status === 'done' ? (
                    <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  ) : step.status === 'running' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs font-bold">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
