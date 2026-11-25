<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

function leerDatosAsociado() {
    $datos = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Error al decodificar JSON: " . json_last_error_msg());
    }
    return is_array($datos) ? $datos : [];
}

function validarAsociado($datos) {
    $campos = ['documento', 'nombres', 'apellidos', 'telefono', 'email'];

    foreach ($campos as $campo) {
        if (!isset($datos[$campo]) || !is_string($datos[$campo]) || trim($datos[$campo]) === "") {
            http_response_code(400);
            throw new Exception("El campo {$campo} es obligatorio.");
        }
    }

    if (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        throw new Exception("El email no es valido.");
    }

    return [
        'documento' => trim($datos['documento']),
        'nombres' => trim($datos['nombres']),
        'apellidos' => trim($datos['apellidos']),
        'telefono' => trim($datos['telefono']),
        'email' => trim($datos['email'])
    ];
}

function validarIdAsociado($id) {
    $idAsociado = filter_var($id, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($idAsociado === false) {
        http_response_code(400);
        throw new Exception("El identificador del asociado no es valido.");
    }
    return $idAsociado;
}

try {
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401);
        throw new Exception("Inicia sesion para consultar los asociados.");
    }

    $metodo = $_SERVER["REQUEST_METHOD"];
    if (!in_array($metodo, ["GET", "PUT", "DELETE"], true)) {
        http_response_code(405);
        throw new Exception("Metodo HTTP no permitido.");
    }

    if ($_SESSION["rol"] !== "admin") {
        http_response_code(403);
        throw new Exception("No tienes permisos para realizar esta accion.");
    }

    require_once __DIR__ . "/asociado.php";
    $asociado = new asociado();

    switch ($metodo) {
        case "GET":
            $resultado = [
                "success" => true,
                "rol" => $_SESSION["rol"],
                "asociados" => $asociado->obtenerAsociados()
            ];
            break;

        case "PUT":
            $datosRecibidos = leerDatosAsociado();
            $datos = validarAsociado($datosRecibidos);
            $datos['idAsociado'] = validarIdAsociado($datosRecibidos['idAsociado'] ?? null);

            if (!$asociado->editar($datos)) {
                http_response_code(404);
                throw new Exception("No se encontro el asociado.");
            }
            $resultado = ["success" => true, "mensaje" => "Asociado actualizado correctamente"];
            break;

        case "DELETE":
            $datos = leerDatosAsociado();
            $idAsociado = validarIdAsociado($datos["idAsociado"] ?? null);
            if (!$asociado->eliminar($idAsociado)) {
                http_response_code(404);
                throw new Exception("No se encontro el asociado.");
            }
            $resultado = ["success" => true, "mensaje" => "Asociado eliminado correctamente"];
            break;
    }

    echo json_encode($resultado);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error en la base de datos: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
