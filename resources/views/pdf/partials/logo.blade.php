{{--
    Inline brand logo for PDFs. DomPDF's SVG engine (php-svg-lib) does not render
    the traced <path> artwork, and PNG embedding needs the GD extension (absent here),
    so for PDFs we embed a white-flattened JPEG of the logo (JPEG embeds without GD,
    and the white field is invisible on the white pages).
    Usage: @include('pdf.partials.logo', ['w' => 70])
--}}
@php
    $w    = $w ?? 70;
    $data = base64_encode(file_get_contents(public_path('images/logo.jpg')));
@endphp
<img src="data:image/jpeg;base64,{{ $data }}" style="width: {{ $w }}px; height: auto;" alt="JUMJ — Muraja'ah Summer">
