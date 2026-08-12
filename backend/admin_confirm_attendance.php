<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: admin_confirm_attendance.php
 * Confirmation by Dean deletes associated verification photos and updates attendance status to 'Confirmed'.
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

    $attendance_id = isset($data['attendance_id']) ? intval($data['attendance_id']) : 0;
    $dean_id = isset($data['dean_id']) ? intval($data['dean_id']) : 0;

    if ($attendance_id <= 0) {
        echo json_encode(["status" => "error", "message" => "Invalid or missing attendance ID."]);
        exit();
    }

    // 1. Fetch all associated photo image paths for this attendance log
    $stmt_photos = $conn->prepare("SELECT photo_id, image_path FROM photo WHERE attendance_id = ?");
    $stmt_photos->bind_param("i", $attendance_id);
    $stmt_photos->execute();
    $res_photos = $stmt_photos->get_result();

    $deleted_files_count = 0;
    $base_dir = dirname(__DIR__) . "/";

    while ($p_row = $res_photos->fetch_assoc()) {
        $img_rel_path = $p_row['image_path'];
        if (!empty($img_rel_path)) {
            $full_file_path = $base_dir . $img_rel_path;
            if (file_exists($full_file_path)) {
                @unlink($full_file_path);
                $deleted_files_count++;
            }
        }
    }
    $stmt_photos->close();

    // 2. Delete photo records from database for this attendance log
    $stmt_del = $conn->prepare("DELETE FROM photo WHERE attendance_id = ?");
    $stmt_del->bind_param("i", $attendance_id);
    $stmt_del->execute();
    $stmt_del->close();

    // 3. Update attendance status to 'Confirmed'
    $stmt_upd = $conn->prepare("UPDATE attendance SET status = 'Confirmed' WHERE attendance_id = ?");
    $stmt_upd->bind_param("i", $attendance_id);
    $stmt_upd->execute();
    $stmt_upd->close();

    echo json_encode([
        "status" => "success",
        "message" => "Attendance record confirmed successfully. $deleted_files_count verification photo(s) deleted.",
        "attendance_id" => $attendance_id
    ]);

    $conn->close();

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
