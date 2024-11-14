export class Film {
    protected id: number;
    protected title: string;
    protected overview: string;
    protected release_date: string;
    protected vote_average: number;
    protected genre_ids: number[];
    protected poster_path: string;

    constructor(id: number, title: string, overview: string, release_date: string, vote_average: number, genre_ids: number[], poster_path: string) {
        this.id = id;
        this.title = title;
        this.overview = overview;
        this.release_date = release_date;
        this.vote_average = vote_average;
        this.genre_ids = genre_ids;
        this.poster_path = poster_path;
    }

    static fromJSON(data: any) : Film {

        return new Film(data.id, data.title, data.overview, data.release_date, data.vote_average, data.genre_ids, data.poster_path);
    }
}
