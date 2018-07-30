import { RedisHash, RedisSortedSet, RedisSortedSetWithSavedKeys, RedisString } from '../redis-datastore';
import { RecommendationItem, ItemAttribute } from '../../recommend/recommendation-helper';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class Book extends RedisHash {

    static _groupId = 'Books';

    title:string|null=null;
	author:string|null=null;
	yearOfPublication:string|null=null;
	publisher:string|null=null;
	imageURLS:string|null=null;
	imageURLM:string|null=null;
    imageURLL:string|null=null;
    
    
    get groupId() {
        return Book._groupId;
    }
    

    static getItem(id:string) {
        let item = new this(id);
        return item.loadFromStorage();
    }

}



export class UserRatings extends RedisSortedSetWithSavedKeys implements RecommendationItem {
    static _groupId:string = 'UserRatings';
    get groupId(){
        return UserRatings._groupId;
    }

    getAttrs(): Observable<ItemAttribute> {
        return UserRatings.scanCollectionItemsWithScore(this.id).pipe(map(
            val=>{
                return {name: val[0], value:val[1]};
            }
        ))
         
     }
 
 
     getAttrValue(itemId: string):Promise<number> {
         return UserRatings.getItemScore(this.id, itemId);
     }
 
     getAttrsOfSimilarItemWithScore(name:string): Observable<ItemAttribute> {
         return SimilarBooks.scanCollectionItemsWithScore(name).pipe(map(
             val=> {
                 return {name: val[0], value: val[1]};
             }
         ));
     }

    static getItem(id:string): Promise<UserRatings>{
		return Promise.resolve(new this(id))
	}

}

export class BookRatings extends RedisSortedSetWithSavedKeys implements RecommendationItem {
    static _groupId:string = 'BookRatings';
    get groupId(){
        return BookRatings._groupId;
    }

    getAttrs(): Observable<ItemAttribute> {
       return BookRatings.scanCollectionItemsWithScore(this.id).pipe(map(
           val=>{
               return {name: val[0], value:val[1]};
           }
       ))
        
    }


    getAttrValue(itemId: string):Promise<number> {
        return BookRatings.getItemScore(this.id, itemId);
    }

    getAttrsOfSimilarItemWithScore(name:string): Observable<ItemAttribute> {
        throw "Method not implemented";
    }

    static getItem(id:string): Promise<BookRatings>{
		return Promise.resolve(new this(id))
	}

}


export class SimilarBooks extends RedisSortedSet {
    static _groupId:string = 'SimilarBooks';
    get groupId(){
        return SimilarBooks._groupId;
    }

    static getItem(id:string): Promise<SimilarBooks>{
		return Promise.resolve(new this(id))
	}
}