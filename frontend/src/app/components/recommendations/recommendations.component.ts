import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { Observable } from 'rxjs'
import { ApicallerService } from '../../services/apicaller.service'

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css']
})
export class RecommendationsComponent implements OnInit {
  booksRated: Observable<any[]>;
  booksRecommended: Observable<any[]>;
  
  user:string;
  constructor(private route: ActivatedRoute, private apicaller:ApicallerService) { 

  }

  ngOnInit() {
  	this.route.paramMap.subscribe(params=>{
  		debugger;
  		this.user = params.get('user')
      this.booksRecommended = this.apicaller.getRecommendation(this.user);
      this.booksRated = this.apicaller.getRatings(this.user);
  	})
  	
  }

}
