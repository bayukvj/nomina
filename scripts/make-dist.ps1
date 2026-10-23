$root = 'C:\laragon\www\nomina'
$zipPath = Join-Path $root 'nomina-team.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$excludeDirs = @('node_modules', 'dist', '.astro', 'public\uploads', 'drizzle\meta')
$excludeFiles = @('.env', '.env.local', '.installed', '.gitignore', 'GETTING-STARTED.md', 'DEPLOY-FLY.md', 'Dockerfile', 'fly.toml')

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$allFiles = Get-ChildItem -Path $root -Recurse -File -Force
$count = 0

foreach ($f in $allFiles) {
  $rel = $f.FullName.Substring($root.Length + 1)
  $skip = $false

  foreach ($ex in $excludeDirs) {
    $exPath = Join-Path $root $ex
    if ($f.FullName.StartsWith($exPath)) { $skip = $true; break }
  }

  if (-not $skip) {
    foreach ($ex in $excludeFiles) {
      if ($f.Name -eq $ex) { $skip = $true; break }
    }
  }

  if (-not $skip) {
    $entry = $zip.CreateEntryFromFile($f.FullName, $rel.Replace('\', '/'), [System.IO.Compression.CompressionLevel]::Optimal)
    $count++
  }
}

$zip.Dispose()
Write-Host "Created nomina-team.zip with $count files"
