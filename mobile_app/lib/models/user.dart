// SBC Internship Attendance System - Mobile App
// File: user.dart

// Main widget / service implementation
class UserModel {
  final int? id;
  final String studentId;
  final String firstName;
  final String lastName;
  final String email;
  final String password;
  final String course;
  final String yearLevel;
  final String department;
  final String profilePicture;
  final String lastSync;

  UserModel({
    this.id,
    required this.studentId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.password,
    this.course = '',
    this.yearLevel = '',
    this.department = '',
    this.profilePicture = '',
    required this.lastSync,
  });

  String get fullName => '$firstName $lastName'.trim();


  static String hashPassword(String rawPassword) {
    return rawPassword;
  }


  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'student_id': studentId,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'password': password,
      'course': course,
      'year_level': yearLevel,
      'department': department,
      'profile_picture': profilePicture,
      'last_sync': lastSync,
    };
  }


  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] != null ? int.tryParse(map['id'].toString()) : null,
      studentId: map['student_id']?.toString() ?? '',
      firstName: map['first_name'] ?? '',
      lastName: map['last_name'] ?? '',
      email: map['email'] ?? '',
      password: map['password'] ?? '',
      course: map['course'] ?? '',
      yearLevel: map['year_level'] ?? '',
      department: map['department'] ?? '',
      profilePicture: map['profile_picture'] ?? '',
      lastSync: map['last_sync'] ?? DateTime.now().toIso8601String(),
    );
  }


  factory UserModel.fromJson(
    Map<String, dynamic> json, {
    String rawPassword = '',
    String fallbackEmail = '',
  }) {
    String fullNameStr = json['full_name'] ?? json['name'] ?? '';
    List<String> nameParts = fullNameStr.split(' ');
    String fName = json['first_name'] ?? (nameParts.isNotEmpty ? nameParts.first : '');
    String lName = json['last_name'] ?? (nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '');

    String userEmail = (json['email'] != null && json['email'].toString().trim().isNotEmpty)
        ? json['email'].toString().trim()
        : fallbackEmail.trim();

    String pass = rawPassword.isNotEmpty ? rawPassword : (json['password'] ?? '');

    return UserModel(
      id: json['id'] != null ? int.tryParse(json['id'].toString()) : null,
      studentId: (json['student_id'] ?? json['ojt_id'] ?? json['student_number'] ?? '1').toString(),
      firstName: fName,
      lastName: lName,
      email: userEmail.toLowerCase(),
      password: pass,
      course: json['course_name'] ?? json['course'] ?? '',
      yearLevel: json['year_level']?.toString() ?? '4th Year',
      department: json['department'] ?? json['dean_name'] ?? 'College of Computer Studies',
      profilePicture: json['profile_picture'] ?? json['avatar'] ?? '',
      lastSync: DateTime.now().toIso8601String(),
    );
  }
}
