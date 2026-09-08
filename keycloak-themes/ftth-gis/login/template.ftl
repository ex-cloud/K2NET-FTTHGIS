<#macro registrationLayout displayInfo=false displayMessage=true displayRequiredFields=false showAnotherWayIfPresent=true>
<!DOCTYPE html>
<html lang="${(locale.currentLanguageTag)!'en'}" class="dark">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${msg("loginTitle", ((realm.displayName)!'FTTH GIS Platform'))}</title>
    <link rel="icon" href="${(url.resourcesPath)!''}/img/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        html, body {
            height: 100%;
            width: 100%;
            background: #09090b;
            color: #f4f4f5;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
        }
        ::selection {
            background: rgba(34, 197, 94, 0.25);
            color: #22c55e;
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #09090b;
        }
        ::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
        }
    </style>
    <#if (properties.styles)?has_content>
        <#list (properties.styles)?split(' ') as style>
            <link href="${(url.resourcesPath)!''}/${style}" rel="stylesheet" />
        </#list>
    </#if>
</head>
<body style="min-height:100vh;width:100%;display:flex;background:#09090b;">
    <#nested "form">
</body>
</html>
</#macro>
