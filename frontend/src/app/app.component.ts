import { Component } from '@angular/core';
import { ApicallerService } from './services/apicaller.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	constructor() {
	
	}
	title = 'app';
	resp: [{name: String}];

}
