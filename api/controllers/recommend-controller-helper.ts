import { getRecommendationsFor, ItemAttribute, RecommendationItem } from '../recommend/recommendation-helper'
import { Request, Response } from 'express'
import { from} from 'rxjs'
import { flatMap, toArray, take, filter } from 'rxjs/operators'
import { PersistentObject, PersistentStringAndScoreCollection } from '../database/datastore-protocols';


export async function recommendItemFor(ItemClass: typeof PersistentObject,  
					UserRatingsClass: typeof PersistentStringAndScoreCollection, 
					req:Request, resp:Response){
	let userId = req.params['userid'];

	let ratings: RecommendationItem = await UserRatingsClass.getItem(userId) as any;


	
	getRecommendationsFor(ratings).pipe(flatMap((items:ItemAttribute[])=>{
		return from(items).pipe(take(50), flatMap((item:ItemAttribute)=>{
			return ItemClass.getItem(item.name)
		},
		(rating, item:any)=>{
			item['score'] = rating.value;
			return item;
		}
		
		))
	}), toArray()).toPromise().then(
		val=>{
			resp.send(val);
		}
	);
}


export function getUsers(UserRatingsClass: typeof PersistentStringAndScoreCollection, 
					req:Request, resp:Response){
	
	let count = +req.param('count');
	let start = (+req.param('page')-1)*count;
	let itemCont =0;

	UserRatingsClass.scanIdsInBatch(start).pipe(flatMap(
		val=>{
			let [result, sendNextBatch] = val;
			let ids = result[1]
			itemCont+=ids.length;
			sendNextBatch(itemCont<=count);
			return ids;
		}
	), toArray()).toPromise().then(val=>{
		resp.send(val);
	})
}


export async function getUserRatings(
			ItemClass: typeof PersistentObject,  
			UserRatingsClass: typeof PersistentStringAndScoreCollection, 
			req:Request, resp:Response){
	let userId = req.param('userid');
	let ratings: RecommendationItem = await UserRatingsClass.getItem(userId) as any;

	let result = await ratings.getAttrs().pipe(
		take(30), 
		flatMap(
			(attr:ItemAttribute)=>{
				return ItemClass.getItem(attr.name);
			},
			(rating, item)=>{
				(item as any) ['score'] = rating.value;
				return item;
			}
		),
		filter(
			(val:any)=>{
				return !!val.title;
			}
		),
		toArray()
	).toPromise()

	resp.send(result);

}