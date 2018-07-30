import { Observable, forkJoin, concat, defer, from, interval } from 'rxjs';
import { take, takeLast, map, flatMap, skip, tap} from 'rxjs/operators';

import { SetupBookDatabase } from './books/setup-book-database';
import { SetupMovieDatabase } from './movies/setup-movie-database';
import { getMovieParser } from './movies/movie-parser';
import { getParser } from './csv-parser';
import * as path from 'path';



SetupMovieDatabase.getInstance().setup();



/*
redis-cli --scan --pattern "BR:BookRatings:*" | sed -e 's/"/\\"/g' | xargs redis-cli del 
redis-cli --scan --pattern "BR:UserRatings:*" | sed -e 's/"/\\"/g' | xargs redis-cli del 
redis-cli --scan --pattern "BR:SimilarBooks:*" | sed -e 's/"/\\"/g' | xargs redis-cli del 
redis-cli --scan --pattern "BR:Books:*" | sed -e 's/"/\\"/g' | xargs redis-cli del
*/