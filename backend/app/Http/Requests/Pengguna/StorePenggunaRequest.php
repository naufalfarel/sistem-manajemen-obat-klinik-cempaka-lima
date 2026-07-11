<?php

namespace App\Http\Requests\Pengguna;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StorePenggunaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $settings = \App\Models\Setting::query()->where('category', 'keamanan')->value('data');
        $min = (int) ($settings['panjang_password_minimum'] ?? 8);

        return [
            'nama' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min($min)],
            'nip' => ['nullable', 'string', 'max:50'],
            'foto' => ['nullable', 'image', 'max:2048'],
            'role' => ['required', Rule::exists('roles', 'slug')],
            'status' => ['sometimes', Rule::in(['aktif', 'nonaktif'])],
        ];
    }

    public function messages(): array
    {
        return [
            'role.in' => 'Role harus salah satu dari: '.implode(', ', User::ROLES).'.',
        ];
    }
}
