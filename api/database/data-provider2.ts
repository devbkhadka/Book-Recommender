import * as csv_parser from './csv-parser';
import * as path from 'path';
import {RXRedis} from './rx-redis';

import { Observable, Subject, ReplaySubject, from, of, range } from 'rxjs';

import { flatMap, takeLast, map, pairwise, bufferCount} from 'rxjs/operators';

import { ItemAttribute, RecommendationItem } from '../recommend/recommendation-helper'


export interface PersistentItem {
	readonly id: string;
	readonly groupId: string;

	scanItems(): Observable<PersistentItem>;
}

export interface PersistentObject extends PersistentItem {
	saveToDb(): Promise<boolean>;
	deleteFromDb(): Promise<boolean>;


	scanItems(): Observable<PersistentObject>;
}

export interface PersistentCollection extends PersistentItem {
	
	addToCollection(): Promise<boolean>;
	deleteFromCollection(): Promise<boolean>;
	existsInCollection(itemId: string): Promise<boolean>;	
	

}

export interface PersistentSortedCollection extends PersistentCollection{
	scanSortedItems(startIndex?:string|number, count?:number): Observable<[string, number]>;
}




//Redis adapter
export interface PersistenceTarget {
	scanIds(startIndex?:string|number, count?:number): Observable<string>;
	getDatabaseKey(id: string): string;


}




