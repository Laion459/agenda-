<?php

use App\Domain\Shared\Enums\NotificationType;

return [
    'templates' => [
        'appointment.created.doctor' => [
            'type' => NotificationType::REMINDER,
            'subject' => 'Nova consulta agendada',
            'message' => 'Uma nova consulta com :patient foi agendada para :date às :time.',
        ],
        'appointment.created.patient' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Consulta registrada',
            'message' => 'Sua consulta com :doctor foi registrada para :date às :time.',
        ],
        'appointment.confirmed.patient' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Consulta confirmada',
            'message' => 'Sua consulta com :doctor foi confirmada para :date às :time.',
        ],
        'appointment.cancelled.patient' => [
            'type' => NotificationType::CANCELLATION,
            'subject' => 'Consulta cancelada',
            'message' => 'Sua consulta com :doctor foi cancelada. Motivo: :reason.',
        ],
        'appointment.rescheduled.patient' => [
            'type' => NotificationType::RESCHEDULING,
            'subject' => 'Consulta remarcada',
            'message' => 'Sua consulta com :doctor foi remarcada para :date às :time.',
        ],
        'appointment.rescheduled.doctor' => [
            'type' => NotificationType::RESCHEDULING,
            'subject' => 'Paciente solicitou remarcação',
            'message' => 'A consulta com :patient foi remarcada para :date às :time.',
        ],
        'patient.welcome' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Bem-vindo ao Agenda+',
            'message' => 'Olá :name, suas credenciais de acesso foram criadas. E-mail: :email, Senha: :password. Por favor, altere sua senha no primeiro acesso.',
        ],
    ],
];


