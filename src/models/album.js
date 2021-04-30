module.exports = (sequelize, DataTypes) => {
  const album = sequelize.define('album', {
    id: DataTypes.STRING,
    name: DataTypes.STRING,
    genre: DataTypes.STRING,
  }, {});

  album.associate = function associate() {
    // associations can be defined here. This method receives a models parameter.
  };

  return album;
};
