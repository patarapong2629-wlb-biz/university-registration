DROP DATABASE IF EXISTS university;
CREATE DATABASE IF NOT EXISTS university CHARACTER SET utf8 COLLATE utf8_general_ci;
USE university;

CREATE TABLE faculties (
    id INT AUTO_INCREMENT,
    name varchar(255),
    description TEXT,
    created timestamp DEFAULT current_timestamp,
    updated timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
    PRIMARY KEY (id)
) CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE departments (
    id INT AUTO_INCREMENT,
    name varchar(255),
    description TEXT,
    faculty_id INT,
    created timestamp DEFAULT current_timestamp,
    updated timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
    PRIMARY KEY (id),
    INDEX idx_faculty_id (faculty_id)
) CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE students (
    id INT AUTO_INCREMENT,
    first_name varchar(255),
    last_name varchar(255),
    faculty_id INT,
    department_id INT,
    academic_year TINYINT,
    created timestamp DEFAULT current_timestamp,
    updated timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
    PRIMARY KEY (id),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_department_id (department_id),
    INDEX idx_year (academic_year)
) CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE courses (
    id INT AUTO_INCREMENT,
    code varchar(16) unique,
    name varchar(255),
    credits TINYINT,
    created timestamp DEFAULT current_timestamp,
    updated timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
    PRIMARY KEY (id)
) CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE pre_registrations (
    id INT AUTO_INCREMENT,
    student_id INT,
    course_code varchar(16),
    year INT,
    semester INT,
    created timestamp DEFAULT current_timestamp,
    updated timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
    PRIMARY KEY (id)
) CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE registrations (
    id INT AUTO_INCREMENT,
    student_id INT,
    course_code varchar(16),
    registration_type enum("PRE-REGISTRATION", "NORMAL"),
    year INT,
    semester INT,
    status enum("REGISTERED", "WITHDRAWN"),
    created timestamp DEFAULT current_timestamp,
    updated timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
    PRIMARY KEY (id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_code (course_code)
) CHARACTER SET utf8 COLLATE utf8_general_ci;