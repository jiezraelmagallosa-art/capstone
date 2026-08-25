<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: db_connect.php
 */

date_default_timezone_set('Asia/Manila');

// Database configuration (supports environment variables or local XAMPP defaults)
$host     = getenv('DB_HOST') ?: "localhost";
$username = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";
$database = getenv('DB_NAME') ?: "sbc_internship_db";
$port     = getenv('DB_PORT') ? intval(getenv('DB_PORT')) : 3306;

$conn = @new mysqli($host, $username, $password, $database, $port);

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

// Auto-migrate column 'required_hours' on Course table if not present
$col_course_hours = $conn->query("SHOW COLUMNS FROM course LIKE 'required_hours'");
if ($col_course_hours && $col_course_hours->num_rows == 0) {
    @$conn->query("ALTER TABLE course ADD COLUMN required_hours INT DEFAULT 480 AFTER course_name");
    @$conn->query("UPDATE course SET required_hours = 480 WHERE required_hours IS NULL OR required_hours = 0");
}

// Auto-seed required courses (BSCS, BSIS, BLIS) if not present
$course_check = $conn->query("SELECT COUNT(*) as cnt FROM course");
if ($course_check) {
    $c_cnt = intval($course_check->fetch_assoc()['cnt'] ?? 0);
    if ($c_cnt < 3) {
        $conn->query("INSERT IGNORE INTO course (course_code, course_name, required_hours) VALUES
            ('BSCS', 'Bachelor of Science in Computer Science', 480),
            ('BSIS', 'Bachelor of Science in Information Systems', 480),
            ('BLIS', 'Bachelor of Library and Information Science', 480)");
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