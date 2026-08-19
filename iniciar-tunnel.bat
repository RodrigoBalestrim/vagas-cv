@echo off
chcp 65001 >nul
title Vagas CV - Tunnel 9Router + Vercel
echo.
echo ============================================
echo   VAGAS CV - TUNNEL PERMANENTE (9Router)
echo ============================================
echo.

:: Verifica se 9Router está rodando
curl -s --max-time 3 http://127.0.0.1:20128/api/health >nul 2>&1
if errorlevel 1 (
    echo [ERRO] 9Router nao esta rodando em http://127.0.0.1:20128
    echo        Inicie o 9Router antes de continuar.
    pause
    exit /b 1
)
echo [OK] 9Router rodando.

:: Inicia o cloudflared quick tunnel em background
echo [INFO] Iniciando cloudflared tunnel...
start "cloudflared-tunnel" cmd /c "npx cloudflared tunnel --url http://127.0.0.1:20128 --no-autoupdate > %TEMP%\cloudflared-tunnel.log 2>&1"

:: Aguarda o tunnel subir e extrai a URL
echo [INFO] Aguardando tunnel ficar pronto (ate 30s)...
set TUNNEL_URL=
for /l %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    for /f "tokens=*" %%u in ('findstr /r "trycloudflare.com" %TEMP%\cloudflared-tunnel.log 2^>nul') do (
        echo %%u | findstr /r "https://.*trycloudflare.com" >nul
        if not errorlevel 1 (
            for /f "tokens=2 delims=| " %%a in ("%%u") do set "TUNNEL_URL=%%a"
        )
    )
    if defined TUNNEL_URL goto :found
)

:found
if not defined TUNNEL_URL (
    echo [ERRO] Nao consegui extrair a URL do tunnel. Verifique %TEMP%\cloudflared-tunnel.log
    pause
    exit /b 1
)

echo [OK] Tunnel criado: %TUNNEL_URL%

:: Monta a URL base do endpoint Anthropic
set "AI_URL=%TUNNEL_URL%/v1"

echo [INFO] Atualizando ANTHROPIC_BASE_URL na Vercel...
echo %AI_URL% | npx vercel env add ANTHROPIC_BASE_URL production --yes >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Falha ao atualizar env var automaticamente.
    echo         Configure manualmente na Vercel Dashboard:
    echo         ANTHROPIC_BASE_URL = %AI_URL%
) else (
    echo [OK] ANTHROPIC_BASE_URL atualizado na Vercel.
)

echo [INFO] Redeploying na Vercel para aplicar...
cd /d "%~dp0"
npx vercel --prod --yes >nul 2>&1
echo [OK] Deploy concluido.

echo.
echo ============================================
echo   TUDO PRONTO!
echo   Tunnel: %TUNNEL_URL%
echo   (mantenha esta janela aberta / o processo rodando)
echo ============================================
echo.
echo Pressione qualquer tecla para encerrar o tunnel...
pause >nul
taskkill /f /im "cloudflared*" >nul 2>&1
echo Tunnel encerrado.
