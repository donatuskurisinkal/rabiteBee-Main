
import React, { useState, useCallback } from 'react';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useFavoriteRestaurants } from '@/hooks/useFavoriteRestaurants';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, Clock, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function RestaurantsList() {
  const [foodType, setFoodType] = useState<string>('All');
  const [keyword, setKeyword] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { user } = useAuth();
  
  const { restaurants, loading, hasMore, loadMore, refresh } = useRestaurants({
    foodType,
    keyword: searchTerm,
    pageSize: 10
  });
  
  const { 
    isFavorite, 
    toggleFavorite, 
    favoriteIds,
    isLoading: favoritesLoading 
  } = useFavoriteRestaurants();

  const handleSearch = useCallback(() => {
    setSearchTerm(keyword);
  }, [keyword]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);
  
  // Sort restaurants to show favorites first
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    const aIsFavorite = isFavorite(a.id);
    const bIsFavorite = isFavorite(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row items-center">
        <div className="w-full sm:w-1/3">
          <Select
            value={foodType}
            onValueChange={setFoodType}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Food Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Veg">Vegetarian</SelectItem>
              <SelectItem value="Non-veg">Non-Vegetarian</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative w-full sm:w-2/3">
          <Input
            placeholder="Search restaurants..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-16"
          />
          <Button 
            onClick={handleSearch}
            className="absolute right-0 top-0 rounded-l-none"
            size="sm"
          >
            Search
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && restaurants.length === 0 ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          sortedRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-40 bg-muted">
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-muted">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={restaurant.food_type === 'Veg' ? 'success' : 
                              restaurant.food_type === 'Non-veg' ? 'destructive' : 
                              'default'}
                    >
                      {restaurant.food_type}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge 
                      variant={restaurant.isOpen ? 'success' : 'secondary'}
                    >
                      {restaurant.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  {user && (
                    <button
                      onClick={() => toggleFavorite(restaurant.id)}
                      className="absolute top-2 left-2 p-1.5 bg-background/80 rounded-full shadow-md hover:bg-background transition-colors"
                      aria-label={isFavorite(restaurant.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        className={cn(
                          "h-5 w-5 transition-colors", 
                          isFavorite(restaurant.id) 
                            ? "fill-red-500 text-red-500" 
                            : "text-muted-foreground"
                        )} 
                      />
                    </button>
                  )}
                </div>
                
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold">{restaurant.name}</h3>
                    {isFavorite(restaurant.id) && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-500 border-red-200">
                        Favorite
                      </Badge>
                    )}
                  </div>
                  
                  {restaurant.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      {restaurant.rating.toFixed(1)} ({restaurant.rating_count})
                    </span>
                  </div>
                  
                  {restaurant.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {restaurant.opening_time.substring(0, 5)} - {restaurant.closing_time.substring(0, 5)}
                    </span>
                  </div>
                  
                  {restaurant.tags && restaurant.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {restaurant.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {restaurant.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{restaurant.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {!loading && restaurants.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No restaurants found</p>
          <Button onClick={refresh} variant="outline" className="mt-4">
            Refresh
          </Button>
        </div>
      )}
      
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={loadMore} 
            variant="outline" 
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
