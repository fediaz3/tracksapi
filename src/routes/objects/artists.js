const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const { number } = require('prop-types');
const router = new KoaRouter();          // creo un router

const httpCodes = require('./httpCodes')


const btoaEncode = (string) => {
  return Buffer.from(string).toString('base64')
}
const calculateId = (name) => {
  idCalculated = btoaEncode(name).slice(0, 22)
  return idCalculated // es un string
}

const calculateURLSArtist = (currentURL, artistId) => {
  let albumsURL = `http://${currentURL}/artists/${artistId}/albums`
  let tracksURL = `http://${currentURL}/artists/${artistId}/tracks`
  let selfURL = `http://${currentURL}/artists/${artistId}`

  return [albumsURL, tracksURL, selfURL]

}

const calculateURLSAlbum = (currentURL, albumId, artistId) => {
  let artistURL = `http://${currentURL}/artists/${artistId}`
  let tracksURL = `http://${currentURL}/albums/${albumId}/tracks`
  let selfURL = `http://${currentURL}/albums/${albumId}`

  return [artistURL, tracksURL, selfURL]
}

  
const calculateURLSTrack = (currentURL, albumId, artistId, trackId) => {
  let artistURL = `http://${currentURL}/artists/${artistId}`
  let albumURL = `http://${currentURL}/albums/${albumId}`
  let selfURL = `http://${currentURL}/tracks/${trackId}`

  return [artistURL, albumURL, selfURL]

}




async function loadArtist (ctx, next) {
    ctx.state.artist = await ctx.orm.artist.findByPk(ctx.params.id);
    return next();
}
  
//GET ALL ARTISTS
router.get('artists.list', '/', async(ctx, next) => {
  let artistsList = await ctx.orm.artist.findAll();
  
  artistsList = artistsList.map( x => { 
    currentURL = ctx.request.headers.host;
    let [albumsURL, tracksURL, selfURL] = calculateURLSArtist(currentURL, x.id)
    return {name: x.name, age: x.age, albums: albumsURL, tracks: tracksURL, self: selfURL}
  })
  //console.log("Llegamos acá")
  ctx.body = artistsList
  await next()
});


// GET ARTIST BY ID
router.get('artists.list', '/:id', loadArtist, async(ctx, next) => {
  // console.log("Llegamos acá 2")
  let { artist } = await ctx.state

  try {
    if (artist == null ){
      throw new TypeError('objectDoesNotExist')
    }
    currentURL = ctx.request.headers.host;
    let [albumsURL, tracksURL, selfURL] = calculateURLSArtist(currentURL, artist.id)
  
    artist = { 
      id: artist.id, name: artist.name, age: artist.age, 
      albums: albumsURL, tracks: tracksURL, self: selfURL
    }
    ctx.body = artist
    ctx.response.status = httpCodes.successCode['ok'] // 200
    await next()
    
  } catch (error) {
    if (error.message == "objectDoesNotExist"){
      console.log("no existe el artista")
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


//CREATE ARTIST
router.post('artists.create', '/', async (ctx, next) => {
  
  try {
    body = ctx.request.body

    //Chequeando el input (tipos de datos) dados en el body
    if (body.name == undefined || body.age == undefined 
      || typeof(body.name) != 'string' || typeof(body.age) != 'number'){
      throw new Error("badRequest")
      
    }
    if (typeof(body.age) == 'number'){ //para sacar los "floats" en javascript
      if (Number.isInteger(body.age) === false ){
        throw new Error("badRequest")
      }
    }

    // console.log("body que llega:", body, typeof(body))
    //Calculate ID
    let name = body.name
    let idCalculated = calculateId(name)
    body.id = idCalculated //agrego el par {id: idCalculated} al body
  
    // Creo el artista en el ORM
    const artist = await ctx.orm.artist.build(body);
    
    //guardo el artista en la bd con el orm
    await artist.save({ fields: ["id", "name", "age"]});
  
    //Calculate URLS
    let currentURL = ctx.request.headers.host
    let [albumsURL, tracksURL, selfURL] = calculateURLSArtist(currentURL, artist.id)

    //Mostrar el artista creado:
    response = {
      id: artist.id,
      name: artist.name,
      age: artist.age,
      albums: albumsURL, //calculados aqui mismo
      tracks: tracksURL,
      self: selfURL
    }
    ctx.body = response
    ctx.response.status = httpCodes.successCode['objectCreated']
    await next()

  } catch (error) {
    //formato incorrecto en el input dado: error.name == "SequelizeDatabaseError" 
    // faltan campos: error.message == "badRequest"
    // error de sintaxis: error.name == "SyntaxError"
    if (error.name == "SequelizeDatabaseError" || error.message == "badRequest") { 
      ctx.response.status = httpCodes.errorsCode['badRequest']
      ctx.body = ''
      await next()
    } else if (error.name == "SequelizeUniqueConstraintError"){ 
      //caso de id ya existia de antes.(id duplicados) (no pueden existir dos con el mismo id)
      ctx.response.status = httpCodes.errorsCode['objectConflict']

      const artist = await ctx.orm.artist.findByPk(idCalculated);
      //Calculate URLS
      let currentURL = ctx.request.headers.host
      let [albumsURL, tracksURL, selfURL] = calculateURLSArtist(currentURL, artist.id)
      response = {
        id: artist.id,
        name: artist.name,
        age: artist.age,
        albums: albumsURL, //calculados aqui mismo
        tracks: tracksURL,
        self: selfURL
      }

      ctx.body = response
      await next()
     
    } else {
      ctx.body = ''
      await next()
      // console.log('otro tipo de error', error)
      console.log("otro tipo de error:", error.name, error.message)

    }

    
  }
});

//DELETE ARTIST:
router.del('artists.delete', '/:id', loadArtist, async (ctx, next) => {
  const {artist} = ctx.state;
  try {
    if (artist == null) { //Si el album no existe de antes -> lanzar un error 404
      throw new TypeError('objectDoesNotExist')
    } 

    await artist.destroy(); 
    ctx.body = ''
    ctx.response.status = httpCodes.successCode['objectDeleted']
    await next() 

  
  } catch (error){
    if (error.message == "objectDoesNotExist"){
      console.log("no existe el objeto")
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


// CREATE ALBUM TO THIS ARTIST. <artistid>
// TODAS LOS ROUTER, DE ESTE ARCHIVO artists.js, empiezan con /artists/
// y sigue con el segundo parametro que pongo.
// el primero, es solo un nombre si lo quiero llamar aquia adentro
// CREATE ALBUM TO THIS ARTIST.
router.post('artists.create', '/:id/albums', loadArtist, async (ctx, next) => {
  const { artist } = await ctx.state;
  body = ctx.request.body
  //Calculate ID
  let name = `${body.name}:${artist.id}`
  let idCalculated = calculateId(name)
  body.id = idCalculated //agrego el par {id: idCalculated} al body
  // Creo el artista en el ORM
  const album = await ctx.orm.album.build(body);

  try {
    //guardo el artista en la bd con el orm
    await album.save({ fields: ["id", "name", "genre"]});
    // Hago la asociacion: agrego el artistId, en la fila del album actual. en la tabla albums
    // tbm pude haber hecho manual, la asociacion.
    await album.setArtist(artist)
    // console.log(album.getArtist()) // para ver la asociacion heca
    //Calculate URLS
    let currentURL = ctx.request.headers.host
    let [artistURL, tracksURL, selfURL] = calculateURLSAlbum(currentURL, album.id, artist.id)
    // console.log(idCalculated, name, age, selfURL, albumsURL, tracksURL)

    response = {
      id: album.id,
      artist_id: album.artistId, 
      name: album.name,
      genre: album.genre,
      artist: artistURL, 
      tracks: tracksURL,
      self: selfURL
    }
    ctx.body = response
    await next()

  } catch (validationError) {
    console.log("error: ", validationError.errors)
  }
});



// GET ALBUMS given <artistId>
router.get('albums.create', '/:id/albums', loadArtist, async (ctx, next) => {
  const { artist } = await ctx.state;

  try {
    if (artist == null){
      throw new TypeError('objectDoesNotExist')
    }
    let albumsList = await artist.getAlbums()
  
    albumsList = albumsList.map( x => { 
      let currentURL = ctx.request.headers.host;
      let [artistURL, tracksURL, selfURL] = calculateURLSAlbum(currentURL, x.id, artist.id)
      return {id: x.id, artist_id: x.artistId, name: x.name, genre: x.genre, 
        artist: artistURL, tracks: tracksURL, self: selfURL}
    })
    //console.log("Llegamos acá")
    ctx.body = albumsList
    await next()
  } catch (error){
    if (error.message == "objectDoesNotExist"){
      // console.log("no existe el album")
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


// GET TRACKS given <artistId>
router.get('tracks.list', '/:id/tracks', loadArtist, async (ctx, next) => {
  const { artist } = await ctx.state;

  try {
    if (artist == null){
      throw new TypeError('objectDoesNotExist')
    }
  
    let albumsList = await artist.getAlbums()
  
    tracksListPromises = albumsList.map( async(x) => await x.getTracks())
    let tracksList = await Promise.all(tracksListPromises)
  
    tracksList = tracksList[0].map( x => { 
      let currentURL = ctx.request.headers.host;
      let [artistURL, albumURL, selfURL] = calculateURLSTrack(currentURL, x.albumId, artist.id, x.id)
      return {id: x.id, album_id: x.albumId, name: x.name, duration: x.duration,
      times_played: x.timesPlayed, artist: artistURL, album: albumURL, self: selfURL}
    })

    ctx.body = tracksList
    await next()

  } catch (error) {
    if (error.message == "objectDoesNotExist"){
      // console.log("no existe el artista")
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




// PLAY ALL TRACKS FROM THIS ARTIST_ID( FROM ALL ALBUMS)
router.put('tracks.play', '/:id/albums/play', loadArtist, async (ctx, next) => {
  const { artist } = await ctx.state;

  try {
    if (artist == null){ //notar que esto es solo si no existe el artista de artistID
      // en otros casos va tirar 200 de todas formas.(aunque no tenga tracks)
      throw new TypeError('objectDoesNotExist')
    }
  
    let albumsList = await artist.getAlbums()
  
    tracksListPromises = albumsList.map( async(x) => await x.getTracks())
    let tracksList = await Promise.all(tracksListPromises)
  
    tracksList = tracksList[0].map( async (x) => { 
      // Reproducir el track:
      let trackIncremented = await x.increment('timesPlayed', {by: 1})
      // console.log("TrackIncremented:", trackIncremented) // es solo para verlo que se hizo
    })

    ctx.body = ''
    ctx.response.status = httpCodes.successCode['ok'] //retorna 200
    await next()
  } catch (error) {
    if (error.message == "objectDoesNotExist") {
      console.log('artista no encontrado')
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