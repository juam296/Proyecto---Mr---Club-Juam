// Lista temporal de usuarios para probar el inicio de sesion.
const usuarios = [
    { usuario: 'admin@gmail.com', clave: '123', rol: 'admin', nombre: 'Admin MR' },
    { usuario: 'pepito@gmail.com', clave: '123', rol: 'asociado', nombre: 'Pepito Perez' }
];

document.getElementById('formLogin').addEventListener('submit', function(e) {
    e.preventDefault();

    const usuarioInput = document.getElementById('usuario').value;
    const contraseñaInput = document.getElementById('contraseña').value;

    const usuarioEncontrado = usuarios.find(
        u => u.usuario === usuarioInput && u.clave === contraseñaInput);
        if (usuarioEncontrado) {
            localStorage.setItem('logeado', true);
            localStorage.setItem('rol', usuarioEncontrado.rol);
            localStorage.setItem('nombre', usuarioEncontrado.nombre);
            window.location.href = 'dashboard.html';
        } else {
            alert('Usuario o contraseña incorrectos');
        }
}); 