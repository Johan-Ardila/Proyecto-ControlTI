//Qué hace: Importa el archivo del modelo de incidencias para las consultas en la base de datos.
const IncidenciaModel = require('../models/incidencia.model');

//Método getIncidencias (Obtener todas las incidencias reportadas)
const getIncidencias = async (req, res) => {
  try {
    const incidencias = await IncidenciaModel.getAll();
    res.json({
      status: 'success',
      total: incidencias.length,
      data: incidencias
    });
  } catch (error) {
    console.error('Error al consultar incidencias:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno al consultar incidencias'
    });
  }
};

//Método createIncidencia (Registrar un nuevo reporte de incidencia o fallo)
const createIncidencia = async (req, res) => {
  const { id_equipo, nombre_equipo, nombre_usuario, correo_usuario, mensaje_usuario } = req.body;

  if (!mensaje_usuario || !nombre_usuario) {
    return res.status(400).json({
      status: 'error',
      message: 'El mensaje y el usuario son obligatorios'
    });
  }

  try {
    const nuevaIncidencia = await IncidenciaModel.create({
      id_equipo: id_equipo || 'N/A',
      nombre_equipo: nombre_equipo || 'General',
      nombre_usuario,
      correo_usuario: correo_usuario || 'No registrado',
      mensaje_usuario
    });

    res.status(201).json({
      status: 'success',
      message: 'Incidencia registrada correctamente',
      data: nuevaIncidencia
    });
  } catch (error) {
    console.error('Error al crear incidencia:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno al registrar la incidencia'
    });
  }
};

//Método updateEstadoIncidencia (Actualizar el estado del ticket de incidencia)
const updateEstadoIncidencia = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({
      status: 'error',
      message: 'El estado es obligatorio'
    });
  }

  try {
    const actualizado = await IncidenciaModel.updateEstado(id, estado);
    if (actualizado) {
      res.json({
        status: 'success',
        message: 'Estado de la incidencia actualizado correctamente'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Incidencia no encontrada'
      });
    }
  } catch (error) {
    console.error('Error al actualizar estado de la incidencia:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno al actualizar el estado'
    });
  }
};

//Exportación del Controlador de incidencias
module.exports = {
  getIncidencias,
  createIncidencia,
  updateEstadoIncidencia 
};