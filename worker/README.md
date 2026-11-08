# AI Center — AI Worker

Este Worker fornece o endpoint `POST /api/chat` usado pelo frontend.

## Configuração
1. Instale Node.js e npm.
2. Na pasta do projeto, execute `npm install`.
3. Faça login com `npx wrangler login`.
4. Configure o binding Workers AI no `wrangler.jsonc` (já declarado).
5. Publique com `npx wrangler deploy`.
6. Copie a URL `workers.dev` gerada e configure `VITE_API_URL` no build do frontend.

A Cloudflare exige que o binding AI esteja ativo na conta. A alocação gratuita diária tem limite e não é ilimitada.

## Segurança
O endpoint limita o tamanho do corpo, a quantidade de mensagens e o tamanho de cada mensagem. Antes de divulgar amplamente, configure regras de rate limiting e proteção contra bots no painel Cloudflare.