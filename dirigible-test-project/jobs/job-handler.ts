import { BookRepository } from "../gen/dao/Books/BookRepository";

console.log("Executing testing Job...");

const repo = new BookRepository();
const books = repo.findAll();
console.log(`Found [${books.length}] books. Books: [${JSON.stringify(books)}]`);

console.log("Testing Job completed.");
