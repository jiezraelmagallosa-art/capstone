// SBC Internship Attendance System - Mobile App
// File: dtr_log_screen.dart

import 'package:flutter/material.dart';
import '../core/api_service.dart';
import '../core/pdf_export_service.dart';

// Main widget / service implementation
class DtrLogScreen extends StatefulWidget {
  final int studentId;
  final String studentName;

  const DtrLogScreen({
    super.key,
    required this.studentId,
    this.studentName = 'Student',
  });

  @override
  State<DtrLogScreen> createState() => DtrLogScreenState();
}

class DtrLogScreenState extends State<DtrLogScreen> {
  bool _isLoading = true;
  List<dynamic> _logs = [];

  static const Color primaryNavy = Color(0xFF002D56);

  @override
  void initState() {
    super.initState();
    fetchDtrHistory();
  }

  Future<void> fetchDtrHistory() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
    });

    final result = await ApiService.getAttendanceHistory(widget.studentId);

    if (!mounted) return;

    if (result['status'] == 'success') {
      setState(() {
        _logs = result['data'] ?? [];
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _logs.isEmpty
            ? null
            : () {
                PdfExportService.exportDtrPdf(
                  studentName: widget.studentName,
                  ojtId: widget.studentId.toString(),
                  logs: _logs,
                );
              },
        backgroundColor: primaryNavy,
        icon: const Icon(Icons.picture_as_pdf, color: Colors.white),
        label: const Text(
          'Export DTR (PDF)',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: primaryNavy));
    }

    if (_logs.isEmpty) {
      return RefreshIndicator(
        onRefresh: fetchDtrHistory,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 100),
            Center(
              child: Column(
                children: [
                  Icon(Icons.history, size: 60, color: Colors.grey),
                  SizedBox(height: 10),
                  Text(
                    'No attendance logs found yet.',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: fetchDtrHistory,
      child: ListView.builder(
        padding: const EdgeInsets.only(
          left: 16.0,
          right: 16.0,
          top: 16.0,
          bottom: 80.0,
        ),
        itemCount: _logs.length,
        itemBuilder: (context, index) {
          final log = _logs[index];
          return Card(
            elevation: 1,
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: Colors.grey.shade300),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            size: 16,
                            color: primaryNavy,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            log['date'] ?? '',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: primaryNavy,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.green.shade300),
                        ),
                        child: Text(
                          log['status'] ?? 'Present',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.green.shade800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 20, thickness: 1),


                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Morning Shift:',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        'In: ${log['time_in_morning'] ?? '--:--'}  |  Out: ${log['time_out_morning'] ?? '--:--'}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),


                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Afternoon Shift:',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        'In: ${log['time_in_afternoon'] ?? '--:--'}  |  Out: ${log['time_out_afternoon'] ?? '--:--'}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
