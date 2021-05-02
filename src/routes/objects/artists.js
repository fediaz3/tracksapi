const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router


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

// Aun no la uso:
// const calculateURLSTrack = (currentURL, albumId, artistId, trackId) => {
//   let artistURL = `http://${currentURL}/${artistId}`
//   let albumURL = `http://${currentURL}/${albumId}`
//   let selfURL = `http://${currentURL}/${trackId}`
// 
//   return [artistURL, albumURL, selfURL]
// 
// }


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
  currentURL = ctx.request.headers.host;
  let [albumsURL, tracksURL, selfURL] = calculateURLSArtist(currentURL, artist.id)

  artist = { //asi omito el id, y le agrego las URLS
    name: artist.name, age: artist.age, albums: albumsURL,
    tracks: tracksURL, self: selfURL
  }
  ctx.body = artist
  await next()
});


//CREATE ARTIST
router.post('artists.create', '/', async (ctx, next) => {
  
  body = ctx.request.body
  // console.log("body que llega:", body, typeof(body))
  //Calculate ID
  let name = body.name
  let idCalculated = calculateId(name)
  body.id = idCalculated //agrego el par {id: idCalculated} al body

  //Calculate URLS
  let currentURL = ctx.request.headers.host
  let [selfURL, albumsURL, tracksURL] = calculateURLSArtist(currentURL, idCalculated)
  // console.log(idCalculated, name, age, selfURL, albumsURL, tracksURL)
  // Creo el artista en el ORM
  const artist = await ctx.orm.artist.build(body);
  // console.log("artista previoa c rear:", artist)
  
  try {
    //guardo el artista en la bd con el orm
    await artist.save({ fields: ["id", "name", "age"]});
    // console.log("exitoso")
    //Mostrar el artista creado:
    response = {
      name: artist.name,
      age: artist.age,
      albums: albumsURL, //calculados aqui mismo
      tracks: tracksURL,
      self: selfURL
    }
    ctx.body = response
    await next()
    // ctx.redirect(ctx.router.url(`artists.list/${1}`));
  } catch (validationError) {
    console.log("error: ", validationError.errors)
    // voy a querer pasarle denuevo la vista
    // await ctx.render('artists.new', {
    //   artist,
    //   errors: validationError.errors, //errores que se depliean arriba del formulario.
    //   submitSupplierPath: ctx.router.url('artists.create'),
    // });
  }
});

//DELETE ARTIST:
router.del('artists.delete', '/:id', loadArtist, async (ctx) => {
  const {artist} = await ctx.state;
  try {
    await artist.destroy();
  }
  catch (validationError){
    console.log("error:", validationError) 
    //asi cuando no hay nadie no se cae la pgina AQUI ME FALTA TIRAR UN 404 o mensajito
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









// GET ALBUMS FROM THIS ARTIST <artistId>

//aqui voy:
// router.post('albums.create', '/:id/albums', loadArtist, async (ctx, next) => {
// });






//EDIT:
// router.get('artists.edit', '/:id/edit', loadArtist, async (ctx) => {
//   const {artist} = ctx.state;
//   // await ctx.render('artists/edit', {
//   //   artist,
//   //   submitEventPath: ctx.router.url('artists.update', { id: artist.id }),
//   // });
// });
// 
// //patch para EDIT:
// router.patch('artists.update', '/:id', loadArtist, async (ctx) => {
//   const {artist} = ctx.state;
//   // try {
//   //   const { role, name, email, phone } = ctx.request.body;
//   //   await artist.update({ role, name, email, phone });
//   //   ctx.redirect(ctx.router.url('artists.list'));
//   // } catch (validationError) {
//   //   await ctx.render('artists/edit', {
//   //     artist,
//   //     errors: validationError.errors,
//   //     submitEventsPath: ctx.router.url('artists.update', { id: artist.id }),
//   //   });
//   // }
// });





module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)