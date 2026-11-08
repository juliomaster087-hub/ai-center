# AI Center

Plataforma pública de ferramentas de inteligência artificial. Projeto em desenvolvimento.

## Stack
- React + TypeScript + Vite
- Cloudflare Workers AI (backend planejado)
- Cloudflare Pages (hospedagem planejada)

## Rodar localmente
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Ativar o serviço de IA
O frontend aceita a URL do Worker por meio da variável `VITE_API_URL`. O Worker deve expor `POST /api/chat` e retornar JSON no formato `{ "response": "..." }`.

Crie um arquivo `.env.local` (não envie segredos ao GitHub):
```env
VITE_API_URL=https://SEU-WORKER.workers.dev
```

A implantação do Worker e a configuração do binding Workers AI são etapas separadas. Consulte `worker/README.md`.

## Estado atual
- Interface responsiva e navegação: implementadas.
- Catálogo, busca e filtros: implementados.
- Tela de conversa e integração configurável: implementadas no frontend.
- Respostas reais de IA: dependem da implantação e configuração do Worker.
- Cadastro, histórico persistente e painel administrativo: planejados para etapas futuras.

## Custos e limites
O AI Center pretende usar opções gratuitas quando disponíveis. Serviços gratuitos possuem limites e podem mudar. Workers AI possui uma alocação gratuita diária sujeita às regras vigentes da Cloudflare. O projeto deve implementar proteção contra abuso antes de abrir o endpoint de IA ao público.

## Licença
A definir.