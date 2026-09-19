# Datathon package helper
$files = @('backend','frontend/app','frontend/public/dashboard_data.json','frontend/package.json','frontend/package-lock.json','frontend/next.config.mjs','frontend/tsconfig.json','frontend/react-simple-maps.d.ts','data','README.md','submission/README.txt','submission/Destinasi_Seimbang_Dashboard_Static.pdf')
Compress-Archive -Path $files -DestinationPath submission/Team_DestinasiSeimbang_Datathon2026_Dashboard.zip -Force
