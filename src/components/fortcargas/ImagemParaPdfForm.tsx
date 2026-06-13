/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { generatePDFBlob, downloadPDFBlob, uploadPDFToSupabase } from '@/lib/pdfGenerator';
import { shareDocumentOnWhatsApp } from '@/lib/whatsappShare';
import { ImagemPDFTemplate } from './DocumentTemplates';
import { GenerationProgressModal } from './GenerationProgressModal';
import { toast } from 'sonner';
import { FileImage, Image as ImageIcon, Send, ArrowLeft, Loader2, Upload, Trash2 } from 'lucide-react';

interface ImagemFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ImagemParaPdfForm: React.FC<ImagemFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [phone, setPhone] = useState('');
  const [documentName, setDocumentName] = useState('Comprovante');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  // Para gerar o PDF offline em uma div oculta
  const [pdfData, setPdfData] = useState<any>(null);

  // Limpa a URL de preview quando desmontado para evitar vazamentos de memória
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG).');
      return;
    }

    // Revoga preview anterior se existir
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreviewUrl(previewUrl);

    // Sugere nome baseado no arquivo original sem a extensão
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setDocumentName(baseName);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedImage) {
      toast.error('Por favor, selecione uma imagem para converter.');
      return;
    }

    // Abre a animação premium de geração de PDF
    setShowProgress(true);
    setIsComplete(false);
    setPdfBlob(null);
    setLoading(true);

    try {
      // Prepara os dados para renderização offscreen
      const docTitle = documentName.trim() || 'Documento Anexo';
      const resultData = {
        imageUrl: imagePreviewUrl,
        title: docTitle,
        created_at: new Date().toISOString()
      };

      setPdfData(resultData);

      // Aguarda 1.6 segundos para a animação de progresso completar e renderizar o PDF
      setTimeout(async () => {
        try {
          const filename = `${docTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}.pdf`;
          
          // Gera o PDF Blob a partir do template offscreen
          const blob = await generatePDFBlob('pdf-imagem-template');
          setPdfBlob(blob);
          setPdfFilename(filename);
          
          toast.success('PDF do anexo gerado com sucesso!');
          setIsComplete(true);
        } catch (pdfErr) {
          console.error('Erro ao gerar PDF da imagem:', pdfErr);
          toast.error('Erro ao gerar o PDF da imagem.');
          setShowProgress(false);
          setPdfData(null);
        }
      }, 1600);

    } catch (error: any) {
      console.error('Erro ao preparar geração:', error);
      toast.error('Erro: ' + error.message);
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
            <FileImage className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Conversor de Imagem para PDF
            </h2>
            <p className="text-xs text-gray-500">Transforme fotos, recibos ou comprovantes em PDF padrão A4</p>
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
        {/* Seletor de Arquivo */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Selecione a Imagem (Comprovante, Foto ou Balança)
          </label>

          {!selectedImage ? (
            <div className="border-2 border-dashed border-gray-200 hover:border-sky-400 bg-gray-50/50 hover:bg-sky-50/10 rounded-2xl p-8 text-center transition-all cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white p-4 rounded-full shadow-md text-sky-500 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">Escolher Foto ou Arquivo</p>
                  <p className="text-xs text-gray-400 mt-1">Suporta JPG, JPEG e PNG</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl p-4 space-y-4 bg-slate-50">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-sky-50 p-2 rounded-lg text-sky-600 shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-700 truncate">{selectedImage.name}</p>
                    <p className="text-[10px] text-gray-400">{(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                  title="Remover imagem"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Preview */}
              <div className="flex justify-center max-h-[300px] overflow-hidden rounded-xl border border-gray-200/60 bg-white p-2">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="max-h-[280px] object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Inputs de Configuração */}
        {selectedImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nome do Documento PDF
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Ex: Comprovante_Balanca_Rogerio"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                WhatsApp para Envio (Opcional - DDD + Número)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 62981407508"
                className="w-full text-sm rounded-lg border border-gray-200 px-3.5 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading || !selectedImage}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <FileImage className="h-5 w-5" />
                Converter & Gerar PDF
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
          <ImagemPDFTemplate data={pdfData} />
        </div>
      )}

      {/* Modal de Progresso de Geração */}
      <GenerationProgressModal 
        isOpen={showProgress} 
        documentType="pedido" // Força um tipo para reaproveitar visual, ou extendemos
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
                title: documentName,
                text: `Documento PDF: ${documentName}`,
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

          if (phone) {
            shareDocumentOnWhatsApp(phone, 'imagem', { title: documentName }, pdfUrl);
          } else {
            toast.error('Telefone não informado para envio no WhatsApp.');
          }
        }}
      />
    </div>
  );
};
