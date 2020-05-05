const express = require('express'); 
const logger = require('../logger');
const store = require('../store');
const {v4:uuid} = require('uuid');
const {isWebUri} = require('valid-url');
const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
    .route('/bookmarks')
    .get((req,res) => {
        res.json(store.bookmarks);
    })
    .post(bodyParser, (req, res) => {
        for (const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`'${field}' is required.`);
                return res.status(400).send(`'${field}' is required.`);
            }
        }

        const {title, url, description, rating} = req.body;

        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            logger.error(`Invalid rating '${rating}' must be a number between 0 and 5.`);
            return res.status(400).send('Rating must be a number between 0 and 5.');
        }

        if (!isWebUri(url)) {
            logger.error(`Invalid url ${url} provided.`);
            return res.status(400).send('Please enter a valid URL.');
        }

        const bookmark = { id: uuid(), title, url, description, rating};

        store.bookmarks.push(bookmark);

        logger.info(`Bookmark created with id of ${bookmark.id}`);

        res.status(201).location(`http://localhost:8000/bookmarks/${bookmark.id}`).json(bookmark);
    });

bookmarksRouter 
    .route('/bookmarks/:bookmark_id')
    .get((req,res) => { 
        const {bookmark_id} = req.params; 
        const bookmark = store.bookmarks.find(c => c.id == bookmark_id);

        if (!bookmark) {
            logger.error(`Bookmark with id ${bookmark_id} not found.`);
            return res.status(404).send('Bookmark not found.');
        }

        res.json(bookmark);
    })
    .delete((req,res) => { 
        const {bookmark_id} = req.params; 
        const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id);

        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${bookmark_id} was not found.`);
            return res.status(404).send('Bookmark not found.');
        }

        store.bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${bookmark_id} deleted.`);

        res.status(204).send();
    });

    module.exports = bookmarksRouter;