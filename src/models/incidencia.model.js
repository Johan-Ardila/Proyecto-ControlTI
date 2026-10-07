const pool = require('../config/db/db');

const IncidenciaModel = {
  // Obtiene todas las incidencias ordenadas por fecha
  getAll: async () => {
    const [rows] = await pool.query(`SELECT * FROM incidencias ORDER BY fecha_creacion DESC`);
    return rows;
  },
  
  // Crea una nueva incidencia
  create: async (data) => {
    const { id_equipo, nombre_equipo, nombre_usuario, correo_usuario, mensaje_usuario } = data;
    const [result] = await pool.query(
      `INSERT INTO incidencias (id_equipo, nombre_equipo, nombre_usuario, correo_usuario, mensaje_usuario, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [id_equipo, nombre_equipo, nombre_usuario, correo_usuario, mensaje_usuario]
    );
    return { id_incidencia: result.insertId, ...data, estado: 'pendiente' };
  },

  // Actualiza el estado de una incidencia
  updateEstado: async (id_incidencia, estado) => {
    const [result] = await pool.query(
      `UPDATE incidencias SET estado = ? WHERE id_incidencia = ?`,
      [estado, id_incidencia]
    );
    return result.affectedRows > 0;
  }
};

module.exports = IncidenciaModel;