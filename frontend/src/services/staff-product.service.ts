import { httpClient } from "@/lib/http-client";

export interface ProductDto {
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl?: string;
}

export interface Product extends ProductDto {
    productId: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
}

export const staffProductService = {
    // Get all products
    async getAll(page = 1, limit = 10): Promise<PagedResult<Product>> {
        return httpClient<PagedResult<Product>>(`/staff/products?page=${page}&limit=${limit}`);
    },

    // Get product by ID
    async getById(id: string): Promise<Product> {
        return httpClient<Product>(`/staff/products/${id}`);
    },

    // Create new product
    async create(data: ProductDto): Promise<Product> {
        return httpClient<Product>("/staff/products", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Update product
    async update(id: string, data: ProductDto): Promise<Product> {
        return httpClient<Product>(`/staff/products/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    // Delete product
    async delete(id: string): Promise<void> {
        return httpClient<void>(`/staff/products/${id}`, {
            method: "DELETE",
        });
    },
};
