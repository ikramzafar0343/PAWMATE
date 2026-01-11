@echo off
REM TensorFlow installation script for Windows
REM Tries multiple installation methods

echo Attempting to install TensorFlow...
echo.

REM Method 1: Try standard TensorFlow
echo Trying: pip install tensorflow
py -m pip install tensorflow
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! TensorFlow installed.
    goto :end
)

echo.
echo Standard TensorFlow failed. Trying CPU-only version...
echo.

REM Method 2: Try CPU-only version (lighter, easier to install)
py -m pip install tensorflow-cpu
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! TensorFlow CPU installed.
    goto :end
)

echo.
echo CPU version failed. Trying older version...
echo.

REM Method 3: Try older version
py -m pip install tensorflow==2.9.0
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! TensorFlow 2.9.0 installed.
    goto :end
)

echo.
echo ========================================
echo All TensorFlow installation methods failed.
echo ========================================
echo.
echo The system will work WITHOUT TensorFlow using mock predictions.
echo This is perfect for:
echo   - Development and testing
echo   - Academic demonstrations
echo   - System functionality testing
echo.
echo To proceed without TensorFlow, install minimal dependencies:
echo   py -m pip install Pillow numpy
echo.

:end
pause

