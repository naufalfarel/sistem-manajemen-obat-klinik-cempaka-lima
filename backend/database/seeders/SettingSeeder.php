<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Setting::defaults() as $category => $data) {
            Setting::query()->updateOrCreate(['category' => $category], ['data' => $data]);
        }
    }
}
