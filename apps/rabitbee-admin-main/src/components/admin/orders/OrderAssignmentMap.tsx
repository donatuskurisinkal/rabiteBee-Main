import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Star, AlertCircle, Loader2, Filter, Maximize2, Minimize2 } from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from '@/utils/tenantLocation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Order {
  id: string;
  orderno: string;
  user_latitude: number | null;
  user_longitude: number | null;
  status: string;
  delivery_agent_status: string;
  user_address: string;
  total_amount: number;
  created_at: string;
  user_name?: string;
  restaurant_name?: string;
  delivery_agent_id?: string;
  delivery_agent_name?: string;
}

interface DeliveryAgent {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  is_online: boolean;
  status: string;
  vehicle_type?: string;
  phone_number?: string;
  rating?: number;
}

interface AgentSuggestion {
  agent: DeliveryAgent;
  distance: number;
  estimatedTime: number;
  priority: 'fastest' | 'nearby' | 'available';
  distanceToPickup?: number;
  distanceToDrop?: number;
  totalDistance?: number;
  restaurantName?: string;
}

interface OrderAssignmentMapProps {
  orders: Order[];
  deliveryAgents: DeliveryAgent[];
  onAssignAgent: (orderId: string, agentId: string) => void;
  isLoading?: boolean;
}

export default function OrderAssignmentMap({ 
  orders, 
  deliveryAgents, 
  onAssignAgent,
  isLoading = false 
}: OrderAssignmentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'assigned'>('all');
  const [agentFilter, setAgentFilter] = useState<'all' | 'available' | 'busy'>('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Filter orders based on selected filter
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Only show orders with valid coordinates
      if (!order.user_latitude || !order.user_longitude) return false;
      
      if (orderFilter === 'pending') {
        return order.delivery_agent_status === 'pending' || !order.delivery_agent_id;
      }
      if (orderFilter === 'assigned') {
        return order.delivery_agent_status === 'assigned' && order.delivery_agent_id;
      }
      return true; // 'all'
    });
  }, [orders, orderFilter]);

  // Filter delivery agents based on selected filter
  const filteredDeliveryAgents = useMemo(() => {
    return deliveryAgents.filter(agent => {
      // Only show agents with valid coordinates and online
      if (!agent.lat || !agent.lng || !agent.is_online) return false;
      
      if (agentFilter === 'available') {
        return agent.status === 'available' || agent.status === 'online';
      }
      if (agentFilter === 'busy') {
        return agent.status === 'busy';
      }
      return true; // 'all'
    });
  }, [deliveryAgents, agentFilter]);

  // Calculate agent suggestions with restaurant pickup logic
  const [agentSuggestions, setAgentSuggestions] = useState<AgentSuggestion[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const calculateSuggestions = async () => {
      if (!selectedOrder || !selectedOrder.user_latitude || !selectedOrder.user_longitude) {
        setAgentSuggestions([]);
        return;
      }

      setIsCalculating(true);
      try {
        // Get restaurant location from order food items
        const { data: orderFoodItems, error: foodItemsError } = await supabase
          .from('order_food_items')
          .select(`
            restaurant_id,
            restaurants (
              latitude,
              longitude,
              name
            )
          `)
          .eq('order_id', selectedOrder.id)
          .limit(1);

        if (foodItemsError || !orderFoodItems?.length) {
          console.error('Error fetching restaurant location:', foodItemsError);
          setAgentSuggestions([]);
          return;
        }

        const restaurant = orderFoodItems[0].restaurants;
        if (!restaurant?.latitude || !restaurant?.longitude) {
          console.error('Restaurant location not available');
          setAgentSuggestions([]);
          return;
        }

        // Filter available agents (online agents with valid coordinates)
        const availableAgents = deliveryAgents.filter(agent => 
          agent.is_online && 
          agent.lat && 
          agent.lng &&
          (agent.status === 'available' || agent.status === 'online' || agent.status === 'busy')
        );

        if (!availableAgents.length) {
          setAgentSuggestions([]);
          return;
        }

        const suggestions: AgentSuggestion[] = availableAgents.map(agent => {
          // Step 1: Agent → Restaurant (pickup distance)
          const distanceToPickup = calculateDistance(
            agent.lat!,
            agent.lng!,
            restaurant.latitude,
            restaurant.longitude
          );

          // Step 2: Restaurant → Order delivery location (drop distance)
          const distanceToDrop = calculateDistance(
            restaurant.latitude,
            restaurant.longitude,
            selectedOrder.user_latitude!,
            selectedOrder.user_longitude!
          );

          // Total travel distance
          const totalDistance = distanceToPickup + distanceToDrop;

          // Estimate delivery time based on total distance
          const baseTime = agent.status === 'available' ? 5 : 10;
          const estimatedTime = Math.round(baseTime + (totalDistance * 2.0)); // 2 min per km

          let priority: 'fastest' | 'nearby' | 'available' = 'available';
          if (totalDistance <= 2 && agent.status === 'available') {
            priority = 'fastest';
          } else if (totalDistance <= 5) {
            priority = 'nearby';
          }

          return {
            agent,
            distance: Math.round(totalDistance * 100) / 100,
            estimatedTime,
            priority,
            distanceToPickup: Math.round(distanceToPickup * 100) / 100,
            distanceToDrop: Math.round(distanceToDrop * 100) / 100,
            totalDistance: Math.round(totalDistance * 100) / 100,
            restaurantName: restaurant.name
          };
        });

        // Sort by availability, rating, and total distance
        const sortedSuggestions = suggestions.sort((a, b) => {
          // First priority: available agents over busy ones
          if (a.agent.status === 'available' && b.agent.status !== 'available') return -1;
          if (b.agent.status === 'available' && a.agent.status !== 'available') return 1;
          
          // Second priority: agent rating (if available)
          if (a.agent.rating && b.agent.rating) {
            const ratingDiff = (b.agent.rating || 0) - (a.agent.rating || 0);
            if (Math.abs(ratingDiff) > 0.5) return ratingDiff > 0 ? 1 : -1;
          }
          
          // Third priority: total distance
          return a.totalDistance! - b.totalDistance!;
        });

        setAgentSuggestions(sortedSuggestions.slice(0, 3));

      } catch (error) {
        console.error('Error calculating agent recommendations:', error);
        setAgentSuggestions([]);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateSuggestions();
  }, [selectedOrder, deliveryAgents]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setIsMapLoading(true);
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Failed to fetch Mapbox token:', error);
          setMapError('Failed to load map token');
          return;
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
          setMapError(null);
        } else {
          setMapError('No map token received');
        }
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
        setMapError('Map initialization failed');
      } finally {
        setIsMapLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [76.1958, 10.8045], // Pattambi center
        zoom: 12
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add error handling for map
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map loading error');
      });

      map.current.on('load', () => {
        setIsMapLoading(false);
        setMapError(null);
      });

      return () => {
        if (map.current) {
          map.current.remove();
        }
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
      setIsMapLoading(false);
    }
  }, [mapboxToken]);

  // Update markers when filtered data changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    // Add order markers
    filteredOrders.forEach(order => {
      if (order.user_latitude && order.user_longitude) {
        hasValidCoordinates = true;
        bounds.extend([order.user_longitude, order.user_latitude]);

        const isPending = order.delivery_agent_status === 'pending' || !order.delivery_agent_id;
        
        // Create marker element
        const markerElement = document.createElement('div');
        markerElement.className = `
          w-8 h-8 rounded-full border-2 cursor-pointer transform transition-all duration-200 hover:scale-110
          ${isPending 
            ? 'bg-orange-500 border-orange-300 shadow-lg animate-pulse' 
            : 'bg-green-500 border-green-300'}
        `;
        
        if (isPending) {
          markerElement.style.boxShadow = '0 0 20px rgba(251, 146, 60, 0.5)';
        }

        // Add icon
        const icon = document.createElement('div');
        icon.className = 'w-full h-full flex items-center justify-center text-white text-xs font-bold';
        icon.innerHTML = '📦';
        markerElement.appendChild(icon);

        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([order.user_longitude, order.user_latitude])
          .addTo(map.current!);

        // Add click handler
        markerElement.addEventListener('click', () => {
          setSelectedOrder(order);
        });

        // Add popup on hover
        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: false,
          closeOnClick: false 
        })
          .setHTML(`
            <div class="p-3 min-w-48">
              <div class="font-semibold text-base">${order.orderno}</div>
              <div class="text-sm text-gray-600 mt-1">${order.user_address || 'No address'}</div>
              <div class="text-sm font-medium mt-1">${formatCurrency(order.total_amount)}</div>
              <div class="text-xs text-gray-500 mt-1">${formatTime(order.created_at)}</div>
              <div class="text-xs mt-1">
                <span class="px-2 py-1 rounded-full text-white ${isPending ? 'bg-orange-500' : 'bg-green-500'}">
                  ${order.delivery_agent_status}
                </span>
              </div>
            </div>
          `);

        markerElement.addEventListener('mouseenter', () => {
          popup.setLngLat([order.user_longitude!, order.user_latitude!])
            .addTo(map.current!);
        });

        markerElement.addEventListener('mouseleave', () => {
          popup.remove();
        });

        markersRef.current[`order-${order.id}`] = marker;
      }
    });

    // Add delivery agent markers
    filteredDeliveryAgents.forEach(agent => {
      if (agent.lat && agent.lng) {
        hasValidCoordinates = true;
        bounds.extend([agent.lng, agent.lat]);

        const isAvailable = agent.status === 'available' || agent.status === 'online';
        
        const markerElement = document.createElement('div');
        markerElement.className = `
          w-7 h-7 rounded-full border-2 
          flex items-center justify-center text-white text-xs font-bold
          ${isAvailable 
            ? 'bg-blue-500 border-blue-300 animate-pulse' 
            : 'bg-red-500 border-red-300'}
        `;
        markerElement.innerHTML = agent.vehicle_type === 'bike' ? '🏍️' : '🚗';

        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([agent.lng, agent.lat])
          .addTo(map.current!);

        // Add popup for agent
        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: false,
          closeOnClick: false 
        })
          .setHTML(`
            <div class="p-3 min-w-48">
              <div class="font-semibold text-base">${agent.name}</div>
              <div class="text-sm text-gray-600">
                Status: <span class="${isAvailable ? 'text-green-600' : 'text-red-600'}">${agent.status}</span>
              </div>
              <div class="text-sm text-gray-600">Vehicle: ${agent.vehicle_type || 'N/A'}</div>
              ${agent.phone_number ? `<div class="text-sm text-gray-600">Phone: ${agent.phone_number}</div>` : ''}
              ${agent.rating ? `<div class="text-sm text-gray-600">Rating: ⭐ ${agent.rating}</div>` : ''}
            </div>
          `);

        markerElement.addEventListener('mouseenter', () => {
          popup.setLngLat([agent.lng!, agent.lat!])
            .addTo(map.current!);
        });

        markerElement.addEventListener('mouseleave', () => {
          popup.remove();
        });

        markersRef.current[`agent-${agent.id}`] = marker;
      }
    });

    // Fit bounds to show all markers
    if (hasValidCoordinates && !bounds.isEmpty()) {
      setTimeout(() => {
        if (map.current) {
          map.current.fitBounds(bounds, { 
            padding: 80,
            maxZoom: 14 
          });
        }
      }, 100);
    }
  }, [filteredOrders, filteredDeliveryAgents]);

  if (isMapLoading) {
    return (
      <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-destructive">{mapError}</p>
          <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div 
        ref={mapContainer} 
        className={`w-full ${
          isFullScreen 
            ? 'h-screen' 
            : 'h-[70vh] min-h-[500px] lg:h-[80vh]'
        } rounded-lg transition-all duration-300`} 
      />
      
      {/* Fullscreen Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 md:top-4 md:right-4 bg-background/95 backdrop-blur border shadow-lg z-10 text-xs md:text-sm"
        onClick={() => setIsFullScreen(!isFullScreen)}
      >
        {isFullScreen ? (
          <>
            <Minimize2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
            <span className="sm:hidden">Exit</span>
          </>
        ) : (
          <>
            <Maximize2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Fullscreen</span>
            <span className="sm:hidden">Full</span>
          </>
        )}
      </Button>
      
      {/* Filters */}
      <Card className="absolute top-2 left-2 md:top-4 md:left-4 p-2 md:p-3 bg-background/95 backdrop-blur shadow-lg max-w-xs">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium">
            <Filter className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Filters</span>
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">Orders</label>
              <Select value={orderFilter} onValueChange={(value: 'all' | 'pending' | 'assigned') => setOrderFilter(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="assigned">Assigned Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">Agents</label>
              <Select value={agentFilter} onValueChange={(value: 'all' | 'available' | 'busy') => setAgentFilter(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="available">Available Only</SelectItem>
                  <SelectItem value="busy">Busy Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 p-3 bg-background/95 backdrop-blur">
        <div className="space-y-2 text-sm">
          <div className="font-medium mb-2">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 animate-pulse"></div>
            <span>Pending Orders ({filteredOrders.filter(o => o.delivery_agent_status === 'pending' || !o.delivery_agent_id).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Assigned Orders ({filteredOrders.filter(o => o.delivery_agent_status === 'assigned' && o.delivery_agent_id).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
            <span>Available Agents ({filteredDeliveryAgents.filter(a => a.status === 'available' || a.status === 'online').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Busy Agents ({filteredDeliveryAgents.filter(a => a.status === 'busy').length})</span>
          </div>
        </div>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Card className={`absolute p-4 bg-background/95 backdrop-blur max-h-[calc(100vh-2rem)] overflow-y-auto z-20 ${
          isFullScreen 
            ? 'top-20 right-4 w-80' 
            : 'top-4 right-20 w-80'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Order Details</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order ID:</span>
                <span className="text-sm font-medium">{selectedOrder.orderno}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-medium">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={selectedOrder.delivery_agent_status === 'pending' ? 'destructive' : 'secondary'}>
                  {selectedOrder.delivery_agent_status}
                </Badge>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Address:</span>
                <p className="text-sm mt-1">{selectedOrder.user_address || 'No address provided'}</p>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time:</span>
                <span className="text-sm">{formatTime(selectedOrder.created_at)}</span>
              </div>
              
              {selectedOrder.delivery_agent_name && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Agent:</span>
                  <span className="text-sm">{selectedOrder.delivery_agent_name}</span>
                </div>
              )}
            </div>

            {/* Always show recommendations for pending/unassigned orders */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Recommended Agents</h4>
                  <Badge variant="secondary" className="text-xs">Fastest Delivery</Badge>
                </div>
                
                 {isCalculating ? (
                   <div className="text-center py-4">
                     <Loader2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground animate-spin" />
                     <p className="text-sm text-muted-foreground">Calculating best routes...</p>
                   </div>
                 ) : agentSuggestions.length > 0 ? (
                   <div className="space-y-2 max-h-60 overflow-y-auto">
                     {agentSuggestions.slice(0, 3).map((suggestion, index) => (
                      <Button
                        key={suggestion.agent.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between p-3 h-auto"
                        onClick={() => {
                          onAssignAgent(selectedOrder.id, suggestion.agent.id);
                          setSelectedOrder(null);
                        }}
                        disabled={isLoading}
                      >
                         <div className="flex items-center gap-2">
                           {index === 0 && suggestion.priority === 'fastest' && (
                             <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                           )}
                           <User className="h-3 w-3" />
                           <div className="text-left">
                             <div className="font-medium text-xs">{suggestion.agent.name}</div>
                             <div className="text-xs text-muted-foreground">
                               Total: {suggestion.totalDistance?.toFixed(1)}km • ~{suggestion.estimatedTime}min
                             </div>
                             {suggestion.distanceToPickup && suggestion.distanceToDrop && (
                               <div className="text-xs text-muted-foreground">
                                 Pickup: {suggestion.distanceToPickup.toFixed(1)}km • Drop: {suggestion.distanceToDrop.toFixed(1)}km
                               </div>
                             )}
                             <div className="text-xs text-muted-foreground">
                               {suggestion.agent.vehicle_type} • {suggestion.agent.status}
                               {suggestion.agent.rating && ` • ⭐${suggestion.agent.rating}`}
                             </div>
                           </div>
                         </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={suggestion.priority === 'fastest' ? 'default' : 'secondary'}
                            className="text-xs px-1 py-0"
                          >
                            {suggestion.priority}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2 w-2" />
                            <span className="text-xs">{suggestion.estimatedTime}m</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No available agents online</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check back in a few minutes or contact agents directly
                    </p>
                  </div>
                )}
                
                {agentSuggestions.length > 0 && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    💡 Available agents prioritized for fastest delivery
                  </div>
                 )}
               </div>
           </div>
         </Card>
      )}
    </div>
  );
}