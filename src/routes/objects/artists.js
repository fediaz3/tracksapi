const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router


const calculateSelfURL = (currentURL, object, id) => {
  url = `https://${currentURL}/${object}/${id}`
  return url
}

const btoaEncode = (string) => {
  return Buffer.from(string).toString('base64')
}
const calculateId = (name) => {
  idCalculated = btoaEncode(name).slice(0, 22)
  return idCalculated
}

const calculateURLSArtist = (currentURL, idCalculated) => {
  let selfURL = calculateSelfURL(currentURL,'artists', idCalculated)
  let albumsURL = `${selfURL}/albums`
  let tracksURL = `${selfURL}/tracks`

  return [selfURL, albumsURL, tracksURL]

}

const calculateURLSAlbum = (currentURL, idCalculated) => {
  let selfURL = calculateSelfURL(currentURL,'albums', idCalculated)
  let artistURL = `${selfURL}/artists`
  let tracksURL = `${selfURL}/tracks`

  return [artistURL, tracksURL, selfURL]

}


async function loadArtist(ctx, next) {
    ctx.state.artist = await ctx.orm.artist.findByPk(ctx.params.id);
    return next();
  }
  
//GET ALL ARTISTS
router.get('artists.list', '/', async(ctx, next) => {
  let artistsList = await ctx.orm.artist.findAll();
  
  artistsList = artistsList.map( x => { 
    currentURL = ctx.request.headers.host;
    let [selfURL, albumsURL, tracksURL] = calculateURLSArtist(currentURL, idCalculated)
    return {name: x.name, age: x.age, albums: albumsURL, tracks: tracksURL, self: selfURL}
  })
  //console.log("Llegamos acá")
  ctx.body = artistsList
  await next()
});


// GET ARTIST BY ID
router.get('artists.list', '/:id', loadArtist, async(ctx, next) => {
  // console.log("Llegamos acá 2")
  let {artist} = ctx.state
  currentURL = ctx.request.headers.host;
  let [selfURL, albumsURL, tracksURL] = calculateURLSArtist(currentURL, artist.id)
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
  const {artist} = ctx.state;
  await artist.destroy();
  // ctx.redirect(ctx.router.url('artists.list')); // lo redirecciono a la lista de curevent
});


// CREATE ALBUM TO THIS ARTIST.
router.post('artists.create', '/:id/albums', async (ctx, next) => {
  
  body = ctx.request.body
  console.log("body que llega create album to this artist:", body, typeof(body))

  //Calculate ID
  let name = body.name
  let idCalculated = calculateId(name)
  body.id = idCalculated //agrego el par {id: idCalculated} al body
  // body.artistID = ctx.request.headers.host

  // OBTENER BIEN ESTA URL AQUI VOY************************************************************
  // console.log(ctx.request.URL.pathname.slice(8, 31))
  // console.log(ctx.request.URL.pathname.indexOf('/', 1))
  // let currentURLObject = ctx.request.URL
  // let idArtistFromURL = currentURLObject.pathname.slice(currentURLObject.pathname.indexOf('/', 2) + 1, 
  //   currentURLObject.pathname.indexOf('/', 3))

  //Calculate URLS
  let currentURL = ctx.request.headers.host
  let [artistURL, tracksURL, selfURL] = calculateURLSAlbum(currentURL, idCalculated)
  // console.log(idCalculated, name, age, selfURL, albumsURL, tracksURL)
  
  // Creo el artista en el ORM
  const album = await ctx.orm.album.build(body);
  // console.log("artista previoa c rear:", artist)
  
  try {
    //guardo el artista en la bd con el orm
    await album.save({ fields: ["id", "name", "genre"]});
    // console.log("exitoso")
    //Mostrar el artista creado:
    response = {
      id: album.id,
      // falta agregar el artistID al cual agregué, pero 
      artist_id: idArtistFromURL, //cambiar esto y poner album.artistId con la llave foreanea asociada antes
      name: album.name,
      genre: album.genre,
      artist: artistURL, //calculados aqui mismo
      tracks: tracksURL,
      self: selfURL
    }
    ctx.body = response
    await next()
    
  } catch (validationError) {
    console.log("error: ", validationError.errors)
  }
});








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