'use strict'

import { Observable, Subject, ReplaySubject, from, of, range } from 'rxjs';
import { map, filter, switchMap, flatMap, take, skip, tap} from 'rxjs/operators';

import { Database, BookRatings, SimilarBooks } from './data-provider';

import { RecommendationItem, ItemAttribute } from '../recommend/recommendation-helper';
import { simDistance } from '../recommend/similarity-calculator';


/* ########## SUDO CODE OF WHAT THE FOLLOWING CODE WILL DO #################
		loop for every book from all books with ratings
			loop for every other book from all books with ratings
			   get ratings of book
			   get ratings of other book
			   calculate similarity score between book and other book
			   add the other book and score to similar books list of book
			   add the book and score to similar books list of other book

*/

export async function fill(){
	
	const LIMIT = 1000;
	const RESUME_KEY = 'BR:RESUME_KEY'

	await Database.prepare();




	let count = 0
	let itemCount = 0
	let pendingInnerLoops:number[] = [];
	let fetchPending=false;

	let resumeIndex = await Database.getString(RESUME_KEY);

	if(resumeIndex){
		console.log("Resume from: " + resumeIndex);
	}

	BookRatings.scanIdRecursive(resumeIndex?+resumeIndex:undefined)
	.pipe(flatMap((val:{value:[number,string[]], shouldRecur:(recur:boolean)=>void})=>{
		let [index, ids] = val.value;
		
		for(let i=0;i<ids.length;i++){
			pendingInnerLoops.push(index+i);
		}
		fetchPending=false;
		console.log("pending inner loops: " + pendingInnerLoops.length);
		return from(ids).pipe(flatMap((id:string, i)=>{
			
			let loopIndex = index + i;
			return BookRatings.scanSavedIds(loopIndex+1).pipe(
			map(otherId=>{
				return {bookId1:id, bookId2:otherId};
			}),
			tap(val=>{}, ()=>{}, ()=>{
				console.log(`Inner Loop Completed: ${id}:${loopIndex}`);
				let fi=pendingInnerLoops.indexOf(loopIndex);
				if(fi>=0) {pendingInnerLoops.splice(fi, 1);}
				pendingInnerLoops.length>0?Database.setString(RESUME_KEY, Math.min(...pendingInnerLoops)+''):null;	
				if(pendingInnerLoops.length<10 && !fetchPending){
					fetchPending=true;
					val.shouldRecur(true);
				}
			})

			);
			
		}))
		
	}))
	.forEach(async (pair:any)=>{
		let item1:BookRatings = new BookRatings(pair.bookId1)
		let item2:BookRatings = new BookRatings(pair.bookId2)
		let score = await simDistance(item1, item2)

		if(score>-2){
			SimilarBooks.addToCollection(item1.id, item2.id, String(score));
			SimilarBooks.addToCollection(item2.id, item1.id, String(score));
			itemCount++;
			//console.log(`${new Date()}: ${pair.bookId1}:${pair.bookId2}:${score}; Loop count: ${count}; Saved: ${itemCount}`);
		}
		
		
		if(count%10000==0){
		 	console.log(`${new Date()}: ${pair.bookId1}:${pair.bookId2} ; Loop count: ${count}; Saved: ${itemCount}`);
		}
		count++;
		
	}).then(()=>{
		Database.removeString(RESUME_KEY);
		console.log("recurssion complete");
	})

	
}

fill();



