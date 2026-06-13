import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import FortCargasDashboard from "../pages/FortCargasDashboard";

// Mock das dependências externas do Supabase e toast para evitar requisições de rede
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: "test.pdf" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "https://test.com/test.pdf" } }),
      }),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("FortCargasDashboard — Teste de Integração UX", () => {
  it("deve renderizar o cabeçalho, saudação para o Rogério e cards da Home", () => {
    render(<FortCargasDashboard />);

    // Verifica se o título principal está presente
    expect(screen.getByText("Fort Cargas")).toBeDefined();

    // Verifica se a saudação contém Rogério
    const greetingHeader = screen.getByText(/Rogério/);
    expect(greetingHeader).toBeDefined();

    // Verifica se as opções de emissão estão na tela
    expect(screen.getByText("Pedido de Carregamento")).toBeDefined();
    expect(screen.getByText("Recibo de Pagamento")).toBeDefined();
  });

  it("deve abrir o formulário de Pedido de Carregamento ao clicar no card correspondente", async () => {
    const { container } = render(<FortCargasDashboard />);

    // Clica no card de Pedido de Carregamento
    const cardPedido = screen.getByText("Pedido de Carregamento").closest(".group");
    expect(cardPedido).not.toBeNull();
    
    if (cardPedido) {
      fireEvent.click(cardPedido);
    }

    // Verifica se o formulário do pedido foi montado na tela
    expect(screen.getByText("Novo Pedido de Carregamento")).toBeDefined();
    expect(container.querySelector('input[name="cliente"]')).not.toBeNull();

    // Clica no botão de voltar para retornar ao início
    const btnVoltar = screen.getByText("Voltar");
    fireEvent.click(btnVoltar);

    // Deve voltar para a tela principal
    expect(screen.getByText("Pedido de Carregamento")).toBeDefined();
  });

  it("deve abrir o formulário de Recibo de Pagamento ao clicar no card correspondente", () => {
    const { container } = render(<FortCargasDashboard />);

    // Clica no card de Recibo
    const cardRecibo = screen.getByText("Recibo de Pagamento").closest(".group");
    expect(cardRecibo).not.toBeNull();
    
    if (cardRecibo) {
      fireEvent.click(cardRecibo);
    }

    // Verifica se o formulário de recibo foi montado na tela
    expect(screen.getByText("Novo Recibo de Pagamento")).toBeDefined();
    expect(container.querySelector('input[name="recebi_de"]')).not.toBeNull();

    // Clica no botão de voltar
    const btnVoltar = screen.getByText("Voltar");
    fireEvent.click(btnVoltar);

    // Deve voltar para a tela principal
    expect(screen.getByText("Recibo de Pagamento")).toBeDefined();
  });

  it("deve abrir o Histórico Geral ao clicar no card de atalho na Home", () => {
    render(<FortCargasDashboard />);

    // Clica no card de Histórico Geral
    const cardHistorico = screen.getByText("Histórico Geral de Documentos").closest(".group");
    expect(cardHistorico).not.toBeNull();
    
    if (cardHistorico) {
      fireEvent.click(cardHistorico);
    }

    // Verifica se o painel geral do histórico foi montado na tela
    expect(screen.getByText("Histórico Geral de Documentos")).toBeDefined();

    // Clica no botão de voltar (header back button)
    const btnVoltar = screen.getByTitle("Voltar ao início");
    fireEvent.click(btnVoltar);

    // Deve voltar para a tela principal
    expect(screen.getByText("Pedido de Carregamento")).toBeDefined();
  });
});
