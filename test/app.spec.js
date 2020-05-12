const app = require('../src/app')

describe('App', () => {
  it('GET / responds with 200 containing "Welcome to the Bookmarks API Client!"', () => {
    return supertest(app)
      .get('/')
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .expect(200, 'Welcome to the Bookmarks API Client!')
  });
})