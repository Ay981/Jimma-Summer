import rawLogo from '../../../../public/images/logo.svg?raw';

// Inline the SVG (rather than <img src>) so the page's theme CSS variables
// (--logo-green / --logo-gold) and `currentColor` resolve against it. This lets
// the mark blend with any background — light sidebar, dark sidebar, login card.
// Strip the XML prolog so the markup is valid inside HTML.
const markup = rawLogo.slice(rawLogo.indexOf('<svg'));

/**
 * Brand logo. Pass a `height` (and optionally `width`) via `style`; the SVG
 * keeps its aspect ratio. Defaults to a 32px-tall mark.
 */
export default function Logo({ className, style, height = 32, ...rest }) {
    return (
        <span
            role="img"
            aria-label="JUMJ Muraja'ah Summer"
            className={className}
            style={{
                display: 'inline-flex',
                color: 'var(--logo-green)',
                height,
                ...style,
            }}
            dangerouslySetInnerHTML={{ __html: markup }}
            {...rest}
        />
    );
}
