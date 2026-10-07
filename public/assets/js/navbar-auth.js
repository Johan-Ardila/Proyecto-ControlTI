document.addEventListener('DOMContentLoaded', () => {
  verificarNavbarSesion();
});

function verificarNavbarSesion() {
  //Buscamos el contenedor donde está el botón de acceso en tu HTML
  const navContainer = document.querySelector('.nav__list') || document.querySelector('.nav');
  if (!navContainer) return;

  const sesionRaw = localStorage.getItem('usuario_session');

  //Buscamos si ya existe un elemento previo para auth para evitar duplicados
  let authItem = document.getElementById('nav-auth-item');

  if (sesionRaw) {
    try {
      const usuario = JSON.parse(sesionRaw);

      //Si no existe el elemento de auth en la lista, lo creamos como un item de la lista de navegación
      if (!authItem) {
        authItem = document.createElement('li');
        authItem.id = 'nav-auth-item';
        authItem.className = 'dropdown__item'; // Usamos la clase dropdown ya existente en tu CSS
        navContainer.appendChild(authItem);
      }

      //Estructura del menú con las clases de tu CSS
      authItem.innerHTML = `
        <a class="nav__link">
          <i class="ri-user-3-fill"></i> ${usuario.nombre} 
          <i class="ri-arrow-down-s-line dropdown__arrow"></i>
        </a>
        <div class="dropdown__menu" style="right: 0; left: auto; min-width: 180px;">
          <a href="/mis-solicitudes" class="dropdown__link">
            <i class="ri-dashboard-line"></i> Dashboard
          </a>
          <a onclick="cerrarSesion()" class="dropdown__link" style="color: #ff6b6b; cursor: pointer;">
            <i class="ri-logout-box-line"></i> Cerrar Sesión
          </a>
        </div>
      `;

    } catch (e) {
      console.error('Error al leer la sesión en la navbar:', e);
    }
  } else {
    //Si no hay sesión, dejamos o restauramos el botón de acceso estándar
    if (!authItem) {
      authItem = document.createElement('li');
      authItem.id = 'nav-auth-item';
      authItem.className = 'nav__item';
      navContainer.appendChild(authItem);
    }
    
    authItem.innerHTML = `
      <a href="/login" class="nav__link">
        <i class="ri-user-line"></i> Acceso
      </a>
    `;
  }
}

//Función global para cerrar sesión (Destruye toda la sesión iniciada anteriormente)
function cerrarSesion() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    localStorage.removeItem('usuario_session');
    window.location.href = '/'; // Vuelve a la página de inicio como invitado
  }
}