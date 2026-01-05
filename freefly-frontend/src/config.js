// Central API configuration
// Automatically switches between local dev and production (Render)

export const API_URL =
    import.meta.env.PROD
        ? "https://freefly-website.onrender.com"
        : "http://localhost:8383";
