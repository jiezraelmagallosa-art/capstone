import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  static String _activeHost = "10.0.0.56";
  static final List<String> _customHosts = [];

  static String get serverHost => _activeHost;

  static set serverHost(String host) {
    String cleanHost = host.trim();
    cleanHost = cleanHost.replaceAll(RegExp(r'^https?://'), '');
    cleanHost = cleanHost.split('/')[0];
    if (cleanHost.isNotEmpty) {
      _activeHost = cleanHost;
      if (!_customHosts.contains(cleanHost)) {
        _customHosts.insert(0, cleanHost);
      }
      _saveServerHost(cleanHost);
    }
  }

  static Future<void> loadServerHost() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedHost = prefs.getString('server_host');
      if (savedHost != null && savedHost.isNotEmpty) {
        _activeHost = savedHost;
        if (!_customHosts.contains(savedHost)) {
          _customHosts.insert(0, savedHost);
        }
      }
    } catch (_) {}
  }

  static Future<void> _saveServerHost(String host) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('server_host', host);
    } catch (_) {}
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

  static List<String> get candidateHosts {
    final list = <String>[];
    for (final h in _customHosts) {
      if (!list.contains(h)) list.add(h);
    }
    final defaults = [
      "10.0.0.56",
      "192.168.1.7",
      "10.0.2.2",
      "127.0.0.1",
      "localhost",
      "10.246.176.89",
    ];
    for (final d in defaults) {
      if (!list.contains(d)) list.add(d);
    }
    return list;
  }
}


