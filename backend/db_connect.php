<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: db_connect.php
 */

date_default_timezone_set('Asia/Manila');

$host = "localhost";
$username = "root";
$password = "";
$database = "sbc_internship_db";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit();
}

$conn->query("SET time_zone = '+08:00';");

$conn->set_charset("utf8mb4");

$col_check = $conn->query("SHOW COLUMNS FROM student LIKE 'dean_id'");
if ($col_check && $col_check->num_rows == 0) {
    @$conn->query("ALTER TABLE student ADD COLUMN dean_id INT NULL AFTER course_id");
    @$conn->query("ALTER TABLE student ADD CONSTRAINT fk_student_dean FOREIGN KEY (dean_id) REFERENCES users(user_id) ON DELETE SET NULL");

    $dean_res = $conn->query("SELECT user_id FROM users WHERE role IN ('Dean', 'Admin') ORDER BY user_id ASC LIMIT 1");
    if ($dean_res && $dean_res->num_rows > 0) {
        $def_dean_id = intval($dean_res->fetch_assoc()['user_id']);
        @$conn->query("UPDATE student SET dean_id = $def_dean_id WHERE dean_id IS NULL");
    }
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight options request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>