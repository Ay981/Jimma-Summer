{{--
    Inline brand logo for PDFs. The login page uses public/images/logo.svg via
    the React Logo component, but DomPDF drops most traced SVG path artwork and
    PNG embedding requires GD in this environment. The transparent SVG below is
    generated from public/images/logo.png with Python into simple rect geometry
    that DomPDF can render while preserving transparency.
    Usage: @include('pdf.partials.logo', ['w' => 70])
--}}
@php
    $w    = $w ?? 70;
    $data = base64_encode(file_get_contents(public_path('images/logo-login-transparent.svg')));
@endphp
<img src="data:image/svg+xml;base64,{{ $data }}" style="width: {{ $w }}px; height: auto;" alt="JUMJ — Muraja'ah Summer">
