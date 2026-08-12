// SBC Internship Attendance System - Mobile App
// File: api_service.dart

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../core/constants.dart';

// Main widget / service implementation
class ApiService {
  static const String serverUnavailableMsg = "Server unavailable. Working in Offline Mode.";

  static Map<String, dynamic> _handleException(dynamic e) {
    return {
      "status": "error",
      "is_connection_error": true,
      "message": serverUnavailableMsg,
    };
  }


  static Future<bool> isServerReachable() async {
    try {
      final response = await http
          .get(Uri.parse("${AppConfig.baseUrl}/get_courses.php"))
          .timeout(const Duration(seconds: 4));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }


  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) async {
    final url = Uri.parse("${AppConfig.baseUrl}/login.php");

    try {
      final response = await http
          .post(
            url,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({
              "email": email,
              "password": password,
              "user_type": "student",
            }),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "status": "error",
          "message": serverUnavailableMsg,
        };
      }
    } on SocketException catch (e) {
      return _handleException(e);
    } on http.ClientException catch (e) {
      return _handleException(e);
    } on TimeoutException catch (e) {
      return _handleException(e);
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> registerStudent({
    required String fullName,
    String studentNumber = "",
    required String idNo,
    required String email,
    required String password,
    int courseId = 1,
    int? deanId,
    int? siteId,
  }) async {
    final url = Uri.parse("${AppConfig.baseUrl}/register.php");

    try {
      final response = await http
          .post(
            url,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({
              "full_name": fullName,
              "student_number": studentNumber,
              "id_no": idNo,
              "email": email,
              "password": password,
              "course_id": courseId,
              "dean_id": deanId,
              "site_id": siteId,
            }),
          )
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "status": "error",
          "message": serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> getDeans() async {
    final url = Uri.parse("${AppConfig.baseUrl}/get_deans.php");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "status": "error",
          "message": serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> getCourses() async {
    final url = Uri.parse("${AppConfig.baseUrl}/get_courses.php");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "status": "error",
          "message": serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> getSites() async {
    final url = Uri.parse("${AppConfig.baseUrl}/get_sites.php");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "status": "error",
          "message": serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> recordAttendance({
    required String studentId,
    required String action,
    String selfiePath = '',
    String imageBase64 = '',
    String? customTime,
    String? customDate,
    double latitude = 0.0,
    double longitude = 0.0,
  }) async {
    final url = Uri.parse("${AppConfig.baseUrl}/submit_attendance.php");

    try {
      final response = await http
          .post(
            url,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({
              "ojt_id": studentId,
              "student_id": studentId,
              "shift_type": action,
              "custom_time": customTime,
              "custom_date": customDate,
              "image_base64": imageBase64,
              "latitude": latitude,
              "longitude": longitude,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "status": "error",
          "message": serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> getDashboardSummary(dynamic studentId) async {
    final url = Uri.parse("${AppConfig.baseUrl}/get_dashboard_summary.php?student_id=$studentId");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          'status': 'error',
          'message': serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> getAttendanceHistory(dynamic studentId) async {
    final url = Uri.parse("${AppConfig.baseUrl}/get_attendance_history.php?student_id=$studentId");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          'status': 'error',
          'message': serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> submitAbsenceRequest(
    int studentId,
    String dateAbsent,
    String reason, {
    String imageBase64 = '',
  }) async {
    final url = Uri.parse("${AppConfig.baseUrl}/submit_absence.php");

    try {
      final response = await http
          .post(
            url,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({
              "student_id": studentId,
              "date_absent": dateAbsent,
              "reason": reason,
              "image_base64": imageBase64,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          "status": "error",
          "message": serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> getAbsenceHistory(dynamic studentId) async {
    final url = Uri.parse("${AppConfig.baseUrl}/get_absence_history.php?student_id=$studentId");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          'status': 'error',
          'message': serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }


  static Future<Map<String, dynamic>> getStudentProfile(dynamic studentId) async {
    final url = Uri.parse("${AppConfig.baseUrl}/get_student_profile.php?student_id=$studentId");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          'status': 'error',
          'message': serverUnavailableMsg,
        };
      }
    } catch (e) {
      return _handleException(e);
    }
  }
}
