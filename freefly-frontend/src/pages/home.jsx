import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./login";
import Register from "./register";
import { API_URL } from "../config";

function AirportInput({ label, placeholder, value, setValue, onSelect, className }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (query.length < 1) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        fetch(`${API_URL}/api/airports?q=${encodeURIComponent(query)}`)
            .then((res) => res.json())
            .then((data) => {
                setSuggestions(data);
                setOpen(true);
            })
            .catch(() => {
                setSuggestions([]);
                setOpen(false);
            });
    }, [query]);

    const handleSelect = (airport) => {
        const text = `${airport.cityName || airport.name} (${airport.iataCode})`;
        setValue(text);
        onSelect(airport);
        setOpen(false);
    };

    return (
        <div className="flex flex-col relative">
            <p>{label}</p>
            <input
                type="text"
                placeholder={placeholder}
                className={`fCity ${className}`}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    setQuery(e.target.value);
                }}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
            />

            {open && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white text-black border rounded-md max-h-60 overflow-y-auto z-50">
                    {suggestions.map((s) => (
                        <li
                            key={s.id}
                            className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                            onMouseDown={() => handleSelect(s)}
                        >
                            <div>
                                {(s.cityName || s.name) ?? "Unknown"} ({s.iataCode})
                            </div>
                            <div className="text-xs text-gray-500">{s.countryCode}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();

    const [fromText, setFromText] = useState("");
    const [toText, setToText] = useState("");
    const [fromAirport, setFromAirport] = useState(null);
    const [toAirport, setToAirport] = useState(null);
    const [tripType, setTripType] = useState("oneway");

    const [departDate, setDepartDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [passengers, setPassengers] = useState(1);

    const [openLogin, setOpenLogin] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);

    const isLoggedIn = !!localStorage.getItem("token");

    // 🔵 ADDED — loading screen state
    const [loading, setLoading] = useState(false);
    const messages = [
        "Searching for flights…",
        "Comparing prices…",
        "Checking availability…",
    ];
    const [msgIndex, setMsgIndex] = useState(0);


    const formatToDDMMYY = (yyyyMmDd) => {
        // expects "YYYY-MM-DD" -> "DDMMYY"
        if (!yyyyMmDd || typeof yyyyMmDd !== "string") return "";
        const [y, m, d] = yyyyMmDd.split("-");
        if (!y || !m || !d) return "";
        return `${d}${m}${y.slice(2)}`;
    };

    const handleLogin = () => {
        setOpenLogin(false);  // Close the login modal
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleSearch = async () => {
        setLoading(true);

        const dep = fromAirport?.iataCode;
        const ari = toAirport?.iataCode;

        if (!dep || !ari) {
            alert("Please select both departure and arrival airports from the list.");
            return;
        }
        if (!departDate) {
            alert("Please select a departure date.");
            return;
        }

        const begin = formatToDDMMYY(departDate);
        const end = formatToDDMMYY(returnDate);

        const type = 0;
        const adults = Math.max(1, Number(passengers) || 1);
        const children = 0;
        const infants = 0;

        let url = "";
        if (tripType === "twoway") {
            if (!returnDate) {
                alert("Please select a return date.");
                return;
            }
            url = `${API_URL}/return/${dep}/${ari}/${begin}/${end}/${type}/${adults}/${children}/${infants}`;
        } else {
            url = `${API_URL}/oneway/${dep}/${ari}/${begin}/${type}/${adults}/${children}/${infants}`;
        }

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const offers = await res.json();

            navigate("/offers", {
                state: {
                    offers,
                    search: {
                        tripType,
                        dep,
                        ari,
                        departDate,
                        returnDate: tripType === "twoway" ? returnDate : null,
                        adults,
                        children,
                        infants,
                    },
                },
            });
        } catch (e) {
            console.error(e);
            navigate("/offers", {
                state: {
                    offers: [],
                    error: "Failed to load flights from server.",
                    search: {
                        tripType,
                        dep,
                        ari,
                        departDate,
                        returnDate: tripType === "twoway" ? returnDate : null,
                        adults,
                        children,
                        infants,
                    },
                },
            });
        }
        finally {
            setLoading(false);
        }
    };
    // 🔵 ADDED — animated loading messages
    useEffect(() => {
        if (!loading) return;

        const interval = setInterval(() => {
            setMsgIndex((i) => (i + 1) % messages.length);
        }, 1200);

        return () => clearInterval(interval);
    }, [loading]);


    return (
        <div className="min-h-screen w-full">
            <header className="justify-between w-full items-center bg-darkGray flex flex-row text-white px-8">
                <div className="flex flex-row gap-x-2">
                    <img className="logo h-12 w-12" src="/Images/LOGO.png" alt="FreeFly logo" />
                    <div className="flex flex-col">
                        <p className="font-roboto text-[24px]">FreeFly</p>
                        <p className="font-roboto text-[16px]">Find your perfect flight!</p>
                    </div>
                </div>

                <div className="flex gap-x-4">
                    {!isLoggedIn ? (
                        <>
                            <button onClick={() => setOpenLogin(true)}>Log In</button>
                            <button onClick={() => setOpenRegister(true)}>Register</button>
                        </>
                    ) : (
                        <>
                            <Link to="/wallet">
                                <button>
                                    <img src="/Images/wallet.png" alt="wallet" className="h-10 w-10" />
                                </button>
                            </Link>
                            {/* Profile icon */}
                            <Link to="/profile">
                                <button>
                                    <img src="/Images/user-line.png" alt="Profile" className="h-10 w-10" />
                                </button>
                            </Link>

                            {/* Log Out Button */}
                            <button onClick={handleLogout} className="px-1 py-2">
                                Log Out
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Login Modal */}
            {openLogin && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white text-black rounded-2xl p-6 w-full max-w-md relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500"
                            onClick={() => setOpenLogin(false)}
                        >
                            ✕
                        </button>

                        <Login onLoginSuccess={handleLogin} />
                    </div>
                </div>
            )}

            {/* Register Modal */}
            {openRegister && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white text-black rounded-2xl p-6 w-full max-w-md relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500"
                            onClick={() => setOpenRegister(false)}
                        >
                            ✕
                        </button>
                        <Register />
                    </div>
                </div>
            )}

            {/* Main content for flight search */}
            <img className="mt-5 w-full object-cover px-8" src="/Images/LektuvoNuotrauka.png" alt="Main airplane" />
            <div className="border border-darkGray rounded-2xl flightSearch bg-darkGray m-10 px-8">
                <div className="py-4 flex gap-x-1 flightDuration bg-darkGray">
                    <button
                        className="p-2 w-30 hover:bg-black border rounded-full"
                        onClick={() => setTripType("oneway")}
                    >
                        One Way
                    </button>
                    <button
                        className="p-2 w-30 border hover:bg-black rounded-full"
                        onClick={() => setTripType("twoway")}
                    >
                        Round Trip
                    </button>
                </div>

                <div className="justify-between flex flex-row flightSearch bg-darkGray">
                    <div className="fromCity">
                        <AirportInput
                            label="From"
                            placeholder="Departure City"
                            className="text-center text-white bg-mediumGray rounded-full py-4 px-2 fCity"
                            value={fromText}
                            setValue={setFromText}
                            onSelect={setFromAirport}
                        />
                    </div>

                    <div className="toCity">
                        <AirportInput
                            label="To"
                            placeholder="Arrival City"
                            className="text-center text-white bg-mediumGray rounded-full py-4 px-2 tCity"
                            value={toText}
                            setValue={setToText}
                            onSelect={setToAirport}
                        />
                    </div>

                    <div className="flex flex-col departure">
                        <p>Depart</p>
                        <input
                            type="date"
                            className="text-center text-white bg-mediumGray rounded-full py-4 px-2 depDate"
                            id="depDate"
                            value={departDate}
                            onChange={(e) => setDepartDate(e.target.value)}
                        />
                    </div>

                    {tripType === "twoway" && (
                        <div className="flex flex-col return">
                            <p>Return</p>
                            <input
                                type="date"
                                className="text-center text-white bg-mediumGray rounded-full py-4 px-2 arrDate"
                                id="arrDate"
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex flex-col passengers">
                        <p>Passengers</p>
                        <input
                            type="number"
                            min="1"
                            placeholder="Passengers"
                            className="text-center text-white bg-mediumGray rounded-full py-4 px-2 focus:outline-none focus:border-mediumGray passCount"
                            id="passCount"
                            value={passengers}
                            onChange={(e) => setPassengers(e.target.value)}
                            onInput={(e) => {
                                if (e.target.value < 1) e.target.value = 1;
                            }}
                        />
                    </div>
                </div>

                <div className="py-4 searchButton">
                    <button
                        className=" p-2 hover:bg-mediumGray mt-5 block mx-auto border rounded-full"
                        onClick={handleSearch}
                    >
                        Search For Flights
                    </button>
                </div>
            </div>

            {/* Promotional Content */}
            <div className="mt-10 gap-x-50 text-center mx-auto items-center px-8 w-full justify-between flex flex-row pros">
                <div className="leftPros">
                    <p>Best Prices</p>
                    <img className="block mx-auto" src="/Images/Lektuvas.png" alt="Plane icon" />
                    <p>Compare prices from hundreds of airlines to find the best deals</p>
                </div>

                <div className="middlePros">
                    <p>Easy Booking</p>
                    <img className="block mx-auto" src="/Images/Lektuvas.png" alt="Plane icon" />
                    <p>Simple and secure booking process in just a few clicks</p>
                </div>

                <div className="rightPros">
                    <p>Best Prices</p>
                    <img className="block mx-auto" src="/Images/Lektuvas.png" alt="Plane icon" />
                    <p>Our customer service team is here to help anytime you need</p>
                </div>
            </div>

            <div className="mt-10">
                <hr />
            </div>
            <div className="my-5 text-center bottomPage">
                <p>© 2025 FreeFly. Your trusted flight booking platform.</p>
            </div>
            {/* 🔵 ADDED — loading overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-darkGray p-6 rounded-xl text-white text-center w-[320px] border border-white/10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4" />
                        <p className="text-lg font-medium">{messages[msgIndex]}</p>
                        <p className="text-sm opacity-70 mt-1">
                            This may take a few seconds…
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}