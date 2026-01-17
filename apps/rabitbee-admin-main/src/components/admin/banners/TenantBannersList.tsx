
import React from 'react';
import { useTenantBanners } from '@/hooks/useTenantBanners';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Lottie from "react-lottie-player";
import { Skeleton } from '@/components/ui/skeleton';

interface TenantBannersListProps {
  screenId?: string | null;
  onlyActive?: boolean;
}

export function TenantBannersList({ screenId, onlyActive = true }: TenantBannersListProps) {
  const { data: banners, isLoading, error } = useTenantBanners({ screenId, onlyActive });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4 flex gap-4">
              <Skeleton className="w-16 h-16" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error loading banners</p>;
  }

  if (!banners || banners.length === 0) {
    return <p className="text-gray-500">No banners found</p>;
  }

  return (
    <div className="space-y-4">
      {banners.map(banner => (
        <Card key={banner.id} className="overflow-hidden">
          <CardContent className="p-4 flex gap-4">
            <div className="w-16 h-16 relative flex-shrink-0">
              {banner.assetType === 'lottie' ? (
                <div className="w-full h-full">
                  <Lottie
                    loop
                    animationData={null}
                    play
                    style={{ width: '100%', height: '100%' }}
                    rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
                  />
                </div>
              ) : (
                <img 
                  src={banner.imageUrl} 
                  alt={banner.name} 
                  className="object-cover w-full h-full rounded"
                />
              )}
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{banner.name}</h3>
                <div className="flex gap-2">
                  <Badge variant={banner.isActive ? "default" : "outline"}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="secondary">{banner.assetType}</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-500">Screen: {banner.screenName}</p>
              {banner.description && (
                <p className="text-sm mt-2">{banner.description}</p>
              )}
              {banner.secondaryDescription && (
                <p className="text-xs mt-1 italic text-gray-500">{banner.secondaryDescription}</p>
              )}
              <div className="mt-2 text-xs text-gray-400">Display order: {banner.displayOrder}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
