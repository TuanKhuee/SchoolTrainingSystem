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
import { staffCategoryService, Category, CategoryDto } from "@/services/staff-category.service";

export default function StaffCategoriesPage() {

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<CategoryDto>({
        name: "",
        description: "",
    });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await staffCategoryService.getAll();
            setCategories(data);
        } catch (error: any) {
            console.error("Error fetching categories:", error);
            toast.error("Lỗi", {
                description: "Không thể tải danh sách danh mục",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                description: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await staffCategoryService.update(editingCategory.categoryId, formData);
                toast.success("Thành công", {
                    description: "Đã cập nhật danh mục",
                });
            } else {
                await staffCategoryService.create(formData);
                toast.success("Thành công", {
                    description: "Đã thêm danh mục mới",
                });
            }
            handleCloseModal();
            fetchCategories();
        } catch (error: any) {
            toast.error("Lỗi", {
                description: error.message || "Có lỗi xảy ra",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        try {
            await staffCategoryService.delete(id);
            toast.success("Thành công", {
                description: "Đã xóa danh mục",
            });
            fetchCategories();
        } catch (error: any) {
            toast.error("Lỗi", {
                description: "Không thể xóa danh mục",
            });
        }
    };

    return (
        <StaffLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý danh mục</h1>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm danh mục
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách danh mục</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>STT</TableHead>
                                        <TableHead>Tên danh mục</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category, index) => (
                                        <TableRow key={category.categoryId}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell>{category.description || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenModal(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(category.categoryId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {categories.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Chưa có danh mục nào
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Simple Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">
                                    {editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
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
                                    <label className="block text-sm font-medium mb-1">Tên danh mục</label>
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
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                                        Hủy
                                    </Button>
                                    <Button type="submit">
                                        {editingCategory ? "Cập nhật" : "Thêm mới"}
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
