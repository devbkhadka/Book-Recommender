import {BookRatings, SimilarBooks} from './book-db-entity'
import { PrecomputeSimilarItems } from '../precompute-similar-items'
import { SetupBookDatabase } from './setup-book-database'

/** Setup database and pre-compute similar movies to reduce process at each recommendation
 * 
*/
(async ()=>{
    await SetupBookDatabase.getInstance().setup();
    PrecomputeSimilarItems (BookRatings, SimilarBooks, (id: string)=>{
        return new BookRatings(id);
    })
})()

