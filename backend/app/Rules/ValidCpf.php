<?php

namespace App\Rules;

use App\Domain\Shared\ValueObjects\CPF;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\ValidationException;

/**
 * Regra de validação para CPF brasileiro.
 * 
 * Valida:
 * - Formato (aceita com ou sem formatação: 12345678901 ou 123.456.789-00)
 * - Quantidade de dígitos (11 dígitos numéricos)
 * - Dígitos verificadores (algoritmo oficial)
 * - Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
 */
class ValidCpf implements ValidationRule
{
    /**
     * Executa a validação.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @param  \Closure(string, ?string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     * @return void
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value) && !is_numeric($value)) {
            $fail('O campo :attribute deve ser uma string ou número.');
            return;
        }

        try {
            // Tenta criar o Value Object CPF, que já valida automaticamente
            new CPF((string) $value);
        } catch (ValidationException $e) {
            $messages = $e->errors();
            $fail($messages[$attribute][0] ?? 'O CPF informado é inválido.');
        }
    }
}

