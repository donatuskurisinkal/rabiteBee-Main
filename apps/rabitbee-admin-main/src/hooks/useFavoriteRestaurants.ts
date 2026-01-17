
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useFavoriteRestaurants() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('favourite_restaurants')
        .select('restaurant_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setFavoriteIds(data.map(item => item.restaurant_id));
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      toast({
        variant: "destructive",
        title: "Error loading favorites",
        description: error.message || "Failed to load your favorite restaurants."
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  const toggleFavorite = useCallback(async (restaurantId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save favorite restaurants.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const isFavorite = favoriteIds.includes(restaurantId);
      
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favourite_restaurants')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);
          
        setFavoriteIds(prev => prev.filter(id => id !== restaurantId));
        
        toast({
          title: "Restaurant removed from favorites",
          variant: "default"
        });
      } else {
        // Add to favorites
        await supabase
          .from('favourite_restaurants')
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId
          });
          
        setFavoriteIds(prev => [...prev, restaurantId]);
        
        toast({
          title: "Restaurant added to favorites",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message || "Failed to update favorites."
      });
    }
  }, [user, favoriteIds, toast]);
  
  const isFavorite = useCallback((restaurantId: string) => {
    return favoriteIds.includes(restaurantId);
  }, [favoriteIds]);
  
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);
  
  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    isLoading,
    refresh: fetchFavorites
  };
}
