import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const navigate = useNavigate();

    const [userProfile, setUserProfile] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) return;

        // Load profile
        fetch("http://localhost:8383/api/profile", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(setUserProfile)
            .catch(() => setError("Failed to load profile"));

        // Load tickets
        fetch("http://localhost:8383/api/tickets", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                // ✅ filter out broken tickets
                const validTickets = (Array.isArray(data) ? data : []).filter(
                    (t) => Array.isArray(t.flights) && t.flights.length > 0
                );
                setTickets(validTickets);
            })
            .catch(() => setTickets([]));
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    if (error) {
        return <p className="text-red-500 text-center mt-6">{error}</p>;
    }

    if (!userProfile) {
        return <p className="text-center mt-6">Loading profile…</p>;
    }

    return (
        <div className="min-h-screen bg-[#5a5a5a] text-white">

            {/* HEADER */}
            <header className="flex justify-between items-center bg-darkGray px-8 py-4">
                <div className="flex items-center gap-3">
                    <img
                        src="/Images/LOGO.png"
                        alt="FreeFly logo"
                        className="h-10 w-10"
                    />
                    <div>
                        <p className="text-xl font-semibold">FreeFly</p>
                        <p className="text-sm opacity-70">
                            Find your perfect flight!
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="text-sm hover:underline"
                >
                    ← Back to main page
                </button>
            </header>

            {/* PROFILE INFO */}
            <div className="mt-8 flex flex-col items-center gap-2">
                <p><strong>Name:</strong> {userProfile.name} {userProfile.surname}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Date of Birth:</strong> {userProfile.dob}</p>
            </div>

            {/* MY TICKETS */}
            <div className="max-w-3xl mx-auto mt-10 px-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                    My Tickets
                </h2>

                {tickets.length === 0 ? (
                    <p className="text-center opacity-70">
                        No tickets purchased yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((t) => {
                            const routes = t.flights.map(
                                (f) => `${f.from} → ${f.to}`
                            );

                            const dates = t.flights.map((f) => f.date);

                            return (
                                <div
                                    key={t._id}
                                    className="bg-black/30 rounded-xl p-5 border border-white/10 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-lg">
                                            {routes.join(" | ")}
                                        </p>

                                        <p className="text-sm opacity-70">
                                            {dates.join(" / ")}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/ticket/${t._id}`)}
                                        className="px-4 py-2 rounded-lg bg-white text-black text-sm hover:bg-gray-200"
                                    >
                                        View ticket
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* LOGOUT */}
            <div className="mt-10 flex justify-center">
                <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
