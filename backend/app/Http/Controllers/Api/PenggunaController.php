<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pengguna\ResetPasswordRequest;
use App\Http\Requests\Pengguna\StorePenggunaRequest;
use App\Http\Requests\Pengguna\UpdatePenggunaRequest;
use App\Http\Resources\PenggunaResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class PenggunaController extends Controller
{
    /** GET /api/roles — daftar role yang tersedia (diambil dari database) */
    public function roles(): JsonResponse
    {
        $roles = \Illuminate\Support\Facades\DB::table('roles')
            ->select(['slug as value', 'name as label'])
            ->get();

        return response()->json(['data' => $roles]);
    }

    /** GET /api/pengguna */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $query->when($request->filled('role'), fn ($q) => $q->where('role', $request->string('role')));
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));

        $query->orderBy('nama');

        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return PenggunaResource::collection($query->paginate($perPage))->response();
    }

    /** GET /api/pengguna/{pengguna} */
    public function show(User $pengguna): JsonResponse
    {
        $this->authorize('view', $pengguna);

        return response()->json(['data' => new PenggunaResource($pengguna)]);
    }

    /** POST /api/pengguna */
    public function store(StorePenggunaRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $data['status'] ??= 'aktif';

        // Handle foto upload
        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('pengguna', 'public');
        } else {
            unset($data['foto']);
        }

        $pengguna = User::create($data);

        return response()->json([
            'data' => new PenggunaResource($pengguna),
            'message' => 'Pengguna berhasil ditambahkan.',
        ], 201);
    }

    /** PUT /api/pengguna/{pengguna} */
    public function update(UpdatePenggunaRequest $request, User $pengguna): JsonResponse
    {
        $this->authorize('update', $pengguna);

        $data = $request->validated();

        // Handle foto upload — hapus foto lama jika diganti
        if ($request->hasFile('foto')) {
            if ($pengguna->foto) {
                Storage::disk('public')->delete($pengguna->foto);
            }
            $data['foto'] = $request->file('foto')->store('pengguna', 'public');
        } else {
            unset($data['foto']);
        }

        $pengguna->update($data);

        return response()->json([
            'data' => new PenggunaResource($pengguna),
            'message' => 'Data pengguna berhasil diperbarui.',
        ]);
    }

    /** PATCH /api/pengguna/{pengguna}/reset-password */
    public function resetPassword(ResetPasswordRequest $request, User $pengguna): JsonResponse
    {
        $this->authorize('resetPassword', $pengguna);

        $pengguna->update(['password' => Hash::make($request->validated('password'))]);

        // Semua token akses lama dicabut supaya sesi yang sedang berjalan
        // dengan password lama tidak bisa dipakai lagi setelah reset.
        $pengguna->tokens()->delete();

        return response()->json(null, 204);
    }

    /** PATCH /api/pengguna/{pengguna}/toggle-status */
    public function toggleStatus(User $pengguna): JsonResponse
    {
        $this->authorize('toggleStatus', $pengguna);

        $pengguna->update(['status' => $pengguna->status === 'aktif' ? 'nonaktif' : 'aktif']);

        return response()->json([
            'data' => new PenggunaResource($pengguna),
            'message' => 'Status pengguna berhasil diperbarui.',
        ]);
    }

    /** DELETE /api/pengguna/{pengguna} */
    public function destroy(User $pengguna): JsonResponse
    {
        $this->authorize('delete', $pengguna);

        // Hapus file foto jika ada
        if ($pengguna->foto) {
            Storage::disk('public')->delete($pengguna->foto);
        }

        $pengguna->delete();

        return response()->json(null, 204);
    }
}
