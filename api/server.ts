'use strict'
import express from 'express';
import bodyParser from 'body-parser'
import cors from 'cors'
import { Book } from './database/data-provider'
import { take, flatMap } from 'rxjs/operators'
import { recommendBoook, getUsers, getUserRatings } from './controllers/recommend-controller'

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

app.route('/api/cats').get((req, res) => {
  res.send({
    cats: [{ name: 'lilly3' }, { name: 'lucy3' }]
  });
});

app.route('/api/cats/:name').get((req, res) => {
  const requestedCatName = req.params['name'];
  res.send({ name: requestedCatName });
});

// app.route('/api/cats').post((req, res) => {
//   res.send(201, req.body);
// });

app.route('/api/recommend/:userid').get(recommendBoook);

app.route('/api/user-ratings/:userid').get(getUserRatings);
app.route('/api/users').get(getUsers);

app.route('/api/books').get(async (req, res)=>{
  let books:Book[] = [];
	await Book.scanIds().pipe(take(50), flatMap((id:string)=>{
		return Book.getBook(id);
	})).forEach((book:Book)=>{
    books.push(book);
  });

  res.send({books: books})
})


