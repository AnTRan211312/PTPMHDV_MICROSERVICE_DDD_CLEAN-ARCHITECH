// src/utils/convertHelper.ts

/**
 * Format thời gian đăng nhập sang định dạng Việt Nam
 * @param dateString - Chuỗi thời gian (ISO string) hoặc Date object
 * @returns Chuỗi đã format (VD: 14:30 - 25/08/2024)
 */
export const formatLoginTime = (dateString: string | Date | number | undefined | null): string => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    // Kiểm tra nếu date không hợp lệ
    if (isNaN(date.getTime())) {
        return "Thời gian không hợp lệ";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date).replace(",", " -");
};

// Alias cho formatLoginTime - dùng để format ISO date strings
export const formatISO = formatLoginTime;

/**
 * Format giá tiền sang định dạng Việt Nam (VND)
 * @param price - Giá tiền (number)
 * @returns Chuỗi đã format (VD: 100.000₫)
 */
export const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return "0₫";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};
