<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/asociado.php';

try{
    if($_SERVER['REQUEST_METHOD'] !== 'POST'){
        http_response_code(405);

        // Saltar a catch y mostrar el mensaje de error
        throw new Exception("Método HTTP no permitido.");
    }
    // Leer el contenido JSON de la solicitud enviada por fetch
    $json = file_get_contents('php://input');

    // Leer el JSON y convertirlo en un array asociativo 
    $datos = json_decode($json, true);

    if(!is_array($datos) || json_last_error() !== JSON_ERROR_NONE){
        http_response_code(400);
        throw new Exception("Datos inválidos.");
    }

    $campos=['documento', 'nombres', 'apellidos', 'fechaNacimiento', 'genero', 'direccionResidencia', 'ciudad', 'telefono', 'email', 'contraseña'];
    foreach($campos as $campo){
        if(!isset($datos[$campo])){
            http_response_code(400);
            throw new Exception("Falta el campo requerido:" . $campo);
        }
    }

    if(!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)){
        http_response_code(400);
        throw new Exception("Email inválido.");
    }

    $asociado = new asociado($datos);

    $resultado = $asociado->guardar();

    if($resultado){
        http_response_code(201);
        echo json_encode(["success"=> true, 'mensaje' => 'Asociado guardado exitosamente.']);
    }else{
        http_response_code(500);
        echo json_encode(["success"=> false, 'mensaje' => 'Error al guardar el asociado.']);
    }

    }catch(PDOException $e) {
        if($e->getCode() == 23000){
            http_response_code(409);
            echo json_encode(["success"=> false, 'mensaje' => 'El documento ya está registrado.']);
        }else{
            http_response_code(500);
            echo json_encode(["success"=> false, 'mensaje' => 'Error de base de datos: ' . $e->getMessage()]);
        }
    }catch (Exception $e) {
    echo json_encode(["success"=> false, 'mensaje' => $e->getMessage()]);
}
