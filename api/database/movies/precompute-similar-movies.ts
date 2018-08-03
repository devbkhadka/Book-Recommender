import {MovieRatingsByUsers, SimilarMovies} from './movie-db-entity'
import { PrecomputeSimilarItems } from '../precompute-similar-items'
import { SetupMovieDatabase } from './setup-movie-database'

/** Setup database and pre-compute similar movies to reduce process at each recommendation
 * 
*/
(async ()=>{
    await SetupMovieDatabase.getInstance().setup();
    PrecomputeSimilarItems (MovieRatingsByUsers, SimilarMovies, (id: string)=>{
        return new MovieRatingsByUsers(id);
    })
})()

