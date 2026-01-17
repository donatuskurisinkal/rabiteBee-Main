
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, MapPin, Star, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  deliveryAgents: any[];
  onAssign: (orderId: string, agentId: string) => Promise<void>;
  onSuccess: () => void;
}

export function OrderAssignmentModal({
  open,
  onOpenChange,
  orderId,
  deliveryAgents,
  onAssign,
  onSuccess
}: OrderAssignmentModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const availableAgents = deliveryAgents.filter(agent => 
    agent.is_active && agent.is_online
  );

  const handleAssign = async () => {
    if (!selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select a delivery agent",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onAssign(orderId, selectedAgentId);
      toast({
        title: "Success",
        description: "Delivery agent assigned successfully",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign delivery agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgent = availableAgents.find(agent => agent.id === selectedAgentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Delivery Agent</DialogTitle>
          <DialogDescription>
            Select an available delivery agent for order #{orderId.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Available Agents ({availableAgents.length})
            </label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a delivery agent..." />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No available agents found
                  </div>
                ) : (
                  availableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{agent.name}</span>
                        {agent.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{agent.rating}</span>
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedAgent && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{selectedAgent.name}</h4>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Rating: {selectedAgent.rating || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Orders: {selectedAgent.pending_orders || 0}</span>
                </div>
              </div>

              {selectedAgent.vehicle_type && (
                <div className="flex items-center gap-2 text-sm">
                  <span>Vehicle: {selectedAgent.vehicle_type}</span>
                  {selectedAgent.vehicle_number && (
                    <Badge variant="outline" className="text-xs">
                      {selectedAgent.vehicle_number}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedAgentId || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
