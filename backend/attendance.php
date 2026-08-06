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
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "sbc_internship_db";

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli($servername, $username, $password, $dbname);

    $raw_input = file_get_contents("php://input");
    $data = json_decode($raw_input, true);

    if (!$data) {
        $data = $_POST;
    }

    $ojt_id = isset($data['ojt_id']) ? intval($data['ojt_id']) : (isset($data['student_id']) ? intval($data['student_id']) : 0);
    $action = isset($data['action']) ? trim($data['action']) : '';


    if ($ojt_id <= 0 || empty($action)) {
        echo json_encode(["status" => "error", "message" => "Missing OJT ID or action"]);
        exit();
    }

    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');


    $checkStmt = $conn->prepare("SELECT * FROM attendance WHERE ojt_id = ? AND date = ?");
    $checkStmt->bind_param("is", $ojt_id, $current_date);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $existingRecord = $result->fetch_assoc();

    if ($action === 'time_in_morning') {
        if ($existingRecord && !empty($existingRecord['time_in_morning'])) {
            echo json_encode(["status" => "error", "message" => "Already recorded Time-In for Morning today!"]);
            exit();
        }

        if ($existingRecord) {
            $stmt = $conn->prepare("UPDATE attendance SET time_in_morning = ? WHERE attendance_id = ?");
            $stmt->bind_param("si", $current_time, $existingRecord['attendance_id']);
        } else {
            $stmt = $conn->prepare("INSERT INTO attendance (date, time_in_morning, ojt_id) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $current_date, $current_time, $ojt_id);
        }
        $stmt->execute();
        echo json_encode(["status" => "success", "message" => "Morning Time-In recorded at " . date('g:i A')]);

    } elseif ($action === 'time_out_morning') {
        if (!$existingRecord || empty($existingRecord['time_in_morning'])) {
            echo json_encode(["status" => "error", "message" => "Cannot Time-Out. No Morning Time-In record found."]);
            exit();
        }
        if (!empty($existingRecord['time_out_morning'])) {
            echo json_encode(["status" => "error", "message" => "Already recorded Morning Time-Out today!"]);
            exit();
        }

        $stmt = $conn->prepare("UPDATE attendance SET time_out_morning = ? WHERE attendance_id = ?");
        $stmt->bind_param("si", $current_time, $existingRecord['attendance_id']);
        $stmt->execute();
        echo json_encode(["status" => "success", "message" => "Morning Time-Out recorded at " . date('g:i A')]);

    } elseif ($action === 'time_in_afternoon') {
        if ($existingRecord && !empty($existingRecord['time_in_afternoon'])) {
            echo json_encode(["status" => "error", "message" => "Already recorded Time-In for Afternoon today!"]);
            exit();
        }

        if ($existingRecord) {
            $stmt = $conn->prepare("UPDATE attendance SET time_in_afternoon = ? WHERE attendance_id = ?");
            $stmt->bind_param("si", $current_time, $existingRecord['attendance_id']);
        } else {
            $stmt = $conn->prepare("INSERT INTO attendance (date, time_in_afternoon, ojt_id) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $current_date, $current_time, $ojt_id);
        }
        $stmt->execute();
        echo json_encode(["status" => "success", "message" => "Afternoon Time-In recorded at " . date('g:i A')]);

    } elseif ($action === 'time_out_afternoon') {
        if (!$existingRecord || empty($existingRecord['time_in_afternoon'])) {
            echo json_encode(["status" => "error", "message" => "Cannot Time-Out. No Afternoon Time-In record found."]);
            exit();
        }
        if (!empty($existingRecord['time_out_afternoon'])) {
            echo json_encode(["status" => "error", "message" => "Already recorded Afternoon Time-Out today!"]);
            exit();
        }

        $stmt = $conn->prepare("UPDATE attendance SET time_out_afternoon = ? WHERE attendance_id = ?");
        $stmt->bind_param("si", $current_time, $existingRecord['attendance_id']);
        $stmt->execute();
        echo json_encode(["status" => "success", "message" => "Afternoon Time-Out recorded at " . date('g:i A')]);

    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action requested."]);
    }

    $conn->close();

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Server Error: " . $e->getMessage()
    ]);
}
?>