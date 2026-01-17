
// Instead of re-exporting everything from the hooks file
// we should specifically import and export what we need
import { useToast as useToastHook, toast as toastFunction } from "@/hooks/use-toast";

// Export them with the correct names
export const useToast = useToastHook;
export const toast = toastFunction;
