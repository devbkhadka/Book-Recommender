import { Component, OnInit } from '@angular/core';
import { ApicallerService } from '../../services/apicaller.service'
import { Observable } from 'rxjs'


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  constructor(private apicaller:ApicallerService) { }
  users:Observable<number[]>
  ngOnInit() {
  	this.users = this.apicaller.getUsers(1, 50)
  }

  pageChanged(event:any){
  	console.log('page changed: '+ event.pageIndex);
  	this.users = this.apicaller.getUsers(event.pageIndex, event.pageSize);
  }

}
