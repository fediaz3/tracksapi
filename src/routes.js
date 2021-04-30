const KoaRouter = require('koa-router');

const hello = require('./routes/hello');
const index = require('./routes/index');

// new models:
const artists = require('./routes/objects/artists.js');
const albums = require('./routes/objects/albums.js');
const tracks = require('./routes/objects/tracks.js')
// end new-models

const router = new KoaRouter();

router.use('/', index.routes());
router.use('/hello', hello.routes());
// new models:
router.use('/artists', artists.routes());
router.use('/albums', albums.routes());
router.use('/tracks', tracks.routes())

// end new-models

module.exports = router;
