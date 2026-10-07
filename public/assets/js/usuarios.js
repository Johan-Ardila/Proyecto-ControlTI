 const API_URL = '/api/usuarios';
    const HEADERS_AUTH = {
      'Content-Type': 'application/json',
      'x-user-role': localStorage.getItem('id_rol') || '1'
    };

    let listaUsuarios = [];
    let esModoEdicion = false;

    // Elementos del DOM
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const modalUsuario = document.getElementById('modal-usuario');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formUsuario = document.getElementById('form-usuario');

    document.addEventListener('DOMContentLoaded', () => {
      obtenerUsuarios();

      if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', toggleSidebar);
      if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

      btnCloseModal.addEventListener('click', cerrarModal);
      btnCancelar.addEventListener('click', cerrarModal);
      formUsuario.addEventListener('submit', guardarUsuario);
    });

    function toggleSidebar() {
      sidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
    }

    //Cargar Usuarios desde el Servidor
    async function obtenerUsuarios() {
      try {
        const res = await fetch(API_URL, { headers: HEADERS_AUTH });
        const resData = await res.json();

        if (resData.status !== 'success') throw new Error(resData.message);

        listaUsuarios = resData.data;
        renderTabla(listaUsuarios);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        document.getElementById('tabla-usuarios-body').innerHTML = `
          <tr><td colspan="6" class="text-center">Error al cargar usuarios.</td></tr>
        `;
      }
    }

  //Renderizar Filas de la Tabla (Oculta el botón de eliminar si es tu propia cuenta)
function renderTabla(usuarios) {
  const tbody = document.getElementById('tabla-usuarios-body');
  tbody.innerHTML = '';

  if (usuarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron usuarios.</td></tr>`;
    return;
  }

  // Intentar obtener el ID del usuario logueado actualmente desde el localStorage
  let currentUserId = Number(localStorage.getItem('id_usuario') || 0);
  if (!currentUserId) {
    const sesionRaw = localStorage.getItem('usuario_session');
    if (sesionRaw) {
      try {
        const usuarioSesion = JSON.parse(sesionRaw);
        currentUserId = Number(usuarioSesion.id_usuario || usuarioSesion.id || 0);
      } catch (e) {
        console.error('Error al leer la sesión actual:', e);
      }
    }
  }

  usuarios.forEach(user => {
    const badgeRolClass = user.id_rol === 1 ? 'badge--mantenimiento' : (user.id_rol === 2 ? 'badge--asignado' : 'badge--disponible');
    const badgeEstadoClass = user.estado === 'activo' ? 'badge--disponible' : 'badge--mantenimiento';

    //Validar si esta fila pertenece al usuario que tiene la sesión abierta
    const esMiCuenta = currentUserId && (Number(user.id_usuario) === currentUserId);

    //Si es mi cuenta, el botón de eliminar queda vacío (''), de lo contrario se muestra normal
    const botonEliminarHtml = esMiCuenta 
      ? '' 
      : `<button onclick="eliminarUsuario(${user.id_usuario})" class="btn-icon btn-delete" title="Eliminar"><i class="ri-delete-bin-line"></i></button>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>#${user.id_usuario}</td>
      <td><strong>${user.nombre}</strong> ${esMiCuenta ? '<span class="badge badge--primary" style="font-size: 10px; margin-left: 5px;">Tú</span>' : ''}</td>
      <td>${user.email}</td>
      <td><span class="badge ${badgeRolClass}">${user.nombre_rol}</span></td>
      <td><span class="badge ${badgeEstadoClass}">${user.estado}</span></td>
      <td class="text-center">
        <button onclick='abrirModalEditar(${JSON.stringify(user)})' class="btn-icon btn-edit" title="Editar"><i class="ri-pencil-line"></i></button>
        ${botonEliminarHtml}
      </td>
    `;
    tbody.appendChild(row);
  });
}

    //Filtrar en Tiempo Real por Búsqueda
    function filtrarTabla() {
      const texto = document.getElementById('inputBuscar').value.toLowerCase();
      const filtrados = listaUsuarios.filter(u => 
        u.nombre.toLowerCase().includes(texto) || 
        u.email.toLowerCase().includes(texto)
      );
      renderTabla(filtrados);
    }

    //Abrir Modal para Crear
    function abrirModalCrear() {
      esModoEdicion = false;
      document.getElementById('modalTitulo').textContent = 'Registrar Nuevo Usuario';
      document.getElementById('edit-id-usuario').value = '';
      document.getElementById('edit-nombre').value = '';
      document.getElementById('edit-email').value = '';
      document.getElementById('edit-password').value = '';
      document.getElementById('edit-password').required = true;
      document.getElementById('pass-help-text').textContent = 'Asigna una contraseña inicial.';
      document.getElementById('edit-rol').value = '3';
      document.getElementById('edit-estado').value = 'activo';

      modalUsuario.classList.add('active');
    }

    //Abrir Modal para Editar
    function abrirModalEditar(usuario) {
      esModoEdicion = true;
      document.getElementById('modalTitulo').textContent = 'Editar Permisos de Usuario';
      document.getElementById('edit-id-usuario').value = usuario.id_usuario;
      document.getElementById('edit-nombre').value = usuario.nombre;
      document.getElementById('edit-email').value = usuario.email;
      document.getElementById('edit-password').value = '';
      document.getElementById('edit-password').required = false;
      document.getElementById('pass-help-text').textContent = 'Déjalo en blanco si no deseas cambiar la contraseña.';
      document.getElementById('edit-rol').value = usuario.id_rol;
      document.getElementById('edit-estado').value = usuario.estado;

      modalUsuario.classList.add('active');
    }

    function cerrarModal() {
      modalUsuario.classList.remove('active');
    }

    //Guardar (POST o PUT)
    async function guardarUsuario(e) {
      e.preventDefault();

      const id = document.getElementById('edit-id-usuario').value;
      const password = document.getElementById('edit-password').value;

      const payload = {
        nombre: document.getElementById('edit-nombre').value,
        email: document.getElementById('edit-email').value,
        id_rol: Number(document.getElementById('edit-rol').value),
        estado: document.getElementById('edit-estado').value
      };

      if (password.trim() !== '') {
        payload.password = password;
      }

      const url = esModoEdicion ? `${API_URL}/${id}` : API_URL;
      const method = esModoEdicion ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: HEADERS_AUTH,
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.status === 'success') {
          cerrarModal();
          obtenerUsuarios();
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error al guardar:', error);
      }
    }

    //Eliminar Usuario
    async function eliminarUsuario(id) {
      if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: HEADERS_AUTH
        });

        const data = await res.json();
        if (data.status === 'success') {
          obtenerUsuarios();
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }