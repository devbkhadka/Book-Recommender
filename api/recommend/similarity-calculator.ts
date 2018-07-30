import { RecommendationItem, ItemAttribute } from './recommendation-helper'
import { BookRatings } from '../database/data-provider'
import { flatMap } from 'rxjs/operators'

const MIN_ATTR_MATCH = 3;

export function simDistance(item1:RecommendationItem, item2:RecommendationItem): Promise<number> {
	
	return new Promise<number>(async (_resolve, _reject)=>{

		let sqDistance = 0;
		let matchedAttrs = 0;
		
		await item1.getAttrs().pipe(flatMap((attr: ItemAttribute)=>{
			return item2.getAttrValue(attr.name);
		},
		(attr1: ItemAttribute, val2:number, i1:number, i2:number)=>{
			return [attr1, val2];
		}
		)).forEach(pair=>{
				let attr = pair[0] as ItemAttribute;
				let val = pair[1];
				if(val!=null){
					let item2Val = Number(val);
					if((attr as ItemAttribute).value!=0 || item2Val!=0){ //discard if both ratings are 0
						matchedAttrs++;
						sqDistance += (item2Val-attr.value) * (item2Val-attr.value);
					}
				}
		})


		let similarity = 1/(1+sqDistance);
		
		_resolve(matchedAttrs>MIN_ATTR_MATCH?similarity:-2);
	})
	
}


export function simPearson(): number {
	return 0;
}

