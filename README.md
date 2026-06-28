# BarberTche Back

Backend NestJS + TypeScript para regras de agenda da barbearia.

## Rodar

```bash
npm install
npm run prisma:generate
npm run start:dev
```

API local:

```text
http://localhost:3333
```

## Objetivo

Centralizar regras sensíveis no servidor, especialmente:

- conflito entre agendamentos comuns;
- conflito com agendamentos fixos semanais;
- bloqueios manuais;
- dias fechados e feriados;
- horário de funcionamento;
- duração do serviço.

## Banco local

Suba o PostgreSQL com Docker:

```bash
docker compose up -d
```

Crie as tabelas e rode o seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Se quiser manter o banco zerado e criar apenas o usuario administrador, nao rode o seed. Configure no `.env`:

```env
ADMIN_NAME="Administrador"
ADMIN_EMAIL="admin@barbertche.com"
ADMIN_PHONE="(51) 99999-9999"
ADMIN_PASSWORD="troque-essa-senha"
JWT_SECRET="troque-este-segredo"
```

Depois rode:

```bash
npm run prisma:create-admin
```

## Banco no Supabase

No Supabase, copie as conexoes em:

```text
Project Settings > Database > Connection string
```

Use duas URLs no `.env`:

```env
PORT=3333

# URL do pooler para o backend rodando normalmente
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"

# URL direta para migrations do Prisma
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require&schema=public"
```

Importante:

- Troque `PROJECT_REF` pelo ref do seu projeto.
- Troque `PASSWORD` pela senha do banco.
- Se a senha tiver caracteres especiais, use URL encode.
- O app mobile nunca deve conectar direto no Supabase/Postgres. Ele deve chamar este backend.

Depois rode:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:create-admin
npm run start:dev
```

Em producao, prefira:

```bash
npm run prisma:deploy
```

## Concorrência de agenda

Criação e remarcação de agendamentos rodam dentro de transação Prisma. Antes de validar e gravar, o backend executa um `pg_advisory_xact_lock` por dia da agenda. Isso serializa tentativas simultâneas para a mesma data e evita que dois clientes reservem o mesmo horário em corrida.
