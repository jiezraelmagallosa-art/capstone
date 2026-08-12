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

require_once 'db_connect.php';

$raw_input = file_get_contents("php://input");
$data = json_decode($raw_input, true);

if (!$data) {
    $data = $_POST;
}

$full_name = isset($data['full_name']) ? trim($data['full_name']) : '';
$student_number = isset($data['student_number']) ? trim($data['student_number']) : '';
$id_no = isset($data['id_no']) ? trim($data['id_no']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$pass = isset($data['password']) ? trim($data['password']) : '';
$course_id = isset($data['course_id']) ? intval($data['course_id']) : 1;
$dean_id = isset($data['dean_id']) ? intval($data['dean_id']) : 0;

// Auto-generate student number (e.g. 2026-0010) if not provided
if (empty($student_number)) {
    $max_res = $conn->query("SELECT MAX(student_id) as max_id FROM student");
    $next_id = 1;
    if ($max_res && $row = $max_res->fetch_assoc()) {
        $next_id = intval($row['max_id']) + 1;
    }
    $student_number = date("Y") . "-" . str_pad($next_id, 4, "0", STR_PAD_LEFT);
}

if (empty($id_no)) {
    $id_no = $student_number;
}

if (empty($full_name) || empty($email) || empty($pass)) {
    echo json_encode(["status" => "error", "message" => "Please fill in all required registration fields."]);
    exit();
}

if ($dean_id <= 0) {

    $d_check = $conn->query("SELECT user_id FROM users WHERE role IN ('Dean', 'Admin') ORDER BY user_id ASC LIMIT 1");
    if ($d_check && $d_check->num_rows > 0) {
        $dean_id = intval($d_check->fetch_assoc()['user_id']);
    } else {
        echo json_encode(["status" => "error", "message" => "Please select your specific Dean for account categorization."]);
        exit();
    }
} else {

    $d_verify = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? LIMIT 1");
    $d_verify->bind_param("i", $dean_id);
    $d_verify->execute();
    if ($d_verify->get_result()->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "Selected Dean is invalid or not found."]);
        $d_verify->close();
        $conn->close();
        exit();
    }
    $d_verify->close();
}

if (empty($id_no)) {
    $id_no = "ID-" . rand(100, 999);
}


$check_email = $conn->prepare("SELECT student_id FROM student WHERE email = ?");
$check_email->bind_param("s", $email);
$check_email->execute();
if ($check_email->get_result()->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "This email is already registered."]);
    $check_email->close();
    $conn->close();
    exit();
}
$check_email->close();


$check_num = $conn->prepare("SELECT student_id FROM student WHERE student_number = ?");
$check_num->bind_param("s", $student_number);
$check_num->execute();
if ($check_num->get_result()->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "This student number is already registered."]);
    $check_num->close();
    $conn->close();
    exit();
}
$check_num->close();


if ($course_id <= 0) {
    $course_id = 1;
}


$hashed_password = password_hash($pass, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO student (student_number, full_name, id_no, email, password, course_id, dean_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssii", $student_number, $full_name, $id_no, $email, $hashed_password, $course_id, $dean_id);

if ($stmt->execute()) {
    $student_id = $conn->insert_id;
    $stmt->close();


    $ojt_no = "OJT-2026-" . str_pad($student_id, 2, "0", STR_PAD_LEFT);
    $site_id = 1;

    $stmt_ojt = $conn->prepare("INSERT INTO ojt (ojt_no, site_id, student_id, required_hours) VALUES (?, ?, ?, 480)");
    $stmt_ojt->bind_param("sii", $ojt_no, $site_id, $student_id);
    $stmt_ojt->execute();
    $stmt_ojt->close();

    echo json_encode([
        "status" => "success",
        "message" => "Account created successfully! You can now log in.",
        "student_id" => $student_id
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Registration failed: " . $stmt->error
    ]);
    $stmt->close();
}

$conn->close();
?>
