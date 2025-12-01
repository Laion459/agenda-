# Agenda+ - Sistema de Agendamento Médico

Sistema completo de agendamento médico desenvolvido com Laravel (backend) e Next.js (frontend), seguindo as melhores práticas de desenvolvimento de software.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
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

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- PHP 8.2+ (para desenvolvimento local)
- Composer (para desenvolvimento local)

## 🚀 Instalação

### Método 1: Usando Makefile (Recomendado - Mais Simples)

O projeto inclui um `Makefile` que automatiza todo o processo de instalação:

1. Clone o repositório:
```bash
git clone <repository-url>
cd "app agenda+"
```

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

### Desenvolvimento Local

#### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

#### Frontend

**Pré-requisitos:** Certifique-se de que o backend está rodando primeiro.

```bash
cd frontend
npm install

# Crie o arquivo .env.local se não existir
cp .env.example .env.local  # Se o arquivo .env.example existir
# Ou crie manualmente com:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# NEXT_PUBLIC_BASE_URL=http://localhost:3000

npm run dev
```

**Importante:** Para desenvolvimento local sem Docker, você precisará ter PostgreSQL e Redis rodando localmente, ou ajustar as configurações do backend para usar SQLite (não recomendado para produção).

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

1. Acesse `/login`
2. Use as credenciais do seeder ou crie uma nova conta
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

#### Erro: "Cannot find module" ou dependências não instaladas
```bash
# Reinstale as dependências
make down
make install
make up
```

#### Erro: "Connection refused" ao conectar ao banco
- Verifique se o container do banco está rodando: `docker-compose ps`
- Verifique as variáveis de ambiente no `backend/.env`
- Certifique-se de que `DB_HOST=db` (nome do serviço no docker-compose)

#### Erro: "APP_KEY not set" no Laravel
```bash
docker-compose exec backend php artisan key:generate
# Ou usando Makefile:
make key
```

#### Frontend não conecta ao backend
- Verifique se `NEXT_PUBLIC_API_URL` está correto
- No Docker: deve ser `http://localhost:8000/api`
- Verifique se o backend está rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs backend`

#### Erro ao executar migrações
```bash
# Recrie o banco de dados
make down
docker volume rm agenda-plus_db-data  # Remove o volume do banco
make install
```

#### Portas já em uso
Se as portas 3000, 8000, 5432 ou 6379 estiverem em uso:
- Pare os serviços que estão usando essas portas
- Ou altere as portas no `docker-compose.yml`

### Verificando o Status dos Serviços

```bash
# Ver status dos containers
make ps
# Ou
docker-compose ps

# Ver logs
make logs
# Ou logs de um serviço específico
docker-compose logs backend
docker-compose logs frontend
```

## 📚 Documentação

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

