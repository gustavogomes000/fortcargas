/**
 * Converte um número decimal em valor por extenso em reais (BRL).
 */
export function numeroParaExtenso(valor: number): string {
  if (valor === 0) return 'Zero Reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenasTeens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  // Função auxiliar para converter números de 1 a 999 por extenso
  function converteGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';

    const c = Math.floor(n / 100);
    const restoC = n % 100;
    const d = Math.floor(restoC / 10);
    const u = restoC % 10;

    const partes: string[] = [];

    if (c > 0) {
      partes.push(centenas[c]);
    }

    if (d > 0) {
      if (d === 1) {
        partes.push(dezenasTeens[u]);
      } else {
        partes.push(dezenas[d]);
        if (u > 0) {
          partes.push(unidades[u]);
        }
      }
    } else if (u > 0) {
      partes.push(unidades[u]);
    }

    // Une as partes com "e"
    // Caso de centenas (ex: cento e vinte, cento e um)
    if (c > 0 && restoC > 0) {
      return centenas[c] + ' e ' + (d === 1 ? dezenasTeens[u] : (d > 0 ? dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '') : unidades[u]));
    }

    return partes.join(' e ');
  }

  // Divide o valor em reais e centavos
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);

  let extensoReais = '';

  if (reais > 0) {
    const milhoes = Math.floor(reais / 1000000);
    const restoMilhoes = reais % 1000000;
    const milhares = Math.floor(restoMilhoes / 1000);
    const unidadesSimples = restoMilhoes % 1000;

    const partesReais: string[] = [];

    if (milhoes > 0) {
      partesReais.push(converteGrupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões'));
    }

    if (milhares > 0) {
      partesReais.push(converteGrupo(milhares) + ' mil');
    }

    if (unidadesSimples > 0) {
      // Conector "e" para o último grupo se for menor que 100 ou multiplo de 100
      const precisaConectorE = milhares > 0 && (unidadesSimples < 100 || unidadesSimples % 100 === 0);
      if (precisaConectorE) {
        partesReais.push('e ' + converteGrupo(unidadesSimples));
      } else {
        partesReais.push(converteGrupo(unidadesSimples));
      }
    }

    const singularPluralReal = reais === 1 ? 'real' : 'reais';
    
    // Se o valor terminar em múltiplos de milhões e sem reais normais (ex: 1.000.000,00 -> "um milhão de reais")
    const precisaDeReais = milhoes > 0 && milhares === 0 && unidadesSimples === 0;
    extensoReais = partesReais.join(', ').replace(', e ', ' e ') + (precisaDeReais ? ' de ' : ' ') + singularPluralReal;
  }

  let extensoCentavos = '';
  if (centavos > 0) {
    const extensoCentavoGrupo = converteGrupo(centavos);
    const singularPluralCentavo = centavos === 1 ? 'centavo' : 'centavos';
    extensoCentavos = extensoCentavoGrupo + ' ' + singularPluralCentavo;
  }

  let resultado = '';
  if (extensoReais && extensoCentavos) {
    resultado = `${extensoReais} e ${extensoCentavos}`;
  } else if (extensoReais) {
    resultado = extensoReais;
  } else if (extensoCentavos) {
    resultado = extensoCentavos;
  }

  // Capitaliza a primeira letra
  return resultado.trim().charAt(0).toUpperCase() + resultado.trim().slice(1);
}
