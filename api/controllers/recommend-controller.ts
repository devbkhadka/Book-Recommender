import { Database, UserRatings, Book } from '../database/data-provider'
import { getRecommendationsFor, RecommendationItem, ItemAttribute } from '../recommend/recommendation-helper'
import { Request, Response } from 'express'
import { from} from 'rxjs'
import { flatMap, toArray, take } from 'rxjs/operators'

export function recommendBoook(req:Request, resp:Response){
	let userId = req.params['userid'];

	let ratings = new UserRatings(userId)

	getRecommendationsFor(ratings).pipe(flatMap((items:ItemAttribute[])=>{
		return from(items).pipe(take(50), flatMap((item:ItemAttribute)=>{
			return Book.getBook(item.name)
		},
		(rating, book:any, x, y)=>{
			book['score'] = rating.value;
			return book;
		}
		
		))
	}), toArray()).toPromise().then(val=>{
		resp.send(val);
	})
}


export function getUsers(req:Request, resp:Response){
	let page = +req.param('page')-1;
	let count = +req.param('count');
	UserRatings.scanIdPaginated(count, page).pipe(toArray()).toPromise().then(val=>{
		resp.send(val);
	})
}


export async function getUserRatings(req:Request, resp:Response){
	let userId = req.param('userid');
	let ratings = new UserRatings(userId)

	let result = await ratings.getAttrs().pipe(flatMap((attr:ItemAttribute)=>{
		return Book.getBook(attr.name);
	},
	(rating, book:any, x, y)=>{
		book['score'] = rating.value;
		return book;
	}), 
	toArray()
	).toPromise()

	resp.send(result);

}