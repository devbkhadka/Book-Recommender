import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ApicallerService {

	static BASE_URL = 'http://localhost:8000/api/';
	constructor(private http: HttpClient) { }


	getUsers(module: 'book'|'movie', page: number, count: number): Observable<number[]> {
		return this.http.get(this.getFullUrl(module, 'users'), { params: { page: page + '', count: count + ''}}) as Observable<any[]>;
	}

	// getItems(module: 'book'|'movie'): Observable<any[]> {
	// 	return this.http.get(this.getFullUrl('books')).pipe(map((obj: any) => {
	// 		return obj.books;
	// 	}));
	// }


	getRecommendation(module: 'book'|'movie', userId: string): Observable<any[]> {
		return this.http.get(this.getFullUrl(module, 'recommend', userId)) as Observable<any[]>;
	}

	getRatings(module: 'book'|'movie', userId: string): Observable<any[]> {
		return this.http.get(this.getFullUrl(module, 'user-ratings', userId)) as Observable<any[]>;
	}

	private getFullUrl(apiname: string, ... params: string[]) {
		let url = `${ApicallerService.BASE_URL}${apiname}`;
		for (const param of params) {
			url += `/${encodeURI(param)}`;
		}
		return url;
	}


}

