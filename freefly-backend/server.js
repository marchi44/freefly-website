require('dotenv').config({ path: __dirname + '/.env' });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./User");
const path = require("path");
const Amadeus = require('amadeus');
const util = require('./util.js');
const mongoRoutes = require("./MongoDB");

const app = express();
const PORT = process.env.PORT || 8383;

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

// Paprastas oro uostu sarasas
const airports = [
  // Lietuva
  { id: 1, name: "Vilnius International Airport", iataCode: "VNO", cityName: "Vilnius", countryCode: "LT" },
  { id: 2, name: "Kaunas Airport", iataCode: "KUN", cityName: "Kaunas", countryCode: "LT" },
  { id: 3, name: "Palanga International Airport", iataCode: "PLQ", cityName: "Palanga", countryCode: "LT" },
  
  // Latvija
  { id: 4, name: "Riga International Airport", iataCode: "RIX", cityName: "Riga", countryCode: "LV" },
  
  // Lenkija
  { id: 5, name: "Warsaw Chopin Airport", iataCode: "WAW", cityName: "Warsaw", countryCode: "PL" },

  // Jungtinė Karalystė
  { id: 6, name: "London Heathrow Airport", iataCode: "LHR", cityName: "London", countryCode: "GB" },
  { id: 7, name: "London Gatwick Airport", iataCode: "LGW", cityName: "London", countryCode: "GB" },
  
  // Prancūzija
  { id: 8, name: "Paris Charles de Gaulle Airport", iataCode: "CDG", cityName: "Paris", countryCode: "FR" },
  
  // Vokietija
  { id: 9, name: "Frankfurt Airport", iataCode: "FRA", cityName: "Frankfurt am Main", countryCode: "DE" },
  { id: 10, name: "Berlin Brandenburg Airport", iataCode: "BER", cityName: "Berlin", countryCode: "DE" },

  // Nyderlandai
  { id: 11, name: "Amsterdam Schiphol Airport", iataCode: "AMS", cityName: "Amsterdam", countryCode: "NL" },

  // Belgija
  { id: 12, name: "Brussels Airport", iataCode: "BRU", cityName: "Brussels", countryCode: "BE" },

  // Italija
  { id: 13, name: "Rome Fiumicino Airport", iataCode: "FCO", cityName: "Rome", countryCode: "IT" },
  { id: 14, name: "Milan Malpensa Airport", iataCode: "MXP", cityName: "Milan", countryCode: "IT" },

  // Ispanija
  { id: 15, name: "Madrid-Barajas Adolfo Suárez Airport", iataCode: "MAD", cityName: "Madrid", countryCode: "ES" },
  { id: 16, name: "Barcelona El Prat Airport", iataCode: "BCN", cityName: "Barcelona", countryCode: "ES" },

  // Austrija
  { id: 17, name: "Vienna International Airport", iataCode: "VIE", cityName: "Vienna", countryCode: "AT" },

  // Šveicarija
  { id: 18, name: "Zurich Airport", iataCode: "ZRH", cityName: "Zurich", countryCode: "CH" },

  // Jungtiniai Arabų Emyratai
  { id: 19, name: "Dubai International Airport", iataCode: "DXB", cityName: "Dubai", countryCode: "AE" },

  // Turkija
  { id: 20, name: "Istanbul Airport", iataCode: "IST", cityName: "Istanbul", countryCode: "TR" },

  // JAV
  { id: 21, name: "New York John F. Kennedy International Airport", iataCode: "JFK", cityName: "New York", countryCode: "US" },
  { id: 22, name: "Los Angeles International Airport", iataCode: "LAX", cityName: "Los Angeles", countryCode: "US" },

  // Švedija
  { id: 23, name: "Stockholm Arlanda Airport", iataCode: "ARN", cityName: "Stockholm", countryCode: "SE" },

  // Danija
  { id: 24, name: "Copenhagen Airport", iataCode: "CPH", cityName: "Copenhagen", countryCode: "DK" },

  // Suomija
  { id: 25, name: "Helsinki-Vantaa Airport", iataCode: "HEL", cityName: "Helsinki", countryCode: "FI" },

  // Norvegija
  { id: 26, name: "Oslo Gardermoen Airport", iataCode: "OSL", cityName: "Oslo", countryCode: "NO" },

  // Islandija
  { id: 27, name: "Keflavik International Airport", iataCode: "KEF", cityName: "Reykjavik", countryCode: "IS" },

  // Portugalija
  { id: 28, name: "Lisbon Humberto Delgado Airport", iataCode: "LIS", cityName: "Lisbon", countryCode: "PT" },
  
  // Graikija
  { id: 29, name: "Athens Eleftherios Venizelos Airport", iataCode: "ATH", cityName: "Athens", countryCode: "GR" },

  // Lenkija
  { id: 30, name: "Kraków John Paul II International Airport", iataCode: "KRK", cityName: "Kraków", countryCode: "PL" },
  
  // Kroatija
  { id: 31, name: "Zagreb Airport", iataCode: "ZAG", cityName: "Zagreb", countryCode: "HR" },

  // Čekija
  { id: 32, name: "Václav Havel Airport Prague", iataCode: "PRG", cityName: "Prague", countryCode: "CZ" },

  // Vengrija
  { id: 33, name: "Budapest Liszt Ferenc International Airport", iataCode: "BUD", cityName: "Budapest", countryCode: "HU" },

  // Lenkija
  { id: 34, name: "Gdańsk Lech Wałęsa Airport", iataCode: "GDN", cityName: "Gdańsk", countryCode: "PL" },

  // Rumunija
  { id: 35, name: "Henri Coandă International Airport", iataCode: "OTP", cityName: "Bucharest", countryCode: "RO" },

  // Bulgarija
  { id: 36, name: "Sofia Airport", iataCode: "SOF", cityName: "Sofia", countryCode: "BG" },

  // Serbija
  { id: 37, name: "Belgrade Nikola Tesla Airport", iataCode: "BEG", cityName: "Belgrade", countryCode: "RS" },

  // Albānija
  { id: 38, name: "Tirana International Airport Nënë Tereza", iataCode: "TIA", cityName: "Tirana", countryCode: "AL" }
];
function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, "secretkey");
        req.user = { id: decoded.id };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", mongoRoutes);

app.get("/api/airports", (req, res) => {
    const q = (req.query.q || "").trim().toLowerCase();

    if (q.length < 1) {
        return res.json([]);
    }

    const matches = airports.filter(a => {
        return (
            a.name.toLowerCase().includes(q) ||
            a.cityName.toLowerCase().includes(q) ||
            a.iataCode.toLowerCase().includes(q)
        );
    });

    res.json(matches);
});

app.get('/oneway/:dep/:ari/:begin/:type/:adults/:children/:infants', async (req, res) => {
    const { dep, ari, begin, type, adults, children, infants } = req.params;
    const fromDate = util.stringToDate(begin);
    try {
        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: dep.toUpperCase(),
            destinationLocationCode: ari.toUpperCase(),
            departureDate: fromDate.toISOString().split('T')[0],
            adults: parseInt(adults),
            children: parseInt(children),
            infants: parseInt(infants),
            currencyCode: 'EUR',
            travelClass: util.typeToClass(type),
            max: 250
        });

    const offers = response.data
      .map((offer) => {
        const itinerary = offer.itineraries?.[0];
        const segments = itinerary?.segments || [];
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];
        if (!firstSeg || !lastSeg) return null;

        const mappedSegments = segments.map((s) => ({
          flightNumber: `${s.carrierCode}${s.number}`,
          departureAirport: s.departure.iataCode,
          arrivalAirport: s.arrival.iataCode,
          departureTime: s.departure.at,
          arrivalTime: s.arrival.at,
          duration: s.duration
        }));

        return {
          airline: offer.validatingAirlineCodes?.[0],
          totalPriceEUR: offer.price?.total,
          passengers: {
            adults: parseInt(adults),
            children: parseInt(children),
            infants: parseInt(infants)
          },

          // summary (for list)
          departureAirport: firstSeg.departure.iataCode,
          arrivalAirport: lastSeg.arrival.iataCode,     // FINAL destination
          departureTime: firstSeg.departure.at,
          arrivalTime: lastSeg.arrival.at,
          flightDuration: itinerary.duration,
          stopsCount: Math.max(0, segments.length - 1),

          // details (for click)
          segments: mappedSegments
        };
      })
      .filter(Boolean)
      .filter((o) => o.arrivalAirport === ari.toUpperCase()); // ensure final = requested

        res.json(offers);
    } catch (err) {
        console.error('Error getting one-way flights:', err);
        res.status(500).json({ error: 'Failed to get flights' });
    }
});

app.get('/return/:dep/:ari/:begin/:end/:type/:adults/:children/:infants', async (req, res) => {
    const { dep, ari, begin, end, type, adults, children, infants } = req.params;

    const fromDate = util.stringToDate(begin);
    const toDate = util.stringToDate(end);

    try {
        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: dep.toUpperCase(),
            destinationLocationCode: ari.toUpperCase(),
            departureDate: fromDate.toISOString().split('T')[0],
            returnDate: toDate.toISOString().split('T')[0],
            adults: parseInt(adults),
            children: parseInt(children),
            infants: parseInt(infants),
            currencyCode: 'EUR',
            travelClass: util.typeToClass(type),
            max: 250
        });

        const offers = response.data
            .map((offer) => {
                const [outbound, inbound] = offer.itineraries || [];
                if (!outbound || !inbound) return null;

                const outSegs = Array.isArray(outbound.segments) ? outbound.segments : [];
                const inSegs = Array.isArray(inbound.segments) ? inbound.segments : [];
                const outFirst = outSegs[0];
                const outLast = outSegs[outSegs.length - 1];
                const inFirst = inSegs[0];
                const inLast = inSegs[inSegs.length - 1];
                if (!outFirst || !outLast || !inFirst || !inLast) return null;

                const mapSeg = (s) => ({
                    flightNumber: `${s.carrierCode}${s.number}`,
                    departureAirport: s.departure.iataCode,
                    arrivalAirport: s.arrival.iataCode,
                    departureTime: s.departure.at,
                    arrivalTime: s.arrival.at,
                    duration: s.duration,
                });

                return {
                    airline: offer.validatingAirlineCodes?.[0],
                    totalPriceEUR: offer.price?.total,
                    passengers: {
                        adults: parseInt(adults),
                        children: parseInt(children),
                        infants: parseInt(infants),
                    },
                    outbound: {
                        flightNumber: `${outFirst.carrierCode}${outFirst.number}`,
                        departureAirport: outFirst.departure.iataCode,
                        arrivalAirport: outLast.arrival.iataCode,
                        departureTime: outFirst.departure.at,
                        arrivalTime: outLast.arrival.at,
                        duration: outbound.duration,
                        stopsCount: Math.max(0, outSegs.length - 1),
                        segments: outSegs.map(mapSeg),
                    },
                    inbound: {
                        flightNumber: `${inFirst.carrierCode}${inFirst.number}`,
                        departureAirport: inFirst.departure.iataCode,
                        arrivalAirport: inLast.arrival.iataCode,
                        departureTime: inFirst.departure.at,
                        arrivalTime: inLast.arrival.at,
                        duration: inbound.duration,
                        stopsCount: Math.max(0, inSegs.length - 1),
                        segments: inSegs.map(mapSeg),
                    },
                };
            })
            .filter(Boolean);

        res.json(offers);
    } catch (err) {
        console.error('Error getting return flights:', err);
        res.status(500).json({ error: 'Failed getting return flights' });
    }
});

app.get("/api/profile", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "name surname email dob"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error("PROFILE ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET wallet info (balance + transactions)
app.get("/api/wallet", auth, async (req, res) => {
    try {
        // ✅ FIRST: declare user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ THEN: safely use user
        if (!user.wallet) {
            user.wallet = {
                balance: 0,
                transactions: [],
            };
            await user.save();
        }

        res.json({
            balance: user.wallet.balance,
            transactions: user.wallet.transactions,
        });
    } catch (err) {
        console.error("WALLET ERROR:", err);
        res.status(500).json({ message: "Wallet error" });
    }
});





// TOP UP wallet
app.post("/api/wallet/top-up", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const amount = Number(req.body.amount);
        if (!user.wallet) {
            user.wallet = { balance: 0, transactions: [] };
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.wallet.balance += amount;
        user.wallet.transactions.push({
            amount,
            type: "TOP_UP",
        });

        await user.save();

        res.json({
            message: "Wallet topped up",
            balance: user.wallet.balance,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/wallet/buy-ticket", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { price, passengers, flights } = req.body;
        const amount = Number(price);

        // --- VALIDATION ---
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid price" });
        }

        if (!Array.isArray(passengers) || passengers.length === 0) {
            return res.status(400).json({ message: "Passengers missing" });
        }

        if (!Array.isArray(flights) || flights.length === 0) {
            return res.status(400).json({ message: "Flights missing" });
        }

        if (user.wallet.balance < amount) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }

        // --- WALLET UPDATE ---
        user.wallet.balance -= amount;

        user.wallet.transactions.push({
            amount,
            type: "TICKET_PURCHASE",
            createdAt: new Date(),
        });

        // --- BOOKING CREATION ---
        const booking = {
            passengers,
            flights,               // ✅ THIS IS THE KEY FIX
            price: amount,
            purchasedAt: new Date(),
        };

        user.bookings = user.bookings || [];
        user.bookings.push(booking);

        await user.save();

        const bookingId = user.bookings[user.bookings.length - 1]._id;

        res.json({
            message: "Ticket purchased successfully",
            balance: user.wallet.balance,
            bookingId,
        });

    } catch (error) {
        console.error("BUY TICKET ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.get("/api/bookings", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("bookings");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user.bookings || []);
    } catch (err) {
        console.error("BOOKINGS ERROR:", err);
        res.status(500).json({ message: "Failed to load bookings" });
    }
});
app.get("/api/tickets/:bookingId", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || !Array.isArray(user.bookings)) {
            return res.status(404).json({ message: "No bookings found" });
        }

        const booking = user.bookings.id(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // ✅ RETURN EXACT STRUCTURE TICKET.JSX EXPECTS
        res.json({
            _id: booking._id,
            passengers: booking.passengers || [],
            flights: booking.flights || [],
            price: booking.price,
            purchasedAt: booking.purchasedAt,
        });

    } catch (error) {
        console.error("LOAD TICKET ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// GET all tickets for logged in user
app.get("/api/tickets", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user.bookings || []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log("Backend running on http://localhost:" + PORT);
  console.log("Backend test: http://localhost:" + PORT + "/oneway/LON/NYC/251215/0/2/1/1");
});
//push