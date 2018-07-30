import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { BookUsersComponent } from './components/book-users/book-users.component';
import { BookRecommendationsComponent } from './components/book-recommendations/book-recommendations.component';
import { AppRoutingModule } from './app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import { MovieUsersComponent } from './components/movie-users/movie-users.component';
import { MovieRecommendationsComponent } from './components/movie-recommendations/movie-recommendations.component';



@NgModule({
  declarations: [
  AppComponent,
  BookUsersComponent,
  BookRecommendationsComponent,
  MovieUsersComponent,
  MovieRecommendationsComponent,
  ],
  imports: [
  BrowserModule,
  HttpClientModule,
  AppRoutingModule,
  MaterialModule,
  BrowserAnimationsModule,
  FlexLayoutModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
