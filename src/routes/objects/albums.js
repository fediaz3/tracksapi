const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router


async function loadAlbum(ctx, next) {
    ctx.state.album = await ctx.orm.album.findByPk(ctx.params.id);
    return next();
  }
  
  
  //READ
  router.get('albums.list', '/', async(ctx) => {
    const albumsList = await ctx.orm.album.findAll();
    // await ctx.render('albums/index', {
    //   albumsList: albumsList,
    //   newEventPath: ctx.router.url('albums.new'),
    //   editEventPath: (album) => ctx.router.url('albums.edit', { id: album.id }),
    //   deleteEventPath: (album) => ctx.router.url('albums.delete', { id: album.id })
    // });
  });
  
  
  //CREATE
  
  router.get('albums.new', '/new', async (ctx) => {
    const album = ctx.orm.album.build();
    // await ctx.render('albums/new', {
    //   album,
    //   submitEventPath: ctx.router.url('albums.create'),
    // });
  });
  
  //post para crear un album:
  router.post('albums.create', '/', async (ctx) => {
    const album = ctx.orm.album.build(ctx.request.body);
    // try {
    //   await album.save({ fields: ['description', 'date']});
    //   ctx.redirect(ctx.router.url('albums.list'));
    // } catch (validationError) {
    //   // voy a querer pasarle denuevo la vista
    //   await ctx.render('albums.new', {
    //     album,
    //     errors: validationError.errors, //errores que se depliean arriba del formulario.
    //     submitSupplierPath: ctx.router.url('albums.create'),
    //   });
    // }
  });
  
  
  
  //EDIT:
  router.get('albums.edit', '/:id/edit', loadAlbum, async (ctx) => {
    const {album} = ctx.state;
    // await ctx.render('albums/edit', {
    //   album,
    //   submitEventPath: ctx.router.url('albums.update', { id: album.id }),
    // });
  });
  
  //patch para EDIT:
  router.patch('albums.update', '/:id', loadAlbum, async (ctx) => {
    const {album} = ctx.state;
    // try {
    //   const { role, name, email, phone } = ctx.request.body;
    //   await album.update({ role, name, email, phone });
    //   ctx.redirect(ctx.router.url('albums.list'));
    // } catch (validationError) {
    //   await ctx.render('albums/edit', {
    //     album,
    //     errors: validationError.errors,
    //     submitEventsPath: ctx.router.url('albums.update', { id: album.id }),
    //   });
    // }
  });
  
  
  
  //DELETE:
  router.del('albums.delete', '/:id', loadAlbum, async (ctx) => {
    const {album} = ctx.state;
    await album.destroy();
    // ctx.redirect(ctx.router.url('albums.list')); // lo redirecciono a la lista de curevent
  });
  



module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)