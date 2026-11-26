<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/conexion.php';

class Prestamo
{
    private $conexion;

    public function __construct()
    {
        $conexionDB = new Conexion();
        $this->conexion = $conexionDB->conectar();
    }

    public function obtenerPrestamos()
    {
        $sql = "SELECT p.idPrestamo,
               p.idAsociado,
                       CONCAT(a.nombres, ' ', a.apellidos) AS asociado,
                       p.valorPrestamo,
                       p.tasaInteres,
                       p.numeroCuotas,
                       p.fechaPrestamo,
                       p.estado
                FROM prestamos p
                INNER JOIN asociados a ON a.idAsociado = p.idAsociado
                ORDER BY p.fechaPrestamo DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll(PDO::FETCH_ASSOC);
    }

    public function guardar($datos)
    {
        $sql = "INSERT INTO prestamos
                    (idAsociado, valorPrestamo, tasaInteres, numeroCuotas, fechaPrestamo, estado)
                VALUES
                    (:idAsociado, :valorPrestamo, :tasaInteres, :numeroCuotas, :fechaPrestamo, :estado)";
        $consulta = $this->conexion->prepare($sql);
        return $consulta->execute([
            ':idAsociado' => $datos['idAsociado'],
            ':valorPrestamo' => $datos['valorPrestamo'],
            ':tasaInteres' => $datos['tasaInteres'],
            ':numeroCuotas' => $datos['numeroCuotas'],
            ':fechaPrestamo' => $datos['fechaPrestamo'],
            ':estado' => $datos['estado']
        ]);
    }

    public function editar($datos)
    {
        $sql = "UPDATE prestamos
                SET idAsociado = :idAsociado,
                    valorPrestamo = :valorPrestamo,
                    tasaInteres = :tasaInteres,
                    numeroCuotas = :numeroCuotas,
                    fechaPrestamo = :fechaPrestamo,
                    estado = :estado
                WHERE idPrestamo = :idPrestamo";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':idPrestamo' => $datos['idPrestamo'],
            ':idAsociado' => $datos['idAsociado'],
            ':valorPrestamo' => $datos['valorPrestamo'],
            ':tasaInteres' => $datos['tasaInteres'],
            ':numeroCuotas' => $datos['numeroCuotas'],
            ':fechaPrestamo' => $datos['fechaPrestamo'],
            ':estado' => $datos['estado']
        ]);

        if ($consulta->rowCount() > 0) {
            return true;
        }

        $verificar = $this->conexion->prepare(
            "SELECT 1 FROM prestamos WHERE idPrestamo = :idPrestamo"
        );
        $verificar->execute([':idPrestamo' => $datos['idPrestamo']]);
        return (bool) $verificar->fetchColumn();
    }

    public function eliminar($idPrestamo)
    {
        $sql = "DELETE FROM prestamos WHERE idPrestamo = :idPrestamo";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idPrestamo' => $idPrestamo]);
        return $consulta->rowCount() > 0;
    }

    public function buscarAsociadoPorNombre($nombre)
    {
        $sql = "SELECT idAsociado
                FROM asociados
                WHERE CONCAT(nombres, ' ', apellidos) LIKE :nombre
                   OR nombres LIKE :nombre
                   OR apellidos LIKE :nombre
                ORDER BY nombres, apellidos
                LIMIT 1";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':nombre' => '%' . $nombre . '%']);
        $resultado = $consulta->fetch(PDO::FETCH_ASSOC);
        return $resultado['idAsociado'] ?? null;
    }

    public function existeAsociado($idAsociado)
    {
        $sql = "SELECT 1 FROM asociados WHERE idAsociado = :idAsociado";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idAsociado' => $idAsociado]);
        return (bool) $consulta->fetchColumn();
    }
}

function leerDatos()
{
    $datos = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception('Error al decodificar JSON: ' . json_last_error_msg());
    }
    return is_array($datos) ? $datos : [];
}

function validarId($id)
{
    $idValido = filter_var(
        $id,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($idValido === false) {
        http_response_code(400);
        throw new Exception('El identificador del préstamo no es válido.');
    }
    return $idValido;
}

function validarPrestamo($datos)
{
    $idAsociado = filter_var(
        $datos['idAsociado'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    $valorPrestamo = filter_var(
        $datos['valorPrestamo'] ?? null,
        FILTER_VALIDATE_FLOAT
    );
    $tasaInteres = filter_var(
        $datos['tasaInteres'] ?? null,
        FILTER_VALIDATE_FLOAT
    );
    $numeroCuotas = filter_var(
        $datos['numeroCuotas'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    $fechaPrestamo = trim((string) ($datos['fechaPrestamo'] ?? ''));
    $estado = trim((string) ($datos['estado'] ?? ''));

    if ($idAsociado === false || $idAsociado === null) {
        http_response_code(400);
        throw new Exception('El asociado es obligatorio.');
    }
    if ($valorPrestamo === false || $valorPrestamo <= 0) {
        http_response_code(400);
        throw new Exception('El valor del préstamo no es válido.');
    }
    if ($tasaInteres === false || $tasaInteres < 0) {
        http_response_code(400);
        throw new Exception('La tasa de interés no es válida.');
    }
    if ($numeroCuotas === false || $numeroCuotas === null) {
        http_response_code(400);
        throw new Exception('El número de cuotas no es válido.');
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaPrestamo)) {
        http_response_code(400);
        throw new Exception('La fecha del préstamo no es válida.');
    }
    $partesFecha = explode('-', $fechaPrestamo);
    if (!checkdate((int) $partesFecha[1], (int) $partesFecha[2], (int) $partesFecha[0])) {
        http_response_code(400);
        throw new Exception('La fecha del préstamo no es válida.');
    }

    $estadosPermitidos = ['Pendiente', 'Pagado', 'En mora'];
    if (!in_array($estado, $estadosPermitidos, true)) {
        http_response_code(400);
        throw new Exception('El estado del préstamo no es válido.');
    }

    return [
        'idPrestamo' => isset($datos['idPrestamo'])
            ? $datos['idPrestamo']
            : null,
        'idAsociado' => $idAsociado === false ? null : $idAsociado,
        'valorPrestamo' => $valorPrestamo,
        'tasaInteres' => $tasaInteres,
        'numeroCuotas' => $numeroCuotas,
        'fechaPrestamo' => $fechaPrestamo,
        'estado' => $estado
    ];
}

try {
    if (!isset($_SESSION['documento'], $_SESSION['rol'])) {
        http_response_code(401);
        throw new Exception('Inicia sesión para consultar los préstamos.');
    }

    $metodo = $_SERVER['REQUEST_METHOD'];
    if (!in_array($metodo, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
        http_response_code(405);
        throw new Exception('Método HTTP no permitido.');
    }

    if ($metodo !== 'GET' && $_SESSION['rol'] !== 'admin') {
        http_response_code(403);
        throw new Exception('No tienes permisos para realizar esta acción.');
    }

    $prestamo = new Prestamo();

    switch ($metodo) {
        case 'GET':
            $resultado = [
                'success' => true,
                'rol' => $_SESSION['rol'],
                'prestamos' => $prestamo->obtenerPrestamos()
            ];
            break;

        case 'POST':
        case 'PUT':
            $datos = validarPrestamo(leerDatos());
            if (!$prestamo->existeAsociado($datos['idAsociado'])) {
                http_response_code(400);
                throw new Exception('El asociado seleccionado no existe.');
            }

            if ($metodo === 'POST') {
                $prestamo->guardar($datos);
                $resultado = [
                    'success' => true,
                    'mensaje' => 'Préstamo creado correctamente.'
                ];
                http_response_code(201);
            } else {
                $datos['idPrestamo'] = validarId($datos['idPrestamo'] ?? null);
                if (!$prestamo->editar($datos)) {
                    http_response_code(404);
                    throw new Exception('No se encontró el préstamo.');
                }
                $resultado = [
                    'success' => true,
                    'mensaje' => 'Préstamo actualizado correctamente.'
                ];
            }
            break;

        case 'DELETE':
            $datos = leerDatos();
            $idPrestamo = validarId($datos['idPrestamo'] ?? null);
            if (!$prestamo->eliminar($idPrestamo)) {
                http_response_code(404);
                throw new Exception('No se encontró el préstamo.');
            }
            $resultado = [
                'success' => true,
                'mensaje' => 'Préstamo eliminado correctamente.'
            ];
            break;
    }

    echo json_encode($resultado);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
