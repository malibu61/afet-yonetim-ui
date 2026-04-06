"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { apiUrl } from "../constants/api";

function enYuksekRiskSeviyesi(risks) {
    if (!risks || typeof risks !== "object") return 0;
    const sira = { HIG: 4, MED: 3, LOW: 2, VLO: 1 };
    let en = 0;
    for (const v of Object.values(risks)) {
        const p = sira[v] ?? 0;
        if (p > en) en = p;
    }
    return en;
}

function riskRenk(seviye) {
    if (seviye >= 4) return "bg-red-500 ring-red-300";
    if (seviye >= 3) return "bg-orange-500 ring-orange-300";
    if (seviye >= 2) return "bg-amber-400 ring-amber-200";
    if (seviye >= 1) return "bg-emerald-500 ring-emerald-300";
    return "bg-gray-500 ring-gray-400";
}

function riskOzetiMetin(risks) {
    if (!risks || typeof risks !== "object") return "Risk verisi yok";
    const parts = Object.entries(risks)
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => `${k}: ${v}`);
    return parts.length ? parts.join(" · ") : "Risk verisi yok";
}

function kayitAnahtar(k) {
    const lat = k.coords?.[0];
    const lng = k.coords?.[1];
    return k.id != null ? String(k.id) : `${k.name}-${lat}-${lng}`;
}

/** API JSON’daki explain — olduğu gibi string; camelCase veya PascalCase anahtar */
function jsondanExplain(body) {
    if (!body || typeof body !== "object") return "";
    const v = body.explain ?? body.Explain;
    return typeof v === "string" ? v : "";
}

function jsondanItems(body) {
    if (!body || typeof body !== "object") return [];
    if (Array.isArray(body.items)) return body.items;
    if (Array.isArray(body.Items)) return body.Items;
    return [];
}

export default function RiskHaritasi() {
    const [kayitlar, setKayitlar] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState(null);
    /** 503 vb.: haritada gösterilecek API mesajı (explain değil) */
    const [kismiApiMesaji, setKismiApiMesaji] = useState(null);
    const [ustunde, setUstunde] = useState(null);
    const kapanisZamanRef = useRef(null);

    const [explain, setExplain] = useState("");

    const hoverIptal = useCallback(() => {
        if (kapanisZamanRef.current) {
            clearTimeout(kapanisZamanRef.current);
            kapanisZamanRef.current = null;
        }
    }, []);

    const hoverKapatGecikmeli = useCallback(() => {
        hoverIptal();
        kapanisZamanRef.current = setTimeout(() => setUstunde(null), 220);
    }, [hoverIptal]);

    const hoverAc = useCallback(
        (anahtar) => {
            hoverIptal();
            setUstunde(anahtar);
        },
        [hoverIptal]
    );

    useEffect(() => () => hoverIptal(), [hoverIptal]);

    const yukle = useCallback(async () => {
        setYukleniyor(true);
        setHata(null);
        setKismiApiMesaji(null);
        setExplain("");
        try {
            const res = await fetch(apiUrl("api/AISupportedRisk"), { cache: "no-store" });
            const body = await res.json().catch(() => ({}));

            if (res.ok) {
                setKayitlar(jsondanItems(body));
                setExplain(jsondanExplain(body));
                return;
            }

            if (res.status === 503) {
                setKayitlar(jsondanItems(body));
                setExplain(jsondanExplain(body));
                setKismiApiMesaji(typeof body.message === "string" ? body.message : `${res.status}`);
                return;
            }

            const msg = body?.message ?? `${res.status} ${res.statusText}`;
            throw new Error(msg);
        } catch (e) {
            setHata(e?.message ?? "İstek başarısız");
            setKayitlar([]);
            setExplain("");
        } finally {
            setYukleniyor(false);
        }
    }, []);

    useEffect(() => {
        yukle();
    }, [yukle]);

    const ustKayit = ustunde ? kayitlar.find((k) => kayitAnahtar(k) === ustunde) : null;
    const haritaUyarisi = hata ?? kismiApiMesaji;

    return (
        <div className="space-y-4">
            <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                {yukleniyor && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm">
                        <span className="text-gray-400 font-medium">
                            Risk verileri ve yapay zeka özeti yükleniyor…
                        </span>
                    </div>
                )}
                {haritaUyarisi && !yukleniyor && (
                    <div className="absolute top-3 left-3 z-10 max-w-md rounded-lg border border-amber-900/60 bg-amber-950/90 px-3 py-2 text-xs text-amber-100">
                        <span className="font-semibold">API: </span>
                        {haritaUyarisi}
                        <button
                            type="button"
                            onClick={yukle}
                            className="ml-2 underline decoration-amber-400 hover:text-white"
                        >
                            Tekrar dene
                        </button>
                    </div>
                )}
                <Map
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                    initialViewState={{
                        longitude: 35.24,
                        latitude: 38.96,
                        zoom: 5,
                        pitch: 50,
                    }}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                >
                    <NavigationControl position="top-right" />
                    <FullscreenControl position="top-right" />

                    {!yukleniyor &&
                        kayitlar.map((k) => {
                            const lat = k.coords?.[0];
                            const lng = k.coords?.[1];
                            if (typeof lat !== "number" || typeof lng !== "number") return null;
                            const seviye = enYuksekRiskSeviyesi(k.risks);
                            const anahtar = kayitAnahtar(k);
                            return (
                                <Marker key={anahtar} longitude={lng} latitude={lat}>
                                    <div
                                        className="flex flex-col items-center cursor-pointer"
                                        style={{ pointerEvents: "auto" }}
                                        onMouseEnter={() => hoverAc(anahtar)}
                                        onMouseLeave={hoverKapatGecikmeli}
                                    >
                                        <div
                                            className={`h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-[#1a1a1a] hover:scale-125 transition-transform ${riskRenk(
                                                seviye
                                            )}`}
                                            title={k.name}
                                        />
                                    </div>
                                </Marker>
                            );
                        })}

                    {ustKayit &&
                        typeof ustKayit.coords?.[0] === "number" &&
                        typeof ustKayit.coords?.[1] === "number" && (
                            <Popup
                                longitude={ustKayit.coords[1]}
                                latitude={ustKayit.coords[0]}
                                anchor="bottom"
                                offset={[0, -8]}
                                closeButton={false}
                                closeOnClick={false}
                                maxWidth="320px"
                            >
                                <div
                                    className="text-gray-900 text-xs font-medium px-1 py-0.5 max-w-[280px]"
                                    style={{ pointerEvents: "auto" }}
                                    onMouseEnter={() => hoverAc(kayitAnahtar(ustKayit))}
                                    onMouseLeave={hoverKapatGecikmeli}
                                >
                                    <span className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1 font-bold">
                                        {ustKayit.name}
                                    </span>
                                    <p className="leading-relaxed whitespace-normal break-words">
                                        {riskOzetiMetin(ustKayit.risks)}
                                    </p>
                                </div>
                            </Popup>
                        )}
                </Map>
                {!yukleniyor && kayitlar.length === 0 && !haritaUyarisi && (
                    <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-gray-700 bg-black/70 px-3 py-2 text-xs text-gray-400">
                        Henüz il risk kaydı yok (.NET API / Kafka akışı bekleniyor).
                    </div>
                )}
                {!yukleniyor && kayitlar.length > 0 && (
                    <div className="pointer-events-none absolute bottom-3 right-14 z-[1] rounded-lg border border-gray-700 bg-black/80 px-3 py-2 text-[10px] text-gray-400 space-y-1">
                        <p className="font-semibold text-gray-300 uppercase tracking-wide">En yüksek risk</p>
                        <p>
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 align-middle mr-1.5" />{" "}
                            HIG
                        </p>
                        <p>
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500 align-middle mr-1.5" />{" "}
                            MED
                        </p>
                        <p>
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400 align-middle mr-1.5" />{" "}
                            LOW
                        </p>
                        <p>
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 align-middle mr-1.5" />{" "}
                            VLO
                        </p>
                    </div>
                )}
            </div>

            <section className="border-t border-gray-800 pt-4" aria-label="explain">
                {yukleniyor ? (
                    <p className="text-sm text-gray-500">Yükleniyor…</p>
                ) : (
                    <div className="whitespace-pre-wrap break-words text-sm text-gray-200">{explain}</div>
                )}
            </section>
        </div>
    );
}
