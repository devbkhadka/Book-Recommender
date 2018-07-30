'use strict'

import { Observable, Subject, ReplaySubject, from, of, range } from 'rxjs';
import { map, filter, switchMap, flatMap, bufferCount} from 'rxjs/operators';
import Redis from 'ioredis';


const redis_options = {host:"127.0.0.1", port:6379};
const redis_client = new Redis(redis_options);
const DB_RESUME_PREFIX = "BR:ResumePrefix:";
const DEFAULT_SET_READ_COUNT = 50;
const PAGE_SIZE=10;


function observableFromStream(stream:any){
	let observer:any;
	let rows$= Observable.create(function(_observer: any) {
	  observer = _observer;
	});

	stream.on('data', (keys: any)=>{
		observer.next(from(keys))
	});

	stream.on('end', function () {
	  observer.complete();
	});

	return rows$.pipe(flatMap((row: any)=>row));
}

let pendingScanObservables = 0;



function scan(cursor:string, pattern:string, observer:any, shouldTerminate:(()=>boolean), keysExhusted:(()=>void)){
	redis_client.send_command('scan', cursor,'match', pattern, 'count', 20).then(
	(result:any)=>{
		if(result[1].length>0){
			observer.next(result);
		}

		if(result[0]!=0){
			if(!shouldTerminate()){
				setTimeout(function (){
					scan(result[0], pattern, observer, shouldTerminate, keysExhusted);
				},1)
				
			}
		}
		else{
			observer.complete();
			keysExhusted();
		}
	},
	(err:any)=>{
		console.log(err);
	})
}


function scan2(observer:any, allKeysId:string, startIndex:number=0){
	
	let start = +startIndex;
	 redis_client.send_command('zrange', allKeysId, start, start+PAGE_SIZE-1).then((keys:string[])=>{
	 	if(keys && keys.length>0){
			
			let recurCallback = (recur:boolean)=>{
				if(recur){
					scan2(observer, allKeysId, start+PAGE_SIZE);
				}
				else{
					observer.complete();
				}
			}

			observer.next({value:[start, keys], shouldRecur:recurCallback})
	
		}
		else{
			observer.complete();
		}
	 })
}


function scanSavedKeys(startIndex:string, allKeysId:string, observer:any, shouldTerminate:(()=>boolean), keysExhusted:(()=>void), delay:(()=>number)) {
	let start = +startIndex;
	 redis_client.send_command('zrange', allKeysId, start, start+PAGE_SIZE-1).then((keys:string[])=>{
	 	if(keys && keys.length>0){
			observer.next([start, keys])
			if(!shouldTerminate()){
				setImmediate(scanSavedKeys, (start+PAGE_SIZE)+'', allKeysId, observer, shouldTerminate, keysExhusted, delay);
			}
		}
		else{
			observer.complete()
			keysExhusted()
		}
	},
	(err:any)=>{
		console.log(err);
	});
	

}

function recurssiveFunc(observer:any, count:number){

	count++;

	let recurCallback = (recur:boolean)=>{
		if(recur){
			recurssiveFunc(observer, count);
		}
		else{
			observer.complete();
		}
	}

	observer.next({value:count, shouldRecur: recurCallback});
}

function controlledRecurssion(method:(observer:any, ...params:any[])
									=>void
									, ...params:any[]){

	let recurCallback:any=null;
	let recurStatus:boolean|null=null;
	let shouldRecur = (recur:boolean)=>{
		if(recurCallback){
			setImmediate(recurCallback, recur);
		}
		else{
			recurStatus=recur;
		}
		recurCallback=null;
	}
	let batch$= Observable.create((observer: any)=>{
		method(observer, ...params);
	})

	return batch$.pipe(map((val:{value:any, shouldRecur:(recur:boolean)=>void})=>{
		if(recurCallback==null && recurStatus!=null){
			val.shouldRecur(recurStatus);
			recurStatus = null;
		}
		else{
			recurCallback = val.shouldRecur;
		}
		val.shouldRecur = shouldRecur;
		return val;
	}))
}


export class RXRedis {

	private convertPromise = <T>(promise:PromiseLike<T>)=>{
		return from(promise).toPromise();
	}

	/**
	@param options for scanning kyes eg: {
			  // only returns keys following the pattern of `user:*`
			  match: 'user:*',
			  // returns approximately 100 elements per call
			  count: 100
			}
	@return observable of string which streams keys found
	*/
	scanKeys(pattern:string) {
		let stream = redis_client.scanStream({
			match: pattern
		});
		return observableFromStream(stream);
	} 


	scanIdsRecurssive(allKeysId:string, startIndex?:number):Observable<{value:[number, string[]], shouldRecur:(recur:boolean)=>void}>{
		return controlledRecurssion(scan2, allKeysId, startIndex)
	}

	resumableKeyScanBase(pattern:string, scanMethod:any, resumeId?:string|number):Observable<any>{
		const key =`${DB_RESUME_PREFIX}${resumeId}`;
		let terminate = false;
		let cursor = '';
		let resumeIndex=0;
		let index=-1;
		let batch$= Observable.create((observer: any)=>{
		  pendingScanObservables++;
		  (async (observer: any)=>{
		  		if(typeof resumeId== 'number'){
		  			cursor = resumeId + '';
		  			index = resumeId;
		  		}
		  		else{
		  			const  resumeString = resumeId?await this.getString(key):null;
				
					if(resumeString!=null){
						let indexStr:string;
						[cursor, indexStr] = resumeString.split(',');
						resumeIndex = Number(indexStr);
						index = resumeIndex;
						console.log(`Resuming scan for ${resumeId} from cursor ${cursor}`);
					}
					else{
						index = 0;
					}
		  		}
				
				const keysExhausted = ()=>{
					//console.log("keys exhausted");
					if(resumeId){
						this.removeKey(key);
					}
					pendingScanObservables--;
					console.log("scan completed: " + pendingScanObservables)
				};
				const shouldTerminate = ()=>{
					if(terminate){
						pendingScanObservables--;
						//console.log('terminated!!');
					}
					return terminate;
				}

				let delay = ()=> {
					return pendingScanObservables * 10;
				}

				setTimeout(scanMethod, delay(), cursor?cursor:'0', pattern, observer, shouldTerminate, keysExhausted, delay)
				
			})(observer);

			return ()=>{
				terminate = true;
			}
		});
		

		return batch$.pipe(flatMap(
			(result:any)=>{
				//console.log('-----------------------')
				if(resumeId){
					this.setString(key, `${cursor},${resumeIndex}`);
				}
				cursor = result[0];
				resumeIndex+=result[1].length;
				
				return from(result[1]).pipe(map(val=>{
					return [index++, val]
				}));
			}
		))


	}



	resumableKeyScan(pattern:string, resumeId?:string){
		return this.resumableKeyScanBase(pattern, scan, resumeId);

	}


	resumableSavedKeyScan(pattern:string, resumeId?:string|number){
		return this.resumableKeyScanBase(pattern, scanSavedKeys, resumeId);
	}



	/**
	@param redis database key of ordered set data
	@return observable of string which streams set members and its values
	*/
	readOrderedSet(key:string, count:number=DEFAULT_SET_READ_COUNT, page:number=0):Observable<string[]> {
		 return from(redis_client.zrevrange(key, page*count, (page+1)*count-1, "WITHSCORES"))
		 .pipe(flatMap((items:string[])=>{
		 	return from(items);
		 }),
		 bufferCount(2)
		 );	

		//  .pipe(bufferCount(2), map((pair:[string])=>{
		// 	return {name:pair[0], value:pair[1]}
		// }));

		//return observableFromStream(stream);
	}

	countOrderedSet(key:string){
		return redis_client.zcard(key)
	}

	getOrderedSetMemberScore(key:string, member:string){
		return this.convertPromise(redis_client.zscore(key, member))
	}

	getString(key:string):Promise<string>{
		return this.convertPromise(redis_client.get(key));
	}

	setString(key:string, value:string){
		return this.convertPromise(redis_client.set(key, value));
	}

	setHash(key:string, value:object){
		return this.convertPromise(redis_client.hmset(key, value));
	}

	getHash(key:string){
		return this.convertPromise(redis_client.hgetall(key))
	}

	addToOrderedSet(key:string, item:string, score:string){
		return this.convertPromise(redis_client.zadd(key, score, item ));
	}

	addToOrderedSetAndSaveKey(dbkey:string, item:string, score:string, allKeysId:string, key:string){

		let prom = new Promise(async (resolve, reject)=>{
			
			await redis_client.multi().zadd(dbkey, score, item)
			.zadd(allKeysId, '1', key)
			.exec();
			
			resolve();
			
		})
		

		return prom;
	}

	removeKey(dbkey:string){
		return redis_client.del(dbkey);
	}

	removeSavedKey(dbkey:string, allKeysId:string, key:string){
		return redis_client.multi()
		.del(dbkey)
		.zrem(allKeysId, key)
		.exec();
	}

}


