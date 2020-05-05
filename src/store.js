const {v4:uuid} = require('uuid');

const bookmarks = [
    {
        id: uuid(),
        title: 'Sephora',
        url: 'https://www.sephora.com',
        description: 'Cosmetics and Beauty Products',
        rating: 5
    },
    {
        id: uuid(),
        title: 'IGN',
        url: 'https://www.ign.com',
        description: 'Gaming News and Reviews',
        rating: 5
    },
    {
        id: uuid(),
        title: 'Thinkful',
        url: 'https://www.thinkful.com',
        description: 'Think outside the classroom',
        rating: 5
    },
]

module.exports = {bookmarks}