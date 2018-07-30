import { forkJoin, concat, defer, Observable } from 'rxjs';
import { takeLast } from 'rxjs/operators';

import { PersistentStringCollection, PersistentStringAndScoreCollection, PersistentObject } from './datastore-protocols';
import { PresistentString } from './presistent-string'

const SETUP = 'SETUP';
export abstract class SetupDatabase {
   
    protected abstract readonly itemFileParser: ()=>Observable<any>;
    protected abstract readonly itemRatingFileParser: ()=>Observable<any>;

    
    protected abstract readonly RatingsForItemClass: typeof PersistentStringAndScoreCollection;
    protected abstract readonly RatingsByUserClass: typeof PersistentStringAndScoreCollection;

    protected abstract getItemFromRow(row:any):PersistentObject;

    protected abstract getRatingFromRow (row: any): {id:string, userId:string, rating:number};

    protected constructor() {

    }

    async setup():Promise<void>{
        return forkJoin(
            defer(()=>this.fillItems()), 
            concat(
                defer(()=>this.fillItemRatings()), 
                defer(async ()=>{
                     await Promise.all([
                        this.removeSetsWithFewItems(this.RatingsForItemClass),
                        this.removeSetsWithFewItems(this.RatingsByUserClass)]);
                }
        ))).pipe(takeLast(1))
        .forEach(val=>{
            console.log("Database prepared!!")
        });
    }


    private async fillItems():Promise<void>{
        const key = `${SETUP}:ItemsFilledOn:${this.RatingsForItemClass.name}`;
        let isCompleted = await PresistentString.getString(key);
        if(!isCompleted) {
            let cnt = 0;
            await this.itemFileParser()
            //.pipe(take(500))
            .forEach((row)=>{
                let item = this.getItemFromRow(row);
                item.saveToDb();
                cnt++;
                if(cnt%2000==0){
                    console.log(`${cnt} items added`);
                }
            });
            await PresistentString.setString(key, (new Date()).toString());
        }
        
    }
    
    private async fillItemRatings():Promise<void>{
        const key = `${SETUP}:ItemRatingsFilledOn:${this.RatingsForItemClass.name}`;
        let isCompleted = await PresistentString.getString(key);
        if(!isCompleted) {
            let cnt = 0;
            await this.itemRatingFileParser()
            //.pipe(take(500))
            .forEach((row)=>{
                let rating = this.getRatingFromRow(row);
                this.RatingsForItemClass.addToCollection(rating.id, rating.userId, rating.rating);
                this.RatingsByUserClass.addToCollection(rating.userId, rating.id, rating.rating)
                cnt++;
                if(cnt%2000==0){
                    console.log(`${cnt} items ratings added`);
                }
            });
            await PresistentString.setString(key, 
                                        (new Date()).toString());
        }
    }
    
    private async removeSetsWithFewItems(collection: typeof PersistentStringCollection) {
        const key = `${SETUP}:ExtraRatingsDeletedOn:${this.RatingsForItemClass.name}`;
        let isCompleted = await PresistentString.getString(key);
        if(!isCompleted) {
            let cnt = 0;
            await collection.scanIds().forEach(
                async (id)=>{
                    
                    if((await collection.getItemCount(id))<=50){
                        collection.deleteCollection(id);
                        cnt++;
                        if(cnt%500==0){
                            console.log(`${cnt}: ${id} deleted `);
                        }
                    }
                }
            )

            await PresistentString.setString(key, (new Date()).toString());
        }
       
    }



}






