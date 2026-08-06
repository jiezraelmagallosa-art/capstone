import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class AppColors {
  static const Color primaryNavy = Color(0xFF002D56);
  static const Color accentGold = Color(0xFFF59E0B);
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color cardWhite = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF1E293B);
  static const Color textMuted = Color(0xFF64748B);
  static const Color successGreen = Color(0xFF10B981);
}

class AppConfig {
  static String get baseUrl {
    if (kIsWeb) {
      return "http://localhost/SBC_Internship_Attendance_System/backend";
    }
    try {
      if (Platform.isWindows) {
        return "http://localhost/SBC_Internship_Attendance_System/backend";
      }
    } catch (_) {}
    return "http://10.246.176.89/SBC_Internship_Attendance_System/backend";
  }
}

