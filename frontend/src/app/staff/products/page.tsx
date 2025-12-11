"use client";

import { useEffect, useState } from "react";
import StaffLayout from "@/components/layouts/StaffLayout";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { staffProductService, Product, ProductDto } from "@/services/staff-product.service";
import { Pagination } from "@/components/ui/pagination";

export default function StaffProductsPage() {

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductDto>({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        imageUrl: "",
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 10;

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            console.log("Fetching products...");
            const data = await staffProductService.getAll(page, LIMIT);
            console.log("Products fetched:", data);

            if (data.items) {
                setProducts(data.items);
                setTotalPages(data.totalPages);
            } else {
                // Fallback if API returns array directly (backward compatibility or error)
                setProducts(data as any);
            }

        } catch (error: any) {
            console.error("Error fetching products:", error);
            toast.error("Lỗi", {
                description: "Không thể tải danh sách sản phẩm",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                imageUrl: product.imageUrl || "",
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                description: "",
                price: 0,
                stock: 0,
                imageUrl: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await staffProductService.update(editingProduct.productId, formData);
                toast.success("Thành công", {
                    description: "Đã cập nhật sản phẩm",
                });
            } else {
                await staffProductService.create(formData);
                toast.success("Thành công", {
                    description: "Đã thêm sản phẩm mới",
                });
            }
            handleCloseModal();
            fetchProducts(currentPage);
        } catch (error: any) {
            toast.error("Lỗi", {
                description: error.message || "Có lỗi xảy ra",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
        try {
            await staffProductService.delete(id);
            toast.success("Thành công", {
                description: "Đã xóa sản phẩm",
            });
            fetchProducts(currentPage);
        } catch (error: any) {
            toast.error("Lỗi", {
                description: "Không thể xóa sản phẩm",
            });
        }
    };

    return (
        <StaffLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý sản phẩm</h1>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách sản phẩm</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>STT</TableHead>
                                            <TableHead>Hình ảnh</TableHead>
                                            <TableHead>Tên sản phẩm</TableHead>
                                            <TableHead>Giá (VKU)</TableHead>
                                            <TableHead>Kho</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product, index) => (
                                            <TableRow key={product.productId}>
                                                <TableCell>{(currentPage - 1) * LIMIT + index + 1}</TableCell>
                                                <TableCell>
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                                            No img
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{product.price}</TableCell>
                                                <TableCell>{product.stock}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenModal(product)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(product.productId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {products.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    Chưa có sản phẩm nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                <div className="mt-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Simple Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">
                                    {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                                    <textarea
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Giá (VKU)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Số lượng kho</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">URL Hình ảnh</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                                        Hủy
                                    </Button>
                                    <Button type="submit">
                                        {editingProduct ? "Cập nhật" : "Thêm mới"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
}
