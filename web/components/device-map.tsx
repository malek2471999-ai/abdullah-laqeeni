'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { LocateFixed } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface MapPoint {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  capturedAt?: string;
}

const STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

export function DeviceMap({
  points,
  dict,
  showRoute = false,
  className,
  interactive = true,
}: {
  points: MapPoint[];
  dict: Dictionary;
  showRoute?: boolean;
  className?: string;
  interactive?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<MapLibreMarker[]>([]);
  const fitted = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!container.current) return;
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !container.current) return;

      const instance = new maplibregl.Map({
        container: container.current,
        style: STYLE as never,
        center: points[0]
          ? [points[0].longitude, points[0].latitude]
          : [35.9106, 31.9539],
        zoom: points[0] ? 15 : 5,
        interactive,
        attributionControl: false,
        maxZoom: 19,
      });
      map.current = instance;

      instance.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right',
      );

      if (interactive) {
        instance.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          'top-right',
        );
      }

      instance.on('load', () => {
        if (showRoute && points.length > 1) {
          instance.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: points.map((point) => [point.longitude, point.latitude]),
              },
            },
          });
          instance.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#087CFF',
              'line-width': 4,
              'line-opacity': 0.85,
            },
          });
        }
        fit(maplibregl);
      });

      if (showRoute && points.length > 1) {
        // The source may already exist if the style was cached.
        instance.on('style.load', () => {
          if (!instance.getSource('route')) {
            instance.addSource('route', {
              type: 'geojson',
              data: emptyLine(),
            });
          }
        });
      }
    })();

    return () => {
      cancelled = true;
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
      fitted.current = false;
    };
    // Initialisation must only happen once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, showRoute]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    let cancelled = false;

    void (async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled) return;

      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      if (points.length === 0) return;

      points.forEach((point, index) => {
        const element = document.createElement('div');
        element.className = 'laqeeni-marker';
        if (showRoute && points.length > 1) {
          element.classList.add(index === 0 ? 'is-start' : 'is-end');
        }
        element.innerHTML = '<span></span>';
        element.setAttribute(
          'aria-label',
          `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
        );
        const marker = new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat([point.longitude, point.latitude])
          .addTo(instance);
        markers.current.push(marker);
      });

      if (showRoute && instance.isStyleLoaded()) {
        const source = instance.getSource('route') as
          | { setData: (data: GeoJSON.Feature<GeoJSON.LineString>) => void }
          | undefined;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: points.map((point) => [point.longitude, point.latitude]),
            },
          });
        }
      }

      if (!fitted.current) {
        fit(maplibregl);
        fitted.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, showRoute]);

  function fit(maplibregl: typeof import('maplibre-gl')) {
    const instance = map.current;
    if (!instance || points.length === 0) return;
    if (points.length === 1) {
      instance.setCenter([points[0].longitude, points[0].latitude]);
      instance.setZoom(16);
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    points.forEach((point) => bounds.extend([point.longitude, point.latitude]));
    instance.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
  }

  if (points.length === 0) {
    return (
      <div
        className={cn(
          'flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 text-center',
          className,
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <LocateFixed className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">{dict.noLocation}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{dict.locateDescription}</p>
      </div>
    );
  }

  return (
    <div
      ref={container}
      className={cn('laqeeni-map h-64 w-full overflow-hidden rounded-2xl border border-border', className)}
      role="application"
      aria-label={dict.locationMap}
    />
  );
}

function emptyLine(): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: [] },
  };
}
