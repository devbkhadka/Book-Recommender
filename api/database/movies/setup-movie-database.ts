import { SetupDatabase } from '../setup-database'
import * as path from 'path';
import { Movie, UserRatingsOnMovies, MovieRatingsByUsers, SimilarMovies} from './movie-db-entity'
import { getMovieParser } from './movie-parser';
import { getParser } from '../csv-parser';


const csv_options = {columns: true, delimiter:',', escape:'"', quote:'"'};

export class SetupMovieDatabase extends SetupDatabase {
    private static _instance: SetupMovieDatabase;
    
    protected readonly itemFileParser = getMovieParser (
                                getParser(path.resolve("data/movies/links.csv"), csv_options));
    protected readonly itemRatingFileParser = getParser (path.resolve("data/movies/ratings.csv"), csv_options);
   

    protected readonly RatingsForItemClass = MovieRatingsByUsers;
    protected readonly RatingsByUserClass =  UserRatingsOnMovies;

    async setup() {
        await super.setup();
        
    }

    protected getItemFromRow(row:any){
        let movie = new Movie(row['movieId']) 
        movie.loadFromKeyValue(row);
        return movie;
    }

    protected getRatingFromRow(row: any) {
        return { 
                userId:row['userId'], 
                id:row['movieId'], 
                rating: +row['rating']
            }
    }

    static getInstance() {
        return this._instance?this._instance:(new this());
    }
}


