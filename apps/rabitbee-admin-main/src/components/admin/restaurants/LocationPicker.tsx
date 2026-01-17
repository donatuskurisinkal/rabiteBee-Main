
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  defaultLocation?: { lat: number; lng: number };
  onLocationChange: (lat: number, lng: number) => void;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export function LocationPicker({
  latitude,
  longitude,
  defaultLocation,
  onLocationChange,
  onLocationSelect,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [localCoordinates, setLocalCoordinates] = useState({
    lat: latitude || defaultLocation?.lat || 0,
    lng: longitude || defaultLocation?.lng || 0,
  });
  const timeoutRef = useRef<number | null>(null);

  // Fetch the Mapbox token from Supabase
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) {
          console.error('Error fetching Mapbox token:', error);
          setShowFallback(true);
          setIsLoading(false);
          return;
        }
        
        if (data && data.token) {
          console.log('Map token retrieved successfully');
          setMapToken(data.token);
        } else {
          console.error('No Mapbox token available');
          setShowFallback(true);
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setShowFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map when token is available and coordinates are set
  useEffect(() => {
    if (!mapToken || !mapContainer.current || showFallback) return;

    // Set a timeout to show fallback if map takes too long to load
    timeoutRef.current = window.setTimeout(() => {
      console.info('Map taking too long to load, showing fallback inputs');
      setShowFallback(true);
    }, 5000) as unknown as number;

    // Initialize map
    try {
      mapboxgl.accessToken = mapToken;
      
      const initialCoordinates = {
        lat: latitude || defaultLocation?.lat || 0,
        lng: longitude || defaultLocation?.lng || 0
      };
      
      // Use default coordinates if not provided
      if (!latitude && !longitude && !defaultLocation) {
        initialCoordinates.lat = 28.6139;  // Default to New Delhi
        initialCoordinates.lng = 77.2090;
      }
      
      setLocalCoordinates(initialCoordinates);
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [initialCoordinates.lng, initialCoordinates.lat],
        zoom: 13
      });

      map.current.on('load', () => {
        console.info('Map loaded successfully');
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });

      // Add marker at initial position
      marker.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([initialCoordinates.lng, initialCoordinates.lat])
        .addTo(map.current);

      // Update coordinates when marker is dragged
      marker.current.on('dragend', () => {
        if (marker.current) {
          const lngLat = marker.current.getLngLat();
          setLocalCoordinates({ lat: lngLat.lat, lng: lngLat.lng });
          onLocationChange(lngLat.lat, lngLat.lng);
          if (onLocationSelect) {
            onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
          }
        }
      });

      // Allow clicking on map to reposition marker
      map.current.on('click', (e) => {
        if (marker.current && map.current) {
          marker.current.setLngLat(e.lngLat);
          setLocalCoordinates({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          onLocationChange(e.lngLat.lat, e.lngLat.lng);
          if (onLocationSelect) {
            onLocationSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          }
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setShowFallback(true);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (map.current) {
        try {
          // Proper cleanup to prevent "undefined is not an object" error
          if (marker.current) {
            marker.current.remove();
            marker.current = null;
          }
          map.current.remove();
          map.current = null;
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
    };
  }, [mapToken, latitude, longitude, defaultLocation, onLocationChange, onLocationSelect, showFallback]);

  // Handle manual coordinate input
  const handleCoordinateChange = (
    field: 'lat' | 'lng',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newCoordinates = { ...localCoordinates, [field]: numValue };
      setLocalCoordinates(newCoordinates);
      onLocationChange(newCoordinates.lat, newCoordinates.lng);
      if (onLocationSelect) {
        onLocationSelect(newCoordinates);
      }
      
      // Update marker position if map is available
      if (map.current && marker.current && !showFallback) {
        marker.current.setLngLat([newCoordinates.lng, newCoordinates.lat]);
        map.current.flyTo({ center: [newCoordinates.lng, newCoordinates.lat] });
      }
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center rounded border">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2">Loading map...</span>
        </div>
      ) : showFallback ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={localCoordinates.lat || ''}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                placeholder="Latitude (e.g. 28.6139)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={localCoordinates.lng || ''}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                placeholder="Longitude (e.g. 77.2090)"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the coordinates manually or reload the page to try loading the map again.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={mapContainer}
            className="h-[300px] w-full rounded border"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={localCoordinates.lat || ''}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={localCoordinates.lng || ''}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Click on the map to set the location or drag the marker.
          </p>
        </>
      )}
    </div>
  );
}
