@echo off
REM Minimal installation script for Windows
REM This installs only the required packages (no TensorFlow)
REM The system will use mock predictions which work perfectly for demos

echo Installing minimal dependencies...
echo.

REM Install Pillow and NumPy (required for image processing)
py -m pip install Pillow numpy

echo.
echo Installation complete!
echo.
echo NOTE: TensorFlow/PyTorch is NOT installed.
echo The system will use MOCK PREDICTIONS which work perfectly for:
echo - Development and testing
echo - Academic demonstrations
echo - System functionality testing
echo.
echo To install TensorFlow later (optional):
echo   py -m pip install tensorflow-cpu
echo.
pause

