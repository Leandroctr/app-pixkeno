# White-label PWA

Base Next.js mobile-first para gerar PWAs reutilizaveis para diferentes marcas,
sites e plataformas.

## Stack

- Next.js com App Router
- React
- TypeScript
- Tailwind CSS
- ESLint
- Supabase
- OneSignal Web Push
- PWA com manifest dinamico e service worker

## Como executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_SHORT_NAME=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_PLATFORM_URL=
NEXT_PUBLIC_SUPPORT_URL=
NEXT_PUBLIC_PUBLIC_URL=
NEXT_PUBLIC_LOGO_URL=
NEXT_PUBLIC_THEME_COLOR=
NEXT_PUBLIC_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_MODE=
NEXT_PUBLIC_HOME_EYEBROW=
NEXT_PUBLIC_HOME_PRIMARY_ACTION=
NEXT_PUBLIC_HOME_SUPPORT_ACTION=
NEXT_PUBLIC_HOME_FLOATING_SUPPORT=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=

ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## White-label

A configuracao principal fica em `lib/app-config.ts`. Para criar uma nova
variacao do PWA, use a mesma base de codigo e altere apenas as variaveis de
ambiente do deploy.

Variaveis que normalmente mudam por dominio/site:

- `NEXT_PUBLIC_APP_NAME`: nome completo exibido no app.
- `NEXT_PUBLIC_APP_SHORT_NAME`: nome curto usado no manifest e UI compacta.
- `NEXT_PUBLIC_APP_DESCRIPTION`: texto principal da home e descricao do PWA.
- `NEXT_PUBLIC_PLATFORM_URL`: destino do botao Acessar.
- `NEXT_PUBLIC_SUPPORT_URL`: destino dos botoes de suporte.
- `NEXT_PUBLIC_PUBLIC_URL`: dominio publico do PWA.
- `NEXT_PUBLIC_LOGO_URL`: URL publica do logo da marca.
- `NEXT_PUBLIC_THEME_COLOR`: cor principal da marca.
- `NEXT_PUBLIC_BACKGROUND_COLOR`: cor de fundo do app.
- `NEXT_PUBLIC_SUPABASE_URL`: projeto Supabase da variacao.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anonima Supabase da variacao.
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`: app OneSignal da variacao.
- `NEXT_PUBLIC_HOME_EYEBROW`: texto pequeno no topo da home.
- `NEXT_PUBLIC_HOME_PRIMARY_ACTION`: texto do botao principal.
- `NEXT_PUBLIC_HOME_SUPPORT_ACTION`: texto do botao de suporte.
- `NEXT_PUBLIC_HOME_FLOATING_SUPPORT`: texto do botao flutuante.

O manifest, a home, o painel e as integracoes publicas consomem
`lib/app-config.ts`, entao nome, descricao, cores, logo e URLs acompanham
automaticamente o ambiente configurado.

## Supabase

1. Crie um projeto no Supabase.
2. Rode o SQL de `supabase/schema.sql` no SQL editor do projeto.
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Preencha `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente servidor/deploy.

Tabelas usadas:

- `push_subscriptions`: inscricoes web push, com `onesignal_id` unico.
- `push_campaigns`: historico basico de campanhas enviadas.

## OneSignal

1. Crie um app Web Push no OneSignal.
2. Configure o dominio publico do PWA no painel OneSignal.
3. Preencha `NEXT_PUBLIC_ONESIGNAL_APP_ID`.
4. Preencha `ONESIGNAL_REST_API_KEY` apenas no ambiente servidor/deploy.

A chave `ONESIGNAL_REST_API_KEY` nunca e usada no client. O front-end inicializa
o SDK, solicita permissao e envia o identificador para `/api/push/subscribe`.
O envio real passa por `/api/push/send`.

## Como testar push

1. Preencha `.env.local` com Supabase, OneSignal e credenciais admin.
2. Rode `npm run dev`.
3. Abra a home e aceite a permissao de notificacao do navegador.
4. Confirme no Supabase se uma linha entrou em `push_subscriptions`.
5. Acesse `/admin/login`.
6. Entre com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
7. Em `/admin`, envie um teste ou envie para todos.
8. Confira o registro em `push_campaigns`.

Em desenvolvimento local, push web pode depender de suporte do navegador,
HTTPS ou regras do proprio OneSignal para localhost.

## Admin MVP

O painel usa autenticacao simples por variaveis:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Isso e intencional para o MVP. Nao ha Supabase Auth, segmentacao, CRM ou
autenticacao complexa nesta etapa.
