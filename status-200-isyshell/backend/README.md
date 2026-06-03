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
- Administração de scripts com descrição, parâmetros e status ativo/inativo
- Alteração dinâmica do token de autenticação

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

### Opção recomendada

A partir da pasta principal do projeto:

```bash
cd Status-200-IsyShell/status-200-isyshell
```
Execute:

```bash
docker compose up --build
```
### Opção alternativa

Também é possível rodar diretamente pela pasta do backend:

```bash
cd backend
```
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

### Automação

```http
GET /api/v1/scripts
```

```http
POST /api/v1/scripts/{script_name}/execute
```

### Auditoria

```http
GET /api/v1/logs
```

### Administração

```http
GET /api/v1/admin/scripts
```

```http
POST /api/v1/admin/scripts
```

```http
PATCH /api/v1/admin/scripts/{script_name}/status
```

```http
PUT /api/v1/admin/token
```

## 🧩 Administração

A API possui rotas administrativas disponíveis via Swagger para:

- listar scripts cadastrados;
- cadastrar novos scripts Bash;
- informar descrição curta;
- informar parâmetros esperados;
- definir status ativo ou inativo;
- alterar dinamicamente o token de autenticação.

Essas rotas permitem administrar o catálogo de scripts autorizados sem permitir a execução livre de comandos no servidor.

## 🧾 Auditoria

Cada execução de script gera um log contendo:

- nome do script;
- parâmetros;
- status;
- saída padrão;
- erros;
- data e hora da execução.
