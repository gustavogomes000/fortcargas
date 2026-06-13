/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { PedidoCarregamentoForm } from '@/components/fortcargas/PedidoCarregamentoForm';
import { ReciboForm } from '@/components/fortcargas/ReciboForm';
import { DocumentHistory } from '@/components/fortcargas/DocumentHistory';
import { 
  FileText, FileSignature, ArrowLeft, History, PlusCircle, 
  Settings, HelpCircle, Truck, ExternalLink 
} from 'lucide-react';

type Mode = 'home' | 'pedido' | 'recibo' | 'historico';
type SubView = 'form' | 'history';

export default function FortCargasDashboard() {
  const [mode, setMode] = useState<Mode>('home');
  const [subView, setSubView] = useState<SubView>('form');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = (date: Date) => {
    const hr = date.getHours();
    if (hr >= 5 && hr < 12) return 'Bom dia';
    if (hr >= 12 && hr < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatLongDate = (date: Date) => {
    const formatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const greeting = getGreeting(currentTime);
  const dateString = formatLongDate(currentTime);
  const timeString = formatTime(currentTime);

  // Gatilho para recarregar histórico após salvar um documento
  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setEditingItem(null);
    setSubView('history');
  };

  const handleEditPedido = (item: any) => {
    setMode('pedido');
    setEditingItem(item);
    setSubView('form');
  };

  const handleEditRecibo = (item: any) => {
    setMode('recibo');
    setEditingItem(item);
    setSubView('form');
  };

  const resetToHome = () => {
    setMode('home');
    setSubView('form');
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-sky-600 text-white shadow-md py-4 px-4 sticky top-0 z-50 pwa-safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode !== 'home' ? (
              <button 
                onClick={resetToHome}
                className="bg-sky-700/60 hover:bg-sky-700 p-2 rounded-xl transition-all"
                title="Voltar ao início"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="bg-white/10 p-2 rounded-xl">
                <Truck className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-tight">Fort Cargas</h1>
              <p className="text-[10px] text-sky-100 font-semibold uppercase tracking-wider">Agência de Cargas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        
        {/* VIEW 1: HOME (Painel de Seleção) */}
        {mode === 'home' && (
          <div className="space-y-8 py-4">
            {/* Boas Vindas Dinâmicas Premium */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-sky-500 to-sky-600 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden animate-fade-in select-none">
              {/* Decorative background shapes */}
              <div className="absolute right-0 top-0 -mt-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 -mb-10 w-24 h-24 bg-white/5 rounded-full blur-lg pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="bg-sky-400/30 text-sky-100 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-sky-400/20">
                    Painel Operacional
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                    {greeting}, Rogério!
                  </h2>
                  <p className="text-sky-100 text-sm font-medium">
                    Bem-vindo de volta ao seu emissor da Fort Cargas.
                  </p>
                </div>
                
                {/* Live Clock & Date */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col items-center md:items-end justify-center min-w-[200px] shadow-inner">
                  <span className="text-3xl font-extrabold tracking-widest font-mono text-white select-none metric-value">
                    {timeString}
                  </span>
                  <span className="text-[11px] text-sky-100 font-semibold mt-1 text-center md:text-right">
                    {dateString}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de Seleção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              {/* Card: Pedido de Carregamento */}
              <div 
                onClick={() => { setMode('pedido'); setSubView('form'); }}
                className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-sky-50/30 border border-slate-100 hover:border-sky-500/50 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between select-none"
              >
                <div className="space-y-5">
                  <div className="bg-sky-50 border border-sky-100 text-sky-600 p-4 rounded-2xl w-fit group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                      Pedido de Carregamento
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Gere autorizações de carregamento para motoristas com dados do cliente, destino, carga e placas do veículo.
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                  <span>Acessar Emissor</span>
                  <div className="bg-sky-50 border border-sky-100 p-1.5 rounded-full group-hover:bg-sky-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </div>
                </div>
              </div>

              {/* Card: Recibo de Pagamento */}
              <div 
                onClick={() => { setMode('recibo'); setSubView('form'); }}
                className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-sky-50/30 border border-slate-100 hover:border-sky-500/50 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between select-none"
              >
                <div className="space-y-5">
                  <div className="bg-sky-50 border border-sky-100 text-sky-600 p-4 rounded-2xl w-fit group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <FileSignature className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                      Recibo de Pagamento
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Emita recibos digitais com conversão automática de valores por extenso, adiantamento, saldos e dados bancários/PIX.
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                  <span>Acessar Emissor</span>
                  <div className="bg-sky-50 border border-sky-100 p-1.5 rounded-full group-hover:bg-sky-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </div>
                </div>
              </div>

            </div>

            {/* Atalho do Histórico Geral */}
            <div className="max-w-4xl mx-auto pt-2">
              <div 
                onClick={() => setMode('historico')}
                className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-sky-50/30 border border-slate-100 hover:border-sky-500/50 rounded-3xl p-6 md:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center justify-between select-none animate-fade-in"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-sky-50 border border-sky-100 text-sky-600 p-4 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                    <History className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                      Histórico Geral de Documentos
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Consulte, re-edite, baixe ou compartilhe todos os pedidos e recibos gerados anteriormente.
                    </p>
                  </div>
                </div>
                <div className="bg-sky-50 border border-sky-100 p-2 rounded-xl group-hover:bg-sky-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0">
                  <ArrowLeft className="h-4.5 w-4.5 rotate-180" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PEDIDO DE CARREGAMENTO */}
        {mode === 'pedido' && (
          <div className="space-y-6">
            {/* Sub-Navegação interna */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 max-w-sm mx-auto">
              <button
                onClick={() => { setSubView('form'); setEditingItem(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subView === 'form' 
                    ? 'bg-sky-600 text-white' 
                    : 'text-slate-500 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                {editingItem ? 'Editando' : 'Novo Pedido'}
              </button>
              <button
                onClick={() => setSubView('history')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subView === 'history' 
                    ? 'bg-sky-600 text-white' 
                    : 'text-slate-500 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Histórico
              </button>
            </div>

            {/* Conteúdo */}
            {subView === 'form' ? (
              <PedidoCarregamentoForm 
                editData={editingItem} 
                onSuccess={handleSuccess}
                onCancel={resetToHome}
              />
            ) : (
              <DocumentHistory 
                onEditPedido={handleEditPedido}
                onEditRecibo={handleEditRecibo}
                refreshTrigger={refreshTrigger}
              />
            )}
          </div>
        )}

        {/* VIEW 3: RECIBO */}
        {mode === 'recibo' && (
          <div className="space-y-6">
            {/* Sub-Navegação interna */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 max-w-sm mx-auto">
              <button
                onClick={() => { setSubView('form'); setEditingItem(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subView === 'form' 
                    ? 'bg-sky-600 text-white' 
                    : 'text-slate-500 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                {editingItem ? 'Editando' : 'Novo Recibo'}
              </button>
              <button
                onClick={() => setSubView('history')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subView === 'history' 
                    ? 'bg-sky-600 text-white' 
                    : 'text-slate-500 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Histórico
              </button>
            </div>

            {/* Conteúdo */}
            {subView === 'form' ? (
              <ReciboForm 
                editData={editingItem} 
                onSuccess={handleSuccess}
                onCancel={resetToHome}
              />
            ) : (
              <DocumentHistory 
                onEditPedido={handleEditPedido}
                onEditRecibo={handleEditRecibo}
                refreshTrigger={refreshTrigger}
              />
            )}
          </div>
        )}

        {/* VIEW 4: HISTÓRICO GERAL */}
        {mode === 'historico' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-5 md:p-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="bg-sky-50 p-2.5 rounded-xl text-sky-600">
                  <History className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-800">
                    Histórico Geral de Documentos
                  </h2>
                  <p className="text-xs text-gray-500">Consulte ou gerencie todos os registros emitidos no sistema</p>
                </div>
              </div>
              
              <DocumentHistory 
                onEditPedido={handleEditPedido}
                onEditRecibo={handleEditRecibo}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12 pb-12 sm:pb-6">
        <div className="max-w-6xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-500">FORT CARGAS AGÊNCIA</p>
          <p>Rodovia BR-153 - KM 516 - Rosa dos Ventos - Aparecida de Goiânia/GO</p>
          <p>© {new Date().getFullYear()} — Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
