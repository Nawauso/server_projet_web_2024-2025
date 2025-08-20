import FilmRepository from '../repositories/FilmRepository';
import { FilmEntity } from "../entities/FilmEntity";
import { AppDataSource } from "../AppDataSource";
import { UserEntity } from "../entities/UserEntity";

class FilmService {
    private currentPage = 1;
    private pageSize = 10;

    constructor(private filmRepository: FilmRepository) {}

    resetPagination(): void {
        this.currentPage = 1;
        console.log("Pagination réinitialisée à la page 1.");
    }

    async getFilms(): Promise<FilmEntity[]> {
        try {
            const totalFilms = await this.filmRepository.countFilmsInDB();
            if (totalFilms === 0) {
                console.log("Aucun film trouvé dans la base. Récupération des films via l'API...");
                await this.getAPIFilms();
            }

            const offset = (this.currentPage - 1) * this.pageSize;
            const films = await this.filmRepository.getPaginatedFilms(offset, this.pageSize);

            if (films.length === 0) {
                console.log("Plus de films disponibles à afficher.");
                return [];
            }

            console.log(`Page ${this.currentPage} : ${films.length} films récupérés.`);
            this.currentPage++;
            return films;
        } catch (error) {
            console.error("Une erreur s'est produite lors de la récupération des films :", error);
            throw error;
        }
    }

    async getAPIFilms(): Promise<void> {
        for (let i = 1; i <= 100; i++) {
            try {
                await this.filmRepository.getAPIFilms(String(i));
            } catch (error) {
                console.error(`Erreur lors de l'appel de l'API pour la page ${i} :`, error);
            }
        }
    }

    // 👇 Accepte string | number et convertit proprement
    async getFavoriteFilms(userId: string | number, page: number = 1): Promise<any[]> {
        try {
            const idNum =
                typeof userId === "number" ? userId : Number(userId);
            if (!Number.isFinite(idNum)) {
                throw new Error(`userId invalide: "${userId}"`);
            }

            const { genres, providers } = await this.getUserFavorites(idNum);
            const films = await this.filmRepository.getFavoriteFilmsFromAPI(genres, providers, page);

            console.log(`Page ${page} : ${films.length} films récupérés depuis l'API avec les favoris.`);
            return films;
        } catch (error) {
            console.error("Une erreur s'est produite lors de la récupération des films favoris :", error);
            throw error;
        }
    }

    // 👇 Garde bien un number ici
    private async getUserFavorites(userId: number): Promise<{ genres: number[]; providers: number[] }> {
        const user = await AppDataSource.getRepository(UserEntity).findOne({
            where: { id: userId },
            relations: ['selectedGenres', 'selectedProviders'],
        });
        return {
            genres: user?.selectedGenres?.map(g => g.id) ?? [],
            providers: user?.selectedProviders?.map(p => p.id) ?? [],
        };
    }
}

export default FilmService;
