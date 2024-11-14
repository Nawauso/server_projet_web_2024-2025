export class Film {
    public id: number;
    public title: string;
    public overview: string;
    public release_date: string;
    public vote_average: number;
    public genre_ids: number[];

    constructor(id: number, title: string, overview: string, release_date: string, vote_average: number, genre_ids: number[]) {
        this.id = id;
        this.title = title;
        this.overview = overview;
        this.release_date = release_date;
        this.vote_average = vote_average;
        this.genre_ids = genre_ids;
    }

    static fromJSON(data: any) : Film {

        return new Film(data.id, data.title, data.overview, data.release_date, data.vote_average, data.genre_ids);
    }
}
