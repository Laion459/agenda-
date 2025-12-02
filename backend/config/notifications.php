<?php

return [
    'templates' => [
        'appointment.created.doctor' => [
            'type' => 'REMINDER',
            'subject' => 'Nova consulta agendada - Confirmação necessária',
            'message' => 'Olá Dr(a). :doctor, uma nova consulta foi agendada com o paciente :patient para o dia :date às :time. Por favor, confirme ou cancele a consulta em até 24 horas através do sistema.',
        ],
        'appointment.created.patient' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Consulta agendada com sucesso',
            'message' => 'Olá :patient, sua consulta com Dr(a). :doctor foi agendada para o dia :date às :time. Aguarde a confirmação do médico. Você receberá uma notificação quando a consulta for confirmada.',
        ],
        'appointment.confirmed.patient' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Consulta confirmada pelo médico',
            'message' => 'Olá :patient, sua consulta com Dr(a). :doctor foi confirmada para o dia :date às :time. Por favor, compareça no horário agendado. Em caso de necessidade de remarcação, entre em contato com antecedência.',
        ],
        'appointment.confirmed.doctor' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Consulta confirmada',
            'message' => 'Dr(a). :doctor, você confirmou a consulta com :patient para o dia :date às :time. O paciente foi notificado.',
        ],
        'appointment.created.admin' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Nova consulta agendada no sistema',
            'message' => 'Uma nova consulta foi agendada: Paciente :patient com Dr(a). :doctor para o dia :date às :time. A consulta está aguardando confirmação do médico.',
        ],
        'appointment.confirmed.admin' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Consulta confirmada no sistema',
            'message' => 'A consulta do paciente :patient com Dr(a). :doctor para o dia :date às :time foi confirmada pelo médico.',
        ],
        'appointment.cancelled.admin' => [
            'type' => 'CANCELLATION',
            'subject' => 'Consulta cancelada no sistema',
            'message' => 'A consulta do paciente :patient com Dr(a). :doctor foi cancelada. Motivo: :reason.',
        ],
        'appointment.rescheduled.admin' => [
            'type' => 'RESCHEDULING',
            'subject' => 'Consulta remarcada no sistema',
            'message' => 'A consulta do paciente :patient com Dr(a). :doctor foi remarcada para o dia :date às :time.',
        ],
        'appointment.cancelled.patient' => [
            'type' => 'CANCELLATION',
            'subject' => 'Consulta cancelada',
            'message' => 'Olá :patient, sua consulta com Dr(a). :doctor foi cancelada. Motivo: :reason. Caso deseje reagendar, entre em contato conosco ou acesse o sistema para agendar uma nova consulta.',
        ],
        'appointment.cancelled.doctor' => [
            'type' => 'CANCELLATION',
            'subject' => 'Consulta cancelada',
            'message' => 'Dr(a). :doctor, a consulta com o paciente :patient foi cancelada. Motivo: :reason. O paciente foi notificado.',
        ],
        'appointment.rescheduled.patient' => [
            'type' => 'RESCHEDULING',
            'subject' => 'Consulta remarcada',
            'message' => 'Olá :patient, sua consulta com Dr(a). :doctor foi remarcada para o dia :date às :time. Por favor, confirme sua presença no novo horário.',
        ],
        'appointment.rescheduled.doctor' => [
            'type' => 'RESCHEDULING',
            'subject' => 'Consulta remarcada',
            'message' => 'Dr(a). :doctor, a consulta com o paciente :patient foi remarcada para o dia :date às :time. O paciente foi notificado sobre a alteração.',
        ],
        'appointment.reminder.patient' => [
            'type' => 'REMINDER',
            'subject' => 'Lembrete: Consulta agendada para amanhã',
            'message' => 'Olá :patient, este é um lembrete de que você tem uma consulta agendada com Dr(a). :doctor para amanhã, dia :date às :time. Por favor, confirme sua presença.',
        ],
        'appointment.reminder.doctor' => [
            'type' => 'REMINDER',
            'subject' => 'Lembrete: Consulta agendada para amanhã',
            'message' => 'Dr(a). :doctor, você tem uma consulta agendada com o paciente :patient para amanhã, dia :date às :time.',
        ],
        'patient.welcome' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Bem-vindo ao Agenda+',
            'message' => 'Olá :name, bem-vindo ao Agenda+! Suas credenciais de acesso foram criadas. E-mail: :email, Senha temporária: :password. Por favor, altere sua senha no primeiro acesso por questões de segurança.',
        ],
        'doctor.welcome' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Bem-vindo ao Agenda+',
            'message' => 'Olá Dr(a). :name, bem-vindo ao Agenda+! Suas credenciais de acesso foram criadas. E-mail: :email, Senha temporária: :password. Por favor, altere sua senha no primeiro acesso e configure sua agenda de disponibilidade.',
        ],
        'admin.welcome' => [
            'type' => 'CONFIRMATION',
            'subject' => 'Bem-vindo ao Agenda+',
            'message' => 'Olá :name, bem-vindo ao Agenda+ como administrador! Suas credenciais de acesso foram criadas. E-mail: :email, Senha temporária: :password. Por favor, altere sua senha no primeiro acesso.',
        ],
    ],
];
