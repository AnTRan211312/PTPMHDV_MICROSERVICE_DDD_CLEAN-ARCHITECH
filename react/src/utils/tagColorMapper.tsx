// ====================
// METHOD COLOR MAPPER
// ====================
const METHOD_COLORS: Record<string, string> = {
    GET: "bg-green-500",
    POST: "bg-blue-500",
    PUT: "bg-yellow-500",
    DELETE: "bg-red-500",
};

export const getMethodColor = (method: string): string => {
    const color = METHOD_COLORS[method.toUpperCase()];

    return `${color ? color : "bg-gray-500"} w-[80px]`;
};

// ====================
// LEVEL COLOR MAPPER

export const levelColors = {
    INTERN: "bg-blue-100 text-blue-700",
    FRESHER: "bg-green-100 text-green-700",
    MIDDLE: "bg-yellow-100 text-yellow-700",
    SENIOR: "bg-purple-100 text-purple-700",
};
