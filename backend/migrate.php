<?php
/**
 * SBC Internship Attendance & Verification System
 * Database Migration & Setup Runner
 *
 * Can be run via:
 * 1. Web Browser: http://localhost/SBC_Internship_Attendance_System/backend/migrate.php
 * 2. Web Browser JSON: http://localhost/SBC_Internship_Attendance_System/backend/migrate.php?format=json
 * 3. Command Line (CLI): php backend/migrate.php
 */

// Load centralized config (edit backend/config.php to change settings)
require_once __DIR__ . '/config.php';

date_default_timezone_set(APP_TIMEZONE);

$isCli = (php_sapi_name() === 'cli');
$wantsJson = (!$isCli && (isset($_GET['format']) && $_GET['format'] === 'json')) || $isCli;

$logs = [];
$status = "success";

function logStep($message, $type = "info") {
    global $logs, $isCli;
    $logs[] = [
        "timestamp" => date('H:i:s'),
        "type"      => $type,
        "message"   => $message
    ];
    if ($isCli) {
        $prefix = ($type === 'error') ? '[ERROR]' : (($type === 'success') ? '[SUCCESS]' : '[INFO]');
        echo "$prefix $message\n";
    }
}

// 1. Connection Config — from backend/config.php
$host     = DB_HOST;
$username = DB_USER;
$password = DB_PASS;
$database = DB_NAME;
$port     = DB_PORT;

logStep("Connecting to MySQL server at $host:$port (User: $username)...");

// Connect without selecting DB first to create database if not exists
$conn = @new mysqli($host, $username, $password, "", $port);

if ($conn->connect_error) {
    $status = "error";
    logStep("MySQL connection failed: " . $conn->connect_error, "error");
    renderOutput($status, $logs, $database, []);
    exit();
}

logStep("Connected to MySQL server successfully.", "success");

// 2. Create Database if not exists
$createDbSql = "CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($conn->query($createDbSql)) {
    logStep("Database `$database` checked/created successfully.", "success");
} else {
    $status = "error";
    logStep("Failed to create database `$database`: " . $conn->error, "error");
    renderOutput($status, $logs, $database, []);
    exit();
}

// Select the database
$conn->select_db($database);
$conn->query("SET time_zone = '+08:00';");
$conn->set_charset("utf8mb4");

// 3. Define Table Schema Migrations
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

// 4. Run Incremental Alter Migrations (Self-Healing Schema)
// A. Check student.dean_id
$colDean = $conn->query("SHOW COLUMNS FROM Student LIKE 'dean_id'");
if ($colDean && $colDean->num_rows == 0) {
    if ($conn->query("ALTER TABLE Student ADD COLUMN dean_id INT NULL AFTER course_id")) {
        @$conn->query("ALTER TABLE Student ADD CONSTRAINT fk_student_dean FOREIGN KEY (dean_id) REFERENCES Users(user_id) ON DELETE SET NULL");
        logStep("Migrated: Added `dean_id` column to `Student` table.", "success");
    } else {
        logStep("Migration error adding `dean_id`: " . $conn->error, "error");
    }
}

// B. Check course.required_hours
$colCourseHours = $conn->query("SHOW COLUMNS FROM Course LIKE 'required_hours'");
if ($colCourseHours && $colCourseHours->num_rows == 0) {
    if ($conn->query("ALTER TABLE Course ADD COLUMN required_hours INT DEFAULT 480 AFTER course_name")) {
        @$conn->query("UPDATE Course SET required_hours = 480 WHERE required_hours IS NULL OR required_hours = 0");
        logStep("Migrated: Added `required_hours` column to `Course` table.", "success");
    } else {
        logStep("Migration error adding `required_hours` to `Course`: " . $conn->error, "error");
    }
}

// C. Check ojt.required_hours
$colOjtHours = $conn->query("SHOW COLUMNS FROM OJT LIKE 'required_hours'");
if ($colOjtHours && $colOjtHours->num_rows == 0) {
    if ($conn->query("ALTER TABLE OJT ADD COLUMN required_hours INT DEFAULT 480 AFTER student_id")) {
        @$conn->query("UPDATE OJT SET required_hours = 480 WHERE required_hours IS NULL OR required_hours = 0");
        logStep("Migrated: Added `required_hours` column to `OJT` table.", "success");
    }
}

// 5. Seed Initial Data — credentials come from backend/config.php (SEED_* constants)
$def_hours = DEFAULT_REQUIRED_HOURS;

// A. Courses Seed
$courseSeed = "INSERT INTO Course (course_code, course_name, required_hours) VALUES
    ('BSCS', 'Bachelor of Science in Computer Science', $def_hours),
    ('BSIS', 'Bachelor of Science in Information Systems', $def_hours),
    ('BLIS', 'Bachelor of Library and Information Science', $def_hours)
    ON DUPLICATE KEY UPDATE course_name=VALUES(course_name), required_hours=VALUES(required_hours);";
if ($conn->query($courseSeed)) {
    logStep("Course seeds synchronized (BSCS, BSIS, BLIS).", "success");
}

// B. Training Site Seed
$siteSeed = "INSERT IGNORE INTO Training_Site (site_id, site_code, site_name, location)
    VALUES (1, 'SBC-IT', 'SBC IT Department', 'M\'lang, Cotabato');";
if ($conn->query($siteSeed)) {
    logStep("Default Training Site verified.", "success");
}

// C. Dean Admin Seed — reads email/password from config.php
$seed_dean_email = $conn->real_escape_string(SEED_DEAN_EMAIL);
$seed_dean_pass  = $conn->real_escape_string(SEED_DEAN_PASSWORD);
$userSeed = "INSERT IGNORE INTO Users (user_id, full_name, email, password, role)
    VALUES (1, 'Dean Admin', '$seed_dean_email', '$seed_dean_pass', 'Dean');";
if ($conn->query($userSeed)) {
    logStep("Default Dean User verified (" . SEED_DEAN_EMAIL . ") — ⚠️  Change password after first login!", "success");
}

// D. Sample Student Seed — reads email/password from config.php
$seed_stu_email = $conn->real_escape_string(SEED_STUDENT_EMAIL);
$seed_stu_pass  = $conn->real_escape_string(SEED_STUDENT_PASS);
$studentSeed = "INSERT IGNORE INTO Student (student_id, student_number, full_name, id_no, email, password, course_id, dean_id)
    VALUES (1, '2026-0001', 'Juan Dela Cruz', 'ID-101', '$seed_stu_email', '$seed_stu_pass', 1, 1);";
if ($conn->query($studentSeed)) {
    logStep("Sample Student verified (" . SEED_STUDENT_EMAIL . ") — ⚠️  Change password after first login!", "success");
}

// E. OJT Record Seed
$ojtSeed = "INSERT IGNORE INTO OJT (ojt_id, ojt_no, site_id, student_id, required_hours)
    VALUES (1, 'OJT-2026-01', 1, 1, $def_hours);";
if ($conn->query($ojtSeed)) {
    logStep("Sample OJT placement verified.", "success");
}

// 6. Gather Table Counts
$tableCounts = [];
foreach (array_keys($tables) as $tbl) {
    $res = $conn->query("SELECT COUNT(*) as cnt FROM `$tbl`");
    if ($res) {
        $tableCounts[$tbl] = intval($res->fetch_assoc()['cnt'] ?? 0);
    } else {
        $tableCounts[$tbl] = 'N/A';
    }
}

logStep("Database migration completed successfully!", "success");

// Render Output
renderOutput($status, $logs, $database, $tableCounts);

function renderOutput($status, $logs, $database, $tableCounts) {
    global $wantsJson, $isCli;

    if ($wantsJson) {
        if (!$isCli) {
            header('Content-Type: application/json');
        }
        echo json_encode([
            "status"       => $status,
            "database"     => $database,
            "table_counts" => $tableCounts,
            "logs"         => $logs
        ], JSON_PRETTY_PRINT);
        return;
    }

    // HTML Output for Browser
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Database Migration - SBC Internship System</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #4361ee;
                --primary-hover: #3a56d4;
                --success: #10b981;
                --success-bg: rgba(16, 185, 129, 0.1);
                --error: #ef4444;
                --error-bg: rgba(239, 68, 68, 0.1);
                --bg: #0f172a;
                --card-bg: #1e293b;
                --card-border: #334155;
                --text-main: #f8fafc;
                --text-muted: #94a3b8;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: 'Plus Jakarta Sans', sans-serif;
                background-color: var(--bg);
                color: var(--text-main);
                min-height: 100vh;
                padding: 40px 20px;
                display: flex;
                justify-content: center;
                align-items: flex-start;
            }
            .container {
                max-width: 860px;
                width: 100%;
            }
            .card {
                background-color: var(--card-bg);
                border: 1px solid var(--card-border);
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                margin-bottom: 24px;
            }
            .card-header {
                padding: 24px 28px;
                border-bottom: 1px solid var(--card-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(to right, rgba(67, 97, 238, 0.05), transparent);
            }
            .header-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .header-title svg {
                width: 32px;
                height: 32px;
                fill: var(--primary);
            }
            .header-title h1 {
                font-size: 20px;
                font-weight: 700;
            }
            .status-badge {
                font-size: 13px;
                font-weight: 600;
                padding: 6px 14px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .status-badge.success {
                background-color: var(--success-bg);
                color: var(--success);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }
            .status-badge.error {
                background-color: var(--error-bg);
                color: var(--error);
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .card-body {
                padding: 28px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 16px;
                margin-bottom: 28px;
            }
            .stat-box {
                background-color: #0f172a;
                border: 1px solid var(--card-border);
                border-radius: 12px;
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .stat-name {
                font-size: 13px;
                color: var(--text-muted);
                font-weight: 500;
            }
            .stat-count {
                font-size: 24px;
                font-weight: 700;
                color: #38bdf8;
                font-family: 'JetBrains Mono', monospace;
            }
            .log-terminal {
                background-color: #0b0f19;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 18px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 13px;
                line-height: 1.6;
                max-height: 380px;
                overflow-y: auto;
            }
            .log-row {
                display: flex;
                gap: 12px;
                margin-bottom: 6px;
            }
            .log-time {
                color: #64748b;
                user-select: none;
            }
            .log-msg.info { color: #cbd5e1; }
            .log-msg.success { color: #34d399; }
            .log-msg.error { color: #f87171; font-weight: 600; }
            .actions {
                display: flex;
                gap: 12px;
                margin-top: 24px;
                justify-content: flex-end;
            }
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn-primary {
                background-color: var(--primary);
                color: white;
                border: none;
            }
            .btn-primary:hover {
                background-color: var(--primary-hover);
            }
            .btn-outline {
                background: transparent;
                border: 1px solid var(--card-border);
                color: var(--text-main);
            }
            .btn-outline:hover {
                background-color: #334155;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="card-header">
                    <div class="header-title">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm6 12c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-4c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V13z"/>
                        </svg>
                        <div>
                            <h1>Database Migration Status</h1>
                            <p style="font-size: 13px; color: var(--text-muted);">Target Database: <strong><?= htmlspecialchars($database) ?></strong></p>
                        </div>
                    </div>
                    <span class="status-badge <?= $status === 'success' ? 'success' : 'error' ?>">
                        <?= $status === 'success' ? '✔ Ready & Migrated' : '✖ Error Occurred' ?>
                    </span>
                </div>

                <div class="card-body">
                    <?php if (!empty($tableCounts)): ?>
                    <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Table Record Counts</h3>
                    <div class="stats-grid">
                        <?php foreach ($tableCounts as $tbl => $cnt): ?>
                        <div class="stat-box">
                            <span class="stat-name"><?= htmlspecialchars($tbl) ?></span>
                            <span class="stat-count"><?= htmlspecialchars((string)$cnt) ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>

                    <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Migration Execution Logs</h3>
                    <div class="log-terminal">
                        <?php foreach ($logs as $log): ?>
                            <div class="log-row">
                                <span class="log-time">[<?= htmlspecialchars($log['timestamp']) ?>]</span>
                                <span class="log-msg <?= htmlspecialchars($log['type']) ?>"><?= htmlspecialchars($log['message']) ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="actions">
                        <a href="migrate.php" class="btn btn-primary">⚡ Re-run Migration</a>
                        <a href="../web_admin/" class="btn btn-outline">Go to Web Admin →</a>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    <?php
}
?>
