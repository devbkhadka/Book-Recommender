import { Observable, from } from 'rxjs';
import { map, flatMap, bufferCount } from 'rxjs/operators';
import Redis from 'ioredis';


const DBKEY_PREFIX = 'BR';
const redis_options = {host:"127.0.0.1", port:6379};
const redis_client = new Redis(redis_options);

export const RedisHelper = {
    
    scanKeysInBatch: (pattern:string, cursor:string='0'):Observable<[[string, string[]], (shouldSend:boolean)=>void]>=>{
        return controlledRecurssion(scanKeys, pattern, cursor)
    },

    scanAllKeys: (pattern:string, cursor:string='0'): Observable<string>=>{
        return controlledRecurssion(scanKeys, pattern, cursor).pipe(flatMap(
            (val)=>{
                let [result, recurCallback] = val;
                recurCallback(true);
                return result[1];
            }
        ))
    },  

    scanSortedSet: (key:string, start:number=0, stop:number=-1):Observable<[string, number]> =>{
        return from(redis_client.zrevrange(key, start, stop, "WITHSCORES"))
		 .pipe(flatMap((items:string[])=>{
		 	return from(items).pipe(bufferCount(2), map((arr:[string, number])=>{
                 return [arr[0], +arr[1]]
            }));
		 })
		 );	
    },

    scanSortedSetInBatch: (key:string, start?:number)
                    :Observable<[[number, string[]], (shouldSend:boolean)=>void]>=>{
        return controlledRecurssion(scanSortedSet, key, start);
    },

    removeKey: (dbkey:string):Promise<void>=>{
		return redis_client.del(dbkey);
    },

    getString: (key:string):Promise<string> => {
		return convertPromise(redis_client.get(key));
	},

	setString(key:string, value:string){
		return convertPromise(redis_client.set(key, value)).then(()=>{});
	},

	setHash: (key:string, value:object)=>{
		return convertPromise(redis_client.hmset(key, value)).then(()=>{});
	},

	getHash:(key:string) => {
		return convertPromise(redis_client.hgetall(key))
	},

	getHashFieldValue:(key:string, fieldName: string) => {
		return convertPromise(redis_client.hget(key, fieldName));
	},
    
    addToOrderedSet: (key:string, item:string, score:number):Promise<any>=>{
        return convertPromise(redis_client.zadd(key, score+'', item ));
    },

    addToOrderedSetAndSaveKey: (dbkey:string, item:string, score:number, keysListId:string, key:string ):Promise<any>=>{
        let prom = redis_client.multi().zadd(dbkey, score+'', item)
        .zadd(keysListId, '1', key)
        .exec();
		
		return convertPromise(prom);
    },

    removeKeyAndSavedKey: (dbkey:string, allKeysId:string, key:string):Promise<any>=>{
		let prom = redis_client.multi()
		.del(dbkey)
		.zrem(allKeysId, key)
        .exec();
        return convertPromise(prom);
    },
    
    getOrderedSetItemScore: (key:string, member:string): Promise<number> =>{
		return from(redis_client.zscore(key, member)).pipe(map(val=>{
            return +val;
        })).toPromise();
	},

	countOrderedSet: (key:string): Promise<number> =>{
		return convertPromise(redis_client.zcard(key));
	}


}


export function convertPromise<T>(promise:PromiseLike<T>){
    return from(promise).toPromise();
}

export function getGroupPrefix(groupId:string){
    return `${DBKEY_PREFIX}:${groupId}:`
}

export function getKey(groupId:string, id:string){
    return `${getGroupPrefix(groupId)}${id}`;
}

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

/**  Create observable which streams data by recurssively calling a given function. 
 * Observable streams Tuples of expected data and a callback function which can be used to control recurssion call
 * @param method method to be called recurssively. The method must call observers next method with 
 * Tuples of expected value and a callback function "[any, (shouldSend:boolean)=>void]"" which will do the recurssion call.
 * @param params: paramaters that will be passed to method when callin the method
 * @returns Observable of tuples of value and callback function which need to be called by observer 
 * when it is ready to receive anther batch of data
 * 
 */
function controlledRecurssion(method:(observer:any, ...params:any[])
									=>void
									, ...params:any[]):Observable<[any, (shouldSend:boolean)=>void]>{

	let recurCallback:any=null;
	let sendNextBatch = (shouldSend:boolean)=>{
		if(recurCallback){
            setImmediate(recurCallback, shouldSend);
            recurCallback = null;
		}else{
            //console.log('Recur callback called when null')
        }
	}
	let batch$= Observable.create((observer: any)=>{
        setImmediate(method, observer, ...params);
	})

	return batch$.pipe(map((val:[any, (shouldSend:boolean)=>void])=>{
        recurCallback= val[1];
		val[1] = sendNextBatch;
		return val;
	}))
}


function scanKeys(observer:any, pattern:string, cursor:string='0' ){
	redis_client.send_command('scan', cursor,'match', pattern, 'count', 20).then(
	(result:any)=>{


        let recurCallback = (recur:boolean)=>{
            if(!recur || result[0]=='0'){
                observer.complete();
            }
            else{
                scanKeys(observer, pattern, result[0]);
            }

        } 

		if(result[1].length>0){
			observer.next([result, recurCallback]);
        }
        else {
            setImmediate(recurCallback, true);
        }
        
	},
	(err:any)=>{
		console.log(err);
	})
}


function scanSortedSet(observer:any, allKeysId:string, startIndex:number=0){
	const PAGE_SIZE = 10;
	let start = +startIndex;
	 redis_client.send_command('zrevrange', allKeysId, start, start+PAGE_SIZE-1).then((keys:string[])=>{
	 	if(keys && keys.length>0){
			
			let recurCallback = (recur:boolean)=>{
				if(recur){
					scanSortedSet(observer, allKeysId, start+PAGE_SIZE);
				}
				else{
					observer.complete();
				}
			}

			observer.next([[start, keys], recurCallback])
	
		}
		else{
			observer.complete();
		}
	 })
}