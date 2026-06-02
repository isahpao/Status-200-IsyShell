const API_URL = "http://localhost:8000";

const tokenInput = document.getElementById("token");
const scriptNameInput = document.getElementById("scriptName");
const parametroInput = document.getElementById("parametro");
const resultado = document.getElementById("resultado");
const logs = document.getElementById("logs");

document.getElementById("executeBtn").addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const scriptName = scriptNameInput.value;
  const parametro = parametroInput.value.trim();

  resultado.textContent = "Executando...";

  try {
    const response = await fetch(`${API_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Isy-Token": token
      },
      body: JSON.stringify({
        script: scriptName,
        params: {
          valor: parametro
        }
      })
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
    const response = await fetch(`${API_URL}/logs`, {
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