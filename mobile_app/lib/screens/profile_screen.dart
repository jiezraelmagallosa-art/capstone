// SBC Internship Attendance System - Mobile App
// File: profile_screen.dart

import 'package:flutter/material.dart';
import '../core/api_service.dart';
import '../core/constants.dart';
import 'login_screen.dart';

// Main widget / service implementation
class ProfileScreen extends StatefulWidget {
  final int studentId;
  final String studentName;

  const ProfileScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _profileData = {};

  static const Color primaryNavy = AppColors.primaryNavy;
  static const Color accentGold = AppColors.accentGold;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    setState(() {
      _isLoading = true;
    });

    final result = await ApiService.getStudentProfile(widget.studentId);

    if (!mounted) return;

    if (result['status'] == 'success' && result['data'] != null) {
      setState(() {
        _profileData = result['data'];
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Confirm Logout',
          style: TextStyle(color: primaryNavy, fontWeight: FontWeight.bold),
        ),
        content: const Text('Are you sure you want to log out of your session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('LOGOUT', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.backgroundLight,
        body: Center(child: CircularProgressIndicator(color: primaryNavy)),
      );
    }

    final String fullName = _profileData['full_name'] ?? widget.studentName;
    final String studentNumber = _profileData['student_number'] ?? 'N/A';
    final String email = _profileData['email'] ?? 'N/A';
    final String courseCode = _profileData['course_code'] ?? 'BSIS';
    final String courseName = _profileData['course_name'] ?? 'Bachelor of Science in Information Systems';
    final String siteName = _profileData['site_name'] ?? 'SBC IT Department';
    final String siteLocation = _profileData['site_location'] ?? 'M\'lang, Cotabato';
    final String ojtNo = _profileData['ojt_no'] ?? 'OJT-2026-01';

    final int renderedHours = _profileData['rendered_hours'] ?? 0;
    final int requiredHours = _profileData['required_hours'] ?? 480;
    final double progress = (renderedHours / requiredHours).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: RefreshIndicator(
        onRefresh: _fetchProfile,
        color: primaryNavy,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [

              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [primaryNavy, Color(0xFF004080)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          const CircleAvatar(
                            radius: 40,
                            backgroundColor: accentGold,
                            child: Icon(Icons.person, size: 50, color: primaryNavy),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: CircleAvatar(
                              radius: 14,
                              backgroundColor: Colors.white,
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/sbc_logo.png',
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        fullName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Student No: $studentNumber',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        email,
                        style: const TextStyle(color: Colors.white60, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),


              _buildInfoCard(
                title: 'Academic Program',
                icon: Icons.school_outlined,
                items: [
                  {'label': 'Course', 'value': '$courseCode - $courseName'},
                  {'label': 'Institutional ID', 'value': _profileData['id_no'] ?? 'N/A'},
                ],
              ),
              const SizedBox(height: 12),


              _buildInfoCard(
                title: 'Assigned Dean / Supervisor',
                icon: Icons.supervisor_account_outlined,
                items: [
                  {'label': 'Dean Name', 'value': _profileData['dean_name'] ?? 'Unassigned'},
                  if (_profileData['dean_email'] != null && _profileData['dean_email'].toString().isNotEmpty)
                    {'label': 'Dean Email', 'value': _profileData['dean_email']},
                ],
              ),
              const SizedBox(height: 12),


              _buildInfoCard(
                title: 'Training Site Assignment',
                icon: Icons.business_outlined,
                items: [
                  {'label': 'OJT Designation', 'value': ojtNo},
                  {'label': 'Training Facility', 'value': siteName},
                  {'label': 'Location', 'value': siteLocation},
                ],
              ),
              const SizedBox(height: 12),


              Card(
                elevation: 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.grey.shade300),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.timelapse_rounded, color: primaryNavy),
                          SizedBox(width: 8),
                          Text(
                            'Overall Progress Summary',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: primaryNavy,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Consumed Hours:', style: TextStyle(color: Colors.black54)),
                          Text(
                            '${_profileData['formatted_rendered_time'] ?? "$renderedHours hrs"} / $requiredHours hrs',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: primaryNavy,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: progress,
                        minHeight: 10,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: const AlwaysStoppedAnimation<Color>(accentGold),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${(progress * 100).toStringAsFixed(1)}% Completed',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: progress >= 1.0
                                  ? const Color(0xFF2E7D32)
                                  : accentGold,
                            ),
                          ),
                          Text(
                            'Goal: $requiredHours Hours',
                            style: const TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        ],
                      ),
                      if (progress >= 1.0) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF8E1),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: accentGold.withValues(alpha: 0.5),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.emoji_events_rounded,
                                color: accentGold,
                                size: 28,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      '🎉 Goal Hours Completed!',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: primaryNavy,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _profileData['completion_message'] ??
                                          'Congratulations! You have completed your required $requiredHours internship hours.',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.black87,
                                        height: 1.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),


              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _handleLogout,
                  icon: const Icon(Icons.logout, color: Colors.redAccent),
                  label: const Text(
                    'LOGOUT SESSION',
                    style: TextStyle(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Colors.redAccent, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    required List<Map<String, String>> items,
  }) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: primaryNavy),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: primaryNavy,
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            ...items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 120,
                        child: Text(
                          item['label']!,
                          style: const TextStyle(
                            color: Colors.black54,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          item['value']!,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textDark,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
