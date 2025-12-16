"use client";

import { useEffect, useState } from "react";
import StaffLayout from "@/components/layouts/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { walletService } from "@/services/wallet.service";
import { toast } from "sonner";
import { Loader2, Copy, RefreshCw, Wallet, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, CreditCard } from "lucide-react";
import QRCode from "react-qr-code";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface WalletInfoResponse {
    address: string;
    vkuBalance: number;
    tokenSymbol: string;
    contractAddress: string;
}

interface Transaction {
    id: number;
    amount: number;
    transactionType: string;
    description: string;
    transactionHash: string;
    createdAt: string;
    sender: string;
}

export default function StaffWalletPage() {
    const [walletInfo, setWalletInfo] = useState<WalletInfoResponse | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchData = async () => {
        try {
            const [walletData, txData] = await Promise.all([
                walletService.getStaffWallet(),
                walletService.getStaffTransactions()
            ]);
            setWalletInfo(walletData);
            setTransactions(txData);
        } catch (error) {
            console.error("Error fetching wallet data:", error);
            toast.error("Lỗi", {
                description: "Không thể tải thông tin ví",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSyncWallet = async () => {
        setSyncing(true);
        try {
            await walletService.syncWalletBalance();
            await fetchData();
            toast.success("Đồng bộ thành công", {
                description: "Số dư ví đã được cập nhật từ blockchain",
            });
        } catch (error) {
            console.error("Error syncing wallet:", error);
            toast.error("Lỗi đồng bộ", {
                description: "Không thể đồng bộ số dư ví",
            });
        } finally {
            setSyncing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép", {
            description: "Địa chỉ ví đã được sao chép vào clipboard",
        });
    };

    const formatAddress = (address: string) => {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const getTransactionIcon = (type: string, amount: number) => {
        if (amount > 0) return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
        if (amount < 0) return <ArrowUpRight className="h-5 w-5 text-red-500" />;
        return <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
    };

    if (loading) {
        return (
            <StaffLayout>
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Thông tin ví</h1>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncWallet}
                        disabled={syncing}
                        className="w-full sm:w-auto"
                    >
                        {syncing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Đồng bộ ví
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Balance Card */}
                    <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white/80 flex items-center">
                                <Wallet className="mr-2 h-4 w-4" /> Số dư hiện tại
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold mb-4">
                                {walletInfo?.vkuBalance.toLocaleString()} <span className="text-2xl font-normal opacity-80">{walletInfo?.tokenSymbol}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm bg-black/20 p-2 rounded-lg w-fit">
                                <span className="opacity-70 hidden sm:inline">Address:</span>
                                <code className="font-mono">{walletInfo?.address}</code>
                                <button
                                    onClick={() => walletInfo?.address && copyToClipboard(walletInfo.address)}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code Card */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Mã QR Ví</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center pt-0">
                            <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                                {walletInfo?.address && (
                                    <QRCode
                                        value={walletInfo.address}
                                        size={120}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                    />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Quét mã để gửi coin đến ví này
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Lịch sử giao dịch</h2>

                    {transactions.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-10">
                                <div className="bg-gray-100 p-4 rounded-full mb-4">
                                    <CreditCard className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-muted-foreground text-center">Chưa có giao dịch nào</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Mobile View - Cards */}
                            <div className="grid gap-4 sm:hidden">
                                {transactions.map((tx) => (
                                    <Card key={tx.id} className="overflow-hidden">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                                        {getTransactionIcon(tx.transactionType, tx.amount)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{tx.transactionType}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount} VKU
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm mt-3 pt-3 border-t">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Người gửi/nhận:</span>
                                                    <span className="font-medium">{tx.sender || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Nội dung:</span>
                                                    <span className="font-medium truncate max-w-[150px]">{tx.description}</span>
                                                </div>
                                                {tx.transactionHash && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Hash:</span>
                                                        <a
                                                            href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline flex items-center text-xs"
                                                        >
                                                            {tx.transactionHash.substring(0, 8)}...
                                                            <ArrowUpRight className="h-3 w-3 ml-1" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden sm:block rounded-md border bg-white">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Thời gian</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Loại</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Số lượng</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Người gửi/nhận</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mô tả</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Hash</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}
                                                    </td>
                                                    <td className="p-4 align-middle font-medium">
                                                        {tx.transactionType}
                                                    </td>
                                                    <td className={`p-4 align-middle font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount} VKU
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {tx.sender || "N/A"}
                                                    </td>
                                                    <td className="p-4 align-middle max-w-[200px] truncate" title={tx.description}>
                                                        {tx.description}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        {tx.transactionHash ? (
                                                            <a
                                                                href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline inline-flex items-center"
                                                            >
                                                                View
                                                                <ArrowUpRight className="h-3 w-3 ml-1" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">Pending</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </StaffLayout>
    );
}
