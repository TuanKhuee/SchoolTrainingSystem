import { http } from "@/lib/http-client";

export interface ScanQRResponse {
    success: boolean;
    message: string;
    amount: number;
    newBalance: number;
    activityName: string;
}

export const activityService = {
    scanQRCode: async (qrCodeToken: string): Promise<ScanQRResponse> => {
        try {
            const response = await http.post<ScanQRResponse>("/activities/scan-qr", {
                qrCodeToken,
            });
            return response;
        } catch (error) {
            throw error;
        }
    },
};
