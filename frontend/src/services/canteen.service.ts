import { httpClient } from "@/lib/http-client";

export interface Product {
    productId: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    stock: number;
    category?: string;
}

export interface CartItem {
    cartItemId: string;
    productId: string;
    product: Product;
    quantity: number;
    studentId: string;
}

export interface CartAddDto {
    productId: string;
    quantity: number;
}

export interface UpdateCartDto {
    cartItemId: string;
    quantity: number;
}

export interface Order {
    orderId: string;
    totalAmount: number;
    transactionHash: string;
    createdAt: string;
    items: OrderItem[];
}

export interface OrderItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    productName: string;
}

export const canteenService = {
    // Get all products
    async getProducts(): Promise<Product[]> {
        return httpClient<Product[]>("/staff/products");
    },

    // Add item to cart
    async addToCart(dto: CartAddDto): Promise<{ message: string }> {
        return httpClient<{ message: string }>("/student/Student/add", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // Get cart items
    async getCart(): Promise<CartItem[]> {
        return httpClient<CartItem[]>("/student/Student/Cart");
    },

    // Update cart item quantity
    async updateCart(dto: UpdateCartDto): Promise<void> {
        return httpClient<void>("/student/Student/update", {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    // Remove item from cart
    async removeFromCart(cartItemId: string): Promise<void> {
        return httpClient<void>(`/student/Student/remove/${cartItemId}`, {
            method: "DELETE",
        });
    },

    // Checkout
    async checkout(): Promise<{ message: string; orderId: string; tx: string }> {
        return httpClient<{ message: string; orderId: string; tx: string }>(
            "/student/Student/checkout",
            {
                method: "POST",
            }
        );
    },

    // Get order history
    async getOrders(): Promise<Order[]> {
        try {
            // Get user from localStorage (stored by auth.store.ts)
            const userStr = localStorage.getItem('user');

            if (!userStr) {
                console.warn("No user data found in localStorage");
                return [];
            }

            const user = JSON.parse(userStr);
            const studentId = user?.id;

            if (!studentId) {
                console.warn("No student ID found in user object");
                return [];
            }

            const url = `/student/Student/history/${studentId}`;
            const result = await httpClient<Order[]>(url);
            return result;
        } catch (error: any) {
            // If 404 (no orders found), return empty array
            if (error?.message?.includes('No orders found') || error?.status === 404) {
                console.log("No orders found for this student");
                return [];
            }
            console.error("Orders endpoint error:", error);
            return [];
        }
    },
};
