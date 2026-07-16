import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/brand/ErrorBoundary.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Garante que, ao reabrir o PWA instalado (voltar do background ou nova
// abertura), uma versão nova do app publicada nunca fique "presa" rodando
// o JS antigo em memória — o que fazia correções (ex: histórico) não
// aparecerem até o usuário desinstalar/reinstalar.
if ("serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      // Revalida o SW toda vez que o app volta ao primeiro plano
      // (fechar/abrir no celular dispara visibilitychange, nem sempre um reload).
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration?.update().catch(() => {});
        }
      });
    },
  });

  // skipWaiting + clientsClaim (vite.config.ts) fazem o novo SW assumir
  // sozinho. Quando isso acontece, os chunks JS antigos ainda estão em
  // memória e podem ficar dessincronizados com a API — recarregar aqui
  // garante que a correção valha já na próxima vez que o usuário fechar
  // e reabrir o app, em vez de ficar "presa" até reinstalar.
  //
  // `controllerchange` também dispara no PRIMEIRO acesso (quando ainda não
  // havia nenhum SW controlando a página, e o clientsClaim assume o controle
  // pela primeira vez) — sem essa checagem, todo usuário novo teria a página
  // recarregada sozinha logo após o primeiro carregamento.
  const hadControllerOnLoad = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadControllerOnLoad || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
