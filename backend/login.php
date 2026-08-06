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

    $email = isset($data['email']) ? trim($data['email']) : '';
    $pass = isset($data['password']) ? trim($data['password']) : '';

    if (empty($email) || empty($pass)) {
        echo json_encode(["status" => "error", "message" => "Missing email or password"]);
        exit();
    }


    $stmt = $conn->prepare("SELECT s.*, u.full_name AS dean_name, u.email AS dean_email, o.ojt_id, o.ojt_no FROM student s LEFT JOIN users u ON s.dean_id = u.user_id LEFT JOIN ojt o ON s.student_id = o.student_id WHERE s.email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $db_password = $row['password'];

        if (password_verify($pass, $db_password) || $pass === $db_password) {
            echo json_encode([
                "status" => "success",
                "message" => "Login successful",
                "user" => $row
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Maling Password! Nilagay mo: '$pass' | Sa DB: '$db_password'"
            ]);
        }
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Walang user na may email na: '$email'"
        ]);
    }

    $conn->close();

} catch (Exception $e) {

    echo json_encode([
        "status" => "error",
        "message" => "PHP/DB Error: " . $e->getMessage()
    ]);
}
?>