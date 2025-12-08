"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth-token";

export default function DebugPage() {
    const [debugInfo, setDebugInfo] = useState<any>({});

    useEffect(() => {
        const token = getAuthToken();
        const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;

        let decodedToken = null;
        if (token) {
            try {
                // Decode JWT token (simple base64 decode of payload)
                const payload = token.split('.')[1];
                decodedToken = JSON.parse(atob(payload));
            } catch (e) {
                decodedToken = { error: "Failed to decode token" };
            }
        }

        setDebugInfo({
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPreview: token ? `${token.substring(0, 20)}...` : null,
            decodedToken,
            user: user ? JSON.parse(user) : null,
            apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
        });
    }, []);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">🔍 Debug Information</h1>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <h2 className="font-bold mb-2">Authentication Status:</h2>
                <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                <h2 className="font-bold mb-2">Quick Checks:</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li>Token exists: {debugInfo.hasToken ? "✅ Yes" : "❌ No"}</li>
                    <li>User role: {debugInfo.decodedToken?.role || debugInfo.user?.role || "❌ Unknown"}</li>
                    <li>API URL: {debugInfo.apiUrl}</li>
                </ul>
            </div>

            <div className="mt-4">
                <button
                    onClick={() => {
                        const testUrl = "http://localhost:5000/api/admin/create-teacher";
                        console.log("Testing connection to:", testUrl);
                        fetch(testUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${getAuthToken()}`
                            },
                            body: JSON.stringify({
                                fullName: "Test Teacher",
                                email: "test@test.com",
                                teacherCode: "TEST001",
                                password: "Test123"
                            })
                        })
                            .then(res => {
                                console.log("Response status:", res.status);
                                return res.json();
                            })
                            .then(data => console.log("Response data:", data))
                            .catch(err => console.error("Fetch error:", err));
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    🧪 Test API Connection
                </button>
            </div>
        </div>
    );
}
