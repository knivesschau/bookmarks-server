const express = require('express'); 
const logger = require('../logger');
const {v4:uuid} = require('uuid');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
    .route('/bookmarks')
    .get((req,res) => {

    })
    .post((req, res) => {

    });

bookmarksRouter 
    .route('/bookmarks/:id')
    .get((req,res) => {

    })
    .delete((req,res) => {

    });