<?php
date_default_timezone_set('Asia/Manila');
ini_set('display_errors', 0);
ini_set('memory_limit', '256M');
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

    $raw_ojt_id = isset($data['ojt_id']) ? intval($data['ojt_id']) : (isset($data['student_id']) ? intval($data['student_id']) : 0);
    $raw_shift = isset($data['shift_type']) ? trim($data['shift_type']) : '';
    $image_base64 = isset($data['image_base64']) ? $data['image_base64'] : '';
    $custom_date = isset($data['custom_date']) ? trim($data['custom_date']) : '';
    $custom_time = isset($data['custom_time']) ? trim($data['custom_time']) : '';

    if ($raw_ojt_id <= 0 || empty($raw_shift)) {
        echo json_encode(["status" => "error", "message" => "Missing required fields (OJT/Student ID or shift action)."]);
        exit();
    }

    $current_date = !empty($custom_date) ? $custom_date : date("Y-m-d");
    $current_time = !empty($custom_time) ? $custom_time : date("H:i:s");


    $resolved_ojt_id = 0;
    $stmt_find_ojt = $conn->prepare("SELECT ojt_id FROM ojt WHERE ojt_id = ? OR student_id = ? LIMIT 1");
    if ($stmt_find_ojt) {
        $stmt_find_ojt->bind_param("ii", $raw_ojt_id, $raw_ojt_id);
        $stmt_find_ojt->execute();
        $res_find_ojt = $stmt_find_ojt->get_result();
        if ($row_find_ojt = $res_find_ojt->fetch_assoc()) {
            $resolved_ojt_id = intval($row_find_ojt['ojt_id']);
        }
        $stmt_find_ojt->close();
    }


    if ($resolved_ojt_id <= 0) {
        $ojt_no = "OJT-2026-" . str_pad($raw_ojt_id, 3, "0", STR_PAD_LEFT);
        $site_id = 1;
        $stmt_ins = $conn->prepare("INSERT INTO ojt (ojt_no, site_id, student_id, required_hours) VALUES (?, ?, ?, 480)");
        if ($stmt_ins) {
            $stmt_ins->bind_param("sii", $ojt_no, $site_id, $raw_ojt_id);
            if ($stmt_ins->execute()) {
                $resolved_ojt_id = $conn->insert_id;
            }
            $stmt_ins->close();
        }
    }

    if ($resolved_ojt_id <= 0) {
        $resolved_ojt_id = $raw_ojt_id;
    }

    $field_map = [
        'time_in_morning' => 'time_in_morning',
        'Morning_In' => 'time_in_morning',
        'time_out_morning' => 'time_out_morning',
        'Morning_Out' => 'time_out_morning',
        'time_in_afternoon' => 'time_in_afternoon',
        'Afternoon_In' => 'time_in_afternoon',
        'time_out_afternoon' => 'time_out_afternoon',
        'Afternoon_Out' => 'time_out_afternoon',
    ];

    if (!isset($field_map[$raw_shift])) {
        echo json_encode(["status" => "error", "message" => "Invalid shift type requested: " . $raw_shift]);
        exit();
    }

    $column_to_update = $field_map[$raw_shift];


    $db_image_path = "";
    if (!empty($image_base64) && strlen($image_base64) > 50) {
        try {
            $upload_dir = "../uploads/live_captures/";
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }

            if (strpos($image_base64, 'base64,') !== false) {
                $image_parts = explode(";base64,", $image_base64);
                $image_type_aux = explode("image/", $image_parts[0]);
                $image_type = isset($image_type_aux[1]) ? $image_type_aux[1] : 'jpg';
                $image_base64_decoded = base64_decode($image_parts[1]);
            } else {
                $image_type = 'jpg';
                $image_base64_decoded = base64_decode($image_base64);
            }

            if ($image_base64_decoded !== false && strlen($image_base64_decoded) > 0) {
                $file_name = "live_" . $resolved_ojt_id . "_" . time() . "." . $image_type;
                $file_path = $upload_dir . $file_name;
                $db_image_path = "uploads/live_captures/" . $file_name;
                file_put_contents($file_path, $image_base64_decoded);
            }
        } catch (Exception $img_err) {
            error_log("Image upload exception: " . $img_err->getMessage());
        }
    }


    $photo_shift_map = [
        'time_in_morning' => 'Morning_In',
        'Morning_In' => 'Morning_In',
        'time_out_morning' => 'Morning_Out',
        'Morning_Out' => 'Morning_Out',
        'time_in_afternoon' => 'Afternoon_In',
        'Afternoon_In' => 'Afternoon_In',
        'time_out_afternoon' => 'Afternoon_Out',
        'Afternoon_Out' => 'Afternoon_Out',
    ];
    $enum_shift = isset($photo_shift_map[$raw_shift]) ? $photo_shift_map[$raw_shift] : 'Morning_In';


    $check_stmt = $conn->prepare("SELECT attendance_id FROM attendance WHERE ojt_id = ? AND date = ?");
    $check_stmt->bind_param("is", $resolved_ojt_id, $current_date);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    $attendance_id = 0;
    if ($check_result && $check_result->num_rows > 0) {
        $row = $check_result->fetch_assoc();
        $attendance_id = intval($row['attendance_id']);

        $update_stmt = $conn->prepare("UPDATE attendance SET $column_to_update = ? WHERE attendance_id = ?");
        $update_stmt->bind_param("si", $current_time, $attendance_id);
        $update_stmt->execute();
        $update_stmt->close();
    } else {
        $insert_stmt = $conn->prepare("INSERT INTO attendance (date, ojt_id, $column_to_update) VALUES (?, ?, ?)");
        $insert_stmt->bind_param("sis", $current_date, $resolved_ojt_id, $current_time);
        $insert_stmt->execute();
        $attendance_id = $conn->insert_id;
        $insert_stmt->close();
    }
    $check_stmt->close();


    if (!empty($db_image_path) && $attendance_id > 0) {
        $photo_stmt = $conn->prepare("INSERT INTO photo (attendance_id, shift_type, image_path) VALUES (?, ?, ?)");
        if ($photo_stmt) {
            $photo_stmt->bind_param("iss", $attendance_id, $enum_shift, $db_image_path);
            $photo_stmt->execute();
            $photo_stmt->close();
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Attendance & verification photo logged successfully!",
        "recorded_time" => date("g:i A", strtotime($current_time)),
        "shift_used" => $column_to_update
    ]);

    $conn->close();

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>