import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const registerUser = useRegisterUser();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(data: RegisterFormValues) {
    registerUser.mutate({
      data
    }, {
      onSuccess: (res) => {
        localStorage.setItem("bluestar_token", res.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/");
      }
    });
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center bg-muted/20 py-20 px-4">
      <Card className="max-w-md w-full border-border shadow-lg bg-card">
        <CardHeader className="space-y-3 text-center pb-8 border-b border-border">
          <div className="w-12 h-12 bg-primary rounded mx-auto flex items-center justify-center mb-2">
            <div className="w-4 h-4 bg-accent rotate-45 transform"></div>
          </div>
          <CardTitle className="font-serif text-3xl font-bold text-primary">Create Account</CardTitle>
          <CardDescription className="text-base">
            Join Bluestar Alliance and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-4">
          {registerUser.isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {registerUser.error?.message || "Registration failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium" 
                disabled={registerUser.isPending}
              >
                {registerUser.isPending ? "Creating account..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border pt-6 pb-8">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary font-medium hover:text-accent transition-colors">Sign in here</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
