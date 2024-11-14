import * as fs from 'fs';
import * as path from 'path';
import { Genre } from '../models/Genre';

class GenreRepository {
    private genreDataPath = path.resolve(__dirname, '../data/genres.json');

    getGenres(): Genre[] | null {
        if (fs.existsSync(this.genreDataPath)) {
            const data = fs.readFileSync(this.genreDataPath, 'utf8');
            //return JSON.parse(data) as Genre[];
            return JSON.parse(data).map((d:any) => Genre.fromJSON(d))
        }
        return null;
    }
}

export default GenreRepository;
