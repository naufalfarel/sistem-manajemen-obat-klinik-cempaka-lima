<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login → { token, user }
     *
     * Bentuk response SENGAJA tidak dibungkus ApiResponse (tidak ada key
     * "data") karena authApi.login di api.ts membaca `token` dan `user`
     * langsung di root object.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::query()->where('email', $credentials['email'])->first();

        // Verifikasi manual lewat Hash::check(), BUKAN Auth::attempt(), karena
        // guard default aplikasi ini adalah 'sanctum' (RequestGuard) yang
        // tidak mendukung validateCredentials()/attempt() seperti guard
        // session biasa - API ini sepenuhnya stateless.
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang Anda masukkan salah.'],
            ]);
        }

        if ($user->status !== 'aktif') {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Silakan hubungi administrator.'],
            ]);
        }

        $user->forceFill(['last_login' => now()])->save();

        $token = $user->createToken('smo-frontend')->plainTextToken;

        AuditLogger::record('login', 'auth', "Login: {$user->nama} ({$user->username})", actor: $user);

        return response()->json([
            'token' => $token,
            'user' => new AuthUserResource($user),
        ]);
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        AuditLogger::record('logout', 'auth', "Logout: {$user->nama} ({$user->username})", actor: $user);

        $user->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    /** GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new AuthUserResource($request->user()),
        ]);
    }

    /**
     * POST /api/auth/refresh
     *
     * Mencabut token yang sedang dipakai lalu menerbitkan token baru
     * (revoke-and-reissue), bukan memperpanjang expiry token yang sama.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();

        $newToken = $user->createToken('smo-frontend')->plainTextToken;

        $currentToken?->delete();

        return response()->json(['token' => $newToken]);
    }
}
