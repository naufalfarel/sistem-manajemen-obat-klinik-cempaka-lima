<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kategori\StoreKategoriRequest;
use App\Http\Requests\Kategori\UpdateKategoriRequest;
use App\Http\Resources\KategoriObatResource;
use App\Models\KategoriObat;
use Illuminate\Http\JsonResponse;

class KategoriObatController extends Controller
{
    /**
     * GET /api/kategori
     *
     * Tidak paginasi - sesuai api.ts (`kategoriApi.list` mengembalikan
     * `ApiResponse<KategoriObat[]>`, bukan `Paginated<KategoriObat>`).
     */
    public function index(): JsonResponse
    {
        $kategori = KategoriObat::query()->withCount('obat')->orderBy('nama')->get();

        return response()->json(['data' => KategoriObatResource::collection($kategori)]);
    }

    /** GET /api/kategori/{kategori} */
    public function show(KategoriObat $kategori): JsonResponse
    {
        $kategori->loadCount('obat');

        return response()->json(['data' => new KategoriObatResource($kategori)]);
    }

    /** POST /api/kategori */
    public function store(StoreKategoriRequest $request): JsonResponse
    {
        $kategori = KategoriObat::create($request->validated());
        $kategori->loadCount('obat');

        return response()->json([
            'data' => new KategoriObatResource($kategori),
            'message' => 'Kategori obat berhasil ditambahkan.',
        ], 201);
    }

    /** PUT /api/kategori/{kategori} */
    public function update(UpdateKategoriRequest $request, KategoriObat $kategori): JsonResponse
    {
        $kategori->update($request->validated());
        $kategori->loadCount('obat');

        return response()->json([
            'data' => new KategoriObatResource($kategori),
            'message' => 'Kategori obat berhasil diperbarui.',
        ]);
    }

    /** DELETE /api/kategori/{kategori} */
    public function destroy(KategoriObat $kategori): JsonResponse
    {
        if ($kategori->obat()->exists()) {
            abort(422, 'Kategori tidak dapat dihapus karena masih memiliki obat terkait.');
        }

        $kategori->delete();

        return response()->json(null, 204);
    }
}
