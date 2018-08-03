import { Observable, concat, from, interval } from 'rxjs';
import { MovieLinks } from './movie-db-entity';
import { flatMap, skip, take, map } from 'rxjs/operators';
import Fetch from 'node-fetch';
import { PresistentString } from '../presistent-string';

const MOVIE_API_URL = 'http://imdbapi.net/api';
const MOVIE_PARSER_API_RESUME_INDEX = 'MOVIE_PARSER_API_RESUME_INDEX'

export function getMovieParser(linksParser: ()=>Observable<any>) {
    let linksCount = 0;
    return (): Observable<any>=> {


        let promiseParseLinks = 
        async (resumeIndex: number) => {
            if(!resumeIndex){
                await linksParser().pipe(flatMap(
                    row=>{
                        return MovieLinks.addToCollection('ALL-MOVIE-LINKS', row['movieId'] + '-' + row['imdbId'], 1)
                    }
                )).forEach(
                    val=>{
                        linksCount++
                        if(linksCount%500==0){
                            console.log(`${linksCount} movie links added`);
                        }
                    }
                )
            }
        }

        
        let parseMovies = 
        (resumeIndex: number)=>{
            resumeIndex = resumeIndex?resumeIndex:0;
            console.log("Movie parser resume from: " + resumeIndex);
            let pendingApis = 0;
            let completedApis = 0;
            return MovieLinks.scanCollectionsItemsInBatch('ALL-MOVIE-LINKS', resumeIndex).pipe(
                flatMap(
                    val => {
                        let ids = val[0][1];
                        pendingApis += ids.length;
                        let ids$ = interval(20).pipe(
                            take(ids.length),
                            map(
                                (val, index)=>{
                                    return ids[index];
                                }
                            )
                        )
                        
                        return ids$.pipe(
                            flatMap(
                                (val:string, index:number)=>{
                                    let [id, imdbId] = val.split('-');
                                    return fetchMovieDetail(id, imdbId);
                                }
                            )
                        )
                    },
                    (ovalue, ivalue, oindex, iindex )=>{
                        let sendNextBatch = ovalue[1];
                        let batchSize = ovalue[0][1].length;
                        let dbIndex = ovalue[0][0];
                        if(pendingApis==2){
                            setTimeout(sendNextBatch, 100, true);
                        }
                        pendingApis--;
                        completedApis++;
                        if(completedApis%20==0){
                            let totalCompleted =(dbIndex>batchSize?dbIndex-batchSize:0);
                            console.log(totalCompleted + " Movie api completed");
                            PresistentString.setString(MOVIE_PARSER_API_RESUME_INDEX, totalCompleted +'');
                        }
                        return ivalue
                    }
                )
            )
        }


        return from(PresistentString.getString(MOVIE_PARSER_API_RESUME_INDEX)).pipe(
            flatMap(
                val=>{
                    let step = +val;
                    return concat(promiseParseLinks(step), parseMovies(step)).pipe(skip(1))
                }
            )
        )
        

        

         
    }
}


function fetchMovieDetail(id: string, imdbId:string){
    return Fetch (MOVIE_API_URL, {
        method: 'post',
        body: `key=<put you key from imdbapi.net here>&id=tt${imdbId}&type=json`,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    }).then(resp=>resp.json())
    .then(
        val=>{
            if(val.status=='true'){
                val['movieId'] = id;
                return val;
            }
            else {
                throw val.message;
            }
            
        }
    )
}