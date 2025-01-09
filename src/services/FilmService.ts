import FilmRepository from '../repositories/FilmRepository';
import { FilmEntity } from "../entities/FilmEntity";

class FilmService {
    private currentPage: number = 1; // Gérer la pagination interne
    private pageSize: number = 10; // Nombre de films par page

    private filmRepository: FilmRepository;

    constructor(filmRepository: FilmRepository) {
        this.filmRepository = filmRepository;
    }

    resetPagination(): void {
        this.currentPage = 1; // Réinitialise la pagination à la première page
        console.log("Pagination réinitialisée à la page 1.");
    }

    async getFilms(): Promise<FilmEntity[]> {
        try {
            // Vérifie si des films existent dans la base de données
            const totalFilms = await this.filmRepository.countFilmsInDB();
            if (totalFilms === 0) {
                console.log("Aucun film trouvé dans la base. Récupération des films via l'API...");
                await this.getAPIFilms(); // Appel pour remplir la base de données
            }

            // Récupérer les films paginés
            const offset = (this.currentPage - 1) * this.pageSize;
            const films = await this.filmRepository.getPaginatedFilms(offset, this.pageSize);

            if (films.length === 0) {
                console.log("Plus de films disponibles à afficher.");
                return [];
            }

            console.log(`Page ${this.currentPage} : ${films.length} films récupérés.`);
            this.currentPage++; // Incrémente la page pour le prochain appel

            return films;
        } catch (error) {
            console.error("Une erreur s'est produite lors de la récupération des films :", error);
            throw error;
        }
    }

    async getAPIFilms(): Promise<void> {
        for (let i = 1; i <= 100; i++) {
            try {
                await this.filmRepository.getAPIFilms(i.toString());
            } catch (error) {
                console.error(`Erreur lors de l'appel de l'API pour la page ${i} :`, error);
            }
        }
    }

    async getFavoriteFilms(userId: string, page: number = 1): Promise<any[]> {
        try {
            // Récupérer les genres et providers favoris de l'utilisateur
            const { genres, providers } = await this.getUserFavorites(userId);

            // Appeler l'API avec les paramètres de genres et providers
            const films = await this.filmRepository.getFavoriteFilmsFromAPI(genres, providers, page);

            console.log(`Page ${page} : ${films.length} films récupérés depuis l'API avec les favoris.`);
            return films;
        } catch (error) {
            console.error("Une erreur s'est produite lors de la récupération des films favoris :", error);
            throw error;
        }
    }

    private async getUserFavorites(userId: string): Promise<{ genres: number[]; providers: number[] }> {
        try {
            const [genresResponse, providersResponse] = await Promise.all([
                fetch(`http://localhost:8080/api/criterias/giveGenres?userId=${userId}`),
                fetch(`http://localhost:8080/api/criterias/giveProviders?userId=${userId}`)
            ]);

            if (!genresResponse.ok || !providersResponse.ok) {
                throw new Error(
                    `Erreur lors de la récupération des favoris : Genres(${genresResponse.status}) Providers(${providersResponse.status})`
                );
            }

            const genresData = await genresResponse.json();
            const providersData = await providersResponse.json();

            const genres = genresData.map((genre: any) => genre.id);
            const providers = providersData.map((provider: any) => provider.id);

            return { genres, providers };
        } catch (error) {
            console.error("Erreur lors de la récupération des genres et providers favoris :", error);
            return { genres: [], providers: [] }; // Retourne des listes vides en cas d'erreur
        }
    }
}

export default FilmService;
