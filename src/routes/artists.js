const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router


async function loadArtist(ctx, next) {
    ctx.state.artist = await ctx.orm.artist.findByPk(ctx.params.id);
    return next();
  }
  
  
  //READ
  router.get('artists.list', '/', async(ctx) => {
    const artistsList = await ctx.orm.artist.findAll();
    // await ctx.render('artists/index', {
    //   artistsList: artistsList,
    //   newEventPath: ctx.router.url('artists.new'),
    //   editEventPath: (artist) => ctx.router.url('artists.edit', { id: artist.id }),
    //   deleteEventPath: (artist) => ctx.router.url('artists.delete', { id: artist.id })
    // });
  });
  
  
  //CREATE
  
  router.get('artists.new', '/new', async (ctx) => {
    const artist = ctx.orm.artist.build();
    // await ctx.render('artists/new', {
    //   artist,
    //   submitEventPath: ctx.router.url('artists.create'),
    // });
  });
  
  //post para crear un artist:
  router.post('artists.create', '/', async (ctx) => {
    const artist = ctx.orm.artist.build(ctx.request.body);
    // try {
    //   await artist.save({ fields: ['description', 'date']});
    //   ctx.redirect(ctx.router.url('artists.list'));
    // } catch (validationError) {
    //   // voy a querer pasarle denuevo la vista
    //   await ctx.render('artists.new', {
    //     artist,
    //     errors: validationError.errors, //errores que se depliean arriba del formulario.
    //     submitSupplierPath: ctx.router.url('artists.create'),
    //   });
    // }
  });
  
  
  
  //EDIT:
  router.get('artists.edit', '/:id/edit', loadArtist, async (ctx) => {
    const {artist} = ctx.state;
    // await ctx.render('artists/edit', {
    //   artist,
    //   submitEventPath: ctx.router.url('artists.update', { id: artist.id }),
    // });
  });
  
  //patch para EDIT:
  router.patch('artists.update', '/:id', loadArtist, async (ctx) => {
    const {artist} = ctx.state;
    // try {
    //   const { role, name, email, phone } = ctx.request.body;
    //   await artist.update({ role, name, email, phone });
    //   ctx.redirect(ctx.router.url('artists.list'));
    // } catch (validationError) {
    //   await ctx.render('artists/edit', {
    //     artist,
    //     errors: validationError.errors,
    //     submitEventsPath: ctx.router.url('artists.update', { id: artist.id }),
    //   });
    // }
  });
  
  
  
  //DELETE:
  router.del('artists.delete', '/:id', loadArtist, async (ctx) => {
    const {artist} = ctx.state;
    await artist.destroy();
    // ctx.redirect(ctx.router.url('artists.list')); // lo redirecciono a la lista de curevent
  });
  



module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)