-- ==========================================================================
-- SBC Internship Attendance & Verification System Database Schema
-- ==========================================================================


CREATE DATABASE IF NOT EXISTS sbc_internship_db;
USE sbc_internship_db;


CREATE TABLE Course (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL
);


CREATE TABLE Training_Site (
    site_id INT PRIMARY KEY AUTO_INCREMENT,
    site_code VARCHAR(20) NOT NULL UNIQUE,
    site_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL
);


CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Dean', 'Admin') DEFAULT 'Dean',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Student (
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
);


CREATE TABLE OJT (
    ojt_id INT PRIMARY KEY AUTO_INCREMENT,
    ojt_no VARCHAR(50) UNIQUE NOT NULL,
    site_id INT NOT NULL,
    student_id INT NOT NULL,
    required_hours INT DEFAULT 480,
    FOREIGN KEY (site_id) REFERENCES Training_Site(site_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE
);


CREATE TABLE Attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    time_in_morning TIME NULL,
    time_out_morning TIME NULL,
    time_in_afternoon TIME NULL,
    time_out_afternoon TIME NULL,
    ojt_id INT NOT NULL,
    FOREIGN KEY (ojt_id) REFERENCES OJT(ojt_id) ON DELETE CASCADE
);


CREATE TABLE Photo (
    photo_id INT PRIMARY KEY AUTO_INCREMENT,
    attendance_id INT NOT NULL,
    shift_type ENUM('Morning_In', 'Morning_Out', 'Afternoon_In', 'Afternoon_Out') NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES Attendance(attendance_id) ON DELETE CASCADE
);


CREATE TABLE Absence_Requests (
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
);


INSERT INTO Course (course_code, course_name) VALUES
('BSCS', 'Bachelor of Science in Computer Science'),
('BSIS', 'Bachelor of Science in Information Systems'),
('BLIS', 'Bachelor of Library and Information Science')
ON DUPLICATE KEY UPDATE course_name=VALUES(course_name);

INSERT INTO Training_Site (site_code, site_name, location)
VALUES ('SBC-IT', 'SBC IT Department', 'M\'lang, Cotabato');


INSERT INTO Users (full_name, email, password, role)
VALUES ('Dean Admin', 'dean@sbc.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.X2g14m.6C', 'Dean');


INSERT INTO Student (student_number, full_name, id_no, email, password, course_id, dean_id)
VALUES ('2026-0001', 'Juan Dela Cruz', 'ID-101', 'student@sbc.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.X2g14m.6C', 1, 1);

INSERT INTO OJT (ojt_no, site_id, student_id, required_hours)
VALUES ('OJT-2026-01', 1, 1, 480);