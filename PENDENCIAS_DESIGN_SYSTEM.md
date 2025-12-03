# 📋 Pendências do Design System - Agenda+

**Data:** 2025-12-02  
**Última Atualização:** Após commit `48a2b6c`

---

## ✅ O que já foi feito

### Páginas Principais
- ✅ Home Page (Landing Page Premium)
- ✅ Login Pages (Patient, Doctor, Admin)
- ✅ Patient Dashboard
- ✅ Doctor Dashboard  
- ✅ Admin Dashboard
- ✅ Admin Reports
- ✅ Appointments Page
- ✅ Doctors List
- ✅ Notifications
- ✅ Profile

### Componentes
- ✅ Button (com ripple, loading, success/error states)
- ✅ Card (com variantes interactive, elevated)
- ✅ Input (com validação visual)
- ✅ Modal (com animações e dark mode)
- ✅ Skeleton (com shimmer)
- ✅ EmptyState (com variantes)
- ✅ ResponsiveTable
- ✅ AppHeader
- ✅ AppSidebar

---

## 🟡 O que falta fazer

### 1. Componentes Base (Melhorias Finais)

#### Button
- [ ] Variante "ghost" com hover mais sutil (já existe, pode melhorar)
- [ ] Variante "outline" com borda mais fina (já existe, pode melhorar)

#### StatusBadge
- [ ] Animação de pulse para status ativos
- [ ] Ícones para cada status
- [ ] Variante "dot" (apenas ponto colorido)

#### Tabs
- [ ] Indicador animado (underline)
- [ ] Suporte a ícones
- [ ] Variante "pills"

#### Tooltip
- [ ] Posicionamento automático melhorado
- [ ] Delay configurável (já existe, pode melhorar)

---

### 2. Páginas Pendentes

#### Autenticação
- [ ] **Register Pages** (Patient, Doctor)
  - Progress indicator (steps)
  - Validação em tempo real melhorada
  - Preview de senha
  - Organização do formulário em seções
  - Termos de uso checkbox

#### Admin
- [ ] **Admin - Users** (`app/(protected)/admin/users/page.tsx`)
  - Aplicar melhorias de design system
  - Gerenciamento de roles melhorado
  - Criação de usuário aprimorada

- [ ] **Admin - Health Insurances** (`app/(protected)/admin/health-insurances/page.tsx`)
  - Cards/tabela melhorados
  - Logo do convênio
  - Formulário aprimorado

- [ ] **Admin - Audit** (`app/(protected)/admin/audit/page.tsx`)
  - Timeline de eventos melhorada
  - Filtros avançados
  - Visualização de mudanças
  - Exportação

#### Doctor
- [ ] **Doctor - Schedules** (`app/(protected)/doctor/schedules/page.tsx`)
  - Visualização de agenda melhorada
  - Calendário visual
  - Criação/edição de horários aprimorada
  - Exceções de agenda
  - Feedback visual melhorado

#### Patient
- [ ] **Patient - Observations** (`app/(protected)/patient/observations/page.tsx`)
  - Cards de observações melhorados
  - Timeline visual
  - Filtros aprimorados
  - Visualização detalhada
  - Empty state melhorado

---

### 3. Melhorias de Componentes (Opcional)

#### Input
- [ ] Label flutuante (floating label)
- [ ] Suporte a prefix/suffix

#### EmptyState
- [ ] Ilustrações SVG customizadas
- [ ] Variantes por contexto (já existe, pode expandir)

#### Skeleton
- [ ] Variantes (text, circle, rectangle)

---

### 4. Micro-interações (Opcional)

- [ ] Animação de contagem nos números (count-up)
- [ ] Animação de confirmação (checkmark) - já existe no Button
- [ ] Melhorar animação de toast notifications
- [ ] Animação de progress (loading bars) - já existe

---

### 5. Responsividade (Parcial)

- [ ] Revisar todos os breakpoints (sm, md, lg, xl)
- [ ] Melhorar cards em mobile (stack vertical)
- [ ] Otimizar tabelas para mobile (cards) - já existe ResponsiveTable
- [ ] Melhorar navegação mobile
- [ ] Adicionar gestos touch (swipe)
- [ ] Melhorar formulários em mobile
- [ ] Otimizar modais para mobile (fullscreen)
- [ ] Melhorar botões em mobile (tamanho mínimo 44px)

---

### 6. Acessibilidade (Parcial)

- [ ] Adicionar aria-labels em todos os botões (já existe em muitos)
- [ ] Melhorar navegação por teclado
- [ ] Adicionar skip links
- [ ] Melhorar contraste de cores (WCAG AA) - já verificado parcialmente
- [ ] Adicionar focus visible em todos os elementos (já existe em muitos)
- [ ] Melhorar leitores de tela (semantic HTML)
- [ ] Adicionar alt text em todas as imagens
- [ ] Melhorar mensagens de erro (aria-live)
- [ ] Adicionar landmarks (nav, main, aside)
- [ ] Testar com screen readers

---

### 7. Performance (Pendente)

- [ ] Otimizar imagens (next/image) - já usado, pode melhorar
- [ ] Adicionar lazy loading
- [ ] Melhorar code splitting
- [ ] Otimizar animações (will-change)
- [ ] Adicionar debounce em buscas
- [ ] Melhorar loading states
- [ ] Otimizar bundle size
- [ ] Adicionar service worker (PWA)

---

## 📊 Resumo por Prioridade

### 🔴 Alta Prioridade
1. **Register Pages** - Primeira impressão importante
2. **Admin - Users** - Funcionalidade administrativa essencial
3. **Admin - Health Insurances** - Gestão importante
4. **Doctor - Schedules** - Funcionalidade crítica para médicos

### 🟡 Média Prioridade
5. **Admin - Audit** - Funcionalidade administrativa
6. **Patient - Observations** - Funcionalidade do paciente
7. **Responsividade** - Melhorar experiência mobile
8. **Acessibilidade** - WCAG AA compliance

### 🟢 Baixa Prioridade (Opcional)
9. **Melhorias de Componentes** - Refinamentos
10. **Micro-interações** - Polimento final
11. **Performance** - Otimizações avançadas

---

## 📝 Notas

- A maioria das melhorias principais já foi implementada
- As pendências são principalmente refinamentos e páginas secundárias
- O design system base está completo e funcionando
- A aplicação já está com visual profissional e moderno

---

**Última Atualização:** 2025-12-02

