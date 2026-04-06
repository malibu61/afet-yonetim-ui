/**
 * Ana sayfa bileşeni (App Router'da src/app/page.js = "/" rotası).
 */
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../constants/api";

const DynamicMapViewTabs = dynamic(() => import("../components/MapViewTabs"), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full bg-gray-900 animate-pulse rounded-2xl flex items-center justify-center border border-gray-700">
            <span className="text-gray-400 font-medium">Harita Motoru Hazırlanıyor...</span>
        </div>
    ),
});

export default function Home() {
    const [depremler, setDepremler] = useState([]);
    const [depremYukleniyor, setDepremYukleniyor] = useState(true);
    const [depremHata, setDepremHata] = useState(null);

    const depremleriYukle = useCallback(async () => {
        setDepremYukleniyor(true);
        setDepremHata(null);
        try {
            const res = await fetch(apiUrl("api/Deprem"), { cache: "no-store" });
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            const data = await res.json();
            setDepremler(Array.isArray(data) ? data : []);
        } catch (e) {
            setDepremHata(e?.message ?? "Depremler alınamadı");
            setDepremler([]);
        } finally {
            setDepremYukleniyor(false);
        }
    }, []);

    useEffect(() => {
        depremleriYukle();
    }, [depremleriYukle]);

    return (
        <main className="min-h-screen bg-[#050505] p-6 md:p-12 font-sans text-white">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                            <span className="text-xs font-bold uppercase tracking-widest text-red-500">Live Feed</span>
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight italic">
                            AFET<span className="text-red-600">WATCH</span>
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">
                            Real-time Seismic Data Visualization via Kafka & .NET
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase">Active Nodes</p>
                            <p className="font-mono font-bold text-green-500">KAFKA-01</p>
                        </div>
                    </div>
                </header>

                <section className="relative group">
                    {depremHata && (
                        <div className="mb-3 rounded-lg border border-amber-900/60 bg-amber-950/50 px-3 py-2 text-sm text-amber-100">
                            Deprem API: {depremHata}
                            <button
                                type="button"
                                onClick={depremleriYukle}
                                className="ml-2 underline text-amber-300 hover:text-white"
                            >
                                Tekrar dene
                            </button>
                        </div>
                    )}
                    <DynamicMapViewTabs depremVerileri={depremler} depremYukleniyor={depremYukleniyor} />
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {depremYukleniyor &&
                        [1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="bg-[#0f0f0f] border border-gray-800 p-5 rounded-xl animate-pulse h-28"
                            />
                        ))}
                    {!depremYukleniyor &&
                        depremler.map((d) => (
                            <div
                                key={d.id}
                                className="bg-[#0f0f0f] border border-gray-800 p-5 rounded-xl hover:border-red-900/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-gray-600">ID: {d.id}</span>
                                    <span className="text-xl font-black text-red-500">{d.mag}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-300 line-clamp-2">{d.place}</h3>
                                <p className="text-[10px] text-gray-600 mt-1 font-mono">
                                    {d.latitude} / {d.longitude}
                                </p>
                                {d.time && (
                                    <p className="text-[10px] text-gray-500 mt-1 font-mono">{d.time}</p>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        </main>
    );
}
