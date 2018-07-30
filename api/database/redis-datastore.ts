import { Observable, Subject, ReplaySubject, from, of, range } from 'rxjs';
import { map, filter, switchMap, flatMap, bufferCount, scan} from 'rxjs/operators';
import { RedisHelper, getGroupPrefix, getKey, convertPromise } from './redis-helper';

import { StringKeyValue, PersistentStringCollection, 
    PersistentItem, PersistentObject, 
    PersistentStringAndScoreCollection } from './datastore-protocols';


const DB_STRING_GROUPID = 'PRESISTENTSTRING';

class RedisItemUtils {
    static deleteFromDb(self: PersistentItem) {
        return RedisHelper.removeKey(getKey(self.groupId, self.id))
     }
 
     
     static scanIds(groupId:string) {
         return RedisHelper.scanAllKeys(`${getGroupPrefix(groupId)}*`).pipe(map(
             val=>{
                 return val.replace(getGroupPrefix(groupId),'');
             }
         ));
     }

     static scanIdsInBatch(groupId:string, cursor:string){
         return RedisHelper.scanKeysInBatch(groupId, cursor);
     }
}


abstract class RedisItem extends PersistentObject {
    static _groupId:string;

    
    deleteFromDb(): Promise<void> {
       return RedisItemUtils.deleteFromDb(this);
    }

    
    static scanIds() {
        return RedisItemUtils.scanIds(this._groupId);
    }

    static scanIdsInBatch(cursor:string='0'){
        return RedisItemUtils.scanIdsInBatch(this._groupId, cursor);
    }

    static scanItems() {
        return this.scanIds().pipe(flatMap(id=>{
            return this.getItem(id);
        }))
    }
}



export class RedisString {
    static _groupId = DB_STRING_GROUPID;

    static setString(key: string, value: string) {
        return RedisHelper.setString(getKey(this._groupId, key), value);
    }

    static getString(key: string){
        return RedisHelper.getString(getKey(this._groupId, key));
    }

    static delString(key: string) {
        return RedisHelper.removeKey(getKey(this._groupId, key));
    }

}



export abstract class RedisHash extends RedisItem {
   
    loadFromStorage(): Promise<RedisHash> {
        return RedisHelper.getHash(getKey(this.groupId, this.id))
             .then(
                (val: any)=>{
                 this.loadFromKeyValue(val)
                 return this;
             })
     }
 
     saveToDb() {
         return convertPromise(RedisHelper.setHash(getKey(this.groupId, this.id), this));
     }

     loadFromKeyValue(dict:StringKeyValue): RedisHash {
        
        for(let key in this) {
            if(key != '_id'){
                (this as any)[key] = dict[key] as string;
            }  
        }
        return this;
    }

    static setItemFieldValues(id: string, fieldName: string, value: string) {
        let obj:any = {};
        obj[fieldName] = value;
        return RedisHelper.setHash (getKey(this._groupId, id), obj);
    }

    static getItemFieldValue(id: string, fieldName: string): Promise<string>{
        return RedisHelper.getHashFieldValue(getKey(this._groupId, id), fieldName);
    }
    
}




export abstract class RedisSortedSet extends PersistentStringAndScoreCollection {
    static _groupId: string;

    static scanIds() {
        return RedisItemUtils.scanIds(this._groupId);
    }

    static addToCollection(id: string, itemId:string, score: number) {
        return RedisHelper.addToOrderedSet(getKey(this._groupId, id), itemId, score);
    }

    
    static deleteItemFromCollection(id:string, itemId:string):Promise<boolean> {
        throw 'Method not implemented';
    }

     static existsInCollection(id:string, itemId:string): Promise<boolean> {
        throw 'Method not implemented';
     }

    static scanCollectionItems(id:string, start: number=0, stop: number=-1) {
        return RedisHelper.scanSortedSet(getKey(this._groupId, id), start, stop).pipe(map(
            val=>{
                return val[0];
            }
        ));
    }

    static scanCollectionsItemsInBatch(id:string, start: number=0)
                            :Observable<[[number, string[]], (shouldSend:boolean)=>void]> {
        return RedisHelper.scanSortedSetInBatch(getKey(this._groupId, id), start)
    }

    static scanCollectionItemsWithScore(id:string, start: number=0, stop: number=-1) {
        return RedisHelper.scanSortedSet(getKey(this._groupId, id), start, stop);
    }

    static getItemScore(id:string, itemId: string){
        return RedisHelper.getOrderedSetItemScore(getKey(this._groupId, id), itemId);
    }

    static getItemCount(id:string ): Promise<number> {
        return RedisHelper.countOrderedSet(getKey(this._groupId, id));
    }

    deleteFromDb():Promise<void> {
        return RedisSortedSet.deleteCollection(this.id);
    }

    static deleteCollection (id: string): Promise<void>{
        return RedisHelper.removeKey(getKey(this._groupId, id));
    }
    
}

export abstract  class RedisSortedSetWithSavedKeys extends RedisSortedSet {
    static ALL_KEYS_ID = "AllKeys";
    static _groupId:string;
    
    static scanIds(): Observable<string> {
        // return RedisHelper.scanSortedSetInBatch(getKey(this._groupId, this.ALL_KEYS_ID), start)
        //     .pipe(flatMap(
        //         val=>{
        //             let [result, sendNextBatch] = val;
        //             sendNextBatch(true);
        //             return from(result[1]);
        //         }
        //     ))
        return RedisItemUtils.scanIds(this._groupId);
    }

    // static scanIdsPaginated(page: number, count: number): Observable<string> {
    //     return RedisHelper.scanSortedSet(getKey(this._groupId, this.ALL_KEYS_ID)
    //                 , page*count, (page + 1)*count-1).pipe(map(
    //                     val=>{
    //                         return val[0];
    //                     }
    //                 ))
    // }

    static scanIdsInBatch(start:number=0) {
        return RedisHelper.scanSortedSetInBatch(getKey(this._groupId, this.ALL_KEYS_ID), start);
    }

    static addToCollection (id: string, itemId: string, score: number) {
        return RedisHelper.addToOrderedSetAndSaveKey(getKey(this._groupId, id), itemId, score, 
        getKey(this._groupId, RedisSortedSetWithSavedKeys.ALL_KEYS_ID), id)
    }


    static deleteCollection (id: string){
        return RedisHelper.removeKeyAndSavedKey(getKey(this._groupId, id), 
                                    getKey(this._groupId, RedisSortedSetWithSavedKeys.ALL_KEYS_ID),
                                    id)
    }

    static deleteItemFromCollection(id:string, itemId:string):Promise<boolean> {
        throw 'Method not implemented';
    }


    deleteFromDb():Promise<void> {
        return RedisSortedSetWithSavedKeys.deleteCollection(this.id);
    }

}







