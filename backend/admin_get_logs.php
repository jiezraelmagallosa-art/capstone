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

    $dean_id = isset($_GET['dean_id']) ? intval($_GET['dean_id']) : (isset($_POST['dean_id']) ? intval($_POST['dean_id']) : 0);

    $sql = "SELECT DISTINCT
                a.attendance_id,
                a.date,
                a.time_in_morning,
                a.time_out_morning,
                a.time_in_afternoon,
                a.time_out_afternoon,
                s.student_id,
                s.student_number,
                s.full_name,
                s.dean_id,
                ud.full_name AS dean_name,
                c.course_code,
                ts.site_name
            FROM attendance a
            JOIN ojt o ON a.ojt_id = o.ojt_id
            JOIN student s ON o.student_id = s.student_id
            LEFT JOIN users ud ON s.dean_id = ud.user_id
            LEFT JOIN course c ON s.course_id = c.course_id
            LEFT JOIN training_site ts ON o.site_id = ts.site_id";

    if ($dean_id > 0) {
        $sql .= " WHERE s.dean_id = " . intval($dean_id);
    }

    $sql .= " ORDER BY a.date DESC, a.attendance_id DESC";

    $result = $conn->query($sql);
    $logs = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $att_id = intval($row['attendance_id']);


            $p_stmt = $conn->prepare("SELECT photo_id, shift_type, image_path, captured_at FROM photo WHERE attendance_id = ? ORDER BY photo_id ASC");
            $p_stmt->bind_param("i", $att_id);
            $p_stmt->execute();
            $p_res = $p_stmt->get_result();

            $photos = [];
            while ($p = $p_res->fetch_assoc()) {
                $photos[] = [
                    "photo_id" => $p['photo_id'],
                    "shift_type" => str_replace('_', ' ', $p['shift_type']),
                    "image_path" => $p['image_path'],
                    "full_url" => "http://localhost/SBC_Internship_Attendance_System/" . $p['image_path'],
                    "captured_at" => date("h:i A", strtotime($p['captured_at']))
                ];
            }
            $p_stmt->close();

            $status = count($photos) > 0 ? "Verified" : "Logged";

            $logs[] = [
                "attendance_id" => $att_id,
                "date" => date("M d, Y", strtotime($row['date'])),
                "raw_date" => $row['date'],
                "student_number" => $row['student_number'],
                "full_name" => $row['full_name'],
                "dean_name" => $row['dean_name'] ?? 'Unassigned Dean',
                "course_code" => $row['course_code'] ?? 'BSIS',
                "site_name" => $row['site_name'] ?? 'SBC IT Department',
                "time_in_morning" => !empty($row['time_in_morning']) ? date("h:i A", strtotime($row['time_in_morning'])) : '--:--',
                "time_out_morning" => !empty($row['time_out_morning']) ? date("h:i A", strtotime($row['time_out_morning'])) : '--:--',
                "time_in_afternoon" => !empty($row['time_in_afternoon']) ? date("h:i A", strtotime($row['time_in_afternoon'])) : '--:--',
                "time_out_afternoon" => !empty($row['time_out_afternoon']) ? date("h:i A", strtotime($row['time_out_afternoon'])) : '--:--',
                "status" => $status,
                "photos" => $photos
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $logs
    ]);

    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
