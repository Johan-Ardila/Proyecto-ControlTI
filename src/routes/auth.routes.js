const express = require('express');
const router = express.Router();
const pool = require('../config/db/db');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { correo, clave } = req.body;

  try {
    // Consultar usuario en MariaDB 
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.password, u.estado, u.id_rol, r.nombre_rol AS rol 
       FROM usuarios u
       LEFT JOIN roles r ON u.id_rol = r.id_rol
       WHERE u.email = ?`, 
      [correo]
    );

    // Validar si el correo existe
    if (!rows || rows.length === 0) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'El correo ingresado no existe' 
      });
    }

    const usuario = rows[0];

    //Validar si el usuario está activo
    if (usuario.estado !== 'activo') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'El usuario está inactivo en el sistema' 
      });
    }

    // Comparar la contraseña enviada con el hash almacenado en MariaDB
    const esCorrecta = await bcrypt.compare(clave, usuario.password);

    if (!esCorrecta) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Contraseña incorrecta' 
      });
    }

    // Retornar sesión exitosa (SE AÑADIÓ id_rol AL OBJETO DE SESIÓN)
    return res.json({
      status: 'success',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.email,
        id_rol: usuario.id_rol, //Obligatorio para verificarSesionStrict()
        rol: usuario.rol || 'usuario'
      }
    });

  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Error al procesar la solicitud' 
    });
  }
});

module.exports = router;