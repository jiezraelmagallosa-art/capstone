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

    $raw_input = file_get_contents("php://input");
    $data = json_decode($raw_input, true);

    if (!$data) {
        $data = $_POST;
    }

    $full_name = isset($data['full_name']) ? trim($data['full_name']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';
    $role = isset($data['role']) ? trim($data['role']) : 'Dean';

    if (empty($full_name) || empty($email) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "All fields (Full Name, Email, Password) are required."]);
        exit();
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "Invalid institutional email address format."]);
        exit();
    }

    if (!in_array($role, ['Dean', 'Admin'])) {
        $role = 'Dean';
    }


    $chk_stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
    $chk_stmt->bind_param("s", $email);
    $chk_stmt->execute();
    $chk_res = $chk_stmt->get_result();

    if ($chk_res && $chk_res->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "An administrator account with this email already exists."]);
        $chk_stmt->close();
        exit();
    }
    $chk_stmt->close();

    $hashed_pass = password_hash($password, PASSWORD_BCRYPT);

    $ins_stmt = $conn->prepare("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)");
    $ins_stmt->bind_param("ssss", $full_name, $email, $hashed_pass, $role);

    if ($ins_stmt->execute()) {
        $new_id = $conn->insert_id;
        echo json_encode([
            "status" => "success",
            "message" => "Dean/Administrator account created successfully! You can now log in.",
            "user_id" => $new_id
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to create administrator account: " . $ins_stmt->error]);
    }

    $ins_stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
