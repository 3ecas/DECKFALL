# Draws the app icon (a gold card on ink, the same design as mac/makeicon.swift) and writes AppIcon.ico next to this file.
# Run by build.ps1 when the .ico is missing, or by hand: powershell -ExecutionPolicy Bypass -File win\makeicon.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sizes = 16, 24, 32, 48, 64, 128, 256
$ink = [System.Drawing.Color]::FromArgb(255, 18, 15, 23)
$gold = [System.Drawing.Color]::FromArgb(255, 227, 186, 92)

function RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath; $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90); $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure(); return $p
}

# One 32-bit BMP-style icon image per size (the format every Windows tool understands): BITMAPINFOHEADER, bottom-up BGRA pixels, empty AND mask.
$images = foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'; $g.InterpolationMode = 'HighQualityBicubic'
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.FillPath((New-Object System.Drawing.SolidBrush $ink), (RoundRect ($s * 0.06) ($s * 0.06) ($s * 0.88) ($s * 0.88) ($s * 0.2)))
  $card = RoundRect ($s * 0.3) ($s * 0.2) ($s * 0.4) ($s * 0.6) ($s * 0.06)
  $g.FillPath((New-Object System.Drawing.SolidBrush $gold), $card)
  $g.DrawPath((New-Object System.Drawing.Pen $ink, ([Math]::Max(1, $s * 0.02))), $card)
  $font = New-Object System.Drawing.Font 'Segoe UI', ($s * 0.34), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat; $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
  $g.DrawString('D', $font, (New-Object System.Drawing.SolidBrush $ink), (New-Object System.Drawing.RectangleF ($s * 0.3), ($s * 0.2), ($s * 0.4), ($s * 0.6)), $fmt)
  $g.Dispose()
  $rect = New-Object System.Drawing.Rectangle 0, 0, $s, $s
  $bd = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $rows = New-Object byte[] ($bd.Stride * $s)
  [System.Runtime.InteropServices.Marshal]::Copy($bd.Scan0, $rows, 0, $rows.Length)
  $bmp.UnlockBits($bd); $bmp.Dispose()
  $xor = New-Object byte[] ($s * $s * 4)
  for ($y = 0; $y -lt $s; $y++) { [Array]::Copy($rows, $y * $bd.Stride, $xor, ($s - 1 - $y) * $s * 4, $s * 4) }
  $andStride = [int]([Math]::Ceiling($s / 32.0) * 4)
  $and = New-Object byte[] ($andStride * $s)
  $ms = New-Object System.IO.MemoryStream; $w = New-Object System.IO.BinaryWriter $ms
  $w.Write([uint32]40); $w.Write([int32]$s); $w.Write([int32]($s * 2)); $w.Write([uint16]1); $w.Write([uint16]32); $w.Write([uint32]0)
  $w.Write([uint32]($xor.Length + $and.Length)); $w.Write([int32]0); $w.Write([int32]0); $w.Write([uint32]0); $w.Write([uint32]0)
  $w.Write($xor); $w.Write($and); $w.Flush()
  , $ms.ToArray()
}

# ICO container: 6-byte header, one 16-byte directory entry per image, then the images.
$out = New-Object System.IO.MemoryStream; $w = New-Object System.IO.BinaryWriter $out
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $s = $sizes[$i]; $b = $images[$i]; $dim = if ($s -ge 256) { 0 } else { $s }
  $w.Write([byte]$dim); $w.Write([byte]$dim); $w.Write([byte]0); $w.Write([byte]0)
  $w.Write([uint16]1); $w.Write([uint16]32); $w.Write([uint32]$b.Length); $w.Write([uint32]$offset)
  $offset += $b.Length
}
foreach ($b in $images) { $w.Write($b) }
$w.Flush()
$path = Join-Path $dir 'AppIcon.ico'
[IO.File]::WriteAllBytes($path, $out.ToArray())
"icon written: $path"
