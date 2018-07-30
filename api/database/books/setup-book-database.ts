import { SetupDatabase } from '../setup-database'
import * as path from 'path';
import { Book, BookRatings, UserRatings } from './book-db-entity';
import { getParser } from '../csv-parser';

const csv_options = {columns: true, delimiter:';', escape:'\\', quote:'"'};

export class SetupBookDatabase extends SetupDatabase {
    private static _instance: SetupBookDatabase;
    protected readonly itemFileParser = getParser (path.resolve("data/books/BX-Books.csv"), csv_options);
    protected readonly itemRatingFileParser = getParser (path.resolve("data/books/BX-Book-Ratings.csv"), csv_options);
   
    protected readonly RatingsForItemClass = BookRatings;
    protected readonly RatingsByUserClass =  UserRatings;


    protected getItemFromRow(row:any){
        let book = new Book(row['ISBN'])
            
            book.title = row["Book-Title"];
            book.author = row["Book-Author"];
            book.yearOfPublication = row["Year-Of-Publication"];
            book.publisher = row["Publisher"];
            book.imageURLS = row["Image-URL-S"];
            book.imageURLM = row["Image-URL-M"];
            book.imageURLL = row["Image-URL-L"];
            
        return book;
    }

    protected getRatingFromRow(row: any) {
        return { 
                userId:row['User-ID'], 
                id:row['ISBN'], 
                rating: +row['Book-Rating']
            }
    }

    static getInstance() {
        return this._instance?this._instance:(new this());
    }
}


