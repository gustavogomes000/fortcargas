import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear localStorage cache to remove potential corrupted queries
      localStorage.removeItem("eleicoes-go-cache");
      // Reset the store/cache completely
      localStorage.clear();
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-[#0d2818] p-4 text-white font-sans">
          {/* Branded error card */}
          <div className="w-full max-w-md bg-[#133c24]/90 border border-[#f5c53a]/20 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-fade-in">
            {/* Pure CSS Branded Icon with alert decoration */}
            <div className="relative mx-auto w-16 h-16 bg-gradient-to-br from-[#2e7d22] to-[#0d2818] rounded-xl flex items-center justify-center border-2 border-[#f5c53a] shadow-lg">
              <span className="text-[#f5c53a] font-black text-2xl Montserrat select-none">S</span>
              <div className="absolute -bottom-1 -right-1 bg-destructive text-white p-1 rounded-full border border-[#0d2818]">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Ops! Algo deu errado</h2>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
                Ocorreu uma falha inesperada de inicialização ou renderização. Isso geralmente pode ser resolvido limpando o cache local.
              </p>
            </div>

            {/* Error detail for technical users */}
            {this.state.error && (
              <div className="bg-[#0a2013] border border-white/5 rounded-lg p-3 text-left max-h-24 overflow-y-auto">
                <p className="text-[10px] font-mono text-destructive-foreground break-all leading-normal">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/10 hover:bg-white/5 hover:text-white bg-transparent text-white/80 h-10 text-xs gap-1.5"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar Novamente
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#2e7d22] to-[#1c5015] hover:from-[#369329] hover:to-[#22631a] text-white border-0 h-10 text-xs gap-1.5 shadow-md shadow-[#2e7d22]/10"
                onClick={this.handleReset}
              >
                <Trash2 className="w-3.5 h-3.5 text-[#f5c53a]" />
                Limpar Cache e Reiniciar
              </Button>
            </div>

            <div className="text-[9px] text-white/30 tracking-wider uppercase font-semibold">
              SETPOLITIC — Sistema Eleitoral Goiano
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
