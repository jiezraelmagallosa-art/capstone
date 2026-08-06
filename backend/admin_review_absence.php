<?php
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once 'db_connect.php';

    $raw_input = file_get_contents("php://input");
    $data = json_decode($raw_input, true);

    if (!$data) {
        $data = $_POST;
    }

    $absence_id = isset($data['absence_id']) ? intval($data['absence_id']) : 0;
    $status = isset($data['status']) ? trim($data['status']) : '';
    $remarks = isset($data['remarks']) ? trim($data['remarks']) : '';
    $reviewed_by = isset($data['reviewed_by']) ? intval($data['reviewed_by']) : 1;

    if ($absence_id <= 0 || !in_array($status, ['Approved', 'Rejected'])) {
        echo json_encode(["status" => "error", "message" => "Invalid absence ID or status parameter."]);
        exit();
    }

    $stmt = $conn->prepare("UPDATE absence_requests SET status = ?, remarks = ?, reviewed_by = ? WHERE absence_id = ?");
    $stmt->bind_param("ssii", $status, $remarks, $reviewed_by, $absence_id);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "success",
            "message" => "Absence request has been " . strtolower($status) . " successfully."
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update status: " . $stmt->error]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
