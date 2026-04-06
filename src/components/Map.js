/**
 * Deprem haritası — Mapbox GL + react-map-gl.
 * Mapbox: Harita kutusu ve vektör/raster katmanları sağlar (API anahtarı ister).
 * react-map-gl: Mapbox'ı React bileşenleri (Map, Marker, Control) ile kullanmayı kolaylaştırır.
 *
 * /mapbox alt yolu: react-map-gl v8'de kök paket yok; Mapbox kullanımı için bu import şart.
 */
"use client";

// Map: Harita tuvali. Marker: koordinata iğne. NavigationControl: zoom/pusula. FullscreenControl: tam ekran.
import Map, { Marker, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';

// Mapbox'un varsayılan kontrol ve popup stilleri (olmazsa harita "çıplak" görünebilir).
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * veriler: GET api/Deprem — { id, mag, place, time, latitude, longitude }
 */
export default function DepremHaritasi({ veriler }) {
    const liste = Array.isArray(veriler) ? veriler : [];

    return (
        // Sabit yükseklik: Mapbox haritasının boyutlanabilmesi için kapsayıcıda net yükseklik gerekir.
        <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <Map
                // NEXT_PUBLIC_* : Next.js bu prefix'i build'de istemciye gömülü env olarak açar (.NET User Secrets + frontend'e güvenli kopya gibi düşünmeyin; token tarayıcıda görünür, kısıtlı token kullanın).
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                initialViewState={{
                    longitude: 35.24, // Boylam (doğu-batı), WGS84 — Türkiye merkezine yakın
                    latitude: 38.96,  // Enlem (kuzey-güney)
                    zoom: 5,          // Yakınlaştırma seviyesi (sayı büyüdükçe yakın)
                    pitch: 50,        // Haritayı 3B gibi eğme açısı (derece)
                }}
                // mapStyle: Mapbox Studio'da tanımlı stil URL'i; dark-v11 karanlık tema
                mapStyle="mapbox://styles/mapbox/dark-v11"
            >
                {/* Sağ üst: yakınlaştırma + yön */}
                <NavigationControl position="top-right" />
                {/* Sağ üst: tam ekran modu */}
                <FullscreenControl position="top-right" />

                {liste.map((d) => {
                    const lat = d.latitude;
                    const lng = d.longitude;
                    if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
                        return null;
                    }
                    return (
                    <Marker key={d.id} longitude={lng} latitude={lat}>
                        <div className="group relative flex flex-col items-center">
                            <div className="hidden group-hover:block absolute bottom-full mb-2 p-2 bg-white text-black text-xs font-bold rounded shadow-lg max-w-[280px] whitespace-normal z-50">
                                {d.place} | Mag: {d.mag}
                                {d.time ? <span className="block text-[10px] font-normal mt-1 text-gray-600">{d.time}</span> : null}
                            </div>

                            {/* Büyüklüğe göre emoji; mag = moment büyüklüğü (basit görsel kodlama) */}
                            <div className="text-3xl cursor-pointer hover:scale-125 transition-transform">
                                {d.mag >= 7 ? "🔴" : d.mag >= 5 ? "🟠" : "🟡"}
                            </div>
                        </div>
                    </Marker>
                    );
                })}
            </Map>
        </div>
    );
}
