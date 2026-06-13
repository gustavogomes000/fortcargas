/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { documentService } from '@/lib/documentService';
import { generatePDFBlob, downloadPDFBlob, uploadPDFToSupabase } from '@/lib/pdfGenerator';
import { shareDocumentOnWhatsApp } from '@/lib/whatsappShare';
import { PedidoCarregamentoTemplate, DEFAULT_TERMOS } from './DocumentTemplates';
import { GenerationProgressModal } from './GenerationProgressModal';
import { toast } from 'sonner';
import { ClipboardList, Plus, FileText, Send, ArrowLeft, Loader2 } from 'lucide-react';

interface PedidoFormProps {
  editData?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const PedidoCarregamentoForm: React.FC<PedidoFormProps> = ({ editData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfDataForShare, setPdfDataForShare] = useState<any>(null);
  const [formData, setFormData] = useState({
    cliente: '',
    endereco: '',
    cidade: '',
    destinatario: '',
    cidade_destinatario: '',
    descricao_carga: '',
    saldo_frete: '',
    veiculo_placa: '',
    carreta_placa: '',
    motorista_nome: '',
    motorista_fone: '',
    termos_instrucoes: DEFAULT_TERMOS,
  });

  // Para gerar o PDF offline em uma div oculta
  const [pdfData, setPdfData] = useState<any>(null);

  // Preenche dados se estiver editando
  useEffect(() => {
    if (editData) {
      setFormData({
        cliente: editData.cliente || '',
        endereco: editData.endereco || '',
        cidade: editData.cidade || '',
        destinatario: editData.destinatario || '',
        cidade_destinatario: editData.cidade_destinatario || '',
        descricao_carga: editData.descricao_carga || '',
        saldo_frete: editData.saldo_frete || '',
        veiculo_placa: editData.veiculo_placa || '',
        carreta_placa: editData.carreta_placa || '',
        motorista_nome: editData.motorista_nome || '',
        motorista_fone: editData.motorista_fone || '',
        termos_instrucoes: editData.termos_instrucoes || DEFAULT_TERMOS,
      });
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente || !formData.destinatario || !formData.motorista_nome) {
      toast.error('Preencha os campos obrigatórios: Cliente, Destinatário e Motorista.');
      return;
    }

    // Abre a animação premium de geração de PDF
    setShowProgress(true);
    setIsComplete(false);
    setPdfBlob(null);
    setLoading(true);

    try {
      const { data, isOffline } = await documentService.savePedido(formData, editData?.id);
      const resultData = data;

      // Prepara dados para renderizar a div do PDF
      setPdfData(resultData);
      setPdfDataForShare(resultData);

      // Aguarda 1.6 segundos para a animação de progresso completar e gerar uma melhor experiência
      setTimeout(async () => {
        try {
          const filename = `pedido_carregamento_${resultData.id.slice(0, 8)}.pdf`;
          
          // 1. Gera o PDF Blob sem baixar automaticamente
          const blob = await generatePDFBlob('pdf-pedido-template');
          setPdfBlob(blob);
          setPdfFilename(filename);
          
          if (isOffline) {
            toast.warning('Salvo localmente! (Supabase offline)');
          } else {
            toast.success(editData?.id ? 'Pedido atualizado!' : 'Pedido criado!');
          }
          
          // 2. Transiciona o modal para exibir opções de compartilhamento / download
          setIsComplete(true);

        } catch (pdfErr) {
          console.error('Erro ao gerar PDF:', pdfErr);
          toast.error('Pedido salvo, mas ocorreu um erro ao gerar o PDF.');
          setShowProgress(false);
          setPdfData(null);
          onSuccess();
        }
      }, 1600);

    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao salvar: ' + error.message);
      setShowProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-5 md:p-8 max-w-4xl mx-auto">
      {/* Header do Formulário */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-sky-50 p-2.5 rounded-xl text-sky-600">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Editar Pedido de Carregamento' : 'Novo Pedido de Carregamento'}
            </h2>
            <p className="text-xs text-gray-500">Preencha os dados abaixo para gerar o documento</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Cliente e Endereço */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-sky-700 border-l-4 border-sky-500 pl-2">
            Informações do Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Cliente *
              </label>
              <input
                type="text"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Ex: CONSERVAS OLE - SR JOSE (64) 3413-8900"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Destinatário *
              </label>
              <input
                type="text"
                name="destinatario"
                value={formData.destinatario}
                onChange={handleChange}
                placeholder="Nome da empresa destinatária"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Endereço do Cliente
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                placeholder="Ex: RODOVIA BR-153 - KM 618 - D.A.I.M.O"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Cidade (Origem)
              </label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                placeholder="Ex: MORRINHOS/GO"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Cidade / Estado (Destino)
            </label>
            <input
              type="text"
              name="cidade_destinatario"
              value={formData.cidade_destinatario}
              onChange={handleChange}
              placeholder="Ex: MORRINHOS/GO ou BELEM/PA"
              className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Seção 2: Descrição da Carga */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-sky-700 border-l-4 border-sky-500 pl-2">
            Detalhes da Carga & Frete
          </h3>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Descrição da Carga a ser Coletada
            </label>
            <textarea
              name="descricao_carga"
              value={formData.descricao_carga}
              onChange={handleChange}
              placeholder="Descreva a mercadoria (ex: 3 tratores de ORIGEM...)"
              rows={4}
              className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Saldo de Frete (Instruções/Termos)
            </label>
            <textarea
              name="saldo_frete"
              value={formData.saldo_frete}
              onChange={handleChange}
              placeholder="Ex: Saldo a receber mediante apresentação dos comprovantes..."
              rows={2}
              className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50 uppercase"
            />
          </div>
        </div>

        {/* Seção 3: Motorista e Veículo */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-sky-700 border-l-4 border-sky-500 pl-2">
            Motorista e Veículo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nome do Motorista *
              </label>
              <input
                type="text"
                name="motorista_nome"
                value={formData.motorista_nome}
                onChange={handleChange}
                placeholder="Ex: Paulo Henrique Cardoso da Silva"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                WhatsApp do Motorista (DDD + Número)
              </label>
              <input
                type="text"
                name="motorista_fone"
                value={formData.motorista_fone}
                onChange={handleChange}
                placeholder="Ex: 62999534601"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Veículo Placa (Cavalo)
              </label>
              <input
                type="text"
                name="veiculo_placa"
                value={formData.veiculo_placa}
                onChange={handleChange}
                placeholder="Ex: AUS-6 F72 DE GOIANESIA/GO"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Carreta Placa
              </label>
              <input
                type="text"
                name="carreta_placa"
                value={formData.carreta_placa}
                onChange={handleChange}
                placeholder="Ex: GNB-6543 DE GOIANESIA/GO"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Seção 4: Termos e Instruções */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-sky-700 border-l-4 border-sky-500 pl-2">
            Termos & Instruções do Contrato
          </h3>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Termos Impressos no Rodapé do Pedido
            </label>
            <textarea
              name="termos_instrucoes"
              value={formData.termos_instrucoes}
              onChange={handleChange}
              placeholder="Edite os termos e condições gerais do contrato..."
              rows={6}
              className="w-full text-xs font-mono rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50 leading-relaxed"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                {editData ? 'Salvar & Gerar PDF' : 'Criar & Gerar PDF'}
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Container Oculto para Renderização de PDF */}
      {pdfData && (
        <div className="fixed -left-[9999px] -top-[9999px] overflow-hidden bg-white">
          <PedidoCarregamentoTemplate data={pdfData} />
        </div>
      )}

      {/* Modal de Progresso de Geração */}
      <GenerationProgressModal 
        isOpen={showProgress} 
        documentType="pedido"
        isComplete={isComplete}
        onClose={() => {
          setShowProgress(false);
          setPdfBlob(null);
          setIsComplete(false);
          setPdfData(null);
          onSuccess();
        }}
        onDownload={() => {
          if (pdfBlob) {
            downloadPDFBlob(pdfBlob, pdfFilename);
            toast.success('Download iniciado!');
          }
        }}
        onShare={async () => {
          if (!pdfBlob) return;
          
          // 1. Compartilhamento nativo de arquivo (PWA / Mobile) se disponível
          try {
            const file = new File([pdfBlob], pdfFilename, { type: 'application/pdf' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Pedido de Carregamento Fort Cargas',
                text: `Pedido de Carregamento para ${formData.motorista_nome}`,
              });
              toast.success('Compartilhado com sucesso!');
              return;
            }
          } catch (err) {
            console.warn('Erro ao compartilhar nativamente:', err);
          }

          // 2. Fallback de envio por link no WhatsApp (Desktop / Navegador Web sem API Share)
          toast.info('Preparando link do WhatsApp...');
          let pdfUrl = '';
          try {
            const uploadedUrl = await uploadPDFToSupabase(pdfBlob, pdfFilename);
            if (uploadedUrl) {
              pdfUrl = uploadedUrl;
            }
          } catch (err) {
            console.warn('Erro ao subir PDF em segundo plano:', err);
          }

          if (formData.motorista_fone) {
            shareDocumentOnWhatsApp(formData.motorista_fone, 'pedido', pdfDataForShare || formData, pdfUrl);
          } else {
            toast.error('Telefone do motorista não informado para envio no WhatsApp.');
          }
        }}
      />
    </div>
  );
};
