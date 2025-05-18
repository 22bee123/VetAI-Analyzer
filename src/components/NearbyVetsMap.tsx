import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons
const vetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface VetClinic {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  website?: string;
  distance?: number;
}

// Component to set the map view based on coordinates
function SetViewOnLocation({ coords }: { coords: [number, number] }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

const NearbyVetsMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [vetClinics, setVetClinics] = useState<VetClinic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Get user's location
  const getUserLocation = () => {
    setIsLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        findNearbyVets(latitude, longitude);
        setIsLoading(false);
      },
      (error) => {
        setError(`Unable to get your location: ${error.message}`);
        setIsLoading(false);
        // Use a default location if user location is not available
        setUserLocation([40.7128, -74.0060]); // New York City as default
      }
    );
  };

  // Find nearby vet clinics using Overpass API
  const findNearbyVets = async (lat: number, lon: number) => {
    try {
      setIsLoading(true);
      
      // Overpass API query to find veterinary clinics within 5km radius
      const radius = 5000; // 5km radius
      const query = `
        [out:json];
        (
          node["amenity"="veterinary"](around:${radius},${lat},${lon});
          way["amenity"="veterinary"](around:${radius},${lat},${lon});
          relation["amenity"="veterinary"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch veterinary clinics');
      }
      
      const data = await response.json();
      
      // Process the results
      const clinics: VetClinic[] = [];
      
      if (data.elements) {
        data.elements.forEach((element: any) => {
          if (element.type === 'node' && element.tags && element.tags.amenity === 'veterinary') {
            // Calculate distance from user
            const distance = calculateDistance(lat, lon, element.lat, element.lon);
            
            clinics.push({
              id: element.id.toString(),
              name: element.tags.name || 'Unnamed Veterinary Clinic',
              lat: element.lat,
              lon: element.lon,
              address: element.tags.address || element.tags['addr:full'] || 
                      (element.tags['addr:street'] ? 
                        `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street'] || ''}, ${element.tags['addr:city'] || ''}` : 
                        'Address not available'),
              phone: element.tags.phone || element.tags['contact:phone'] || 'Phone not available',
              website: element.tags.website || element.tags['contact:website'] || '',
              distance: distance
            });
          }
        });
      }
      
      // Sort clinics by distance
      clinics.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setVetClinics(clinics);
      setIsLoading(false);
      
      if (clinics.length === 0) {
        setError('No veterinary clinics found nearby. Try increasing the search radius.');
      }
    } catch (error) {
      console.error('Error finding nearby vets:', error);
      setError('Failed to find nearby veterinary clinics. Please try again later.');
      setIsLoading(false);
    }
  };

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Get directions to a vet clinic
  const getDirections = (clinic: VetClinic) => {
    if (!userLocation) return;
    
    const [userLat, userLon] = userLocation;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${clinic.lat},${clinic.lon}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Initialize the map when the component mounts
  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-6">
      <h3 className="text-lg font-bold text-blue-700 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Nearby Veterinary Clinics
      </h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2">
          {!userLocation ? (
            <div className="bg-blue-50 p-4 rounded-md text-center">
              <button 
                onClick={getUserLocation}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Finding your location...' : 'Find Veterinary Clinics Near Me'}
              </button>
            </div>
          ) : (
            <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
              <MapContainer 
                center={userLocation} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                ref={(map) => { mapRef.current = map; }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {userLocation && (
                  <Marker position={userLocation} icon={userIcon}>
                    <Popup>
                      Your Location
                    </Popup>
                  </Marker>
                )}
                
                {vetClinics.map((clinic) => (
                  <Marker 
                    key={clinic.id} 
                    position={[clinic.lat, clinic.lon]} 
                    icon={vetIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedClinic(clinic);
                      }
                    }}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">{clinic.name}</h3>
                        <p className="text-sm">{clinic.address}</p>
                        <p className="text-sm">{clinic.phone}</p>
                        {clinic.website && (
                          <p className="text-sm">
                            <a 
                              href={clinic.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Website
                            </a>
                          </p>
                        )}
                        <p className="text-sm mt-1">Distance: {clinic.distance} km</p>
                        <button 
                          onClick={() => getDirections(clinic)}
                          className="mt-2 bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Get Directions
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {userLocation && <SetViewOnLocation coords={userLocation} />}
              </MapContainer>
            </div>
          )}
        </div>
        
        <div className="md:w-1/2">
          <div className="bg-blue-50 p-4 rounded-md h-full">
            <h4 className="font-bold text-blue-700 mb-3">Veterinary Clinics List</h4>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : vetClinics.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {vetClinics.map((clinic) => (
                  <div 
                    key={clinic.id} 
                    className={`bg-white p-3 rounded-md border ${selectedClinic?.id === clinic.id ? 'border-blue-500' : 'border-gray-200'} cursor-pointer hover:border-blue-300 transition-colors`}
                    onClick={() => {
                      setSelectedClinic(clinic);
                      if (mapRef.current) {
                        mapRef.current.setView([clinic.lat, clinic.lon], 15);
                      }
                    }}
                  >
                    <h5 className="font-bold text-blue-800">{clinic.name}</h5>
                    <p className="text-sm text-gray-600">{clinic.address}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-blue-600">{clinic.distance} km away</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          getDirections(clinic);
                        }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Directions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !error ? (
              <div className="text-center py-8 text-gray-500">
                <p>Click the button to find veterinary clinics near you</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No veterinary clinics found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Data provided by OpenStreetMap contributors. Map functionality may be limited based on available data in your area.</p>
      </div>
    </div>
  );
};

export default NearbyVetsMap;
