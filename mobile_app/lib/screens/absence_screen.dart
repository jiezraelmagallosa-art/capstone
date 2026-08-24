// SBC Internship Attendance System - Mobile App
// File: absence_screen.dart

import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../core/api_service.dart';
import '../core/constants.dart';

// Main widget / service implementation
class AbsenceScreen extends StatefulWidget {
  final int studentId;

  const AbsenceScreen({super.key, required this.studentId});

  @override
  State<AbsenceScreen> createState() => _AbsenceScreenState();
}

class _AbsenceScreenState extends State<AbsenceScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  DateTime? _selectedDate;
  File? _attachedImage;
  final ImagePicker _imagePicker = ImagePicker();
  bool _isSubmitting = false;
  bool _isLoadingHistory = true;
  List<dynamic> _absenceLogs = [];

  static const Color primaryNavy = AppColors.primaryNavy;

  @override
  void initState() {
    super.initState();
    _fetchAbsenceHistory();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _fetchAbsenceHistory() async {
    setState(() {
      _isLoadingHistory = true;
    });

    final result = await ApiService.getAbsenceHistory(widget.studentId);

    if (!mounted) return;

    if (result['status'] == 'success') {
      setState(() {
        _absenceLogs = result['data'] ?? [];
        _isLoadingHistory = false;
      });
    } else {
      setState(() {
        _isLoadingHistory = false;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(2025),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: primaryNavy,
              onPrimary: Colors.white,
              onSurface: AppColors.textDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      if (pickedFile != null) {
        setState(() {
          _attachedImage = File(pickedFile.path);
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not pick image: $e'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
    }
  }

  void _showImageSourcePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Attach Supporting Document',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryNavy,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(
                  Icons.camera_alt_rounded,
                  color: AppColors.primaryNavy,
                ),
                title: const Text('Take a Photo'),
                subtitle: const Text('Use camera to capture document'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.photo_library_rounded,
                  color: AppColors.primaryNavy,
                ),
                title: const Text('Choose from Gallery'),
                subtitle: const Text('Select an existing photo'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _removeAttachment() {
    setState(() {
      _attachedImage = null;
    });
  }

  Future<void> _handleSubmitAbsence() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select the date of absence.'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    // Encode attached image to base64 if present
    String imageBase64 = '';
    if (_attachedImage != null) {
      try {
        final bytes = await _attachedImage!.readAsBytes();
        imageBase64 = base64Encode(bytes);
      } catch (e) {
        debugPrint('Error encoding image: $e');
      }
    }

    final String formattedDate = DateFormat(
      'yyyy-MM-dd',
    ).format(_selectedDate!);
    final result = await ApiService.submitAbsenceRequest(
      widget.studentId,
      formattedDate,
      _reasonController.text.trim(),
      imageBase64: imageBase64,
    );

    setState(() {
      _isSubmitting = false;
    });

    if (!mounted) return;

    if (result['status'] == 'success') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Absence request submitted!'),
          backgroundColor: Colors.green,
        ),
      );
      _reasonController.clear();
      setState(() {
        _selectedDate = null;
        _attachedImage = null;
      });
      _fetchAbsenceHistory();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Failed to submit request.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: RefreshIndicator(
        onRefresh: _fetchAbsenceHistory,
        color: primaryNavy,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.event_note, color: primaryNavy),
                            SizedBox(width: 8),
                            Text(
                              'File Absence Request',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: primaryNavy,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        InkWell(
                          onTap: () => _selectDate(context),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade400),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _selectedDate == null
                                      ? 'Select Date of Absence'
                                      : DateFormat(
                                          'EEEE, MMMM d, yyyy',
                                        ).format(_selectedDate!),
                                  style: TextStyle(
                                    color: _selectedDate == null
                                        ? Colors.grey.shade600
                                        : AppColors.textDark,
                                    fontSize: 15,
                                  ),
                                ),
                                const Icon(
                                  Icons.calendar_month_rounded,
                                  color: primaryNavy,
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),

                        TextFormField(
                          controller: _reasonController,
                          maxLines: 3,
                          decoration: InputDecoration(
                            labelText: 'Reason for Absence',
                            alignLabelWithHint: true,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(
                                color: primaryNavy,
                                width: 2,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please specify the reason for your absence.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),

                        // Supporting Attachment Section
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: _attachedImage != null
                                  ? Colors.green.shade300
                                  : Colors.grey.shade300,
                              width: _attachedImage != null ? 1.5 : 1.0,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    _attachedImage != null
                                        ? Icons.check_circle_rounded
                                        : Icons.attach_file_rounded,
                                    size: 18,
                                    color: _attachedImage != null
                                        ? Colors.green
                                        : Colors.grey.shade600,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    _attachedImage != null
                                        ? 'Document Attached'
                                        : 'Supporting Attachment (Optional)',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: _attachedImage != null
                                          ? Colors.green.shade700
                                          : Colors.grey.shade700,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              if (_attachedImage != null) ...[
                                Stack(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.file(
                                        _attachedImage!,
                                        width: double.infinity,
                                        height: 160,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                    Positioned(
                                      top: 6,
                                      right: 6,
                                      child: GestureDetector(
                                        onTap: _removeAttachment,
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: const BoxDecoration(
                                            color: Colors.red,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.close_rounded,
                                            color: Colors.white,
                                            size: 16,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton.icon(
                                    onPressed: _showImageSourcePicker,
                                    icon: const Icon(
                                      Icons.swap_horiz_rounded,
                                      size: 18,
                                    ),
                                    label: const Text('Change Attachment'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: primaryNavy,
                                      side: const BorderSide(
                                        color: primaryNavy,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 8,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                    ),
                                  ),
                                ),
                              ] else ...[
                                Text(
                                  'Attach medical certificate, excuse letter, or other supporting documents.',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: () =>
                                            _pickImage(ImageSource.camera),
                                        icon: const Icon(
                                          Icons.camera_alt_rounded,
                                          size: 18,
                                        ),
                                        label: const Text('Camera'),
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: primaryNavy,
                                          side: BorderSide(
                                            color: Colors.grey.shade400,
                                          ),
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 10,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              6,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: () =>
                                            _pickImage(ImageSource.gallery),
                                        icon: const Icon(
                                          Icons.photo_library_rounded,
                                          size: 18,
                                        ),
                                        label: const Text('Gallery'),
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: primaryNavy,
                                          side: BorderSide(
                                            color: Colors.grey.shade400,
                                          ),
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 10,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              6,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),

                        ElevatedButton.icon(
                          onPressed: _isSubmitting
                              ? null
                              : _handleSubmitAbsence,
                          icon: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(
                                  Icons.send_rounded,
                                  color: Colors.white,
                                ),
                          label: Text(
                            _isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryNavy,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              const Row(
                children: [
                  Icon(Icons.history_edu, color: primaryNavy),
                  SizedBox(width: 8),
                  Text(
                    'Absence Request Status',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: primaryNavy,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              _buildHistoryList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryList() {
    if (_isLoadingHistory) {
      return const Padding(
        padding: EdgeInsets.all(32.0),
        child: Center(child: CircularProgressIndicator(color: primaryNavy)),
      );
    }

    if (_absenceLogs.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32.0),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: const Column(
          children: [
            Icon(Icons.check_circle_outline, size: 48, color: Colors.grey),
            SizedBox(height: 10),
            Text(
              'No absence requests recorded.',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _absenceLogs.length,
      itemBuilder: (context, index) {
        final log = _absenceLogs[index];
        final String status = log['status'] ?? 'Pending';

        Color statusColor;
        Color statusBg;
        IconData statusIcon;

        if (status == 'Approved') {
          statusColor = Colors.green.shade800;
          statusBg = Colors.green.shade50;
          statusIcon = Icons.check_circle;
        } else if (status == 'Rejected') {
          statusColor = Colors.red.shade800;
          statusBg = Colors.red.shade50;
          statusIcon = Icons.cancel;
        } else {
          statusColor = Colors.amber.shade900;
          statusBg = Colors.amber.shade50;
          statusIcon = Icons.pending_actions;
        }

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
                    Text(
                      log['date_absent'] ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: primaryNavy,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: statusColor.withValues(alpha: 0.5),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(statusIcon, size: 14, color: statusColor),
                          const SizedBox(width: 4),
                          Text(
                            status,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Reason: ${log['reason'] ?? ''}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textDark,
                  ),
                ),
                if (log['remarks'] != null &&
                    log['remarks'].toString().isNotEmpty &&
                    log['remarks'] != 'No remarks') ...[
                  const SizedBox(height: 6),
                  Text(
                    'Dean/Admin Remarks: ${log['remarks']}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: Colors.blueGrey,
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
