document.addEventListener('DOMContentLoaded', () => {
    const logeado = localStorage.getItem('logeado');
    if (logeado !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    const nombre = localStorage.getItem('nombre');
    const rol = localStorage.getItem('rol');
    
    const labelUsuario = document.getElementById('nombreUsuario');
    if(labelUsuario) labelUsuario.textContent = nombre;

    if (rol === 'admin') {
        document.getElementById('tarjetasAdmin').classList.remove('d-none');
        document.getElementById('tarjetasAsociado').classList.add('d-none');
    } else if (rol === 'asociado') {
        document.getElementById('tarjetasAdmin').classList.add('d-none');
        document.getElementById('tarjetasAsociado').classList.remove('d-none');
    }

    // Funcionalidad extra para el botón de cerrar sesión
    const btnCerrar = document.getElementById('btnCerrar');
    if(btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
});