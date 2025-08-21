import { AppDataSource } from "../AppDataSource";
import { ProviderEntity } from "../entities/ProviderEntity";
import dotenv from "dotenv";
dotenv.config();

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

    // dédup par provider_id (TMDB)
    const map = new Map<number, TmdbProvider>();
    for (const p of [...movie, ...tv]) if (p?.provider_id) map.set(p.provider_id, p);

    let upserted = 0;
    for (const p of map.values()) {
        const name = (p.provider_name || "").trim();
        if (!name) continue;

        const logoUrl = p.logo_path ? `${IMAGE_BASE}${p.logo_path}` : "";

        // upsert par tmdbId pour garder les mêmes lignes si on relance le seed
        const existing = await repo.findOne({ where: { tmdbId: p.provider_id } });
        if (existing) {
            // met à jour name/logo si besoin
            existing.name = name;
            existing.logoUrl = logoUrl;
            await repo.save(existing);
            continue;
        }

        const row = repo.create({
            name,
            logoUrl,
            tmdbId: p.provider_id, // ← clé TMDB
        });
        await repo.save(row);
        upserted++;
        console.log(`Provider ajouté/MAJ : ${name} (tmdbId=${p.provider_id})`);
    }

    return upserted;
}

// Mode CLI
if (process.argv.includes("--cli")) {
    seedProviders()
        .then(n => { console.log(`Seed Providers terminé (${n} upsertés).`); process.exit(0); })
        .catch(e => { console.error(e); process.exit(1); });
}
