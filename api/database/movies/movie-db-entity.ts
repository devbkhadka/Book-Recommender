import { RedisHash, RedisSortedSet, RedisSortedSetWithSavedKeys, RedisString } from '../redis-datastore';
import { RecommendationItem, ItemAttribute } from '../../recommend/recommendation-helper';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class Movie extends RedisHash {

    static _groupId = 'Movies';

    imdb_id: string|null = null;
    title:string|null=null;
    poster:string|null=null;
    plot:string|null=null;
    actors:string|null=null;
    director:string|null=null;
    production:string|null=null;
    rating:string|null=null;
    votes:string|null=null;
    genre:string|null=null;

    
    get groupId() {
        return Movie._groupId;
    }
    

    static getItem(id:string) {
        let item = new this(id);
        return item.loadFromStorage();
    }

}



export class UserRatingsOnMovies extends RedisSortedSetWithSavedKeys implements RecommendationItem {
    static _groupId:string = 'UserRatingsOnMovies';
    get groupId(){
        return UserRatingsOnMovies._groupId;
    }

    getAttrs(): Observable<ItemAttribute> {
        return UserRatingsOnMovies.scanCollectionItemsWithScore(this.id).pipe(map(
            val=>{
                return {name: val[0], value:val[1]};
            }
        ))
         
     }
 
 
     getAttrValue(itemId: string):Promise<number> {
         return UserRatingsOnMovies.getItemScore(this.id, itemId);
     }
 
     getAttrsOfSimilarItemWithScore(name:string): Observable<ItemAttribute> {
         return SimilarMovies.scanCollectionItemsWithScore(name).pipe(map(
             val=> {
                 return {name: val[0], value: val[1]};
             }
         ));
     }

    static getItem(id:string): Promise<UserRatingsOnMovies>{
		return Promise.resolve(new this(id))
	}
}

export class MovieRatingsByUsers extends RedisSortedSetWithSavedKeys implements RecommendationItem {
    static _groupId:string = 'MovieRatingsByUsers';
    get groupId(){
        return MovieRatingsByUsers._groupId;
    }

    getAttrs(): Observable<ItemAttribute> {
       return MovieRatingsByUsers.scanCollectionItemsWithScore(this.id).pipe(map(
           val=>{
               return {name: val[0], value:val[1]};
           }
       ))
        
    }


    getAttrValue(itemId: string):Promise<number> {
        return MovieRatingsByUsers.getItemScore(this.id, itemId);
    }

    getAttrsOfSimilarItemWithScore(name:string): Observable<ItemAttribute> {
        throw "Method not implemented";
    }

    static getItem(id:string): Promise<MovieRatingsByUsers>{
		return Promise.resolve(new this(id))
	}

}


export class SimilarMovies extends RedisSortedSet {
    static _groupId:string = 'SimilarMovies';
    get groupId(){
        return SimilarMovies._groupId;
    }

    static getItem(id:string): Promise<SimilarMovies>{
		return Promise.resolve(new this(id));
	}
}

export class MovieLinks extends RedisSortedSet {
    static _groupId:string = 'MovieLinks';

    get groupId(){
        return MovieLinks._groupId;
    }

    static getItem(id:string): Promise<MovieLinks>{
        return Promise.resolve(new this(id))
	}
}


