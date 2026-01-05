import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Booking from "./pages/booking";
import Offers from "./pages/offers";
import Profile from "./pages/profile";
import Wallet from "./pages/wallet";
import Ticket from "./pages/ticket";

export default function App() {
    // ✅ login state is derived from token
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    // keep state in sync on refresh
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("token"));
    }, []);

    // called from Login.jsx
    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    return (
        <main>
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<Home />} />
                <Route path="/offers" element={<Offers />} />
                <Route
                    path="/login"
                    element={
                        isLoggedIn ? (
                            <Navigate to="/" />
                        ) : (
                            <Login onLoginSuccess={handleLoginSuccess} />
                        )
                    }
                />
                <Route path="/register" element={<Register />} />

                {/* PROTECTED ROUTES */}
                <Route
                    path="/booking"
                    element={<Booking />}
                />
                <Route path="/profile" element={<Profile />} />
                <Route
                    path="/wallet"
                    element={<Wallet />}
                />

                <Route path="/ticket/:bookingId" element={<Ticket />} />

                <Route path="*" element={<div>Not found</div>} />
            </Routes>
        </main>
    );
}
