@echo off
"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe" -u root -pMemits@396 --host=127.0.0.1 --routines --triggers --no-tablespaces --skip-add-drop-table --single-transaction --default-character-set=utf8mb4 ezeeflo_hr_payroll > "c:\Yasir\ERPMultiTenant\ERPMTSuite\hr_payroll_database\hr_payroll_schema_data.sql"
