import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const redirectTo = new URLSearchParams(searchStr).get("redirect") || "/";
  const queryClient = useQueryClient();
  const loginUser = useLoginUser();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormValues) {
    loginUser.mutate({
      data
    }, {
      onSuccess: (res) => {
        localStorage.setItem("bluestar_token", res.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation(redirectTo);
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
          <CardTitle className="font-serif text-3xl font-bold text-primary">Sign In</CardTitle>
          <CardDescription className="text-base">
            Access your Bluestar Alliance account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-4">
          {loginUser.isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginUser.error?.message || "Invalid credentials. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                disabled={loginUser.isPending}
              >
                {loginUser.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border pt-6 pb-8">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-primary font-medium hover:text-accent transition-colors"
            >
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
