<?php
/**
 * SBC Internship Attendance System - Database Connection
 * All backend files require this. Edit config.php to change settings.
 */

// Load centralized configuration
require_once __DIR__ . '/config.php';

date_default_timezone_set(APP_TIMEZONE);

$host     = DB_HOST;
$username = DB_USER;
$password = DB_PASS;
$database = DB_NAME;
$port     = DB_PORT;

$conn = @new mysqli($host, $username, $password, $database, $port);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Database connection failed. Please check server configuration."
    ]);
    exit();
}

$conn->query("SET time_zone = '+08:00';");
$conn->set_charset("utf8mb4");

// Auto-migrate: add dean_id to student if missing
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

// Auto-migrate: add required_hours to Course if missing
$col_course_hours = $conn->query("SHOW COLUMNS FROM course LIKE 'required_hours'");
if ($col_course_hours && $col_course_hours->num_rows == 0) {
    @$conn->query("ALTER TABLE course ADD COLUMN required_hours INT DEFAULT 480 AFTER course_name");
    @$conn->query("UPDATE course SET required_hours = 480 WHERE required_hours IS NULL OR required_hours = 0");
}

// Auto-seed required courses if fewer than 3 exist
$course_check = $conn->query("SELECT COUNT(*) as cnt FROM course");
if ($course_check) {
    $c_cnt = intval($course_check->fetch_assoc()['cnt'] ?? 0);
    if ($c_cnt < 3) {
        $conn->query("INSERT IGNORE INTO course (course_code, course_name, required_hours) VALUES
            ('BSCS', 'Bachelor of Science in Computer Science', " . DEFAULT_REQUIRED_HOURS . "),
            ('BSIS', 'Bachelor of Science in Information Systems', " . DEFAULT_REQUIRED_HOURS . "),
            ('BLIS', 'Bachelor of Library and Information Science', " . DEFAULT_REQUIRED_HOURS . ")");
    }
}

// Dynamic base URL helper — resolves correct host/domain automatically on any server
if (!function_exists('get_system_base_url')) {
    function get_system_base_url() {
        $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        $protocol = $is_https ? "https://" : "http://";
        $host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $script_dir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
        $app_dir  = preg_replace('#/backend$#', '', str_replace('\\', '/', $script_dir));
        return rtrim($protocol . $host . $app_dir, '/') . '/';
    }
}

// CORS — reads from config.php (CORS_ORIGIN constant)
$cors_origin = defined('CORS_ORIGIN') ? CORS_ORIGIN : '*';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . $cors_origin);
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>