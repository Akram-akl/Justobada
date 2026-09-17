@echo off
echo ==============================================
echo   Pushing updates to GitHub...
echo ==============================================

git add .

set commitMsg=
set /p commitMsg="Enter commit message (or press Enter to skip): "
if "%commitMsg%"=="" set commitMsg="New updates"

git commit -m "%commitMsg%"
git push origin main

echo.
echo ==============================================
echo   Push completed successfully!
echo ==============================================
pause
