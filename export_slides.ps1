$pptPath = "C:\Users\asati\OneDrive\Desktop\ProfiQ\ProfiQ_Hackathon_Presentation.pptx"
$pdfPath = "C:\Users\asati\OneDrive\Desktop\ProfiQ\ProfiQ_Hackathon_Presentation.pdf"
$slidesDir = "C:\Users\asati\OneDrive\Desktop\ProfiQ\slides_preview"

if (!(Test-Path $slidesDir)) {
    New-Item -ItemType Directory -Path $slidesDir | Out-Null
}

$pptApp = New-Object -ComObject PowerPoint.Application
try {
    $presentation = $pptApp.Presentations.Open($pptPath, $true, $false, $false)
    # Save as PDF (32 = ppSaveAsPDF)
    $presentation.SaveAs($pdfPath, 32)
    Write-Host "PDF exported: $pdfPath"

    # Export each slide as PNG (17 = ppSaveAsPNG)
    $presentation.SaveAs($slidesDir, 17)
    Write-Host "Slides PNG exported to: $slidesDir"
    
    $presentation.Close()
} finally {
    $pptApp.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($pptApp) | Out-Null
}
