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

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw_input = file_get_contents("php://input");
        $data = json_decode($raw_input, true);
        if (!$data) $data = $_POST;

        $site_id = isset($data['site_id']) ? intval($data['site_id']) : 0;
        $site_code = isset($data['site_code']) ? trim($data['site_code']) : '';
        $site_name = isset($data['site_name']) ? trim($data['site_name']) : '';
        $location = isset($data['location']) ? trim($data['location']) : '';

        if (empty($site_code) || empty($site_name)) {
            echo json_encode(["status" => "error", "message" => "Partner code and facility name are required."]);
            exit();
        }

        if ($site_id > 0) {
            $stmt = $conn->prepare("UPDATE training_site SET site_code = ?, site_name = ?, location = ? WHERE site_id = ?");
            $stmt->bind_param("sssi", $site_code, $site_name, $location, $site_id);
            $msg = "Training partner updated successfully.";
        } else {
            $stmt = $conn->prepare("INSERT INTO training_site (site_code, site_name, location) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $site_code, $site_name, $location);
            $msg = "New training partner added successfully.";
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => $msg]);
        } else {
            echo json_encode(["status" => "error", "message" => "Database operation failed: " . $stmt->error]);
        }
        $stmt->close();

    } else {

        $sql = "SELECT
                    ts.site_id,
                    ts.site_code,
                    ts.site_name,
                    ts.location,
                    COUNT(o.ojt_id) AS assigned_interns
                FROM training_site ts
                LEFT JOIN ojt o ON ts.site_id = o.site_id
                GROUP BY ts.site_id
                ORDER BY ts.site_name ASC";

        $result = $conn->query($sql);
        $sites = [];

        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $sites[] = [
                    "site_id" => intval($row['site_id']),
                    "site_code" => $row['site_code'],
                    "site_name" => $row['site_name'],
                    "location" => $row['location'] ?? 'M\'lang, Cotabato',
                    "assigned_interns" => intval($row['assigned_interns'] ?? 0)
                ];
            }
        }

        echo json_encode([
            "status" => "success",
            "data" => $sites
        ]);
    }

    $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
