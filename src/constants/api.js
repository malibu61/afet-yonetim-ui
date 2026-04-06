/**
 * .NET Web API tabanı (tarayıcıdan doğrudan istek; CORS API tarafında açık).
 * Örnekler:
 * - GET .../api/Risks → IlRiskKaydi[]
 * - GET .../api/AISupportedRisk → { items, explain }
 * - GET .../api/Deprem → Deprem[] (id, mag, place, time, latitude, longitude)
 */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://localhost:7232";

export const apiUrl = (path) =>
    `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
