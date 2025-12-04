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
        // Rejeita valores null, array, boolean, object
        if (!is_string($value) && !is_numeric($value)) {
            $fail('O campo :attribute deve ser uma string ou número.');
            return;
        }

        // Converte para string
        $cpfString = (string) $value;

        // Remove formatação para validar
        $cpfNumeros = preg_replace('/[^0-9]/', '', $cpfString);

        // Se após remover formatação não sobrar nada ou apenas espaços, é inválido
        if (strlen($cpfNumeros) === 0 || trim($cpfString) === '') {
            $fail('O campo :attribute não pode estar vazio.');
            return;
        }

        try {
            // Tenta criar o Value Object CPF, que já valida automaticamente
            new CPF($cpfString);
        } catch (ValidationException $e) {
            $messages = $e->errors();
            $fail($messages[$attribute][0] ?? 'O CPF informado é inválido.');
        }
    }
}

