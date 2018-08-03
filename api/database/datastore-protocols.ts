import { Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { RecommendationItem, ItemAttribute } from '../recommend/recommendation-helper';
/**
 * Indexable key value pair whose key and vaule are strings.
 */
export interface StringKeyValue {
    [index: string]: string;
}


/**
 * Base class for presistent items it defines abstract or not-implemented methods to get id, 
 * scan all ids of all instance of the types and get a particular item.
 */
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

	/**
	 * @returns Observalbe of ids of all objects stored. 
	 */
	static scanIds():Observable<string> {
		throw "Method not implemented. Sub class must implement this method."
	}

	/**
	 * @returns Observalbe of [[index, ids], sendNextBatch] of all objects stored in batches. Next batch is 
	 * sent only after Observer calls "sendNextBatch" function.
	 * @param cursor: cursor from where the scan will start, it may be index or some key of data segment
	 */
	static scanIdsInBatch(cursor:string|number = '0'):Observable<[[string|number, string[]], (shouldSend:boolean)=>void]>{
		throw "Method not implemented. Sub class must implement this method."
	}

	static getItem(id:string): Promise<PersistentItem>{
		throw "Method not implemented. Sub class must implement this method."
	}
}


/** Base class representing presistent object. Its subclass should implement all the
 * static methods else it will throw not implemented exception
 * 
 */
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


/** Base class representing collection of string. Its subclass should implement all the
 * static methods else it will throw not implemented exception
 * 
 */
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


/** Base class representing collection of string. Its subclass should implement all the
 * static methods else it will throw not implemented exception
 * 
 */
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







