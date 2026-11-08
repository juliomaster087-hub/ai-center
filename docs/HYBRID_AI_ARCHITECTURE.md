# AI Center — arquitetura híbrida

## Roteamento de modelos

O Worker `ai-center-api` recebe `tool` e `messages`, aplica instruções especializadas e seleciona provedores nesta ordem:

| Ferramenta | Ordem |
| --- | --- |
| Assistente | Groq → Gemini → Cloudflare |
| Escrita | Groq → Gemini → Cloudflare |
| Estudos | Gemini → Groq → Cloudflare |
| Código | Groq → Cloudflare → Gemini |
| Tradução | Gemini → Cloudflare → Groq |
| Resumos | Cloudflare → Gemini → Groq |

Modelos configurados:
- Groq: `openai/gpt-oss-20b`
- Gemini API: `gemini-2.5-flash-lite`
- Cloudflare Workers AI: `@cf/zai-org/glm-4.7-flash`

Os provedores externos são opcionais. Sem suas chaves, o Worker ignora esses provedores e utiliza Cloudflare. A ordem é uma preferência, não uma garantia de qualidade ou disponibilidade; limites e catálogo podem mudar.

## Configuração opcional de provedores

Nunca coloque chaves no frontend, em `.env` versionado ou no repositório. Configure como secrets do Worker:

```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GEMINI_API_KEY
```

Antes de configurar um provedor, confirme as condições e limites gratuitos atuais. Não habilite faturamento automático.

## Privacidade e custos

- O roteador não envia chaves ao navegador.
- Mensagens são encaminhadas apenas ao provedor selecionado.
- O nível gratuito do Gemini pode usar conteúdo para melhoria dos produtos, conforme a página oficial de preços. Não envie informações pessoais ou confidenciais.
- Groq e Cloudflare têm limites por conta/modelo; respostas de erro acionam fallback.
- Cloudflare Workers AI tem alocação gratuita diária de 10.000 Neurons. Ao esgotar a cota, o fallback Cloudflare não responderá até a renovação.
- Não existe garantia de disponibilidade ilimitada e gratuita.
- CORS restringe navegadores autorizados, mas não substitui rate limiting e controles antiabuso.

## Segredos opcionais
- `GROQ_API_KEY`
- `GEMINI_API_KEY`

## Testes
1. Sem secrets externos, validar fallback Cloudflare.
2. Com secrets válidos, testar cada ferramenta e verificar o campo `provider` da resposta.
3. Simular limite/indisponibilidade e confirmar fallback.
4. Confirmar que nenhuma chave aparece no frontend ou nos logs.
