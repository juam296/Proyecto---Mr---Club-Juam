const listaActividades = document.getElementById("listaActividades");
let esAdministrador = false;
let actividades=[];
let accionesConfiguradas = false;
async function solicitarApi(metodo,datos){
    const opciones={
        method: metodo,
        headers: {'Content-Type': 'application/json'},
    }

    if (datos){
        opciones.body = JSON.stringify(datos);
    }
    
    const respuesta = await fetch("../modelos/gestionarActividades.php",opciones);
    const resultado = await respuesta.json();
    
    if (respuesta.status === 401) {
        window.location.href = "login.html";
    }
    
    if (respuesta.ok || !resultado.success) {
        throw new Error(resultado.mensaje || 'Error en la solicitud');
    }

    return resultado;
}

async function cargarActividades() {
    try {
        const resultado = await solicitarApi ("GET");

        esAdministrador = resultado.rol === "Admin";
        configuracionesAcciones();
        actividades =resultado.actividades;
        mostrarActividades();
    } catch (error) {
        alert("Error al cargar la actividades: " + error.message);
    }
}
function mostrarActividades () {
    listaActividades.replaceChildren();

    if (actividades.length === 0) {
        const fila = document.createElemnt("tr");
        const celda = document.createElement("td");
        celda.colSpan = esAdministrador ? 5 : 4;
        celda.className = "text-center py-4 text-muted";
        celda.textContent = "No hay actividades disponibles.";
        fila.append(celda);
        listaActividades.append(fila);
        return;
    }

    actividades.forEach((actividad) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(actividad.nombreActividad),
            crearCelda(actividad.fechaEvento),
            crearCelda(actividad.municipio),
            crearCelda(actividad.totalRecaudado===null?"Pendiente":Number(actividad.totalRecaudado).toLocaleString("es-CO", { style: "currency", currency: "COP"})),
        );
        if(esAdministrador) {
            const acciones = document.createElement("td");
            acciones.className="text-nowrap";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn btn-sm btn-outline-primary me-2";
            botonEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            botonEditar.addEventListener("click", () => abrirEdicion(actividad));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "btn btn-sm btn-outline-danger";
            botonEliminar.innerHTML = '<i class="bi bi-trash2-fill"></i>';
            botonEliminar.addEventListener("click", () => eliminarActividad(actividad));

            acciones.append(botonEditar, botonEliminar);
            fila.append(acciones);
        }
        listaActividades.append(fila);
        });
    
}

function crearCelda(texto){
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}

async function eliminarActividad(actividad) {
    const confrimar = window.confirm(` ¿Deseas eliminar la actividad? "${actividad.nombreActividad}"?`,);

    if (!confrimar) {
        return
    }

    try {
        await solicitarApi("DELETE",{idActividad:actividad.idActividad});
        await cargarActividades();
        alert("Actividad eliminada correctamente");
    } catch(error) {
        alert(error.message);
    }
}

async function configurarAcciones () {
    if (accionesConfiguradas) {
        return;
    } 
    const botonNueva = document.getElementById("nuevaActividad");
    const encabezadoAcciones = document.getElementById("encabezadoAcciones");

    if (esAdministrador) {
        botonNueva.classList.remove("d-none");
        encabezadoAcciones.classList.remove("d-none");
        accionesConfiguradas = true; 
        return;
    }
} 

cargarActividades();    