const KoaRouter = require('koa-router'); // para pedir la libreria koa-router
const router = new KoaRouter();          // creo un router


async function loadTrack(ctx, next) {
    ctx.state.track = await ctx.orm.track.findByPk(ctx.params.id);
    return next();
  }
  
  
  //READ
  router.get('tracks.list', '/', async(ctx) => {
    const tracksList = await ctx.orm.track.findAll();
    // await ctx.render('tracks/index', {
    //   tracksList: tracksList,
    //   newEventPath: ctx.router.url('tracks.new'),
    //   editEventPath: (track) => ctx.router.url('tracks.edit', { id: track.id }),
    //   deleteEventPath: (track) => ctx.router.url('tracks.delete', { id: track.id })
    // });
  });
  
  
  //CREATE
  
  router.get('tracks.new', '/new', async (ctx) => {
    const track = ctx.orm.track.build();
    // await ctx.render('tracks/new', {
    //   track,
    //   submitEventPath: ctx.router.url('tracks.create'),
    // });
  });
  
  //post para crear un track:
  router.post('tracks.create', '/', async (ctx) => {
    const track = ctx.orm.track.build(ctx.request.body);
    // try {
    //   await track.save({ fields: ['description', 'date']});
    //   ctx.redirect(ctx.router.url('tracks.list'));
    // } catch (validationError) {
    //   // voy a querer pasarle denuevo la vista
    //   await ctx.render('tracks.new', {
    //     track,
    //     errors: validationError.errors, //errores que se depliean arriba del formulario.
    //     submitSupplierPath: ctx.router.url('tracks.create'),
    //   });
    // }
  });
  
  
  
  //EDIT:
  router.get('tracks.edit', '/:id/edit', loadTrack, async (ctx) => {
    const {track} = ctx.state;
    // await ctx.render('tracks/edit', {
    //   track,
    //   submitEventPath: ctx.router.url('tracks.update', { id: track.id }),
    // });
  });
  
  //patch para EDIT:
  router.patch('tracks.update', '/:id', loadTrack, async (ctx) => {
    const {track} = ctx.state;
    // try {
    //   const { role, name, email, phone } = ctx.request.body;
    //   await track.update({ role, name, email, phone });
    //   ctx.redirect(ctx.router.url('tracks.list'));
    // } catch (validationError) {
    //   await ctx.render('tracks/edit', {
    //     track,
    //     errors: validationError.errors,
    //     submitEventsPath: ctx.router.url('tracks.update', { id: track.id }),
    //   });
    // }
  });
  
  
  
  //DELETE:
  router.del('tracks.delete', '/:id', loadTrack, async (ctx) => {
    const {track} = ctx.state;
    await track.destroy();
    // ctx.redirect(ctx.router.url('tracks.list')); // lo redirecciono a la lista de curevent
  });
  



module.exports = router;                 // exporto el router (AL FINAL DEL ARCHIVO SIEMPRE)