"use client";

import { useState } from "react";
import DepremHaritasi from "./Map";
import RiskHaritasi from "./RiskHaritasi";

const SEKMELER = [
    { id: "depremler", etiket: "Geçmiş 24 saatteki depremler" },
    { id: "risk", etiket: "Afet risk haritası" },
];

/**
 * Mapbox alanı: iki sekme — depremler (mevcut harita) ve il riskleri (API koordinatları).
 */
export default function MapViewTabs({ depremVerileri, depremYukleniyor = false }) {
    const [aktif, setAktif] = useState("depremler");

    return (
        <div className="space-y-3">
            <div
                role="tablist"
                aria-label="Harita görünümü"
                className="flex flex-wrap gap-2 border-b border-gray-800 pb-3"
            >
                {SEKMELER.map((s) => {
                    const secili = aktif === s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={secili}
                            onClick={() => setAktif(s.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                secili
                                    ? "bg-red-600/20 text-red-400 ring-1 ring-red-600/50"
                                    : "bg-gray-900/80 text-gray-500 hover:text-gray-300 ring-1 ring-gray-800"
                            }`}
                        >
                            {s.etiket}
                        </button>
                    );
                })}
            </div>

            <div role="tabpanel" className="relative">
                {aktif === "depremler" && (
                    <div className="relative">
                        <DepremHaritasi veriler={depremVerileri} />
                        {depremYukleniyor && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[#050505]/75 backdrop-blur-sm pointer-events-none">
                                <span className="text-gray-400 font-medium text-sm">Son 24 saat depremleri yükleniyor…</span>
                            </div>
                        )}
                    </div>
                )}
                {aktif === "risk" && <RiskHaritasi />}
            </div>
        </div>
    );
}
