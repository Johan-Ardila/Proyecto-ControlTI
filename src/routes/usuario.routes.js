const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Consulta pública
router.get('/', usuarioController.obtenerUsuarios);

// Operaciones protegidas
router.post('/', usuarioController.crearUsuario); //OBLIGATORIO PARA CREAR
router.put('/:id', usuarioController.actualizarUsuario);
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;