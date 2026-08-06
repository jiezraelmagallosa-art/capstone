<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: get_attendance_history.php
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


$param_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : (isset($_GET['ojt_id']) ? intval($_GET['ojt_id']) : 0);

if ($param_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "OJT ID / Student ID is required."
    ]);
    exit();
}


$query = "SELECT DISTINCT
            a.attendance_id,
            a.date,
            a.time_in_morning,
            a.time_out_morning,
            a.time_in_afternoon,
            a.time_out_afternoon
          FROM attendance a
          LEFT JOIN ojt o ON a.ojt_id = o.ojt_id
          WHERE a.ojt_id = ? OR o.student_id = ? OR a.ojt_id IN (SELECT ojt_id FROM ojt WHERE student_id = ?)
          ORDER BY a.date DESC, a.attendance_id DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param("iii", $param_id, $param_id, $param_id);
$stmt->execute();
$result = $stmt->get_result();

$history = [];

while ($row = $result->fetch_assoc()) {
    $status = "Present";
    if (empty($row['time_in_morning']) && empty($row['time_in_afternoon'])) {
        $status = "Absent";
    }

    $history[] = [
        "id" => $row['attendance_id'],
        "date" => date("M d, Y", strtotime($row['date'])),
        "raw_date" => $row['date'],
        "time_in_morning" => !empty($row['time_in_morning']) ? date("h:i A", strtotime($row['time_in_morning'])) : '--:--',
        "time_out_morning" => !empty($row['time_out_morning']) ? date("h:i A", strtotime($row['time_out_morning'])) : '--:--',
        "time_in_afternoon" => !empty($row['time_in_afternoon']) ? date("h:i A", strtotime($row['time_in_afternoon'])) : '--:--',
        "time_out_afternoon" => !empty($row['time_out_afternoon']) ? date("h:i A", strtotime($row['time_out_afternoon'])) : '--:--',
        "status" => $status
    ];
}

echo json_encode([
    "status" => "success",
    "data" => $history
]);

$stmt->close();
$conn->close();
?>