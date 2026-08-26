<?php

declare(strict_types=1);

require_once __DIR__ . '/../Services/TokenService.php';

final class AuthController
{
    public function login(PDO $pdo, array $credentials): array
    {
        $username = trim((string)($credentials['username'] ?? ''));
        $password = (string)($credentials['password'] ?? '');
        if ($username === '' || $password === '') {
            throw new InvalidArgumentException('Username and password are required');
        }

        $query = $pdo->prepare('SELECT * FROM users WHERE username = ?');
        $query->execute([$username]);
        $user = $query->fetch(PDO::FETCH_ASSOC);
        if (!$user || !self::verifyPassword($password, $user['password_hash'] ?? $user['PasswordHash'] ?? '')) {
            throw new RuntimeException('Invalid username or password');
        }

        return [
            'token' => TokenService::issue($user),
            'user' => ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']],
        ];
    }

    private static function verifyPassword(string $password, string $hash): bool
    {
        if (($info = password_get_info($hash))['algo'] ?? 0) return password_verify($password, $hash);
        $parts = explode('.', $hash);
        if (count($parts) !== 3) return false;
        [$iterations, $salt, $stored] = $parts;
        $computed = hash_pbkdf2('sha256', $password, base64_decode($salt), (int)$iterations, 32, true);
        return hash_equals(base64_decode($stored), $computed);
    }
}
