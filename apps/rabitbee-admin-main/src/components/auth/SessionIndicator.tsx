
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, ShieldCheck, ShieldX } from "lucide-react";

export const SessionIndicator = () => {
  const { user, session, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!user || !session) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="flex items-center gap-1">
              <ShieldX size={14} />
              <span>No Session</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">You are not logged in</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Calculate session expiration time
  const expiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null;
  const now = new Date();
  const minutesLeft = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)) : 0;
  
  const isExpiringSoon = minutesLeft < 15;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isExpiringSoon ? "outline" : "default"} 
            className={`flex items-center gap-1 ${isExpiringSoon ? "border-yellow-400 text-yellow-600" : ""}`}
          >
            {isExpiringSoon ? (
              <Clock size={14} />
            ) : (
              <ShieldCheck size={14} />
            )}
            <span>
              {isExpiringSoon 
                ? `Session expires in ${minutesLeft}m` 
                : "Session active"}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Logged in as {user.email}</p>
          {expiresAt && (
            <p className="text-xs">Expires: {expiresAt.toLocaleTimeString()}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
