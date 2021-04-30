module.exports = (sequelize, DataTypes) => {
  const artist = sequelize.define('artist', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    age: DataTypes.INTEGER,
  }, {});

  artist.associate = function associate(models) {
    // associations can be defined here. This method receives a models parameter.
    artist.hasMany(models.album)
  };

  return artist;
};
