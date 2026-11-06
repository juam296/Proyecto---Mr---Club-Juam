<?php

class Conexion {
    private $host = "localhost";
    private $baseDatos = "bd_club";
    private $username = "root";
    private $password = "";

    public function conectar()
    {
        $dsn = "mysql:host={$this->host};dbname={$this->baseDatos};charset=utf8mb4";
        
        return new PDO($dsn, $this->username, $this->password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
}
