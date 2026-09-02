<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: update_student_site.php
 * Handles student training site transfer/reassignment.
 * 
 * Behavior:
 * - Student's time accumulation continues uninterrupted.
 * - Hours logged at the previous site(s) remain recorded and labeled "Previous Location".
 * - A new entry is created for the current training site labeled "Current Location".
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

    $student_id  = isset($data['student_id']) ? intval($data['student_id']) : 0;
    $new_site_id = isset($data['new_site_id']) ? intval($data['new_site_id']) : (isset($data['site_id']) ? intval($data['site_id']) : 0);
    $remarks     = isset($data['remarks']) ? trim($data['remarks']) : 'Transferred to new training facility';

    if ($student_id <= 0 || $new_site_id <= 0) {
        echo json_encode([
            "status"  => "error",
            "message" => "Student ID and new Training Site ID are required."
        ]);
        exit();
    }

    // 1. Verify student exists and get current site from ojt
    $stmt_ojt = $conn->prepare("SELECT o.ojt_id, o.site_id, ts.site_name, ts.location FROM ojt o LEFT JOIN training_site ts ON o.site_id = ts.site_id WHERE o.student_id = ? LIMIT 1");
    $stmt_ojt->bind_param("i", $student_id);
    $stmt_ojt->execute();
    $res_ojt = $stmt_ojt->get_result();

    $current_site_id = 0;
    $ojt_id = 0;
    if ($res_ojt && $row_ojt = $res_ojt->fetch_assoc()) {
        $current_site_id = intval($row_ojt['site_id']);
        $ojt_id = intval($row_ojt['ojt_id']);
    }
    $stmt_ojt->close();

    if ($current_site_id === $new_site_id) {
        echo json_encode([
            "status"  => "error",
            "message" => "Student is already assigned to this training facility."
        ]);
        exit();
    }

    // 2. Verify new site exists in training_site
    $stmt_site = $conn->prepare("SELECT site_id, site_code, site_name, location FROM training_site WHERE site_id = ? LIMIT 1");
    $stmt_site->bind_param("i", $new_site_id);
    $stmt_site->execute();
    $res_site = $stmt_site->get_result();

    if (!$res_site || $res_site->num_rows === 0) {
        echo json_encode([
            "status"  => "error",
            "message" => "Selected training facility not found."
        ]);
        $stmt_site->close();
        exit();
    }
    $new_site_info = $res_site->fetch_assoc();
    $stmt_site->close();

    // 3. Close the previous active history record
    $stmt_close_prev = $conn->prepare("UPDATE student_site_history SET is_current = 0, pulled_out_at = NOW() WHERE student_id = ? AND is_current = 1");
    if ($stmt_close_prev) {
        $stmt_close_prev->bind_param("i", $student_id);
        $stmt_close_prev->execute();
        $stmt_close_prev->close();
    }

    // If no prior history record existed for current_site_id, create historical entry
    if ($current_site_id > 0) {
        $check_prev_hist = $conn->prepare("SELECT history_id FROM student_site_history WHERE student_id = ? AND site_id = ? LIMIT 1");
        $check_prev_hist->bind_param("ii", $student_id, $current_site_id);
        $check_prev_hist->execute();
        if ($check_prev_hist->get_result()->num_rows === 0) {
            $ins_prev = $conn->prepare("INSERT INTO student_site_history (student_id, site_id, is_current, pulled_out_at, remarks) VALUES (?, ?, 0, NOW(), 'Initial site before transfer')");
            $ins_prev->bind_param("ii", $student_id, $current_site_id);
            $ins_prev->execute();
            $ins_prev->close();
        }
        $check_prev_hist->close();
    }

    // 4. Insert new active history record
    $stmt_ins_hist = $conn->prepare("INSERT INTO student_site_history (student_id, site_id, is_current, remarks) VALUES (?, ?, 1, ?)");
    $stmt_ins_hist->bind_param("iis", $student_id, $new_site_id, $remarks);
    $stmt_ins_hist->execute();
    $stmt_ins_hist->close();

    // 5. Update ojt table site_id for current assignment
    if ($ojt_id > 0) {
        $stmt_upd_ojt = $conn->prepare("UPDATE ojt SET site_id = ? WHERE ojt_id = ?");
        $stmt_upd_ojt->bind_param("ii", $new_site_id, $ojt_id);
        $stmt_upd_ojt->execute();
        $stmt_upd_ojt->close();
    } else {
        $ojt_no = "OJT-" . date("Y") . "-" . str_pad($student_id, 4, "0", STR_PAD_LEFT);
        $stmt_ins_ojt = $conn->prepare("INSERT INTO ojt (ojt_no, site_id, student_id, required_hours) VALUES (?, ?, ?, 480)");
        $stmt_ins_ojt->bind_param("sii", $ojt_no, $new_site_id, $student_id);
        $stmt_ins_ojt->execute();
        $stmt_ins_ojt->close();
    }

    // 6. Build updated site breakdown
    require_once 'site_helper.php';
    $breakdown = getStudentSiteBreakdown($conn, $student_id);

    echo json_encode([
        "status"         => "success",
        "message"        => "Training site updated successfully to " . $new_site_info['site_name'] . ". Previous logged hours have been preserved.",
        "current_site"   => [
            "site_id"      => intval($new_site_info['site_id']),
            "site_code"    => $new_site_info['site_code'],
            "site_name"    => $new_site_info['site_name'],
            "location"     => $new_site_info['location']
        ],
        "site_breakdown" => $breakdown['sites'],
        "total_rendered_hours"   => $breakdown['total_hours'],
        "total_rendered_minutes" => $breakdown['total_minutes'],
        "formatted_rendered_time" => $breakdown['formatted_rendered_time']
    ]);

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
