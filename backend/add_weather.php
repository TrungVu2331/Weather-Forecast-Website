<?php
include "db.php";

$city = $_POST['city'] ?? null;
$temp = $_POST['temperature'] ?? null;
$hum  = $_POST['humidity'] ?? null;
$desc = $_POST['description'] ?? null;

if (!$city || !$temp || !$hum) {
    http_response_code(400);
    echo "Missing data";
    exit;
}

$sql = "INSERT INTO weather (city, temperature, humidity, description)
        VALUES (?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sdis", $city, $temp, $hum, $desc);

if ($stmt->execute()) {
    echo "Saved to Amazon RDS";
} else {
    echo "Error: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>