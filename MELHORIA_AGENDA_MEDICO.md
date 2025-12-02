# 📅 Proposta de Melhoria: Sistema de Agenda do Médico

## 🔍 Problema Identificado

Atualmente, o sistema permite que o médico configure:
- ✅ Dias da semana (segunda a sexta)
- ✅ Horários de início e fim
- ✅ Duração dos slots

**Mas falta:**
- ❌ Bloquear datas específicas (feriados, férias, ausências)
- ❌ Ajustar horários em datas específicas
- ❌ Definir períodos de disponibilidade

## 💡 Solução Profissional Proposta

### Abordagem Híbrida (Recomendada)

**1. Templates de Horários (Já existe)**
- Médico define: "Segunda a Sexta, 9h às 17h"
- Sistema aplica automaticamente para todas as datas futuras

**2. Exceções e Bloqueios (Novo)**
- Médico pode bloquear datas específicas
- Médico pode ajustar horários em datas específicas
- Médico pode definir períodos de disponibilidade

### Estrutura de Dados Proposta

```sql
-- Tabela para exceções/bloqueios de agenda
CREATE TABLE schedule_exceptions (
    id BIGINT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    date DATE NOT NULL,
    type ENUM('BLOCKED', 'CUSTOM_HOURS', 'UNAVAILABLE') NOT NULL,
    start_time TIME NULL, -- Para CUSTOM_HOURS
    end_time TIME NULL,   -- Para CUSTOM_HOURS
    reason VARCHAR(255) NULL, -- Motivo do bloqueio
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(doctor_id, date)
);

-- Tabela para períodos de disponibilidade (opcional)
CREATE TABLE availability_periods (
    id BIGINT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Fluxo de Funcionamento

1. **Template de Horários (Atual)**
   - Médico configura: "Segunda a Sexta, 9h-17h"
   - Sistema aplica para todas as datas futuras

2. **Exceções (Novo)**
   - Médico bloqueia: "25/12/2025 - Feriado"
   - Médico ajusta: "24/12/2025 - 9h-12h (meio expediente)"
   - Sistema respeita as exceções ao calcular disponibilidade

3. **Períodos de Disponibilidade (Opcional)**
   - Médico define: "Disponível de 01/01/2025 a 31/03/2025"
   - Sistema só mostra datas dentro desse período

### Interface do Usuário Proposta

**Área do Médico - Gestão de Agenda:**

1. **Aba "Horários Padrão"** (já existe)
   - Configurar dias da semana e horários

2. **Aba "Exceções"** (nova)
   - Calendário visual para bloquear/ajustar datas
   - Botão "Bloquear Data" → seleciona data → motivo
   - Botão "Ajustar Horário" → seleciona data → define horários específicos
   - Lista de exceções cadastradas com opção de remover

3. **Aba "Períodos"** (opcional)
   - Definir período de disponibilidade
   - Ex: "Disponível nos próximos 3 meses"

### Cálculo de Disponibilidade Atualizado

```php
// Pseudocódigo
function getAvailableDates($doctor, $month) {
    $dates = [];
    
    // 1. Pega templates de horários (dias da semana)
    $schedules = $doctor->schedules;
    
    // 2. Gera todas as datas do mês que correspondem aos templates
    foreach ($monthDates as $date) {
        $dayOfWeek = $date->dayOfWeekIso;
        
        // 3. Verifica se há template para este dia
        if ($schedules->has($dayOfWeek)) {
            // 4. Verifica se há exceção para esta data
            $exception = ScheduleException::where('doctor_id', $doctor->id)
                ->where('date', $date)
                ->first();
            
            if ($exception) {
                if ($exception->type === 'BLOCKED') {
                    continue; // Pula esta data
                } elseif ($exception->type === 'CUSTOM_HOURS') {
                    // Usa horários customizados
                    $startTime = $exception->start_time;
                    $endTime = $exception->end_time;
                }
            } else {
                // Usa horários do template
                $startTime = $schedule->start_time;
                $endTime = $schedule->end_time;
            }
            
            // 5. Verifica se está dentro do período de disponibilidade
            if (!isWithinAvailabilityPeriod($doctor, $date)) {
                continue;
            }
            
            // 6. Verifica se há slots disponíveis
            if (hasAvailableSlots($doctor, $date, $startTime, $endTime)) {
                $dates[] = $date;
            }
        }
    }
    
    return $dates;
}
```

## 🎯 Benefícios

1. **Flexibilidade**: Médico pode ajustar agenda conforme necessário
2. **Simplicidade**: Templates automáticos + exceções quando necessário
3. **Profissionalismo**: Alinhado com sistemas de mercado (Calendly, Doodle, etc.)
4. **Escalabilidade**: Fácil adicionar novas funcionalidades

## 📋 Implementação Sugerida

### Fase 1: Exceções Básicas (Bloqueios)
- Criar tabela `schedule_exceptions`
- Endpoint para bloquear/desbloquear datas
- Atualizar cálculo de disponibilidade

### Fase 2: Horários Customizados
- Permitir ajustar horários em datas específicas
- Interface para definir horários customizados

### Fase 3: Períodos de Disponibilidade (Opcional)
- Criar tabela `availability_periods`
- Interface para definir períodos
- Atualizar cálculo de disponibilidade

## 🔄 Alternativa Mais Simples (MVP)

Se quiser uma solução mais rápida para MVP:

1. **Adicionar campo `blocked_dates` JSON na tabela `schedules`**
   ```php
   // No modelo Schedule
   protected $casts = [
       'blocked_dates' => 'array', // ['2025-12-25', '2026-01-01']
   ];
   ```

2. **Interface simples**: Lista de datas bloqueadas
3. **Atualizar cálculo**: Verificar se data está em `blocked_dates`

**Vantagens:**
- Implementação rápida
- Sem nova tabela
- Funciona para casos básicos

**Desvantagens:**
- Menos flexível
- Não permite horários customizados por data
- JSON pode ficar grande com muitas datas

## 📊 Comparação com Mercado

| Sistema | Templates | Exceções | Períodos |
|---------|-----------|----------|----------|
| **Calendly** | ✅ | ✅ | ✅ |
| **Doodle** | ✅ | ✅ | ❌ |
| **Google Calendar** | ✅ | ✅ | ✅ |
| **Proposta** | ✅ | ✅ | ✅ (opcional) |

## ✅ Recomendação Final

**Para MVP:** Implementar Fase 1 (Exceções Básicas) com tabela `schedule_exceptions`

**Para Produção:** Implementar todas as fases para ter um sistema completo e profissional.

---

**Próximos Passos:**
1. Decidir qual abordagem seguir (Híbrida completa ou MVP)
2. Criar migration e modelo
3. Implementar endpoints
4. Criar interface no frontend
5. Atualizar cálculo de disponibilidade

