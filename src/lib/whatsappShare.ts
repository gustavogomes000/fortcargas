/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Limpa o número do telefone e adiciona o código do país (+55 para Brasil) caso necessário.
 */
export function formatPhoneNumber(phone: string): string {
  // Remove tudo que não for dígito
  const cleaned = phone.replace(/\D/g, '');

  if (!cleaned) return '';

  // Se já tiver o código do país (começa com 55 e tem 12 ou 13 dígitos)
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned;
  }

  // Se tiver 10 ou 11 dígitos, é um número brasileiro sem DDI. Adiciona 55.
  if (cleaned.length === 10 || cleaned.length === 11) {
    return '55' + cleaned;
  }

  return cleaned;
}

/**
 * Cria o link do WhatsApp para envio de mensagens.
 */
export function getWhatsAppShareLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  
  if (formattedPhone) {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  }
  
  // Se não houver telefone específico, abre compartilhamento geral do WhatsApp
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Abre o WhatsApp compartilhando o documento gerado.
 */
export function shareDocumentOnWhatsApp(phone: string, documentType: 'pedido' | 'recibo', docData: any, pdfUrl?: string) {
  let message = '';
  const dateStr = new Date(docData.created_at || Date.now()).toLocaleDateString('pt-BR');

  if (documentType === 'pedido') {
    message = `*FORT CARGAS - PEDIDO DE CARREGAMENTO*\n` +
              `----------------------------------------\n` +
              `*Cliente:* ${docData.cliente}\n` +
              `*Motorista:* ${docData.motorista_nome}\n` +
              `*Veículo:* ${docData.veiculo_placa} / Carreta: ${docData.carreta_placa || 'N/A'}\n` +
              `*Origem/Cidade:* ${docData.cidade}\n` +
              `*Destinatário:* ${docData.destinatario} (${docData.cidade_destinatario || 'N/A'})\n` +
              `*Data:* ${dateStr}\n`;
              
    if (pdfUrl) {
      message += `\n*Baixar PDF:* ${pdfUrl}`;
    } else {
      message += `\n_Acesse o histórico no sistema para baixar o PDF correspondente._`;
    }
  } else {
    // Format value
    const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(docData.valor));
    message = `*FORT CARGAS - RECIBO DE PAGAMENTO*\n` +
              `----------------------------------------\n` +
              `*Recebemos de:* ${docData.recebi_de}\n` +
              `*Valor:* ${valorFmt}\n` +
              `*Referente a:* ${docData.correspondente_a || 'Transporte'}\n` +
              `*Motorista:* ${docData.motorista_nome}\n` +
              `*Favorecido:* ${docData.deposito_favorecido || 'Rogerio Bento de Oliveira'}\n` +
              `*Data:* ${dateStr}\n`;

    if (pdfUrl) {
      message += `\n*Baixar PDF:* ${pdfUrl}`;
    } else {
      message += `\n_Acesse o histórico no sistema para baixar o PDF correspondente._`;
    }
  }

  const link = getWhatsAppShareLink(phone, message);
  window.open(link, '_blank');
}
