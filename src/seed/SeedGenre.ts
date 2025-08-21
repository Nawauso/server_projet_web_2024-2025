import { AppDataSource } from "../AppDataSource";
import { GenreEntity } from "../entities/GenreEntity";
import dotenv from "dotenv";
dotenv.config();

function buildHeaders() {
    const token = process.env.TMDB_V4_TOKEN?.trim();
    if (!token) throw new Error("TMDB_V4_TOKEN manquant dans .env");
    return { accept: "application/json", Authorization: `Bearer ${token}` };
}

async function fetchTmdbGenres(type: "movie" | "tv", language = "fr-FR") {
    const url = `https://api.themoviedb.org/3/genre/${type}/list?language=${encodeURIComponent(language)}`;
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`TMDB ${type} genres HTTP ${res.status} ${res.statusText} — ${body}`);
    }
    const json = (await res.json()) as { genres?: Array<{ id: number; name: string }> };
    return Array.isArray(json.genres) ? json.genres : [];
}

export async function seedGenres(): Promise<number> {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(GenreEntity);

    const language = process.env.TMDB_LANGUAGE || "fr-FR";
    const [movie, tv] = await Promise.all([fetchTmdbGenres("movie", language), fetchTmdbGenres("tv", language)]);

    // dédup par tmdb id
    const map = new Map<number, { id: number; name: string }>();
    for (const g of [...movie, ...tv]) if (g?.id) map.set(g.id, g);

    let upserted = 0;
    for (const g of map.values()) {
        const name = (g?.name || "").trim();
        if (!name) continue;

        const existing = await repo.findOne({ where: { tmdbId: g.id } });
        if (existing) {
            existing.name = name;
            await repo.save(existing);
            continue;
        }

        const row = repo.create({ name, tmdbId: g.id });
        await repo.save(row);
        upserted++;
        console.log(`Genre ajouté/MAJ : ${name} (tmdbId=${g.id})`);
    }

    return upserted;
}

// Mode CLI
if (process.argv.includes("--cli")) {
    seedGenres()
        .then(n => { console.log(`Seed Genres terminé (${n} upsertés).`); process.exit(0); })
        .catch(e => { console.error(e); process.exit(1); });
}
