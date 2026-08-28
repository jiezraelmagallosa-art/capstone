# SBC Internship Attendance & Verification System
# DEPLOYMENT GUIDE
# ================================================================
# READ THIS BEFORE DEPLOYING TO A PRODUCTION SERVER
# ================================================================


## STEP 1 — Backend Configuration (COMPLETED)
# ----------------------------------------------------------------
# Your `backend/config.php` has already been configured with your InfinityFree MySQL credentials:
#   DB_HOST → sql110.infinityfree.com
#   DB_USER → if0_42771510
#   DB_PASS → 2tG0ijV6kq8
#   DB_NAME → if0_42771510_sbc_internship_db
#   DB_PORT → 3306


## STEP 2 — Upload Files to InfinityFree `htdocs`
# ----------------------------------------------------------------
# Upload the following folders and files directly inside the `htdocs/` folder in InfinityFree
# (via InfinityFree Online File Manager or FileZilla / FTP):
#
#   📁 /backend/          (all PHP API scripts & config)
#   📁 /web_admin/        (Dean Admin Web Portal HTML/CSS/JS)
#   📁 /assets/           (shared logos & graphics)
#   📁 /uploads/          (selfies & document upload directories)
#   📄 /index.php         (root landing & router)
#   📄 /.htaccess         (web server configuration)
#   📁 /database/         (SQL schema & migrate.php)
#
# ⚠️ DO NOT upload:
#   ❌ /mobile_app/       (Flutter source code — build APK instead)
#   ❌ /.git/             (Git version control files)


## STEP 3 — Initialize / Migrate Database
# ----------------------------------------------------------------
# Option A (Easiest — 1-Click Migration via Browser):
#   Visit in your browser:
#   👉 http://your-domain.infinityfreeapp.com/backend/migrate.php
#   (or http://your-domain.epizy.com/backend/migrate.php)
#
#   This will automatically create all tables (Users, Student, OJT,
#   Attendance, Training_Site, Course, Photo, Absence_Requests) and
#   seed initial course data and dean admin credentials.
#
# Option B (phpMyAdmin Manual Import):
#   1. Go to InfinityFree Control Panel → phpMyAdmin → connect to `if0_42771510_sbc_internship_db`
#   2. Click "Import" → Select `database/sbc_internship_db.sql` → Click "Go"


## STEP 4 — Configure Mobile App & Rebuild APK
# ----------------------------------------------------------------
# In `mobile_app/lib/core/constants.dart`, set your hosted InfinityFree URL:
#   static String _activeHost = "your-domain.infinityfreeapp.com";
#
# Build your Flutter APK:
#   cd mobile_app
#   flutter build apk --release


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
