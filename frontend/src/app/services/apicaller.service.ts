import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, range } from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class ApicallerService {

	static BASE_URL = 'http://localhost:8000/api/';
	constructor(private http: HttpClient) { }


	getUsers(page: number, count: number): Observable<number[]> {
		return this.http.get(this.getFullUrl('users'), { params: { page: page + '', count: count + ''}}) as Observable<any[]>;
	}

	getBooks(): Observable<any[]> {
		return this.http.get(this.getFullUrl('books')).pipe(map((obj: any) => {
			return obj.books;
		}));
	}


	getRecommendation(userId: string): Observable<any[]> {
		return this.http.get(this.getFullUrl('recommend', userId)) as Observable<any[]>;
	}

	getRatings(userId: string): Observable<any[]> {
		return this.http.get(this.getFullUrl('user-ratings', userId)) as Observable<any[]>;
	}

	private getFullUrl(apiname: string, ... params: string[]) {
		let url = `${ApicallerService.BASE_URL}${apiname}`;
		for (const param of params) {
			url += `/${encodeURI(param)}`;
		}
		return url;
	}


}

