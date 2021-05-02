const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router

const httpCodes = require('./httpCodes')

async function loadAlbum(ctx, next) {
    ctx.state.album = await ctx.orm.album.findByPk(ctx.params.id);
    return next();
  }
  
const btoaEncode = (string) => {
  return Buffer.from(string).toString('base64')
}
const calculateId = (name) => {
  idCalculated = btoaEncode(name).slice(0, 22)
  return idCalculated // es un string
}
  
const calculateURLSTrack = (currentURL, albumId, artistId, trackId) => {
  let artistURL = `http://${currentURL}/artists/${artistId}`
  let albumURL = `http://${currentURL}/albums/${albumId}`
  let selfURL = `http://${currentURL}/tracks/${trackId}`

  return [artistURL, albumURL, selfURL]

}

const calculateURLSAlbum = (currentURL, albumId, artistId) => {
  let artistURL = `http://${currentURL}/artists/${artistId}`
  let tracksURL = `http://${currentURL}/albums/${albumId}/tracks`
  let selfURL = `http://${currentURL}/albums/${albumId}`

  return [artistURL, tracksURL, selfURL]
}


  
//CREATE A TRACK IN THIS ALBUMID
router.post('tracks.create', '/:id/tracks', loadAlbum, async (ctx, next) => {
  const {album} = ctx.state
  body = ctx.request.body
  //Calculate ID
  let name = `${body.name}:${album.id}`
  let idCalculated = calculateId(name)
  body.id = idCalculated //agrego el par {id: idCalculated} al body
  body.timesPlayed = 0

  // Creo el track en el orm
  const track = await ctx.orm.track.build(body);
  try {
    //guardo el artista en la bd con el orm
    await track.save({ fields: ["id", "name", "duration", "timesPlayed"]});
    await track.setAlbum(album)
    // console.log("asociacion hecha (album asociado):", await track.getAlbum())
      //Calculate URLS
    let currentURL = ctx.request.headers.host
    let [artistURL, albumURL, selfURL] = calculateURLSTrack(currentURL, track.albumId, album.artistId, track.id)
    response = {
      id: track.id,
      album_id: track.albumId,
      name: track.name,
      duration: track.duration,
      times_played: track.timesPlayed,
      artist: artistURL,
      album: albumURL,
      self: selfURL
    }
    ctx.body = response
    await next()
    
  } catch (validationError) {
    console.log("error: ", validationError)
  }
});
  

// GET ALL ALBUMS
router.get('albums.list', '/', async(ctx, next) => {
  let albumsList = await ctx.orm.album.findAll();
  
  albumsList = albumsList.map( x => { 
    currentURL = ctx.request.headers.host;
    let [artistURL, tracksURL, selfURL] = calculateURLSAlbum(currentURL, x.id, x.artistId)
    return {id: x.id, artist_id: x.artistId, name: x.name, genre: x.genre,
    artist: artistURL, tracks: tracksURL, self: selfURL}
  })
  //console.log("Llegamos acá")
  ctx.body = albumsList
  await next()
});
  

// GET ALBUM given albumId
router.get('albums.list', '/:id', loadAlbum, async(ctx, next) => {
  let { album } = await ctx.state

  currentURL = ctx.request.headers.host;
  let [artistURL, tracksURL, selfURL] = calculateURLSAlbum(currentURL, album.id, album.artistId)

  album = { //asi omito el id, y le agrego las URLS
    id: album.id,
    artist_id: album.artistId,
    name: album.name,
    genre: album.genre,
    artist: artistURL,
    tracks: tracksURL,
    self: selfURL
  }
  ctx.body = album
  await next()
});



// GET TRACK FROM THIS album <albumId> given
router.get('tracks.list', '/:id/tracks', loadAlbum, async (ctx, next) => {

  const { album } = await ctx.state;

  let tracksList = await album.getTracks()

  tracksList = tracksList.map( x => { 
    let currentURL = ctx.request.headers.host;
    let [artistURL, albumURL, selfURL] = calculateURLSTrack(currentURL, x.albumId, album.artistId, x.id)
    return { id: x.id, album_id: x.albumId, name: x.name,
      duration: x.duration, times_played: x.timesPlayed,
      artist: artistURL, album: albumURL, self: selfURL
    }
  })
  //console.log("Llegamos acá")
  ctx.body = tracksList
  await next()

});


  
// PLAY ALL TRACKS GIVEN <albumId>
router.put('tracks.play', '/:id/tracks/play', loadAlbum, async (ctx, next) => {

  const { album } = await ctx.state;

  let tracksList = await album.getTracks()

  tracksList = tracksList.map( async (x) => { 
    // Reproducir el track:
    let trackIncremented = await x.increment('timesPlayed', {by: 1})
    // console.log("TrackIncremented:", trackIncremented) // es solo para verlo que se hizo
  })

  try {
    ctx.body = ''
    await next()
  } catch (validationError) {
    console.log("error: ", validationError)
  }
});





//DELETE ALBUM:
router.del('albums.delete', '/:id', loadAlbum, async (ctx, next) => {
  const {album} = ctx.state
  try {
    if (album == null) { //Si el album no existe de antes -> lanzar un error 404
      throw new TypeError('objectDoesNotExist')
    } 

    await album.destroy(); 
    ctx.body = ''
    ctx.response.status = httpCodes.successCode['objectDeleted']
    await next() 

  } catch (error){
    if (error.message == "objectDoesNotExist"){
      // console.log("no existe el objeto")
      ctx.body = ''
      ctx.response.status = httpCodes.errorsCode[error.message] //retorna 404
      await next()
      
    }
    
  }
});
  



module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)