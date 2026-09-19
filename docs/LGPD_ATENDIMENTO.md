# LGPD no atendimento ISPCHAT

## Dados tratados

- Telefone WhatsApp, nome do contato
- CPF/CEP informados no chatbot (financeiro, viabilidade, contrato)
- Histórico de mensagens e tickets
- Dados retornados do ERP (contrato, faturas, OS)

## Boas práticas obrigatórias

1. **Base legal:** execução de contrato / legítimo interesse de suporte — documentar no aviso de privacidade do provedor.
2. **Minimização:** pedir CPF só quando a ação exigir; não logar CPF completo em logs de aplicação (mascarar: `***` + 4 dígitos finais).
3. **Acesso:** restringir painel a usuários autenticados; filas por setor; auditar ações sensíveis (`auditLog`).
4. **Retenção:** definir prazo de tickets/mensagens e rotina de exclusão/anonimização.
5. **Direitos do titular:** canal para acesso/exclusão; processo interno com prazo.
6. **Operadores:** DPA com processadores (hosting, Meta Cloud API, n8n se externo).
7. **Demo:** nunca `ALLOW_ISP_DEMO=true` em produção com clientes reais.

## No produto

- Modo demo bloqueado em produção por padrão (`ALLOW_ISP_DEMO`).
- Conectores ERP com token — não expor token na UI de listagem.
- Transferência humana para filas mapeadas (`ispTransferQueues`).
