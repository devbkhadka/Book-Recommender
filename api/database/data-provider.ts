import * as csv_parser from './csv-parser';
import * as path from 'path';
import {RXRedis} from './rx-redis';

import { Observable, Subject, ReplaySubject, from, of, range, forkJoin, concat, defer } from 'rxjs';
import { flatMap, takeLast, map, pairwise, bufferCount, take } from 'rxjs/operators';

import { ItemAttribute, RecommendationItem } from '../recommend/recommendation-helper'


const redis = new RXRedis();

interface StringKeyValue {
    [index: string]: string;
}


interface DatabaseItem {
	readonly id:string;
	readonly dbKey:string;
	saveToDb():Promise<0 | 1>;

}

interface DatabaseCollection extends DatabaseItem {
	getAttrs():Observable<ItemAttribute>;
	getAttrValue(name:string):Promise<string>;
	addToCollection(item:string, score:string):Promise<{}>;
	removeFromCollection(item:string):Promise<0|1>;
}


class DBKeyHelper{
	static DBPrefix = "BR:";
	static ALL_KEYS_ID = "AllKeys";
	readonly prefix:string;
	constructor(prefix:string){
		this.prefix = `${DBKeyHelper.DBPrefix}${prefix}`;
	}

	getDBKey(id:string){
		return `${this.prefix}${id}`;
	}
	
	protected idScannerBase(scanner:(()=>Observable<any>), resumeId?:string|number){
		return ()=>{
			return scanner().pipe(map((key:any)=>{
				key[1] = key[1].replace(this.prefix, "");
				if(resumeId && typeof resumeId!='number'){
					return key;
				}
				else {
					return key[1]
				}
			}));
		}
	}

	idScanner(resumeId?:string){
		return this.idScannerBase(this.dbKeyScanner(resumeId), resumeId);
	}
	

	protected dbKeyScanner(resumeId?:string){
		return ()=>{
			const pattern = `${this.prefix}*`;
			return redis.resumableKeyScan(pattern, resumeId)
		}	
	}

	removeSetsWithFewItems(){
		let cnt = 0;
		return this.idScanner()().pipe(flatMap((id:string)=>{
			return from(redis.countOrderedSet(this.getDBKey(id)))
					.pipe(map(cnt=>{
						return {id:id, cnt:cnt}
					}))
		})).forEach((obj:any)=>{
			if(obj.cnt<=10){
				cnt++;
				this.removeKey(obj.id);
				if(cnt%500==0){
					console.log(`${cnt} ${this.getDBKey(obj.id)} deleted `);
				}
			}
			else{

			}
		})
	}

	protected removeKey(id:string){
		redis.removeKey(this.getDBKey(id))
	}

}


class DBSavedKeyHelper extends DBKeyHelper{
	protected dbSavedKeyScanner(resumeId?:string|number){
		return ()=>{
			let allKeysId = this.getDBKey(DBKeyHelper.ALL_KEYS_ID);
			return redis.resumableSavedKeyScan(allKeysId, resumeId);
		}
	}

	savedIdScanner(resumeId?:string|number){
		return this.idScannerBase(this.dbSavedKeyScanner(resumeId), resumeId);
	}

	protected removeKey(id:string){
		return redis.removeSavedKey(this.getDBKey(id), this.getDBKey(DBKeyHelper.ALL_KEYS_ID), id)
	}

}



export class Book implements DatabaseItem{

	private static keyHelper = new DBKeyHelper("Books:");

	ISBN:string;
	title:string|null=null;
	author:string|null=null;
	yearOfPublication:string|null=null;
	publisher:string|null=null;
	imageURLS:string|null=null;
	imageURLM:string|null=null;
	imageURLL:string|null=null;

	constructor(ISBN:string)
	constructor(obj:StringKeyValue)
	constructor(val:string|StringKeyValue)
	{
		if(typeof val == 'string') {
			this.ISBN = val;
		}
		else{
			this.ISBN = val["ISBN"];
			this.title = val["Book-Title"];
			this.author = val["Book-Author"];
			this.yearOfPublication = val["Year-Of-Publication"];
			this.publisher = val["Publisher"];
			this.imageURLS = val["Image-URL-S"];
			this.imageURLM = val["Image-URL-M"];
			this.imageURLL = val["Image-URL-L"];
		}
	}

	get id(){
		return this.ISBN;
	}

	get dbKey():string {
		return Book.keyHelper.getDBKey(this.ISBN);
	}

	static scanIds(){
		return Book.keyHelper.idScanner()();
	}

	saveToDb(){
		return redis.setHash(this.dbKey, this);
	}

	/**
	@param ISBN: ISBN number of book to look
	*/
	static getBook(ISBN:string):PromiseLike<Book>{
		let bookHash = redis.getHash(Book.keyHelper.getDBKey(ISBN));
		return from(bookHash).pipe(map(hash=>{
			return hash as Book;
		})).toPromise() ;
	}


}


abstract class SortedSet implements DatabaseCollection, RecommendationItem{
	protected keyHelper:DBKeyHelper;
	
	constructor(keyHelper:DBKeyHelper){
		this.keyHelper = keyHelper;
	}

	static scanIds(keyHelper:DBKeyHelper, resumeId?:string){
		return keyHelper.idScanner(resumeId)();
	}

	abstract readonly id:string;

	abstract getSimilarAttrsWithScore(name:string): Observable<ItemAttribute>;

	get dbKey():string{
		return this.keyHelper.getDBKey(this.id);
	}

	getAttrs():Observable<ItemAttribute>{
		return redis.readOrderedSet(this.dbKey).pipe(map(
			(pair:[string], i)=>{
				return {name:pair[0], value:pair[1]}
			}
		))
	}

	getAttrValue(name:string){
		return redis.getOrderedSetMemberScore(this.dbKey, name);
	}

	addToCollection(name:string, score:string){		
		return SortedSet.addToCollection(this.dbKey, name, score);
	}

	removeFromCollection(name:string):Promise<0|1>{
		throw ('Method Not Implemented');
	}

	saveToDb():Promise<0 |1>{
		throw("DatabaseCollection cannot be saved to database directly. Please call addToCollection.")
	}

	protected static addToCollection(dbKey:string, name:string, score:string){
		return redis.addToOrderedSet(dbKey, name, score);
	}
}


abstract class SortedSetWithSavedKeys extends SortedSet{

	constructor(keyHelper:DBSavedKeyHelper){
		super(keyHelper);
	}


	addToCollection(name:string, score:string){		
		return SortedSetWithSavedKeys.addToCollectionAndSaveKey(this.dbKey, name, score, 
							this.keyHelper.getDBKey(DBKeyHelper.ALL_KEYS_ID), this.id);
	}

	protected static addToCollectionAndSaveKey(dbKey:string, name:string, score:string, allKeysId:string, key:string){
		return redis.addToOrderedSetAndSaveKey(dbKey, name, score, allKeysId, key);
	}

	static scanSavedIds(keyHelper:DBSavedKeyHelper, resumeId?:string|number){
		return keyHelper.savedIdScanner(resumeId)();
	}
}



export class SimilarBooks extends SortedSet{
	static keyHelper = new DBKeyHelper("SimilarBooks:");
	ISBN:string;
	constructor(ISBN:string){
		super(SimilarBooks.keyHelper);
		this.ISBN = ISBN;
	}

	static scanIds():Observable<string>
	static scanIds(resumeId:string):Observable<string>
	static scanIds(resumeId?:string, keyHelper?:DBKeyHelper):Observable<string>
	{
		return SortedSet.scanIds(BookRatings.keyHelper, resumeId);
	}

	get id():string{
		return this.ISBN;
	}

	getSimilarAttrsWithScore(name:string):Observable<ItemAttribute>{
		throw "Method not implemented";
		
	}


	static addToCollection(id:string, name:string, score:string){
		return SortedSet.addToCollection(SimilarBooks.keyHelper.getDBKey(id), name, score);
	}
}


export class BookRatings extends SortedSetWithSavedKeys{
	static keyHelper = new DBSavedKeyHelper("BookRatings:");
	ISBN:string;
	constructor(ISBN:string){
		super(BookRatings.keyHelper);
		this.ISBN = ISBN;
	}

	static scanIds():Observable<string>
	static scanIds(resumeId:string):Observable<string>
	static scanIds(resumeId?:string, keyHelper?:DBKeyHelper):Observable<string>
	{
		return SortedSet.scanIds(BookRatings.keyHelper, resumeId);
	}

	static scanSavedIds():Observable<string>
	static scanSavedIds(resumeId:string|number):Observable<string>
	static scanSavedIds(resumeId?:string|number, keyHelper?:DBKeyHelper):Observable<string>
	{
		return SortedSetWithSavedKeys.scanSavedIds(BookRatings.keyHelper, resumeId);
	}

	static scanIdRecursive(startIndex?:number){
		return redis.scanIdsRecurssive(BookRatings.keyHelper.getDBKey(DBKeyHelper.ALL_KEYS_ID), startIndex);
	}

	get id():string{
		return this.ISBN;
	}

	getSimilarAttrsWithScore(name:string):Observable<ItemAttribute>{
		throw "Method not implemented";
	}


	static addToCollection(id:string, name:string, score:string){
		return SortedSetWithSavedKeys
		.addToCollectionAndSaveKey(BookRatings.keyHelper.getDBKey(id), name, score, 
									BookRatings.keyHelper.getDBKey(DBKeyHelper.ALL_KEYS_ID), id);
	}
}


export class UserRatings extends SortedSetWithSavedKeys{
	static keyHelper = new DBSavedKeyHelper("UserRatings:");
	userId:string;
	constructor(userId:string){
		super(UserRatings.keyHelper);
		this.userId = userId;
	}

	static scanIds():Observable<string>
	static scanIds(resumeId:string):Observable<string>
	static scanIds(resumeId?:string, keyHelper?:DBKeyHelper):Observable<string>
	{
		return SortedSet.scanIds(UserRatings.keyHelper, resumeId);
	}

	static scanSavedIds():Observable<string>
	static scanSavedIds(resumeId:string|number):Observable<string>
	static scanSavedIds(resumeId?:string|number, keyHelper?:DBKeyHelper):Observable<string>
	{
		return SortedSetWithSavedKeys.scanSavedIds(UserRatings.keyHelper, resumeId);
	}

	static scanIdRecursive(startIndex?:number){
		return redis.scanIdsRecurssive(BookRatings.keyHelper.getDBKey(DBKeyHelper.ALL_KEYS_ID), startIndex);
	}

	static scanIdPaginated(countPerPage:number, page:number):Observable<string>{
		return redis.readOrderedSet(UserRatings.keyHelper.getDBKey(DBKeyHelper.ALL_KEYS_ID)
			, countPerPage, page)
			.pipe(map(pair=>{
				return pair[0];
			}))
	}


	get id():string{
		return this.userId;
	}

	getSimilarAttrsWithScore(name:string):Observable<ItemAttribute>{
		let similarBooks = new SimilarBooks(name);
		return similarBooks.getAttrs();
	}


	static addToCollection(id:string, name:string, score:string){
		return SortedSetWithSavedKeys.addToCollectionAndSaveKey(UserRatings.keyHelper.getDBKey(id), 
			  name, score, UserRatings.keyHelper.getDBKey(DBKeyHelper.ALL_KEYS_ID), id);
	}
}



export class Database{

	private static books_path = path.resolve("data/BX-Books.csv");
	private static book_ratings_path = path.resolve("data/BX-Book-Ratings.csv");

	static async prepare(){
		let isPrepared = await redis.getString(`BR:DBPreparedOn`);
		if(!isPrepared){

			return forkJoin(
				defer(this.fillBooks), 
				concat(
					defer(this.fillBookRatings), 
					defer(async ()=>{
						await BookRatings.keyHelper.removeSetsWithFewItems();
						await UserRatings.keyHelper.removeSetsWithFewItems();
					}
			))).pipe(takeLast(1))
			.forEach(val=>{
				redis.setString(`BR:DBPreparedOn`, (new Date()).toString())
				console.log("Database prepared!!")
			});
		}
		else{
			console.log("database already prepared")
		}
	}

	static clearAndPrepare(){

	}

	static fillBooks():Promise<void>{
		let cnt = 0;
		return csv_parser
		.parse_csv(Database.books_path)
		//.pipe(take(500))
		.forEach((row:StringKeyValue)=>{
			(new Book(row)).saveToDb();
			cnt++;
			if(cnt%2000==0){
				console.log(`${cnt} books added`);
			}
		});
	}

	static fillBookRatings():Promise<void>{
		let cnt = 0;
		return csv_parser
		.parse_csv(Database.book_ratings_path)
		//.pipe(take(500))
		.forEach((row:StringKeyValue)=>{
			BookRatings.addToCollection(row['ISBN'], row['User-ID'], row['Book-Rating']);
			UserRatings.addToCollection(row['User-ID'], row['ISBN'], row['Book-Rating'])
			cnt++;
			if(cnt%2000==0){
				console.log(`${cnt} book ratings added`);
			}
		});
	}


	static setString(key:string, value:string){
		return redis.setString(key, value);
	}

	static removeString(key:string){
		return redis.removeKey(key);
	}

	static getString(key:string){
		return redis.getString(key);
	}


}

