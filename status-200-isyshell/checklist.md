# Checklist — Status 200 IsyShell

## MVP obrigatório

- [ ] API em FastAPI
- [ ] Rota para listar scripts
- [ ] Rota para executar scripts
- [ ] Autenticação por X-Isy-Token
- [ ] Bloqueio de token inválido
- [ ] Catálogo de scripts permitidos
- [ ] Bloqueio de script inativo
- [ ] Validação simples de parâmetros
- [ ] Execução via subprocess
- [ ] Logs de auditoria
- [ ] Banco de dados
- [ ] Dockerfile
- [ ] README
- [ ] Slides
- [ ] Vídeo de até 2 minutos

## Testes

- [ ] Listar scripts
- [ ] Executar sem token e bloquear
- [ ] Executar com token errado e bloquear
- [ ] Executar com token certo e funcionar
- [ ] Executar script inativo e bloquear
- [ ] Ver logs após execução