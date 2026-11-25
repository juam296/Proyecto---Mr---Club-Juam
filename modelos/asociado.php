<?php
require_once __DIR__ . '/../config/conexion.php';

class asociado {
    private $documento;
    private $nombres;
    private $apellidos;
    private $fechaNacimiento;
    private $genero;
    private $direccionResidencia;
    private $ciudad;
    private $telefono;
    private $email;
    private $contraseña;

    private $conexion;

    public function __construct($datos = []){
        $this->documento = $datos['documento'] ?? null;
        $this->nombres = $datos['nombres'] ?? null;
        $this->apellidos = $datos['apellidos'] ?? null;
        $this->fechaNacimiento = $datos['fechaNacimiento'] ?? null;
        $this->genero = $datos['genero'] ?? null;
        $this->direccionResidencia = $datos['direccionResidencia'] ?? null;
        $this->ciudad = $datos['ciudad'] ?? null;
        $this->telefono = $datos['telefono'] ?? null;
        $this->email = $datos['email'] ?? null;
        $this->contraseña = isset($datos['contraseña'])
            ? password_hash($datos['contraseña'], PASSWORD_DEFAULT)
            : null;

        $conexionDB = new Conexion();
        $this->conexion = $conexionDB->conectar();
    }

    public function guardar() {
        $sql = "INSERT INTO asociados (documento, nombres, apellidos, fechaNacimiento, genero, direccionResidencia, ciudad, telefono, email, contraseña) VALUES (:documento, :nombres, :apellidos, :fechaNacimiento, :genero, :direccionResidencia, :ciudad, :telefono, :email, :contrasena)";
        $consulta= $this->conexion->prepare($sql);
        return $consulta->execute([
            ':documento' => $this->documento,
            ':nombres' => $this->nombres,
            ':apellidos' => $this->apellidos,
            ':fechaNacimiento' => $this->fechaNacimiento,
            ':genero' => $this->genero,
            ':direccionResidencia' => $this->direccionResidencia,
            ':ciudad' => $this->ciudad,
            ':telefono' => $this->telefono,
            ':email' => $this->email,
            ':contrasena' => $this->contraseña
        ]);
    }

    public function obtenerAsociados() {
        $sql = "SELECT idAsociado, documento, nombres, apellidos, telefono, email FROM asociados ORDER BY nombres ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll(PDO::FETCH_ASSOC);
    }

    public function editar($datos) {
        $sql = "UPDATE asociados
                SET documento = :documento, nombres = :nombres, apellidos = :apellidos,
                    telefono = :telefono, email = :email
                WHERE idAsociado = :idAsociado";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':idAsociado' => $datos['idAsociado'],
            ':documento' => $datos['documento'],
            ':nombres' => $datos['nombres'],
            ':apellidos' => $datos['apellidos'],
            ':telefono' => $datos['telefono'],
            ':email' => $datos['email']
        ]);

        if ($consulta->rowCount() > 0) {
            return true;
        }

        $verificar = $this->conexion->prepare("SELECT 1 FROM asociados WHERE idAsociado = :idAsociado");
        $verificar->execute([':idAsociado' => $datos['idAsociado']]);
        return (bool) $verificar->fetchColumn();
    }

    public function eliminar($idAsociado) {
        $sql = "DELETE FROM asociados WHERE idAsociado = :idAsociado";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idAsociado' => $idAsociado]);
        return $consulta->rowCount() > 0;
    }
}