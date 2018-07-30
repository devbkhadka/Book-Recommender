import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApicallerService } from '../../services/apicaller.service';

@Component({
  selector: 'app-recommendations',
  templateUrl: './book-recommendations.component.html',
  styleUrls: ['./book-recommendations.component.css']
})
export class BookRecommendationsComponent implements OnInit {
  booksRated: Observable<any[]>;
  booksRecommended: Observable<any[]>;

  user: string;
  constructor(private route: ActivatedRoute, private apicaller: ApicallerService) {

  }

  ngOnInit() {
  	this.route.paramMap.subscribe (
		params => {
  		this.user = params.get('user');
		  this.booksRecommended = this.apicaller.getRecommendation('book', this.user);
		  this.booksRated = this.apicaller.getRatings('book', this.user);
  	});
  }

}





