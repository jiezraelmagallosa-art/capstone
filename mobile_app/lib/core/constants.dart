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
  // Default host for local network / XAMPP server (configurable dynamically in app)
  static String _activeHost = "192.168.1.3";
  static final List<String> _customHosts = [];

  static String get serverHost => _activeHost;

  static set serverHost(String host) {
    String cleanHost = host.trim().replaceAll(RegExp(r'/+$'), '');
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
      if (savedHost != null && savedHost.trim().isNotEmpty) {
        _activeHost = savedHost.trim().replaceAll(RegExp(r'/+$'), '');
        if (!_customHosts.contains(_activeHost)) {
          _customHosts.insert(0, _activeHost);
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
    final host = _activeHost.trim();

    // If active host is already a full HTTP / HTTPS endpoint
    if (host.startsWith('http://') || host.startsWith('https://')) {
      if (host.endsWith('/backend')) {
        return host;
      }
      return "$host/backend";
    }

    if (kIsWeb) {
      return "http://localhost/SBC_Internship_Attendance_System/backend";
    }
    try {
      if (Platform.isWindows && (host == 'localhost' || host == '127.0.0.1')) {
        return "http://localhost/SBC_Internship_Attendance_System/backend";
      }
    } catch (_) {}

    return "http://$host/SBC_Internship_Attendance_System/backend";
  }

  static List<String> get candidateHosts {
    final list = <String>[];
    for (final h in _customHosts) {
      if (!list.contains(h)) list.add(h);
    }
    // Add known candidate hosts for auto-discovery
    // [CHANGE ME] Add your actual school network IPs here
    final defaults = [
      "YOUR_SERVER_IP_OR_DOMAIN", // [CHANGE ME] Primary production server
      "192.168.1.3",
      "192.168.1.100",
      "192.168.1.7",
      "10.0.0.56",
      "10.0.2.2",
      "127.0.0.1",
      "localhost",
    ];
    for (final d in defaults) {
      if (!list.contains(d)) list.add(d);
    }
    return list;
  }
}


