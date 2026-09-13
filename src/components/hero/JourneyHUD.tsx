import { useEffect, useRef } from 'react';
import { ORIGIN } from '../../content/journey';
import { journey, tracks } from '../../lib/journeyStore';
import { formatAltitude, formatCoord, formatScale } from '../../lib/math';

/**
 * Telemetry.
 *
 * Everything here is measured from the scene, not authored alongside it: the
 * altitude is the real distance from the camera to the ellipsoid, the scale is
 * derived from the ground width actually in frame, and the projection readout
 * reports the morph uniform. If the camera and the numbers ever disagree, the
 * numbers are wrong and worth fixing — which is the property you want from a
 * readout on an institution like this one.
 *
 * It is also the orientation device. Over a zoom of six orders of magnitude the
 * user needs to be told how far they have come, in units they recognise.
 */
export function JourneyHUD() {
  const altValue = useRef<HTMLSpanElement>(null);
  const altUnit = useRef<HTMLSpanElement>(null);
  const scaleValue = useRef<HTMLSpanElement>(null);
  const projValue = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let lastAlt = '';
    let lastScale = '';
    let lastProj = '';

    const tick = () => {
      const { value, unit } = formatAltitude(journey.altitude);
      const altText = `${value} ${unit}`;
      if (altText !== lastAlt) {
        if (altValue.current) altValue.current.textContent = value;
        if (altUnit.current) altUnit.current.textContent = unit;
        lastAlt = altText;
      }

      const scale = formatScale(journey.frameWidth);
      if (scale !== lastScale) {
        if (scaleValue.current) scaleValue.current.textContent = scale;
        lastScale = scale;
      }

      const morph = tracks.morph.at(journey.smoothed);
      const projection = morph < 0.02 ? 'Tangent plane' : morph > 0.98 ? 'Ellipsoid' : 'Transforming';
      if (projection !== lastProj) {
        if (projValue.current) projValue.current.textContent = projection;
        lastProj = projection;
      }

      if (bar.current) bar.current.style.transform = `scaleX(${journey.smoothed.toFixed(4)})`;

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud__track">
        <div ref={bar} className="hud__bar" />
      </div>

      <dl className="hud__readouts">
        <div className="hud__item hud__item--alt">
          <dt className="label">Altitude</dt>
          <dd className="mono">
            <span ref={altValue} className="hud__num">
              8.0
            </span>
            <span ref={altUnit} className="hud__unit">
              m
            </span>
          </dd>
        </div>

        <div className="hud__item">
          <dt className="label">Scale</dt>
          <dd className="mono">
            <span ref={scaleValue}>1:157</span>
          </dd>
        </div>

        <div className="hud__item hud__item--wide">
          <dt className="label">Datum</dt>
          <dd className="mono">
            {formatCoord(ORIGIN.lat, 'lat')} {formatCoord(ORIGIN.lon, 'lon')}
          </dd>
        </div>

        <div className="hud__item hud__item--wide">
          <dt className="label">Projection</dt>
          <dd className="mono">
            <span ref={projValue}>Tangent plane</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
