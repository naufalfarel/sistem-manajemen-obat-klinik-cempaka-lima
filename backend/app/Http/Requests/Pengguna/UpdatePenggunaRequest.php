<?php

namespace App\Http\Requests\Pengguna;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePenggunaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $userId = $this->route('pengguna');

        return [
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => ['sometimes', 'required', 'string', 'max:100', 'alpha_dash', Rule::unique('users', 'username')->ignore($userId)],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'nip' => ['nullable', 'string', 'max:50'],
            'foto' => ['nullable', 'image', 'max:2048'],
            'role' => ['sometimes', 'required', Rule::exists('roles', 'slug')],
            'status' => ['sometimes', 'required', Rule::in(['aktif', 'nonaktif'])],
            // Perubahan password TIDAK lewat endpoint ini - gunakan
            // PATCH /pengguna/{id}/reset-password agar konsisten & ter-audit
            // dengan deskripsi yang jelas ("reset password" vs "update data").
        ];
    }
}
