
import { RXRedis } from './rx-redis'
import { Observable, forkJoin, concat, defer, from, interval } from 'rxjs';
import { take, takeLast, map, flatMap, skip, tap} from 'rxjs/operators';
import { Database, BookRatings, UserRatings, SimilarBooks } from './data-provider';
import { getRecommendationsFor } from '../recommend/recommendation-helper'
import { simDistance } from '../recommend/similarity-calculator'

 
const redis = new RXRedis();

//Database.prepare();

//Database.fillBookRatings();


// let allBookPairs$ = BookRatings.scanSavedIds("Looper1").pipe(flatMap((val:[number, string])=>{
// 		let [index, id] = val;
// 		console.log(`${index}:${id}`)
// 		return BookRatings.scanSavedIds(index+1).pipe(map(otherId=>{
// 			return {bookId1:id, bookId2:otherId, index: index};
// 		}));
// 	}));

// allBookPairs$.forEach(async (pair:any)=>{
// 	//console.log(pair.bookId1 +':'+pair.bookId2);
// })

let count = 0
	let itemCount = 0
	let pendingInnerLoop = 0;
	BookRatings.scanIdRecursive()
	.pipe(flatMap((val)=>{
		let [index, ids] = val.value;
		console.log(index+'----------')
		pendingInnerLoop++;
		setTimeout(val.shouldRecur, 5000, true)
		return ids
		
	}))
	.forEach(async (id:string)=>{
		console.log(id)
	}).then(()=>{
		console.log("recurssion complete");
	})



// let score =0;
// UserRatings.scanIdPaginated(50, 2).forEach(val=>{
// 	console.log(val);
// })



/*
redis-cli --scan --pattern "BR:BookRatings:*" | sed -e 's/"/\\"/g' | xargs redis-cli del 
redis-cli --scan --pattern "BR:UserRatings:*" | sed -e 's/"/\\"/g' | xargs redis-cli del 

redis-cli --scan --pattern "BR:Books:*" | sed -e 's/"/\\"/g' | xargs redis-cli del



*/