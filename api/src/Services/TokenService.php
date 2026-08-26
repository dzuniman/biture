<?php

declare(strict_types=1);

final class TokenService
{
    public static function issue(array $user): string
    {
        $header = self::encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $payload = self::encode([
            'sub' => $user['id'],
            'name' => $user['username'],
            'role' => $user['role'],
            'exp' => time() + (int)(getenv('JWT_EXPIRE_MINUTES') ?: 60) * 60,
        ]);
        $secret = getenv('JWT_KEY') ?: 'ThisIsASecretKeyForDevOnlyChangeMe';
        $signature = self::encode(hash_hmac('sha256', "$header.$payload", $secret, true));
        return "$header.$payload.$signature";
    }

    public static function userFromRequest(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s+(.+)/i', $header, $match)) return null;
        $parts = explode('.', $match[1]);
        if (count($parts) !== 3) return null;
        $encoded = strtr($parts[1], '-_', '+/');
        $payload = json_decode(base64_decode($encoded . str_repeat('=', (4 - strlen($encoded) % 4) % 4)), true);
        return is_array($payload) && (($payload['exp'] ?? 0) > time()) ? $payload : null;
    }

    private static function encode(mixed $value): string
    {
        $raw = is_string($value) ? $value : json_encode($value);
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }
}
