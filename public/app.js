const API_BASE = "https://worker.folhabrdp.dev";

const apiStatus = document.querySelector("#api-status");
const dbStatus = document.querySelector("#db-status");
const detail = document.querySelector("#health-detail");
const refreshButton = document.querySelector("#refresh-health");

function setStatus(element, text, state) {
  element.textContent = text;
  element.className = state;
}

async function checkHealth() {
  setStatus(apiStatus, "Verificando...", "health-pending");
  setStatus(dbStatus, "Aguardando API", "health-pending");
  detail.textContent = "Consultando os serviços...";

  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`API respondeu HTTP ${response.status}`);

    const data = await response.json();
    if (!data.ok) throw new Error("A API não confirmou estado saudável.");

    setStatus(apiStatus, "Online", "health-ok");

    const dbResponse = await fetch(`${API_BASE}/api/health/db`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    const dbData = await dbResponse.json();

    if (!dbResponse.ok || !dbData.ok) {
      setStatus(dbStatus, "Indisponível", "health-error");
      detail.textContent = "A API respondeu, mas a consulta ao D1 falhou. Verifique a vinculação e as migrações.";
      return;
    }

    setStatus(dbStatus, "Conectado", "health-ok");
    detail.textContent = `Consulta concluída. ${dbData.tables.length} tabela(s) encontrada(s) no banco.`;
  } catch (error) {
    setStatus(apiStatus, "Não conectado", "health-error");
    setStatus(dbStatus, "Não verificado", "health-pending");
    detail.textContent = `Não foi possível consultar ${API_BASE}. O domínio do Worker precisa estar publicado e acessível. Detalhe: ${error.message}`;
  }
}

refreshButton?.addEventListener("click", checkHealth);
checkHealth();
