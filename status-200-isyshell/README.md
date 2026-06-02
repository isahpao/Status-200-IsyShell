# Status 200 IsyShell

API segura para execução auditável de scripts técnicos.

## Problema

Rotinas críticas executadas manualmente no terminal podem gerar erro humano, falta de rastreabilidade e risco operacional.

## Solução

O Status 200 IsyShell transforma comandos manuais em chamadas de API seguras, com autenticação por token, catálogo de scripts permitidos, validação de parâmetros e registro de auditoria.

## Fluxo da solução

1. O usuário chama a API.
2. A API valida o token X-Isy-Token.
3. A API verifica se o script existe e está ativo.
4. Os parâmetros são validados.
5. O script é executado.
6. O resultado é retornado.
7. A execução é salva nos logs.

## Scripts de teste

- verificar_status
- limpar_logs
- reiniciar_servico

## Rotas previstas

- GET /scripts
- POST /execute
- GET /logs