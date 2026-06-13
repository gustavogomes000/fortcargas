import React from 'react';

// Formata data local para DD/MM/AAAA
const formatarData = (dataStr?: string) => {
  if (!dataStr) return '';
  const date = new Date(dataStr);
  // Garante que o timezone não altere o dia
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return utcDate.toLocaleDateString('pt-BR');
};

// Formata moeda BRL
const formatarMoeda = (valor?: number | string) => {
  if (valor === undefined || valor === '') return 'R$ 0,00';
  const num = Number(valor);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

export const DEFAULT_TERMOS = `• NA DESISTENCIA DA CARGA PELO MOTORISTA NÃO DEVOLVEMOS COMISSAO.
• DOCUMENTAÇÃO DO MOTORISTA E DO VEICULO EM ORDEM.
• ASSOALHO DO VEICULO EM PERFEITAS CONDIÇÕES.
• CARREGAMENTO POR TRAS DO VEICULO COM PALETEIRA.
• FAZ PARTE DESTE TRANSP., TER PACIENCIA E EDUCAÇÃO NO LOCAL DE CARREGTO.
FICA ELEITO O FORO DA COMARCA DE GOIANIA/GO, PARA DIRIMIR QUALQUER DUVIDA OU EVENTUAL DESENTENDIMENTO ENTRE CONTRATADO/MOTORISTA E CONTRATANTE PELO PRESENTE PEDIDO DE CARREGAMENTO, RENUNCIANDO QUALQUER FORO POR MAIS PRIVILEGIADO QUE SEJA.`;

interface PedidoTemplateProps {
  data: {
    cliente: string;
    endereco?: string;
    cidade?: string;
    destinatario: string;
    cidade_destinatario?: string;
    descricao_carga?: string;
    saldo_frete?: string;
    veiculo_placa?: string;
    carreta_placa?: string;
    motorista_nome: string;
    motorista_fone?: string;
    termos_instrucoes?: string;
    created_at?: string;
  };
}

export const PedidoCarregamentoTemplate: React.FC<PedidoTemplateProps> = ({ data }) => {
  return (
    <div
      id="pdf-pedido-template"
      className="bg-white text-black p-8 font-sans border-4 border-black relative"
      style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-black tracking-wider text-orange-600">FORT CARGAS - AGÊNCIA</h1>
        <p className="text-xs font-semibold">Rod. BR 153 - KM 516 - Setor Rosa dos Ventos</p>
        <p className="text-xs font-semibold">Aparecida de Goiânia-GO - CEP: 74.989-840</p>
        <p className="text-xs font-bold mt-1">FONE: (62) 98140-7508</p>
      </div>

      {/* Title */}
      <div className="bg-black text-white text-center py-2 mb-4">
        <h2 className="text-lg font-black tracking-widest">PEDIDO DE CARREGAMENTO</h2>
      </div>

      {/* Box: Cliente / Destinatário */}
      <div className="border-2 border-black p-3 mb-4 space-y-2 text-sm">
        <div>
          <span className="font-extrabold">CLIENTE:</span>{' '}
          <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.cliente}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <span className="font-extrabold">ENDEREÇO:</span>{' '}
            <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.endereco || ''}</span>
          </div>
          <div>
            <span className="font-extrabold">CIDADE:</span>{' '}
            <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.cidade || ''}</span>
          </div>
        </div>
        <div className="border-t border-black my-2"></div>
        <div>
          <span className="font-extrabold">DESTINATÁRIO:</span>{' '}
          <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.destinatario}</span>
        </div>
        <div>
          <span className="font-extrabold">CIDADE:</span>{' '}
          <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.cidade_destinatario || ''}</span>
        </div>
      </div>

      {/* Box: Descrição da Carga */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-200 border-b-2 border-black px-3 py-1 text-xs font-black uppercase text-center">
          DESCRIÇÃO DA CARGA A SER COLETADA
        </div>
        <div className="p-3 font-mono text-sm uppercase min-h-[120px] whitespace-pre-wrap leading-relaxed">
          {data.descricao_carga || '\n\n'}
        </div>
      </div>

      {/* Box: Saldo de Frete */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-200 border-b-2 border-black px-3 py-1 text-xs font-black uppercase text-center">
          SALDO DE FRETE MEDIANTE APRESENTAÇÃO DOS COMPROV. ENTREGA ORIGINAIS
        </div>
        <div className="p-3 font-mono text-sm uppercase min-h-[80px] whitespace-pre-wrap leading-relaxed">
          {data.saldo_frete || '\n'}
        </div>
      </div>

      {/* Box: Placa / Motorista */}
      <div className="border-2 border-black p-3 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <span className="font-extrabold">VEICULO PLACA:</span>{' '}
            <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.veiculo_placa || ''}</span>
          </div>
          <div>
            <span className="font-extrabold">CARRETA PLACA:</span>{' '}
            <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.carreta_placa || ''}</span>
          </div>
        </div>
        <div className="flex flex-col justify-center border-l-2 border-black pl-4">
          <div>
            <span className="font-extrabold">MOTORISTA:</span>{' '}
            <span className="font-mono text-base ml-2 uppercase underline decoration-dotted">{data.motorista_nome}</span>
          </div>
        </div>
      </div>

      {/* Legal Text & Warnings */}
      <div className="border-2 border-black p-3 text-[10px] leading-relaxed mb-8 font-bold">
        <p className="text-center text-xs font-black underline mb-1.5 uppercase">TERMOS E INSTRUÇÕES</p>
        <div className="whitespace-pre-line text-justify text-[9.5px] leading-normal font-sans">
          {data.termos_instrucoes || DEFAULT_TERMOS}
        </div>
      </div>

      {/* Footer Signature */}
      <div className="absolute bottom-12 left-8 right-8 text-sm flex flex-col items-center">
        <div className="w-full flex justify-between px-4 mb-8 text-xs font-bold text-gray-500">
          <span>Emitido em: {formatarData(data.created_at || new Date().toISOString())}</span>
          <span>Fort Cargas Agência</span>
        </div>
        <div className="w-3/4 border-t border-black text-center pt-2">
          <span className="font-mono text-xs font-bold">MOTORISTA CIENTE: {data.motorista_nome}</span>
        </div>
      </div>
    </div>
  );
};

interface ReciboTemplateProps {
  data: {
    valor: number | string;
    recebi_de: string;
    quantia_de: string;
    correspondente_a?: string;
    transporte_de?: string;
    origem?: string;
    destino?: string;
    adiantamento?: number | string;
    saldo_receber?: number | string;
    motorista_nome: string;
    motorista_pix?: string;
    motorista_fone?: string;
    cavalo_placa?: string;
    carreta_placa?: string;
    local_cidade?: string;
    data_recibo?: string;
    deposito_chave_pix?: string;
    deposito_favorecido?: string;
    created_at?: string;
  };
}

export const ReciboTemplate: React.FC<ReciboTemplateProps> = ({ data }) => {
  return (
    <div
      id="pdf-recibo-template"
      className="bg-white text-black p-8 font-sans border-4 border-black relative"
      style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h1 className="text-2xl font-black tracking-widest text-orange-600">FORTCARGAS-AGENCIA</h1>
        <p className="text-xs font-semibold">RODOVIA BR-153 - KM 516 - ROSA DOS VENTOS</p>
        <p className="text-xs font-semibold">APARECIDA DE GOIANIA/GO</p>
        <p className="text-xs font-bold mt-0.5">FONE: (62) 98140-7508</p>
      </div>

      {/* Recibo Title and Valor */}
      <div className="flex justify-between items-center bg-gray-100 border-2 border-black px-4 py-2 mb-4">
        <span className="text-xl font-black tracking-widest">RECIBO</span>
        <div className="text-lg font-black bg-white px-3 py-1 border border-black">
          VALOR: <span className="font-mono">{formatarMoeda(data.valor)}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="border-2 border-black p-4 space-y-4 text-sm leading-relaxed mb-4">
        <p>
          <span className="font-extrabold uppercase">Recebi(emos) de:</span>{' '}
          <span className="font-mono text-base uppercase underline ml-2 inline-block w-[78%] decoration-dotted">
            {data.recebi_de}
          </span>
        </p>
        <p>
          <span className="font-extrabold uppercase">a quantia de:</span>{' '}
          <span className="font-mono text-base uppercase underline ml-2 inline-block w-[79%] decoration-dotted">
            {data.quantia_de}
          </span>
        </p>
        <p>
          <span className="font-extrabold uppercase">Correspondente a:</span>{' '}
          <span className="font-mono text-base underline ml-2 inline-block w-[77%] decoration-dotted">
            {data.correspondente_a || ''}
          </span>
        </p>
        <p>
          <span className="font-extrabold uppercase">do Transportes de:</span>{' '}
          <span className="font-mono text-base uppercase underline ml-2 inline-block w-[35%] decoration-dotted">
            {data.transporte_de || ''}
          </span>{' '}
          <span className="font-extrabold uppercase">de ORIGEM:</span>{' '}
          <span className="font-mono text-base uppercase underline ml-1 inline-block w-[30%] decoration-dotted">
            {data.origem || ''}
          </span>
        </p>
        <div className="flex justify-between items-center pt-1">
          <p className="w-1/2">
            <span className="font-extrabold uppercase">DESTINO:</span>{' '}
            <span className="font-mono text-base uppercase underline ml-2 inline-block w-[70%] decoration-dotted">
              {data.destino || ''}
            </span>
          </p>
          <p className="w-1/2 text-right">
            <span className="font-extrabold uppercase">ADIANTAMENTO:</span>{' '}
            <span className="font-mono text-base underline ml-2 inline-block w-[50%] decoration-dotted text-center">
              {data.adiantamento ? formatarMoeda(data.adiantamento) : ''}
            </span>
          </p>
        </div>
        <div className="border-t border-black my-2"></div>
        <div className="flex justify-between items-center">
          <span className="font-black text-red-700 text-sm uppercase">
            SALDO A RECEBER:{' '}
            <span className="font-mono text-base underline ml-2 text-black decoration-dotted">
              {formatarMoeda(data.saldo_receber)}
            </span>
          </span>
        </div>
      </div>

      {/* Driver Info */}
      <div className="border-2 border-black p-4 space-y-3 text-sm mb-4">
        <div>
          <span className="font-extrabold uppercase">MOTORISTA:</span>{' '}
          <span className="font-mono text-base uppercase underline ml-2 decoration-dotted">{data.motorista_nome}</span>
          {data.motorista_pix && (
            <>
              <span className="font-extrabold ml-4 uppercase">Pix:</span>{' '}
              <span className="font-mono text-base underline ml-2 decoration-dotted">{data.motorista_pix}</span>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-extrabold uppercase">CAVALO PLACA:</span>{' '}
            <span className="font-mono text-base uppercase underline ml-2 decoration-dotted">{data.cavalo_placa || ''}</span>
          </div>
          <div>
            <span className="font-extrabold uppercase">CARRETA PLACA:</span>{' '}
            <span className="font-mono text-base uppercase underline ml-2 decoration-dotted">{data.carreta_placa || ''}</span>
          </div>
        </div>
      </div>

      {/* Local, Data and Deposit details */}
      <div className="grid grid-cols-1 gap-4 text-sm mb-8">
        <div className="text-right font-bold pr-2">
          <span className="font-mono text-base">
            {data.local_cidade || 'AP. DE GOIANIA/GO'},{' '}
            {data.data_recibo ? formatarData(data.data_recibo) : formatarData(new Date().toISOString().split('T')[0])}
          </span>
        </div>

        <div className="border-2 border-black p-4 rounded-sm bg-gray-50 space-y-2">
          <div className="text-xs font-black text-gray-700 border-b border-gray-200 pb-1 uppercase tracking-wider">
            Dados para Depósito / PIX
          </div>
          <div>
            <span className="font-extrabold text-xs">PIX CHAVE:</span>{' '}
            <span className="font-mono text-sm ml-2 font-semibold text-gray-900">
              {data.deposito_chave_pix || ''}
            </span>
          </div>
          <div>
            <span className="font-extrabold text-xs">FAVORECIDO:</span>{' '}
            <span className="font-mono text-sm ml-2 font-semibold text-gray-900">
              {data.deposito_favorecido || ''}
            </span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="absolute bottom-12 left-8 right-8 text-sm flex flex-col items-center">
        <div className="w-full flex justify-between px-4 mb-10 text-xs font-bold text-gray-400">
          <span>Emitido em: {formatarData(data.created_at || new Date().toISOString())}</span>
          <span>Fort Cargas Agência</span>
        </div>
        <div className="w-3/4 border-t border-black text-center pt-2">
          <span className="font-mono text-xs font-bold">EMISSOR / RESPONSÁVEL</span>
        </div>
      </div>
    </div>
  );
};

interface ImagemTemplateProps {
  data: {
    imageUrl: string;
    title: string;
    created_at?: string;
  };
}

export const ImagemPDFTemplate: React.FC<ImagemTemplateProps> = ({ data }) => {
  return (
    <div
      id="pdf-imagem-template"
      className="bg-white text-black p-8 font-sans border-4 border-black relative flex flex-col justify-between"
      style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h1 className="text-2xl font-black tracking-wider text-orange-600">FORT CARGAS - AGÊNCIA</h1>
        <p className="text-xs font-semibold">Rod. BR 153 - KM 516 - Setor Rosa dos Ventos</p>
        <p className="text-xs font-semibold">Aparecida de Goiânia-GO - CEP: 74.989-840</p>
        <p className="text-xs font-bold mt-1">FONE: (62) 98140-7508</p>
      </div>

      {/* Document Title */}
      <div className="bg-black text-white text-center py-2 mb-4">
        <h2 className="text-base font-black tracking-widest uppercase">{data.title || 'DOCUMENTO ANEXADO'}</h2>
      </div>

      {/* Image Container */}
      <div className="flex-1 w-full flex items-center justify-center border-2 border-dashed border-gray-300 p-2 overflow-hidden bg-slate-50/50">
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt="Documento Anexo"
            className="max-w-full max-h-[720px] object-contain border border-gray-200 shadow-sm"
          />
        ) : (
          <span className="text-xs text-gray-400">Nenhuma imagem carregada</span>
        )}
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between px-4 mt-6 text-xs font-bold text-gray-400">
        <span>Emitido em: {formatarData(data.created_at || new Date().toISOString())}</span>
        <span>Fort Cargas Agência</span>
      </div>
    </div>
  );
};

