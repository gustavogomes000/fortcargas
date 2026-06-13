import { describe, it, expect } from "vitest";
import { numeroParaExtenso } from "../lib/extenso";
import { formatPhoneNumber, getWhatsAppShareLink } from "../lib/whatsappShare";

describe("numeroParaExtenso — Conversão por Extenso", () => {
  it("deve converter valores zerados", () => {
    expect(numeroParaExtenso(0)).toBe("Zero Reais");
  });

  it("deve converter valores singulares (um real)", () => {
    expect(numeroParaExtenso(1)).toBe("Um real");
  });

  it("deve converter valores decimais (reais e centavos)", () => {
    expect(numeroParaExtenso(1.50)).toBe("Um real e cinquenta centavos");
    expect(numeroParaExtenso(0.05)).toBe("Cinco centavos");
    expect(numeroParaExtenso(10.25)).toBe("Dez reais e vinte e cinco centavos");
  });

  it("deve converter valores de centenas", () => {
    expect(numeroParaExtenso(100)).toBe("Cem reais");
    expect(numeroParaExtenso(120)).toBe("Cento e vinte reais");
    expect(numeroParaExtenso(256.78)).toBe("Duzentos e cinquenta e seis reais e setenta e oito centavos");
  });

  it("deve converter valores na casa dos milhares", () => {
    expect(numeroParaExtenso(1000)).toBe("Um mil reais");
    expect(numeroParaExtenso(9870.50)).toBe("Nove mil, oitocentos e setenta reais e cinquenta centavos");
    expect(numeroParaExtenso(15420)).toBe("Quinze mil, quatrocentos e vinte reais");
  });

  it("deve converter milhões corretamente com conector 'de'", () => {
    expect(numeroParaExtenso(1000000)).toBe("Um milhão de reais");
    expect(numeroParaExtenso(2000000.50)).toBe("Dois milhões de reais e cinquenta centavos");
  });
});

describe("whatsappShare — Formatação e Compartilhamento", () => {
  describe("formatPhoneNumber", () => {
    it("deve remover caracteres não-numéricos", () => {
      expect(formatPhoneNumber("(62) 9 8140-7508")).toBe("5562981407508");
    });

    it("deve adicionar código DDI 55 do Brasil se tiver apenas DDD + Número", () => {
      expect(formatPhoneNumber("62981407508")).toBe("5562981407508");
      expect(formatPhoneNumber("11999999999")).toBe("5511999999999");
    });

    it("não deve duplicar DDI 55 se o número já começar com 55 e tiver comprimento adequado", () => {
      expect(formatPhoneNumber("5562981407508")).toBe("5562981407508");
      expect(formatPhoneNumber("5511999999999")).toBe("5511999999999");
    });

    it("deve retornar vazio se a entrada for vazia", () => {
      expect(formatPhoneNumber("")).toBe("");
      expect(formatPhoneNumber("   ")).toBe("");
    });
  });

  describe("getWhatsAppShareLink", () => {
    it("deve gerar link com telefone e mensagem codificada", () => {
      const link = getWhatsAppShareLink("62981407508", "Olá Rogério!");
      expect(link).toBe("https://api.whatsapp.com/send?phone=5562981407508&text=Ol%C3%A1%20Rog%C3%A9rio!");
    });

    it("deve gerar link apenas com mensagem se não houver telefone", () => {
      const link = getWhatsAppShareLink("", "Texto de Teste");
      expect(link).toBe("https://api.whatsapp.com/send?text=Texto%20de%20Teste");
    });
  });
});
