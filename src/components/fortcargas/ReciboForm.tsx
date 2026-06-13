/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { documentService } from '@/lib/documentService';
import { generatePDFBlob, downloadPDFBlob, uploadPDFToSupabase } from '@/lib/pdfGenerator';
import { shareDocumentOnWhatsApp } from '@/lib/whatsappShare';
import { numeroParaExtenso } from '@/lib/extenso';
import { ReciboTemplate } from './DocumentTemplates';
import { GenerationProgressModal } from './GenerationProgressModal';
import { toast } from 'sonner';
import { FileSignature, FileText, ArrowLeft, Loader2 } from 'lucide-react';

interface ReciboFormProps {
  editData?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ReciboForm: React.FC<ReciboFormProps> = ({ editData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfDataForShare, setPdfDataForShare] = useState<any>(null);
  const [formData, setFormData] = useState({
    valor: '',
    recebi_de: '',
    quantia_de: '',
    correspondente_a: '',
    transporte_de: '',
    origem: 'APARECIDA DE GOIANIA/GO',
    destino: '',
    adiantamento: '',
    saldo_receber: '',
    motorista_nome: '',
    motorista_pix: '',
    motorista_fone: '',
    cavalo_placa: '',
    carreta_placa: '',
    local_cidade: 'AP. DE GOIANIA/GO',
    data_recibo: new Date().toISOString().split('T')[0],
    deposito_chave_pix: '',
    deposito_favorecido: '',
  });

  // Para gerar o PDF offline em uma div oculta
  const [pdfData, setPdfData] = useState<any>(null);

  // Preenche dados se estiver editando
  useEffect(() => {
    if (editData) {
      setFormData({
        valor: editData.valor?.toString() || '',
        recebi_de: editData.recebi_de || '',
        quantia_de: editData.quantia_de || '',
        correspondente_a: editData.correspondente_a || '',
        transporte_de: editData.transporte_de || '',
        origem: editData.origem || '',
        destino: editData.destino || '',
        adiantamento: editData.adiantamento?.toString() || '',
        saldo_receber: editData.saldo_receber?.toString() || '',
        motorista_nome: editData.motorista_nome || '',
        motorista_pix: editData.motorista_pix || '',
        motorista_fone: editData.motorista_fone || '',
        cavalo_placa: editData.cavalo_placa || '',
        carreta_placa: editData.carreta_placa || '',
        local_cidade: editData.local_cidade || 'AP. DE GOIANIA/GO',
        data_recibo: editData.data_recibo || new Date().toISOString().split('T')[0],
        deposito_chave_pix: editData.deposito_chave_pix || '',
        deposito_favorecido: editData.deposito_favorecido || '',
      });
    }
  }, [editData]);

  // Atualiza quantia por extenso quando o valor muda
  useEffect(() => {
    const numValor = parseFloat(formData.valor);
    if (!isNaN(numValor) && numValor > 0 && !editData) {
      const extenso = numeroParaExtenso(numValor);
      setFormData((prev) => ({ ...prev, quantia_de: extenso }));
    }
  }, [formData.valor, editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valor || !formData.recebi_de || !formData.motorista_nome) {
      toast.error('Preencha os campos obrigatórios: Valor, Recebi de e Motorista.');
      return;
    }
    // Abre a animação premium de geração de PDF
    setShowProgress(true);
    setIsComplete(false);
    setPdfBlob(null);
    setLoading(true);

    try {
      const numValor = parseFloat(formData.valor);
      const numAdiantamento = parseFloat(formData.adiantamento) || 0;
      const numSaldo = parseFloat(formData.saldo_receber) || 0;

      const payload = {
        ...formData,
        valor: numValor,
        adiantamento: numAdiantamento,
        saldo_receber: numSaldo,
      };

      const { data, isOffline } = await documentService.saveRecibo(payload, editData?.id);
      const resultData = data;

      // Prepara dados para renderizar a div do PDF
      setPdfData(resultData);
      setPdfDataForShare(resultData);

      // Aguarda 1.6 segundos para a animação do modal progredir e renderizar
      setTimeout(async () => {
        try {
          const filename = `recibo_${resultData.id.slice(0, 8)}.pdf`;
          
          // 1. Gera o PDF Blob sem baixar automaticamente
          const blob = await generatePDFBlob('pdf-recibo-template');
          setPdfBlob(blob);
          setPdfFilename(filename);
          
          if (isOffline) {
            toast.warning('Salvo localmente! (Supabase offline)');
          } else {
            toast.success(editData?.id ? 'Recibo atualizado!' : 'Recibo criado!');
          }
          
          // 2. Transiciona o modal para exibir opções de compartilhamento / download
          setIsComplete(true);

        } catch (pdfErr) {
          console.error('Erro ao gerar PDF:', pdfErr);
          toast.error('Recibo salvo, mas ocorreu um erro ao gerar o PDF.');
          setShowProgress(false);
          setPdfData(null);
          onSuccess();
        }
      }, 1600);

    } catch (error: any) {
      console.error('Erro ao salvar recibo:', error);
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
            <FileSignature className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Editar Recibo de Pagamento' : 'Novo Recibo de Pagamento'}
            </h2>
            <p className="text-xs text-gray-500">Preencha os dados abaixo para gerar o recibo</p>
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
        {/* Seção 1: Valor e Favorecido */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-sky-700 border-l-4 border-sky-500 pl-2">
            Valores & Emissão
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Valor Recibo (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                placeholder="Ex: 9870.00"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Recebi(emos) de *
              </label>
              <input
                type="text"
                name="recebi_de"
                value={formData.recebi_de}
                onChange={handleChange}
                placeholder="Ex: COMAZI TRATORES E MAQUINAS LTDA"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex justify-between">
              <span>Valor por Extenso</span>
              <span className="text-[10px] text-sky-600 font-semibold normal-case">Gerado automaticamente</span>
            </label>
            <input
              type="text"
              name="quantia_de"
              value={formData.quantia_de}
              onChange={handleChange}
              placeholder="Ex: Nove mil, oitocentos e setenta reais"
              className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Correspondente a (Referência)
            </label>
            <input
              type="text"
              name="correspondente_a"
              value={formData.correspondente_a}
              onChange={handleChange}
              placeholder="Ex: Adiantamento de 70% do valor montante de R$ 14.100,00"
              className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Do Transporte de (Mercadoria)
              </label>
              <input
                type="text"
                name="transporte_de"
                value={formData.transporte_de}
                onChange={handleChange}
                placeholder="Ex: 3 tratores"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Origem
                </label>
                <input
                  type="text"
                  name="origem"
                  value={formData.origem}
                  onChange={handleChange}
                  placeholder="Ex: Aparecida de Goiânia/GO"
                  className="w-full text-sm rounded-lg border border-gray-200 px-2.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Destino
                </label>
                <input
                  type="text"
                  name="destino"
                  value={formData.destino}
                  onChange={handleChange}
                  placeholder="Ex: Belém/PA"
                  className="w-full text-sm rounded-lg border border-gray-200 px-2.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Adiantamento (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="adiantamento"
                value={formData.adiantamento}
                onChange={handleChange}
                placeholder="Ex: 2770.00"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Saldo a Receber (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="saldo_receber"
                value={formData.saldo_receber}
                onChange={handleChange}
                placeholder="Ex: 5580.00"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Motorista e Placas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-sky-700 border-l-4 border-sky-500 pl-2">
            Dados do Motorista & Veículo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Motorista *
              </label>
              <input
                type="text"
                name="motorista_nome"
                value={formData.motorista_nome}
                onChange={handleChange}
                placeholder="Nome completo do motorista"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Pix do Motorista
              </label>
              <input
                type="text"
                name="motorista_pix"
                value={formData.motorista_pix}
                onChange={handleChange}
                placeholder="Ex: CPF ou Celular"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                WhatsApp do Motorista
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
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Cavalo Placa
              </label>
              <input
                type="text"
                name="cavalo_placa"
                value={formData.cavalo_placa}
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

        {/* Seção 3: Localidade e Depósito */}
        <div className="space-y-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-700">
            Dados Adicionais do Recibo (Padrão Fort Cargas)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Cidade de Emissão
              </label>
              <input
                type="text"
                name="local_cidade"
                value={formData.local_cidade}
                onChange={handleChange}
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Data do Recibo
              </label>
              <input
                type="date"
                name="data_recibo"
                value={formData.data_recibo}
                onChange={handleChange}
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Chave PIX para Depósito
              </label>
              <input
                type="text"
                name="deposito_chave_pix"
                value={formData.deposito_chave_pix}
                onChange={handleChange}
                placeholder="Ex: Chave PIX CELULAR (62) 9 8140-7508"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Favorecido do Depósito
              </label>
              <input
                type="text"
                name="deposito_favorecido"
                value={formData.deposito_favorecido}
                onChange={handleChange}
                placeholder="Ex: Rogerio Bento de Oliveira"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              />
            </div>
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
          <ReciboTemplate data={pdfData} />
        </div>
      )}

      {/* Modal de Progresso de Geração */}
      <GenerationProgressModal 
        isOpen={showProgress} 
        documentType="recibo"
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
                title: 'Recibo Fort Cargas',
                text: `Recibo de Pagamento para ${formData.motorista_nome}`,
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
            shareDocumentOnWhatsApp(formData.motorista_fone, 'recibo', pdfDataForShare || formData, pdfUrl);
          } else {
            toast.error('Telefone do motorista não informado para envio no WhatsApp.');
          }
        }}
      />
    </div>
  );
};
