const KoaRouter = require('koa-router');

const hello = require('./routes/hello');
const index = require('./routes/index');

// new models:
const artists = require('./routes/artists.js');
// end new-models

const router = new KoaRouter();

router.use('/', index.routes());
router.use('/hello', hello.routes());
// new models:
router.use('/artists', artists.routes());
// end new-models

module.exports = router;
