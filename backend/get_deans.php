<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: get_deans.php
 */

ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle CORS preflight options request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connect to MySQL database
require_once 'db_connect.php';

try {
    $sql = "SELECT user_id, full_name, email, role FROM users ORDER BY full_name ASC";
    $result = $conn->query($sql);

    $deans = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $deans[] = [
                "user_id" => intval($row['user_id']),
                "full_name" => $row['full_name'],
                "email" => $row['email'],
                "role" => $row['role'],
                "display_name" => "{$row['full_name']} ({$row['email']})"
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $deans
    ]);

    $conn->close();
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
