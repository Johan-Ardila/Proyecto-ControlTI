const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitud.controller');

// Consulta pública
router.get('/', solicitudController.getSolicitudes);

// Operaciones protegidas
router.post('/', solicitudController.createSolicitud);
router.put('/:id/estado', solicitudController.updateEstadoSolicitud);

module.exports = router;