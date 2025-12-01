# Agenda+ Frontend

Interface web moderna desenvolvida com Next.js 16 e React 19 para o sistema de agendamento médico Agenda+.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Testes](#testes)
- [Componentes](#componentes)
- [Arquitetura](#arquitetura)

## 🎯 Sobre o Projeto

Frontend do sistema Agenda+ que fornece uma interface moderna e responsiva para:

- ✅ Autenticação de pacientes, médicos e administradores
- ✅ Agendamento e gestão de consultas
- ✅ Dashboard para diferentes perfis de usuário
- ✅ Gestão de agendas médicas
- ✅ Observações clínicas
- ✅ Sistema de notificações
- ✅ Relatórios administrativos
- ✅ Gestão de pacientes, médicos e convênios

## 🛠 Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Axios** - Cliente HTTP
- **React Hook Form** - Formulários
- **Zod** - Validação de formulários
- **Zustand** - Gerenciamento de estado
- **Recharts** - Gráficos e visualizações
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações toast

## 📦 Requisitos

- Node.js 20 ou superior
- npm, yarn, pnpm ou bun

## 🚀 Instalação

### Usando Docker (Recomendado)

Consulte o README principal do projeto na raiz para instruções completas com Docker.

### Desenvolvimento Local

1. **Clone o repositório e acesse o diretório:**
```bash
cd frontend
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o ambiente:**
```bash
cp .env.example .env.local
```

Edite o `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
frontend/
├── app/                        # App Router do Next.js
│   ├── (auth)/                 # Rotas de autenticação (grupo)
│   │   ├── login/             # Páginas de login
│   │   └── register/           # Páginas de registro
│   ├── (protected)/            # Rotas protegidas (grupo)
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── appointments/       # Gestão de consultas
│   │   ├── doctors/            # Listagem de médicos
│   │   ├── doctor/             # Área do médico
│   │   ├── patient/            # Área do paciente
│   │   ├── admin/              # Área administrativa
│   │   ├── notifications/      # Notificações
│   │   └── profile/            # Perfil do usuário
│   └── layout.tsx              # Layout raiz
├── components/                  # Componentes React
│   ├── layout/                  # Componentes de layout
│   │   ├── AppHeader.tsx       # Cabeçalho
│   │   ├── AppSidebar.tsx      # Menu lateral
│   │   └── MobileMenu.tsx      # Menu mobile
│   ├── providers/               # Context Providers
│   │   ├── AuthProvider.tsx    # Context de autenticação
│   │   └── ThemeProvider.tsx   # Tema (dark/light)
│   └── ui/                      # Componentes UI reutilizáveis
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── constants/                   # Constantes
│   ├── appointments.ts         # Constantes de consultas
│   ├── colors.ts               # Cores do sistema
│   └── design-tokens.ts       # Tokens de design
├── hooks/                       # Custom Hooks
│   ├── useAppointments.ts      # Hook para consultas
│   ├── useAsync.ts             # Hook para operações assíncronas
│   └── use-form-validation.ts  # Validação de formulários
├── lib/                         # Utilitários
│   ├── api.ts                  # Cliente Axios configurado
│   ├── auth-storage.ts         # Gerenciamento de tokens
│   ├── error-handler.ts        # Tratamento de erros
│   └── date-utils.ts           # Utilitários de data
├── services/                    # Serviços de API
│   ├── auth-service.ts          # Autenticação
│   ├── appointment-service.ts  # Consultas
│   ├── doctor-service.ts        # Médicos
│   └── ...
├── store/                       # Estado global (Zustand)
│   ├── auth-store.ts           # Estado de autenticação
│   └── sidebar-store.ts        # Estado do menu
├── types/                       # Tipos TypeScript
│   └── index.ts                # Tipos compartilhados
└── public/                      # Arquivos estáticos
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do frontend:

```env
# URL da API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# URL base do frontend (usado para metadados)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Nota:** Variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente.

### Configuração do Next.js

O arquivo `next.config.ts` contém configurações do Next.js, incluindo:
- Transpilação de pacotes externos (date-fns, recharts)

## 🎮 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm run start
```

### Qualidade de Código

```bash
# Verificar lint
npm run lint

# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Com cobertura
npm run test:coverage

# Modo watch (desenvolvimento)
npm run test:watch
```

### Estrutura de Testes

- Testes unitários para componentes UI
- Testes de integração para serviços
- Testes de hooks customizados

**Cobertura mínima:** 70% (meta)

## 🎨 Componentes

### Componentes UI

O projeto utiliza componentes reutilizáveis baseados em Radix UI:

- **Button** - Botões com variantes
- **Card** - Containers para conteúdo
- **Input** - Campos de entrada
- **Modal** - Modais e diálogos
- **Table** - Tabelas responsivas
- **StatusBadge** - Badges de status
- E mais...

Para detalhes completos, consulte [docs/COMPONENT_GUIDE.md](./docs/COMPONENT_GUIDE.md)

### Exemplo de Uso

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function MyPage() {
  return (
    <Card>
      <CardHeader>
        <h2>Título</h2>
      </CardHeader>
      <CardContent>
        <Button variant="primary">Salvar</Button>
      </CardContent>
    </Card>
  );
}
```

## 🏗 Arquitetura

### Padrões Utilizados

- ✅ **Component-Based Architecture** - Componentes reutilizáveis
- ✅ **Custom Hooks** - Lógica reutilizável
- ✅ **Service Layer** - Separação de lógica de API
- ✅ **State Management** - Zustand para estado global
- ✅ **Type Safety** - TypeScript em todo o projeto

### Fluxo de Dados

```
Página → Hook → Service → API (Axios) → Backend
         ↓
      Store (Zustand)
```

### Autenticação

O sistema utiliza:
- **AuthProvider** - Context para estado de autenticação
- **auth-store** - Zustand store para gerenciamento de token
- **auth-storage** - Persistência de token no localStorage
- **Middleware** - Proteção de rotas

## 🎨 Estilização

### Tailwind CSS

O projeto utiliza Tailwind CSS para estilização:

- **Design Tokens** - Cores, espaçamentos e tipografia definidos em `constants/`
- **Componentes UI** - Baseados em Radix UI com Tailwind
- **Responsividade** - Mobile-first approach

### Tema

Suporte a tema claro/escuro via `ThemeProvider`.

## 📱 Responsividade

O projeto é totalmente responsivo:
- Mobile-first design
- Breakpoints do Tailwind
- Menu mobile adaptativo
- Tabelas responsivas

## 🔒 Segurança

- ✅ Tokens armazenados de forma segura
- ✅ Validação de formulários no cliente
- ✅ Sanitização de inputs
- ✅ Proteção de rotas autenticadas
- ✅ Tratamento de erros de API

## 🚀 Performance

- ✅ **Next.js App Router** - Roteamento otimizado
- ✅ **Code Splitting** - Carregamento sob demanda
- ✅ **Image Optimization** - Otimização automática de imagens
- ✅ **Lazy Loading** - Componentes carregados sob demanda
- ✅ **Caching** - Cache de requisições da API

## 📝 Padrões de Código

- Siga as regras do **ESLint**
- Use **TypeScript** para type safety
- Componentes funcionais com hooks
- Nomes descritivos e em inglês
- Comentários em português quando necessário

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
