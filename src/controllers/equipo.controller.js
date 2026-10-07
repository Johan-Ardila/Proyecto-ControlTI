//Qué hace: Importa el archivo del modelo de equipos (equipo.model.js), 
// que es el que contiene las consultas SQL exactas para hablar con la base de datos MariaDB.
const EquipoModel = require('../models/equipo.model');

//Estructura Principal del Controlador
const equipoController = {
  //Método getAll (Obtener todos los equipos)
  getAll: async (req, res) => {
    try {
      const equipos = await EquipoModel.getAll();
      res.json({ status: 'success', data: equipos });
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
  },

  //Método create (Registrar uno o múltiples equipos en lote)
  create: async (req, res) => {
    try {
      const { codigo_inventario, tipo_equipo, marca, modelo, ubicacion } = req.body;

      if (!codigo_inventario || !tipo_equipo || !marca || !modelo || !ubicacion) {
        return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
      }

      const nuevoEquipo = await EquipoModel.create(req.body);
      res.status(201).json({ status: 'success', data: nuevoEquipo });
    } catch (error) {
      console.error('Error al crear equipo:', error);
      
      // Control si el código con sufijo ya existe en la base de datos
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          status: 'error', 
          message: 'El código de inventario o uno de sus consecutivos en el lote ya existe en la base de datos.' 
        });
      }

      res.status(500).json({ status: 'error', message: 'Error al registrar el equipo' });
    }
  },

  //Método update (Actualizar un equipo)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const equipoActualizado = await EquipoModel.update(id, req.body);
      res.json({ status: 'success', data: equipoActualizado });
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      res.status(500).json({ status: 'error', message: 'Error al actualizar el equipo' });
    }
  },

  //Método delete (Eliminar un equipo)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const eliminado = await EquipoModel.delete(id);

      if (!eliminado) {
        return res.status(404).json({ status: 'error', message: 'Equipo no encontrado' });
      }

      res.json({ status: 'success', message: 'Equipo eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      res.status(500).json({ status: 'error', message: 'Error al eliminar el equipo' });
    }
  }
};

//Exportación del Controlador
module.exports = equipoController;