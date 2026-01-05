import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { API_URL } from "../config";

export default function Ticket() {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        async function loadTicket() {
            try {
                const res = await fetch(
                    `${API_URL}/api/tickets/${bookingId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!res.ok) throw new Error();
                setTicket(await res.json());
            } catch {
                setError("Unable to load ticket");
            } finally {
                setLoading(false);
            }
        }
        loadTicket();
    }, [bookingId, token]);

    if (loading) return <Centered>Loading ticket…</Centered>;
    if (error || !ticket) return <Centered>{error}</Centered>;

    /* ---------- PDF GENERATION ---------- */
    const downloadPDF = async () => {
        const pdf = new jsPDF("p", "mm", "a4");

        let y = 20;

        pdf.setFontSize(20);
        pdf.text("Flight Ticket", 20, y);
        y += 10;

        for (const flight of ticket.flights) {
            pdf.setFontSize(12);
            pdf.text(
                `${flight.direction === "RETURN" ? "Return" : "Outbound"} flight`,
                20,
                y
            );
            y += 6;

            pdf.text(`${flight.from} → ${flight.to}`, 20, y);
            y += 6;

            pdf.text(`Date: ${flight.date}`, 20, y);
            y += 6;

            pdf.text(
                `Time: ${flight.departureTime} – ${flight.arrivalTime}`,
                20,
                y
            );
            y += 10;
        }

        pdf.line(20, y, 190, y);
        y += 8;

        pdf.text("Passengers", 20, y);
        y += 6;

        ticket.passengers.forEach((p) => {
            pdf.text(`${p.firstName} ${p.lastName}`, 25, y);
            y += 6;
        });

        y += 6;
        pdf.line(20, y, 190, y);
        y += 8;

        pdf.text(`Booking ID: ${ticket._id}`, 20, y);

        /* QR CODE */
        const qrData = JSON.stringify({
            bookingId: ticket._id,
            flights: ticket.flights,
        });

        const qrImage = await QRCode.toDataURL(qrData);

        pdf.addImage(qrImage, "PNG", 140, 20, 40, 40);

        pdf.save(`ticket-${ticket._id}.pdf`);
    };

    /* ---------- UI ---------- */
    return (
        <div className="min-h-screen bg-[#5a5a5a] text-white px-6 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-semibold">Your Ticket</h1>
                    <button
                        onClick={() => navigate("/")}
                        className="text-sm hover:underline opacity-80"
                    >
                        ← Back to main page
                    </button>
                </div>

                <div className="bg-darkGray rounded-2xl p-8 border border-white/10">
                    {/* FLIGHTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {ticket.flights.map((f, i) => (
                            <div
                                key={i}
                                className="bg-black/30 rounded-xl p-5 border border-white/10"
                            >
                                <p className="text-sm opacity-70">
                                    {f.direction === "RETURN"
                                        ? "Return flight"
                                        : "Outbound flight"}
                                </p>
                                <p className="text-xl font-semibold">
                                    {f.from} → {f.to}
                                </p>
                                <p className="text-sm opacity-70">{f.date}</p>
                                <p className="text-sm">
                                    {f.departureTime} – {f.arrivalTime}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* PASSENGERS */}
                    <div className="border-t border-white/10 pt-6 mb-6">
                        <p className="text-sm opacity-70 mb-2">Passengers</p>
                        {ticket.passengers.map((p, i) => (
                            <p key={i} className="text-lg">
                                {p.firstName} {p.lastName}
                            </p>
                        ))}
                    </div>

                    {/* FOOTER */}
                    <div className="border-t border-white/10 pt-6 flex justify-between items-center">
                        <div>
                            <p className="text-sm opacity-70">Booking ID</p>
                            <p className="font-mono text-sm">{ticket._id}</p>
                        </div>

                        <div className="bg-white p-2 rounded">
                            <QRCodeCanvas
                                value={ticket._id}
                                size={100}
                                bgColor="#ffffff"
                                fgColor="#000000"
                            />
                        </div>

                        <button
                            onClick={downloadPDF}
                            className="px-6 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200"
                        >
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Helper */
function Centered({ children }) {
    return (
        <div className="min-h-screen bg-[#5a5a5a] flex items-center justify-center text-white">
            {children}
        </div>
    );
}
