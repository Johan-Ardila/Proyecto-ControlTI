//Qué hace: Importa el archivo del modelo de solicitudes para gestionar las peticiones
const SolicitudModel = require('../models/solicitud.model');

//Método getSolicitudes (Obtener todas las solicitudes registradas)
const getSolicitudes = async (req, res) => {
  try {
    const solicitudes = await SolicitudModel.getAll();
    res.json({
      status: 'success',
      total: solicitudes.length,
      data: solicitudes
    });
  } catch (error) {
    console.error('Error al consultar solicitudes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno al consultar solicitudes'
    });
  }
};

//Método createSolicitud (Registrar una nueva solicitud de equipo)
const createSolicitud = async (req, res) => {
  const { id_usuario, id_equipo, tipo_solicitud, descripcion, prioridad } = req.body;

  if (!id_usuario || !tipo_solicitud || !descripcion) {
    return res.status(400).json({
      status: 'error',
      message: 'Los campos id_usuario, tipo_solicitud y descripcion son obligatorios'
    });
  }

  try {
    const nuevaSolicitud = await SolicitudModel.create({
      id_usuario,
      id_equipo,
      tipo_solicitud,
      descripcion,
      prioridad
    });

    res.status(201).json({
      status: 'success',
      message: 'Solicitud registrada correctamente',
      data: nuevaSolicitud
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno al registrar la solicitud'
    });
  }
};

module.exports = {
  getSolicitudes,
  createSolicitud
};

//Método updateEstadoSolicitud (Modificar el estatus de una solicitud de préstamo)
const updateEstadoSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['pendiente', 'en_proceso', 'resuelto', 'rechazado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      status: 'error',
      message: `El estado debe ser uno de los siguientes: ${estadosValidos.join(', ')}`
    });
  }

  try {
    const actualizado = await SolicitudModel.updateEstado(id, estado);
    if (!actualizado) {
      return res.status(404).json({
        status: 'error',
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      status: 'success',
      message: `Estado de la solicitud #${id} actualizado a '${estado}'`
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ status: 'error', message: 'Error interno al actualizar la solicitud' });
  }
};

//Exportación del Controlador de solicitudes
module.exports = {
  getSolicitudes,
  createSolicitud,
  updateEstadoSolicitud
};