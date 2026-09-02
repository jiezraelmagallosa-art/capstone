<?php
/**
 * SBC Internship Attendance System - Automated Photo Cleanup
 * Standalone cron endpoint to delete live capture photos older than 30 days.
 * 
 * Safe execution:
 * - Can be called via Web Cron (e.g. cron-job.org) using:
 *     https://your-domain.com/backend/cron_cleanup_photos.php?key=sbc_cleanup_2026
 * - Can also be run via Command Line (CLI / Windows Task Scheduler):
 *     php cron_cleanup_photos.php
 * 
 * Retention: 30 Days (Default, can be adjusted via ?days=30)
 * Note: Leaves all existing application code untouched.
 */

// Centralized error handling
ini_set('display_errors', 0);
error_reporting(0);

// Allow JSON API response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Security Token: Set your secret key below
define('CLEANUP_SECRET_KEY', 'sbc_cleanup_2026');

// Check authorization if accessed via Web browser / HTTP
$is_cli = (php_sapi_name() === 'cli' || empty($_SERVER['REMOTE_ADDR']));
if (!$is_cli) {
    $provided_key = isset($_GET['key']) ? trim($_GET['key']) : (isset($_POST['key']) ? trim($_POST['key']) : '');
    if ($provided_key !== CLEANUP_SECRET_KEY) {
        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => "Unauthorized. Please provide a valid secret key via ?key=YOUR_KEY."
        ]);
        exit();
    }
}

try {
    // Connect to database using existing system connection
    require_once __DIR__ . '/db_connect.php';

    // 1. Configure Retention Window (Default: 30 Days)
    $retention_days = isset($_GET['days']) ? intval($_GET['days']) : (isset($_POST['days']) ? intval($_POST['days']) : 30);
    if ($retention_days <= 0) {
        $retention_days = 30;
    }

    $project_root = dirname(__DIR__) . DIRECTORY_SEPARATOR;
    $captures_dir = $project_root . 'uploads' . DIRECTORY_SEPARATOR . 'live_captures' . DIRECTORY_SEPARATOR;
    $cutoff_seconds = $retention_days * 86400;
    $cutoff_timestamp = time() - $cutoff_seconds;
    $cutoff_date_str = date('Y-m-d H:i:s', $cutoff_timestamp);

    $db_photos_deleted = 0;
    $db_files_unlinked = 0;
    $orphaned_files_deleted = 0;

    // 2. Fetch and delete photos older than $retention_days from database
    $stmt_find = $conn->prepare("SELECT photo_id, image_path, captured_at FROM photo WHERE captured_at < (NOW() - INTERVAL ? DAY)");
    if ($stmt_find) {
        $stmt_find->bind_param("i", $retention_days);
        $stmt_find->execute();
        $result = $stmt_find->get_result();

        $ids_to_purge = [];
        while ($row = $result->fetch_assoc()) {
            $ids_to_purge[] = intval($row['photo_id']);
            $rel_path = ltrim($row['image_path'], '/\\');
            $full_file = $project_root . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel_path);

            if (file_exists($full_file) && is_file($full_file)) {
                if (@unlink($full_file)) {
                    $db_files_unlinked++;
                }
            }
        }
        $stmt_find->close();

        // Remove deleted photo records from database
        if (!empty($ids_to_purge)) {
            $id_chunk_list = implode(',', $ids_to_purge);
            $conn->query("DELETE FROM photo WHERE photo_id IN ($id_chunk_list)");
            $db_photos_deleted = count($ids_to_purge);
        }
    }

    // 3. Scan physical uploads/live_captures/ for any leftover/orphaned files older than 30 days
    if (is_dir($captures_dir)) {
        $dir_files = scandir($captures_dir);
        if ($dir_files !== false) {
            foreach ($dir_files as $file) {
                if ($file === '.' || $file === '..' || $file === '.gitkeep' || $file === '.htaccess') {
                    continue;
                }

                $file_path = $captures_dir . $file;
                if (is_file($file_path)) {
                    $file_mtime = filemtime($file_path);
                    if ($file_mtime !== false && $file_mtime < $cutoff_timestamp) {
                        if (@unlink($file_path)) {
                            $orphaned_files_deleted++;
                        }
                    }
                }
            }
        }
    }

    // Return structured report
    echo json_encode([
        "status" => "success",
        "message" => "Automated cleanup completed successfully.",
        "retention_period" => "{$retention_days} days",
        "cutoff_threshold" => $cutoff_date_str,
        "database_records_purged" => $db_photos_deleted,
        "physical_files_deleted" => ($db_files_unlinked + $orphaned_files_deleted),
        "server_time" => date("Y-m-d H:i:s")
    ], JSON_PRETTY_PRINT);

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Cleanup exception: " . $e->getMessage()
    ]);
}
?>
