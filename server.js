require('dotenv').config();
//=========================== NÓDULOS Y DEPENDENCIAS===============================================================
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer'); // envía correos electrónicos

//===========================CONEXIÓN CON BASE DE DATOS Y MIDDLEWARES DE SEGURIDAD=================================
const pool = require('./src/config/db/db');
const connectMongo = require('./src/config/mongo');
const { cualquierUsuario } = require('./src/middlewares/authMiddleware');
const app = express();
const PORT = process.env.PORT || 3000;
//Conexiones a bases de datos
connectMongo();

//===========================CONFIGURACIÓN DE ALMACENAMIENTO DE IMAGENES============================================
const imgDir = path.join(__dirname, 'public/assets/img');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}
//Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imgDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `equipo-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

//======================================MIDDLEWARES GLOBALES (CORS Y FORMATO DE DATOS)========================================================

//QUE ES UN COR?:CORS: Configura las cabeceras HTTP para permitir peticiones desde cualquier origen (*),
//  habilitando cabeceras personalizadas como x-user-role y métodos HTTP (GET, POST, PUT, DELETE, OPTIONS)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers', 
    'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, x-user-id, x-user-role' // 👈 'x-user-role' INCLUIDO
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


//======================================RUTAS DE VISTAS (HTML)===============================================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'Index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'Dashboard.html'));
});

app.get('/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'usuarios.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

app.get('/mis-solicitudes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'mis-solicitudes.html'));
});

app.get('/incidencias', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'incidencias.html'));
});

//================================RUTAS DE API (LÓGICA BACKEND)========================================================================================0
app.use('/api/auth', require('./src/routes/auth.routes')); //(autenticación y login)
app.use('/api/equipos', require('./src/routes/equipo.routes'));//(gestión de hardware/equipos)
app.use('/api/solicitudes', require('./src/routes/solicitud.routes'));//(solicitudes de equipos)
app.use('/api/usuarios', require('./src/routes/usuario.routes'));//(administración de usuarios)
app.use('/api/incidencias', require('./src/routes/incidencia.routes'));//(reporte de fallos)

//================================ENDPOINTS ESPECIALES (SUBIDA DE IMAGENES,CHECK DE SALUD Y CONTACTO)(PROTEGIDO CON cualquierUsuario de authMiddleware)
app.post('/api/upload', cualquierUsuario, upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No se seleccionó ningún archivo' });
  }
  res.json({ status: 'success', filename: req.file.filename });
});
// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS fecha_actual');
    res.json({
      status: 'OK',
      message: 'Servidor Express y bases de datos activos',
      mariadb_time: rows[0].fecha_actual
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

//===============================API NODEMAILER=================================================================================================
const transporter = nodemailer.createTransport({
  service: 'gmail', // O tu servicio de correo preferido
  auth: {
    user: process.env.CORREO_USER || 'tu-correo@gmail.com',         // Idealmente sacado de variables de entorno .env
    pass: process.env.CORREO_PASS || 'tu-contraseña-de-aplicacion'   // Contraseña de aplicación
  }
});
//Datos que se usaran del formulario contactanos
app.post('/api/contacto', async (req, res) => {
  const { nombre, correo, asunto, mensaje } = req.body;

  //Correo redactado pera ser enviado al gmail
  const mailOptions = {
    from: `"${nombre}" <${correo}>`,
    to: 'cualquiercorreo@gmail.com', // correo que recibirá los mensajes 
    subject: `[Contacto Web] ${asunto}`,
    text: `Has recibido un nuevo mensaje desde la plataforma de Control TI:
    
    - Nombre: ${nombre}
    - Correo: ${correo}
    - Asunto: ${asunto}
    - Mensaje: ${mensaje}`
  };

 //Envía el email y da un aviso de confirmacion o de error 
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ status: 'success', message: 'Correo enviado exitosamente' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ status: 'error', message: 'Hubo un error al enviar el mensaje' });
  }
});

// ==============ARRANCA EL SERVIDOR Y DA UN AVISO DESDE LA CONSOLA PARA CONFIRMAR QUE SI FUNCIONA========================================================0
app.listen(PORT, () => {
  console.log(`El Servidor se activó en http://localhost:${PORT}`);
});