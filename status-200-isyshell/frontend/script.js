const API_URL = "http://localhost:8000";

const tokenInput = document.getElementById("token");
const scriptNameInput = document.getElementById("scriptName");
const resultado = document.getElementById("resultado");
const logs = document.getElementById("logs");

document.getElementById("executeBtn").addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const scriptName = scriptNameInput.value;

  resultado.textContent = "Executando...";

  try {
    const response = await fetch(`${API_URL}/api/v1/scripts/${scriptName}/execute`, {
      method: "POST",
      headers: {
        "X-Isy-Token": token
      }
    });

    const data = await response.json();
    resultado.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    resultado.textContent = "Erro ao conectar com a API. Verifique se ela está rodando.";
  }
});

document.getElementById("logsBtn").addEventListener("click", async () => {
  const token = tokenInput.value.trim();

  logs.textContent = "Carregando logs...";

  try {
    const response = await fetch(`${API_URL}/api/v1/logs`, {
      method: "GET",
      headers: {
        "X-Isy-Token": token
      }
    });

    const data = await response.json();
    logs.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    logs.textContent = "Erro ao buscar logs. Verifique se a API está rodando.";
  }
});