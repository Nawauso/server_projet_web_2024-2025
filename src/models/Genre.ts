export class Genre {
    protected id: number;
    protected name: string;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }

    static fromJSON(data: any) : Genre {
        return new Genre(data.id, data.name);
    }
}