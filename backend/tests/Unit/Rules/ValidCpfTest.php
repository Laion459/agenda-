<?php

namespace Tests\Unit\Rules;

use App\Rules\ValidCpf;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ValidCpfTest extends TestCase
{
    /**
     * Testa CPFs válidos com formatação.
     */
    public function test_aceita_cpf_valido_com_formatacao(): void
    {
        $cpfsValidos = [
            '123.456.789-09',
            '111.444.777-35',
            '000.000.001-91',
        ];

        foreach ($cpfsValidos as $cpf) {
            $validator = Validator::make(
                ['cpf' => $cpf],
                ['cpf' => [new ValidCpf()]]
            );

            $this->assertTrue(
                $validator->passes(),
                "CPF válido com formatação foi rejeitado: {$cpf}"
            );
        }
    }

    /**
     * Testa CPFs válidos sem formatação.
     */
    public function test_aceita_cpf_valido_sem_formatacao(): void
    {
        $cpfsValidos = [
            '12345678909',
            '11144477735',
            '00000000191',
        ];

        foreach ($cpfsValidos as $cpf) {
            $validator = Validator::make(
                ['cpf' => $cpf],
                ['cpf' => [new ValidCpf()]]
            );

            $this->assertTrue(
                $validator->passes(),
                "CPF válido sem formatação foi rejeitado: {$cpf}"
            );
        }
    }

    /**
     * Testa CPFs inválidos (dígitos verificadores incorretos).
     */
    public function test_rejeita_cpf_com_digitos_verificadores_invalidos(): void
    {
        $cpfsInvalidos = [
            '123.456.789-00',
            '111.444.777-00',
            '000.000.001-00',
            '12345678900',
        ];

        foreach ($cpfsInvalidos as $cpf) {
            $validator = Validator::make(
                ['cpf' => $cpf],
                ['cpf' => [new ValidCpf()]]
            );

            $this->assertTrue(
                $validator->fails(),
                "CPF inválido foi aceito: {$cpf}"
            );

            $this->assertArrayHasKey('cpf', $validator->errors()->toArray());
        }
    }

    /**
     * Testa CPFs com todos os dígitos iguais (inválidos).
     */
    public function test_rejeita_cpf_com_todos_digitos_iguais(): void
    {
        $cpfsInvalidos = [
            '111.111.111-11',
            '222.222.222-22',
            '000.000.000-00',
            '11111111111',
            '22222222222',
        ];

        foreach ($cpfsInvalidos as $cpf) {
            $validator = Validator::make(
                ['cpf' => $cpf],
                ['cpf' => [new ValidCpf()]]
            );

            $this->assertTrue(
                $validator->fails(),
                "CPF com todos dígitos iguais foi aceito: {$cpf}"
            );
        }
    }

    /**
     * Testa CPFs com quantidade incorreta de dígitos.
     */
    public function test_rejeita_cpf_com_quantidade_incorreta_de_digitos(): void
    {
        $cpfsInvalidos = [
            '123.456.789-0',   // 10 dígitos
            '123.456.789-000', // 12 dígitos
            '1234567890',      // 10 dígitos
            '123456789012',    // 12 dígitos
            '123',             // 3 dígitos
        ];

        foreach ($cpfsInvalidos as $cpf) {
            $validator = Validator::make(
                ['cpf' => $cpf],
                ['cpf' => [new ValidCpf()]]
            );

            $this->assertTrue(
                $validator->fails(),
                "CPF com quantidade incorreta de dígitos foi aceito: {$cpf}"
            );
        }
    }

    /**
     * Testa valores não string (deve falhar).
     */
    public function test_rejeita_valores_nao_string(): void
    {
        $valoresInvalidos = [
            12345678909,
            null,
            [],
            true,
        ];

        foreach ($valoresInvalidos as $valor) {
            $validator = Validator::make(
                ['cpf' => $valor],
                ['cpf' => [new ValidCpf()]]
            );

            // Valores não string devem falhar na validação básica ou na regra
            $this->assertTrue(
                $validator->fails(),
                "Valor não string foi aceito: " . gettype($valor)
            );
        }
    }

    /**
     * Testa CPF vazio.
     */
    public function test_rejeita_cpf_vazio(): void
    {
        $validator = Validator::make(
            ['cpf' => ''],
            ['cpf' => [new ValidCpf()]]
        );

        $this->assertTrue($validator->fails());
    }
}

