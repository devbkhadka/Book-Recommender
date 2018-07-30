import { Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { RecommendationItem, ItemAttribute } from '../recommend/recommendation-helper';

export interface StringKeyValue {
    [index: string]: string;
}
export abstract class PersistentItem {
	private  _id:string;
	abstract readonly groupId: string;

	constructor(id:string){
		this._id = id;
	}

	get id():string {
		return this._id;
	}

	abstract deleteFromDb(): Promise<any>;

	static scanIds():Observable<string> {
		throw "Method not implemented. Sub class must implement this method."
	}

	static scanIdsInBatch(cursor:string|number = '0'):Observable<[[string|number, string[]], (shouldSend:boolean)=>void]>{
		throw "Method not implemented. Sub class must implement this method."
	}

	static getItem(id:string): Promise<PersistentItem>{
		throw "Method not implemented. Sub class must implement this method."
	}
}

export abstract class PersistentObject extends PersistentItem {
	
	abstract loadFromStorage():Promise<PersistentObject>;

	abstract loadFromKeyValue(dict:StringKeyValue):PersistentObject;

	abstract saveToDb(): Promise<void>;

	static scanItems(): Observable<PersistentObject> {
		throw "Method not implemented. Sub class must implement this method."
	}

	static getItem(id:string): Promise<PersistentObject>{
		throw "Method not implemented. Sub class must implement this method."
	}

	static setItemFieldValues(id: string, fieldName: string, value: string) {
		throw "Method not implemented. Sub class must implement this method."
	}

	static getItemFieldValue(id: string, fieldName: string): Promise<string>{
		throw "Method not implemented. Sub class must implement this method."
	}

}

export abstract class PersistentStringCollection extends PersistentItem {
	
	static deleteCollection(id:string):Promise<void>{
		throw "Method not implemented. Sub class must implement this method."
	}

	static addToCollection(id:string, itemId:string, score?:number): Promise<boolean> {
		throw "Method not implemented. Sub class must implement this method."
	}

	static deleteItemFromCollection (id: string, itemId: string) {
		throw "Method not implemented. Sub class must implement this method.";
	}

	static existsInCollection(id:string, itemId: string): Promise<boolean> {
		throw "Method not implemented. Sub class must implement this method.";
	}	
	static scanCollectionItems(id:string, startIndex?: number, count?: number ): Observable<string> {
		throw "Method not implemented. Sub class must implement this method.";
	}
	static scanCollectionsItemsInBatch(id:string, start:number=0): Observable<[[number, string[]], (shouldSend:boolean)=>void]> {
		throw "Method not implemented. Sub class must implement this method.";
	}
	static getItemCount(id:string ): Promise<number> {
		throw "Method not implemented. Sub class must implement this method.";
	}

	static getItem(id:string): Promise<PersistentStringCollection>{
		throw "Method not implemented. Sub class must implement this method."
	}

}

export abstract class PersistentStringAndScoreCollection extends PersistentStringCollection{
	static scanCollectionItemsWithScore(id:string, startIndex?: number, count?:number): Observable<[string, number]> {
		throw "Method not implemented. Sub class must implement this method.";
	}
	static getItemScore(id:string, itemId:string): Promise<number> {
		throw "Method not implemented. Sub class must implement this method.";
	}

	static getItem(id:string): Promise<PersistentStringAndScoreCollection>{
		throw "Method not implemented. Sub class must implement this method."
	}
}







