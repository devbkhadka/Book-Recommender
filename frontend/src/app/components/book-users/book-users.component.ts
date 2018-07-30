import { Component, OnInit } from '@angular/core';
import { ApicallerService } from '../../services/apicaller.service';
import { Observable } from 'rxjs';

@Component ({
  selector: 'app-users',
  templateUrl: './book-users.component.html',
  styleUrls: ['./book-users.component.css']
})
export class BookUsersComponent implements OnInit {

  constructor(private apicaller: ApicallerService) { }

  users: Observable<number[]>;
  ngOnInit () {
      this.users = this.apicaller.getUsers('book', 1, 50);
  }

  pageChanged(event: any) {
   console.log('page changed: ' + event.pageIndex);
  this.users = this.apicaller.getUsers('book', event.pageIndex, event.pageSize);
  }

}
