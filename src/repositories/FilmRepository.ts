import * as fs from 'fs';
import * as path from 'path';
import { Film } from '../models/Film';

class FilmRepository {
    private filmDataPath = path.resolve(__dirname, '../data/filmData.json');

    getFilms(): Film[] | null {
        if (fs.existsSync(this.filmDataPath)) {
            const data = fs.readFileSync(this.filmDataPath, 'utf8');
            //return JSON.parse(data) as Film[];
            return JSON.parse(data).map((d:any) => Film.fromJSON(d))
        }
        return null;
    }
}

export default FilmRepository;
