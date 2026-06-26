import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmitApplication } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Valid phone number required"),
  country: z.string().min(2, "Country is required"),
  position: z.string().min(2, "Please select a position"),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience must be 0 or greater"),
  coverLetter: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function Apply() {
  const [isSuccess, setIsSuccess] = useState(false);
  const submitApplication = useSubmitApplication();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      country: "",
      position: "",
      yearsOfExperience: 0,
      coverLetter: "",
    },
  });

  function onSubmit(data: ApplicationFormValues) {
    submitApplication.mutate({
      data: {
        ...data,
        cvFileName: "uploaded-cv.pdf", // Mock CV upload
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-2xl w-full text-center border-border shadow-lg">
          <CardContent className="pt-12 pb-12 px-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-primary mb-4">Application Received</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto">
              Your application has been successfully submitted. With over 18 years of recruitment excellence, our HR team carefully reviews every application and will contact shortlisted candidates.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="min-w-[200px]">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-background pb-24 pt-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-primary mb-4">Professional Application</h1>
          <p className="text-muted-foreground text-lg">Take the next step in your global career.</p>
        </div>

        <Card className="border-border shadow-md rounded-sm">
          <CardHeader className="border-b border-border bg-muted/30 pb-6">
            <CardTitle className="font-serif text-2xl text-primary">Candidate Profile</CardTitle>
            <CardDescription>Please provide accurate details for our recruitment team.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Full Legal Name</FormLabel>
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
                        <FormLabel className="text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Country of Residence</FormLabel>
                        <FormControl>
                          <Input placeholder="USA, Australia, UK..." {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Desired Position</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select a position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nurse">Nurse</SelectItem>
                            <SelectItem value="Civil Engineer">Civil Engineer</SelectItem>
                            <SelectItem value="CNC Machinist">CNC Machinist</SelectItem>
                            <SelectItem value="Oil Rig Engineer">Oil Rig Engineer</SelectItem>
                            <SelectItem value="Electrician">Electrician</SelectItem>
                            <SelectItem value="Mechanical Engineer">Mechanical Engineer</SelectItem>
                            <SelectItem value="Ship Crew Member">Ship Crew Member</SelectItem>
                            <SelectItem value="Hospitality Manager">Hospitality Manager</SelectItem>
                            <SelectItem value="Retail Supervisor">Retail Supervisor</SelectItem>
                            <SelectItem value="Logistics Coordinator">Logistics Coordinator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mock CV Upload */}
                <div className="col-span-1">
                  <FormLabel className="text-foreground mb-3 block">Resume / Curriculum Vitae</FormLabel>
                  <div className="border-2 border-dashed border-border rounded-sm p-8 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                    <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or DOC (Max 5MB)</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="coverLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Cover Letter (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us why you're the right fit for this position..." 
                          className="min-h-[150px] bg-background resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 rounded-sm text-lg px-10 h-14"
                    disabled={submitApplication.isPending}
                  >
                    {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
