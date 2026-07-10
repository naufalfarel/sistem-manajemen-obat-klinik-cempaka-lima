<?php

namespace App\Http\Requests\ObatKeluar;

use Illuminate\Foundation\Http\FormRequest;

class ReturVoidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'alasan' => ['required', 'string', 'max:500'],
        ];
    }
}
