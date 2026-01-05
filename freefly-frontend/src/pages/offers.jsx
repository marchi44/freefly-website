import {useEffect, useMemo, useState, useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";

function DualRange({
    min,
    max,
    step = 1,
    low,
    high,
    onChange,
    disabled = false,
    ariaLabelLow,
    ariaLabelHigh,
}) {
    const [l, setL] = useState(low);
    const [h, setH] = useState(high);

    const [active, setActive] = useState(null); // 'low' | 'high' | null
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef(null);
    const pointerIdRef = useRef(null);

    useEffect(() => { setL(low); }, [low]);
    useEffect(() => { setH(high); }, [high]);

    const range = Math.max(0, (max ?? 0) - (min ?? 0));
    const toPercent = (v) => range === 0 ? 0 : ((v - min) * 100) / range;

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    const snap = (v) => {
        const s = Number(step) || 1;
        const snapped = Math.round((v - min) / s) * s + min;
        return clamp(snapped, min, max);
    };

    const clampedLow = clamp(Math.min(l, h), min, max);
    const clampedHigh = clamp(Math.max(l, h), min, max);

    const leftPct = toPercent(clampedLow);
    const rightPct = toPercent(clampedHigh);

    const decideActiveFromX = (clientX) => {
        const el = containerRef.current;
        if (!el) return 'low';
        const rect = el.getBoundingClientRect();
        const pct = rect.width > 0 ? ((clientX - rect.left) / rect.width) * 100 : 0;
        const mid = (leftPct + rightPct) / 2;
        if (pct > mid + 1) return 'high';
        if (pct < mid - 1) return 'low';
        const distLow = Math.abs(pct - leftPct);
        const distHigh = Math.abs(pct - rightPct);
        return distLow <= distHigh ? 'low' : 'high';
    };

    const valueFromClientX = (clientX) => {
        const el = containerRef.current;
        if (!el) return min;
        const rect = el.getBoundingClientRect();
        const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
        const raw = min + ratio * range;
        return snap(raw);
    };

    const startPointerDrag = (e) => {
        if (disabled) return;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        const id = e.pointerId;
        pointerIdRef.current = id;
        const chosen = decideActiveFromX(e.clientX);
        setActive(chosen);
        setDragging(true);
        const el = containerRef.current;
        try { el && el.setPointerCapture && el.setPointerCapture(id); } catch {}
        // Immediate update to the chosen thumb
        const v = valueFromClientX(e.clientX);
        if (chosen === 'low') {
            const nextL = Math.min(v, h);
            setL(nextL);
            onChange && onChange(nextL, Math.max(h, nextL));
        } else {
            const nextH = Math.max(v, l);
            setH(nextH);
            onChange && onChange(Math.min(l, nextH), nextH);
        }
    };

    const movePointerDrag = (e) => {
        if (!dragging) return;
        const v = valueFromClientX(e.clientX);
        if (active === 'low') {
            const nextL = Math.min(v, h);
            setL(nextL);
            onChange && onChange(nextL, Math.max(h, nextL));
        } else if (active === 'high') {
            const nextH = Math.max(v, l);
            setH(nextH);
            onChange && onChange(Math.min(l, nextH), nextH);
        }
    };

    const endPointerDrag = (e) => {
        const el = containerRef.current;
        const id = pointerIdRef.current;
        try { el && id != null && el.releasePointerCapture && el.releasePointerCapture(id); } catch {}
        pointerIdRef.current = null;
        setDragging(false);
        setActive(null);
    };

    return (
        <div
            ref={containerRef}
            className="relative h-8 w-full select-none"
            onPointerDown={startPointerDrag}
            onPointerMove={movePointerDrag}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
        >
            <style>{`
.dual-range-input{ -webkit-appearance:none; appearance:none; background:transparent; }
.dual-range-input::-webkit-slider-runnable-track{ pointer-events:none; }
.dual-range-input::-webkit-slider-thumb{ pointer-events:auto; position:relative; z-index:1; }
.dual-range-input::-moz-range-track{ pointer-events:none; }
.dual-range-input::-moz-range-thumb{ pointer-events:auto; }
            `}</style>
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded bg-white/20" />
            <div
                className="absolute top-1/2 -translate-y-1/2 h-1 rounded bg-white"
                style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
            />

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={clampedLow}
                disabled={disabled}
                aria-label={ariaLabelLow}
                onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isFinite(v)) return;
                    const nextL = Math.min(v, h);
                    setL(nextL);
                    onChange && onChange(nextL, Math.max(h, nextL));
                }}
                className="dual-range-input appearance-none bg-transparent absolute top-0 h-8 left-0 right-0"
                style={{ zIndex: 3, pointerEvents: dragging ? 'none' : 'auto' }}
            />

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={clampedHigh}
                disabled={disabled}
                aria-label={ariaLabelHigh}
                onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isFinite(v)) return;
                    const nextH = Math.max(v, l);
                    setH(nextH);
                    onChange && onChange(Math.min(l, nextH), nextH);
                }}
                className="dual-range-input appearance-none bg-transparent absolute top-0 h-8 left-0 right-0"
                style={{ zIndex: 2, pointerEvents: dragging ? 'none' : 'auto' }}
            />
        </div>
    );
}

function formatISODuration(iso) {
    if (!iso || typeof iso !== "string") return "—";
    const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
    if (!m) return iso;
    const days = parseInt(m[1] || "0", 10);
    const hours = parseInt(m[2] || "0", 10) + days * 24;
    const minutes = parseInt(m[3] || "0", 10);
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes || parts.length === 0) parts.push(`${minutes}m`);
    return parts.join(" ");
}

function formatDateTime(isoDateTime) {
    if (!isoDateTime || typeof isoDateTime !== "string") return "";
    const d = new Date(isoDateTime);
    if (isNaN(d.getTime())) {
        const s = isoDateTime.replace("T", " ");
        return s.length >= 16 ? s.slice(0, 16) : s;
    }
    const locale = typeof navigator !== "undefined" && navigator.language ? navigator.language : "lt-LT";
    return d.toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
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

function layoverLabel(prevArrivalISO, nextDepartureISO) {
    if (!prevArrivalISO || !nextDepartureISO) return null;
    const a = new Date(prevArrivalISO);
    const d = new Date(nextDepartureISO);
    if (isNaN(a.getTime()) || isNaN(d.getTime())) return null;
    const diffMs = d.getTime() - a.getTime();
    if (diffMs < 0) return null;
    const totalMin = Math.round(diffMs / 60000);
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ");
}

function parseISODurationToMinutes(iso) {
    if (!iso || typeof iso !== "string") return 0;
    const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
    if (!m) return 0;
    const days = parseInt(m[1] || "0", 10);
    const hours = parseInt(m[2] || "0", 10);
    const minutes = parseInt(m[3] || "0", 10);
    return days * 24 * 60 + hours * 60 + minutes;
}

function getJourneyStopsCount(offer) {
    const isRound = Boolean(offer?.outbound && offer?.inbound);
    if (isRound) {
        const out = Number(offer?.outbound?.stopsCount ?? ((offer?.outbound?.segments?.length || 1) - 1));
        const inn = Number(offer?.inbound?.stopsCount ?? ((offer?.inbound?.segments?.length || 1) - 1));
        return Math.max(0, out) + Math.max(0, inn);
    }
    const one = Number(offer?.stopsCount ?? ((offer?.segments?.length || 1) - 1));
    return Math.max(0, one);
}

function getJourneyDurationMinutes(offer) {
    const isRound = Boolean(offer?.outbound && offer?.inbound);
    if (isRound) {
        const out = parseISODurationToMinutes(offer?.outbound?.duration);
        const inn = parseISODurationToMinutes(offer?.inbound?.duration);
        return out + inn;
    }
    return parseISODurationToMinutes(offer?.flightDuration);
}

function getFirstDeparture(offer) {
    const isRound = Boolean(offer?.outbound && offer?.inbound);
    return new Date(isRound ? offer?.outbound?.departureTime : offer?.departureTime).getTime() || 0;
}

function getOfferKey(offer, idx) {
    const isRound = Boolean(offer?.outbound && offer?.inbound);

    const flightIds = [];
    if (isRound) {
        if (offer?.outbound?.flightNumber) flightIds.push(String(offer.outbound.flightNumber));
        if (offer?.inbound?.flightNumber) flightIds.push(String(offer.inbound.flightNumber));
    } else {
        if (offer?.flightNumber) {
            flightIds.push(String(offer.flightNumber));
        } else if (Array.isArray(offer?.segments)) {
            for (const s of offer.segments) {
                if (s?.flightNumber) flightIds.push(String(s.flightNumber));
            }
        }
    }

    const times = isRound
        ? `${offer?.outbound?.departureTime || ""}-${offer?.inbound?.arrivalTime || ""}`
        : `${offer?.departureTime || ""}-${offer?.arrivalTime || ""}`;

    const price = `${offer?.totalPriceEUR ?? ""}`;
    const base = `${flightIds.join("_")}-${times}-${price}`.trim() || "offer";

    const suffix = typeof idx === 'number' ? `#${idx}` : '';
    return `${base}${suffix}`;
}

function parseHHMMToMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== "string") return null;
    const m = hhmm.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    return h * 60 + min;
}

function getLocalClockMinutes(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
}

function minutesToHHMM(mins) {
    if (!Number.isFinite(mins)) return "00:00";
    const m = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${h}:${mm}`;
}

export default function Offers() {
    const location = useLocation();
    const navigate = useNavigate();

    const { offers: rawOffers = [], search, error } = location.state || {};

    const offers = useMemo(() => (Array.isArray(rawOffers) ? rawOffers : []), [rawOffers]);

    const [expandedKey, setExpandedKey] = useState(null);
    const [stopFilter, setStopFilter] = useState("all"); // all | nonstop | one | twoPlus
    const [sortBy, setSortBy] = useState("stops"); // stops | price | duration | departure

    const derived = useMemo(() => {
        let minPrice = Infinity, maxPrice = -Infinity;
        let minDur = Infinity, maxDur = -Infinity;
        let minDep = 24 * 60, maxDep = 0; // minutes since midnight
        for (const o of offers) {
            const price = Number(o.totalPriceEUR);
            if (Number.isFinite(price)) {
                if (price < minPrice) minPrice = price;
                if (price > maxPrice) maxPrice = price;
            }
            const dur = getJourneyDurationMinutes(o);
            if (Number.isFinite(dur)) {
                if (dur < minDur) minDur = dur;
                if (dur > maxDur) maxDur = dur;
            }
            const isRound = Boolean(o?.outbound && o?.inbound);
            const depIso = isRound ? o?.outbound?.departureTime : o?.departureTime;
            const clock = getLocalClockMinutes(depIso);
            if (clock != null) {
                if (clock < minDep) minDep = clock;
                if (clock > maxDep) maxDep = clock;
            }
        }
        if (!Number.isFinite(minPrice)) minPrice = 0;
        if (!Number.isFinite(maxPrice) || maxPrice < minPrice) maxPrice = minPrice;
        if (!Number.isFinite(minDur)) minDur = 0;
        if (!Number.isFinite(maxDur) || maxDur < minDur) maxDur = minDur;
        if (minDep === 24 * 60) minDep = 0;
        if (maxDep < minDep) maxDep = minDep;
        return { minPrice, maxPrice, minDur, maxDur, minDep, maxDep };
    }, [offers]);

    const [priceMin, setPriceMin] = useState(derived.minPrice);
    const [priceMax, setPriceMax] = useState(derived.maxPrice);
    const [durMin, setDurMin] = useState(derived.minDur);
    const [durMax, setDurMax] = useState(derived.maxDur);
    const [depTimeMin, setDepTimeMin] = useState(() => {
        const h = String(Math.floor(derived.minDep / 60)).padStart(2, "0");
        const m = String(derived.minDep % 60).padStart(2, "0");
        return `${h}:${m}`;
    });
    const [depTimeMax, setDepTimeMax] = useState(() => {
        const h = String(Math.floor(derived.maxDep / 60)).padStart(2, "0");
        const m = String(derived.maxDep % 60).padStart(2, "0");
        return `${h}:${m}`;
    });

    const derivedIn = useMemo(() => {
        let minDepIn = 24 * 60, maxDepIn = 0;
        for (const o of offers) {
            if (o?.inbound) {
                const clock = getLocalClockMinutes(o.inbound?.departureTime);
                if (clock != null) {
                    if (clock < minDepIn) minDepIn = clock;
                    if (clock > maxDepIn) maxDepIn = clock;
                }
            }
        }
        if (minDepIn === 24 * 60) minDepIn = 0;
        if (maxDepIn < minDepIn) maxDepIn = minDepIn;
        return { minDepIn, maxDepIn };
    }, [offers]);

    const [depTimeMinIn, setDepTimeMinIn] = useState(() => minutesToHHMM(0));
    const [depTimeMaxIn, setDepTimeMaxIn] = useState(() => minutesToHHMM(23 * 60 + 59));

    const filteredOffers = useMemo(() => {
        const outMin = parseHHMMToMinutes(depTimeMin);
        const outMax = parseHHMMToMinutes(depTimeMax);
        const inMin = parseHHMMToMinutes(depTimeMinIn);
        const inMax = parseHHMMToMinutes(depTimeMaxIn);
        return offers.filter((o) => {
            const sc = getJourneyStopsCount(o);
            if (stopFilter === "nonstop" && sc !== 0) return false;
            if (stopFilter === "one" && sc !== 1) return false;
            if (stopFilter === "twoPlus" && sc < 2) return false;

            const price = Number(o.totalPriceEUR);
            if (Number.isFinite(price)) {
                if (price < priceMin || price > priceMax) return false;
            }

            const dur = getJourneyDurationMinutes(o);
            if (Number.isFinite(dur)) {
                if (dur < durMin || dur > durMax) return false;
            }

            const isRound = Boolean(o?.outbound && o?.inbound);
            const outISO = isRound ? o?.outbound?.departureTime : o?.departureTime;
            const outClock = getLocalClockMinutes(outISO);
            if (outClock != null && outMin != null && outMax != null) {
                if (outClock < outMin || outClock > outMax) return false;
            }
            if (isRound) {
                const inISO = o?.inbound?.departureTime;
                const inClock = getLocalClockMinutes(inISO);
                // Apply inbound window only if we have inbound departure data
                if (inClock != null && inMin != null && inMax != null) {
                    if (inClock < inMin || inClock > inMax) return false;
                }
            }

            return true;
        });
    }, [offers, stopFilter, priceMin, priceMax, durMin, durMax, depTimeMin, depTimeMax, depTimeMinIn, depTimeMaxIn]);

    const processedOffers = useMemo(() => {
        return [...filteredOffers].sort((a, b) => {
            const priceA = Number(a.totalPriceEUR);
            const priceB = Number(b.totalPriceEUR);
            const durA = getJourneyDurationMinutes(a);
            const durB = getJourneyDurationMinutes(b);
            const stA = getJourneyStopsCount(a);
            const stB = getJourneyStopsCount(b);
            const depA = getFirstDeparture(a);
            const depB = getFirstDeparture(b);
            switch (sortBy) {
                case "price":
                    return (isNaN(priceA) ? Infinity : priceA) - (isNaN(priceB) ? Infinity : priceB) || stA - stB || depA - depB;
                case "duration":
                    return durA - durB || stA - stB || (isNaN(priceA) ? Infinity : priceA) - (isNaN(priceB) ? Infinity : priceB);
                case "departure":
                    return depA - depB || stA - stB || (isNaN(priceA) ? Infinity : priceA) - (isNaN(priceB) ? Infinity : priceB);
                case "stops":
                default:
                    return stA - stB || (isNaN(priceA) ? Infinity : priceA) - (isNaN(priceB) ? Infinity : priceB) || depA - depB;
            }
        });
    }, [filteredOffers, sortBy]);

    const isRoundSearch = search?.tripType === "twoway";

    useEffect(() => {
        if (priceMin !== derived.minPrice) setPriceMin(derived.minPrice);
        if (priceMax !== derived.maxPrice) setPriceMax(derived.maxPrice);
    }, [derived.minPrice, derived.maxPrice]);

    useEffect(() => {
        if (durMin !== derived.minDur) setDurMin(derived.minDur);
        if (durMax !== derived.maxDur) setDurMax(derived.maxDur);
    }, [derived.minDur, derived.maxDur]);

    // Sync outbound/inbound departure time sliders to dataset bounds
    useEffect(() => {
        const outMinStrEff = minutesToHHMM(derived.minDep);
        const outMaxStrEff = minutesToHHMM(derived.maxDep);
        if (depTimeMin !== outMinStrEff) setDepTimeMin(outMinStrEff);
        if (depTimeMax !== outMaxStrEff) setDepTimeMax(outMaxStrEff);
    }, [derived.minDep, derived.maxDep]);

    useEffect(() => {
        if (!isRoundSearch) return;
        const inMinStrEff = minutesToHHMM(derivedIn.minDepIn);
        const inMaxStrEff = minutesToHHMM(derivedIn.maxDepIn);
        if (depTimeMinIn !== inMinStrEff) setDepTimeMinIn(inMinStrEff);
        if (depTimeMaxIn !== inMaxStrEff) setDepTimeMaxIn(inMaxStrEff);
    }, [isRoundSearch, derivedIn.minDepIn, derivedIn.maxDepIn]);

    const stopsLabel = (n) => {
        if (!Number.isFinite(n)) return "";
        if (n === 0) return "Nonstop";
        if (n === 1) return "1 stop";
        return `${n} stops`;
    };

    const pickCheapest = () => {
        let best = null;
        for (const o of filteredOffers) {
            if (best == null) best = o;
            else if ((Number(o.totalPriceEUR) || Infinity) < (Number(best.totalPriceEUR) || Infinity)) best = o;
        }
        return best;
    };
    const pickFastest = () => {
        let best = null;
        for (const o of filteredOffers) {
            if (best == null) best = o;
            else if (getJourneyDurationMinutes(o) < getJourneyDurationMinutes(best)) best = o;
        }
        return best;
    };
    const quickBook = (type) => {
        const offer = type === "cheapest" ? pickCheapest() : pickFastest();
        if (offer) {
            navigate("/booking", { state: { offer, search } });
        }
    };

    const toggleExpanded = (key) => {
        setExpandedKey((prev) => (prev === key ? null : key));
    };

    const cheapestOffer = useMemo(() => pickCheapest(), [filteredOffers]);
    const fastestOffer = useMemo(() => pickFastest(), [filteredOffers]);

    return (
        <div className="min-h-screen w-full bg-mediumGray text-white">
            <header className="flex items-center justify-between bg-darkGray px-8 py-3">
                <div className="flex items-center gap-x-2">
                    <img className="logo h-12 w-12" src="/Images/LOGO.png" alt="FreeFly logo" />
                    <div className="flex flex-col">
                        <p className="font-roboto text-[24px]">Freefly</p>
                        <p className="font-roboto text-[16px]">Find your perfect flight!</p>
                    </div>
                </div>

                <div className="flex items-center gap-x-3">
                    <button className="text-sm flex items-center gap-2 hover:underline" onClick={() => navigate("/")}>
                        <span>←</span>
                        <span>Back to main page</span>
                    </button>
                </div>
            </header>

            <main className="px-8 py-6">
                <div className="bg-darkGray rounded-2xl px-8 py-4 mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold">
                            {search?.dep && search?.ari ? `${search.dep} → ${search.ari}` : "Flight offers"}
                        </h1>
                        <p className="text-sm text-gray-300">
                            {search?.adults ? `${search.adults} traveller(s)` : "—"} |{" "}
                            {search?.tripType === "twoway" ? "Round Trip" : "One Way"}
                        </p>
                        {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 order-1 lg:order-none">
                        {processedOffers.length === 0 ? (
                            <div className="bg-darkGray rounded-2xl px-6 py-6">
                                <p className="text-gray-200">No offers to show.</p>
                                <p className="text-gray-400 text-sm mt-2">Try searching again from the home page.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-darkGray rounded-2xl px-6 py-3 flex flex-wrap items-center gap-3">
                                    <button
                                        disabled={!cheapestOffer}
                                        onClick={() => quickBook('cheapest')}
                                        className="px-4 py-2 rounded-full border border-white/70 hover:bg-white hover:text-black disabled:opacity-50 transition"
                                        title={cheapestOffer ? `Cheapest • ${formatPriceEUR(cheapestOffer.totalPriceEUR)} • ${formatISODuration(`PT${Math.floor(getJourneyDurationMinutes(cheapestOffer)/60)}H${getJourneyDurationMinutes(cheapestOffer)%60}M`)}` : 'No matching offers'}
                                    >
                                        Cheapest • {cheapestOffer ? `${formatPriceEUR(cheapestOffer.totalPriceEUR)} • ${formatISODuration(`PT${Math.floor(getJourneyDurationMinutes(cheapestOffer)/60)}H${getJourneyDurationMinutes(cheapestOffer)%60}M`)}` : '—'}
                                    </button>
                                    <button
                                        disabled={!fastestOffer}
                                        onClick={() => quickBook('fastest')}
                                        className="px-4 py-2 rounded-full border border-white/70 hover:bg-white hover:text-black disabled:opacity-50 transition"
                                        title={fastestOffer ? `Fastest • ${formatISODuration(`PT${Math.floor(getJourneyDurationMinutes(fastestOffer)/60)}H${getJourneyDurationMinutes(fastestOffer)%60}M`)} • ${formatPriceEUR(fastestOffer.totalPriceEUR)}` : 'No matching offers'}
                                    >
                                        Fastest • {fastestOffer ? `${formatISODuration(`PT${Math.floor(getJourneyDurationMinutes(fastestOffer)/60)}H${getJourneyDurationMinutes(fastestOffer)%60}M`)} • ${formatPriceEUR(fastestOffer.totalPriceEUR)}` : '—'}
                                    </button>
                                </div>
                                {processedOffers.map((offer, idx) => {
                                    const isRoundTrip = Boolean(offer?.outbound && offer?.inbound);
                                    const listKey = getOfferKey(offer, idx);
                                    const isOpen = expandedKey === listKey;

                                    return (
                                        <div key={listKey}>
                                            <div
                                                className={`flex items-center justify-between bg-darkGray rounded-2xl px-6 py-4 cursor-pointer transition 
                      ${isOpen ? "ring-2 ring-white/40" : "hover:bg-black/50"}`}
                                                onClick={() => toggleExpanded(listKey)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") toggleExpanded(listKey);
                                                }}
                                            >
                                                <div className="space-y-1">
                                                    {isRoundTrip ? (
                                                        <>
                                                            <p className="font-semibold">
                                                                {offer.outbound.departureAirport} → {offer.outbound.arrivalAirport}
                                                            </p>
                                                            <p className="text-sm text-gray-300">
                                                                {formatDateTime(offer.outbound.departureTime)} — {formatDateTime(offer.outbound.arrivalTime)}
                                                            </p>
                                                            <p className="font-semibold mt-2">
                                                                {offer.inbound.departureAirport} → {offer.inbound.arrivalAirport}
                                                            </p>
                                                            <p className="text-sm text-gray-300">
                                                                {formatDateTime(offer.inbound.departureTime)} — {formatDateTime(offer.inbound.arrivalTime)}
                                                            </p>
                                                            <p className="text-sm text-gray-300">
                                                                Out: {formatISODuration(offer.outbound.duration)} • In: {formatISODuration(offer.inbound.duration)}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-semibold">
                                                                {offer.departureAirport} → {offer.arrivalAirport}
                                                            </p>
                                                            <p className="text-sm text-gray-300">
                                                                {formatDateTime(offer.departureTime)} — {formatDateTime(offer.arrivalTime)}
                                                            </p>
                                                            <p className="text-sm text-gray-300">
                                                                {stopsLabel(offer.stopsCount)} • Total duration: {formatISODuration(offer.flightDuration)}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-2xl font-semibold">{formatPriceEUR(offer.totalPriceEUR)}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            className="px-4 py-1 border border-white rounded-full hover:bg-white hover:text-black transition"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const payload = { offer, search };
                                                                navigate("/booking", { state: payload });
                                                            }}
                                                        >
                                                            Buy
                                                        </button>
                                                        <span className="text-sm text-gray-300">{isOpen ? "▲" : "▼"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="bg-darkGray/60 rounded-2xl px-6 py-4 mt-2 border border-white/10">
                                                    {isRoundTrip ? (
                                                        <div className="space-y-4 text-sm">
                                                            <div className="bg-black/20 rounded-xl px-4 py-3">
                                                                <p className="font-semibold">Outbound</p>
                                                                <p>
                                                                    {offer.outbound.departureAirport} → {offer.outbound.arrivalAirport} ({offer.outbound.flightNumber})
                                                                </p>
                                                                <p className="text-gray-300">
                                                                    {formatDateTime(offer.outbound.departureTime)} — {formatDateTime(offer.outbound.arrivalTime)}
                                                                    {offer.outbound.duration ? ` • ${formatISODuration(offer.outbound.duration)}` : ""}
                                                                </p>
                                                            </div>
                                                            <div className="bg-black/20 rounded-xl px-4 py-3">
                                                                <p className="font-semibold">Inbound</p>
                                                                <p>
                                                                    {offer.inbound.departureAirport} → {offer.inbound.arrivalAirport} ({offer.inbound.flightNumber})
                                                                </p>
                                                                <p className="text-gray-300">
                                                                    {formatDateTime(offer.inbound.departureTime)} — {formatDateTime(offer.inbound.arrivalTime)}
                                                                    {offer.inbound.duration ? ` • ${formatISODuration(offer.inbound.duration)}` : ""}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="font-semibold mb-3">All stops</p>
                                                            <div className="space-y-3 text-sm">
                                                                {(offer.segments || []).map((seg, i) => {
                                                                    const next = (offer.segments || [])[i + 1];
                                                                    const lay = next ? layoverLabel(seg.arrivalTime, next.departureTime) : null;
                                                                    return (
                                                                        <div key={`${seg.flightNumber}-${seg.departureTime}-${i}`} className="space-y-2">
                                                                            <div className="bg-black/20 rounded-xl px-4 py-3">
                                                                                <p className="font-semibold">
                                                                                    Stop {i + 1}: {seg.departureAirport} → {seg.arrivalAirport} ({seg.flightNumber})
                                                                                </p>
                                                                                <p className="text-gray-300">
                                                                                    {formatDateTime(seg.departureTime)} — {formatDateTime(seg.arrivalTime)}
                                                                                    {seg.duration ? ` • ${formatISODuration(seg.duration)}` : ""}
                                                                                </p>
                                                                            </div>
                                                                            {next && lay && (
                                                                                <div className="flex items-center justify-center text-gray-300 text-xs">
                                                                                    <span className="mx-2">↓</span>
                                                                                    <span>{seg.arrivalAirport} • {lay}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <aside className="lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-24 order-0 lg:order-last">
                        <div className="bg-darkGray rounded-2xl px-6 py-4 space-y-4 [&_option]:!text-black [&_option]:bg-white">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <label htmlFor="sortBy" className="text-gray-300">Sort by:</label>
                                    <select
                                        id="sortBy"
                                        className="bg-white text-black border border-white/30 rounded-md px-2 py-1"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="stops">Fewest stops</option>
                                        <option value="price">Lowest price</option>
                                        <option value="duration">Shortest duration</option>
                                        <option value="departure">Earliest departure</option>
                                    </select>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span className="text-gray-300 mr-2">Stops:</span>
                                    {[
                                        { key: "all", label: "All" },
                                        { key: "nonstop", label: "Nonstop" },
                                        { key: "one", label: "1 stop" },
                                        { key: "twoPlus", label: "2+ stops" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.key}
                                            className={`px-3 py-1 rounded-full border transition ${
                                                stopFilter === opt.key
                                                    ? "bg-white text-black border-white"
                                                    : "border-white/40 hover:bg-white/10"
                                            }`}
                                            onClick={() => setStopFilter(opt.key)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm text-gray-300">
                                    <span>Price range</span>
                                    <span>{formatPriceEUR(priceMin)} — {formatPriceEUR(priceMax)}</span>
                                </div>
                                <DualRange
                                    min={Math.floor(derived.minPrice)}
                                    max={Math.ceil(derived.maxPrice)}
                                    step={1}
                                    low={Math.min(priceMin, priceMax)}
                                    high={Math.max(priceMin, priceMax)}
                                    ariaLabelLow="Minimum price"
                                    ariaLabelHigh="Maximum price"
                                    onChange={(lo, hi) => {
                                        if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
                                        setPriceMin(lo);
                                        setPriceMax(hi);
                                    }}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm text-gray-300">
                                    <span>Total duration</span>
                                    <span>{formatISODuration(`PT${Math.floor(durMin/60)}H${durMin%60}M`)} — {formatISODuration(`PT${Math.floor(durMax/60)}H${durMax%60}M`)}</span>
                                </div>
                                <DualRange
                                    min={derived.minDur}
                                    max={derived.maxDur}
                                    step={5}
                                    low={Math.min(durMin, durMax)}
                                    high={Math.max(durMin, durMax)}
                                    ariaLabelLow="Minimum total duration"
                                    ariaLabelHigh="Maximum total duration"
                                    onChange={(lo, hi) => {
                                        if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
                                        setDurMin(lo);
                                        setDurMax(hi);
                                    }}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm text-gray-300">
                                    <span>Departure time {isRoundSearch ? '(Outbound)' : ''}</span>
                                    <span>{depTimeMin} — {depTimeMax}</span>
                                </div>
                                <DualRange
                                    min={0}
                                    max={1439}
                                    step={5}
                                    low={parseHHMMToMinutes(depTimeMin) ?? 0}
                                    high={parseHHMMToMinutes(depTimeMax) ?? 1439}
                                    ariaLabelLow="Earliest outbound departure time"
                                    ariaLabelHigh="Latest outbound departure time"
                                    onChange={(lo, hi) => {
                                        setDepTimeMin(minutesToHHMM(lo));
                                        setDepTimeMax(minutesToHHMM(hi));
                                    }}
                                />

                                {isRoundSearch && (
                                    <>
                                        <div className="flex items-center justify-between text-sm text-gray-300 mt-2">
                                            <span>Departure time (Inbound)</span>
                                            <span>{depTimeMinIn} — {depTimeMaxIn}</span>
                                        </div>
                                        <DualRange
                                            min={0}
                                            max={1439}
                                            step={5}
                                            low={parseHHMMToMinutes(depTimeMinIn) ?? 0}
                                            high={parseHHMMToMinutes(depTimeMaxIn) ?? 1439}
                                            ariaLabelLow="Earliest inbound departure time"
                                            ariaLabelHigh="Latest inbound departure time"
                                            onChange={(lo, hi) => {
                                                setDepTimeMinIn(minutesToHHMM(lo));
                                                setDepTimeMaxIn(minutesToHHMM(hi));
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}