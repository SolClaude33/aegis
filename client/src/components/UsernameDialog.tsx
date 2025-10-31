import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

type UsernameFormData = z.infer<typeof usernameSchema>;

interface UsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  currentUsername?: string;
  isEditing: boolean;
  onSuccess: () => void;
}

export function UsernameDialog({ open, onOpenChange, walletAddress, currentUsername, isEditing, onSuccess }: UsernameDialogProps) {
  const { toast } = useToast();

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: currentUsername || "",
    },
  });

  // Sync form when dialog opens or username changes
  useEffect(() => {
    if (open) {
      form.reset({ username: currentUsername || "" });
    }
  }, [open, currentUsername, form]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: UsernameFormData) => {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `/api/wallet/profile/${walletAddress}` 
        : '/api/wallet/profile';
      
      const res = await apiRequest(method, url, {
        ...(method === 'POST' && { walletAddress }),
        username: data.username,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/profile', walletAddress] });
      const action = isEditing ? "updated" : "created";
      toast({
        title: `Profile ${action}!`,
        description: `Your wallet profile has been successfully ${action}.`,
      });
      onOpenChange(false);
      onSuccess();
      form.reset({ username: "" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to save profile";
      const description = errorMessage.includes('409') || errorMessage.includes('exists')
        ? "Username already taken. Please choose another."
        : errorMessage;
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    },
  });

  const onSubmit = (data: UsernameFormData) => {
    createProfileMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md cyber-border">
        <DialogHeader>
          <DialogTitle className="font-cyber cyber-glow">
            {isEditing ? 'EDIT PROFILE' : 'CREATE PROFILE'}
          </DialogTitle>
          <DialogDescription className="font-mono">
            {isEditing ? 'Update your username' : 'Choose a username for your wallet profile'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="cyber_trader_01"
                      className="font-mono"
                      data-testid="input-username"
                      disabled={createProfileMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription className="text-xs font-mono">
                    3-20 characters, letters, numbers, and underscores only
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={createProfileMutation.isPending}
                className="w-full font-mono"
                data-testid="button-create-profile"
              >
                {createProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'UPDATING...' : 'CREATING...'}
                  </>
                ) : (
                  isEditing ? 'UPDATE PROFILE' : 'CREATE PROFILE'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
