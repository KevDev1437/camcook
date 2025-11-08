# Script PowerShell pour corriger les problemes de theme
# Remplace theme.background.white et theme.text.secondary par des versions avec fallback

Write-Host "Correction des couleurs de theme..." -ForegroundColor Cyan
Write-Host ""

$basePath = "mobile-expo\src"
$files = Get-ChildItem -Path $basePath -Recurse -Include *.js,*.jsx,*.ts,*.tsx | 
    Where-Object { $_.FullName -notmatch 'node_modules|build|dist|\.expo|theme\.js' }

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Compter les occurrences avant
    $beforeWhite = ([regex]::Matches($content, 'theme\.background\.white')).Count
    $beforeSecondary = ([regex]::Matches($content, 'theme\.text\.secondary')).Count
    
    # Remplacer theme.background.white (sans fallback) avec fallback
    # Pattern 1: color={theme.background.white} (sans parenthèses ni fallback)
    $content = $content -replace 'color=\{theme\.background\.white\}(?!\s*\|\|)', 'color={(theme.background.white || ''#fff'')}'
    
    # Pattern 2: { color: theme.background.white } (sans parenthèses ni fallback)
    $content = $content -replace '(\{\s*color:\s*)theme\.background\.white(\s*[,}])', '$1(theme.background.white || ''#fff'')$2'
    
    # Pattern 3: backgroundColor: theme.background.white (sans parenthèses ni fallback)
    $content = $content -replace '(\{\s*backgroundColor:\s*)theme\.background\.white(\s*[,}])', '$1(theme.background.white || ''#fff'')$2'
    
    # Pattern 4: borderColor: theme.background.white (sans parenthèses ni fallback)
    $content = $content -replace '(\{\s*borderColor:\s*)theme\.background\.white(\s*[,}])', '$1(theme.background.white || ''#fff'')$2'
    
    # Pattern 5: backgroundGradientFrom: theme.background.white
    $content = $content -replace '(backgroundGradientFrom:\s*)theme\.background\.white(\s*[,}])', '$1(theme.background.white || ''#fff'')$2'
    
    # Pattern 6: backgroundGradientTo: theme.background.white
    $content = $content -replace '(backgroundGradientTo:\s*)theme\.background\.white(\s*[,}])', '$1(theme.background.white || ''#fff'')$2'
    
    # Pattern 7: backgroundColor: theme.background.white (dans chartConfig, sans parenthèses)
    $content = $content -replace '(backgroundColor:\s*)theme\.background\.white(\s*[,}])', '$1(theme.background.white || ''#fff'')$2'
    
    # Remplacer theme.text.secondary (sans fallback) avec fallback
    # Pattern 1: color={theme.text.secondary} (sans parenthèses ni fallback)
    $content = $content -replace 'color=\{theme\.text\.secondary\}(?!\s*\|\|)', 'color={(theme.text.secondary || ''#666'')}'
    
    # Pattern 2: { color: theme.text.secondary } (sans parenthèses ni fallback)
    $content = $content -replace '(\{\s*color:\s*)theme\.text\.secondary(\s*[,}])', '$1(theme.text.secondary || ''#666'')$2'
    
    # Pattern 3: labelColor: () => theme.text.secondary (sans parenthèses ni fallback)
    $content = $content -replace '(labelColor:\s*\(\)\s*=>\s*)theme\.text\.secondary(\s*[,}])', '$1(theme.text.secondary || ''#666'')$2'
    
    # Pattern 4: color: () => theme.text.secondary (sans parenthèses ni fallback)
    $content = $content -replace '(color:\s*\(\)\s*=>\s*)theme\.text\.secondary(\s*[,}])', '$1(theme.text.secondary || ''#666'')$2'
    
    # Compter les remplacements
    $afterWhite = ([regex]::Matches($content, 'theme\.background\.white')).Count
    $afterSecondary = ([regex]::Matches($content, 'theme\.text\.secondary')).Count
    $fileReplacements = ($beforeWhite - $afterWhite) + ($beforeSecondary - $afterSecondary)
    
    if ($fileReplacements -gt 0) {
        # Sauvegarder le fichier modifie
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "OK - $($file.Name): $fileReplacements remplacement(s)" -ForegroundColor Green
        $totalFiles++
        $totalReplacements += $fileReplacements
    }
}

Write-Host ""
Write-Host "Correction terminee !" -ForegroundColor Cyan
Write-Host "Fichiers modifies: $totalFiles" -ForegroundColor Yellow
Write-Host "Total de remplacements: $totalReplacements" -ForegroundColor Yellow
Write-Host ""
Write-Host "Redemarrez l'application pour voir les changements." -ForegroundColor Magenta
