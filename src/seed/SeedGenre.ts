import { AppDataSource } from "../AppDataSource";
import { GenreEntity } from "../entities/GenreEntity";
import dotenv from "dotenv";
dotenv.config();

// Si Node < 18, décommente la ligne suivante et "npm i node-fetch"
// // import fetch from "node-fetch";

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
    const [movie, tv] = await Promise.all([
        fetchTmdbGenres("movie", language),
        fetchTmdbGenres("tv", language),
    ]);

    // dédup par nom (on ne garde que ce dont on a besoin)
    const set = new Set<string>();
    let inserted = 0;
    for (const g of [...movie, ...tv]) {
        const name = (g?.name || "").trim();
        if (!name || set.has(name)) continue;
        set.add(name);

        const exists = await repo.findOne({ where: { name } });
        if (exists) continue;

        await repo.save(repo.create({ name })); // id auto-généré (PrimaryGeneratedColumn)
        inserted++;
        console.log(`Genre ajouté : ${name}`);
    }
    return inserted;
}

// Mode CLI : ts-node src/seed/SeedGenre.ts --cli
if (process.argv.includes("--cli")) {
    seedGenres()
        .then(n => { console.log(`Seed Genres terminé (${n} ajoutés).`); process.exit(0); })
        .catch(e => { console.error(e); process.exit(1); });
}
