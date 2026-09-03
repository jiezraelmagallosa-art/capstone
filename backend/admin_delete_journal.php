<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: admin_delete_journal.php
 * Handles permanent database deletion of single or multiple daily student journals by Dean.
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

    $action     = isset($data['action']) ? trim($data['action']) : 'delete_one';
    $journal_id = isset($data['journal_id']) ? intval($data['journal_id']) : 0;
    $dean_id    = isset($data['dean_id']) ? intval($data['dean_id']) : 0;
    $student_id = isset($data['student_id']) ? intval($data['student_id']) : 0;
    $date       = isset($data['date']) ? trim($data['date']) : '';

    if ($action === 'delete_one') {
        if ($journal_id <= 0) {
            echo json_encode(["status" => "error", "message" => "Valid Journal ID is required for deletion."]);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM daily_journal WHERE journal_id = ?");
        $stmt->bind_param("i", $journal_id);
        $stmt->execute();
        $deleted_count = $stmt->affected_rows;
        $stmt->close();

        if ($deleted_count > 0) {
            echo json_encode([
                "status"  => "success",
                "message" => "Journal entry permanently deleted from database.",
                "deleted_count" => $deleted_count
            ]);
        } else {
            echo json_encode([
                "status"  => "error",
                "message" => "Journal entry not found or already deleted."
            ]);
        }
    } elseif ($action === 'delete_all' || $action === 'delete_bulk') {
        // Bulk delete with optional scope
        $query = "DELETE j FROM daily_journal j JOIN student s ON j.student_id = s.student_id WHERE 1=1";
        $types = "";
        $params = [];

        if ($dean_id > 0) {
            $query .= " AND s.dean_id = ?";
            $types .= "i";
            $params[] = $dean_id;
        }

        if ($student_id > 0) {
            $query .= " AND j.student_id = ?";
            $types .= "i";
            $params[] = $student_id;
        }

        if (!empty($date)) {
            $query .= " AND j.entry_date = ?";
            $types .= "s";
            $params[] = $date;
        }

        $stmt = $conn->prepare($query);
        if (!empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $deleted_count = $stmt->affected_rows;
        $stmt->close();

        echo json_encode([
            "status"  => "success",
            "message" => "Successfully deleted $deleted_count journal record(s) permanently from database.",
            "deleted_count" => $deleted_count
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Unknown delete action."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
