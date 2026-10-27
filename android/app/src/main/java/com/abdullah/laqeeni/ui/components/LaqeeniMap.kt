package com.abdullah.laqeeni.ui.components

import android.os.Bundle
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.abdullah.laqeeni.core.network.DeviceDto
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.Style
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.geojson.Feature
import org.maplibre.geojson.FeatureCollection
import org.maplibre.geojson.Point

private const val OSM_STYLE = """
{
  "version": 8,
  "name": "Laqeeni OSM",
  "sources": {
    "osm": {
      "type": "raster",
      "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      "tileSize": 256,
      "minzoom": 0,
      "maxzoom": 19,
      "attribution": "© OpenStreetMap contributors"
    }
  },
  "layers": [
    {"id": "background", "type": "background", "paint": {"background-color": "#071426"}},
    {"id": "osm", "type": "raster", "source": "osm", "paint": {"raster-opacity": 0.82}}
  ]
}
"""

/**
 * Small MapLibre wrapper with an OpenStreetMap raster style (no API key).
 * Replace the tile URL with a licensed provider before production scale.
 */
@Composable
fun LaqeeniMap(
    devices: List<DeviceDto>,
    modifier: Modifier = Modifier,
    focus: DeviceDto? = null,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val mapState = remember { mutableStateOf<MapLibreMap?>(null) }
    val styleState = remember { mutableStateOf<Style?>(null) }

    val mapView = remember {
        MapView(context).apply {
            onCreate(Bundle())
            getMapAsync { map ->
                map.uiSettings.isAttributionEnabled = false
                map.uiSettings.isLogoEnabled = false
                map.uiSettings.isRotateGesturesEnabled = false
                map.setStyle(Style.Builder().fromJson(OSM_STYLE)) { loaded ->
                    styleState.value = loaded
                    mapState.value = map
                }
            }
        }
    }
    val map = mapState.value
    val style = styleState.value

    DisposableEffect(lifecycleOwner, mapView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> mapView.onStart()
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                Lifecycle.Event.ON_STOP -> mapView.onStop()
                Lifecycle.Event.ON_DESTROY -> mapView.onDestroy()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        if (lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) {
            mapView.onStart()
            mapView.onResume()
        }
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            mapView.onPause()
            mapView.onStop()
            mapView.onDestroy()
        }
    }

    Box(modifier = modifier.clip(RoundedCornerShape(22.dp))) {
        AndroidView(
            factory = { mapView },
            modifier = Modifier.fillMaxSize(),
            update = { view ->
                if (map == null || style == null) return@AndroidView
                val visible = devices.filter { it.location != null }
                render(style, visible)
                val target = focus ?: visible.firstOrNull()
                val location = target?.location
                if (location != null) {
                    val key = "${location.latitude},${location.longitude}"
                    if (view.getTag(com.abdullah.laqeeni.R.id.map_camera_tag) != key) {
                        view.setTag(com.abdullah.laqeeni.R.id.map_camera_tag, key)
                        map.animateCamera(
                            CameraUpdateFactory.newLatLngZoom(
                                LatLng(location.latitude, location.longitude),
                                14.5,
                            ),
                            900,
                        )
                    }
                }
            },
        )
        Text(
            text = "© OpenStreetMap",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(8.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.75f))
                .padding(horizontal = 6.dp, vertical = 3.dp),
        )
    }
}

private fun render(style: Style, devices: List<DeviceDto>) {
    runCatching {
        style.getSourceAs<GeoJsonSource>("laqeeni-devices")?.let { style.removeSource(it) }
        style.getLayer("laqeeni-devices-layer")?.let { style.removeLayer(it) }
        style.getLayer("laqeeni-lost-layer")?.let { style.removeLayer(it) }
        style.getSourceAs<GeoJsonSource>("laqeeni-lost")?.let { style.removeSource(it) }

        val normal = devices.filter { !it.lostMode }
        val lost = devices.filter { it.lostMode }

        if (normal.isNotEmpty()) {
            style.addSource(GeoJsonSource("laqeeni-devices", collection(normal)))
            style.addLayer(
                CircleLayer("laqeeni-devices-layer", "laqeeni-devices").withProperties(
                    PropertyFactory.circleColor("#087CFF"),
                    PropertyFactory.circleRadius(8f),
                    PropertyFactory.circleStrokeColor("#FFFFFF"),
                    PropertyFactory.circleStrokeWidth(2f),
                ),
            )
        }
        if (lost.isNotEmpty()) {
            style.addSource(GeoJsonSource("laqeeni-lost", collection(lost)))
            style.addLayer(
                CircleLayer("laqeeni-lost-layer", "laqeeni-lost").withProperties(
                    PropertyFactory.circleColor("#FF4655"),
                    PropertyFactory.circleRadius(10f),
                    PropertyFactory.circleStrokeColor("#00D69A"),
                    PropertyFactory.circleStrokeWidth(3f),
                ),
            )
        }
    }
}

private fun collection(devices: List<DeviceDto>): FeatureCollection {
    val features = devices.mapNotNull { device ->
        val location = device.location ?: return@mapNotNull null
        Feature.fromGeometry(Point.fromLngLat(location.longitude, location.latitude)).apply {
            addStringProperty("id", device.id)
            addStringProperty("name", device.name)
        }
    }
    return FeatureCollection.fromFeatures(features)
}
