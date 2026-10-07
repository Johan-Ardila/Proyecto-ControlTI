const mongoose = require('mongoose');//Importa la librería mongoose
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);//Intenta conectarse a tu base de datos MongoDB 
    //utilizando la dirección secreta (MONGO_URI) guardada en el archivo de variables de entorno (.env).
    console.log(' Conexión exitosa a MongoDB');
  } catch (error) {
    console.error(' Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectMongo;