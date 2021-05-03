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
  let artistURL = `https://${currentURL}/artists/${artistId}`
  let albumURL = `https://${currentURL}/albums/${albumId}`
  let selfURL = `https://${currentURL}/tracks/${trackId}`

  return [artistURL, albumURL, selfURL]

}

const calculateURLSAlbum = (currentURL, albumId, artistId) => {
  let artistURL = `https://${currentURL}/artists/${artistId}`
  let tracksURL = `https://${currentURL}/albums/${albumId}/tracks`
  let selfURL = `https://${currentURL}/albums/${albumId}`

  return [artistURL, tracksURL, selfURL]
}


  
//CREATE A TRACK IN THIS ALBUMID
router.post('tracks.create', '/:id/tracks', loadAlbum, async (ctx, next) => {
  const {album} = ctx.state
  
  try {
    if (album == null){
      throw new TypeError('objectContainerDoesNotExist')
    }

    body = ctx.request.body

    //Chequeando el input (tipos de datos) dados en el body
    if (typeof(body.name) != 'string' || typeof(body.duration) != 'number'){
      throw new Error("badRequest")
    }
    console.log("veamos")
    if (typeof(body.duration) == 'number'){ //para sacar los "integers" en javascript
      
      if (Number.isInteger(body.duration) === true){
        throw new Error("badRequest")
      }
      
    }
  
    //Calculate ID
    let name = `${body.name}:${album.id}`
    let idCalculated = calculateId(name)
    body.id = idCalculated //agrego el par {id: idCalculated} al body
    body.timesPlayed = 0
  
    // Creo el track en el orm
    const track = await ctx.orm.track.build(body);

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
    ctx.response.status = httpCodes.successCode['objectCreated']
    await next()
    
  } catch (error) {
    
    //formato incorrecto en el input dado: error.name == "SequelizeDatabaseError" 
    // faltan campos: error.message == "badRequest"
    // error.name == "SequelizeUniqueConstraintError": cuando hay duplicados.
    // error.message = "objectDoesNotExist", es cuando el albumId dado no existe

    if (error.name == "SequelizeDatabaseError" || error.message == "badRequest") { 
      ctx.response.status = httpCodes.errorsCode['badRequest']
      ctx.body = ''
      await next()
    } else if (error.name == "SequelizeUniqueConstraintError"){
      
      //caso de id ya existia de antes.(id duplicados) (no pueden existir dos con el mismo id)
      ctx.response.status = httpCodes.errorsCode['objectConflict']

      const track = await ctx.orm.track.findByPk(idCalculated);
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
     
    } else if (error.message = "objectContainerDoesNotExist"){
      // console.log("errorcito:", error.name, error.message) 
      ctx.response.status = httpCodes.errorsCode['objectContainerDoesNotExist']
      ctx.body = ''
      await next()

    } else {
      ctx.body = ''
      await next()
      // console.log('otro tipo de error', error)
      console.log("otro tipo de error:", error.name, error.message)

    }
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

  try {
    if (album == null){
      throw new TypeError('objectDoesNotExist')
    }
  
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
    
  } catch (error) {
    if (error.message == "objectDoesNotExist"){
      ctx.body = ''
      ctx.response.status = httpCodes.errorsCode[error.message] //retorna 404
      await next()
      
    } else {
      //En caso de otros errores, que no estén en los IF's
      //console.log("error no manejado:", error)
      ctx.body = ''
      await next()
    }
  }

});



// GET TRACK FROM THIS album <albumId> given
router.get('tracks.list', '/:id/tracks', loadAlbum, async (ctx, next) => {

  const { album } = await ctx.state;

  try {
    if (album == null){
      throw new TypeError('objectDoesNotExist')
    }
  
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
    
  } catch (error) {
    if (error.message == "objectDoesNotExist"){
      // console.log("no existe el objeto")
      ctx.body = ''
      ctx.response.status = httpCodes.errorsCode[error.message] //retorna 404
      await next()
      
    } else {
      //En caso de otros errores, que no estén en los IF's
      //console.log("error no manejado:", error)
      ctx.body = ''
      await next()
    }
    
  }
  
});


  
// PLAY ALL TRACKS GIVEN <albumId>
router.put('tracks.play', '/:id/tracks/play', loadAlbum, async (ctx, next) => {

  const { album } = await ctx.state;
  console.log("ALBUM:", album)

  try {
    if (album == null){ //solo tira 404, en caso que el album no exista.
      //notar que en el caso que el album exista y esté vacio -> no tira error
      // y sale exitoso, a pesar de no tener tracks. (igual se pueden interpretar asi)
      throw new TypeError('objectDoesNotExist')
    }
  
    let tracksList = await album.getTracks()
    tracksList = tracksList.map( async (x) => { 
      // Reproducir el track:
      let trackIncremented = await x.increment('timesPlayed', {by: 1})
      // console.log("TrackIncremented:", trackIncremented) // es solo para verlo que se hizo
    })

    ctx.body = ''
    ctx.response.status = httpCodes.errorsCode['ok']
    await next()
  } catch (error) {
    if (error.message == "objectDoesNotExist") {
      ctx.body = ''
      ctx.response.status = httpCodes.errorsCode[error.message] //retorna 404
      await next()
    } else {
      //En caso de otros errores, que no estén en los IF's
      //console.log("error no manejado:", error)
      ctx.body = ''
      await next()
    }
    
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
      
    } else {
      //En caso de otros errores, que no estén en los IF's
      //console.log("error no manejado:", error)
      ctx.body = ''
      await next()
    }

    
    
  }
});
  



module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)