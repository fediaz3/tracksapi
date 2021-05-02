const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router


async function loadTrack(ctx, next) {
    ctx.state.track = await ctx.orm.track.findByPk(ctx.params.id);
    return next();
  }

const calculateURLSTrack = (currentURL, albumId, artistId, trackId) => {
  let artistURL = `http://${currentURL}/artists/${artistId}`
  let albumURL = `http://${currentURL}/albums/${albumId}`
  let selfURL = `http://${currentURL}/tracks/${trackId}`

  return [artistURL, albumURL, selfURL]
}
  
  
// GET ALL TRACKS
router.get('tracks.list', '/', async(ctx, next) => {
  let tracksList = await ctx.orm.track.findAll();
  
  tracksListPromises = tracksList.map( async(x) => { // al ponerle async va retornar una promesa
    let album = await x.getAlbum()
    let artist = await album.getArtist()
    currentURL = ctx.request.headers.host;
    let [artistURL, albumURL, selfURL] = calculateURLSTrack(currentURL, x.albumId, artist.id, x.id)
    return { id: x.id, album_id: x.albumId, name: x.name, duration: x.duration,
       times_played: x.timesPlayed, artist: artistURL, album: albumURL, self: selfURL}
  })

  let tracksListPrev = await Promise.all(tracksListPromises)
  tracksList = tracksListPrev.map( (x) => { 
    return x
  })
  ctx.body = tracksList
  await next()
});
  
  
  
// GET TRACK given TrackId
router.get('albums.list', '/:id', loadTrack, async(ctx, next) => {
  let { track } = await ctx.state
  let album  = await track.getAlbum()
  let artist = await album.getArtist()

  currentURL = ctx.request.headers.host;
  let [artistURL, albumURL, selfURL] = calculateURLSTrack(currentURL, track.albumId, artist.id, track.id)

  track = { //asi omito el id, y le agrego las URLS
    id: track.id,
    album_id: track.albumId,
    name: track.name,
    duration: track.duration,
    times_played: track.timesPlayed,
    artist: artistURL,
    album: albumURL,
    self: selfURL
  }
  try {
    ctx.body = track
    await next()
  } catch(validationError){
    console.log("error:", validationError)
  }
  
});

 
  
 
// PLAY TRACK given <trackID>
router.put('tracks.play', '/:id/play', loadTrack, async (ctx, next) => {
  const { track } = await ctx.state;

  let trackIncremented = await track.increment('timesPlayed', {by: 1})
  // console.log("Track Incremented:", track)

  try {
    ctx.body = ''
    await next()
  } catch (validationError) {
    console.log("error: ", validationError)
  }
});

  
//DELETE TRACK given <trackId>
router.del('tracks.delete', '/:id', loadTrack, async (ctx, next) => {
  const { track } = ctx.state;
  try {
    await track.destroy(); 
    ctx.body = ''
    await next() 
  } catch (validationError){
    console.log("error:", validationError) 
  }
});
  



module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)