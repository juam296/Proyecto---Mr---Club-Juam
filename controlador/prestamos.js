const listaPrestamos = document.getElementById("listaPrestamo");
const formularioPrestamo = document.getElementById("formPrestamo");

let esAdministrador = false;
let prestamos = [];
let asociadoSeleccionadoId = null;
let modalPrestamo = null;

function obtenerModalPrestamo() {
    if (!modalPrestamo) {
        const elementoModal = document.getElementById("modalPrestamo");
        if (!elementoModal || typeof bootstrap === "undefined") {
            return null;
        }
        modalPrestamo = bootstrap.Modal.getOrCreateInstance(elementoModal);
    }
    return modalPrestamo;
}

async function cargarAsociados() {
    if (!esAdministrador) {
        return;
    }

    const respuesta = await fetch("../modelos/gestionarAsociado.php", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
        throw new Error(resultado.message || resultado.mensaje || "Error al cargar asociados.");
    }

    const selector = document.getElementById("asociado");
    selector.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccione un asociado";
    selector.append(opcionInicial);

    (resultado.asociados || []).forEach((asociado) => {
        const opcion = document.createElement("option");
        opcion.value = asociado.idAsociado;
        opcion.textContent = `${asociado.nombres} ${asociado.apellidos}`;
        selector.append(opcion);
    });
}

async function solicitarApi(metodo, datos = null) {
    const opciones = {
        method: metodo,
        headers: { "Content-Type": "application/json" }
    };

    if (datos) {
        opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch("../modelos/prestamos.php", opciones);
    let resultado = {};

    try {
        resultado = await respuesta.json();
    } catch {
        throw new Error("La respuesta del servidor no es válida.");
    }

    if (respuesta.status === 401) {
        window.location.href = "../vista/login.html";
        return;
    }
    if (!respuesta.ok) {
        throw new Error(resultado.message || resultado.mensaje || "Error en la solicitud.");
    }
    return resultado;
}

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto ?? "";
    return celda;
}

function formatearValor(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
        return valor ?? "";
    }
    return numero.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP"
    });
}

function mostrarPrestamos() {
    listaPrestamos.replaceChildren();

    if (prestamos.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = esAdministrador ? 7 : 6;
        celda.className = "text-center py-4 text-muted";
        celda.textContent = "No hay préstamos disponibles.";
        fila.append(celda);
        listaPrestamos.append(fila);
        return;
    }

    prestamos.forEach((prestamo) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(prestamo.asociado ?? prestamo.Asociado),
            crearCelda(formatearValor(prestamo.valorPrestamo ?? prestamo.valor)),
            crearCelda(prestamo.tasaInteres),
            crearCelda(prestamo.numeroCuotas ?? prestamo.cuotas),
            crearCelda(prestamo.fechaPrestamo),
            crearCelda(prestamo.estado)
        );

        if (esAdministrador) {
            const acciones = document.createElement("td");
            acciones.className = "text-nowrap";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn btn-sm btn-outline-primary me-2";
            botonEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
            botonEditar.setAttribute("aria-label", "Editar préstamo");
            botonEditar.addEventListener("click", () => abrirEdicion(prestamo));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "btn btn-sm btn-outline-danger";
            botonEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            botonEliminar.setAttribute("aria-label", "Eliminar préstamo");
            botonEliminar.addEventListener("click", () => eliminarPrestamo(prestamo));

            acciones.append(botonEditar, botonEliminar);
            fila.append(acciones);
        }

        listaPrestamos.append(fila);
    });
}

async function cargarPrestamos() {
    try {
        const resultado = await solicitarApi("GET");
        esAdministrador = resultado.rol === "admin";
        prestamos = resultado.prestamos || resultado.prestamo || [];
        await cargarAsociados();

        const botonNuevo = document.getElementById("nuevoPrestamo");
        const encabezadoAcciones = document.getElementById("encabezadoAcciones");
        if (esAdministrador) {
            botonNuevo.classList.remove("d-none");
            encabezadoAcciones.classList.remove("d-none");
            if (!botonNuevo.dataset.configurado) {
                botonNuevo.addEventListener("click", nuevoPrestamo);
                botonNuevo.dataset.configurado = "true";
            }
        }

        mostrarPrestamos();
    } catch (error) {
        listaPrestamos.replaceChildren();
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.className = "text-center py-4 text-danger";
        celda.textContent = error.message;
        fila.append(celda);
        listaPrestamos.append(fila);
    }
}

function nuevoPrestamo() {
    formularioPrestamo.reset();
    asociadoSeleccionadoId = null;
    document.getElementById("idPrestamo").value = "";
    document.getElementById("tituloModalPrestamo").textContent = "Nuevo préstamo";
    document.getElementById("guardarPrestamo").textContent = "Guardar préstamo";
    obtenerModalPrestamo()?.show();
}

function abrirEdicion(prestamo) {
    formularioPrestamo.reset();
    asociadoSeleccionadoId = prestamo.idAsociado ?? null;
    document.getElementById("idPrestamo").value = prestamo.idPrestamo ?? "";
    document.getElementById("asociado").value = prestamo.idAsociado ?? "";
    document.getElementById("valorPrestamo").value = prestamo.valorPrestamo ?? prestamo.valor ?? "";
    document.getElementById("tasaInteres").value = prestamo.tasaInteres ?? "";
    document.getElementById("numeroCuotas").value = prestamo.numeroCuotas ?? prestamo.cuotas ?? "";
    document.getElementById("fechaPrestamo").value = prestamo.fechaPrestamo ?? "";
    document.getElementById("estado").value = prestamo.estado ?? "Pendiente";
    document.getElementById("tituloModalPrestamo").textContent = "Editar préstamo";
    document.getElementById("guardarPrestamo").textContent = "Guardar cambios";
    obtenerModalPrestamo()?.show();
}

async function eliminarPrestamo(prestamo) {
    const asociado = prestamo.asociado ?? prestamo.Asociado ?? "este asociado";
    if (!window.confirm(`¿Desea eliminar el préstamo de "${asociado}"?`)) {
        return;
    }

    try {
        await solicitarApi("DELETE", { idPrestamo: prestamo.idPrestamo });
        await cargarPrestamos();
        alert("Préstamo eliminado correctamente.");
    } catch (error) {
        alert(error.message);
    }
}

formularioPrestamo.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idPrestamo = document.getElementById("idPrestamo").value;
    const idAsociado = Number(document.getElementById("asociado").value);
    const datos = {
        idAsociado: idAsociado || null,
        valorPrestamo: Number(document.getElementById("valorPrestamo").value),
        tasaInteres: Number(document.getElementById("tasaInteres").value),
        numeroCuotas: Number(document.getElementById("numeroCuotas").value),
        fechaPrestamo: document.getElementById("fechaPrestamo").value,
        estado: document.getElementById("estado").value
    };

    if (idPrestamo) {
        datos.idPrestamo = Number(idPrestamo);
    }

    try {
        await solicitarApi(idPrestamo ? "PUT" : "POST", datos);
        obtenerModalPrestamo()?.hide();
        await cargarPrestamos();
        alert(idPrestamo ? "Préstamo actualizado correctamente." : "Préstamo creado correctamente.");
    } catch (error) {
        alert(error.message);
    }
});

cargarPrestamos();
