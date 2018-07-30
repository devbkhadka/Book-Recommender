import { Component, OnInit } from '@angular/core';
import { ApicallerService } from '../../services/apicaller.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-movie-users',
  templateUrl: './movie-users.component.html',
  styleUrls: ['./movie-users.component.css']
})
export class MovieUsersComponent implements OnInit {

  constructor(private apicaller: ApicallerService) { }

  users: Observable<number[]>;
  ngOnInit () {
      this.users = this.apicaller.getUsers('movie', 1, 50);
  }

  pageChanged(event: any) {
   console.log('page changed: ' + event.pageIndex);
  this.users = this.apicaller.getUsers('movie', event.pageIndex, event.pageSize);
  }

}

