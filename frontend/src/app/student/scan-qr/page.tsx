"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { activityService } from "@/services/activity.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define callback interfaces locally to avoid import issues from the library if types are missing
interface Html5QrcodeScannerType {
    render: (
        qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void,
        qrCodeErrorCallback?: (errorMessage: string) => void
    ) => void;
    clear: () => Promise<void>;
}

export default function ScanQRPage() {
    const router = useRouter();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [errorData, setErrorData] = useState<string | null>(null);
    // Use ref for immediate state access in callbacks
    const isProcessingRef = useRef(false);
    const [successData, setSuccessData] = useState<{
        amount: number;
        activityName: string;
        newBalance: number;
    } | null>(null);
    const [scanner, setScanner] = useState<any>(null);

    const [isSecureContext, setIsSecureContext] = useState(true);

    useEffect(() => {
        // Check for secure context
        if (typeof window !== 'undefined' && window.isSecureContext === false) {
            setIsSecureContext(false);
            return;
        }

        // Only initialize scanner on client side
        let html5QrcodeScanner: any;

        const initializeScanner = () => {
            // ... existing initialization logic ...
            // Configuration for the scanner
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                defaultZoomValueIfSupported: 2,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            };

            try {
                // @ts-ignore - Library might have type definition issues
                html5QrcodeScanner = new Html5QrcodeScanner(
                    "reader",
                    config,
          /* verbose= */ false
                );

                html5QrcodeScanner.render(
                    onScanSuccess,
                    onScanFailure
                );

                setScanner(html5QrcodeScanner);
            } catch (err) {
                console.error("Failed to initialize scanner", err);
            }
        };

        // Delay initialization slightly to ensure DOM is ready
        const timer = setTimeout(() => {
            // If we haven't successfully scanned yet and no error, initialize
            if (!successData && !errorData && !isProcessingRef.current && isSecureContext) {
                initializeScanner();
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            if (html5QrcodeScanner) {
                try {
                    html5QrcodeScanner.clear().catch(console.error);
                } catch (e) {
                    // Ignore clear errors on unmount
                    console.error("Error clearing scanner on unmount", e);
                }
            }
        };
    }, [successData, errorData, isSecureContext]); // Add dependencies

    const onScanSuccess = async (decodedText: string, decodedResult: any) => {
        // Prevent multiple scans
        if (isProcessingRef.current || scanResult === decodedText) return;

        setScanResult(decodedText);
        isProcessingRef.current = true; // Stop processing new scans immediately

        // Stop the scanner UI temporarily
        const scannerElement = document.getElementById("reader");
        if (scannerElement) {
            // We don't clear the scanner here to keep the last frame or indicate it's processing
            // but we flag isProcessing to true to ignore further callbacks
        }

        try {
            console.log(`Scan result: ${decodedText}`);
            toast.loading("Đang xử lý mã QR...", { id: "qr-scan" });

            // Call API to confirm participation
            const response = await activityService.scanQRCode(decodedText);

            toast.dismiss("qr-scan");

            if (response.success) {
                toast.success("Xác nhận thành công!");
                setSuccessData({
                    amount: response.amount,
                    activityName: response.activityName,
                    newBalance: response.newBalance
                });

                // Clear scanner after success
                if (scanner) {
                    try {
                        await scanner.clear();
                    } catch (e) { console.error(e); }
                }
            } else {
                toast.error("Thất bại", {
                    description: response.message || "Không thể xác nhận tham gia"
                });

                // NEW: Set error data to show Error UI and stop scanner
                setErrorData(response.message || "Không thể xác nhận tham gia");

                if (scanner) {
                    try {
                        await scanner.clear();
                    } catch (e) { console.error(e); }
                }
                // setIsProcessing(false); // Do not reset processing, keep it stopped until user clicks "Try Again"
            }
        } catch (error: any) {
            console.error("Scan error:", error);
            toast.dismiss("qr-scan");

            let errorMessage = "Đã xảy ra lỗi khi xử lý mã QR";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast.error("Lỗi", {
                description: errorMessage
            });

            // NEW: Set error data to show Error UI
            setErrorData(errorMessage);

            if (scanner) {
                try {
                    await scanner.clear();
                } catch (e) { console.error(e); }
            }

            setScanResult(null);
        }
    };

    const onScanFailure = (error: any) => {
        // Handle scan failure, usually better to ignore keeping console clean
        // console.warn(`Code scan error = ${error}`);
    };

    const handleReset = () => {
        setSuccessData(null);
        setErrorData(null); // Clear error
        setScanResult(null);
        isProcessingRef.current = false;
        // Scanner will re-initialize via useEffect because successData and errorData are null
    };

    if (!isSecureContext) {
        return (
            <DashboardLayout>
                <div className="container max-w-md mx-auto py-6 px-4">
                    <h1 className="text-2xl font-bold mb-6 text-center">Lỗi bảo mật</h1>
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <XCircle className="w-6 h-6" />
                                Không thể truy cập Camera
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-red-600">
                                Trình duyệt chặn truy cập camera vì kết nối không an toàn (không phải HTTPS hoặc localhost).
                            </p>
                            <div className="bg-white p-4 rounded-lg border border-red-100 text-sm space-y-2">
                                <p className="font-semibold">Cách khắc phục:</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Sử dụng <strong>localhost</strong> nếu đang chạy trên máy tính.</li>
                                    <li>Cấu hình <strong>HTTPS</strong> cho server nếu truy cập từ thiết bị khác.</li>
                                    <li>Sử dụng các công cụ như <strong>ngrok</strong> để tạo tunnel HTTPS.</li>
                                </ul>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/student/activities')}
                            >
                                Quay lại trang hoạt động
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* ... existing return ... */}
            <div className="container max-w-md mx-auto py-6 px-4">
                <h1 className="text-2xl font-bold mb-6 text-center">Quét mã QR</h1>

                {/* Scanner UI - Show only when no success and no error */}
                {!successData && !errorData && (
                    <div className="space-y-6">
                        <Card className="overflow-hidden border-2 border-primary/20">
                            <CardContent className="p-0">
                                <style jsx global>{`
                  #reader {
                    width: 100%;
                    border: none !important;
                  }
                  #reader__scan_region {
                    background: transparent;
                  }
                  #reader__dashboard_section_csr button {
                    background-color: white;
                    color: black;
                    border: 1px solid #e2e8f0;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 8px;
                  }
                  #reader__dashboard_section_swaplink {
                    display: none !important;
                  }
                `}</style>
                                <div id="reader" className="w-full bg-black min-h-[300px]"></div>
                            </CardContent>
                        </Card>

                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Di chuyển camera vào mã QR của hoạt động để quét
                            </p>

                            <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg text-sm text-left">
                                <p className="font-semibold flex items-center">
                                    <Camera className="w-4 h-4 mr-2" /> Hướng dẫn:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
                                    <li>Đảm bảo đủ ánh sáng</li>
                                    <li>Giữ yên thiết bị khi quét</li>
                                    <li>Cho phép trình duyệt truy cập camera</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success State UI */}
                {successData && (
                    <Card className="border-green-200 bg-green-50 shadow-lg animate-in fade-in zoom-in duration-300">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-2">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <CardTitle className="text-green-700 text-xl">Xác nhận thành công!</CardTitle>
                            <CardDescription className="text-green-600">
                                Bạn đã tham gia hoạt động
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center space-y-2 py-4 bg-white/50 rounded-xl">
                                <h3 className="font-semibold text-lg">{successData.activityName}</h3>
                                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-600">
                                    <span>+{successData.amount} VKU</span>
                                    <Zap className="fill-yellow-600 w-6 h-6" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Số dư mới: {successData.newBalance} VKU
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/student/activities" className="w-full">
                                    <Button variant="outline" className="w-full">
                                        Về trang hoạt động
                                    </Button>
                                </Link>
                                <Link href="/wallet" className="w-full">
                                    <Button variant="outline" className="w-full">
                                        Xem ví của tôi
                                    </Button>
                                </Link>
                                <Button
                                    className="col-span-2 w-full bg-green-600 hover:bg-green-700"
                                    onClick={handleReset}
                                >
                                    Quét mã khác
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State UI */}
                {errorData && !successData && (
                    <Card className="border-red-200 bg-red-50 shadow-lg animate-in fade-in zoom-in duration-300">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-2">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <CardTitle className="text-red-700 text-xl">Xác nhận thất bại</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-white/50 p-4 rounded-xl text-center border border-red-100">
                                <p className="text-red-800 font-medium">{errorData}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/student/activities" className="w-full">
                                    <Button variant="outline" className="w-full">
                                        Về trang hoạt động
                                    </Button>
                                </Link>
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleReset}
                                >
                                    Thử lại
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
