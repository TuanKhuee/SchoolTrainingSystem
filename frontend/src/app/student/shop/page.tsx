"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    canteenService,
    Product,
    CartItem,
    Order,
} from "@/services/canteen.service";
import {
    Loader2,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Package,
    Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";

export default function ShopPage() {

    const { wallet } = useAuth({ requireAuth: true });
    const refreshWalletBalance = useAuthStore((state) => state.refreshWalletBalance);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await canteenService.getProducts();
            setProducts(data);
        } catch (error: any) {
            toast.error("Lỗi", {
                description: "Không thể tải danh sách sản phẩm.",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCart = async () => {
        try {
            const data = await canteenService.getCart();
            setCart(data);
        } catch (error: any) {
            console.error("Error fetching cart:", error);
        }
    };

    const fetchOrders = async () => {
        try {
            const data = await canteenService.getOrders();
            setOrders(data);
        } catch (error: any) {
            // Orders endpoint not available yet, silently fail
            console.log("Orders feature not available yet");
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCart();
        fetchOrders();
    }, []);

    const handleAddToCart = async (productId: string) => {
        try {
            await canteenService.addToCart({ productId, quantity: 1 });
            toast.success("Thành công", {
                description: "Đã thêm vào giỏ hàng",
            });
            fetchCart();
        } catch (error: any) {
            toast.error("Lỗi", {
                description: error.message || "Không thể thêm vào giỏ hàng",
            });
        }
    };

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        try {
            await canteenService.updateCart({ cartItemId, quantity: newQuantity });
            fetchCart();
        } catch (error: any) {
            toast.error("Lỗi", {
                description: "Không thể cập nhật số lượng",
            });
        }
    };

    const handleRemoveFromCart = async (cartItemId: string) => {
        try {
            await canteenService.removeFromCart(cartItemId);
            toast.success("Đã xóa", {
                description: "Đã xóa sản phẩm khỏi giỏ hàng",
            });
            fetchCart();
        } catch (error: any) {
            toast.error("Lỗi", {
                description: "Không thể xóa sản phẩm",
            });
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Giỏ hàng trống", {
                description: "Vui lòng thêm sản phẩm vào giỏ hàng",
            });
            return;
        }

        if (!confirm("Xác nhận thanh toán bằng VKU token?")) return;

        setLoading(true);
        try {
            const result = await canteenService.checkout();
            toast.success("Thanh toán thành công!", {
                description: `Mã đơn hàng: ${result.orderId}`,
            });

            // Refresh wallet balance and data
            await refreshWalletBalance();
            fetchCart();
            fetchOrders();
        } catch (error: any) {
            toast.error("Thanh toán thất bại", {
                description: error.message || "Có lỗi xảy ra khi thanh toán",
            });
        } finally {
            setLoading(false);
        }
    };

    const cartTotal = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mua hàng</h1>
                        <p className="text-muted-foreground">
                            Mua sắm tại canteen với VKU token
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                        <Wallet className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{wallet?.balance || 0} VKU</span>
                    </div>
                </div>

                <Tabs defaultValue="products" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="products">Sản phẩm</TabsTrigger>
                        <TabsTrigger value="cart">
                            Giỏ hàng
                            {cart.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {cart.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
                    </TabsList>

                    {/* Products Tab */}
                    <TabsContent value="products">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading && products.length === 0 ? (
                                <div className="col-span-full flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : products.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    Chưa có sản phẩm nào
                                </div>
                            ) : (
                                products.map((product) => (
                                    <Card key={product.productId}>
                                        <CardHeader>
                                            {product.imageUrl && (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-48 object-cover rounded-md mb-2"
                                                />
                                            )}
                                            <CardTitle className="text-lg">
                                                {product.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {product.description}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xl font-bold text-primary">
                                                    {product.price} VKU
                                                </span>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleAddToCart(product.productId)
                                                    }
                                                    disabled={product.stock === 0}
                                                >
                                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                                    {product.stock === 0
                                                        ? "Hết hàng"
                                                        : "Thêm"}
                                                </Button>
                                            </div>
                                            {product.stock > 0 && product.stock < 10 && (
                                                <p className="text-xs text-orange-500 mt-2">
                                                    Còn {product.stock} sản phẩm
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Cart Tab */}
                    <TabsContent value="cart">
                        <Card>
                            <CardHeader>
                                <CardTitle>Giỏ hàng của bạn</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Giỏ hàng trống
                                    </div>
                                ) : (
                                    <>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Sản phẩm</TableHead>
                                                        <TableHead>Đơn giá</TableHead>
                                                        <TableHead>Số lượng</TableHead>
                                                        <TableHead>Thành tiền</TableHead>
                                                        <TableHead></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {cart.map((item) => (
                                                        <TableRow key={item.cartItemId}>
                                                            <TableCell className="font-medium">
                                                                {item.product.name}
                                                            </TableCell>
                                                            <TableCell>
                                                                {item.product.price} VKU
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleUpdateQuantity(
                                                                                item.cartItemId,
                                                                                item.quantity - 1
                                                                            )
                                                                        }
                                                                    >
                                                                        <Minus className="h-3 w-3" />
                                                                    </Button>
                                                                    <span className="w-8 text-center">
                                                                        {item.quantity}
                                                                    </span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleUpdateQuantity(
                                                                                item.cartItemId,
                                                                                item.quantity + 1
                                                                            )
                                                                        }
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-semibold">
                                                                {item.product.price * item.quantity}{" "}
                                                                VKU
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() =>
                                                                        handleRemoveFromCart(
                                                                            item.cartItemId
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="mt-6 flex justify-between items-center">
                                            <div className="text-xl font-bold">
                                                Tổng cộng:{" "}
                                                <span className="text-primary">
                                                    {cartTotal} VKU
                                                </span>
                                            </div>
                                            <Button
                                                size="lg"
                                                onClick={handleCheckout}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Đang xử lý...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wallet className="mr-2 h-4 w-4" />
                                                        Thanh toán
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch sử đơn hàng</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {orders.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Chưa có đơn hàng nào
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <Card key={order.orderId}>
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-base">
                                                                Đơn hàng #{order.orderId.slice(0, 8)}
                                                            </CardTitle>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(
                                                                    order.createdAt
                                                                ).toLocaleString("vi-VN")}
                                                            </p>
                                                        </div>
                                                        <Badge>
                                                            {order.totalAmount} VKU
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        {order.items.map((item, index) => (
                                                            <div
                                                                key={`${item.productId}-${index}`}
                                                                className="flex justify-between text-sm"
                                                            >
                                                                <span>
                                                                    {item.productName} x{" "}
                                                                    {item.quantity}
                                                                </span>
                                                                <span>
                                                                    {item.unitPrice * item.quantity}{" "}
                                                                    VKU
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t">
                                                        <p className="text-xs text-muted-foreground">
                                                            TX: {order.transactionHash.slice(0, 20)}
                                                            ...
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
