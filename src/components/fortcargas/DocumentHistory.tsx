/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { documentService } from '@/lib/documentService';
import { generatePDFBlob, downloadPDFBlob, uploadPDFToSupabase } from '@/lib/pdfGenerator';
import { shareDocumentOnWhatsApp } from '@/lib/whatsappShare';
import { PedidoCarregamentoTemplate, ReciboTemplate } from './DocumentTemplates';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, Calendar, Download, Send, Edit, Trash2, FileText, 
  ChevronRight, RefreshCw, Loader2, ArrowRightLeft 
} from 'lucide-react';

interface DocumentHistoryProps {
  onEditPedido: (item: any) => void;
  onEditRecibo: (item: any) => void;
  refreshTrigger: number;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({ onEditPedido, onEditRecibo, refreshTrigger }) => {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'recibos'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [recibos, setRecibos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Estados para geração offline de PDF no histórico
  const [pdfData, setPdfData] = useState<any>(null);
  const [pdfType, setPdfType] = useState<'pedido' | 'recibo' | null>(null);
  const [pdfActionLoading, setPdfActionLoading] = useState<string | null>(null); // Guarda o ID do item processando

  // Busca dados do serviço (Supabase + Local Fallback)
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pedidos') {
        const data = await documentService.getPedidos();
        setPedidos(data || []);
      } else {
        const data = await documentService.getRecibos();
        setRecibos(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar histórico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, refreshTrigger]);

  // Sincronização em Tempo Real (Supabase Realtime)
  useEffect(() => {
    try {
      const channel = supabase
        .channel('realtime-history')
        .on(
          'postgres_changes',
          {
            event: '*', // Escuta INSERT, UPDATE, DELETE
            schema: 'public',
            table: activeTab === 'pedidos' ? 'pedidos_carregamento' : 'recibos'
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Erro ao configurar canal em tempo real do Supabase:', err);
    }
  }, [activeTab]);

  // Sincronização ao focar a aba/janela do navegador (ex: alternar celular -> computador)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTab]);

  // Exclusão de documentos do serviço
  const handleDelete = async (id: string, table: 'pedidos_carregamento' | 'recibos') => {
    if (!confirm('Deseja realmente excluir este documento do histórico?')) return;
 
    try {
      if (table === 'pedidos_carregamento') {
        await documentService.deletePedido(id);
      } else {
        await documentService.deleteRecibo(id);
      }
      toast.success('Documento excluído do histórico!');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  // Re-geração e download offline do PDF
  const handleDownloadPdf = async (item: any, type: 'pedido' | 'recibo') => {
    setPdfActionLoading(item.id);
    setPdfData(item);
    setPdfType(type);
    
    setTimeout(async () => {
      try {
        const templateId = type === 'pedido' ? 'pdf-pedido-template' : 'pdf-recibo-template';
        const filePrefix = type === 'pedido' ? 'pedido_carregamento' : 'recibo';
        const filename = `${filePrefix}_${item.id.slice(0, 8)}.pdf`;

        const pdfBlob = await generatePDFBlob(templateId);
        downloadPDFBlob(pdfBlob, filename);
        toast.success('PDF baixado com sucesso!');
      } catch (err: any) {
        console.error('Erro ao gerar PDF:', err);
        toast.error('Erro ao gerar PDF: ' + err.message);
      } finally {
        setPdfData(null);
        setPdfType(null);
        setPdfActionLoading(null);
      }
    }, 600);
  };

  // Compartilhamento via WhatsApp e Share API nativa
  const handleWhatsAppShare = async (item: any, type: 'pedido' | 'recibo') => {
    setPdfActionLoading(item.id);
    setPdfData(item);
    setPdfType(type);
 
    setTimeout(async () => {
      try {
        const templateId = type === 'pedido' ? 'pdf-pedido-template' : 'pdf-recibo-template';
        const filePrefix = type === 'pedido' ? 'pedido_carregamento' : 'recibo';
        const filename = `${filePrefix}_${item.id.slice(0, 8)}.pdf`;
 
        // 1. Gera PDF Blob sem baixar automaticamente
        const pdfBlob = await generatePDFBlob(templateId);
        
        // 2. Tenta compartilhamento nativo de arquivo no celular (PWA)
        try {
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: type === 'pedido' ? 'Pedido de Carregamento' : 'Recibo de Pagamento',
              text: `Documento da Fort Cargas para ${item.motorista_nome}`,
            });
            toast.success('Compartilhado com sucesso!');
            return;
          }
        } catch (shareErr) {
          console.warn('Erro no compartilhamento nativo:', shareErr);
        }
 
        // 3. Fallback: WhatsApp por link com upload para Supabase
        const fone = item.motorista_fone;
        if (!fone) {
          toast.error('Este motorista não tem número de WhatsApp cadastrado para envio por link.');
          return;
        }
 
        toast.info('Fazendo upload para compartilhar...');
        const pdfUrl = await uploadPDFToSupabase(pdfBlob, filename);
 
        shareDocumentOnWhatsApp(fone, type, item, pdfUrl || undefined);
        toast.success('WhatsApp aberto para envio!');
      } catch (err: any) {
        console.error('Erro ao compartilhar:', err);
        toast.error('Erro ao preparar compartilhamento.');
      } finally {
        setPdfData(null);
        setPdfType(null);
        setPdfActionLoading(null);
      }
    }, 600);
  };

  // Filtragem local dos dados
  const getFilteredData = () => {
    if (activeTab === 'pedidos') {
      return pedidos.filter((p) => {
        const matchesSearch = 
          p.cliente.toLowerCase().includes(search.toLowerCase()) ||
          p.motorista_nome.toLowerCase().includes(search.toLowerCase()) ||
          (p.cidade_destinatario && p.cidade_destinatario.toLowerCase().includes(search.toLowerCase()));
        
        const matchesDate = dateFilter ? p.created_at.startsWith(dateFilter) : true;
        
        return matchesSearch && matchesDate;
      });
    } else {
      return recibos.filter((r) => {
        const matchesSearch = 
          r.recebi_de.toLowerCase().includes(search.toLowerCase()) ||
          r.motorista_nome.toLowerCase().includes(search.toLowerCase()) ||
          (r.destino && r.destino.toLowerCase().includes(search.toLowerCase()));
        
        const matchesDate = dateFilter ? r.created_at.startsWith(dateFilter) : true;
        
        return matchesSearch && matchesDate;
      });
    }
  };

  const filteredItems = getFilteredData();

  return (
    <div className="space-y-6">
      {/* Abas e Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-sky-50/50 flex flex-col gap-4">
        {/* Toggle das abas */}
        <div className="flex bg-sky-50/60 p-1 rounded-xl w-full max-w-md mx-auto">
          <button
            onClick={() => { setActiveTab('pedidos'); setSearch(''); setDateFilter(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pedidos' 
                ? 'bg-sky-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-sky-600 hover:bg-sky-100/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            Pedidos de Carregamento
          </button>
          <button
            onClick={() => { setActiveTab('recibos'); setSearch(''); setDateFilter(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'recibos' 
                ? 'bg-sky-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-sky-600 hover:bg-sky-100/50'
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Recibos
          </button>
        </div>

        {/* Inputs de busca e data */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'pedidos' ? "Buscar por Cliente, Motorista ou Destino..." : "Buscar por Recebi de, Motorista ou Destino..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 focus:border-sky-500 focus:outline-none bg-gray-50/30"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 focus:border-sky-500 focus:outline-none bg-gray-50/30"
            />
          </div>
        </div>
      </div>

      {/* Lista / Tabela */}
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100/55 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700">
            {activeTab === 'pedidos' ? 'Histórico de Pedidos' : 'Histórico de Recibos'}
          </h3>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-all active:rotate-180"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            <span className="text-sm text-gray-500">Buscando documentos salvos...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <FileText className="h-12 w-12 mx-auto text-sky-200" />
            <p className="font-medium text-base">Nenhum documento encontrado</p>
            <p className="text-xs">Crie um novo documento na aba anterior ou altere os filtros de busca.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Versão Desktop (Tabela) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <th className="px-6 py-3">Nome / Cliente</th>
                    <th className="px-6 py-3">Motorista</th>
                    <th className="px-6 py-3">Cidade / Destino</th>
                    <th className="px-6 py-3">Data</th>
                    {activeTab === 'recibos' && <th className="px-6 py-3">Valor</th>}
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-sky-50/20 transition-all">
                      <td className="px-6 py-4 font-bold text-gray-800 uppercase max-w-[200px] truncate">
                        <div className="flex items-center gap-1.5">
                          <span>{activeTab === 'pedidos' ? item.cliente : item.recebi_de}</span>
                          {item.is_offline && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-black tracking-wider">
                              Local
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-semibold">{item.motorista_nome}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium uppercase">
                        {activeTab === 'pedidos' ? item.cidade_destinatario || 'N/A' : item.destino || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      {activeTab === 'recibos' && (
                        <td className="px-6 py-4 font-bold text-sky-600 font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => activeTab === 'pedidos' ? onEditPedido(item) : onEditRecibo(item)}
                          disabled={pdfActionLoading !== null}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(item, activeTab === 'pedidos' ? 'pedido' : 'recibo')}
                          disabled={pdfActionLoading !== null}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Baixar PDF"
                        >
                          {pdfActionLoading === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(item, activeTab === 'pedidos' ? 'pedido' : 'recibo')}
                          disabled={pdfActionLoading !== null}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, activeTab === 'pedidos' ? 'pedidos_carregamento' : 'recibos')}
                          disabled={pdfActionLoading !== null}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Versão Mobile (Cards) */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 space-y-3 hover:bg-sky-50/10 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {activeTab === 'pedidos' ? 'Pedido' : 'Recibo'}
                        </span>
                        {item.is_offline && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-black tracking-wider">
                            Local
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-800 uppercase text-sm leading-tight pt-1">
                        {activeTab === 'pedidos' ? item.cliente : item.recebi_de}
                      </h4>
                    </div>
                    {activeTab === 'recibos' && (
                      <span className="font-black text-sky-600 font-mono text-sm bg-sky-50/50 px-2 py-1 rounded-lg border border-sky-100">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-gray-500 font-medium">
                    <div>
                      <span className="font-bold text-gray-400">Motorista:</span> {item.motorista_nome}
                    </div>
                    <div>
                      <span className="font-bold text-gray-400">Destino:</span>{' '}
                      <span className="uppercase">{activeTab === 'pedidos' ? item.cidade_destinatario || 'N/A' : item.destino || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-400">Data:</span>{' '}
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Ações Mobile */}
                  <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => activeTab === 'pedidos' ? onEditPedido(item) : onEditRecibo(item)}
                      disabled={pdfActionLoading !== null}
                      className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(item, activeTab === 'pedidos' ? 'pedido' : 'recibo')}
                      disabled={pdfActionLoading !== null}
                      className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                    >
                      {pdfActionLoading === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      PDF
                    </button>
                    <button
                      onClick={() => handleWhatsAppShare(item, activeTab === 'pedidos' ? 'pedido' : 'recibo')}
                      disabled={pdfActionLoading !== null}
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                    >
                      <Send className="h-3.5 w-3.5" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, activeTab === 'pedidos' ? 'pedidos_carregamento' : 'recibos')}
                      disabled={pdfActionLoading !== null}
                      className="flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-lg transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Container Oculto para Renderização de PDF no Histórico */}
      {pdfData && pdfType && (
        <div className="fixed -left-[9999px] -top-[9999px] overflow-hidden bg-white">
          {pdfType === 'pedido' ? (
            <PedidoCarregamentoTemplate data={pdfData} />
          ) : (
            <ReciboTemplate data={pdfData} />
          )}
        </div>
      )}
    </div>
  );
};
