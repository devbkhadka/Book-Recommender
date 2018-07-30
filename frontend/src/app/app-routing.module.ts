import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { BookRecommendationsComponent } from './components/book-recommendations/book-recommendations.component';
import { BookUsersComponent } from './components/book-users/book-users.component';
import { MovieUsersComponent } from './components/movie-users/movie-users.component';
import { MovieRecommendationsComponent } from './components/movie-recommendations/movie-recommendations.component';




const routes: Routes = [
	{ path: 'book/recommendations/:user', component: BookRecommendationsComponent },
	{ path: '', component: BookUsersComponent },
	{ path: 'movie/recommendations/:user', component: MovieRecommendationsComponent },
	{ path: 'movie/users', component: MovieUsersComponent },
	{ path: 'book/users', component: BookUsersComponent }
];

@NgModule({
	exports: [ RouterModule ],
	imports: [ RouterModule.forRoot(routes)],
})
export class AppRoutingModule {}


