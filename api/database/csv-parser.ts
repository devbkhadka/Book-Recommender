import * as fs from 'fs'
import parse from 'csv-parse';

import { Observable, Subject, ReplaySubject, from, of, range } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { Writable } from 'stream';

const transform = require( 'stream-transform');

/** @returns csv parser function for file with the path with given csv-options. 
 * Returned function can be called to get observalbe of row objects
 *  @param path: path of csv file, please refer "csv-parse" npm module for csv-options. 
 *  @param csv_options: csv options for parser 
 */
export function getParser(path:string, csv_options:any){

	return ()=>{
			// Using the first line of the CSV data to discover the column names
		

		return Observable.create(function(observer:any) {
			
			let rs = fs.createReadStream(path);
			let parser = parse(csv_options)
			let dispose = false;
			var transformer = transform(function(record:any, callback:any){ 
				if(!dispose) {
					observer.next(record);
					callback(null, "");	
				} 
				else {
					console.log("Disposing CSV stream !!");
					rs.close();
				}
			}, {parallel: 10});
	
	
			//var rows_parsed = 0;
			const outStream = new Writable({
				write(chunk, encoding, callback) {
					//rows_parsed++;
					//if(rows_parsed%500==0){console.log(rows_parsed)};
					callback();
				}
			});
	
			outStream.on('finish', ()=>{
				observer.complete();
			})
	
			rs.pipe(parser).pipe(transformer).pipe(outStream);
			

			return () => {
				dispose = true;
			}
		});

		

	}
	
}


