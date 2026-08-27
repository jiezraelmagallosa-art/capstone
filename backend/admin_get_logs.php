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

    if ($dean_id > 0) {
        $d_check = $conn->query("SELECT student_id FROM student WHERE dean_id = $dean_id LIMIT 1");
        if (!$d_check || $d_check->num_rows == 0) {
            $dean_id = 0; // Fallback to all logs if no students assigned specifically to this dean
        }
    }

    $sql = "SELECT DISTINCT
                a.attendance_id,
                a.date,
                a.time_in_morning,
                a.time_out_morning,
                a.time_in_afternoon,
                a.time_out_afternoon,
                a.status AS attendance_status,
                a.remarks AS attendance_remarks,
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
            $base_sys_url = function_exists('get_system_base_url') ? get_system_base_url() : '../';
            while ($p = $p_res->fetch_assoc()) {
                $photos[] = [
                    "photo_id" => $p['photo_id'],
                    "shift_type" => str_replace('_', ' ', $p['shift_type']),
                    "image_path" => $p['image_path'],
                    "full_url" => $base_sys_url . $p['image_path'],
                    "captured_at" => date("h:i A", strtotime($p['captured_at']))
                ];
            }
            $p_stmt->close();

            $raw_att_status = $row['attendance_status'] ?? 'Pending';
            if ($raw_att_status === 'Confirmed') {
                $status = "Confirmed";
            } elseif ($raw_att_status === 'Rejected') {
                $status = "Rejected";
            } else {
                $status = "Pending";
            }

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
                "remarks" => $row['attendance_remarks'] ?? '',
                "is_confirmed" => ($raw_att_status === 'Confirmed'),
                "is_rejected" => ($raw_att_status === 'Rejected'),
                "photos" => $photos
            ];
        }
    }

    // Overall counts per course for logs
    $counts_sql = "SELECT COALESCE(c.course_code, 'BSIS') as course_code, COUNT(a.attendance_id) as total
                   FROM attendance a
                   JOIN ojt o ON a.ojt_id = o.ojt_id
                   JOIN student s ON o.student_id = s.student_id
                   LEFT JOIN course c ON s.course_id = c.course_id";
    if ($dean_id > 0) {
        $counts_sql .= " WHERE s.dean_id = " . intval($dean_id);
    }
    $counts_sql .= " GROUP BY COALESCE(c.course_code, 'BSIS')";
    $counts_res = $conn->query($counts_sql);
    $course_counts = [
        "ALL" => 0,
        "BSCS" => 0,
        "BSIS" => 0,
        "BLIS" => 0
    ];
    if ($counts_res && $counts_res->num_rows > 0) {
        while ($c_row = $counts_res->fetch_assoc()) {
            $code = strtoupper($c_row['course_code'] ?? 'BSIS');
            $cnt = intval($c_row['total'] ?? 0);
            $course_counts[$code] = $cnt;
            $course_counts["ALL"] += $cnt;
        }
    }

    echo json_encode([
        "status" => "success",
        "course_counts" => $course_counts,
        "data" => $logs
    ]);

    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
