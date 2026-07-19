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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, UploadCloud, CreditCard, Copy, AlertCircle, FileText, X } from "lucide-react";

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

const ADDONS = [
  {
    id: "visaSponsorship",
    label: "Visa Sponsorship",
    description: "Full visa processing and sponsorship support for your destination country.",
    price: 500,
  },
  {
    id: "flightTicket",
    label: "Flight Ticket",
    description: "Round-trip flight ticket to your placement destination.",
    price: 800,
  },
  {
    id: "workPermit",
    label: "Work Permit",
    description: "Official work permit processing through government channels.",
    price: 600,
  },
];

type AddonId = "visaSponsorship" | "flightTicket" | "workPermit";

export default function Apply() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<AddonId, boolean>>({
    visaSponsorship: false,
    flightTicket: false,
    workPermit: false,
  });
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [submittedData, setSubmittedData] = useState<ApplicationFormValues | null>(null);
  const [addonOrderSubmitted, setAddonOrderSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // CV upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploadedUrl, setCvUploadedUrl] = useState<string | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const totalAddonAmount = ADDONS.filter(a => selectedAddons[a.id as AddonId]).reduce((sum, a) => sum + a.price, 0);
  const hasAddons = Object.values(selectedAddons).some(Boolean);

  useEffect(() => {
    if (showPayment) {
      fetch("/api/admin/payment-settings")
        .then(r => r.ok ? r.json() : null)
        .then(data => setPaymentSettings(data))
        .catch(() => {});
    }
  }, [showPayment]);

  function toggleAddon(id: AddonId) {
    setSelectedAddons(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  async function uploadCv(file: File) {
    setCvError(null);
    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await fetch("/api/upload/cv", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setCvUploadedUrl(data.url);
    } catch (e: any) {
      setCvError(e.message || "Failed to upload CV. Please try again.");
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  }

  function handleFileSelect(file: File) {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(file.type) && !["pdf", "doc", "docx"].includes(ext ?? "")) {
      setCvError("Only PDF, DOC, or DOCX files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvError("File size must be under 5MB.");
      return;
    }
    setCvFile(file);
    setCvUploadedUrl(null);
    uploadCv(file);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // reset so the same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function removeCv() {
    setCvFile(null);
    setCvUploadedUrl(null);
    setCvError(null);
  }

  async function handleAddonOrder() {
    if (!applicationId || !submittedData) return;
    try {
      await fetch("/api/addon-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          applicantEmail: submittedData.email,
          applicantName: submittedData.fullName,
          visaSponsorship: selectedAddons.visaSponsorship,
          flightTicket: selectedAddons.flightTicket,
          workPermit: selectedAddons.workPermit,
          totalAmount: totalAddonAmount * 100,
          paymentMethod: "bank_transfer",
        }),
      });
      setAddonOrderSubmitted(true);
    } catch (e) {}
  }

  function onSubmit(data: ApplicationFormValues) {
    submitApplication.mutate({
      data: {
        ...data,
        yearsOfExperience: Number(data.yearsOfExperience),
        cvFileName: cvUploadedUrl ?? (cvFile ? cvFile.name : undefined),
      }
    }, {
      onSuccess: (result: any) => {
        setSubmittedData(data);
        setApplicationId(result?.id || null);
        if (hasAddons) {
          setShowPayment(true);
        } else {
          setIsSuccess(true);
        }
      },
      onError: () => {
        form.setError("root", { message: "Submission failed. Please check your details and try again." });
      }
    });
  }

  if (isSuccess && !showPayment) {
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

  if (showPayment) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {addonOrderSubmitted ? (
          <Card className="text-center border-border shadow-lg">
            <CardContent className="pt-12 pb-12 px-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-4">Order Confirmed!</h2>
              <p className="text-lg text-muted-foreground mb-4 max-w-xl">
                Your application and add-on order have been received. Please complete the bank transfer and our team will confirm your payment within 1-2 business days.
              </p>
              <p className="text-sm text-muted-foreground mb-8">Your documents will be processed within <strong>15 business days</strong> of payment confirmation.</p>
              <Button onClick={() => window.location.href = '/'} variant="outline" className="min-w-[200px]">
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground">Complete your add-on order via bank transfer below.</p>
            </div>

            <Card className="mb-6 border-border shadow-md">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="font-serif text-xl text-primary">Your Selected Add-ons</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {ADDONS.filter(a => selectedAddons[a.id as AddonId]).map(a => (
                  <div key={a.id} className="py-3 border-b border-border last:border-0">
                    <p className="font-semibold text-foreground">{a.label}</p>
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {paymentSettings ? (
              <Card className="mb-6 border-border shadow-md">
                <CardHeader className="border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <CardTitle className="font-serif text-xl text-primary">Bank Transfer Details</CardTitle>
                  </div>
                  <CardDescription>Use your full name as reference. Our team will contact you with the exact amount and any further instructions.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {[
                    { label: "Bank Name", value: paymentSettings.bankName },
                    { label: "Account Name", value: paymentSettings.accountName },
                    { label: "Account Number", value: paymentSettings.accountNumber },
                    paymentSettings.routingNumber && { label: "Routing Number", value: paymentSettings.routingNumber },
                    paymentSettings.swiftCode && { label: "SWIFT / BIC Code", value: paymentSettings.swiftCode },
                    submittedData && { label: "Reference", value: submittedData.fullName },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-muted/30 rounded-sm">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{item.label}</p>
                        <p className="font-semibold text-foreground">{item.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.value, item.label)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {copiedField === item.label ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                  {paymentSettings.additionalInfo && (
                    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-sm">
                      <p className="text-sm text-primary">{paymentSettings.additionalInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800">Payment details are being configured. Our team will contact you with bank transfer information within 24 hours at <strong>{submittedData?.email}</strong>.</p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90 h-14 text-lg"
                onClick={handleAddonOrder}
              >
                I've Completed the Transfer
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-14"
                onClick={() => setIsSuccess(true)}
              >
                I'll Pay Later
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Your application has already been submitted. Contact us at bluestaralliancecompanyltd@gmail.com for questions.
            </p>
          </>
        )}
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

                {/* CV Upload */}
                <div>
                  <Label className="text-foreground mb-3 block">Resume / Curriculum Vitae</Label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  {cvFile ? (
                    /* Uploaded file display */
                    <div className="border-2 border-border rounded-sm p-4 bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{cvFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(cvFile.size / 1024).toFixed(0)} KB
                            {cvUploading && " · Uploading..."}
                            {cvUploadedUrl && !cvUploading && " · Uploaded ✓"}
                          </p>
                        </div>
                        {cvUploading ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <button
                            type="button"
                            onClick={removeCv}
                            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Drop zone */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-sm p-8 text-center transition-colors cursor-pointer group ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50"
                      }`}
                    >
                      <UploadCloud className={`w-10 h-10 mx-auto mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                      <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or DOC (Max 5MB)</p>
                    </div>
                  )}

                  {cvError && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {cvError}
                    </p>
                  )}
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

                {/* Add-ons Section */}
                <div className="border-t border-border pt-8">
                  <div className="mb-6">
                    <h3 className="font-serif text-xl font-bold text-primary mb-2">Optional Add-ons</h3>
                    <p className="text-muted-foreground text-sm">
                      Enhance your application with our Candidate Support Program. Your application is free — add-ons are paid separately via bank transfer after submission.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ADDONS.map((addon) => {
                      const checked = selectedAddons[addon.id as AddonId];
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id as AddonId)}
                          className={`relative border-2 rounded-sm p-5 cursor-pointer transition-all ${
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              className="mt-0.5"
                              onCheckedChange={() => toggleAddon(addon.id as AddonId)}
                              onClick={e => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-foreground mb-1">{addon.label}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{addon.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {hasAddons && (
                    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-sm">
                      <p className="font-semibold text-primary">Add-ons Selected</p>
                      <p className="text-sm text-muted-foreground">Payment details will be arranged via bank transfer after submission</p>
                    </div>
                  )}
                </div>

                {form.formState.errors.root && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{form.formState.errors.root.message}</span>
                  </div>
                )}

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 rounded-sm text-lg px-10 h-14"
                    disabled={submitApplication.isPending || cvUploading}
                  >
                    {submitApplication.isPending
                      ? "Submitting..."
                      : cvUploading
                      ? "Uploading CV..."
                      : hasAddons
                      ? "Submit & Continue to Payment"
                      : "Submit Application"}
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
