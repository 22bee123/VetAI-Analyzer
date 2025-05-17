import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom colored marker icons
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Clinic {
  id: string;
  name: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
  distance?: string;
}

// Component to recenter the map when user location changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

const VetMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLoading(false);
        },
        (error) => {
          setError("Error getting your location. Please enable location services.");
          setLoading(false);
          console.error("Error getting location:", error);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, []);

  // Find nearby veterinary clinics when user location is available using Overpass API
  useEffect(() => {
    if (userLocation) {
      const [lat, lng] = userLocation;
      
      // Using Overpass API to find veterinary clinics nearby
      const overpassQuery = `
        [out:json];
        (
          node["amenity"="veterinary"](around:5000,${lat},${lng});
          way["amenity"="veterinary"](around:5000,${lat},${lng});
          relation["amenity"="veterinary"](around:5000,${lat},${lng});
        );
        out body;
        >;
        out skel qt;
      `;
      
      fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`)
        .then(response => response.json())
        .then(data => {
          const elements = data.elements.filter((element: any) => 
            element.tags && element.tags.amenity === 'veterinary'
          );
          
          if (elements.length === 0) {
            // If no veterinary clinics found, try with pet shops or animal_boarding
            const alternativeQuery = `
              [out:json];
              (
                node["shop"="pet"](around:5000,${lat},${lng});
                way["shop"="pet"](around:5000,${lat},${lng});
                node["amenity"="animal_boarding"](around:5000,${lat},${lng});
                way["amenity"="animal_boarding"](around:5000,${lat},${lng});
              );
              out body;
              >;
              out skel qt;
            `;
            
            return fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(alternativeQuery)}`)
              .then(response => response.json());
          }
          
          return data;
        })
        .then(data => {
          const vetClinics = data.elements
            .filter((element: any) => {
              return element.type === 'node' && element.lat && element.lon && (
                (element.tags && element.tags.amenity === 'veterinary') ||
                (element.tags && element.tags.shop === 'pet') ||
                (element.tags && element.tags.amenity === 'animal_boarding')
              );
            })
            .map((element: any) => {
              const clinicLat = element.lat;
              const clinicLon = element.lon;
              
              // Calculate distance using Haversine formula
              const R = 6371; // Radius of the Earth in km
              const dLat = (clinicLat - lat) * Math.PI / 180;
              const dLon = (clinicLon - lng) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(clinicLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distance = R * c;
              
              return {
                id: element.id.toString(),
                name: element.tags.name || (
                  element.tags.amenity === 'veterinary' ? 'Veterinary Clinic' :
                  element.tags.shop === 'pet' ? 'Pet Shop' : 'Animal Boarding'
                ),
                address: element.tags['addr:street'] 
                  ? `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street']}` 
                  : (element.tags.address || 'Address not available'),
                position: {
                  lat: clinicLat,
                  lng: clinicLon
                },
                distance: `${distance.toFixed(1)} km`
              };
            });
          
          // Sort clinics by distance
          vetClinics.sort((a: Clinic, b: Clinic) => {
            const distA = parseFloat(a.distance?.split(" ")[0] || "0");
            const distB = parseFloat(b.distance?.split(" ")[0] || "0");
            return distA - distB;
          });
          
          setClinics(vetClinics);
          
          if (vetClinics.length === 0) {
            setError("No veterinary clinics found in your area.");
          }
        })
        .catch(error => {
          console.error("Error fetching veterinary clinics:", error);
          setError("Failed to fetch nearby veterinary clinics.");
        });
    }
  }, [userLocation]);

  const centerMapOnClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    if (mapRef.current) {
      mapRef.current.setView([clinic.position.lat, clinic.position.lng], 15);
    }
  };

  const getDirections = (clinic: Clinic) => {
    if (userLocation) {
      // Open directions in user's default map app
      window.open(
        `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation[0]},${userLocation[1]};${clinic.position.lat},${clinic.position.lng}`,
        '_blank'
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-800">Find a Vet Near You</h1>
        <p className="text-gray-600 mt-2">Using your current location to find the nearest veterinary clinics</p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          <p className="ml-4 text-gray-600">Locating you...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-2 rounded-lg shadow-md h-[70vh]">
              {userLocation && (
                <MapContainer
                  center={userLocation}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <ChangeView center={userLocation} />
                  
                  {/* User location marker */}
                  <Marker position={userLocation} icon={blueIcon}>
                    <Popup>
                      <div>
                        <h3 className="font-bold">Your Location</h3>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Clinic markers */}
                  {clinics.map((clinic) => (
                    <Marker
                      key={clinic.id}
                      position={[clinic.position.lat, clinic.position.lng]}
                      icon={redIcon}
                      eventHandlers={{
                        click: () => {
                          setSelectedClinic(clinic);
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-1 max-w-[250px]">
                          <h3 className="font-bold text-gray-900">{clinic.name}</h3>
                          <p className="text-gray-700 text-sm mt-1">{clinic.address}</p>
                          <p className="text-gray-700 text-sm mt-1">Distance: {clinic.distance}</p>
                          <button
                            onClick={() => getDirections(clinic)}
                            className="mt-2 w-full text-center text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded transition-colors"
                          >
                            Get Directions
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3">
                <h2 className="text-xl font-semibold">Nearest Veterinary Clinics</h2>
              </div>
              <div className="p-4">
                {clinics.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">Searching for clinics near you...</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {clinics.slice(0, 10).map((clinic) => (
                      <li
                        key={clinic.id}
                        className={`py-3 cursor-pointer hover:bg-gray-50 ${
                          selectedClinic?.id === clinic.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => centerMapOnClinic(clinic)}
                      >
                        <h3 className="font-medium text-blue-800">{clinic.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{clinic.address}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium text-gray-700">{clinic.distance}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              getDirections(clinic);
                            }}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded transition-colors"
                          >
                            Directions
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t">
                <p className="text-sm text-gray-600">
                  Click on a clinic to see its location on the map.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
        <div className="flex items-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-500 mt-0.5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-medium text-gray-800">Important Note</h3>
            <p className="text-sm text-gray-600 mt-1">
              This map shows veterinary clinics and pet services based on open data from OpenStreetMap. 
              Information may not be complete or up-to-date. Always call before visiting to confirm hours and services.
              For pet emergencies, look for facilities specifically designated as emergency veterinary services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetMap;
