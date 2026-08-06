<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: get_dashboard_summary.php
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


$conn->query("UPDATE ojt SET required_hours = 480 WHERE required_hours = 600 OR required_hours IS NULL");


$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : (isset($_GET['ojt_id']) ? intval($_GET['ojt_id']) : 0);

if ($student_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Student ID / OJT ID is required."
    ]);
    exit();
}


$ojt_id = $student_id;
$target_hours = 480;

$stmt_ojt = $conn->prepare("SELECT ojt_id, required_hours FROM ojt WHERE student_id = ? OR ojt_id = ? LIMIT 1");
if ($stmt_ojt) {
    $stmt_ojt->bind_param("ii", $student_id, $student_id);
    $stmt_ojt->execute();
    $res_ojt = $stmt_ojt->get_result();
    if ($row_ojt = $res_ojt->fetch_assoc()) {
        $ojt_id = $row_ojt['ojt_id'];
        $req_h = intval($row_ojt['required_hours']);
        $target_hours = ($req_h > 0 && $req_h != 600) ? $req_h : 480;
    }
    $stmt_ojt->close();
}

$morning_min = "CASE WHEN a.time_in_morning IS NOT NULL AND a.time_out_morning IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, a.time_in_morning, a.time_out_morning) ELSE 0 END";
$afternoon_min = "CASE WHEN a.time_in_afternoon IS NOT NULL AND a.time_out_afternoon IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, a.time_in_afternoon, a.time_out_afternoon) ELSE 0 END";

$query = "SELECT
            SUM($morning_min + $afternoon_min) as total_minutes,
            COUNT(DISTINCT DATE(a.date)) as total_days
          FROM attendance a
          LEFT JOIN ojt o ON a.ojt_id = o.ojt_id
          WHERE a.ojt_id = ? OR o.student_id = ? OR a.ojt_id IN (SELECT ojt_id FROM ojt WHERE student_id = ?)";

$stmt = $conn->prepare($query);
$stmt->bind_param("iii", $ojt_id, $student_id, $student_id);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();

$total_minutes = intval($result['total_minutes'] ?? 0);
$total_hours = floor($total_minutes / 60);
$consumed_mins = $total_minutes % 60;

$target_total_minutes = $target_hours * 60;
$remaining_total_minutes = max(0, $target_total_minutes - $total_minutes);
$remaining_hours = floor($remaining_total_minutes / 60);
$remaining_mins = $remaining_total_minutes % 60;

$progress_percentage = min(100.0, round(($total_minutes / $target_total_minutes) * 100, 1));

echo json_encode([
    "status" => "success",
    "data" => [
        "target_hours" => $target_hours,
        "total_hours" => $total_hours,
        "consumed_minutes" => $total_minutes,
        "remaining_minutes" => $consumed_mins,
        "formatted_time" => "{$total_hours} hrs {$consumed_mins} mins",
        "formatted_consumed_of_target" => "{$total_hours} hrs {$consumed_mins} mins / {$target_hours} hrs",
        "remaining_hours" => $remaining_hours,
        "remaining_mins" => $remaining_mins,
        "formatted_remaining" => "{$remaining_hours} hrs {$remaining_mins} mins left",
        "progress_percentage" => $progress_percentage,
        "total_days" => intval($result['total_days'] ?? 0)
    ]
]);

$stmt->close();
$conn->close();
?>