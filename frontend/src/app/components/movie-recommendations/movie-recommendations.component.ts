import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApicallerService } from '../../services/apicaller.service';

@Component({
  selector: 'app-movie-recommendations',
  templateUrl: './movie-recommendations.component.html',
  styleUrls: ['./movie-recommendations.component.css']
})


export class MovieRecommendationsComponent implements OnInit {
  moviesRated: Observable<any[]>;
  moviesRecommended: Observable<any[]>;

  user: string;
  constructor(private route: ActivatedRoute, private apicaller: ApicallerService) {

  }

  ngOnInit() {
  	this.route.paramMap.subscribe (
		params => {
  		this.user = params.get('user');
		  this.moviesRecommended = this.apicaller.getRecommendation('movie', this.user);
		  this.moviesRated = this.apicaller.getRatings('movie', this.user);
  	});
  }

}
