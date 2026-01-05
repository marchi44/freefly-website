import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function Wallet() {
    const navigate = useNavigate();

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    // Load wallet data
    useEffect(() => {
        fetch(`${API_URL}/api/wallet`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then((data) => {
                setBalance(typeof data.balance === "number" ? data.balance : 0);
                setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
            })
            .catch(() => {
                setBalance(0);
                setTransactions([]);
                setError("Failed to load wallet");
            });
    }, [token]);

    // Top up wallet
    const handleTopUp = async () => {
        if (loading) return;
        setError("");

        if (!amount || Number(amount) <= 0) {
            setError("Enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/wallet/top-up`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount: Number(amount) }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Top-up failed");
                return;
            }

            setBalance(data.balance);
            setAmount("");

            setTransactions((prev) => [
                {
                    amount: Number(amount),
                    type: "TOP_UP",
                    createdAt: new Date().toISOString(),
                },
                ...prev,
            ]);
        } catch {
            setError("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#5a5a5a] text-white px-6 py-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-3xl font-semibold">My Wallet</h1>
                    <button
                        onClick={() => navigate("/")}
                        className="text-sm hover:underline opacity-80"
                    >
                        ← Back to main page
                    </button>
                </div>

                {/* Balance */}
                <div className="bg-darkGray rounded-2xl p-8 mb-8 border border-white/10">
                    <p className="text-sm opacity-70 mb-2">Current balance</p>
                    <p className="text-4xl font-semibold">
                        €{Number.isFinite(balance) ? balance.toFixed(2) : "0.00"}
                    </p>
                </div>

                {/* Top up */}
                <div className="bg-darkGray rounded-2xl p-6 mb-10 border border-white/10">
                    <p className="text-lg font-medium mb-4">Top up wallet</p>

                    {error && (
                        <p className="text-red-400 text-sm mb-3">{error}</p>
                    )}

                    <div className="flex gap-3 max-w-sm">
                        <input
                            type="number"
                            placeholder="Amount (€)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-[#4f4f4f] rounded-lg px-4 py-2 text-white placeholder-gray-300 outline-none"
                        />
                        <button
                            onClick={handleTopUp}
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition disabled:opacity-50"
                        >
                            {loading ? "Adding..." : "Add"}
                        </button>
                    </div>
                </div>

                {/* Transactions */}
                <div className="bg-darkGray rounded-2xl p-6 border border-white/10">
                    <p className="text-lg font-medium mb-4">Transaction history</p>

                    {transactions.length === 0 ? (
                        <p className="opacity-70 text-sm">
                            Your wallet activity will appear here after top-ups or bookings.
                        </p>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {transactions
                                .slice()
                                .reverse()
                                .map((t, index) => (
                                    <div
                                        key={index}
                                        className="py-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {t.type === "TOP_UP"
                                                    ? "Wallet top-up"
                                                    : "Flight purchase"}
                                            </p>
                                            <p className="text-xs opacity-60">
                                                {new Date(t.createdAt).toLocaleString()}
                                            </p>
                                        </div>

                                        <p
                                            className={`font-semibold ${
                                                t.type === "TOP_UP"
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                            }`}
                                        >
                                            {t.type === "TOP_UP" ? "+" : "-"}€
                                            {Number(t.amount).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
