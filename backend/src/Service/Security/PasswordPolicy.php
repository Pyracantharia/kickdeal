<?php

namespace App\Service\Security;

final class PasswordPolicy
{
    public const string MESSAGE = 'Le mot de passe doit contenir au moins 12 caracteres, une minuscule, une majuscule, un chiffre et un caractere special.';

    /**
     * @return array<int, string>
     */
    public function validate(?string $password): array
    {
        if (!is_string($password) || '' === $password) {
            return ['Le mot de passe est requis.'];
        }

        $errors = [];

        if (strlen($password) < 12) {
            $errors[] = '12 caracteres minimum';
        }

        if (1 !== preg_match('/[a-z]/', $password)) {
            $errors[] = 'une minuscule';
        }

        if (1 !== preg_match('/[A-Z]/', $password)) {
            $errors[] = 'une majuscule';
        }

        if (1 !== preg_match('/\d/', $password)) {
            $errors[] = 'un chiffre';
        }

        if (1 !== preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors[] = 'un caractere special';
        }

        return $errors;
    }

    public function isValid(?string $password): bool
    {
        return [] === $this->validate($password);
    }
}
