<?php
/**
 * SBC Internship Attendance System - Site Transfer & History Helper
 * File: backend/site_helper.php
 * 
 * Computes multi-site attendance hour breakdown:
 * - Previous sites retain their logged hours with label "Previous Location"
 * - The current active site appears below labeled "Current Location"
 * - Total hours accumulate seamlessly across all training facilities
 */

if (!function_exists('getStudentSiteBreakdown')) {
    function getStudentSiteBreakdown($conn, $student_id) {
        $student_id = intval($student_id);
        if ($student_id <= 0) {
            return [
                "sites" => [],
                "total_minutes" => 0,
                "total_hours" => 0,
                "remaining_minutes" => 0,
                "formatted_rendered_time" => "0 hrs 0 mins"
            ];
        }

        // 1. Identify current active site_id from ojt
        $current_site_id = 0;
        $ojt_stmt = $conn->prepare("SELECT site_id FROM ojt WHERE student_id = ? LIMIT 1");
        if ($ojt_stmt) {
            $ojt_stmt->bind_param("i", $student_id);
            $ojt_stmt->execute();
            $res = $ojt_stmt->get_result();
            if ($row = $res->fetch_assoc()) {
                $current_site_id = intval($row['site_id']);
            }
            $ojt_stmt->close();
        }

        // 2. Discover all distinct site_ids associated with this student
        $site_ids = [];
        if ($current_site_id > 0) {
            $site_ids[$current_site_id] = true;
        }

        // From student_site_history
        $hist_stmt = $conn->prepare("SELECT DISTINCT site_id FROM student_site_history WHERE student_id = ?");
        if ($hist_stmt) {
            $hist_stmt->bind_param("i", $student_id);
            $hist_stmt->execute();
            $h_res = $hist_stmt->get_result();
            while ($h_row = $h_res->fetch_assoc()) {
                $site_ids[intval($h_row['site_id'])] = true;
            }
            $hist_stmt->close();
        }

        // From attendance stamped site_id
        $att_site_stmt = $conn->prepare("SELECT DISTINCT a.site_id FROM attendance a JOIN ojt o ON a.ojt_id = o.ojt_id WHERE o.student_id = ? AND a.site_id IS NOT NULL");
        if ($att_site_stmt) {
            $att_site_stmt->bind_param("i", $student_id);
            $att_site_stmt->execute();
            $as_res = $att_site_stmt->get_result();
            while ($as_row = $as_res->fetch_assoc()) {
                $site_ids[intval($as_row['site_id'])] = true;
            }
            $att_site_stmt->close();
        }

        // If no sites found, default to site 1
        if (empty($site_ids)) {
            $site_ids[1] = true;
            $current_site_id = 1;
        }

        $all_site_ids = array_keys($site_ids);
        $sites_output = [];
        $grand_total_minutes = 0;

        $morning_calc = "CASE WHEN (a.status IS NULL OR a.status != 'Rejected') AND (a.morning_status IS NULL OR a.morning_status != 'Rejected') AND a.time_in_morning IS NOT NULL AND a.time_out_morning IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, a.time_in_morning, a.time_out_morning) ELSE 0 END";
        $afternoon_calc = "CASE WHEN (a.status IS NULL OR a.status != 'Rejected') AND (a.afternoon_status IS NULL OR a.afternoon_status != 'Rejected') AND a.time_in_afternoon IS NOT NULL AND a.time_out_afternoon IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, a.time_in_afternoon, a.time_out_afternoon) ELSE 0 END";

        foreach ($all_site_ids as $sid) {
            $sid = intval($sid);
            if ($sid <= 0) continue;

            // Fetch site information
            $site_info = [
                "site_id" => $sid,
                "site_code" => "SITE-" . $sid,
                "site_name" => "Training Facility #" . $sid,
                "location" => "Cotabato"
            ];

            $s_stmt = $conn->prepare("SELECT site_id, site_code, site_name, location FROM training_site WHERE site_id = ? LIMIT 1");
            if ($s_stmt) {
                $s_stmt->bind_param("i", $sid);
                $s_stmt->execute();
                $s_res = $s_stmt->get_result();
                if ($s_row = $s_res->fetch_assoc()) {
                    $site_info = [
                        "site_id" => intval($s_row['site_id']),
                        "site_code" => $s_row['site_code'],
                        "site_name" => $s_row['site_name'],
                        "location" => $s_row['location'] ?? 'Cotabato'
                    ];
                }
                $s_stmt->close();
            }

            // Calculate hours rendered at this specific site excluding rejected shifts
            $calc_sql = "SELECT 
                            SUM($morning_calc + $afternoon_calc) as site_minutes,
                            COUNT(DISTINCT CASE WHEN (a.status IS NULL OR a.status != 'Rejected') AND (((a.morning_status IS NULL OR a.morning_status != 'Rejected') AND a.time_in_morning IS NOT NULL) OR ((a.afternoon_status IS NULL OR a.afternoon_status != 'Rejected') AND a.time_in_afternoon IS NOT NULL)) THEN a.date ELSE NULL END) as site_days
                         FROM attendance a
                         JOIN ojt o ON a.ojt_id = o.ojt_id
                         WHERE o.student_id = ? 
                           AND (a.site_id = ? OR (a.site_id IS NULL AND o.site_id = ?))";

            $calc_stmt = $conn->prepare($calc_sql);
            $calc_stmt->bind_param("iii", $student_id, $sid, $sid);
            $calc_stmt->execute();
            $calc_row = $calc_stmt->get_result()->fetch_assoc();
            $calc_stmt->close();

            $site_mins = intval($calc_row['site_minutes'] ?? 0);
            $site_days = intval($calc_row['site_days'] ?? 0);
            $grand_total_minutes += $site_mins;

            $s_hours = floor($site_mins / 60);
            $s_rem_mins = $site_mins % 60;

            $is_current = ($sid === $current_site_id);
            $label = $is_current ? "Current Location" : "Previous Location";

            $sites_output[] = [
                "site_id" => $site_info['site_id'],
                "site_code" => $site_info['site_code'],
                "site_name" => $site_info['site_name'],
                "location" => $site_info['location'],
                "is_current" => $is_current,
                "label" => $label,
                "status_badge" => $is_current ? "Active (Current)" : "Pulled Out (Previous)",
                "total_minutes" => $site_mins,
                "total_hours" => $s_hours,
                "remaining_minutes" => $s_rem_mins,
                "formatted_time" => "{$s_hours} hrs {$s_rem_mins} mins",
                "total_days" => $site_days
            ];
        }

        // Sort so previous sites appear first, and the current site is listed below it
        usort($sites_output, function($a, $b) {
            if ($a['is_current'] === $b['is_current']) {
                return $a['site_id'] <=> $b['site_id'];
            }
            return $a['is_current'] ? 1 : -1; // false (previous) first, true (current) last
        });

        $grand_hours = floor($grand_total_minutes / 60);
        $grand_rem_mins = $grand_total_minutes % 60;

        return [
            "sites" => $sites_output,
            "total_minutes" => $grand_total_minutes,
            "total_hours" => $grand_hours,
            "remaining_minutes" => $grand_rem_mins,
            "formatted_rendered_time" => "{$grand_hours} hrs {$grand_rem_mins} mins"
        ];
    }
}
?>
