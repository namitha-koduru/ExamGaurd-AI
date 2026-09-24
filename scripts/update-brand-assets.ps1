Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\namit\.gemini\antigravity-ide\brain\48e7c6c9-e550-46b8-989d-9582cb212c12\.user_uploaded\media_1790277710186.png"
$publicDir = "c:\Projects\ExamGaurd-AI\ExamGaurd-AI\public"

if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

$srcBitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)

function Resize-Image($src, $width, $height, $destPath) {
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    $graphics.DrawImage($src, 0, 0, $width, $height)
    $graphics.Dispose()
    
    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "Created: $destPath ($($width)x$($height))"
}

# 1. High res 512x512
Resize-Image $srcBitmap 512 512 "$publicDir\ExamGaurd.png"
Resize-Image $srcBitmap 512 512 "$publicDir\ExamGuard.png"
Resize-Image $srcBitmap 512 512 "$publicDir\logo.png"

# 2. Touch Icon 180x180
Resize-Image $srcBitmap 180 180 "$publicDir\apple-touch-icon.png"

# 3. Favicon 64x64 and 32x32
Resize-Image $srcBitmap 64 64 "$publicDir\favicon.png"
Resize-Image $srcBitmap 32 32 "$publicDir\favicon-32x32.png"

# 4. Favicon.ico (copy 32x32)
Copy-Item "$publicDir\favicon-32x32.png" "$publicDir\favicon.ico" -Force

$srcBitmap.Dispose()
Write-Host "All assets successfully updated from provided image!"
