const pool = require('../config/db/db');

const SolicitudModel = {
  // Obtiene todas las solicitudes con datos de usuario y equipo
  getAll: async () => {
    const [rows] = await pool.query(`
      SELECT 
        s.*, 
        u.nombre AS usuario_nombre, 
        u.email AS correo,     -- <-- Cambiado de 'usuario_email' a 'correo'
        e.codigo_inventario, 
        e.marca, 
        e.modelo 
      FROM solicitudes s
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      LEFT JOIN equipos e ON s.id_equipo = e.id_equipo
      ORDER BY s.fecha_solicitud DESC
    `);
    return rows;
  },

  // Crea una nueva solicitud
  create: async (data) => {
    const { id_usuario, id_equipo, tipo_solicitud, descripcion, prioridad } = data;
    const [result] = await pool.query(
      `INSERT INTO solicitudes (id_usuario, id_equipo, tipo_solicitud, descripcion, prioridad, estado) 
       VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [id_usuario, id_equipo || null, tipo_solicitud, descripcion, prioridad || 'media']
    );
    return { id_solicitud: result.insertId, ...data, estado: 'pendiente' };
  },

  // Actualiza el estado de la solicitud y sincroniza el equipo
  updateEstado: async (id_solicitud, estado) => {
    // 1. Obtener datos de la solicitud para identificar equipo y tipo
    const [filas] = await pool.query(
      'SELECT id_equipo, tipo_solicitud FROM solicitudes WHERE id_solicitud = ?', 
      [id_solicitud]
    );

    // 2. Actualizar el estado de la solicitud
    const [result] = await pool.query(
      `UPDATE solicitudes SET estado = ? WHERE id_solicitud = ?`,
      [estado, id_solicitud]
    );

    // 3. Actualizar estado del equipo automáticamente según la respuesta
    if (filas.length > 0 && filas[0].id_equipo) {
      const { id_equipo, tipo_solicitud } = filas[0];

      if (estado === 'resuelto' && tipo_solicitud === 'asignacion') {
        await pool.query('UPDATE equipos SET estado = "asignado" WHERE id_equipo = ?', [id_equipo]);
      } else if (estado === 'en_proceso' && (tipo_solicitud === 'mantenimiento' || tipo_solicitud === 'soporte')) {
        await pool.query('UPDATE equipos SET estado = "mantenimiento" WHERE id_equipo = ?', [id_equipo]);
      } else if (estado === 'resuelto' && (tipo_solicitud === 'mantenimiento' || tipo_solicitud === 'soporte')) {
        await pool.query('UPDATE equipos SET estado = "disponible" WHERE id_equipo = ?', [id_equipo]);
      }
    }

    return result.affectedRows > 0;
  }
};

module.exports = SolicitudModel;