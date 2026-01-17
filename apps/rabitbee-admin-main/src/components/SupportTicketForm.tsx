import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/use-tenant";

const userRoleOptions = [
  { value: "customer", label: "Customer", icon: "👤" },
  { value: "delivery_agent", label: "Delivery Agent", icon: "🚚" },
  { value: "service_provider", label: "Service Provider", icon: "🔧" }
];

const issueCategoryOptions = [
  { value: "order_not_received", label: "Order Not Received", icon: "📦" },
  { value: "wrong_delayed_delivery", label: "Wrong/Delayed Delivery", icon: "⏰" },
  { value: "payment_issue", label: "Payment Issue", icon: "💳" },
  { value: "service_problem", label: "Service Problem", icon: "⚠️" },
  { value: "app_bug", label: "App Bug or Technical Issue", icon: "🐛" },
  { value: "other", label: "Other", icon: "❓" }
];

interface SupportTicketFormProps {
  onSuccess?: () => void;
}

export default function SupportTicketForm({ onSuccess }: SupportTicketFormProps) {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [userRole, setUserRole] = useState<string>("");
  const [issueCategory, setIssueCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      // Upload attachments if any
      let attachmentUrls: any[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `support-tickets/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('support-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Failed to upload ${file.name}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('support-attachments')
            .getPublicUrl(filePath);

          attachmentUrls.push({
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type
          });
        }
      }

      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user?.id,
          tenant_id: selectedTenant?.id,
          user_role: ticketData.userRole,
          issue_category: ticketData.issueCategory,
          subject: ticketData.subject,
          description: ticketData.description,
          attachments: attachmentUrls,
          status: 'new',
          priority: 'medium'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Support ticket submitted successfully. We'll get back to you soon!"
      });
      
      // Reset form
      setUserRole("");
      setIssueCategory("");
      setSubject("");
      setDescription("");
      setAttachments([]);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive"
          });
          return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} - Only JPG, PNG, and PDF files are allowed`,
            variant: "destructive"
          });
          return false;
        }
        
        return true;
      });
      
      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole || !issueCategory || !subject.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createTicketMutation.mutate({
      userRole,
      issueCategory,
      subject: subject.trim(),
      description: description.trim()
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Raise a Support Ticket</CardTitle>
        <p className="text-muted-foreground">
          Need help with an order, delivery, or service? Let us know what went wrong and we'll get back to you as soon as possible.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Role Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">👤 Your Role</Label>
            <p className="text-sm text-muted-foreground">Select who you are:</p>
            <RadioGroup value={userRole} onValueChange={setUserRole}>
              {userRoleOptions.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={role.value} id={role.value} />
                  <Label htmlFor={role.value} className="flex items-center gap-2 cursor-pointer">
                    <span>{role.icon}</span>
                    {role.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Issue Category */}
          <div className="space-y-3">
            <Label className="text-base font-medium">🗂️ Issue Category</Label>
            <p className="text-sm text-muted-foreground">Select the type of issue:</p>
            <RadioGroup value={issueCategory} onValueChange={setIssueCategory}>
              {issueCategoryOptions.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={category.value} id={category.value} />
                  <Label htmlFor={category.value} className="flex items-center gap-2 cursor-pointer">
                    <span>{category.icon}</span>
                    {category.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Subject */}
          <div className="space-y-3">
            <Label htmlFor="subject" className="text-base font-medium">📝 Ticket Subject</Label>
            <p className="text-sm text-muted-foreground">Provide a short summary of your issue</p>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Payment deducted but order not placed"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">🧾 Detailed Description</Label>
            <p className="text-sm text-muted-foreground">Explain the issue clearly so we can resolve it quickly.</p>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about your issue..."
              rows={4}
              required
            />
          </div>

          {/* File Attachments */}
          <div className="space-y-3">
            <Label className="text-base font-medium">📎 Attach Files (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Upload screenshots, photos, or documents to help us understand the issue better.
            </p>
            <p className="text-xs text-muted-foreground">
              Max file size: 10MB • Supported formats: JPG, PNG, PDF
            </p>
            
            <div className="space-y-2">
              <Input
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                className="cursor-pointer"
              />
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createTicketMutation.isPending}
          >
            {createTicketMutation.isPending ? "Submitting..." : "Submit Support Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}