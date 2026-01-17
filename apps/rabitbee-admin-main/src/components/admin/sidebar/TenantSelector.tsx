
import { useTenant } from "@/contexts/TenantContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export function TenantSelector() {
  const { selectedTenant, setSelectedTenant, tenants, isLoading } = useTenant();

  if (isLoading || tenants.length === 0) {
    return null;
  }

  return (
    <div className="px-3 py-2">
      <label className="text-xs font-medium text-muted-foreground">
        Select Tenant
      </label>
      <Select
        value={selectedTenant?.id || "all-tenants"}
        onValueChange={(value) => {
          if (value === "all-tenants") {
            setSelectedTenant(null);
          } else {
            const tenant = tenants.find(t => t.id === value);
            if (tenant) {
              setSelectedTenant(tenant);
            }
          }
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="mt-1 w-full text-sm h-9">
          <SelectValue placeholder="Select a tenant" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-tenants">All Tenants</SelectItem>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
