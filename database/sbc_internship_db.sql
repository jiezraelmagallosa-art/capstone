-- SBC Internship Attendance & Verification System Database Schema
-- Optimized for Universal Shared Hosting & InfinityFree MySQL
-- Database: if0_42771510_sbc_internship_db

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+08:00";

-- 1. Academic Program / Course Table
CREATE TABLE IF NOT EXISTS course (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    required_hours INT DEFAULT 480
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Partner Training Facilities Table
CREATE TABLE IF NOT EXISTS training_site (
    site_id INT PRIMARY KEY AUTO_INCREMENT,
    site_code VARCHAR(20) NOT NULL UNIQUE,
    site_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Dean & Admin Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Dean', 'Admin') DEFAULT 'Dean',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Student Roster Table
CREATE TABLE IF NOT EXISTS student (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    id_no VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    dean_id INT NULL,
    INDEX idx_student_course (course_id),
    INDEX idx_student_dean (dean_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. OJT Assignment Table
CREATE TABLE IF NOT EXISTS ojt (
    ojt_id INT PRIMARY KEY AUTO_INCREMENT,
    ojt_no VARCHAR(50) UNIQUE NOT NULL,
    site_id INT NOT NULL,
    student_id INT NOT NULL,
    required_hours INT DEFAULT 480,
    INDEX idx_ojt_site (site_id),
    INDEX idx_ojt_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Attendance Clock-In / Clock-Out Records
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    time_in_morning TIME NULL,
    time_out_morning TIME NULL,
    time_in_afternoon TIME NULL,
    time_out_afternoon TIME NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    morning_status VARCHAR(50) DEFAULT 'Pending',
    morning_remarks TEXT NULL,
    afternoon_status VARCHAR(50) DEFAULT 'Pending',
    afternoon_remarks TEXT NULL,
    remarks TEXT NULL,
    ojt_id INT NOT NULL,
    site_id INT NULL,
    INDEX idx_att_ojt (ojt_id),
    INDEX idx_att_site (site_id),
    INDEX idx_att_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Student Training Site Transfer History Table
CREATE TABLE IF NOT EXISTS student_site_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    site_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pulled_out_at TIMESTAMP NULL,
    is_current TINYINT(1) DEFAULT 1,
    remarks VARCHAR(255) NULL,
    INDEX idx_ssh_student (student_id),
    INDEX idx_ssh_site (site_id),
    INDEX idx_ssh_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Facial Verification Photo Logs Table
CREATE TABLE IF NOT EXISTS photo (
    photo_id INT PRIMARY KEY AUTO_INCREMENT,
    attendance_id INT NOT NULL,
    shift_type ENUM('Morning_In', 'Morning_Out', 'Afternoon_In', 'Afternoon_Out') NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_photo_att (attendance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Absence Requests Table
CREATE TABLE IF NOT EXISTS absence_requests (
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
    INDEX idx_abs_student (student_id),
    INDEX idx_abs_ojt (ojt_id),
    INDEX idx_abs_reviewed (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Student Daily Narrative Journal Table
CREATE TABLE IF NOT EXISTS daily_journal (
    journal_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    ojt_id INT NOT NULL,
    attendance_id INT NULL,
    entry_date DATE NOT NULL,
    tasks_completed TEXT NOT NULL,
    learnings_reflection TEXT NULL,
    challenges_encountered TEXT NULL,
    dean_feedback TEXT NULL,
    dean_status ENUM('Pending', 'Reviewed', 'Commended') DEFAULT 'Pending',
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dj_student (student_id),
    INDEX idx_dj_ojt (ojt_id),
    INDEX idx_dj_attendance (attendance_id),
    INDEX idx_dj_date (entry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Academic Courses
INSERT INTO course (course_code, course_name, required_hours) VALUES
('BSCS', 'Bachelor of Science in Computer Science', 480),
('BSIS', 'Bachelor of Science in Information Systems', 480),
('BLIS', 'Bachelor of Library and Information Science', 480)
ON DUPLICATE KEY UPDATE course_name=VALUES(course_name), required_hours=VALUES(required_hours);

-- Seed Initial Default Training Facility
INSERT IGNORE INTO training_site (site_code, site_name, location)
VALUES ('SBC-IT', 'SBC IT Department', 'M\'lang, Cotabato');

-- Seed Default Dean Administrator Account (Password: password)
INSERT IGNORE INTO users (user_id, full_name, email, password, role)
VALUES (1, 'Dean Admin', 'dean@sbc.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.X2g14m.6C', 'Dean');

-- Seed Demo Student Intern Account
INSERT IGNORE INTO student (student_id, student_number, full_name, id_no, email, password, course_id, dean_id)
VALUES (1, '2026-0001', 'Juan Dela Cruz', 'ID-101', 'student@sbc.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.X2g14m.6C', 1, 1);

-- Seed Initial OJT Enrollment Record
INSERT IGNORE INTO ojt (ojt_id, ojt_no, site_id, student_id, required_hours)
VALUES (1, 'OJT-2026-01', 1, 1, 480);

SET FOREIGN_KEY_CHECKS = 1;