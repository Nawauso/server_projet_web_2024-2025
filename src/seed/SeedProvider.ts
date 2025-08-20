import { AppDataSource } from "../AppDataSource";
import { ProviderEntity } from "../entities/ProviderEntity";
import dotenv from "dotenv";
dotenv.config();

// Si Node < 18, décommente la ligne suivante et "npm i node-fetch"
// // import fetch from "node-fetch";

type TmdbProvider = { provider_id: number; provider_name: string; logo_path: string | null; };

function buildHeaders() {
    const token = process.env.TMDB_V4_TOKEN?.trim();
    if (!token) throw new Error("TMDB_V4_TOKEN manquant dans .env");
    return { accept: "application/json", Authorization: `Bearer ${token}` };
}

async function fetchTmdbProviders(kind: "movie" | "tv", region: string, language = "fr-FR"): Promise<TmdbProvider[]> {
    const url = `https://api.themoviedb.org/3/watch/providers/${kind}?language=${encodeURIComponent(language)}&watch_region=${encodeURIComponent(region)}`;
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`TMDB providers ${kind} HTTP ${res.status} ${res.statusText} — ${body}`);
    }
    const json = (await res.json()) as { results?: TmdbProvider[] };
    return Array.isArray(json.results) ? json.results : [];
}

const IMAGE_BASE = process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w154";
const REGION = process.env.TMDB_REGION || "FR";
const LANGUAGE = process.env.TMDB_LANGUAGE || "fr-FR";

export async function seedProviders(): Promise<number> {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(ProviderEntity);

    const [movie, tv] = await Promise.all([
        fetchTmdbProviders("movie", REGION, LANGUAGE),
        fetchTmdbProviders("tv", REGION, LANGUAGE),
    ]);

    // dédup par provider_id
    const map = new Map<number, TmdbProvider>();
    for (const p of [...movie, ...tv]) if (p?.provider_id) map.set(p.provider_id, p);

    let inserted = 0;
    for (const p of map.values()) {
        const name = (p.provider_name || "").trim();
        if (!name) continue;

        const exists = await repo.findOne({ where: { name } });
        if (exists) continue;

        const logoUrl = p.logo_path ? `${IMAGE_BASE}${p.logo_path}` : "";
        await repo.save(repo.create({ name, logoUrl })); // id auto-généré
        inserted++;
        console.log(`Provider ajouté : ${name}`);
    }
    return inserted;
}

// Mode CLI : ts-node src/seed/SeedProvider.ts --cli
if (process.argv.includes("--cli")) {
    seedProviders()
        .then(n => { console.log(`Seed Providers terminé (${n} ajoutés).`); process.exit(0); })
        .catch(e => { console.error(e); process.exit(1); });
}
