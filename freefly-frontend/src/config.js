// Central API configuration
// Automatically switches between local dev and production (Render)
export const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8383";
