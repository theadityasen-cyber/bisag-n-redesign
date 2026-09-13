/**
 * The official BISAG-N / MeitY mark.
 *
 * A raster, deliberately: this is the institute's supplied logo and is
 * reproduced as-is rather than redrawn. Two pre-scaled files cover every place
 * it appears, each at twice its display height so it stays crisp on high-density
 * screens without shipping the full-size original.
 *
 *   sm — masthead, 46–52 px tall
 *   lg — footer, 112 px tall
 */

const SOURCES = {
  sm: { src: '/brand/bisag-n-logo-112.png', width: 156, height: 112 },
  lg: { src: '/brand/bisag-n-logo-224.png', width: 312, height: 224 },
} as const;

export function Logo({
  size = 'sm',
  className,
  alt = 'BISAG-N — Ministry of Electronics and Information Technology',
}: {
  size?: keyof typeof SOURCES;
  className?: string;
  alt?: string;
}) {
  const { src, width, height } = SOURCES[size];
  return (
    <img
      className={`logo${className ? ` ${className}` : ''}`}
      src={src}
      width={width}
      height={height}
      alt={alt}
      decoding="async"
      // The masthead logo is above the fold on every page load; the footer's is not.
      loading={size === 'sm' ? 'eager' : 'lazy'}
    />
  );
}
