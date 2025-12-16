import { http } from "@/lib/http-client";

export interface ScanQRResponse {
    success: boolean;
    message: string;
    amount: number;
    newBalance: number;
    activityName: string;
}

export const activityService = {
    scanQRCode: async (qrCodePayload: string): Promise<ScanQRResponse> => {
        try {
            // Note: Endpoint is in StudentController: api/student/Student/scan-qr-code
            const response = await http.post<ScanQRResponse>("/student/Student/scan-qr-code", {
                qrCodePayload,
            });
            return response;
        } catch (error) {
            throw error;
        }
    },
};
