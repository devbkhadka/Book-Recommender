import { Observable, concat, from } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';

export interface ItemAttribute{
	name: string;
	value: number;
}

interface Ratings{
	[index:string]:number;
}

export interface RecommendationItem{
	getAttrs(): Observable<ItemAttribute>;
	getAttrValue(name:string): Promise<number>;
	getAttrsOfSimilarItemWithScore(name:string): Observable<ItemAttribute>
}

/**
	@description find top matching new attributes for the item based on the attributes of the item 
	and pre-computed similar attributes
	@return Observable of array of {name, value} for top matches
*/
export function getRecommendationsFor(item:RecommendationItem):Observable<ItemAttribute[]>{
	const currentItemRating:Ratings= {};
	const recommendationsByName:any = {};
	const recommendations:ItemAttribute[] = new Array<ItemAttribute>();


	const waitFor = (async ()=>{

		await item.getAttrs().pipe(take(200)).forEach((attr:ItemAttribute)=>{
			currentItemRating[attr.name] = attr.value;
		});

		for(let key of Object.keys(currentItemRating)){
			await item.getAttrsOfSimilarItemWithScore(key).pipe(take(50), 
			filter((similarItem:ItemAttribute)=>{
				return !currentItemRating[similarItem.name];
			})). 
			forEach((similarItem:ItemAttribute)=>{
				let ratingItem = recommendationsByName[similarItem.name]

				if(!ratingItem){
					ratingItem = {name:similarItem.name, value:0, count:1}
					recommendationsByName[similarItem.name] = ratingItem
					recommendations.push(ratingItem)
				}

				ratingItem.value = (ratingItem.count/(ratingItem.count+1))*ratingItem.value 
					+ (currentItemRating[key] * similarItem.value)/(ratingItem.count+1);
				ratingItem.count++;
			})

		}
	})();

	return from(waitFor).pipe(map(
		val=>{
			console.log("calculation completed");
			return recommendations.sort((item1:ItemAttribute,item2:ItemAttribute)=>{
				return item1.value<=item2.value?1:-1;
			})
		}
	))
	

}




