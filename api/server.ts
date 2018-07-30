'use strict'
import express from 'express';
import bodyParser from 'body-parser'
import cors from 'cors'
import { take, flatMap } from 'rxjs/operators'
import { recommendItemFor, getUsers, getUserRatings } from './controllers/recommend-controller-helper'
import { Book, UserRatings } from './database/books/book-db-entity';
import { Movie, UserRatingsOnMovies } from './database/movies/movie-db-entity';

const app = express();

//enable cross origin request from angular app
var corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));

app.use(bodyParser.json());

app.listen(8000, () => {
  console.log('Server started!');
});


app.route('/api/book/recommend/:userid').get(
  (req, resp)=>{
    recommendItemFor(Book, UserRatings, req, resp);
  }
);

app.route('/api/movie/recommend/:userid').get(
  (req, resp)=>{
    recommendItemFor(Movie, UserRatingsOnMovies, req, resp);
  }
);

app.route('/api/book/user-ratings/:userid').get(
   (req, resp) => {
     getUserRatings(Book, UserRatings, req, resp);
   }
);

app.route('/api/movie/user-ratings/:userid').get(
  (req, resp) => {
    getUserRatings(Movie, UserRatingsOnMovies, req, resp);
  }
);

app.route('/api/book/users').get(
  (req, resp) => {
    getUsers(UserRatings, req, resp);
  }
);

app.route('/api/movie/users').get(
  (req, resp) => {
    getUsers(UserRatingsOnMovies, req, resp);
  }
);




