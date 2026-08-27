# SBC Internship Attendance & Verification System
# DEPLOYMENT GUIDE
# ================================================================
# READ THIS BEFORE DEPLOYING TO A PRODUCTION SERVER
# ================================================================


## STEP 1 — Configure the Backend (ONE FILE TO EDIT)
# ----------------------------------------------------------------
# Open this file and change all values marked [CHANGE ME]:

  backend/config.php

# What to change:
#   DB_USER     → your production MySQL username
#   DB_PASS     → your production MySQL password
#   DB_HOST     → your database server host (usually 'localhost')
#   CORS_ORIGIN → your production domain, e.g. 'https://sbc.edu.ph'
#                 (leave as '*' for capstone/demo deployment)


## STEP 2 — Configure the Mobile App (ONE LINE TO EDIT)
# ----------------------------------------------------------------
# Open this file:

  mobile_app/lib/core/constants.dart

# Change line 22:
#   static String _activeHost = "YOUR_SERVER_IP_OR_DOMAIN";
#
# Examples:
#   static String _activeHost = "192.168.1.100";         # Local school IP
#   static String _activeHost = "https://sbc.edu.ph";   # Public domain
#
# Then rebuild the APK:
#   cd mobile_app
#   flutter build apk --release
#
# The built APK will be at:
#   mobile_app/build/app/outputs/flutter-apk/app-release.apk


## STEP 3 — Upload Files to Your Server
# ----------------------------------------------------------------
# Upload these folders/files to your web server's public directory:

  /backend/          (all PHP files)
  /web_admin/        (HTML + CSS + JS for Dean's portal)
  /assets/           (shared images)
  /uploads/          (leave empty, auto-created at runtime)
  /index.php         (root router)
  /.htaccess         (web server configuration)
  /database/         (SQL schema + migrate.php)

# DO NOT upload:
#   /mobile_app/      (this is the Flutter source — compile to APK instead)
#   /.git/            (not needed on server)
#   /mobile_app/build/ (build artifacts)


## STEP 4 — Set Up the Database
# ----------------------------------------------------------------
# Option A: Use the migration tool (recommended)
#   Visit in browser: https://your-domain.com/backend/migrate.php
#
# Option B: Import the SQL file manually
#   In phpMyAdmin: Import → database/sbc_internship_db.sql


## STEP 5 — Set PHP Upload Limits on Server
# ----------------------------------------------------------------
# If selfie/photo uploads fail, increase limits in cPanel or php.ini:
#   upload_max_filesize = 10M
#   post_max_size = 15M
#   memory_limit = 256M


## STEP 6 — First Login & Security
# ----------------------------------------------------------------
# After deployment, do these immediately:
#
# Dean/Admin portal: https://your-domain.com/web_admin/
#   Login: dean@sbc.edu.ph / password
#   → Go to Settings and change the password immediately!
#
# Student mobile app:
#   Test login: student@sbc.edu.ph / password
#   → Advise students to register their own accounts


## DEFAULT ACCOUNT CREDENTIALS (CHANGE IMMEDIATELY)
# ----------------------------------------------------------------
#   Dean Admin:  dean@sbc.edu.ph     / password
#   Test Student: student@sbc.edu.ph / password
#
#   ⚠️  WARNING: Change or delete these after first login!


## VERIFY DEPLOYMENT
# ----------------------------------------------------------------
# 1. Visit: https://your-domain.com/backend/migrate.php
#    → Should show green "✔ Ready & Migrated" with table counts
#
# 2. Visit: https://your-domain.com/web_admin/
#    → Dean login page should load
#
# 3. Open mobile app → enter server IP/domain → login as student
#    → Dashboard should load with OJT progress
