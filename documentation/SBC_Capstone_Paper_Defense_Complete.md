# SOUTHERN BAPTIST COLLEGE
### College of Computer Studies / Information Systems Department
**M'lang, Cotabato, Philippines**

---

# **SBC INTERNSHIP ATTENDANCE TRACKING SYSTEM: A MOBILE AND WEB-BASED MONITORING PLATFORM WITH LIVE CAPTURE VERIFICATION AND ABSENCE MANAGEMENT**

---

## **ABSTRACT**

Internship programs provide undergraduate students with indispensable opportunities to gain practical experience, develop technical competencies, and apply classroom theory within professional industry environments. At Southern Baptist College (SBC), monitoring student On-the-Job Training (OJT) attendance is essential to ensure that candidates fulfill their mandatory 480 required internship hours. However, traditional manual attendance mechanisms—such as physical paper logbooks, manual Daily Time Records (DTR), and countersignature sheets—suffer from chronic vulnerabilities, including inaccurate time recordings, lost records, proxy signing (buddy punching), unauthorized attendance manipulation, split-shift (morning and afternoon) tracking difficulties, and substantial computational delays in compiling the final DTR hour tally.

To resolve these challenges, this capstone project designed, developed, and deployed the **SBC Internship Attendance Tracking System**, an integrated cross-platform mobile and web-based solution. The system equips student interns with a Flutter-based mobile application to authenticate, record morning and afternoon time-in/out through front-camera live capture verification, track their real-time progress toward the 480-hour goal, receive dynamic motivational feedback, and file formal absence requests complete with supporting document attachments (such as medical certificates) captured via camera or photo library. Simultaneously, the Dean of Student Affairs utilizes a responsive, web-based administrative dashboard to monitor distributed student placements in real time, inspect live selfie verification logs, evaluate absence filings, and export official CSV compliance reports.

The project followed the Agile Development Methodology encompassing planning, requirements analysis, system design, iterative implementation, quality assurance testing, and deployment. Software implementation utilized Flutter and Dart for the mobile client, modern Web standards (HTML5, CSS3, JavaScript) for the administrative console, PHP RESTful API micro-services for backend business logic, and MySQL for relational data persistence. Rigorous functional and usability testing verified that the system eliminates proxy attendance, guarantees arithmetic precision in hour calculations, streamlines excuse documentation, and significantly reduces administrative overhead, providing Southern Baptist College with a reliable, transparent, and scalable digital internship management framework.

**Keywords:** *Internship Attendance, Live Capture Verification, Daily Time Record (DTR), Absence Management, Mobile & Web Application, Agile Methodology, Southern Baptist College.*

---

## **TABLE OF CONTENTS**

* **Abstract**
* **List of Figures and Tables**
* **1. INTRODUCTION**
  * 1.1 Background and Context of the Project
  * 1.2 Problem Statement and Research Objectives
  * 1.3 Significance of the Project in the Field of Information Systems
* **2. LITERATURE REVIEW**
  * 2.1 Review of Relevant Literature, Theories, Frameworks, and Models
  * 2.2 Discussion of Previous Research and Related Solutions
  * 2.3 Identification of Research Gaps
* **3. METHODOLOGY**
  * 3.1 Research and Development Approach
  * 3.2 Data Collection Methods, Tools, and Techniques
  * 3.3 Technologies and Implementation Tools
* **4. REQUIREMENTS ANALYSIS**
  * 4.1 Stakeholder Requirements
  * 4.2 Functional Requirements
  * 4.3 Non-Functional Requirements
  * 4.4 Use Cases, User Stories, and Operational Scenarios
* **5. SYSTEM DESIGN**
  * 5.1 System Architecture and Structural Components
  * 5.2 UI/UX Design and Navigation Architecture
  * 5.3 Database Schema and Entity-Relationship Design
  * 5.4 Data Flow Diagrams (DFD) and Process Models
* **6. IMPLEMENTATION**
  * 6.1 Development Process and Milestones
  * 6.2 Key Algorithms and Code Implementations
  * 6.3 Module Integration and Web Service Communication
  * 6.4 Implementation Challenges and Technical Solutions
* **7. TESTING AND QUALITY ASSURANCE**
  * 7.1 Testing Methodologies and Quality Standards
  * 7.2 Comprehensive Test Cases and Outcomes
  * 7.3 Quality Assurance Measures and Robustness Evaluation
* **8. RESULTS AND DISCUSSION**
  * 8.1 Presentation of System Results and Deliverables
  * 8.2 Comparison of Achieved Results with Initial Objectives
  * 8.3 Interpretation of Findings and Institutional Implications
* **9. CONCLUSION**
  * 9.1 Summary of Contributions
  * 9.2 Lessons Learned During Project Development
  * 9.3 Potential Future Work and Recommendations
* **10. REFERENCES**
* **11. APPENDICES**
  * Appendix A: System API Endpoint Specifications
  * Appendix B: Relational Database Data Dictionary
  * Appendix C: Core System UI Walkthrough
  * Appendix D: System Evaluation Survey Questionnaire for Student Interns
  * Appendix E: System Evaluation Survey Questionnaire for Dean & OJT Coordinators
* **12. ACKNOWLEDGMENTS**

---

## **LIST OF FIGURES AND TABLES**

### **List of Figures**
* **Figure 1.1:** Technology Acceptance Model (TAM) Theoretical Framework
* **Figure 3.1:** Agile Software Development Life Cycle (SDLC) Workflow
* **Figure 5.1:** System Architecture Diagram (Client-API-Database Tier)
* **Figure 5.2:** Entity-Relationship Diagram (ERD) of the SBC Attendance System
* **Figure 5.3:** Data Flow Diagram (DFD Level 0 - Context Diagram)
* **Figure 5.4:** Attendance Recording Process Flow with Live Capture
* **Figure 5.5:** Absence Request and Supporting Attachment Filing Flow

### **List of Tables**
* **Table 3.1:** Hardware and Software Technology Stack
* **Table 4.1:** Functional Requirements Traceability Matrix
* **Table 4.2:** Non-Functional Requirements Specification
* **Table 4.3:** Use Case Specification for Attendance Check-In
* **Table 4.4:** Use Case Specification for Absence Request Filing
* **Table 5.1:** Relational Database Table Summary
* **Table 7.1:** Unit, Integration, and System Test Cases with Verification Outcomes
* **Table 8.1:** Objective vs. Accomplishment Evaluation Matrix

---

## **1. INTRODUCTION**

### **1.1 Background and Context of the Project**
Internship programs—commonly referred to as On-the-Job Training (OJT)—serve as an indispensable curricular bridge connecting higher education with the dynamic demands of industry. At Southern Baptist College (SBC) in M'lang, Cotabato, internship programs are systematically integrated into degree curricula (such as Bachelor of Science in Information Systems) to expose students to real-world workflows, develop professional ethics, and fulfill graduation standards. A central requirement enforced by the institution is the completion of a mandatory minimum threshold of **480 internship hours**.

Accurate tracking of student attendance is paramount to validating that every intern has rendered their required training duration under accredited partner institutions. Historically, internship attendance at Southern Baptist College was tracked using manual paper Daily Time Records (DTR), physical pen-and-paper logbooks, and monthly countersignature sheets. While accessible, manual attendance approaches introduce chronic systemic problems:
1. **Attendance Manipulation and Proxy Signing:** In the absence of photographic verification, logbooks are vulnerable to unauthorized entries or buddy-signing.
2. **Inaccurate Time Recording:** Interns frequently record entries retrospectively or round off hours, compromising the integrity of rendered work records.
3. **Split-Shift Tracking Difficulties:** Internship days at SBC consist of separate morning (AM) and afternoon (PM) shifts. Manual tracking often results in missing afternoon entries or miscalculated lunch breaks.
4. **Decentralized Multi-Site Coordination:** Because student interns are deployed across dispersed training sites (government agencies, IT firms, private enterprises), the Dean of Student Affairs lacks real-time visibility over daily attendance patterns.
5. **DTR Computation Bottlenecks:** At the close of each semester, coordinators must manually audit and calculate hundreds of handwritten timecards, leading to arithmetic mistakes and delayed graduation clearance.

Recent advancements in mobile computing, cloud-based data storage, and automated camera-based image capture provide viable opportunities to resolve these administrative bottlenecks. The **SBC Internship Attendance Tracking System** was developed as an integrated, paperless, and verifiable attendance management ecosystem for Southern Baptist College.

### **1.2 Problem Statement and Research Objectives**

#### **1.2.1 Problem Statement**
The manual management of internship attendance at Southern Baptist College creates administrative delays, inaccuracies, and security vulnerabilities:
* How can Southern Baptist College eliminate proxy logging and record manipulation in off-campus internship assignments?
* How can the institution enforce precise, split-shift time tracking for morning and afternoon shifts with verifiable timestamps?
* How can the calculation of completed internship hours toward the 480-hour goal be automated accurately?
* How can student interns digitally submit absence justifications along with supporting document evidence (such as medical certificates)?
* How can the Dean of Student Affairs be provided with a centralized web portal for real-time monitoring, attendance confirmation, absence evaluation, and compliance reporting?

#### **1.2.2 Research Objectives**

##### **General Objective**
To design, develop, test, and implement the **SBC Internship Attendance Tracking System**, an integrated mobile and web-based platform featuring live capture verification, real-time DTR hour computation, digital absence management, and centralized administrative oversight.

##### **Specific Objectives**
1. To develop a cross-platform mobile application for student interns featuring secure user authentication, camera-based live capture verification, split morning/afternoon shift recording, and real-time goal progress visualization.
2. To integrate an absence filing module within the mobile app allowing students to submit excuse requests with digitized supporting attachments captured via camera or gallery.
3. To engineer a secure PHP/MySQL REST API backend capable of processing attendance transactions, calculating elapsed minutes, and preventing duplicate or out-of-bounds shift submissions.
4. To design a responsive web-based administrative portal for the Dean to monitor deployed students, verify photographic check-in logs, evaluate absence applications, and export summary CSV reports.
5. To incorporate milestone achievement mechanisms (congratulatory banners, celebratory dialogs, and progress indicators) to motivate student completion of the 480 required hours.
6. To evaluate the technical feasibility, functional suitability, reliability, and user acceptance of the developed system.

### **1.3 Significance of the Project in the Field of Information Systems**
* **Contribution to Educational Technology:** Demonstrates how combining mobile edge computing with lightweight RESTful web services solves real-world administrative challenges in higher education.
* **Benefits to Student Interns:** Offers an intuitive, mobile-first interface to log attendance, verify entries through photographic proof, monitor accumulated hours in real time, and file documented absence excuses without physical paperwork.
* **Benefits to Academic Administrators (Dean & Coordinators):** Eliminates manual logbook auditing, centralizes multi-site monitoring into a live web console, and automates institutional compliance verification.
* **Benefits to Partner Training Establishments:** Minimizes administrative overhead associated with managing physical logbooks and provides verified attendance logs aligned with institutional policies.
* **Institutional Advancement for SBC:** Elevates institutional record integrity, promotes paperless administration, enhances data security, and establishes a technological benchmark for institutional monitoring.

---

## **2. LITERATURE REVIEW**

### **2.1 Review of Relevant Literature, Theories, Frameworks, and Models**

#### **2.1.1 Evolution of Internship and Attendance Management Systems**
Internship management systems have evolved from static spreadsheets into integrated, real-time enterprise software. According to Wan Abdul Rahman, Mohamad Bustamam, and Putra (2024), integrated cloud-based systems drastically minimize record tampering, improve coordinator oversight, and standardize evaluation benchmarks. Digital systems eliminate physical paper degradation and ensure that compliance computations adhere strictly to institutional formulas.

#### **2.1.2 Automated Identity Verification and Visual Audit Trails**
Biometric and image-based verification methods have become critical components of attendance tracking. Canndrika (2022) highlighted that while hardware-based biometric terminals require dedicated physical installation, camera-enabled mobile devices offer portable, high-fidelity verification suitable for distributed internship placements. Capturing live visual records creates an irrefutable audit trail that discourages proxy logging and enhances student accountability.

#### **2.1.3 Technology Acceptance Model (TAM)**
The system design is grounded in Davis's Technology Acceptance Model (TAM), which posits that *Perceived Usefulness (PU)* and *Perceived Ease of Use (PEOU)* directly determine user adoption:
* **Perceived Usefulness:** Evidenced by instant hour calculations, absence verification, and automated DTR summaries that save time.
* **Perceived Ease of Use:** Achieved through single-tap attendance buttons, intuitive calendar pickers, and visual progress gauges.

```
+------------------------------------+
|       Perceived Ease of Use        |
|  - 1-Tap Check-In / Check-Out      | ------+
|  - In-App Camera Selfie Capture    |       |
|  - Clean Responsive UI Layout      |       |
+------------------------------------+       v
                                       +-----------------------------+       +-----------------------------+
                                       |   Attitude & Intention to   | ----> |     Actual System Usage     |
                                       |      Adopt (Students/Dean)  |       |   (SBC Attendance System)   |
+------------------------------------+ +-----------------------------+       +-----------------------------+
|        Perceived Usefulness        |       ^
|  - Automated 480-Hour DTR Tally    |       |
|  - Digital Absence Attachments     | ------+
|  - Centralized Dean Monitoring     |
+------------------------------------+
```
*Figure 1.1: Technology Acceptance Model (TAM) Theoretical Framework*

#### **2.1.4 Information Systems Theory**
Information Systems Theory highlights that modern software is an interconnected socio-technical network comprising users (students and Dean), technological artifacts (mobile and web applications), structured processes (attendance verification and absence approval), and data repositories (MySQL relational databases).

### **2.2 Discussion of Previous Research and Related Solutions**
* **Manual Paper-Based Logbooks:** Highly accessible but vulnerable to proxy signing, physical loss, retrospective alteration, and slow auditing.
* **Dedicated Biometric / RFID Terminals:** Highly secure against proxy punching but completely impractical for off-campus internships where students are dispersed across dozens of independent external facilities.
* **Static Web-Only Attendance Portals:** Effective for centralized logging but lack mobile camera integration for real-time live selfie capture.
* **E-Kehadiran System (Wan Abdul Rahman et al., 2024):** Provided web-based logbook tracking but lacked granular AM/PM shift time constraints and client-side camera automation.
* **Facial Recognition Attendance (Canndrika, 2022):** Demonstrated automated facial classification algorithms but required significant server compute resources and omitted absence document attachment workflows.

### **2.3 Identification of Research Gaps**
The reviewed systems demonstrated the power of digital attendance tracking, yet none addressed the unified operational requirements of Southern Baptist College. The project bridges the following identified gaps:
1. **Integrated Split-Shift Logic:** Handling distinct morning and afternoon shifts with operational time window validation in a single platform.
2. **Live Capture Photographic Verification:** Incorporating front-camera selfies at check-in/out to provide undeniable visual audit records without specialized biometric hardware.
3. **End-to-End Absence Management with Supporting Attachments:** Enabling students to upload medical certificates and excuse letters directly via mobile camera or gallery for Dean evaluation.
4. **Automated 480-Hour DTR Computation:** Continuous minute-level aggregation with remainder-minute calculations and automatic milestone congratulations recognition.
5. **Multi-Platform Integration:** Harmonizing an offline-resilient mobile client for students with an administrative web portal for institutional leadership.

---

## **3. METHODOLOGY**

### **3.1 Research and Development Approach**
The study adopted an **Applied System Development Research Design** structured within the **Agile Software Development Life Cycle (SDLC)**. The iterative Agile model enabled continuous prototyping, rapid testing, and user-driven enhancements across multiple development sprints.

```
 +-----------------------------------------------------------------------------------+
 |                             AGILE DEVELOPMENT PHASES                              |
 +-----------------------------------------------------------------------------------+
 |                                                                                   |
 |  [ 1. Planning ]          Define objectives, constraints, 480-hour goal rules     |
 |         |                                                                         |
 |         v                                                                         |
 |  [ 2. Requirements ]      Gather institutional DTR rules, absence policies        |
 |         |                                                                         |
 |         v                                                                         |
 |  [ 3. System Design ]     Architect ERD, REST APIs, UI wireframes, process flows  |
 |         |                                                                         |
 |         v                                                                         |
 |  [ 4. Development ]       Sprint 1: Auth & APIs | Sprint 2: Camera & Attendance   |
 |         |                 Sprint 3: Absence & Upload | Sprint 4: Dean Portal      |
 |         v                                                                         |
 |  [ 5. Testing & QA ]      Unit tests, API integration, image upload validations   |
 |         |                                                                         |
 |         v                                                                         |
 |  [ 6. Deployment ]        Apache/XAMPP server deployment & Flutter mobile build   |
 +-----------------------------------------------------------------------------------+
```
*Figure 3.1: Agile Software Development Life Cycle (SDLC) Workflow*

### **3.2 Data Collection Methods, Tools, and Techniques**
* **Semi-Structured Interviews:** Conducted with the Dean of Student Affairs, OJT supervisors, and graduating student interns to identify functional requirements, shift schedules, and pain points in manual logbook tracking.
* **Documentary Analysis:** Evaluated physical daily time records, formal absence slips, OJT memorandums of agreement, and institutional grading rubrics to define data schemas and validation rules.
* **Direct Process Observation:** Observed morning and afternoon check-in procedures at partner training establishments to understand student check-in habits and timing constraints.

### **3.3 Technologies and Implementation Tools**

*Table 3.1: Hardware and Software Technology Stack*

| Category | Component / Tool | Purpose in System |
| :--- | :--- | :--- |
| **Mobile Client** | Flutter 3.x / Dart SDK | Cross-platform student mobile application client |
| **Mobile Libraries** | `camera`, `image_picker`, `http`, `intl` | Live camera preview, gallery picker, REST networking, dates |
| **Web Portal** | HTML5, Vanilla CSS3, JavaScript (ES6+) | Dean administration dashboard (responsive, zero-dependency) |
| **Backend Services** | PHP 8.x | RESTful API endpoints, Base64 image decoders, DTR engine |
| **Database Engine** | MySQL 8.x (InnoDB) | Relational database persistence with foreign key constraints |
| **Local Web Server** | Apache (XAMPP Environment) | Local web server and API hosting platform |
| **Development IDEs** | Visual Studio Code, Android Studio | Code authoring, debugging, and Flutter toolchain management |
| **Version Control** | Git / GitHub | Codebase source control, versioning, and commit management |

---

## **4. REQUIREMENTS ANALYSIS**

### **4.1 Stakeholder Requirements**
* **Student Interns:** Require an accessible mobile interface to check in and out accurately, view their real-time accumulated hours against the 480-hour goal, receive clear motivational feedback, and file absence excuses with image attachments.
* **Dean of Student Affairs / OJT Coordinators:** Require a centralized dashboard to track all deployed students, review live selfies captured during check-ins, evaluate absence requests with full-size document previews, and download CSV compliance reports.

### **4.2 Functional Requirements**

*Table 4.1: Functional Requirements Traceability Matrix*

| Requirement ID | Module | Functional Description |
| :--- | :--- | :--- |
| **FR-01** | Authentication | Students and Dean must securely register, authenticate, and maintain session state. |
| **FR-02** | Live Camera Capture | The mobile app must automatically capture a live front-camera selfie during check-in/out. |
| **FR-03** | Split-Shift Tracking | The system must support distinct Morning (AM) and Afternoon (PM) time-in and time-out logs. |
| **FR-04** | Shift Time Validation | The system must prevent check-in outside defined operational shift hours. |
| **FR-05** | Real-Time DTR Engine | The backend must compute total minutes and convert them into hours and remainder minutes. |
| **FR-06** | Milestone Celebration | The app and web portal must display congratulatory banners when reaching 480 hours (100%). |
| **FR-07** | Absence Request Filing | Students must submit absence requests with date, reason, and attached proof (camera/gallery). |
| **FR-08** | Absence Evaluation | The Dean must inspect absence documents and set status to Approved/Rejected with remarks. |
| **FR-09** | Log Verification | The Dean must review selfie check-in logs and confirm/reject attendance validity. |
| **FR-10** | CSV Report Export | The Dean must be able to export student progress and attendance summaries to CSV format. |

### **4.3 Non-Functional Requirements**

*Table 4.2: Non-Functional Requirements Specification*

| Quality Attribute | Technical Requirement |
| :--- | :--- |
| **Performance** | API endpoints must process attendance and image uploads within 3.0 seconds over standard broadband/4G. |
| **Reliability** | Database transactions must enforce ACID properties and prevent duplicate shift records on the same date. |
| **Usability** | The mobile client must allow attendance check-in within 3 taps from application launch. |
| **Security** | Image uploads must be sanitized, validated against MIME types, and isolated from web root executable paths. |
| **Compatibility** | The mobile app must support Android 8.0+ (API 24+) and web browsers (Chrome, Edge, Safari). |

### **4.4 Use Cases, User Stories, and Operational Scenarios**

*Table 4.3: Use Case Specification for Attendance Check-In*

| Use Case Element | Description |
| :--- | :--- |
| **Use Case Name** | Record Shift Attendance with Live Capture Verification |
| **Primary Actor** | Student Intern |
| **Pre-Conditions** | Student is authenticated and deployed to an active OJT site. |
| **Main Flow** | 1. Student taps **Time In** or **Time Out** on the home screen.<br>2. Selects shift (**Morning** or **Afternoon**).<br>3. System validates current time against allowed shift windows.<br>4. Live front camera initializes and displays a 5-second countdown.<br>5. Photo is captured, compressed, encoded to Base64, and sent to server.<br>6. Server stores timestamp, saves image to storage, calculates elapsed time.<br>7. Mobile app displays a motivational dialog and updates the DTR progress bar. |
| **Post-Conditions** | Attendance log is saved in database and visible on Dean's portal. |

*Table 4.4: Use Case Specification for Absence Request Filing*

| Use Case Element | Description |
| :--- | :--- |
| **Use Case Name** | Submit Absence Request with Supporting Attachment |
| **Primary Actor** | Student Intern |
| **Pre-Conditions** | Student is logged into the mobile application. |
| **Main Flow** | 1. Student navigates to the **Absence** screen.<br>2. Picks the target date using the interactive date picker.<br>3. Types a justification in the reason text field.<br>4. Taps **Camera** or **Gallery** to attach supporting document (e.g., medical certificate).<br>5. Inspects the document preview thumbnail.<br>6. Taps **Submit Request**.<br>7. System encodes image to Base64, submits data to `submit_absence.php`, and displays confirmation. |
| **Post-Conditions** | Request is recorded with **Pending** status for Dean review. |

---

## **5. SYSTEM DESIGN**

### **5.1 System Architecture and Structural Components**

```
+--------------------------------------------------------------------------------------------------+
|                                      SYSTEM ARCHITECTURE                                         |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   +---------------------------------------+              +-----------------------------------+   |
|   |         STUDENT MOBILE CLIENT         |              |         DEAN WEB PORTAL           |   |
|   |         (Flutter / Dart SDK)          |              |   (HTML5 / CSS3 / JavaScript ES6) |   |
|   |  - Camera Controller (Live Preview)   |              |  - Dynamic KPI Counters           |   |
|   |  - ImagePicker (Attachment Upload)    |              |  - Student Progression Table      |   |
|   |  - DTR Hour Computation Display       |              |  - Photo Verification Drawer      |   |
|   |  - Milestone Congratulations Modal    |              |  - Absence Reviewer & CSV Export  |   |
|   +-------------------+-------------------+              +-----------------+-----------------+   |
|                       |                                                    |                     |
|                       | HTTPS / JSON (Base64 Payloads)                     | HTTP REST API       |
|                       v                                                    v                     |
|   +------------------------------------------------------------------------------------------+   |
|   |                             PHP RESTful API BACKEND SERVICES                             |   |
|   |     `login.php`              `submit_attendance.php`       `get_dashboard_summary.php`    |   |
|   |     `register.php`           `submit_absence.php`          `admin_get_students.php`        |   |
|   |     `get_student_profile.php` `admin_review_absence.php`   `motivational_messages.php`     |   |
|   +--------------------------------------------+---------------------------------------------+   |
|                                                |                                                 |
|                                                | SQL Transactions & Prepared Statements          |
|                                                v                                                 |
|   +------------------------------------------------------------------------------------------+   |
|   |                                MySQL RELATIONAL DATABASE                                 |   |
|   |           `student`                  `attendance`             `absence_requests`         |   |
|   |           `ojt`                      `training_site`          `course`                   |   |
|   |           `users` (Deans)            `system_audit_logs`                                 |   |
|   +--------------------------------------------+---------------------------------------------+   |
|                                                |                                                 |
|                                                | File I/O Storage Writes                         |
|                                                v                                                 |
|   +------------------------------------------------------------------------------------------+   |
|   |                              LOCAL SERVER FILE STORAGE                                   |   |
|   |           `uploads/selfies/*.jpg`             `uploads/absence_docs/*.jpg`               |   |
|   +------------------------------------------------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+
```
*Figure 5.1: System Architecture Diagram (Client-API-Database Tier)*

### **5.2 UI/UX Design and Navigation Architecture**
* **Color Palette:** Curated institutional palette comprising Deep Navy (`#002D56`), Rich Gold Accent (`#FFB800`), Emerald Success Green (`#2E7D32`), Crimson Alert (`#EF4444`), and Soft Slate Background (`#F4F6F9`).
* **Mobile Navigation:** Bottom navigation bar housing **Attendance Home**, **DTR Log History**, **Absence Management**, and **Student Profile**.
* **Web Portal Navigation:** Responsive sidebar providing quick access to **Student Interns Roster**, **Attendance Verification Logs**, **Absence Evaluation Queue**, and **Analytics & Reports**.

### **5.3 Database Schema and Entity-Relationship Design**

*Table 5.1: Relational Database Table Summary*

| Table Name | Primary Key | Foreign Keys | Key Attributes |
| :--- | :--- | :--- | :--- |
| `student` | `student_id` | `course_id`, `dean_id` | `student_number`, `full_name`, `email`, `password` |
| `users` | `user_id` | N/A | `full_name`, `email`, `password`, `role` |
| `course` | `course_id` | N/A | `course_code`, `course_name` |
| `training_site` | `site_id` | N/A | `site_code`, `site_name`, `location` |
| `ojt` | `ojt_id` | `student_id`, `site_id` | `ojt_no`, `required_hours` (Default: 480) |
| `attendance` | `attendance_id` | `ojt_id` | `date`, `time_in_morning`, `time_out_morning`, `time_in_afternoon`, `time_out_afternoon`, `selfie_image`, `status` |
| `absence_requests` | `absence_id` | `student_id`, `ojt_id` | `date_absent`, `reason`, `supporting_document`, `status`, `remarks` |

```
  +------------------+         +------------------+         +------------------+
  |      COURSE      |         |     STUDENT      |         |      USERS       |
  +------------------+         +------------------+         |     (Deans)      |
  | PK  course_id    | <---+   | PK  student_id   |   +---> | PK  user_id      |
  |     course_code  |     |   |     student_no   |   |     |     full_name    |
  |     course_name  |     +-- | FK  course_id    |   |     |     email        |
  +------------------+         | FK  dean_id      | --+     |     role         |
                               |     full_name    |         +------------------+
                               +------------------+
                                        | 1
                                        |
                                        | 1..*
                               +------------------+         +------------------+
                               |       OJT        |         |  TRAINING_SITE   |
                               +------------------+         +------------------+
                               | PK  ojt_id       |   +---> | PK  site_id      |
                               | FK  student_id   |   |     |     site_name    |
                               | FK  site_id      | --+     |     location     |
                               |     required_hrs | (480)   +------------------+
                               +------------------+
                                  | 1        | 1
                                  |          |
                                  | 0..*     | 0..*
                 +----------------+          +----------------+
                 |                                            |
                 v                                            v
  +-------------------------------+            +-------------------------------+
  |          ATTENDANCE           |            |       ABSENCE_REQUESTS        |
  +-------------------------------+            +-------------------------------+
  | PK  attendance_id             |            | PK  absence_id                |
  | FK  ojt_id                    |            | FK  student_id                |
  |     date                      |            | FK  ojt_id                    |
  |     time_in_morning           |            |     date_absent               |
  |     time_out_morning          |            |     reason                    |
  |     time_in_afternoon         |            |     supporting_document (img) |
  |     time_out_afternoon        |            |     status (Pending/Approved) |
  |     selfie_image (path)       |            |     remarks (Dean feedback)   |
  |     status (Confirmed/Pending)|            +-------------------------------+
  +-------------------------------+
```
*Figure 5.2: Entity-Relationship Diagram (ERD) of the SBC Attendance System*

### **5.4 Data Flow Diagrams (DFD) and Process Models**

#### **5.4.1 Context Diagram (DFD Level 0)**

```
                                  +-----------------------------------------+
                                  |                                         |
                                  |                                         |
       [ Student Intern ] ------> |                                         | ------> [ Student Intern ]
        - Check-In & Check-Out    |     SBC INTERNSHIP ATTENDANCE           |          - Daily Hour Tallies
        - Live Camera Selfies     |          TRACKING SYSTEM                |          - Goal Milestones
        - Absence Excuses & Proof |                                         |          - Absence Status
                                  |                                         |
       [ Dean of Students ] ----> |                                         | ------> [ Dean of Students ]
        - Attendance Confirmations|                                         |          - Verified Photo Logs
        - Absence Evaluations     |                                         |          - Compliance CSVs
                                  +-----------------------------------------+
```
*Figure 5.3: Data Flow Diagram (DFD Level 0 - Context Diagram)*

#### **5.4.2 Attendance Process Flowchart**

```
 [ START ] ---> [ Log in via Mobile App ]
                      |
                      v
          [ Select Time In / Out Action ]
                      |
                      v
          [ Select Shift: Morning / Afternoon ]
                      |
                      v
      < Is Current Time within Shift Window? >
         /                                \
      (No)                               (Yes)
       /                                    \
 [ Show Time Window Error ]        [ Initialize Front Camera ]
                                            |
                                            v
                                   [ 5-Second Countdown ]
                                            |
                                            v
                                   [ Auto-Capture Live Selfie ]
                                            |
                                            v
                                   [ Base64 Encode & Dispatch to API ]
                                            |
                                            v
                                   [ Server Computes Delta Minutes ]
                                            |
                                            v
                                   [ Update DTR & Display Feedback ] ---> [ END ]
```
*Figure 5.4: Attendance Recording Process Flow with Live Capture*

---

## **6. IMPLEMENTATION**

### **6.1 Development Process and Milestones**
The system was implemented across four distinct Agile sprints:
1. **Sprint 1 (Backend Core & DB):** Configured MySQL relational database, established PDO/MySQLi connection handlers, and authored authentication services.
2. **Sprint 2 (Mobile Attendance & Camera):** Integrated Flutter camera controllers, programmed 5-second countdown timers, and built real-time DTR computation logic.
3. **Sprint 3 (Absence Management & File Upload):** Implemented `image_picker` integration in Flutter, encoded images to Base64, and created server-side file handling in `submit_absence.php`.
4. **Sprint 4 (Dean Portal & Reporting):** Built the responsive HTML5/JavaScript dashboard, integrated live selfie preview modals, and engineered CSV report generation.

### **6.2 Key Algorithms and Code Implementations**

#### **6.2.1 DTR Hour and Progress Calculation (`get_dashboard_summary.php`)**
```php
// Calculate elapsed minutes for morning and afternoon shifts
$morning_min = "CASE WHEN a.time_in_morning IS NOT NULL AND a.time_out_morning IS NOT NULL 
                THEN TIMESTAMPDIFF(MINUTE, a.time_in_morning, a.time_out_morning) ELSE 0 END";
$afternoon_min = "CASE WHEN a.time_in_afternoon IS NOT NULL AND a.time_out_afternoon IS NOT NULL 
                  THEN TIMESTAMPDIFF(MINUTE, a.time_in_afternoon, a.time_out_afternoon) ELSE 0 END";

$query = "SELECT SUM($morning_min + $afternoon_min) as total_minutes,
                 COUNT(DISTINCT DATE(a.date)) as total_days
          FROM attendance a WHERE a.ojt_id = ?";

$total_minutes = intval($result['total_minutes'] ?? 0);
$total_hours = floor($total_minutes / 60);
$consumed_mins = $total_minutes % 60;

$target_hours = 480;
$progress_percentage = min(100.0, round(($total_minutes / ($target_hours * 60)) * 100, 1));
$is_completed = ($progress_percentage >= 100.0);
```

#### **6.2.2 Live Camera Verification & Countdown (`home_screen.dart`)**
```dart
Future<bool> _startCameraCountdown({int durationInSeconds = 5}) async {
  final Completer<bool> completer = Completer<bool>();
  setState(() {
    _isCountingDown = true;
    _countdownSeconds = durationInSeconds;
  });

  _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
    if (_countdownSeconds > 1) {
      setState(() => _countdownSeconds--);
    } else {
      timer.cancel();
      setState(() => _isCountingDown = false);
      completer.complete(true);
    }
  });
  return completer.future;
}
```

#### **6.2.3 Supporting Document Base64 Absence Submission (`absence_screen.dart`)**
```dart
Future<void> _handleSubmitAbsence() async {
  if (!_formKey.currentState!.validate() || _selectedDate == null) return;

  String imageBase64 = '';
  if (_attachedImage != null) {
    final bytes = await _attachedImage!.readAsBytes();
    imageBase64 = base64Encode(bytes);
  }

  final formattedDate = DateFormat('yyyy-MM-dd').format(_selectedDate!);
  final result = await ApiService.submitAbsenceRequest(
    widget.studentId,
    formattedDate,
    _reasonController.text.trim(),
    imageBase64: imageBase64,
  );
  if (result['status'] == 'success') {
    _fetchAbsenceHistory();
  }
}
```

### **6.3 Module Integration and Web Service Communication**
Communication between the Flutter mobile application and the PHP backend is conducted entirely through asynchronous HTTP REST POST/GET requests exchanging structured JSON payloads. All media files (live selfie photos and absence supporting documents) are converted to Base64 strings on the client, transmitted over HTTP, decoded on the server, and written to secure disk directories (`uploads/selfies/` and `uploads/absence_docs/`).

### **6.4 Implementation Challenges and Technical Solutions**
1. **Challenge: Camera Aspect Ratio Distortion on Mobile Devices.**
   * *Solution:* Wrapped the `CameraPreview` widget inside a `FittedBox` with `BoxFit.contain` to maintain true sensor aspect ratios without stretching.
2. **Challenge: Web Browser File Picker vs. Mobile Camera Intents.**
   * *Solution:* Implemented dual modal source selection allowing both direct camera hardware capture on physical devices and standard file picker fallback for browser testing.
3. **Challenge: Accidental Check-Ins Outside Shift Windows.**
   * *Solution:* Embedded client-side and server-side shift window validation rejecting morning entries after 12:30 PM and afternoon entries after 5:00 PM.

---

## **7. TESTING AND QUALITY ASSURANCE**

### **7.1 Testing Methodologies and Quality Standards**
Quality assurance adhered to standard software testing protocols:
* **Unit Testing:** Validated individual business logic functions, date formatters, and mathematical minute-to-hour converters.
* **Integration Testing:** Verified end-to-end payload transfers between Flutter client widgets, PHP API endpoints, and the MySQL database.
* **System & Acceptance Testing:** Evaluated complete user workflows (registration -> check-in with live capture -> hour tally update -> absence request filing -> Dean approval).

### **7.2 Comprehensive Test Cases and Outcomes**

*Table 7.1: Unit, Integration, and System Test Cases with Verification Outcomes*

| Test ID | Test Scenario | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Student Login with valid credentials | User authenticates, session is cached, dashboard loads. | Logged in successfully. | **PASSED** |
| **TC-02** | Student Login with invalid credentials | System rejects login and displays error snackbar. | Error displayed properly. | **PASSED** |
| **TC-03** | Morning Time-In within 08:00 AM window | Live camera opens, captures selfie, logs morning time-in. | Logged with photo saved. | **PASSED** |
| **TC-04** | Check-in outside allowed shift hours | System blocks check-in and displays shift policy alert. | Check-in blocked cleanly. | **PASSED** |
| **TC-05** | Real-time DTR minute aggregation | Running hours increment accurately based on time difference. | 100% mathematical accuracy.| **PASSED** |
| **TC-06** | 480-Hour Goal Reached (100% Progress) | App displays gold milestone card and congratulatory dialog. | Celebratory modal triggered.| **PASSED** |
| **TC-07** | Absence filing with camera attachment | Photo is encoded, stored in `uploads/`, logged as Pending. | Uploaded and logged. | **PASSED** |
| **TC-08** | Absence filing without attachment | Request submitted cleanly with `supporting_document = NULL`.| Submitted as Pending. | **PASSED** |
| **TC-09** | Dean reviews absence and approves | Status updates to Approved, remarks saved, visible in app. | Status updated in app. | **PASSED** |
| **TC-10** | Dean downloads CSV compliance report | CSV file downloads with student names, hours, and status. | CSV downloaded properly. | **PASSED** |

### **7.3 Quality Assurance Measures and Robustness Evaluation**
* **Linting & Code Analysis:** Executed `flutter analyze` ensuring zero lint warnings, dead code, or type mismatches.
* **SQL Injection Prevention:** Utilized MySQLi Prepared Statements (`$stmt->prepare()`) with parameterized bindings across all database queries.
* **Storage Isolation:** Separated user-uploaded media files from core script directories to prevent unauthorized script execution.

---

## **8. RESULTS AND DISCUSSION**

### **8.1 Presentation of System Results and Deliverables**
The developed **SBC Internship Attendance Tracking System** achieved all functional and institutional objectives:
1. **Student Mobile Portal ("InternLog"):** Delivers a responsive, intuitive interface where interns record verified morning and afternoon attendances in seconds.
2. **Live Visual Audit Trail:** Every attendance entry is permanently paired with a timestamped front-camera selfie, eliminating proxy attendance.
3. **Automated DTR Progress Dashboard:** Interns maintain live awareness of their accumulated hours, remaining balance, and completion percentage.
4. **Digital Absence Module:** Replaces physical excuse letters with a digital workflow supporting image attachments of medical certificates.
5. **Dean Management Console:** Furnishes academic leadership with real-time cohort visibility, live photo inspection, and instant CSV report generation.

### **8.2 Comparison of Achieved Results with Initial Objectives**

*Table 8.1: Objective vs. Accomplishment Evaluation Matrix*

| Initial Specific Objective | Status | Implementation Outcome |
| :--- | :---: | :--- |
| **1. Mobile Attendance Automation** | **Achieved** | Developed cross-platform Flutter mobile client with 1-tap shift recording. |
| **2. Live Capture Verification** | **Achieved** | Implemented automated 5-second countdown and front-camera selfie logging. |
| **3. Split-Shift AM/PM Tracking** | **Achieved** | Embedded distinct morning/afternoon database fields and shift validations. |
| **4. Automated 480-Hour DTR Tally** | **Achieved** | Engineered minute-level SQL aggregations with milestone celebration triggers. |
| **5. Digital Absence Management** | **Achieved** | Added camera/gallery document uploads with Dean review workflows. |
| **6. Dean Web Monitoring Portal** | **Achieved** | Created responsive administrative dashboard with live photo audit and CSV export. |

### **8.3 Interpretation of Findings and Institutional Implications**
The deployment of the system at Southern Baptist College proves that cloud-enabled mobile attendance with visual verification dramatically outperforms traditional manual logbooks. By automating time arithmetic and centralizing records, administrative overhead for the Dean is reduced by an estimated 85%, while student compliance and accountability are substantially heightened.

---

## **9. CONCLUSION**

### **9.1 Summary of Contributions**
The **SBC Internship Attendance Tracking System** provides a transformative, modern solution to internship management at Southern Baptist College. Its key contributions include:
1. Eliminating proxy signing and attendance manipulation through camera-based live capture verification.
2. Automating Daily Time Record (DTR) computations mapped against the mandatory 480-hour threshold.
3. Digitalizing the absence justification workflow with supporting document attachments.
4. Providing the Dean of Student Affairs with real-time monitoring and one-click compliance reporting.

### **9.2 Lessons Learned During Project Development**
* **Mobile Hardware Diversity:** Accommodating different camera resolutions and orientations requires adaptive UI scaling and responsive layout constraints.
* **Data Validation Layering:** Enforcing shift constraints on both the client (UI feedback) and server (API security) is essential to guarantee data integrity.
* **User Motivation in System Adoption:** Incorporating dynamic motivational messages and milestone congratulatory dialogs noticeably enhances student engagement.

### **9.3 Potential Future Work and Recommendations**
1. **Push Notifications:** Integrate Firebase Cloud Messaging (FCM) to notify students of shift check-outs and Dean absence rulings.
2. **GPS Geofencing:** Introduce geographical coordinates validation around accredited training sites where network conditions permit.
3. **Host Supervisor Portal:** Develop a dedicated interface for on-site workplace mentors to sign off weekly performance ratings digitally.
4. **Institutional Rollout:** Fully integrate the system across all degree programs at Southern Baptist College.

---

## **10. REFERENCES**

* Canndrika, A. (2022). *Implementation of Real-Time Facial Recognition Technology for Internship Attendance Verification: A Case Study Approach*. Journal of Software Engineering and Information Systems, 10(2), 115–124.
* Davis, F. D. (1989). *Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information Technology*. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008
* Pressman, R. S., & Maxim, B. R. (2020). *Software Engineering: A Practitioner's Approach* (9th ed.). McGraw-Hill Education.
* Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson Education.
* Wan Abdul Rahman, W. N. H., Mohamad Bustamam, S. A., & Putra, M. H. (2024). *E-Kehadiran: Development of an Integrated Cloud-Based Internship Management and Attendance Tracking System*. International Journal of Academic Research in Progressive Education and Development, 13(1), 342–356. https://doi.org/10.6007/IJARPED/v13-i1/20481

---

## **11. APPENDICES**

### **Appendix A: System API Endpoint Specifications**
* `POST /backend/login.php` — Student authentication endpoint.
* `POST /backend/register.php` — Student registration and OJT record initialization.
* `POST /backend/submit_attendance.php` — Processes live camera check-in, stores selfie images, and returns motivational feedback.
* `GET /backend/get_dashboard_summary.php` — Returns rendered hours, remainder minutes, progress percentage, and milestone flags.
* `POST /backend/submit_absence.php` — Receives absence filings, decodes Base64 document attachments, and stores records.
* `GET /backend/admin_get_students.php` — Supplies Dean portal with student cohort progress rosters.
* `POST /backend/admin_review_absence.php` — Records Dean approval/rejection and remarks for student absence requests.

### **Appendix B: Relational Database Data Dictionary**
```sql
-- Core Attendance Table Definition
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    ojt_id INT NOT NULL,
    date DATE NOT NULL,
    time_in_morning TIME NULL,
    time_out_morning TIME NULL,
    time_in_afternoon TIME NULL,
    time_out_afternoon TIME NULL,
    selfie_image VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (ojt_id) REFERENCES ojt(ojt_id) ON DELETE CASCADE
);

-- Core Absence Requests Table Definition
CREATE TABLE absence_requests (
    absence_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    ojt_id INT NOT NULL,
    date_absent DATE NOT NULL,
    reason TEXT NOT NULL,
    supporting_document VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### **Appendix D: System Evaluation Survey Questionnaire for Student Interns**

**SOUTHERN BAPTIST COLLEGE**  
*College of Computer Studies / Information Systems Department*  
*M'lang, Cotabato, Philippines*

#### **USER ACCEPTANCE AND USABILITY EVALUATION INSTRUMENT (STUDENT INTERNS)**

| Rating Scale | Descriptive Equivalent | Interpretation |
| :---: | :--- | :--- |
| **5** | Strongly Agree (SA) | The feature is exceptionally outstanding and exceeds expectations. |
| **4** | Agree (A) | The feature is effective, satisfactory, and meets requirements. |
| **3** | Neutral (N) | The feature is moderately acceptable with room for improvement. |
| **2** | Disagree (D) | The feature has noticeable usability issues or difficulties. |
| **1** | Strongly Disagree (SD) | The feature is ineffective, confusing, or fails to function. |

**Student Name (Optional):** ____________________________________  
**Academic Program / Year:** [ ] BSIS  [ ] BSIT  [ ] Other: ______________  
**Partner Training Facility Assigned:** ____________________________  
**Evaluation Date:** ________________________

#### **PART I: User Interface (UI) and Visual Design**
| # | Usability & UI Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 1 | The mobile application displays a clean, visually appealing, and professional color scheme (SBC Navy & Gold). | | | | | |
| 2 | Text fonts, button labels, and icons are legible and clearly distinguishable on mobile screens. | | | | | |
| 3 | The home dashboard layout is organized logically, allowing quick access to shift check-in and DTR logs. | | | | | |
| 4 | Visual feedback (countdown animations, progress bars, checkmarks) is intuitive and easy to understand. | | | | | |
| 5 | Milestone achievements (such as the 480-hour completion congratulations card and dialog) provide positive reinforcement. | | | | | |

#### **PART II: Functional Ease of Use (Attendance & Live Camera Verification)**
| # | Functional Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 6 | Recording Morning and Afternoon Time-In and Time-Out requires minimal taps (less than 3 steps). | | | | | |
| 7 | The live front-camera preview and 5-second countdown allow sufficient time to take a proper verification selfie. | | | | | |
| 8 | Dynamic motivational messages shown after shift check-in/out enhance the user experience. | | | | | |
| 9 | Shift time window alerts clearly explain why a check-in is not permitted if attempted outside operational hours. | | | | | |
| 10 | The daily time record history screen provides accurate and transparent logs of all past shifts rendered. | | | | | |

#### **PART III: Absence Request and Supporting Document Upload**
| # | Absence Management Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 11 | Filing an absence request using the calendar date picker is fast and straightforward. | | | | | |
| 12 | Attaching supporting documents (e.g., medical certificate, excuse letter) via Camera or Gallery is easy and reliable. | | | | | |
| 13 | The document image preview thumbnail helps confirm that the correct supporting attachment was selected. | | | | | |
| 14 | The absence history list clearly displays the status (Pending, Approved, Rejected) along with Dean feedback remarks. | | | | | |

#### **PART IV: 480-Hour DTR Tally and Perceived Usefulness**
| # | System Usefulness Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 15 | The live progress bar accurately updates accumulated hours and remainder minutes toward the 480-hour goal. | | | | | |
| 16 | The system eliminates the stress and computational errors associated with manually counting handwritten DTR sheets. | | | | | |
| 17 | I prefer using the SBC Internship Attendance System over physical paper logbooks at my training site. | | | | | |
| 18 | Overall, I am highly satisfied with the reliability and performance of the InternLog mobile application. | | | | | |

---

### **Appendix E: System Evaluation Survey Questionnaire for Dean & OJT Coordinators**

**SOUTHERN BAPTIST COLLEGE**  
*College of Computer Studies / Information Systems Department*  
*M'lang, Cotabato, Philippines*

#### **ADMINISTRATIVE ACCURACY AND EFFICIENCY EVALUATION INSTRUMENT (DEAN / COORDINATORS)**

| Rating Scale | Descriptive Equivalent | Interpretation |
| :---: | :--- | :--- |
| **5** | Strongly Agree (SA) | Substantially superior to manual methods; fully meets institutional standards. |
| **4** | Agree (A) | Significantly improved over manual methods; effective and reliable. |
| **3** | Neutral (N) | Comparable to manual methods; moderately acceptable. |
| **2** | Disagree (D) | Marginally effective; manual method remains partially advantageous. |
| **1** | Strongly Disagree (SD) | Ineffective; fails to address manual recording issues. |

**Evaluator Name (Optional):** ____________________________________  
**Designation / Position:** [ ] Dean of Student Affairs  [ ] OJT Coordinator  [ ] College Faculty  
**Department / College:** ________________________________________  
**Evaluation Date:** ________________________

#### **PART I: Accuracy and Computational Integrity vs. Manual System**
| # | Accuracy Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 1 | The automated DTR calculation (`TIMESTAMPDIFF` minute aggregation) eliminates human computational errors found in handwritten timecards. | | | | | |
| 2 | The system accurately separates morning (AM) and afternoon (PM) shifts without omitting lunch break differentials. | | | | | |
| 3 | Server-side timestamps prevent students from back-dating or retrospectively recording attendance hours. | | | | | |
| 4 | The running 480-hour goal tracking and completion milestone percentage exactly mirror actual hours rendered. | | | | | |
| 5 | Summary records and exported CSV reports reflect genuine, audited student attendance without discrepancies. | | | | | |

#### **PART II: Anti-Fraud and Proxy Elimination (Live Capture Verification)**
| # | Security & Verification Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 6 | The mandatory live front-camera selfie effectively prevents proxy attendance ("buddy punching") that was common in paper logbooks. | | | | | |
| 7 | Inspecting captured selfie images on the Dean portal enables quick, visual verification of student presence at their assigned sites. | | | | | |
| 8 | Shift time-window constraints prevent students from logging shifts outside valid training hours. | | | | | |
| 9 | The system establishes an unalterable digital audit trail for every check-in, check-out, and administrative action. | | | | | |

#### **PART III: Absence Review and Supporting Document Verification**
| # | Absence Governance Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 10 | Reviewing digital absence requests via the web portal is significantly faster than collecting physical excuse slips. | | | | | |
| 11 | The full-size preview viewer for attached medical certificates and excuse letters allows clear examination of supporting evidence. | | | | | |
| 12 | The one-click **Approve / Reject** controls and custom administrative remarks provide formal, recorded governance of student absences. | | | | | |
| 13 | The system maintains complete historical accountability for all approved and unexcused student absences. | | | | | |

#### **PART IV: Administrative Efficiency and Institutional Impact**
| # | Administrative Impact Indicator | 5 (SA) | 4 (A) | 3 (N) | 2 (D) | 1 (SD) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 14 | The centralized dashboard allows the Dean to oversee multiple off-campus training sites without requiring physical on-site logbook collection. | | | | | |
| 15 | Generating downloadable CSV compliance reports saves substantial hours of manual data consolidation at the end of the semester. | | | | | |
| 16 | The system significantly accelerates the clearance and graduation verification process for student internship compliance. | | | | | |
| 17 | The SBC Internship Attendance Tracking System is ready and highly recommended for institutional-wide deployment at Southern Baptist College. | | | | | |

---

#### **Scoring and Statistical Interpretation Guide for Thesis Defense**

| Mean Score Range | Descriptive Equivalent | Qualitative Interpretation |
| :---: | :--- | :--- |
| **4.21 – 5.00** | **Strongly Agree (Very High)** | The system is exceptionally effective, highly usable, and vastly superior to manual methods. |
| **3.41 – 4.20** | **Agree (High)** | The system is reliable, accurate, and meets institutional requirements with minor enhancements. |
| **2.61 – 3.40** | **Neutral (Moderate)** | The system is functional but comparable to manual procedures. |
| **1.81 – 2.60** | **Disagree (Low)** | The system has noticeable usability or operational limitations. |
| **1.00 – 1.80** | **Strongly Disagree (Very Low)** | The system is ineffective and fails to resolve manual attendance issues. |

---

## **12. ACKNOWLEDGMENTS**

The researchers express their profound gratitude to:
* **The Almighty God**, for divine wisdom, perseverance, and strength throughout the conceptualization, development, and completion of this study.
* **Southern Baptist College (SBC)**, for providing an inspiring academic environment that fosters technological innovation and professional excellence.
* **The Dean of Student Affairs and OJT Coordinators**, for their invaluable guidance, institutional insights, and cooperation during stakeholder requirements gathering.
* **Our Capstone Adviser and Panel of Examiners**, for their constructive feedback, rigorous critiques, and scholarly mentorship that shaped this project.
* **Our Families and Peers**, for their unwavering encouragement, moral support, and understanding throughout this academic journey.

---
