<?php
/**
 * SBC Internship Attendance System - Backend API
 * Endpoint: get_sites.php
 * Fetches all training/intern sites for student registration selection.
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

require_once 'db_connect.php';

$query = "SELECT site_id, site_code, site_name, location FROM training_site ORDER BY site_name ASC";
$result = $conn->query($query);

$sites = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $sites[] = [
            "site_id" => intval($row['site_id']),
            "site_code" => $row['site_code'],
            "site_name" => $row['site_name'],
            "location" => $row['location'] ?? 'M\'lang, Cotabato',
            "display_name" => $row['site_name'] . " (" . ($row['location'] ?? 'M\'lang, Cotabato') . ")"
        ];
    }
}

echo json_encode([
    "status" => "success",
    "data" => $sites
]);

$conn->close();
?>
