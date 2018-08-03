import { SetupDatabase } from '../setup-database'
import * as path from 'path';
import { Movie, UserRatingsOnMovies, MovieRatingsByUsers, SimilarMovies} from './movie-db-entity'
import { getMovieParser } from './movie-parser';
import { getParser } from '../csv-parser';


const csv_options = {columns: true, delimiter:',', escape:'"', quote:'"'};


/**
 * Setup database by filling it with movies, ratings grouped by user and book from data file. 
 * Movie details will be filled using imdb api
 */
export class SetupMovieDatabase extends SetupDatabase {
    private static _instance: SetupMovieDatabase;
    
    protected readonly itemFileParser = getMovieParser (
                                getParser(path.resolve("data/movies/links.csv"), csv_options));
    protected readonly itemRatingFileParser = getParser (path.resolve("data/movies/ratings.csv"), csv_options);
   

    protected readonly RatingsForItemClass = MovieRatingsByUsers;
    protected readonly RatingsByUserClass =  UserRatingsOnMovies;


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


