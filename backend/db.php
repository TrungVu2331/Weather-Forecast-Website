<?php
$host = "database-1.ceanzdyu1zcu.us-east-1.rds.amazonaws.com";
$user = "admin";
$pass = "weatherforecast";
$db   = "weatherdb";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>