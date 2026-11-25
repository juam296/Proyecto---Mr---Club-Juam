const listaAsociados = document.getElementById("listaAsociados");
let esAdministrador = false;
let asociados = [];
const formularioAsociados = document.getElementById("formAsociado");
const modalAsociado = new bootstrap.Modal(document.getElementById("modalAsociado"));

async function solicitarApi(metodo, datos) {
    const opciones = {
        method: metodo,
        headers: { "Content-Type": "application/json" }
    };

    if (datos) {
        opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch("../modelos/gestionarAsociado.php", opciones);
    const resultado = await respuesta.json();

    if (respuesta.status === 401) {
        window.location.href = "../vista/login.html";
    }
    if (!respuesta.ok) {
        throw new Error(resultado.message || resultado.mensaje || "Error en la solicitud");
    }
    return resultado;
}

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto ?? "";
    return celda;
}

function mostrarAsociados() {
    listaAsociados.replaceChildren();

    if (asociados.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = esAdministrador ? 6 : 5;
        celda.className = "text-center py-4 text-muted";
        celda.textContent = "No hay asociados disponibles.";
        fila.append(celda);
        listaAsociados.append(fila);
        return;
    }

    asociados.forEach((asociado) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(asociado.nombres),
            crearCelda(asociado.apellidos),
            crearCelda(asociado.documento),
            crearCelda(asociado.email),
            crearCelda(asociado.telefono)
        );

        if (esAdministrador) {
            const acciones = document.createElement("td");
            acciones.className = "text-nowrap";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn btn-sm btn-outline-primary me-2";
            botonEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
            botonEditar.addEventListener("click", () => abrirEdicion(asociado));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "btn btn-sm btn-outline-danger";
            botonEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            botonEliminar.addEventListener("click", () => eliminarAsociado(asociado));

            acciones.append(botonEditar, botonEliminar);
            fila.append(acciones);
        }

        listaAsociados.append(fila);
    });
}

async function cargarAsociados() {
    try {
        const resultado = await solicitarApi("GET");
        esAdministrador = resultado.rol === "admin";
        asociados = resultado.asociados || [];

        const botonNuevo = document.getElementById("nuevoAsociado");
        const encabezadoAcciones = document.getElementById("encabezadoAcciones");
        if (esAdministrador) {
            botonNuevo.classList.remove("d-none");
            encabezadoAcciones.classList.remove("d-none");
            if (!botonNuevo.dataset.configurado) {
                botonNuevo.addEventListener("click", nuevoAsociado);
                botonNuevo.dataset.configurado = "true";
            }
        }

        mostrarAsociados();
    } catch (error) {
        alert("Error al cargar los asociados: " + error.message);
    }
}

async function eliminarAsociado(asociado) {
    if (!window.confirm(`¿Desea eliminar el asociado "${asociado.nombres} ${asociado.apellidos}"?`)) {
        return;
    }

    try {
        await solicitarApi("DELETE", { idAsociado: asociado.idAsociado });
        await cargarAsociados();
        alert("Asociado eliminado correctamente.");
    } catch (error) {
        alert(error.message);
    }
}

function abrirEdicion(asociado) {
    formularioAsociados.reset();
    document.getElementById("idAsociado").value = asociado.idAsociado;
    document.getElementById("nombres").value = asociado.nombres;
    document.getElementById("apellidos").value = asociado.apellidos;
    document.getElementById("documento").value = asociado.documento;
    document.getElementById("email").value = asociado.email;
    document.getElementById("telefono").value = asociado.telefono;
    document.getElementById("tituloModalAsociado").textContent = "Editar asociado";
    document.getElementById("guardarAsociado").textContent = "Guardar cambios";
    modalAsociado.show();
}

function nuevoAsociado() {
    window.location.href = "../vista/registro.html";
}

formularioAsociados.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idAsociado = document.getElementById("idAsociado").value;

    const datos = {
        idAsociado: Number(idAsociado),
        nombres: document.getElementById("nombres").value.trim(),
        apellidos: document.getElementById("apellidos").value.trim(),
        documento: document.getElementById("documento").value.trim(),
        email: document.getElementById("email").value.trim(),
        telefono: document.getElementById("telefono").value.trim()
    };

    try {
        await solicitarApi("PUT", datos);
        modalAsociado.hide();
        await cargarAsociados();
        alert("Asociado actualizado correctamente.");
    } catch (error) {
        alert(error.message);
    }
});

cargarAsociados();
