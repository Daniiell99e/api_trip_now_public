@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ================================================
::  TRIPNOW - SUITE DE TESTES DE SEGURANCA
::  Requer: Docker Desktop e curl (Windows 10+)
:: ================================================

set BACKEND=http://localhost:3333
set ZAP_FRONTEND=http://host.docker.internal:3000
set ZAP_BACKEND=http://host.docker.internal:3333
set RELATORIO_DIR=C:\zap-relatorios
set COOKIE_A=%TEMP%\tripnow_ck_a.txt
set COOKIE_B=%TEMP%\tripnow_ck_b.txt

:: ================================================
:MENU
:: ================================================
cls
echo.
echo  =====================================================
echo    TRIPNOW ^| SUITE DE TESTES DE SEGURANCA
echo  =====================================================
echo.
echo   [1]  Scan Passivo ZAP  ^(Frontend - porta 3000^)
echo   [2]  Scan Ativo ZAP    ^(Frontend - porta 3000^)
echo   [3]  Scan Passivo ZAP  ^(Backend  - porta 3333^)
echo   [4]  Testes IDOR e Controle de Acesso
echo   [5]  Verificar Headers HTTP de Seguranca
echo   [6]  Abrir Sucuri SiteCheck no navegador
echo   [0]  Sair
echo.
echo  =====================================================
echo.
set /p OPCAO=   Digite a opcao desejada:

if "!OPCAO!"=="1" goto :PASSIVO_FRONTEND
if "!OPCAO!"=="2" goto :ATIVO_FRONTEND
if "!OPCAO!"=="3" goto :PASSIVO_BACKEND
if "!OPCAO!"=="4" goto :IDOR
if "!OPCAO!"=="5" goto :HEADERS
if "!OPCAO!"=="6" goto :SUCURI
if "!OPCAO!"=="0" goto :SAIR

echo   Opcao invalida. Tente novamente.
timeout /t 2 >nul
goto :MENU


:: ================================================
:PASSIVO_FRONTEND
:: ================================================
cls
echo.
echo  [ZAP] SCAN PASSIVO - Frontend ^(:3000^)
echo  -----------------------------------------------
echo  Modo passivo: apenas observa o trafego, sem ataques.
echo  Duracao estimada: 3 a 10 minutos.
echo.

if not exist "%RELATORIO_DIR%" mkdir "%RELATORIO_DIR%"

echo  Iniciando scan... aguarde.
echo.
docker run --rm ^
  -v %RELATORIO_DIR%:/zap/wrk/:rw ^
  ghcr.io/zaproxy/zaproxy:stable ^
  zap-baseline.py ^
  -t %ZAP_FRONTEND% ^
  -r relatorio_passivo_frontend.html ^
  -I

echo.
echo  -----------------------------------------------
echo  [OK] Relatorio salvo em:
echo       %RELATORIO_DIR%\relatorio_passivo_frontend.html
echo.
set /p ABRIR=  Abrir relatorio no navegador? (S/N):
if /i "!ABRIR!"=="S" start "" "%RELATORIO_DIR%\relatorio_passivo_frontend.html"
echo.
pause
goto :MENU


:: ================================================
:ATIVO_FRONTEND
:: ================================================
cls
echo.
echo  [ZAP] SCAN ATIVO - Frontend ^(:3000^)
echo  -----------------------------------------------
echo  ATENCAO: Scan ativo simula ataques reais.
echo  Use APENAS em ambiente de desenvolvimento local!
echo  Duracao estimada: 30 a 60 minutos.
echo.
set /p CONF=  Confirma execucao? (S/N):
if /i not "!CONF!"=="S" goto :MENU

if not exist "%RELATORIO_DIR%" mkdir "%RELATORIO_DIR%"

echo.
echo  Iniciando scan ativo... aguarde.
echo  ^(O scan pode parecer travado - isso e normal^)
echo.
docker run --rm ^
  -v %RELATORIO_DIR%:/zap/wrk/:rw ^
  ghcr.io/zaproxy/zaproxy:stable ^
  zap-full-scan.py ^
  -t %ZAP_FRONTEND% ^
  -r relatorio_ativo_frontend.html ^
  -I

echo.
echo  -----------------------------------------------
echo  [OK] Relatorio salvo em:
echo       %RELATORIO_DIR%\relatorio_ativo_frontend.html
echo.
set /p ABRIR=  Abrir relatorio no navegador? (S/N):
if /i "!ABRIR!"=="S" start "" "%RELATORIO_DIR%\relatorio_ativo_frontend.html"
echo.
pause
goto :MENU


:: ================================================
:PASSIVO_BACKEND
:: ================================================
cls
echo.
echo  [ZAP] SCAN PASSIVO - Backend ^(:3333^)
echo  -----------------------------------------------
echo  Duracao estimada: 3 a 10 minutos.
echo.

if not exist "%RELATORIO_DIR%" mkdir "%RELATORIO_DIR%"

echo  Iniciando scan... aguarde.
echo.
docker run --rm ^
  -v %RELATORIO_DIR%:/zap/wrk/:rw ^
  ghcr.io/zaproxy/zaproxy:stable ^
  zap-baseline.py ^
  -t %ZAP_BACKEND% ^
  -r relatorio_passivo_backend.html ^
  -I

echo.
echo  -----------------------------------------------
echo  [OK] Relatorio salvo em:
echo       %RELATORIO_DIR%\relatorio_passivo_backend.html
echo.
set /p ABRIR=  Abrir relatorio no navegador? (S/N):
if /i "!ABRIR!"=="S" start "" "%RELATORIO_DIR%\relatorio_passivo_backend.html"
echo.
pause
goto :MENU


:: ================================================
:IDOR
:: ================================================
cls
echo.
echo  [IDOR] TESTES DE CONTROLE DE ACESSO
echo  -----------------------------------------------
echo  Necessario: 2 usuarios comuns cadastrados no banco
echo  e o ID de um roteiro pertencente ao Usuario A.
echo.
set /p EMAIL_A=  Email do Usuario A (dono do roteiro):
set /p SENHA_A=  Senha do Usuario A:
echo.
set /p EMAIL_B=  Email do Usuario B (outro usuario):
set /p SENHA_B=  Senha do Usuario B:
echo.
set /p ID_ROTEIRO=  ID do roteiro do Usuario A:
set /p ID_USER_A=   ID (numero) do Usuario A no banco:
echo.
echo  -----------------------------------------------
echo  Fazendo login dos usuarios...
echo.

:: Login A - salva cookie
curl -s -X POST %BACKEND%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"!EMAIL_A!\",\"password\":\"!SENHA_A!\"}" ^
  -c "!COOKIE_A!" > %TEMP%\login_resp_a.txt

:: Login B - salva cookie
curl -s -X POST %BACKEND%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"!EMAIL_B!\",\"password\":\"!SENHA_B!\"}" ^
  -c "!COOKIE_B!" > %TEMP%\login_resp_b.txt

:: Extrair token do JSON se existir (para fallback com Bearer)
for /f "delims=" %%T in ('powershell -Command "$j=Get-Content '%TEMP%\login_resp_a.txt' -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue; if($j.token){$j.token}elseif($j.access_token){$j.access_token}else{''"') do set TOKEN_A=%%T
for /f "delims=" %%T in ('powershell -Command "$j=Get-Content '%TEMP%\login_resp_b.txt' -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue; if($j.token){$j.token}elseif($j.access_token){$j.access_token}else{''"') do set TOKEN_B=%%T

echo  Logins realizados. Executando testes...
echo.
echo  =====================================================
echo   RESULTADOS
echo  =====================================================
echo.

:: ---- TESTE 1 ----
echo  [TESTE 1] Sem autenticacao - GET /roteiros/!ID_ROTEIRO!
echo  Esperado: 401 Unauthorized
curl -s -o nul -w "  Status recebido: %%{http_code}" %BACKEND%/roteiros/!ID_ROTEIRO!
echo.
echo.

:: ---- TESTE 2 ----
echo  [TESTE 2] Usuario A acessa o PROPRIO roteiro
echo  Esperado: 200 OK
curl -s -o nul -w "  Status recebido: %%{http_code}" %BACKEND%/roteiros/!ID_ROTEIRO! -b "!COOKIE_A!"
if defined TOKEN_A (
  if not "!TOKEN_A!"=="" (
    curl -s -o nul -w "  Status recebido ^(Bearer^): %%{http_code}" %BACKEND%/roteiros/!ID_ROTEIRO! -H "Authorization: Bearer !TOKEN_A!"
  )
)
echo.
echo.

:: ---- TESTE 3 ----
echo  [TESTE 3] IDOR - Usuario B acessa roteiro do Usuario A
echo  Esperado: 404 Not Found ^(nao e o dono^)
curl -s -o nul -w "  Status recebido: %%{http_code}" %BACKEND%/roteiros/!ID_ROTEIRO! -b "!COOKIE_B!"
if defined TOKEN_B (
  if not "!TOKEN_B!"=="" (
    curl -s -o nul -w "  Status recebido ^(Bearer^): %%{http_code}" %BACKEND%/roteiros/!ID_ROTEIRO! -H "Authorization: Bearer !TOKEN_B!"
  )
)
echo.
echo.

:: ---- TESTE 4 ----
echo  [TESTE 4] IDOR - Usuario B tenta DELETAR conta do Usuario A
echo  Esperado: 403 Forbidden
curl -s -o nul -w "  Status recebido: %%{http_code}" -X DELETE %BACKEND%/user/!ID_USER_A! -b "!COOKIE_B!"
echo.
echo.

:: ---- TESTE 5 ----
echo  [TESTE 5] Escalada de privilegio - /admin/stats sem ser admin
echo  Esperado: 403 Forbidden ou 404 Not Found
curl -s -o nul -w "  Status recebido: %%{http_code}" %BACKEND%/admin/stats -b "!COOKIE_A!"
echo.
echo.

:: ---- TESTE 6 ----
echo  [TESTE 6] Sem autenticacao - GET /user/profile
echo  Esperado: 401 Unauthorized
curl -s -o nul -w "  Status recebido: %%{http_code}" %BACKEND%/user/profile
echo.
echo.

echo  =====================================================
echo  [FIM] Testes IDOR concluidos.
echo  =====================================================
echo.
:: Limpeza dos arquivos temporarios
del /q "!COOKIE_A!" >nul 2>&1
del /q "!COOKIE_B!" >nul 2>&1
del /q "%TEMP%\login_resp_a.txt" >nul 2>&1
del /q "%TEMP%\login_resp_b.txt" >nul 2>&1

pause
goto :MENU


:: ================================================
:HEADERS
:: ================================================
cls
echo.
echo  [HEADERS] VERIFICACAO DE HEADERS HTTP
echo  -----------------------------------------------
echo  Verificando headers retornados pelo backend...
echo.
echo  --- Backend (%BACKEND%/health) ---
curl -s -I %BACKEND%/health
echo.
echo  -----------------------------------------------
echo  Headers de seguranca esperados:
echo    X-Frame-Options: DENY
echo    X-Content-Type-Options: nosniff
echo    Content-Security-Policy: ...
echo    Referrer-Policy: ...
echo    Strict-Transport-Security: ... ^(apenas HTTPS^)
echo.
pause
goto :MENU


:: ================================================
:SUCURI
:: ================================================
cls
echo.
echo  [SUCURI] Abrindo Sucuri SiteCheck no navegador...
echo.
echo  Instrucoes:
echo    1. Cole o dominio do seu frontend no Netlify
echo    2. Clique em "Scan Website"
echo    3. Verifique: Malware, Blacklist e Security Headers
echo.
start "" "https://sitecheck.sucuri.net"
timeout /t 2 >nul
goto :MENU


:: ================================================
:SAIR
:: ================================================
cls
echo.
echo  Encerrando. Ate logo!
echo.
exit /b
