import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function pickDate(isoString) {
  if (!isoString || typeof isoString !== "string") return "";
  return isoString.slice(0, 10);
}

function pickTime(isoString) {
  if (!isoString || typeof isoString !== "string") return "";
  return isoString.slice(11, 16);
}


function formatPriceEUR(value) {
  const n = typeof value === "number" ? value : Number(value);
  const locale = typeof navigator !== "undefined" && navigator.language ? navigator.language : "lt-LT";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(isNaN(n) ? 0 : n);
  } catch {
    return `${isNaN(n) ? "" : n} €`;
  }
}

export default function Booking() {
  const location = useLocation();
  const navState = location.state || {};
  const offer = navState.offer || null;
  const search = navState.search || null;
  const lockAirports = Boolean(offer);
  const lockFlightFields = Boolean(offer);
  const navigate = useNavigate();

  const inferredTripType = offer && offer.inbound ? "round_trip" : "one_way";
  const [tripType, setTripType] = useState(inferredTripType);

  const isRoundTrip = Boolean(offer && offer.inbound);
  const fromCode = isRoundTrip ? offer?.outbound?.departureAirport : offer?.departureAirport;
  const toCode = isRoundTrip ? offer?.outbound?.arrivalAirport : offer?.arrivalAirport;
  const departPrefill = isRoundTrip ? pickDate(offer?.outbound?.departureTime) : pickDate(offer?.departureTime);
  const returnPrefill = isRoundTrip ? pickDate(offer?.inbound?.departureTime) : "";
  const adultsDefault = String((offer?.passengers?.adults ?? search?.adults ?? 1));
  const childrenDefault = String((offer?.passengers?.children ?? search?.children ?? 0));

  const [adultCount, setAdultCount] = useState(Number(adultsDefault));
  const [childCount, setChildCount] = useState(Number(childrenDefault));

  const totalPassengers = useMemo(() => adultCount + childCount, [adultCount, childCount]);

  const emptyPassenger = (type = "adult") => ({
    type, // "adult" | "child"
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    passport: "",
    nationality: "",
  });

  const [passengers, setPassengers] = useState(() => {
    const adults = Array.from({ length: Number(adultsDefault) }, () => emptyPassenger("adult"));
    const children = Array.from({ length: Number(childrenDefault) }, () => emptyPassenger("child"));
    return [...adults, ...children];
  });

  useEffect(() => {
    setPassengers((prev) => {
      const next = [...prev];

      // adults
      for (let i = 0; i < adultCount; i++) {
        if (!next[i]) next[i] = emptyPassenger("adult");
        next[i].type = "adult";
      }

      // children
      for (let j = 0; j < childCount; j++) {
        const idx = adultCount + j;
        if (!next[idx]) next[idx] = emptyPassenger("child");
        next[idx].type = "child";
      }

      return next.slice(0, adultCount + childCount);
    });
  }, [adultCount, childCount]);

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1️⃣ Validate passengers
    const allValid = passengers.every(
        (p) =>
            p.firstName &&
            p.lastName &&
            p.email &&
            p.phone &&
            p.dob &&
            p.passport &&
            p.nationality
    );

    if (!allValid) {
      alert("Please fill in all passenger details.");
      return;
    }

    if (!offer || !offer.totalPriceEUR) {
      alert("Missing flight price.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // 2️⃣ Build flights array (THIS IS THE FIX)
    const flights = [];

    // OUTBOUND (always exists)
    const outboundSource = offer.outbound ?? offer;

    flights.push({
      direction: "OUTBOUND",
      from: outboundSource.departureAirport,
      to: outboundSource.arrivalAirport,
      date: pickDate(outboundSource.departureTime),
      departureTime: pickTime(outboundSource.departureTime),
      arrivalTime: pickTime(outboundSource.arrivalTime),
    });

    // RETURN (only if round trip)
    if (offer.inbound) {
      flights.push({
        direction: "RETURN",
        from: offer.inbound.departureAirport,
        to: offer.inbound.arrivalAirport,
        date: pickDate(offer.inbound.departureTime),
        departureTime: pickTime(offer.inbound.departureTime),
        arrivalTime: pickTime(offer.inbound.arrivalTime),
      });
    }

    try {
      const res = await fetch(`${API_URL}/api/wallet/buy-ticket`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price: Number(offer.totalPriceEUR),
          passengers,
          flights, // ✅ THIS is what Ticket.jsx expects
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Ticket purchase failed");
        return;
      }

      navigate(`/ticket/${data.bookingId}`);
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };


  return (
    <div className="min-h-screen bg-mediumGray text-white">
      <main className="max-w-4xl mx-auto mt-8 px-4 pb-10">
        <h1 className="text-3xl font-semibold mb-2">Booking Form</h1>
        <p className="text-sm text-gray-200 mb-6">
          Fill out the form below: select your flight, enter passenger information, and choose additional services.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-darkGray rounded-2xl p-6 space-y-6 [&_input]:!text-white [&_select]:!text-white [&_textarea]:!text-white [&_input::placeholder]:!text-white/70 [&_textarea::placeholder]:!text-white/70 [&_input]:border [&_select]:border [&_textarea]:border [&_input]:border-white/30 [&_select]:border-white/30 [&_textarea]:border-white/30 [&_input]:bg-transparent [&_select]:bg-transparent [&_textarea]:bg-transparent [&_input:focus]:outline-none [&_select:focus]:outline-none [&_textarea:focus]:outline-none [&_input:focus]:ring-2 [&_select:focus]:ring-2 [&_textarea:focus]:ring-2 [&_input:focus]:ring-white/40 [&_select:focus]:ring-white/40 [&_textarea:focus]:ring-white/40 [&_input:focus]:border-white [&_select:focus]:border-white [&_textarea:focus]:border-white [&_input:disabled]:opacity-60 [&_select:disabled]:opacity-60 [&_textarea:disabled]:opacity-60 [&_input:disabled]:border-white/20 [&_select:disabled]:border-white/20 [&_textarea:disabled]:border-white/20 [&_option]:!text-black [&_option]:bg-white"
        >
          {}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-mediumGray pb-2">Flight selection</h2>

            {/*            <div>
              <p className="mb-2 text-sm">Trip type</p>
            <div className="flex gap-6 items-center">
              <label className={`flex items-center gap-2 text-sm ${lockFlightFields ? "opacity-60 cursor-not-allowed" : ""}`}>
                <input
                  type="radio"
                  name="tripType"
                  value="round_trip"
                  checked={tripType === "round_trip"}
                  onChange={() => setTripType("round_trip")}
                  disabled={lockFlightFields}
                  className="h-4 w-4 accent-blue-500 !border-0 !bg-transparent !ring-0"
                />
                Round trip
              </label>

              <label className={`flex items-center gap-2 text-sm ${lockFlightFields ? "opacity-60 cursor-not-allowed" : ""}`}>
                <input
                  type="radio"
                  name="tripType"
                  value="one_way"
                  checked={tripType === "one_way"}
                  onChange={() => setTripType("one_way")}
                  disabled={lockFlightFields}
                  className="h-4 w-4 accent-blue-500 !border-0 !bg-transparent !ring-0"
                />
                One way
              </label>
            </div>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col text-sm">
                <label htmlFor="from">Departure city / airport</label>

                {}
                {lockAirports && <input type="hidden" name="from" value={fromCode || ""} />}

                <input
                  id="from"
                  name="from"
                  type="text"
                  className={`mt-1 px-2 py-1 rounded-md text-black ${lockAirports ? "cursor-not-allowed opacity-60" : ""}`}
                  placeholder="e.g., Vilnius (VNO)"
                  defaultValue={fromCode || ""}
                  disabled={lockAirports}
                  required
                />
              </div>

              <div className="flex flex-col text-sm">
                <label htmlFor="to">Arrival city / airport</label>

                {lockAirports && <input type="hidden" name="to" value={toCode || ""} />}

                <input
                  id="to"
                  name="to"
                  type="text"
                  className={`mt-1 px-2 py-1 rounded-md text-black ${lockAirports ? "cursor-not-allowed opacity-60" : ""}`}
                  placeholder="e.g., London (LHR)"
                  defaultValue={toCode || ""}
                  disabled={lockAirports}
                  required
                />
              </div>

              <div className="flex flex-col text-sm">
                <label htmlFor="departure_date">Departure date</label>
                {lockFlightFields && (
                  <input type="hidden" name="departure_date" value={departPrefill || search?.departDate || ""} />
                )}

                <input
                  id="departure_date"
                  name="departure_date"
                  type="date"
                  className={`mt-1 px-2 py-1 rounded-md text-black ${lockFlightFields ? "cursor-not-allowed opacity-60" : ""}`}
                  defaultValue={departPrefill || search?.departDate || ""}
                  disabled={lockFlightFields}
                  required
                />
              </div>

              {tripType === "round_trip" && (
                <div className="flex flex-col text-sm">
                  <label htmlFor="return_date">Return date</label>

                  {lockFlightFields && (
                    <input type="hidden" name="return_date" value={returnPrefill || search?.returnDate || ""} />
                  )}

                  <input
                    id="return_date"
                    name="return_date"
                    type="date"
                    className={`mt-1 px-2 py-1 rounded-md text-black ${lockFlightFields ? "cursor-not-allowed opacity-60" : ""}`}
                    defaultValue={returnPrefill || search?.returnDate || ""}
                    disabled={lockFlightFields}
                  />
                </div>
              )}
            </div>

            {/*}            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col text-sm">
                <label htmlFor="adults">Number of adults</label>
                <select
                  id="adults"
                  className="mt-1 px-2 py-1 rounded-md text-black"
                  value={String(adultCount)}
                  onChange={(e) => setAdultCount(Number(e.target.value))}
                  disabled={lockFlightFields}
                  required
                >
                  <option value="1">1 adult</option>
                  <option value="2">2 adults</option>
                  <option value="3">3 adults</option>
                  <option value="4">4 adults</option>
                </select>
              </div>

              <div className="flex flex-col text-sm">
                <label htmlFor="children">Number of children</label>
                <select
                  id="children"
                  className="mt-1 px-2 py-1 rounded-md text-black"
                  value={String(childCount)}
                  onChange={(e) => setChildCount(Number(e.target.value))}
                  disabled={lockFlightFields}
                >
                  <option value="0">0 children</option>
                  <option value="1">1 child</option>
                  <option value="2">2 children</option>
                  <option value="3">3 children</option>
                </select>
              </div>
            </div>*/}
          </section>

          {}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-mediumGray pb-2">Passenger information</h2>

            {/*            <p className="text-sm text-gray-200">
              Total passengers: {totalPassengers} (adults: {adultCount}, children: {childCount})
            </p>*/}

            {passengers.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-white/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Passenger #{idx + 1} ({p.type === "adult" ? "Adult" : "Child"})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col text-sm">
                    <label>First name</label>
                    <input
                      type="text"
                      className="mt-1 px-2 py-1 rounded-md text-black"
                      value={p.firstName}
                      onChange={(e) => updatePassenger(idx, "firstName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col text-sm">
                    <label>Last name</label>
                    <input
                      type="text"
                      className="mt-1 px-2 py-1 rounded-md text-black"
                      value={p.lastName}
                      onChange={(e) => updatePassenger(idx, "lastName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col text-sm">
                    <label>Email</label>
                    <input
                      type="email"
                      className="mt-1 px-2 py-1 rounded-md text-black"
                      value={p.email}
                      onChange={(e) => updatePassenger(idx, "email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col text-sm">
                    <label>Phone number</label>
                    <input
                      type="tel"
                      className="mt-1 px-2 py-1 rounded-md text-black"
                      placeholder="+370..."
                      value={p.phone}
                      onChange={(e) => updatePassenger(idx, "phone", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col text-sm">
                    <label>Date of birth</label>
                    <input
                      type="date"
                      className="mt-1 px-2 py-1 rounded-md text-black"
                      value={p.dob}
                      onChange={(e) => updatePassenger(idx, "dob", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col text-sm">
                    <label>Passport / ID number</label>
                    <input
                      type="text"
                      className="mt-1 px-2 py-1 rounded-md text-black"
                      value={p.passport}
                      onChange={(e) => updatePassenger(idx, "passport", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col text-sm md:col-span-2">
                    <label>Nationality</label>
                    <input
                      type="text"
                      className="mt-1 px-2 py-1 rounded-md text-black"
                      placeholder="e.g., Republic of Lithuania"
                      value={p.nationality}
                      onChange={(e) => updatePassenger(idx, "nationality", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-mediumGray pb-2">Flight options</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col text-sm">
                <label htmlFor="cabin_class">Cabin class</label>
                <select id="cabin_class" className="mt-1 px-2 py-1 rounded-md text-black" defaultValue="economy">
                  <option value="economy">Economy</option>
                  <option value="premium">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
              </div>

              <div className="flex flex-col text-sm">
                <label htmlFor="seat_pref">Seat preference</label>
                <select id="seat_pref" className="mt-1 px-2 py-1 rounded-md text-black" defaultValue="no_pref">
                  <option value="no_pref">No preference</option>
                  <option value="window">Window</option>
                  <option value="aisle">Aisle</option>
                  <option value="front">Closer to the front</option>
                  <option value="back">Closer to the back</option>
                </select>
              </div>

              <div className="flex flex-col text-sm">
                <label htmlFor="extra_baggage">Extra baggage</label>
                <select id="extra_baggage" className="mt-1 px-2 py-1 rounded-md text-black" defaultValue="0">
                  <option value="0">No extra baggage</option>
                  <option value="15">+15 kg</option>
                  <option value="20">+20 kg</option>
                  <option value="32">+32 kg</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col text-sm">
              <label className="mb-2">Additional services</label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="priority_boarding" />
                  Priority boarding
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="insurance" />
                  Travel insurance
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="sms_notifications" />
                  SMS / email notifications about flight changes
                </label>
              </div>
            </div>

            <div className="flex flex-col text-sm">
              <label htmlFor="notes">Additional information / requests</label>
              <textarea
                id="notes"
                rows="3"
                className="mt-1 px-2 py-1 rounded-md text-black"
                placeholder="e.g., special assistance needs, baggage notes, seating requests..."
              ></textarea>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input id="terms" type="checkbox" required />
              <label htmlFor="terms">I confirm the information provided is correct and I agree to the purchase terms.</label>
            </div>
          </section>

          <div className="flex items-center justify-between gap-4">
            {offer?.totalPriceEUR ? (
              <div className="text-left text-lg font-semibold whitespace-nowrap">
                <span className="text-gray-200 mr-2">Total:</span>
                <span>{formatPriceEUR(offer.totalPriceEUR)}</span>
              </div>
            ) : (
              <div></div>
            )}
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Confirm booking
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
