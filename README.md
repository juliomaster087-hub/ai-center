# AI Center

Plataforma pública de ferramentas de inteligência artificial. Projeto em desenvolvimento.

## Stack
- React + TypeScript + Vite
- Cloudflare Workers AI (API `ai-center-api` implantada)
- Cloudflare Pages (projeto `ai-center` conectado ao GitHub)

## Publicar o site (Cloudflare Pages)
1. No painel Cloudflare, abra **Workers & Pages** e crie um projeto Pages conectado ao repositório GitHub.
2. Configure o comando de build como `npm run build` e o diretório de saída como `dist`.
3. Nas variáveis de ambiente de build, configure `VITE_API_URL` com a URL pública do Worker (depois que ele estiver implantado).
4. Salve e aguarde o primeiro deploy.

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

A implantação do Worker e a configuração do binding Workers AI são etapas separadas. Consulte `worker/README.md`. A URL pública da API só deve ser adicionada ao Pages depois do deploy do Worker.

## Implantação Cloudflare
- Site: https://ai-center-9fh.pages.dev
- API: https://ai-center-api.likasousa2024.workers.dev/api/chat
- O projeto Pages está conectado ao GitHub e usa `npm run build` com saída `dist`.
- A variável de build `VITE_API_URL` já aponta para a API.
- O primeiro deploy do site ainda precisa concluir.

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