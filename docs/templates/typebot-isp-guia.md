# Template Typebot — Menu ISP

Monte no Typebot (canvas visual) este fluxo:

## Bloco 1 — Menu

```
Olá! Sou o assistente da {{company}}.

1 - 2ª via / PIX
2 - Sem internet
3 - Viabilidade de instalação
4 - Falar com atendente
```

## Bloco 2a — 2ª via

1. Input: "Digite o CPF do titular"
2. HTTP Request → API do ERP (ou webhook n8n)
3. Texto: "Segue o link: {{invoiceUrl}}"
4. Opção: voltar ao menu / #sair

## Bloco 2b — Sem internet

1. "A luz da ONU está verde, vermelha ou apagada?"
2. Se vermelha/apagada → mensagem de reinício + abrir OS
3. Se verde → transferir suporte técnico

## Comando especial (Whaticket)

No final de qualquer caminho, envie um bubble de texto começando com `#` + JSON:

```
#{"queueId":2}
```

Isso transfere o ticket para a fila 2 e desliga o bot.

Para encerrar: keyword `#sair` (configurada na integração).
