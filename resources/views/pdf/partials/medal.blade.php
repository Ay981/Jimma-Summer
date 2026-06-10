{{--
    Medal / trophy graphic for PDF (DomPDF-safe inline SVG — solid fills only, no gradients).
    Usage: @include('pdf.partials.medal', ['place' => 1, 'size' => 40])
      place: 1 = gold trophy, 2 = silver medal, 3 = bronze medal
      size:  pixel width/height (optional, default 40)
--}}
@php
    $size = $size ?? 40;
    $palette = [
        1 => ['main' => '#C9A227', 'dark' => '#9A7B12', 'deep' => '#7A610E'],
        2 => ['main' => '#AEB4BC', 'dark' => '#828A93', 'deep' => '#6B727A'],
        3 => ['main' => '#C07A3E', 'dark' => '#8A5524', 'deep' => '#6E411B'],
    ];
    $c = $palette[$place] ?? $palette[3];
    $ribbon = '#2d6a4f';
    $ribbonDark = '#1a3a2a';
@endphp

@if ($place == 1)
    {{-- Gold trophy (path-free — DomPDF's SVG engine is unreliable with <path>) --}}
    <svg width="{{ $size }}" height="{{ $size }}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="14" rx="5" ry="6.5" fill="none" stroke="{{ $c['dark'] }}" stroke-width="2.5"/>
        <ellipse cx="34" cy="14" rx="5" ry="6.5" fill="none" stroke="{{ $c['dark'] }}" stroke-width="2.5"/>
        <polygon points="13,7 35,7 31,21 17,21" fill="{{ $c['main'] }}"/>
        <ellipse cx="24" cy="21" rx="7" ry="3.2" fill="{{ $c['main'] }}"/>
        <rect x="22" y="22" width="4" height="6" fill="{{ $c['dark'] }}"/>
        <rect x="15" y="28" width="18" height="4.5" rx="1.5" fill="{{ $c['dark'] }}"/>
        <rect x="12" y="33" width="24" height="3.5" rx="1.5" fill="{{ $c['deep'] }}"/>
        <text x="24" y="17" text-anchor="middle" font-size="11" font-family="Arial" font-weight="bold" fill="#fff8e1">1</text>
    </svg>
@else
    {{-- Silver / bronze medal --}}
    <svg width="{{ $size }}" height="{{ $size }}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <polygon points="15,3 23,3 21,24 13,24" fill="{{ $ribbon }}"/>
        <polygon points="33,3 25,3 27,24 35,24" fill="{{ $ribbonDark }}"/>
        <circle cx="24" cy="31" r="13" fill="{{ $c['dark'] }}"/>
        <circle cx="24" cy="31" r="10.5" fill="{{ $c['main'] }}"/>
        <text x="24" y="36" text-anchor="middle" font-size="14" font-family="Arial" font-weight="bold" fill="#fff">{{ $place }}</text>
    </svg>
@endif
