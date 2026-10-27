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

    function cerrarSesion() {
        localStorage.clear();
        window.location.href = '../vista/login.html';
    }
});