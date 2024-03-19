import { BookRepository } from "../gen/dao/Books/BookRepository";
import { logging } from "sdk/log";

const logger = logging.getLogger("background-handler");

export function onMessage(message: any) {
    logger.info("Received message [{}]", message);
    const repo = new BookRepository();
    const books = repo.findAll();
    logger.info("Found [{}] books. Books: [{}]", books.length, JSON.stringify(books));
}

export function onError(error: any) {
    logger.info("Received message [{}]", error);

    const repo = new BookRepository();
    const books = repo.findAll();
    logger.info("Found [{}] books. Books: [{}]", books.length, JSON.stringify(books));

}
