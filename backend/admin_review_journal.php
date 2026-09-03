<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: admin_review_journal.php
 * Allows the Dean to record reviews, commendations, and feedback on student daily journals.
 */

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

    $journal_id    = isset($data['journal_id']) ? intval($data['journal_id']) : 0;
    $dean_status   = isset($data['dean_status']) ? trim($data['dean_status']) : 'Reviewed';
    $dean_feedback = isset($data['dean_feedback']) ? trim($data['dean_feedback']) : '';

    if ($journal_id <= 0) {
        echo json_encode(["status" => "error", "message" => "Valid Journal ID is required."]);
        exit();
    }

    if (!in_array($dean_status, ['Reviewed', 'Commended', 'Pending'])) {
        $dean_status = 'Reviewed';
    }

    $stmt = $conn->prepare("
        UPDATE daily_journal 
        SET dean_status = ?, dean_feedback = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE journal_id = ?
    ");
    $stmt->bind_param("ssi", $dean_status, $dean_feedback, $journal_id);
    $stmt->execute();

    if ($stmt->affected_rows >= 0) {
        echo json_encode([
            "status"  => "success",
            "message" => "Journal evaluation and feedback saved successfully.",
            "journal_id" => $journal_id,
            "dean_status" => $dean_status
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update journal review."]);
    }
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
