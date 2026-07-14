param(
  [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent)
)

Add-Type -AssemblyName System.Drawing

$backgroundColor = [System.Drawing.ColorTranslator]::FromHtml("#EFFAFA")
$inkColor = [System.Drawing.ColorTranslator]::FromHtml("#0F172A")
$accentColor = [System.Drawing.ColorTranslator]::FromHtml("#0891B2")
$transparent = [System.Drawing.Color]::Transparent

function New-TimeSlicesBitmap {
  param(
    [int]$Size,
    [bool]$IncludeBackground,
    [bool]$RoundBackground,
    [bool]$Monochrome
  )

  $bitmap = [System.Drawing.Bitmap]::new(
    $Size,
    $Size,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.Clear($transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.ScaleTransform($Size / 1024.0, $Size / 1024.0)

    if ($IncludeBackground) {
      $backgroundBrush = [System.Drawing.SolidBrush]::new($backgroundColor)
      try {
        if ($RoundBackground) {
          $graphics.FillEllipse($backgroundBrush, 0, 0, 1024, 1024)
        } else {
          $graphics.FillRectangle($backgroundBrush, 0, 0, 1024, 1024)
        }
      } finally {
        $backgroundBrush.Dispose()
      }
    }

    $markColor = if ($Monochrome) { [System.Drawing.Color]::Black } else { $inkColor }
    $nodeColor = if ($Monochrome) { [System.Drawing.Color]::Black } else { $accentColor }
    $pen = [System.Drawing.Pen]::new($markColor, 70)
    $nodeBrush = [System.Drawing.SolidBrush]::new($nodeColor)

    try {
      $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
      $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

      $graphics.DrawLine($pen, 250, 350, 610, 350)
      $graphics.DrawLine($pen, 390, 512, 760, 512)
      $graphics.DrawLine($pen, 250, 674, 560, 674)

      $graphics.FillEllipse($nodeBrush, 710, 312, 76, 76)
      $graphics.FillEllipse($nodeBrush, 222, 474, 76, 76)
      $graphics.FillEllipse($nodeBrush, 662, 636, 76, 76)
    } finally {
      $pen.Dispose()
      $nodeBrush.Dispose()
    }

    return $bitmap
  } catch {
    $bitmap.Dispose()
    throw
  } finally {
    $graphics.Dispose()
  }
}

function Save-TimeSlicesPng {
  param(
    [string]$Path,
    [int]$Size,
    [bool]$IncludeBackground = $true,
    [bool]$RoundBackground = $false,
    [bool]$Monochrome = $false
  )

  $directory = Split-Path $Path -Parent
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  $bitmapParameters = @{
    Size = $Size
    IncludeBackground = $IncludeBackground
    RoundBackground = $RoundBackground
    Monochrome = $Monochrome
  }
  $bitmap = New-TimeSlicesBitmap @bitmapParameters

  try {
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $bitmap.Dispose()
  }
}

$assets = Join-Path $ProjectRoot "assets"
Save-TimeSlicesPng -Path (Join-Path $assets "icon.png") -Size 1024
Save-TimeSlicesPng -Path (Join-Path $assets "adaptive-icon.png") -Size 1024 -IncludeBackground $false
Save-TimeSlicesPng -Path (Join-Path $assets "monochrome-icon.png") -Size 1024 -IncludeBackground $false -Monochrome $true
Save-TimeSlicesPng -Path (Join-Path $assets "splash-icon.png") -Size 1024 -IncludeBackground $false

$launcherSizes = [ordered]@{
  mdpi = 48
  hdpi = 72
  xhdpi = 96
  xxhdpi = 144
  xxxhdpi = 192
}

foreach ($entry in $launcherSizes.GetEnumerator()) {
  $mipmapDir = Join-Path $ProjectRoot "android/app/src/main/res/mipmap-$($entry.Key)"
  foreach ($legacyFile in @("ic_launcher.webp", "ic_launcher_round.webp")) {
    $legacyPath = Join-Path $mipmapDir $legacyFile
    if (Test-Path $legacyPath) {
      Remove-Item -LiteralPath $legacyPath -Force
    }
  }

  Save-TimeSlicesPng -Path (Join-Path $mipmapDir "ic_launcher.png") -Size $entry.Value
  $roundIconParameters = @{
    Path = Join-Path $mipmapDir "ic_launcher_round.png"
    Size = $entry.Value
    RoundBackground = $true
  }
  Save-TimeSlicesPng @roundIconParameters
}

$splashSizes = [ordered]@{
  mdpi = 288
  hdpi = 432
  xhdpi = 576
  xxhdpi = 864
  xxxhdpi = 1152
}

foreach ($entry in $splashSizes.GetEnumerator()) {
  $drawableDir = Join-Path $ProjectRoot "android/app/src/main/res/drawable-$($entry.Key)"
  $splashParameters = @{
    Path = Join-Path $drawableDir "splashscreen_logo.png"
    Size = $entry.Value
    IncludeBackground = $false
  }
  Save-TimeSlicesPng @splashParameters
}

Write-Output "Generated Time Slices app icon assets."
