const mysql = require('mysql2/promise');//Importa la librería mysql2 preparada para trabajar con promesas 
//(lo que te permite usar async/await al hacer consultas) 
// y activa la lectura de las variables de entorno del archivo .env
require('dotenv').config();

//Crea un grupo (pool) de conexiones reutilizables hacia MariaDB. 
// En lugar de abrir y cerrar una conexión nueva con la base de datos cada vez que un usuario realiza una acción,
//  el pool mantiene varias conexiones abiertas y listas, mejorando el rendimiento y la velocidad del servidor. 
// Configura parámetros como el host, user, password y database extrayéndolos de forma segura del archivo .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;