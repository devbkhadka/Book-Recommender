import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { UsersComponent } from './components/users/users.component'
import { WelcomeComponent } from './components/welcome/welcome.component'
import { DashboardComponent } from './components/dashboard/dashboard.component'




const routes: Routes = [
	{ path: 'recommendations/:user', component: RecommendationsComponent },
	{ path: '', component: UsersComponent },
	{path: 'welcome', component: WelcomeComponent},
  	{path: 'dashboard', component: DashboardComponent}
]

@NgModule({
	exports: [ RouterModule ],
	imports: [ RouterModule.forRoot(routes)],
})
export class AppRoutingModule {}


