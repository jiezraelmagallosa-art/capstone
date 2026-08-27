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

    $email = isset($data['email']) ? trim($data['email']) : '';
    $pass = isset($data['password']) ? trim($data['password']) : '';

    if (empty($email) || empty($pass)) {
        echo json_encode(["status" => "error", "message" => "Please enter administrator email and password."]);
        exit();
    }

    $stmt = $conn->prepare("SELECT user_id, full_name, email, password, role FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $db_pass = $row['password'];

        if (password_verify($pass, $db_pass) || $pass === $db_pass) {
            unset($row['password']);
            echo json_encode([
                "status" => "success",
                "message" => "Authentication successful",
                "user" => $row
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid password for administrator account."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Administrator account not found."]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
