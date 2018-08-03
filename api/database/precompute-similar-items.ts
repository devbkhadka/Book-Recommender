import { from } from 'rxjs';
import { map, flatMap, tap} from 'rxjs/operators';

import { PresistentString} from './presistent-string';

import { simDistance } from '../recommend/similarity-calculator';
import { PersistentStringAndScoreCollection } from './datastore-protocols';
import { RecommendationItem } from '../recommend/recommendation-helper';


const RESUME_KEY = 'BR:RESUME_KEY'

/**
 * Pre-computes similarity between items which will save processing when recommending item to user.
 * @param ItemRatingsClass Type used get all stored item ratings
 * @param SimilarItemsClass Type used to save calculated similar items paried with an item
 * @param getItemRatingsInstance function to get instance of item ratings for item with given id
 */
export async function PrecomputeSimilarItems (
				ItemRatingsClass: typeof PersistentStringAndScoreCollection,
				SimilarItemsClass: typeof PersistentStringAndScoreCollection,
				getItemRatingsInstance: (id:string)=>RecommendationItem
			){

	let count = 0
	let itemCount = 0
	
	let resumeIndex = await PresistentString.getString(RESUME_KEY + ItemRatingsClass.name);

	if(resumeIndex){
		console.log("Resume from: " + resumeIndex);
	}

	getAllIdCombinationsTaken2AtOnce(ItemRatingsClass, resumeIndex)
	.forEach(async (pair:any)=>{
		let item1 = getItemRatingsInstance(pair.bookId1)
		let item2 = getItemRatingsInstance(pair.bookId2)
		let score = await simDistance(item1, item2)

		if(score>-2){
			SimilarItemsClass.addToCollection(pair.bookId1, pair.bookId2, score);
			SimilarItemsClass.addToCollection(pair.bookId2, pair.bookId1, score);
			itemCount++;
			//console.log(`${new Date()}: ${pair.bookId1}:${pair.bookId2}:${score}; Loop count: ${count}; Saved: ${itemCount}`);
		}
		
		
		if(count%1000==0 && count>1000){
		 	console.log(`${new Date()}: ${pair.bookId1}:${pair.bookId2} ; Loop count: ${count}; Saved: ${itemCount}`);
		}
		count++;
		
	}).then(()=>{
		PresistentString.delString(RESUME_KEY + ItemRatingsClass.name);
		console.log("recurssion complete");
	})

	
}

function getAllIdCombinationsTaken2AtOnce(
					ItemRatingsClass: typeof PersistentStringAndScoreCollection, 
					resumeIndex?:string
				){
	
	let pendingInnerLoops:number[] = [];
	let requestedNextBatch=false;
	return ItemRatingsClass.scanIdsInBatch(resumeIndex?+resumeIndex:undefined)
	.pipe(
    // Outer Loop, get id list in batches
    flatMap((val:[[number,string[]], (recur:boolean)=>void])=>{
		let [index, ids] = val[0];
        let sendNextBatch = val[1];
        
		for(let i=0;i<ids.length;i++){
			pendingInnerLoops.push(index+i);
		}
		requestedNextBatch=false;
		console.log("Innber loop pending " + pendingInnerLoops.length + " Completed: " + (Math.min(...pendingInnerLoops)-1));
		return from(ids).pipe(
            // Expand list of ids sent in each batch
            flatMap((id:string, i)=>{		
                let loopIndex = index + i;
                return ItemRatingsClass.scanIdsInBatch(loopIndex+1).pipe(
                    // Inner Loop, get all other ids in batch for each id from outer loop
                    flatMap(valinner=>{
                        let [, ids] = valinner[0];
                        let sendNextBatchInner = valinner[1];
                        sendNextBatchInner(true);
                        return ids;
                    }),
                    // Send one item for each combination of id and other id
                    map(
                        otherId=>{
                            return {bookId1: id, bookId2:otherId};
                        }
                    ),
                    tap(() => { }, ()=>{}, ()=>{
                        //console.log(`Inner Loop Completed: ${id}:${loopIndex}`);
                        let fi=pendingInnerLoops.indexOf(loopIndex);
                        if(fi>=0) {pendingInnerLoops.splice(fi, 1);}
                        pendingInnerLoops.length>0?PresistentString.setString(RESUME_KEY + ItemRatingsClass.name, Math.min(...pendingInnerLoops)+''):null;	
                        if(pendingInnerLoops.length<10 && !requestedNextBatch){
                            requestedNextBatch=true;
                            sendNextBatch(true);
                        }
                    })

			    );
			
             })
        )
		
	}))
}