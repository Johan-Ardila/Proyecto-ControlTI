//authMiddleware.js sirve para controlar la seguridad y los permisos de acceso en el backend.
// Ayuda a verificar los roles y según el rol permite hacer mas o menos cosas
const verificarRol = (rolesPermitidos = []) => {
  return (req, res, next) => {
    const idRol = Number(req.headers['x-user-role'] || req.usuario?.id_rol);

    if (!idRol) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'No autenticado. Debe iniciar sesión.' 
      });
    }

    if (rolesPermitidos.includes(idRol)) {
      return next();
    }

    return res.status(403).json({ 
      status: 'error', 
      message: 'Acceso denegado: Permisos insuficientes.' 
    });
  };
};

const esAdmin = verificarRol([1]);

module.exports = {
  esAdmin,
  soloAdmin: esAdmin,
  tecnicoOAdmin: verificarRol([1, 2]),
  cualquierUsuario: verificarRol([1, 2, 3])
};

//Se importan en las rutas (por ejemplo, en las de equipos o usuarios) 
// para bloquear acciones de creación, edición o borrado según el tipo de usuario.