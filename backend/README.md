# Agenda+ Backend API

API RESTful desenvolvida com Laravel 12 para o sistema de agendamento médico Agenda+.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Comandos Úteis](#comandos-úteis)
- [Testes](#testes)
- [Documentação da API](#documentação-da-api)
- [Arquitetura](#arquitetura)

## 🎯 Sobre o Projeto

Backend do sistema Agenda+ que fornece uma API RESTful completa para:

- ✅ Autenticação e autorização (Laravel Sanctum)
- ✅ Gestão de agendamentos médicos
- ✅ Gestão de pacientes, médicos e convênios
- ✅ Sistema de notificações
- ✅ Observações clínicas
- ✅ Relatórios administrativos (com exportação PDF)
- ✅ Logs de auditoria
- ✅ Conformidade LGPD (retenção e anonimização de dados)

## 🛠 Tecnologias

- **Laravel 12** - Framework PHP
- **PHP 8.2+** - Linguagem
- **PostgreSQL 16** - Banco de dados
- **Redis 7** - Cache e filas
- **Laravel Sanctum** - Autenticação API
- **Laravel Queue** - Processamento assíncrono
- **L5-Swagger** - Documentação da API
- **DomPDF** - Geração de relatórios PDF
- **Spatie Laravel Permission** - Controle de permissões

## 📦 Requisitos

- PHP 8.2 ou superior
- Composer
- PostgreSQL 16 ou superior
- Redis 7 ou superior
- Node.js 20+ (para assets do frontend)

## 🚀 Instalação

### Usando Docker (Recomendado)

Consulte o README principal do projeto na raiz para instruções completas com Docker.

### Desenvolvimento Local

1. **Clone o repositório e acesse o diretório:**
```bash
cd backend
```

2. **Instale as dependências:**
```bash
composer install
```

3. **Configure o ambiente:**
```bash
cp .env.example .env
php artisan key:generate
```

4. **Configure o banco de dados no `.env`:**
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=agenda
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

5. **Execute as migrações e seeders:**
```bash
php artisan migrate --seed
```

6. **Inicie o servidor:**
```bash
php artisan serve
```

A API estará disponível em `http://localhost:8000`

## 📁 Estrutura do Projeto

```
backend/
├── app/
│   ├── Application/          # Camada de Aplicação (Services)
│   │   ├── Appointments/      # Serviços de agendamento
│   │   ├── Auth/              # Serviços de autenticação
│   │   ├── Doctors/           # Serviços de médicos
│   │   ├── Notifications/     # Serviços de notificações
│   │   ├── Observations/      # Serviços de observações
│   │   ├── Patients/          # Serviços de pacientes
│   │   ├── Privacy/           # Serviços de privacidade (LGPD)
│   │   ├── Reports/           # Serviços de relatórios
│   │   ├── Schedules/         # Serviços de agendas
│   │   └── Users/             # Serviços de usuários
│   ├── Console/               # Comandos Artisan
│   │   └── Commands/          # Comandos customizados
│   ├── Domain/                # Camada de Domínio (DDD)
│   │   ├── Appointments/       # Workflows de status
│   │   └── Shared/            # Value Objects e Enums
│   ├── Http/
│   │   ├── Controllers/       # Controladores da API
│   │   ├── Middleware/        # Middlewares customizados
│   │   ├── Requests/          # Form Requests (validação)
│   │   └── Resources/         # API Resources (serialização)
│   ├── Infrastructure/       # Camada de Infraestrutura
│   │   └── Cache/             # Gerenciamento de cache
│   ├── Jobs/                  # Jobs assíncronos
│   ├── Mail/                  # Classes de e-mail
│   ├── Models/                # Modelos Eloquent
│   └── Policies/              # Policies de autorização
├── config/                    # Arquivos de configuração
├── database/
│   ├── factories/             # Factories para testes
│   ├── migrations/            # Migrações do banco
│   └── seeders/               # Seeders de dados
├── routes/
│   ├── api.php                # Rotas da API
│   └── console.php            # Rotas de comandos
└── tests/                     # Testes automatizados
    ├── Feature/               # Testes de integração
    └── Unit/                  # Testes unitários
```

## ⚙️ Configuração

### Variáveis de Ambiente Principais

```env
# Aplicação
APP_NAME="Agenda+"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Banco de Dados
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=agenda
DB_USERNAME=agenda
DB_PASSWORD=agenda

# Cache e Fila
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QUEUE_CONNECTION=redis

# E-mail
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
```

## 🎮 Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor
php artisan serve

# Executar fila de jobs
php artisan queue:work

# Executar tarefas agendadas
php artisan schedule:run

# Ver logs em tempo real
php artisan pail
```

### Banco de Dados

```bash
# Criar nova migração
php artisan make:migration create_nome_tabela

# Executar migrações
php artisan migrate

# Reverter última migração
php artisan migrate:rollback

# Executar seeders
php artisan db:seed

# Recriar banco (CUIDADO: apaga todos os dados)
php artisan migrate:fresh --seed
```

### Cache

```bash
# Limpar cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Otimizar para produção
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Comandos Customizados

```bash
# Enviar lembretes de consultas
php artisan appointments:send-reminders

# Limpar notificações antigas
php artisan notifications:cleanup

# Fazer backup do banco
php artisan backup:database

# Arquivar relatórios antigos
php artisan reports:archive

# Aplicar políticas de retenção de dados (LGPD)
php artisan privacy:enforce-retention
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
php artisan test

# Com cobertura
php artisan test --coverage

# Testes específicos
php artisan test --filter AppointmentTest

# Apenas testes unitários
php artisan test tests/Unit

# Apenas testes de integração
php artisan test tests/Feature
```

### Cobertura Mínima

- **70%** de cobertura de código
- Testes unitários para lógica de negócio
- Testes de integração para endpoints da API

Para mais detalhes, consulte [README_TESTS.md](./tests/README_TESTS.md)

## 📚 Documentação da API

### Swagger/OpenAPI

A documentação interativa da API está disponível em:

```
http://localhost:8000/api/documentation
```

### Autenticação

A API utiliza **Laravel Sanctum** para autenticação via tokens Bearer.

**Fluxo básico:**

1. Fazer login: `POST /api/auth/login`
2. Receber token
3. Incluir token no header: `Authorization: Bearer {token}`
4. Fazer requisições autenticadas

Para detalhes completos, consulte [AUTENTICACAO.md](./AUTENTICACAO.md)

### Endpoints Principais

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/appointments` - Listar consultas
- `POST /api/appointments` - Agendar consulta
- `GET /api/doctors` - Listar médicos
- `GET /api/health-insurances` - Listar convênios
- `GET /api/admin/reports` - Relatórios administrativos

Consulte a documentação Swagger para a lista completa de endpoints.

## 🏗 Arquitetura

O projeto segue uma **arquitetura em camadas** com princípios de **Domain-Driven Design (DDD)**:

### Camadas

1. **Application Layer** (`app/Application/`)
   - Services que contêm a lógica de negócio
   - Orquestram operações entre diferentes domínios

2. **Domain Layer** (`app/Domain/`)
   - Value Objects (CPF, Email, ScheduledDateTime)
   - Enums (AppointmentStatus, UserRole)
   - Workflows de negócio

3. **Infrastructure Layer** (`app/Infrastructure/`)
   - Implementações de infraestrutura (Cache, etc.)

4. **Presentation Layer** (`app/Http/`)
   - Controllers (recebem requisições)
   - Requests (validação)
   - Resources (serialização)

### Princípios Aplicados

- ✅ **Single Responsibility Principle (SRP)**
- ✅ **Dependency Injection**
- ✅ **Repository Pattern** (via Eloquent)
- ✅ **Service Layer Pattern**
- ✅ **Value Objects**
- ✅ **Policies** para autorização

## 🔒 Segurança

- ✅ Autenticação via Laravel Sanctum
- ✅ Middleware de segurança (SecurityHeaders, SanitizeInput)
- ✅ Validação robusta de entrada (Form Requests)
- ✅ Policies para autorização
- ✅ Logs de auditoria
- ✅ Proteção CSRF
- ✅ Sanitização de inputs

## 📊 Performance

- ✅ Cache Redis para consultas frequentes
- ✅ Eager loading para evitar N+1 queries
- ✅ Paginação em listagens
- ✅ Queue para processamento assíncrono
- ✅ Índices no banco de dados

## 📝 Padrões de Código

- Siga **PSR-12** para estilo de código
- Use **Laravel Pint** para formatação:
```bash
vendor/bin/pint
```

## 🤝 Contribuindo

Consulte o [CONTRIBUTING.md](../CONTRIBUTING.md) na raiz do projeto.

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- **Laura**
- **Kauan**
- **Leonardo**
- **Daniel**

---

**Desenvolvido com ❤️ pela equipe Agenda+**
