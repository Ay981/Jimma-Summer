<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="{{ session('theme', 'light') === 'dark' ? 'dark' : '' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @inertiaHead
        @viteReactRefresh
        @vite(['resources/css/global.css', 'resources/js/app.jsx'])
    </head>
    <body>
        @inertia
    </body>
</html>
