# Agenda+ - Sistema de Agendamento Médico

Sistema completo de agendamento médico desenvolvido com Laravel (backend) e Next.js (frontend), seguindo as melhores práticas de desenvolvimento de software.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
  - [Método 1: Docker com Makefile](#método-1-usando-docker-com-makefile-recomendado---mais-simples)
  - [Método 2: Docker Compose Manual](#método-2-usando-docker-compose-manualmente)
  - [Método 3: Desenvolvimento Local SEM Docker](#método-3-desenvolvimento-local-sem-docker)
- [Configuração](#configuração)
- [Uso](#uso)
- [Testes](#testes)
- [Documentação](#documentação)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

O **Agenda+** é um sistema completo de agendamento médico que permite:

- ✅ Agendamento, cancelamento e remarcação de consultas
- ✅ Gestão de agendas médicas
- ✅ Observações clínicas e prontuário
- ✅ Relatórios administrativos (com exportação PDF)
- ✅ Gestão de convênios
- ✅ Sistema de notificações
- ✅ Conformidade LGPD
- ✅ Logs de auditoria

## 🛠 Tecnologias

### Backend
- **Laravel 12** - Framework PHP
- **PHP 8.2+** - Linguagem
- **PostgreSQL 16** - Banco de dados
- **Redis 7** - Cache e filas
- **Laravel Sanctum** - Autenticação API
- **Laravel Queue** - Processamento assíncrono

### Frontend
- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Axios** - Cliente HTTP
- **React Hook Form** - Formulários
- **Zustand** - Gerenciamento de estado

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **GitHub Actions** - CI/CD

## 📦 Requisitos

### Opção 1: Com Docker (Recomendado - Mais Fácil)
- Docker e Docker Compose
- Make (opcional, mas recomendado) ou Git Bash no Windows
- Node.js 20+ (apenas para desenvolvimento local sem Docker)

### Opção 2: Sem Docker (Desenvolvimento Local)
- PHP 8.2+ com extensões: `pdo_pgsql`, `pdo_sqlite`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `intl`, `redis` (opcional)
- Composer 2.x
- PostgreSQL 16+ ou SQLite (como alternativa simples)
- Redis 7+ (opcional, pode usar `file` ou `array` como driver de cache)
- Node.js 20+ e npm/yarn
- Git

**Nota:** O Docker é a forma mais fácil e recomendada para rodar o projeto, pois automatiza toda a configuração. Desenvolvimento local sem Docker requer mais configuração manual.

## 🚀 Instalação

### Método 1: Usando Docker com Makefile (Recomendado - Mais Simples)

O projeto inclui um `Makefile` que automatiza todo o processo de instalação:

1. Clone o repositório:
```bash
git clone <seu-fork-url>
cd "app agenda+"
```

**💡 Dica:** Se você fez fork, substitua `<seu-fork-url>` pela URL do seu fork no GitHub.

2. Execute o setup completo:
```bash
make install
```

Este comando irá:
- Construir as imagens Docker
- Instalar dependências do backend (Composer)
- Instalar dependências do frontend (npm)
- Gerar a chave da aplicação Laravel
- Executar migrações e seeders do banco de dados

3. Inicie os serviços:
```bash
make up
```

4. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/api/documentation
- Mailpit: http://localhost:8025

**Comandos úteis do Makefile:**
```bash
make up              # Iniciar todos os serviços
make down            # Parar e remover containers
make logs            # Ver logs de todos os serviços
make test            # Executar todos os testes
make backend-shell   # Acessar shell do backend
make frontend-shell  # Acessar shell do frontend
make bootstrap       # Re-executar migrações e seeders
```

### Método 2: Usando Docker Compose Manualmente

1. Clone o repositório:
```bash
git clone <repository-url>
cd "app agenda+"
```

2. Configure as variáveis de ambiente:
```bash
cp backend/.env.example backend/.env
```

**Nota:** O frontend não requer arquivo `.env.local` quando usando Docker, pois as variáveis são definidas no `docker-compose.yml`. Se estiver desenvolvendo localmente sem Docker, crie `frontend/.env.local` com:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Construa e inicie os containers:
```bash
docker-compose build
docker-compose up -d
```

4. Instale as dependências e configure o backend:
```bash
docker-compose exec backend composer install
docker-compose exec backend php artisan key:generate
docker-compose exec backend php artisan migrate --seed
```

5. Instale as dependências do frontend:
```bash
docker-compose exec frontend npm install
```

6. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/api/documentation
- Mailpit: http://localhost:8025

### Método 3: Desenvolvimento Local SEM Docker

> ⚠️ **Atenção:** Este método requer mais configuração manual. O Docker é recomendado para garantir que todos tenham o mesmo ambiente.

#### Pré-requisitos para Desenvolvimento Local

Você precisará instalar e configurar manualmente:

1. **PHP 8.2+** com as seguintes extensões:
   - `pdo_pgsql` ou `pdo_sqlite`
   - `mbstring`
   - `xml`
   - `curl`
   - `zip`
   - `bcmath`
   - `intl`
   - `gd` (para geração de PDF)

2. **Composer** - Gerenciador de dependências PHP
   - Baixe em: https://getcomposer.org/

3. **PostgreSQL 16+** ou **SQLite** (mais simples)
   - PostgreSQL: https://www.postgresql.org/download/
   - SQLite: Geralmente já vem com PHP

4. **Redis** (opcional - pode usar cache em arquivo)
   - Redis: https://redis.io/download/
   - Ou configure para usar `file` ou `array` como driver de cache

5. **Node.js 20+** e npm/yarn
   - Baixe em: https://nodejs.org/

#### Configuração no Windows (Sem WSL)

Se você estiver no Windows sem WSL:

1. **Instale o XAMPP ou Laragon** (mais fácil):
   - XAMPP: https://www.apachefriends.org/ (inclui PHP, Apache, MySQL - pode desabilitar MySQL)
   - Laragon: https://laragon.org/ (recomendado - inclui PHP, PostgreSQL, Redis)

2. **Instale PostgreSQL separadamente:**
   - Download: https://www.postgresql.org/download/windows/
   - Ou use o PostgreSQL que vem com Laragon

3. **Use PowerShell ou CMD** (não precisa de Make):
   - Todos os comandos podem ser executados diretamente
   - Veja a seção "Comandos Equivalentes no Windows" abaixo

4. **Para comandos que usam Make:**
   - Substitua `make install` pelos comandos manuais abaixo
   - Ou instale o Make: https://www.gnu.org/software/make/

---

#### Passo a Passo: Backend Local

**1. Instale as dependências PHP:**

```bash
cd backend
composer install
```

**2. Configure o ambiente:**

```bash
# Copie o arquivo de exemplo
copy .env.example .env  # Windows
# ou
cp .env.example .env    # Linux/Mac

# Gere a chave da aplicação
php artisan key:generate
```

**3. Configure o banco de dados:**

**Opção A: PostgreSQL (Recomendado para produção)**

Edite o arquivo `backend/.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=agenda
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_postgres
```

Crie o banco de dados:
```bash
# No PostgreSQL (psql ou pgAdmin)
CREATE DATABASE agenda;

# Ou via linha de comando:
createdb -U postgres agenda
```

**Opção B: SQLite (Mais Simples - Apenas Desenvolvimento)**

Edite o arquivo `backend/.env`:
```env
DB_CONNECTION=sqlite
DB_DATABASE=C:\caminho\para\app agenda+\backend\database\database.sqlite
```

Crie o arquivo SQLite:
```bash
# Windows (PowerShell)
New-Item -ItemType File -Path "database\database.sqlite"

# Linux/Mac
touch database/database.sqlite
```

**4. Configure o cache (se não tiver Redis):**

Edite o arquivo `backend/.env`:
```env
CACHE_DRIVER=file  # Ou 'array' para desenvolvimento
QUEUE_CONNECTION=sync  # Processa filas de forma síncrona
```

**5. Execute as migrações e seeders:**

```bash
php artisan migrate --seed
```

**6. Inicie o servidor:**

```bash
php artisan serve
```

O backend estará disponível em: http://localhost:8000

---

#### Passo a Passo: Frontend Local

**1. Instale as dependências:**

```bash
cd frontend
npm install
```

**2. Configure as variáveis de ambiente:**

Crie o arquivo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**3. Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

O frontend estará disponível em: http://localhost:3000

---

#### Comandos Equivalentes no Windows (Sem Make)

Se você não tem Make instalado, use estes comandos equivalentes:

| Comando Make | Equivalente no Windows (PowerShell) | Equivalente no Linux/Mac |
|--------------|-------------------------------------|--------------------------|
| `make install` | Veja passos manuais acima | `docker-compose build && docker-compose run --rm backend composer install && ...` |
| `make up` | `docker-compose up -d` | `docker-compose up -d` |
| `make down` | `docker-compose down` | `docker-compose down` |
| `make logs` | `docker-compose logs -f` | `docker-compose logs -f` |
| `make test` | `docker-compose run --rm backend php artisan test && docker-compose run --rm frontend npm test` | Igual |
| `make backend-shell` | `docker-compose exec backend bash` | `docker-compose exec backend bash` |

---

#### Troubleshooting - Desenvolvimento Local

**Erro: "Class 'PDO' not found" ou extensão PDO não encontrada**
- Instale a extensão `pdo_pgsql` ou `pdo_sqlite` no PHP
- No Windows com XAMPP: Edite `php.ini` e descomente `extension=pdo_pgsql`

**Erro: "Connection refused" ao conectar ao PostgreSQL**
- Verifique se o PostgreSQL está rodando: `pg_isready` (Linux/Mac) ou verifique os serviços no Windows
- Confirme que as credenciais no `.env` estão corretas
- Teste a conexão: `psql -U postgres -d agenda`

**Erro: Redis não encontrado (mas você não precisa dele)**
- Configure `CACHE_DRIVER=file` no `.env`
- Configure `QUEUE_CONNECTION=sync` no `.env`

**Porta 8000 ou 3000 já em uso**
- Mude a porta do Laravel: `php artisan serve --port=8001`
- Mude a porta do Next.js: `npm run dev -- -p 3001`
- Atualize `NEXT_PUBLIC_API_URL` no frontend para usar a nova porta

**Erro ao gerar PDF (extensão GD não encontrada)**
- Instale a extensão `gd` no PHP
- No Windows com XAMPP: Edite `php.ini` e descomente `extension=gd`

---

#### Limitações ao Rodar Sem Docker

Ao rodar sem Docker, você pode encontrar algumas limitações:

- ⚠️ **Mailpit não disponível** - E-mails não serão capturados automaticamente
  - Solução: Configure um servidor SMTP real ou use `log` como driver de mail
  - Configure no `.env`: `MAIL_MAILER=log` para salvar e-mails em arquivo de log

- ⚠️ **Redis opcional** - Se não tiver Redis, use `file` como cache
  - Configure: `CACHE_DRIVER=file` e `QUEUE_CONNECTION=sync`

- ⚠️ **Diferenças entre ambientes** - Seu ambiente pode diferir do Docker
  - Algumas funcionalidades podem se comportar diferente
  - Testes podem passar em um ambiente e falhar em outro

**Recomendação:** Use Docker para desenvolvimento quando possível. Use desenvolvimento local apenas se:
- Você tem experiência com configuração de ambientes
- Você não consegue usar Docker no seu sistema
- Você está fazendo modificações que requerem acesso direto ao sistema

---

#### Alternativa: Usar Docker apenas para Serviços

Você pode rodar apenas os serviços (PostgreSQL, Redis) via Docker e rodar o código localmente:

**1. Inicie apenas os serviços:**
```bash
docker-compose up -d db redis mailpit
```

**2. Configure o `.env` para conectar aos serviços Docker:**
```env
DB_HOST=127.0.0.1
DB_PORT=5432
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
```

**3. Execute o código localmente:**
```bash
# Terminal 1 - Backend
cd backend
php artisan serve

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Esta abordagem combina a facilidade do Docker para serviços com a flexibilidade de desenvolvimento local.

## ⚙️ Configuração

### Variáveis de Ambiente

#### Backend (.env)
```env
APP_NAME="Agenda+"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=agenda
DB_USERNAME=agenda
DB_PASSWORD=agenda

REDIS_HOST=redis
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Nota:** Quando usando Docker, essas variáveis são definidas automaticamente no `docker-compose.yml`. O arquivo `.env.local` é necessário apenas para desenvolvimento local sem Docker.

## 🎮 Uso

### Autenticação

Após executar `make install`, você pode usar estas credenciais de teste:

**Administrador:**
- Email: `admin@agendaplus.test`
- Senha: `password`

**Médico:**
- Email: `dr.responsavel@agendaplus.test`
- Senha: `password`

**Paciente:**
- Email: `paciente.demo@agendaplus.test`
- Senha: `password`

1. Acesse `/login` no frontend (http://localhost:3000/login)
2. Use uma das credenciais acima ou crie uma nova conta
3. O token será armazenado automaticamente

### Endpoints Principais

- `POST /api/auth/login` - Login
- `GET /api/appointments` - Listar consultas
- `POST /api/appointments` - Agendar consulta
- `GET /api/doctors` - Listar médicos
- `GET /api/health-insurances` - Listar convênios

Consulte a documentação Swagger em `/api/documentation` para todos os endpoints.

## 🧪 Testes

### Usando Docker (Recomendado)

```bash
# Todos os testes (backend + frontend)
make test

# Apenas backend
make test-backend

# Apenas frontend
make test-frontend
```

### Desenvolvimento Local

#### Backend

```bash
# Todos os testes
cd backend
php artisan test

# Com cobertura
php artisan test --coverage

# Testes específicos
php artisan test --filter AppointmentTest
```

#### Frontend

```bash
# Todos os testes
cd frontend
npm test

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

### Cobertura Mínima

- Backend: 70%
- Frontend: 70%

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro: "make: command not found" (Windows sem WSL/Make)

**Solução:**

1. **Use Docker Compose diretamente** (não precisa de Make):
   ```powershell
   # Em vez de: make install
   docker-compose build
   docker-compose run --rm backend composer install
   docker-compose run --rm backend php artisan key:generate
   docker-compose run --rm backend php artisan migrate --seed
   docker-compose run --rm frontend npm install
   docker-compose up -d
   
   # Em vez de: make up
   docker-compose up -d
   
   # Em vez de: make down
   docker-compose down
   ```

2. **Instale o Make** (opcional):
   - Git Bash já inclui Make
   - Ou baixe: https://www.gnu.org/software/make/

3. **Use desenvolvimento local** (veja Método 3 acima)

#### Erro: "Cannot find module" ou dependências não instaladas
```bash
# Com Docker (com Make):
make down
make install
make up

# Com Docker (sem Make):
docker-compose down
docker-compose build
docker-compose run --rm backend composer install
docker-compose run --rm frontend npm install
docker-compose up -d

# Desenvolvimento local:
cd backend && composer install
cd ../frontend && npm install
```

#### Erro: "Connection refused" ao conectar ao banco
- Verifique se o container do banco está rodando: `docker-compose ps`
- Verifique as variáveis de ambiente no `backend/.env`
- Certifique-se de que `DB_HOST=db` (nome do serviço no docker-compose)

#### Erro: "APP_KEY not set" no Laravel
```bash
# Com Docker:
docker-compose exec backend php artisan key:generate
# Ou usando Makefile:
make key

# Desenvolvimento local:
cd backend
php artisan key:generate
```

#### Frontend não conecta ao backend
- Verifique se `NEXT_PUBLIC_API_URL` está correto
- No Docker: deve ser `http://localhost:8000/api`
- Verifique se o backend está rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs backend`

#### Erro ao executar migrações
```bash
# Com Docker (com Make):
make down
docker volume rm agenda-plus_db-data
make install

# Com Docker (sem Make):
docker-compose down
docker volume rm agenda-plus_db-data
docker-compose build
docker-compose run --rm backend composer install
docker-compose run --rm backend php artisan migrate --seed
docker-compose up -d

# Desenvolvimento local:
cd backend
php artisan migrate:fresh --seed
```

#### Portas já em uso
Se as portas 3000, 8000, 5432 ou 6379 estiverem em uso:
- Pare os serviços que estão usando essas portas
- Ou altere as portas no `docker-compose.yml`

### Verificando o Status dos Serviços

**Com Docker:**
```bash
# Ver status dos containers
make ps                    # Com Make
docker-compose ps          # Sem Make

# Ver logs
make logs                  # Com Make
docker-compose logs -f     # Sem Make (todos os serviços)
docker-compose logs backend    # Logs do backend
docker-compose logs frontend   # Logs do frontend
```

**Desenvolvimento Local:**
```bash
# Backend - verifique se o servidor está rodando:
# http://localhost:8000

# Frontend - verifique se o servidor está rodando:
# http://localhost:3000

# PostgreSQL - verifique o serviço:
# Windows: Services.msc → PostgreSQL
# Linux: sudo systemctl status postgresql
# Mac: brew services list
```

## 📚 Documentação

- [🚀 Guia Rápido de Início](./QUICK_START.md) - **Comece aqui se acabou de fazer fork!**
- [Documentação da API](./backend/AUTENTICACAO.md)
- [Guia de Testes](./backend/tests/README_TESTS.md)
- [Documentação de Deploy](./deploy/production/README.md)
- [Runbooks](./docs/runbooks/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Siga os padrões PSR-12 (PHP) e ESLint (TypeScript)
- Escreva testes para novas funcionalidades
- Mantenha a cobertura de testes acima de 70%
- Documente mudanças significativas

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Laura**
- **Kauan**
- **Leonardo**
- **Daniel**

## 🙏 Agradecimentos

- Professora Daniela
- Laravel Framework
- Next.js Team
- Comunidade Open Source

---

