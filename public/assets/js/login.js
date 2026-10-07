document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener valores (asegúrate de que los inputs en HTML tengan id="correo" e id="clave")
    const correo = document.getElementById('correo').value.trim();
    const clave = document.getElementById('clave').value.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, clave }) // Coincide exactamente con tu req.body de auth.routes.js
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        //Crear sesión en el navegador guardando el objeto usuario
        localStorage.setItem('usuario', JSON.stringify(data.usuario));

        //Redirije al dashboard
        window.location.href = '/dashboard';
      } else {
        alert(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error de conexión con el servidor');
    }
  });
});