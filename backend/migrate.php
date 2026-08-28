<?php
/**
 * SBC Internship Attendance & Verification System
 * Database Migration & Setup Runner
 *
 * Can be run via:
 * 1. Web Browser: http://localhost/SBC_Internship_Attendance_System/backend/migrate.php
 * 2. Command Line (CLI): php backend/migrate.php
 */

// Load centralized config (edit backend/config.php to change settings)
require_once __DIR__ . '/config.php';

date_default_timezone_set(APP_TIMEZONE);

$isCli = (php_sapi_name() === 'cli');
$logs = [];
$status = "success";

function logStep($message, $type = "info")
{
    global $logs, $isCli;
    $logs[] = [
        "timestamp" => date('H:i:s'),
        "type" => $type,
        "message" => $message
    ];
    if ($isCli) {
        $prefix = ($type === 'error') ? '[ERROR]' : (($type === 'success') ? '[OK]' : '[INFO]');
        echo "$prefix $message\n";
    }
}

// 1. Connection Config — from backend/config.php
$host = DB_HOST;
$username = DB_USER;
$password = DB_PASS;
$database = DB_NAME;
$port = DB_PORT;

logStep("Connecting to MySQL at $host:$port (User: $username, Database: $database)...");

// Try connecting directly with database name (standard for InfinityFree / cPanel / production)
$conn = @new mysqli($host, $username, $password, $database, $port);

if ($conn->connect_error) {
    // Fallback: try connecting without DB name to attempt creation (for local dev setup)
    $conn = @new mysqli($host, $username, $password, "", $port);
    if ($conn->connect_error) {
        $status = "error";
        logStep("MySQL connection failed: " . $conn->connect_error, "error");
        outputJson($status, $logs, $database, []);
        exit();
    }

    // Attempt database creation if permission allows
    @$conn->query("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    if (!$conn->select_db($database)) {
        $status = "error";
        logStep("Failed to select database `$database`: " . $conn->error, "error");
        outputJson($status, $logs, $database, []);
        exit();
    }
    logStep("Database `$database` initialized successfully.", "success");
} else {
    logStep("Connected to MySQL server and selected database `$database` successfully.", "success");
}

$conn->query("SET time_zone = '+08:00';");
$conn->set_charset("utf8mb4");

// 3. Define Table Schema
$tables = [
    "Course" => "CREATE TABLE IF NOT EXISTS Course (
        course_id INT PRIMARY KEY AUTO_INCREMENT,
        course_code VARCHAR(20) NOT NULL UNIQUE,
        course_name VARCHAR(100) NOT NULL,
        required_hours INT DEFAULT 480
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "Training_Site" => "CREATE TABLE IF NOT EXISTS Training_Site (
        site_id INT PRIMARY KEY AUTO_INCREMENT,
        site_code VARCHAR(20) NOT NULL UNIQUE,
        site_name VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "Users" => "CREATE TABLE IF NOT EXISTS Users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('Dean', 'Admin') DEFAULT 'Dean',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "Student" => "CREATE TABLE IF NOT EXISTS Student (
        student_id INT PRIMARY KEY AUTO_INCREMENT,
        student_number VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        id_no VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        course_id INT NOT NULL,
        dean_id INT NULL,
        FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
        FOREIGN KEY (dean_id) REFERENCES Users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "OJT" => "CREATE TABLE IF NOT EXISTS OJT (
        ojt_id INT PRIMARY KEY AUTO_INCREMENT,
        ojt_no VARCHAR(50) UNIQUE NOT NULL,
        site_id INT NOT NULL,
        student_id INT NOT NULL,
        required_hours INT DEFAULT 480,
        FOREIGN KEY (site_id) REFERENCES Training_Site(site_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "Attendance" => "CREATE TABLE IF NOT EXISTS Attendance (
        attendance_id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        time_in_morning TIME NULL,
        time_out_morning TIME NULL,
        time_in_afternoon TIME NULL,
        time_out_afternoon TIME NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        remarks TEXT NULL,
        ojt_id INT NOT NULL,
        FOREIGN KEY (ojt_id) REFERENCES OJT(ojt_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "Photo" => "CREATE TABLE IF NOT EXISTS Photo (
        photo_id INT PRIMARY KEY AUTO_INCREMENT,
        attendance_id INT NOT NULL,
        shift_type ENUM('Morning_In', 'Morning_Out', 'Afternoon_In', 'Afternoon_Out') NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attendance_id) REFERENCES Attendance(attendance_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

    "Absence_Requests" => "CREATE TABLE IF NOT EXISTS Absence_Requests (
        absence_id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        ojt_id INT NOT NULL,
        date_absent DATE NOT NULL,
        reason TEXT NOT NULL,
        supporting_document VARCHAR(255) NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        reviewed_by INT NULL,
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
        FOREIGN KEY (ojt_id) REFERENCES OJT(ojt_id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES Users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
];

// Execute Table Creations
foreach ($tables as $tableName => $query) {
    if ($conn->query($query)) {
        logStep("Table `$tableName` initialized / verified.", "success");
    } else {
        logStep("Error creating table `$tableName`: " . $conn->error, "error");
    }
}

// 4. Incremental Alter Migrations (Self-Healing Schema)
// A. student.dean_id
$colDean = $conn->query("SHOW COLUMNS FROM Student LIKE 'dean_id'");
if ($colDean && $colDean->num_rows == 0) {
    if ($conn->query("ALTER TABLE Student ADD COLUMN dean_id INT NULL AFTER course_id")) {
        @$conn->query("ALTER TABLE Student ADD CONSTRAINT fk_student_dean FOREIGN KEY (dean_id) REFERENCES Users(user_id) ON DELETE SET NULL");
        logStep("Migrated: Added `dean_id` to `Student`.", "success");
    } else {
        logStep("Migration error adding `dean_id`: " . $conn->error, "error");
    }
}

// B. course.required_hours
$colCourseHours = $conn->query("SHOW COLUMNS FROM Course LIKE 'required_hours'");
if ($colCourseHours && $colCourseHours->num_rows == 0) {
    if ($conn->query("ALTER TABLE Course ADD COLUMN required_hours INT DEFAULT 480 AFTER course_name")) {
        @$conn->query("UPDATE Course SET required_hours = 480 WHERE required_hours IS NULL OR required_hours = 0");
        logStep("Migrated: Added `required_hours` to `Course`.", "success");
    } else {
        logStep("Migration error adding `required_hours` to `Course`: " . $conn->error, "error");
    }
}

// C. ojt.required_hours
$colOjtHours = $conn->query("SHOW COLUMNS FROM OJT LIKE 'required_hours'");
if ($colOjtHours && $colOjtHours->num_rows == 0) {
    if ($conn->query("ALTER TABLE OJT ADD COLUMN required_hours INT DEFAULT 480 AFTER student_id")) {
        @$conn->query("UPDATE OJT SET required_hours = 480 WHERE required_hours IS NULL OR required_hours = 0");
        logStep("Migrated: Added `required_hours` to `OJT`.", "success");
    }
}

// 5. Seed Initial Data — credentials from backend/config.php
$def_hours = DEFAULT_REQUIRED_HOURS;

// A. Courses
$conn->query("INSERT INTO Course (course_code, course_name, required_hours) VALUES
    ('BSCS', 'Bachelor of Science in Computer Science', $def_hours),
    ('BSIS', 'Bachelor of Science in Information Systems', $def_hours),
    ('BLIS', 'Bachelor of Library and Information Science', $def_hours)
    ON DUPLICATE KEY UPDATE course_name=VALUES(course_name), required_hours=VALUES(required_hours);");
logStep("Courses seeded (BSCS, BSIS, BLIS).", "success");

// B. Training Site
$conn->query("INSERT IGNORE INTO Training_Site (site_id, site_code, site_name, location)
    VALUES (1, 'SBC-IT', 'SBC IT Department', 'M\\'lang, Cotabato');");
logStep("Default Training Site verified.", "success");

// C. Dean Admin
$seed_dean_email = $conn->real_escape_string(SEED_DEAN_EMAIL);
$seed_dean_pass = $conn->real_escape_string(SEED_DEAN_PASSWORD);
$conn->query("INSERT IGNORE INTO Users (user_id, full_name, email, password, role)
    VALUES (1, 'Dean Admin', '$seed_dean_email', '$seed_dean_pass', 'Dean');");
logStep("Dean account verified (" . SEED_DEAN_EMAIL . ") — change password after first login!", "success");

// D. Sample Student
$seed_stu_email = $conn->real_escape_string(SEED_STUDENT_EMAIL);
$seed_stu_pass = $conn->real_escape_string(SEED_STUDENT_PASS);
$conn->query("INSERT IGNORE INTO Student (student_id, student_number, full_name, id_no, email, password, course_id, dean_id)
    VALUES (1, '2026-0001', 'Juan Dela Cruz', 'ID-101', '$seed_stu_email', '$seed_stu_pass', 1, 1);");
logStep("Sample student verified (" . SEED_STUDENT_EMAIL . ") — change password after first login!", "success");

// E. OJT Record
$conn->query("INSERT IGNORE INTO OJT (ojt_id, ojt_no, site_id, student_id, required_hours)
    VALUES (1, 'OJT-2026-01', 1, 1, $def_hours);");
logStep("Sample OJT placement verified.", "success");

// 6. Table Counts
$tableCounts = [];
foreach (array_keys($tables) as $tbl) {
    $res = $conn->query("SELECT COUNT(*) as cnt FROM `$tbl`");
    $tableCounts[$tbl] = $res ? intval($res->fetch_assoc()['cnt'] ?? 0) : 'N/A';
}

logStep("Migration completed successfully!", "success");

// Output JSON
outputJson($status, $logs, $database, $tableCounts);

function outputJson($status, $logs, $database, $tableCounts)
{
    global $isCli;
    if (!$isCli) {
        header('Content-Type: application/json');
    }
    echo json_encode([
        "status" => $status,
        "database" => $database,
        "table_counts" => $tableCounts,
        "logs" => $logs
    ], JSON_PRETTY_PRINT);
}
?>