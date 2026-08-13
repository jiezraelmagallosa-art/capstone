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
  static String _activeHost = "192.168.1.7";

  static String get serverHost => _activeHost;

  static set serverHost(String host) {
    String cleanHost = host.trim();
    cleanHost = cleanHost.replaceAll(RegExp(r'^https?://'), '');
    cleanHost = cleanHost.split('/')[0];
    if (cleanHost.isNotEmpty) {
      _activeHost = cleanHost;
    }
  }

  static String get baseUrl {
    if (kIsWeb) {
      return "http://localhost/SBC_Internship_Attendance_System/backend";
    }
    try {
      if (Platform.isWindows) {
        return "http://localhost/SBC_Internship_Attendance_System/backend";
      }
    } catch (_) {}
    return "http://$_activeHost/SBC_Internship_Attendance_System/backend";
  }

  static List<String> get candidateHosts => [
        "192.168.1.7",
        "10.0.2.2",
        "127.0.0.1",
        "localhost",
        "10.246.176.89",
      ];
}

