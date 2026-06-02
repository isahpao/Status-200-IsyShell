# Backend - Status 200 IsyShell

Backend da aplicação **Status 200 IsyShell**, desenvolvido em **FastAPI** e executado via **Docker**.

Esta API é responsável por validar autenticação, listar scripts autorizados, executar automações shell controladas e registrar logs de auditoria em banco SQLite.

## ⚙️ Funcionalidades

- API REST com FastAPI
- Autenticação via header `X-Isy-Token`
- Catálogo de scripts autorizados
- Execução controlada de scripts shell
- Registro de logs em SQLite
- Documentação automática via Swagger
- Execução em container Docker

## 🔐 Autenticação

Header obrigatório:

```txt
X-Isy-Token: isy-secret-token
```

## 📜 Scripts Autorizados

- `cleanup_logs`
- `docker_status`
- `check_disk_usage`
- `restart_service`
- `backup_database`

## 🚀 Como Rodar

Construa a imagem Docker:

```bash
docker build -t status200-isyshell .
```

Execute o container:

```bash
docker run -p 8000:8000 status200-isyshell
```

A API ficará disponível em:

```txt
http://localhost:8000
```

A documentação Swagger estará disponível em:

```txt
http://localhost:8000/docs
```

## 📡 Rotas Principais

```http
GET /
```

```http
GET /api/v1/scripts
```

```http
POST /api/v1/scripts/{script_name}/execute
```

```http
GET /api/v1/logs
```

## 🧾 Auditoria

Cada execução de script gera um log contendo:

- nome do script;
- parâmetros;
- status;
- saída padrão;
- erros;
- data e hora da execução.
