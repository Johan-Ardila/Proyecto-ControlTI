//Qué hace: Importa el pool de MariaDB y bcryptjs para el manejo seguro de contraseñas de usuarios
const pool = require('../config/db/db');
const bcrypt = require('bcryptjs');

//Método obtenerUsuarios (Obtener todos los usuarios con el nombre de su rol mediante JOIN)
const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id_usuario, u.nombre, u.email, u.id_rol, r.nombre_rol, u.estado, u.fecha_creacion 
      FROM usuarios u 
      INNER JOIN roles r ON u.id_rol = r.id_rol
    `);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

//Método crearUsuario (Crear un nuevo usuario con contraseña encriptada)
const crearUsuario = async (req, res) => {
  const { nombre, email, password, id_rol, estado } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Nombre, email y contraseña son obligatorios' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, id_rol, estado) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, passwordHash, id_rol || 3, estado || 'activo']
    );

    res.status(201).json({ status: 'success', message: 'Usuario creado exitosamente', id: result.insertId });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

//Método actualizarUsuario (Actualizar datos del usuario con opción de contraseña opcional)
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, id_rol, estado } = req.body;

  try {
    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE usuarios SET nombre = ?, email = ?, password = ?, id_rol = ?, estado = ? WHERE id_usuario = ?',
        [nombre, email, passwordHash, id_rol, estado, id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ?, estado = ? WHERE id_usuario = ?',
        [nombre, email, id_rol, estado, id]
      );
    }

    res.json({ status: 'success', message: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

//Método eliminarUsuario (Eliminar un usuario del sistema por su ID)
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    res.json({ status: 'success', message: 'Usuario eliminado del sistema' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

//Exportación del Controlador de usuarios
module.exports = { 
  obtenerUsuarios, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario 
};