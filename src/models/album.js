module.exports = (sequelize, DataTypes) => {
  const album = sequelize.define('album', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    genre: DataTypes.STRING,
  }, {});

  album.associate = function associate(models) {
    // associations can be defined here. This method receives a models parameter.
    album.belongsTo(models.artist) // si no funciona la recion agregar el Alias de la foreing key aqui.
    album.hasMany(models.track)
  };

  // si la asociacion no funciona, probar con esta sintaxis:
  // album.associate = (models) => {
  //   album.belongsTo(models.artist)
  // };

  return album;
};
