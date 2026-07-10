<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\BlacklistSupplierRequest;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\NomorGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tidak ada method destroy() - api.ts (supplierApi) dan dokumen endpoint
 * memang tidak menyediakan DELETE untuk supplier, hanya blacklist/restore.
 */
class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query()->withCount('obatMasuk');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('kode', 'like', "%{$search}%")
                    ->orWhere('pic', 'like', "%{$search}%");
            });
        }

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));
        $query->when($request->filled('kota'), fn ($q) => $q->where('kota', 'like', '%'.$request->string('kota').'%'));

        $query->orderBy('nama');

        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return SupplierResource::collection($query->paginate($perPage))->response();
    }

    public function show(Supplier $supplier): JsonResponse
    {
        $supplier->loadCount('obatMasuk');
        return response()->json(['data' => new SupplierResource($supplier)]);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['kode'] = NomorGenerator::kodeSupplier();
        $data['status'] ??= 'aktif';

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('supplier', 'public');
        }

        $supplier = Supplier::create($data);
        $supplier->loadCount('obatMasuk');

        return response()->json([
            'data' => new SupplierResource($supplier),
            'message' => 'Supplier berhasil ditambahkan.',
        ], 201);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            if ($supplier->foto) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($supplier->foto);
            }
            $data['foto'] = $request->file('foto')->store('supplier', 'public');
        }

        $supplier->update($data);
        $supplier->loadCount('obatMasuk');

        return response()->json([
            'data' => new SupplierResource($supplier),
            'message' => 'Data supplier berhasil diperbarui.',
        ]);
    }

    /** DELETE /api/supplier/{supplier} */
    public function destroy(Supplier $supplier): JsonResponse
    {
        if ($supplier->obatMasuk()->exists() || $supplier->obat()->exists()) {
            abort(422, 'Supplier tidak dapat dihapus karena masih terikat dengan transaksi obat masuk atau data obat master.');
        }

        if ($supplier->foto) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($supplier->foto);
        }

        $supplier->delete();

        return response()->json(null, 204);
    }

    /** PATCH /api/supplier/{supplier}/blacklist */
    public function blacklist(BlacklistSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier->update([
            'status' => 'blacklist',
            'alasan_blacklist' => $request->validated('alasan'),
        ]);
        $supplier->loadCount('obatMasuk');

        return response()->json([
            'data' => new SupplierResource($supplier),
            'message' => 'Supplier berhasil dimasukkan ke daftar blacklist.',
        ]);
    }

    /** PATCH /api/supplier/{supplier}/restore */
    public function restore(Supplier $supplier): JsonResponse
    {
        if ($supplier->status !== 'blacklist') {
            abort(422, 'Supplier ini tidak dalam status blacklist.');
        }

        $supplier->update([
            'status' => 'aktif',
            'alasan_blacklist' => null,
        ]);
        $supplier->loadCount('obatMasuk');

        return response()->json([
            'data' => new SupplierResource($supplier),
            'message' => 'Supplier berhasil dipulihkan dari blacklist.',
        ]);
    }
}
