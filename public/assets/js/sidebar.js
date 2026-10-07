document.addEventListener('DOMContentLoaded', async () => {
  //==========================================CARGA DINÁMICA DE LA SIDEBAR==========================================
  const container = document.getElementById('sidebar-container');
  if (container) {
    try {
      const res = await fetch('/components/sidebar.html');
      if (res.ok) {
        const html = await res.text();
        container.outerHTML = html;
      }
    } catch (error) {
      console.error('Error cargando sidebar.html:', error);
    }
  }

  //==========================================DETECCIÓN DE ROL BASADO EN #rol-usuario==========================================
  function aplicarFiltroRoles() {
    const elRol = document.getElementById('rol-usuario');
    const links = document.querySelectorAll('.sidebar__link');

    // Intentar obtener el texto del rol desde el DOM (#rol-usuario)
    let textoRol = elRol ? elRol.textContent.trim().toLowerCase() : '';

    // Si aún no ha cargado en el DOM, intentar desde la sesión guardada
    if (!textoRol) {
      const sesionRaw = localStorage.getItem('usuario_session');
      if (sesionRaw) {
        try {
          const usuario = JSON.parse(sesionRaw);
          textoRol = String(usuario.rol || usuario.id_rol || '').toLowerCase().trim();
        } catch (e) {
          console.error('Error al leer la sesión:', e);
        }
      }
    }

    //Mapear el texto a su respectivo ID de Rol
    let idRolDetectado = '';
    if (textoRol.includes('admin')) {
      idRolDetectado = '1';
    } else if (textoRol.includes('tec') || textoRol.includes('téc')) {
      idRolDetectado = '2';
    } else if (textoRol.includes('emp')) {
      idRolDetectado = '3';
    }

    // Ocultar/Mostrar opciones según data-roles
    links.forEach(link => {
      const rolesPermitidos = link.getAttribute('data-roles');

      if (rolesPermitidos && idRolDetectado) {
        const arrayRoles = rolesPermitidos.split(',').map(r => r.trim());

        if (!arrayRoles.includes(idRolDetectado)) {
          link.style.display = 'none';
        } else {
          link.style.display = '';
        }
      }
    });
  }

  //Ejecutar inmediatamente
  aplicarFiltroRoles();

  // Re-ejecutar tras un pequeño delay por si #rol-usuario tarda en cargarse dinámicamente desde el Backend
  setTimeout(aplicarFiltroRoles, 300);

  // ==========================================CONTROL DE PESTAÑA ACTIVA (# O RUTA)==========================================
  const links = document.querySelectorAll('.sidebar__link');

  function actualizarEnlaceActivo() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#')) {
        if (currentHash && href === currentHash) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      } else if (href !== '/') {
        if (currentPath === href) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }

  actualizarEnlaceActivo();

  links.forEach(link => {
    link.addEventListener('click', function () {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        links.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  //==========================================CONTROL RESPONSIVE (MENÚ MÓVIL)==========================================
  const sidebar = document.getElementById('sidebar');
  const btnToggle = document.getElementById('btn-toggle-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (btnToggle && sidebar) {
    btnToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  //==========================================CERRAR SESIÓN EXCLUSIVO (DESTRUYE LA SESIÓN)==========================================
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('usuario_session');
      window.location.replace('/');
    });
  }
});