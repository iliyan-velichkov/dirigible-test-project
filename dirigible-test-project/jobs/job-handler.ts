import { BookRepository } from "../gen/dao/Books/BookRepository";

const repo = new BookRepository();
const books = repo.findAll();
console.log(`Found [${books.length}] books. Books: [${JSON.stringify(books)}]`);
