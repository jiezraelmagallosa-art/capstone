// SBC Internship Attendance System - Mobile App
// File: home_screen.dart

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:camera/camera.dart';
import '../main.dart';
import '../services/api_service.dart';
import '../core/motivational_messages.dart';
import 'dtr_log_screen.dart';
import 'absence_screen.dart';
import 'profile_screen.dart';

// Main widget / service implementation
class HomeScreen extends StatefulWidget {
  final String studentName;
  final int studentId;

  const HomeScreen({
    super.key,
    required this.studentName,
    required this.studentId,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  final GlobalKey<DtrLogScreenState> _dtrLogKey =
      GlobalKey<DtrLogScreenState>();

  int _currentIndex = 0;
  bool _isActionLoading = false;
  bool _isLoadingSummary = true;


  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isCameraActive = false;
  bool _isInitializingCamera = false;


  int _countdownSeconds = 0;
  Timer? _countdownTimer;
  bool _isCountingDown = false;


  late Timer _timer;
  Timer? _welcomeTimer;
  bool _showWelcome = true;
  DateTime _now = DateTime.now();


  String _totalHoursText = "0 hrs 0 mins";
  String _formattedConsumedText = "0 hrs 0 mins / 480 hrs";
  String _formattedRemainingText = "480 hrs 0 mins left";
  int _totalHours = 0;
  final int _targetHours = 480;

  static const Color primaryNavy = Color(0xFF002D56);
  static const Color accentGold = Color(0xFFFFB800);
  static const Color bgLight = Color(0xFFF4F6F9);
  static const Color cardWhite = Colors.white;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchDashboardData();


    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _now = DateTime.now();
        });
      }
    });


    _welcomeTimer = Timer(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          _showWelcome = false;
        });
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _closeCamera();
    }
  }

  Future<void> _openCamera() async {
    if (_isInitializingCamera || _isCameraActive) return;
    setState(() {
      _isInitializingCamera = true;
    });

    if (cameras.isNotEmpty) {
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      try {
        await _cameraController!.initialize();
        try {
          final double minZoom = await _cameraController!.getMinZoomLevel();
          await _cameraController!.setZoomLevel(minZoom);
        } catch (_) {}

        if (mounted) {
          setState(() {
            _isCameraInitialized = true;
            _isCameraActive = true;
            _isInitializingCamera = false;
          });
        }
      } catch (e) {
        debugPrint('Error initializing camera controller: $e');
        if (mounted) {
          setState(() {
            _isInitializingCamera = false;
          });
        }
      }
    } else {
      if (mounted) {
        setState(() {
          _isInitializingCamera = false;
        });
      }
    }
  }

  Future<void> _closeCamera() async {
    _countdownTimer?.cancel();
    _countdownTimer = null;
    if (_cameraController != null) {
      try {
        await _cameraController!.dispose();
      } catch (e) {
        debugPrint('Error disposing camera controller: $e');
      }
      _cameraController = null;
    }
    if (mounted) {
      setState(() {
        _isCameraInitialized = false;
        _isCameraActive = false;
        _isInitializingCamera = false;
        _isCountingDown = false;
        _countdownSeconds = 0;
      });
    }
  }

  void _cancelCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = null;
    if (mounted) {
      setState(() {
        _isCountingDown = false;
        _countdownSeconds = 0;
        _isActionLoading = false;
      });
    }
  }

  Future<bool> _startCameraCountdown({int durationInSeconds = 5}) async {
    final Completer<bool> completer = Completer<bool>();

    setState(() {
      _isCountingDown = true;
      _countdownSeconds = durationInSeconds;
    });

    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || !_isCountingDown) {
        timer.cancel();
        if (!completer.isCompleted) completer.complete(false);
        return;
      }

      if (_countdownSeconds > 1) {
        setState(() {
          _countdownSeconds--;
        });
      } else {
        setState(() {
          _countdownSeconds = 0;
          _isCountingDown = false;
        });
        timer.cancel();
        if (!completer.isCompleted) completer.complete(true);
      }
    });

    return completer.future;
  }

  Future<XFile?> _captureImage() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Camera is not ready yet.'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
      return null;
    }

    if (_cameraController!.value.isTakingPicture) {
      return null;
    }

    try {
      final XFile imageFile = await _cameraController!.takePicture();
      debugPrint('Image captured at path: ${imageFile.path}');
      return imageFile;
    } catch (e) {
      debugPrint('Error capturing image: $e');
      return null;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer.cancel();
    _welcomeTimer?.cancel();
    _countdownTimer?.cancel();
    _closeCamera();
    super.dispose();
  }

  Future<void> _fetchDashboardData() async {
    setState(() {
      _isLoadingSummary = true;
    });

    final result = await ApiService.getDashboardSummary(widget.studentId);

    if (!mounted) return;

    if (result['status'] == 'success' && result['data'] != null) {
      setState(() {
        _totalHoursText = result['data']['formatted_time'] ?? "0 hrs 0 mins";
        _formattedConsumedText =
            result['data']['formatted_consumed_of_target'] ??
            "$_totalHoursText / 480 hrs";
        _formattedRemainingText =
            result['data']['formatted_remaining'] ?? "480 hrs 0 mins left";
        _totalHours = result['data']['total_hours'] ?? 0;
        _isLoadingSummary = false;
      });
    } else {
      setState(() {
        _isLoadingSummary = false;
      });
    }
  }

  Future<void> _handleAttendanceAction(String actionType) async {
    final String? shift = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          actionType == 'time_in'
              ? 'Select Time In Shift'
              : 'Select Time Out Shift',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: primaryNavy,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Which shift session are you recording for today?'),
            SizedBox(height: 12),
            Text('• Morning Shift: 5:00 AM – 12:30 PM',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryNavy)),
            SizedBox(height: 4),
            Text('• Afternoon Shift: 12:30 PM – 5:00 PM',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryNavy)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, 'morning'),
            child: const Text(
              'Morning Shift (5:00 AM - 12:30 PM)',
              style: TextStyle(color: primaryNavy),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: primaryNavy),
            onPressed: () => Navigator.pop(context, 'afternoon'),
            child: const Text(
              'Afternoon Shift (12:30 PM - 5:00 PM)',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (shift == null) return;

    final DateTime now = DateTime.now();
    final double currentDecimalHour = now.hour + (now.minute / 60.0);

    if (shift == 'morning') {
      if (currentDecimalHour < 5.0 || currentDecimalHour > 12.5) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Morning shift attendance can only be recorded between 5:00 AM and 12:30 PM.'),
            backgroundColor: Colors.redAccent,
          ),
        );
        return;
      }
    } else if (shift == 'afternoon') {
      if (currentDecimalHour < 12.5 || currentDecimalHour > 17.0) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Afternoon shift attendance can only be recorded between 12:30 PM and 5:00 PM.'),
            backgroundColor: Colors.redAccent,
          ),
        );
        return;
      }
    }

    setState(() {
      _isActionLoading = true;
    });


    if (!_isCameraActive ||
        _cameraController == null ||
        !_cameraController!.value.isInitialized) {
      await _openCamera();
    }


    await Future.delayed(const Duration(milliseconds: 300));


    final bool countdownSuccess = await _startCameraCountdown(
      durationInSeconds: 5,
    );
    if (!countdownSuccess || !mounted) {
      setState(() {
        _isActionLoading = false;
        _isCountingDown = false;
      });
      return;
    }


    final XFile? capturedPhoto = await _captureImage();
    String imageBase64 = '';

    if (capturedPhoto != null) {
      try {
        final bytes = await capturedPhoto.readAsBytes();
        imageBase64 = base64Encode(bytes);
        debugPrint(
          "Photo encoded to base64 successfully, length: ${imageBase64.length}",
        );
      } catch (e) {
        debugPrint("Error reading photo bytes: $e");
      }
    }


    await _closeCamera();

    final String fullAction = '${actionType}_$shift';
    final result = await ApiService.recordAttendance(
      studentId: widget.studentId.toString(),
      action: fullAction,
      selfiePath: capturedPhoto?.path ?? '',
      imageBase64: imageBase64,
    );

    setState(() {
      _isActionLoading = false;
    });

    if (!mounted) return;

    if (result['status'] == 'success') {
      MotivationalMessages.showMotivationalDialog(
        context,
        actionType: actionType,
        message: result['motivational_message'] ?? result['message'] ?? '',
        recordedTime: result['recorded_time'] ?? DateFormat('hh:mm a').format(DateTime.now()),
      );
      _fetchDashboardData();
      _dtrLogKey.currentState?.fetchDtrHistory();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Failed to record attendance.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildAttendanceHome(),
      DtrLogScreen(
        key: _dtrLogKey,
        studentId: widget.studentId,
        studentName: widget.studentName,
      ),
      AbsenceScreen(studentId: widget.studentId),
      ProfileScreen(
        studentId: widget.studentId,
        studentName: widget.studentName,
      ),
    ];

    return Scaffold(
      backgroundColor: bgLight,
      appBar: AppBar(
        backgroundColor: primaryNavy,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: ClipOval(
              child: Image.asset(
                'assets/images/sbc_logo.png',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(
                  Icons.school_rounded,
                  size: 20,
                  color: primaryNavy,
                ),
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SBC Internship Portal',
              style: TextStyle(
                fontSize: _showWelcome ? 14 : 18,
                fontWeight: _showWelcome ? FontWeight.normal : FontWeight.bold,
                color: _showWelcome ? Colors.white70 : Colors.white,
              ),
            ),
            AnimatedCrossFade(
              firstChild: Text(
                'Welcome, ${widget.studentName}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              secondChild: const SizedBox.shrink(),
              crossFadeState: _showWelcome
                  ? CrossFadeState.showFirst
                  : CrossFadeState.showSecond,
              duration: const Duration(milliseconds: 500),
            ),
          ],
        ),
      ),
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: cardWhite,
        selectedItemColor: accentGold,
        unselectedItemColor: Colors.grey,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner),
            label: 'Attendance',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assessment_outlined),
            label: 'DTR Log',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_late_outlined),
            label: 'Absence',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceHome() {
    double progressValue = (_totalHours / _targetHours).clamp(0.0, 1.0);

    String formattedTime = DateFormat('hh:mm:ss a').format(_now);
    String formattedDate = DateFormat('EEEE, MMMM d, yyyy').format(_now);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [

          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            decoration: BoxDecoration(
              color: primaryNavy,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  formattedTime,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formattedDate,
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),


          Container(
            height: 280,
            clipBehavior: Clip.hardEdge,
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: primaryNavy, width: 2),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                if (_isCameraActive &&
                    _isCameraInitialized &&
                    _cameraController != null &&
                    _cameraController!.value.isInitialized)
                  Center(
                    child: FittedBox(
                      fit: BoxFit.contain,
                      child: SizedBox(
                        width: _cameraController!.value.previewSize!.height,
                        height: _cameraController!.value.previewSize!.width,
                        child: CameraPreview(_cameraController!),
                      ),
                    ),
                  )
                else if (_isInitializingCamera)
                  const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: accentGold),
                      SizedBox(height: 12),
                      Text(
                        'Opening Camera...',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  )
                else
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.camera_alt_outlined,
                        size: 48,
                        color: accentGold,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Camera is OFF',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Tap button below to open camera for photo verification',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _openCamera,
                        icon: const Icon(
                          Icons.videocam_rounded,
                          color: primaryNavy,
                        ),
                        label: const Text(
                          'OPEN CAMERA',
                          style: TextStyle(
                            color: primaryNavy,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: accentGold,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 10,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                    ],
                  ),


                if (_isCountingDown) ...[
                  Container(color: Colors.black.withValues(alpha: 0.35)),
                  Positioned(
                    top: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: primaryNavy.withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: accentGold, width: 1.5),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.camera_alt_rounded,
                            color: accentGold,
                            size: 18,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _countdownSeconds > 0
                                ? 'Get ready to pose!'
                                : 'Smile! 📸',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Center(
                    child: Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: primaryNavy.withValues(alpha: 0.85),
                        border: Border.all(color: accentGold, width: 3.5),
                        boxShadow: [
                          BoxShadow(
                            color: accentGold.withValues(alpha: 0.5),
                            blurRadius: 18,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _countdownSeconds > 0 ? '$_countdownSeconds' : '📸',
                        style: TextStyle(
                          color: accentGold,
                          fontSize: _countdownSeconds > 0 ? 46 : 38,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    child: TextButton.icon(
                      onPressed: _cancelCountdown,
                      icon: const Icon(
                        Icons.cancel_outlined,
                        color: Colors.white,
                        size: 18,
                      ),
                      label: const Text(
                        'Cancel Timer',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        backgroundColor: Colors.red.withValues(alpha: 0.85),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 6,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    ),
                  ),
                ],


                if (_isCameraActive &&
                    _isCameraInitialized &&
                    !_isCountingDown) ...[
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: accentGold,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircleAvatar(radius: 4, backgroundColor: Colors.red),
                          SizedBox(width: 4),
                          Text(
                            'LIVE CAMERA',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: IconButton(
                      onPressed: _closeCamera,
                      icon: const Icon(
                        Icons.close_rounded,
                        color: Colors.white,
                      ),
                      tooltip: 'Close Camera',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.black54,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),


          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isActionLoading
                      ? null
                      : () => _handleAttendanceAction('time_in'),
                  icon: const Icon(Icons.login_rounded, color: Colors.white),
                  label: const Text(
                    'TIME IN',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryNavy,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isActionLoading
                      ? null
                      : () => _handleAttendanceAction('time_out'),
                  icon: const Icon(Icons.logout_rounded, color: primaryNavy),
                  label: const Text(
                    'TIME OUT',
                    style: TextStyle(color: primaryNavy),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: primaryNavy, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),


          const Text(
            'Daily Progress',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: primaryNavy,
            ),
          ),
          const SizedBox(height: 12),

          _buildSummaryCard(
            title: 'Total Hours Consumed',
            value: _isLoadingSummary ? 'Loading...' : _formattedConsumedText,
            subText: _isLoadingSummary
                ? 'Updated from system records'
                : 'Remaining: $_formattedRemainingText',
            icon: Icons.access_time_filled,
          ),
          const SizedBox(height: 12),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardWhite,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Text(
                        'Goal Progress (480 Hrs Required)',
                        style: TextStyle(color: Colors.black54, fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formattedConsumedText,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: primaryNavy,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),
                LinearProgressIndicator(
                  value: progressValue,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: const AlwaysStoppedAnimation<Color>(accentGold),
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 6),
                Text(
                  '${(progressValue * 100).toStringAsFixed(1)}% of 480 required hours completed',
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required String value,
    required String subText,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardWhite,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: primaryNavy.withValues(alpha: 0.1),
            child: Icon(icon, color: primaryNavy),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.black54, fontSize: 13),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: primaryNavy,
                ),
              ),
              Text(
                subText,
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
