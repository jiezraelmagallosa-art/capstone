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

    $sql = "SELECT
                ar.absence_id,
                ar.date_absent,
                ar.reason,
                ar.supporting_document,
                ar.status,
                ar.remarks,
                ar.created_at,
                s.student_id,
                s.student_number,
                s.full_name,
                s.dean_id,
                ud.full_name AS dean_name,
                c.course_code,
                u.full_name AS reviewed_by_name
            FROM absence_requests ar
            JOIN student s ON ar.student_id = s.student_id
            LEFT JOIN users ud ON s.dean_id = ud.user_id
            LEFT JOIN course c ON s.course_id = c.course_id
            LEFT JOIN users u ON ar.reviewed_by = u.user_id";

    if ($dean_id > 0) {
        $sql .= " WHERE s.dean_id = " . intval($dean_id);
    }

    $sql .= " ORDER BY ar.absence_id DESC";

    $result = $conn->query($sql);
    $absences = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $doc_url = null;
            if (!empty($row['supporting_document'])) {
                $doc_url = "http://localhost/SBC_Internship_Attendance_System/" . $row['supporting_document'];
            }

            $absences[] = [
                "absence_id" => $row['absence_id'],
                "date_absent" => date("M d, Y", strtotime($row['date_absent'])),
                "raw_date" => $row['date_absent'],
                "reason" => $row['reason'],
                "supporting_document" => $row['supporting_document'],
                "doc_url" => $doc_url,
                "status" => $row['status'],
                "remarks" => $row['remarks'] ?? '',
                "created_at" => date("M d, Y h:i A", strtotime($row['created_at'])),
                "student_id" => $row['student_id'],
                "student_number" => $row['student_number'],
                "full_name" => $row['full_name'],
                "dean_name" => $row['dean_name'] ?? 'Unassigned Dean',
                "course_code" => $row['course_code'] ?? 'BSIS',
                "reviewed_by_name" => $row['reviewed_by_name'] ?? 'Pending Evaluation'
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $absences
    ]);

    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
