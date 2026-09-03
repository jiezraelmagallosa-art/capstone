// SBC Internship Attendance System - Mobile App
// File: journal_screen.dart
// Daily narrative journal and diary screen for student interns

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../core/constants.dart';

class JournalScreen extends StatefulWidget {
  final int studentId;
  final String studentName;

  const JournalScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  State<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends State<JournalScreen> {
  static const Color primaryNavy = AppColors.primaryNavy;
  static const Color bgLight = AppColors.backgroundLight;

  DateTime _selectedDate = DateTime.now();
  bool _isLoading = true;
  bool _isSaving = false;

  final TextEditingController _tasksController = TextEditingController();
  final TextEditingController _learningsController = TextEditingController();
  final TextEditingController _challengesController = TextEditingController();

  List<dynamic> _pastJournals = [];
  Map<String, dynamic>? _currentJournal;

  @override
  void initState() {
    super.initState();
    _fetchJournals();
  }

  @override
  void dispose() {
    _tasksController.dispose();
    _learningsController.dispose();
    _challengesController.dispose();
    super.dispose();
  }

  String get _formattedSelectedDateISO =>
      DateFormat('yyyy-MM-dd').format(_selectedDate);

  Future<void> _fetchJournals() async {
    setState(() => _isLoading = true);

    try {
      final res = await ApiService.getStudentJournals(widget.studentId);
      if (!mounted) return;

      if (res['status'] == 'success' && res['data'] != null) {
        _pastJournals = res['data'];
        _syncCurrentJournalForDate();
      }
    } catch (e) {
      // Ignored or handled via empty state
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _syncCurrentJournalForDate() {
    final String targetIso = _formattedSelectedDateISO;
    final match = _pastJournals.firstWhere(
      (j) => (j['entry_date'] ?? '').toString().startsWith(targetIso),
      orElse: () => null,
    );

    setState(() {
      _currentJournal = match;
      if (match != null) {
        _tasksController.text = match['tasks_completed'] ?? '';
        _learningsController.text = match['learnings_reflection'] ?? '';
        _challengesController.text = match['challenges_encountered'] ?? '';
      } else {
        _tasksController.clear();
        _learningsController.clear();
        _challengesController.clear();
      }
    });
  }

  Future<void> _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2025, 1, 1),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: primaryNavy,
              onPrimary: Colors.white,
              onSurface: primaryNavy,
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
      _syncCurrentJournalForDate();
    }
  }

  Future<void> _saveJournal() async {
    final tasks = _tasksController.text.trim();
    if (tasks.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please describe the activities & tasks accomplished today.',
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    final res = await ApiService.submitDailyJournal(
      studentId: widget.studentId,
      entryDate: _formattedSelectedDateISO,
      tasksCompleted: tasks,
      learningsReflection: _learningsController.text.trim(),
      challengesEncountered: _challengesController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (res['status'] == 'success') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.white),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  res['message'] ?? 'Daily journal saved successfully!',
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF2E7D32),
        ),
      );
      _fetchJournals();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Failed to save daily journal.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isToday =
        DateFormat('yyyy-MM-dd').format(DateTime.now()) ==
        _formattedSelectedDateISO;
    final String dateLabel = isToday
        ? "Today, ${DateFormat('MMMM d, yyyy').format(_selectedDate)}"
        : DateFormat('EEEE, MMMM d, yyyy').format(_selectedDate);

    return Scaffold(
      backgroundColor: bgLight,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryNavy))
          : RefreshIndicator(
              onRefresh: _fetchJournals,
              color: primaryNavy,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 14.0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Date & Entry Selector Card
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey.shade300),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.edit_calendar_rounded,
                                      size: 18,
                                      color: primaryNavy,
                                    ),
                                    const SizedBox(width: 6),
                                    const Text(
                                      'JOURNAL DATE',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: primaryNavy,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    if (isToday) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF2E7D32),
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                        child: const Text(
                                          'TODAY',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 9,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  dateLabel,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _pickDate,
                            icon: const Icon(Icons.calendar_month, size: 16),
                            label: const Text(
                              'Pick Date',
                              style: TextStyle(fontSize: 12),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryNavy,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 8,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Dean Feedback & Status Banner
                    if (_currentJournal != null)
                      _buildStatusAndFeedbackCard(_currentJournal!),

                    // Narrative Input Form Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey.shade300),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.assignment_outlined,
                                color: primaryNavy,
                                size: 20,
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Tasks & Activities Performed',
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.bold,
                                  color: primaryNavy,
                                ),
                              ),
                              const Text(
                                ' *',
                                style: TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Detail the tasks, projects, or duties you carried out during this shift.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _tasksController,
                            maxLines: 4,
                            decoration: InputDecoration(
                              hintText:
                                  'e.g., Assisted department staff with network maintenance, backed up database records, resolved PC troubleshooting tickets...',
                              hintStyle: TextStyle(
                                fontSize: 12.5,
                                color: Colors.grey.shade400,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              contentPadding: const EdgeInsets.all(12),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Row(
                            children: [
                              const Icon(
                                Icons.lightbulb_outline_rounded,
                                color: primaryNavy,
                                size: 20,
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Key Learnings & Reflections',
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.bold,
                                  color: primaryNavy,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'What new skills, techniques, or insights did you gain today?',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _learningsController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              hintText:
                                  'e.g., Learned how subnet masking works in enterprise networks; practiced professional customer communication...',
                              hintStyle: TextStyle(
                                fontSize: 12.5,
                                color: Colors.grey.shade400,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              contentPadding: const EdgeInsets.all(12),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Row(
                            children: [
                              const Icon(
                                Icons.troubleshoot_rounded,
                                color: primaryNavy,
                                size: 20,
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Challenges & Resolutions',
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.bold,
                                  color: primaryNavy,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                '(Optional)',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Encountered any technical or workplace difficulties and how were they solved?',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _challengesController,
                            maxLines: 2,
                            decoration: InputDecoration(
                              hintText:
                                  'e.g., IP conflict occurred on printer; resolved by checking DHCP leases...',
                              hintStyle: TextStyle(
                                fontSize: 12.5,
                                color: Colors.grey.shade400,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              contentPadding: const EdgeInsets.all(12),
                            ),
                          ),

                          const SizedBox(height: 18),

                          SizedBox(
                            width: double.infinity,
                            height: 46,
                            child: ElevatedButton.icon(
                              onPressed: _isSaving ? null : _saveJournal,
                              icon: _isSaving
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Icon(Icons.check_circle_outline),
                              label: Text(
                                _currentJournal != null
                                    ? 'Update Daily Narrative Report'
                                    : 'Submit Today\'s Narrative Report',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryNavy,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Past Entries History Carousel
                    if (_pastJournals.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Past Narrative Reports',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: primaryNavy,
                            ),
                          ),
                          Text(
                            '${_pastJournals.length} total recorded',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _pastJournals.length,
                        separatorBuilder: (ctx, i) => const SizedBox(height: 8),
                        itemBuilder: (ctx, i) {
                          final item = _pastJournals[i];
                          final String itemDate =
                              item['formatted_date'] ??
                              item['entry_date'] ??
                              '';
                          final bool isSelected = (item['entry_date'] ?? '')
                              .toString()
                              .startsWith(_formattedSelectedDateISO);

                          return InkWell(
                            onTap: () {
                              try {
                                final d = DateTime.parse(item['entry_date']);
                                setState(() => _selectedDate = d);
                                _syncCurrentJournalForDate();
                              } catch (_) {}
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFFF0F7FF)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected
                                      ? primaryNavy
                                      : Colors.grey.shade300,
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        itemDate,
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: isSelected
                                              ? primaryNavy
                                              : Colors.black87,
                                        ),
                                      ),
                                      _buildSmallStatusBadge(
                                        item['dean_status'] ?? 'Pending',
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item['tasks_completed'] ?? '',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  if ((item['dean_feedback'] ?? '')
                                      .toString()
                                      .isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFE0F2FE),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.chat_bubble_outline,
                                            size: 12,
                                            color: Color(0xFF0369A1),
                                          ),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              'Dean: "${item['dean_feedback']}"',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontStyle: FontStyle.italic,
                                                color: Color(0xFF0369A1),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatusAndFeedbackCard(Map<String, dynamic> journal) {
    final status = journal['dean_status'] ?? 'Pending';
    final feedback = journal['dean_feedback'] ?? '';
    final reviewedAt = journal['reviewed_at'] ?? '';

    Color bg = const Color(0xFFFFFBEB);
    Color border = const Color(0xFFFDE68A);
    Color textCol = const Color(0xFF92400E);
    String statusText = "⏳ Pending Dean Evaluation";

    if (status == 'Reviewed') {
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFFBBF7D0);
      textCol = const Color(0xFF166534);
      statusText = "✓ Reviewed & Noted by Dean";
    } else if (status == 'Commended') {
      bg = const Color(0xFFFDF2F8);
      border = const Color(0xFFFBCFE8);
      textCol = const Color(0xFF9D174D);
      statusText = "⭐ Commended by Dean (Exemplary)";
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                statusText,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: textCol,
                ),
              ),
              if (reviewedAt.isNotEmpty) ...[
                const Spacer(),
                Text(
                  reviewedAt,
                  style: TextStyle(
                    fontSize: 10,
                    color: textCol.withOpacity(0.8),
                  ),
                ),
              ],
            ],
          ),
          if (feedback.isNotEmpty) ...[
            const SizedBox(height: 6),
            const Divider(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.format_quote, size: 16, color: primaryNavy),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    feedback,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontStyle: FontStyle.italic,
                      color: primaryNavy,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSmallStatusBadge(String status) {
    Color bg = const Color(0xFFFEF3C7);
    Color text = const Color(0xFF92400E);
    String label = "Pending";

    if (status == 'Reviewed') {
      bg = const Color(0xFFECFDF5);
      text = const Color(0xFF065F46);
      label = "Reviewed";
    } else if (status == 'Commended') {
      bg = const Color(0xFFFDF2F8);
      text = const Color(0xFF9D174D);
      label = "Commended";
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: text,
          fontWeight: FontWeight.bold,
          fontSize: 10,
        ),
      ),
    );
  }
}
