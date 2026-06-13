import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

/**
 * Converte um elemento HTML em PDF, faz o download local e retorna o arquivo como Blob.
 */
export async function generateAndDownloadPDF(elementId: string, filename: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento com ID ${elementId} não encontrado.`);
  }

  // Captura o elemento HTML em alta resolução
  const canvas = await html2canvas(element, {
    scale: 2, // Aumenta resolução para impressão
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  
  // Criar documento PDF no formato A4 (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 210; // Largura do A4 em mm
  const pageHeight = 297; // Altura do A4 em mm

  // Adiciona a imagem capturada do HTML preenchendo a folha A4 exatamente
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);

  // Salva (baixa) o arquivo no computador do usuário
  pdf.save(filename);

  // Retorna como Blob para permitir upload
  return pdf.output('blob');
}

/**
 * Faz o upload de um Blob de PDF para o bucket 'documentos' no Supabase Storage.
 * Retorna a URL pública do documento.
 */
export async function uploadPDFToSupabase(pdfBlob: Blob, filename: string): Promise<string | null> {
  try {
    const cleanFilename = `${Date.now()}_${filename.replace(/\s+/g, '_')}`;
    
    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(cleanFilename, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn("Erro ao enviar arquivo para o Storage (o bucket 'documentos' pode não estar criado):", error.message);
      return null;
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Erro no fluxo de upload do PDF:", err);
    return null;
  }
}

/**
 * Converte um elemento HTML em PDF e retorna o arquivo como Blob (sem fazer download local).
 */
export async function generatePDFBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento com ID ${elementId} não encontrado.`);
  }

  // Captura o elemento HTML em alta resolução
  const canvas = await html2canvas(element, {
    scale: 2, // Aumenta resolução para impressão
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  
  // Criar documento PDF no formato A4 (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 210; // Largura do A4 em mm
  const pageHeight = 297; // Altura do A4 em mm

  // Adiciona a imagem capturada do HTML preenchendo a folha A4 exatamente
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);

  // Retorna como Blob para permitir upload ou compartilhamento
  return pdf.output('blob');
}

/**
 * Faz o download local de um Blob de PDF no dispositivo.
 */
export function downloadPDFBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
