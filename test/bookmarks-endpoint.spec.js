const knex = require('knex');
const bookmarkData = require('./bookmarks-fixtures');
const app = require('../src/app');

describe.only('Bookmarks Endpoints', () => {
    let db;

    before ('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        });
        app.set('db', db);
    });

    after ('disconnect from db', () => db.destroy());

    before ('cleanup', () => db('bookmarks').truncate());

    afterEach ('cleanup', () => db('bookmarks').truncate());

    describe(`Unauthorized requests`, () => {
      const testBookmarks = bookmarkData.makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      });

      it('responds with 401 Unauthorized for GET /bookmarks', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({title: 'test-title', url: 'http://some.thing.com', rating: 1})
          .expect(401, {error: 'Unauthorized Request'})  
      });

      it('responds with 401 Unauthorized for GET /bookmarks/:id', () => {
        const secondBookmark = testBookmarks[1];

        return supertest(app)
          .get(`/bookmarks/${secondBookmark.id}`)
          .expect(401, {error: 'Unauthorized Request'});
      });

      it('responds with 401 Unauthorized for DELETE /bookmarks/:id', () => {
        const someBookmark = testBookmarks[1]

        return supertest(app)
          .delete(`/bookmarks/${someBookmark.id}`)
          .expect(401, { error: 'Unauthorized Request'});
      });
    });

    describe(`GET /bookmarks`, () => {
      
      context('Given no bookmarks', () => {
        it('responds with 200 and an empty list', () => {
          return supertest(app)
            .get('/bookmarks')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, [])
        });
      });
      
      context('Given there are bookmarks in the database', () => {
        const testBookmarks = bookmarkData.makeBookmarksArray();

        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks)
        });

        it('gets the bookmarks from the database', () => {
          return supertest(app)
            .get('/bookmarks')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, testBookmarks)
        });
      });

      context('Given an XSS attack bookmark', () => {
        const { maliciousBookmark, expectedBookmark} = bookmarkData.makeMaliciousBookmark();

        beforeEach('insert malicious bookmark', () => {
          return db
            .into('bookmarks')
            .insert([maliciousBookmark])
        });

        it('removes XSS attack content', () => {
          return supertest(app)
            .get(`/bookmarks`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200)
            .expect(res => {
              expect(res.body[0].title).to.eql(expectedBookmark.title);
              expect(res.body[0].description).to.eql(expectedBookmark.description);
            });
        });
      });
    });

    describe(`DELETE /bookmarks/:id`, () => {
      context('Given no bookmarks', () => {
        it('responds 404 when bookmark doesn"t exist', () => {
          return supertest(app)
            .delete(`/bookmarks/123`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, {
              error: {message: 'Bookmark Not Found'}
            });
        });



      });

      context('Given there are bookmarks in the database', () => {
        const testBookmarks = bookmarkData.makeBookmarksArray();

        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks)
        });

        it('removes the bookmark by ID from the database', () => {
          const idToRemove = 2;
          const expectedBookmarks = testBookmarks.filter(bm => bm.id !== idToRemove);

          return supertest(app)
            .delete(`/bookmarks/${idToRemove}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then(() => {
              supertest(app)
                .get(`/bookmarks`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(expectedBookmarks)
            });
        });
      });
    });

    describe(`POST /bookmarks`, () => {
      it('responds with 400 missing "title" if not supplied', () => {
        const missingBookmarkTitle = {
          url: 'http://test.com',
          rating: 1
        };

        return supertest(app)
          .post(`/bookmarks`)
          .send(missingBookmarkTitle)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {message: `'title' is required`}
          });
      });

      it('responds with 400 missing "url" if not supplied', () => {
        const missingBookmarkUrl = {
          title: 'test-title',
          rating: 1
        };

        return supertest(app)
          .post(`/bookmarks`)
          .send(missingBookmarkUrl)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {message: `'url' is required`}
          });
      });

      it('respond with 400 missing "rating" if not supplied', () => {
        const missingBookmarkRating = {
          title: 'test-title',
          url: 'http://test.com'
        };

        return supertest(app)
          .post(`/bookmarks`)
          .send(missingBookmarkRating)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {message: `'rating' is required`}
          });
      });

      it('responds with 400 invalid "rating" if not between 0 and 5', () => {
        const bookmarkInvalidRating = {
          title: 'test-title',
          url: 'https://test.com',
          rating: 'invalid',
        };

        return supertest(app)
          .post(`/bookmarks`)
          .send(bookmarkInvalidRating)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'rating' must be a number between 0 and 5` }
          });
      });
  
      it('responds with 400 invalid "url" if not a valid URL', () => {
        const bookmarkInvalidUrl = {
          title: 'test-title',
          url: 'htp://invalid-url',
          rating: 1,
        };

        return supertest(app)
          .post(`/bookmarks`)
          .send(bookmarkInvalidUrl)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'url' must be a valid url` }
          });
      });
      
      it('adds a new bookmark to the database', () => {
        const newBookmark = {
          title: 'test-title',
          url: 'https://test.com',
          description: 'test description',
          rating: 1
        };

        return supertest(app)
          .post(`/bookmarks`)
          .send(newBookmark)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
          })
          .then(res => {
            supertest(app)
              .get(`/bookmarks/${res.body.id}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(res.body)
          });
      });

      it('removes XSS attack content from response', () => {
        const {maliciousBookmark, expectedBookmark} = bookmarkData.makeMaliciousBookmark();

        return supertest(app)
          .post(`/bookmarks`)
          .send(maliciousBookmark)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
});


    