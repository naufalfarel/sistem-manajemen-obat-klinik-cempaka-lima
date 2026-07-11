<?php

namespace App\Http\Requests\Pengguna;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
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
            'password' => ['required', 'string', 'confirmed', Password::min($min)],
        ];
    }
}
