const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router


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
  




  
//DELETE:
router.del('albums.delete', '/:id', loadAlbum, async (ctx) => {
  const {album} = ctx.state;
  await album.destroy();
  // ctx.redirect(ctx.router.url('albums.list')); // lo redirecciono a la lista de curevent
});
  



module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)