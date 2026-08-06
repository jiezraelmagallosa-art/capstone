<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: admin_get_students.php
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

try {
    // Connect to MySQL database
require_once 'db_connect.php';

    $dean_id = isset($_GET['dean_id']) ? intval($_GET['dean_id']) : (isset($_POST['dean_id']) ? intval($_POST['dean_id']) : 0);

    $sql = "SELECT
                s.student_id,
                s.student_number,
                s.full_name,
                s.id_no,
                s.email,
                s.dean_id,
                u.full_name AS dean_name,
                u.email AS dean_email,
                c.course_code,
                c.course_name,
                o.ojt_id,
                o.ojt_no,
                o.required_hours,
                ts.site_id,
                ts.site_code,
                ts.site_name,
                ts.location AS site_location
            FROM student s
            LEFT JOIN users u ON s.dean_id = u.user_id
            LEFT JOIN course c ON s.course_id = c.course_id
            LEFT JOIN ojt o ON s.student_id = o.student_id
            LEFT JOIN training_site ts ON o.site_id = ts.site_id";

    if ($dean_id > 0) {
        $sql .= " WHERE s.dean_id = " . intval($dean_id);
    }

    $sql .= " ORDER BY s.full_name ASC";

    $result = $conn->query($sql);
    $students = [];

    $m_min = "CASE WHEN time_in_morning IS NOT NULL AND time_out_morning IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, time_in_morning, time_out_morning) ELSE 0 END";
    $a_min = "CASE WHEN time_in_afternoon IS NOT NULL AND time_out_afternoon IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, time_in_afternoon, time_out_afternoon) ELSE 0 END";

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $ojt_id = intval($row['ojt_id'] ?? 0);
            $req_h = 480;


            $total_min = 0;
            $total_days = 0;
            if ($ojt_id > 0) {
                $att_stmt = $conn->prepare("SELECT SUM($m_min + $a_min) as total_min, COUNT(DISTINCT date) as total_days FROM attendance WHERE ojt_id = ?");
                $att_stmt->bind_param("i", $ojt_id);
                $att_stmt->execute();
                $att_res = $att_stmt->get_result()->fetch_assoc();
                $total_min = intval($att_res['total_min'] ?? 0);
                $total_days = intval($att_res['total_days'] ?? 0);
                $att_stmt->close();
            }

            $rendered_hours = floor($total_min / 60);
            $rem_mins = $total_min % 60;
            $progress = min(100.0, round(($total_min / ($req_h * 60)) * 100, 1));

            $status = "In Progress";
            if ($progress >= 100.0) {
                $status = "Completed";
            } elseif ($rendered_hours == 0) {
                $status = "Not Started";
            }

            $students[] = [
                "student_id" => $row['student_id'],
                "student_number" => $row['student_number'],
                "full_name" => $row['full_name'],
                "id_no" => $row['id_no'],
                "email" => $row['email'],
                "dean_id" => $row['dean_id'],
                "dean_name" => $row['dean_name'] ?? 'Unassigned Dean',
                "dean_email" => $row['dean_email'] ?? '',
                "course_code" => $row['course_code'] ?? 'BSIS',
                "course_name" => $row['course_name'] ?? 'BS Information Systems',
                "site_id" => $row['site_id'] ?? 1,
                "site_name" => $row['site_name'] ?? 'SBC IT Department',
                "site_location" => $row['site_location'] ?? 'M\'lang, Cotabato',
                "ojt_no" => $row['ojt_no'] ?? 'OJT-2026-01',
                "required_hours" => $req_h,
                "rendered_hours" => $rendered_hours,
                "rendered_minutes" => $rem_mins,
                "formatted_time" => "{$rendered_hours}h {$rem_mins}m",
                "progress_percentage" => $progress,
                "total_days" => $total_days,
                "status" => $status
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $students
    ]);

    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
