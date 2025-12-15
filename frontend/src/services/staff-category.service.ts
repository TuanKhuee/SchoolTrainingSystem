import { httpClient } from "@/lib/http-client";

export interface CategoryDto {
    name: string;
    description?: string;
}

export interface Category extends CategoryDto {
    categoryId: string;
}

export const staffCategoryService = {
    // Get all categories
    async getAll(): Promise<Category[]> {
        return httpClient<Category[]>("/staff/categories");
    },

    // Get category by ID
    async getById(id: string): Promise<Category> {
        return httpClient<Category>(`/staff/categories/${id}`);
    },

    // Create new category
    async create(data: CategoryDto): Promise<Category> {
        return httpClient<Category>("/staff/categories", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Update category
    async update(id: string, data: CategoryDto): Promise<Category> {
        return httpClient<Category>(`/staff/categories/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    // Delete category
    async delete(id: string): Promise<void> {
        return httpClient<void>(`/staff/categories/${id}`, {
            method: "DELETE",
        });
    },
};
