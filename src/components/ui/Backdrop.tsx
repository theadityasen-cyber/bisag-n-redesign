import type { BackdropImage } from '../../content/imagery';

/**
 * A section backdrop: one piece of Earth observation behind the content, set
 * well below the reading layer.
 *
 * It is an <img> rather than a CSS background so the browser can lazy-load it
 * and pick a width, and so it can be decorative in the accessibility tree
 * (empty alt, aria-hidden) while still carrying intrinsic dimensions.
 *
 * `tone` picks the compositing: photographic plates are multiplied onto the
 * page so their whites drop out; the night-lights ink map is already ink on
 * white and needs only the same multiply at a different strength.
 */
export function Backdrop({
  image,
  placement = 'right',
  tone = 'plate',
}: {
  image: BackdropImage;
  placement?: 'right' | 'left';
  tone?: 'plate' | 'duotone' | 'ink';
}) {
  return (
    <div className={`backdrop backdrop--${placement} backdrop--${tone}`} aria-hidden="true">
      <img
        src={image.small}
        srcSet={`${image.small} ${image.smallWidth}w, ${image.large} ${image.largeWidth}w`}
        sizes="(max-width: 900px) 100vw, 62vw"
        width={image.width}
        height={image.height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
