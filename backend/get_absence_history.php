<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: get_absence_history.php
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

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;

if ($student_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Student ID is required."]);
    exit();
}

$query = "SELECT absence_id, date_absent, reason, supporting_document, status, remarks, created_at
          FROM absence_requests
          WHERE student_id = ?
          ORDER BY date_absent DESC, absence_id DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$requests = [];
while ($row = $result->fetch_assoc()) {
    $requests[] = [
        "absence_id" => $row['absence_id'],
        "date_absent" => date("M d, Y", strtotime($row['date_absent'])),
        "raw_date" => $row['date_absent'],
        "reason" => $row['reason'],
        "supporting_document" => $row['supporting_document'],
        "status" => $row['status'],
        "remarks" => $row['remarks'] ?? 'No remarks',
        "created_at" => date("Y-m-d H:i", strtotime($row['created_at']))
    ];
}

echo json_encode([
    "status" => "success",
    "data" => $requests
]);

$stmt->close();
$conn->close();
?>