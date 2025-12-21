import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handlePaymentCallback } from "@/services/paymentApi";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const hasParams = searchParams.toString() !== '';
    const initialStatus = hasParams ? "loading" : "failed";
    const initialMessage = hasParams
        ? "Đang xử lý kết quả thanh toán..."
        : "Không tìm thấy thông tin thanh toán";

    const [status, setStatus] = useState<"loading" | "success" | "failed">(initialStatus);
    const [message, setMessage] = useState(initialMessage);

    useEffect(() => {
        if (!hasParams) {
            return;
        }

        const processPayment = async () => {
            try {
                const params = Object.fromEntries(searchParams.entries());
                const res = await handlePaymentCallback(params);

                if (res.data.data.success) {
                    setStatus("success");
                    setMessage("Thanh toán thành công!");
                    toast.success("Thanh toán thành công!");
                } else {
                    setStatus("failed");
                    setMessage(res.data.data.message || "Thanh toán thất bại");
                    toast.error(res.data.data.message || "Thanh toán thất bại");
                }
            } catch (error) {
                console.error("Failed to process payment callback", error);
                setStatus("failed");
                setMessage("Có lỗi xảy ra khi xử lý thanh toán");
                toast.error("Có lỗi xảy ra khi xử lý thanh toán");
            }
        };

        processPayment();
    }, [searchParams, hasParams]);

    return (
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Kết quả thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === "loading" && (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                            <p className="text-lg text-gray-600">{message}</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <h3 className="text-xl font-bold text-green-600">Thanh toán thành công!</h3>
                            <p className="text-gray-600">Đơn hàng của bạn đã được thanh toán.</p>
                            <div className="mt-4 flex gap-2">
                                <Button onClick={() => navigate("/user/orders")}>
                                    Xem đơn hàng
                                </Button>
                                <Button variant="outline" onClick={() => navigate("/")}>
                                    Về trang chủ
                                </Button>
                            </div>
                        </>
                    )}

                    {status === "failed" && (
                        <>
                            <XCircle className="h-16 w-16 text-red-500" />
                            <h3 className="text-xl font-bold text-red-600">Thanh toán thất bại</h3>
                            <p className="text-gray-600">{message}</p>
                            <div className="mt-4 flex gap-2">
                                <Button onClick={() => navigate("/cart")}>
                                    Quay lại giỏ hàng
                                </Button>
                                <Button variant="outline" onClick={() => navigate("/")}>
                                    Về trang chủ
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentCallbackPage;
