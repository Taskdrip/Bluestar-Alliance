import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useSubmitApplication,
  useGetCurrentUser,
  useLoginUser,
  useRegisterUser,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearch } from "wouter";
import { CheckCircle2, UploadCloud, CreditCard, Copy, AlertCircle, FileText, X, LogIn, UserPlus, Clock } from "lucide-react";

// ─── Industry taxonomy ───────────────────────────────────────────────────────

const INDUSTRIES: Record<string, string[]> = {
  "Healthcare & Medical": [
    "Registered Nurse",
    "General Practitioner (Doctor)",
    "Surgeon",
    "Physiotherapist",
    "Medical Laboratory Technician",
    "Pharmacist",
    "Dental Assistant / Dentist",
    "Radiographer",
    "Midwife",
    "Healthcare Assistant",
    "Occupational Therapist",
    "Paramedic",
  ],
  "Engineering": [
    "Civil Engineer",
    "Structural Engineer",
    "Mechanical Engineer",
    "Electrical Engineer",
    "Chemical Engineer",
    "Environmental Engineer",
    "Petroleum Engineer",
    "Mining Engineer",
    "Geotechnical Engineer",
    "Project Engineer",
    "Instrumentation Engineer",
    "Process Engineer",
  ],
  "Oil & Gas": [
    "Oil Rig Engineer",
    "Drilling Engineer",
    "Petroleum Engineer",
    "Pipeline Technician",
    "HSE Officer (Oil & Gas)",
    "Process Operator",
    "Instrument Technician",
    "Subsea Engineer",
    "Wellsite Geologist",
    "Production Supervisor",
  ],
  "Manufacturing & Trades": [
    "CNC Machinist",
    "Welder (MIG / TIG / SMAW)",
    "Fitter & Turner",
    "Boilermaker",
    "Sheet Metal Worker",
    "Industrial Mechanic",
    "Production Operator",
    "Quality Control Inspector",
    "Tool & Die Maker",
    "Electrician (Industrial)",
    "Plumber / Pipefitter",
    "HVAC Technician",
  ],
  "Construction": [
    "Site Manager",
    "Construction Project Manager",
    "HSE / Safety Officer",
    "Site Foreman",
    "Quantity Surveyor",
    "Building Inspector",
    "Scaffolder",
    "Crane Operator",
    "Heavy Equipment Operator",
    "Carpenter / Joiner",
    "Concrete Finisher",
    "Rebar / Steel Fixer",
  ],
  "Maritime & Shipping": [
    "Ship Crew Member",
    "Deck Officer (1st / 2nd / 3rd Mate)",
    "Captain / Master Mariner",
    "Marine Engineer",
    "Chief Engineer (Marine)",
    "Able Seaman",
    "Bosun",
    "Port Operator",
    "Naval Architect",
    "Marine Electrician",
  ],
  "Hospitality & Tourism": [
    "Hospitality Manager",
    "Hotel General Manager",
    "Executive Chef",
    "Sous Chef",
    "Restaurant Manager",
    "Front Desk / Receptionist",
    "Housekeeping Supervisor",
    "Event Coordinator",
    "Travel Consultant",
    "Food & Beverage Manager",
    "Bartender / Mixologist",
    "Tour Guide",
  ],
  "Retail & Commerce": [
    "Retail Supervisor",
    "Store Manager",
    "Sales Representative",
    "Merchandiser",
    "Customer Service Manager",
    "E-commerce Specialist",
    "Procurement Officer",
    "Business Development Manager",
  ],
  "Logistics & Supply Chain": [
    "Logistics Coordinator",
    "Truck Driver (HGV / Class 1)",
    "Warehouse Manager",
    "Freight Forwarder",
    "Supply Chain Analyst",
    "Fleet Manager",
    "Customs Broker",
    "Inventory Controller",
    "Distribution Manager",
  ],
  "IT & Technology": [
    "Software Engineer",
    "Network Engineer",
    "IT Support Specialist",
    "Cybersecurity Analyst",
    "Data Analyst / Data Scientist",
    "DevOps / Cloud Engineer",
    "Systems Administrator",
    "UI/UX Designer",
    "ERP / SAP Consultant",
  ],
  "Agriculture & Farming": [
    "Farm Manager",
    "Agricultural Technician",
    "Livestock Farmer",
    "Crop / Horticulture Specialist",
    "Irrigation Engineer",
    "Aquaculture Technician",
  ],
  "Education": [
    "Primary School Teacher",
    "Secondary School Teacher",
    "University / College Lecturer",
    "Special Education Teacher",
    "School Administrator",
    "ESL / EFL Teacher",
  ],
  "Finance & Accounting": [
    "Accountant (CPA / ACCA)",
    "Auditor",
    "Financial Analyst",
    "Payroll Officer",
    "Tax Consultant",
    "Chief Financial Officer (CFO)",
    "Banking Officer",
  ],
  "Other / General": [
    "Administrative Officer",
    "Human Resources Manager",
    "Legal Counsel / Lawyer",
    "Security Officer",
    "Domestic Worker / Caregiver",
    "Driver",
    "Other (specify in cover letter)",
  ],
};

// ─── Schemas ────────────────────────────────────────────────────────────────

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Valid phone number required"),
  country: z.string().min(2, "Country is required"),
  position: z.string().min(2, "Please select a role"),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience must be 0 or greater"),
  coverLetter: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Add-ons ────────────────────────────────────────────────────────────────

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

// ─── Inline Auth Panel ──────────────────────────────────────────────────────

function AuthPanel({ onAuth }: { onAuth: (name: string, email: string) => void }) {
  const queryClient = useQueryClient();
  const loginUser = useLoginUser();
  const registerUser = useRegisterUser();
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  function handleLoginSubmit(data: LoginFormValues) {
    loginUser.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("bluestar_token", res.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        onAuth("", data.email);
      },
    });
  }

  function handleRegisterSubmit(data: RegisterFormValues) {
    registerUser.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("bluestar_token", res.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        onAuth(data.fullName, data.email);
      },
      onError: (err: any) => {
        const message = err?.message || "";
        // Auto-switch to Sign In tab if email is already registered
        if (message.includes("409") || message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already exists")) {
          loginForm.setValue("email", data.email);
          setActiveTab("login");
        }
      },
    });
  }

  return (
    <Card className="border-border shadow-md rounded-sm">
      <CardHeader className="border-b border-border bg-muted/30 pb-6 text-center">
        <div className="w-12 h-12 bg-primary rounded mx-auto flex items-center justify-center mb-3">
          <div className="w-4 h-4 bg-accent rotate-45 transform" />
        </div>
        <CardTitle className="font-serif text-2xl text-primary">Sign in to Apply</CardTitle>
        <CardDescription className="text-base">
          Create a free account or sign in to track your application and receive updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "register" | "login")}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="register" className="flex-1 gap-2">
              <UserPlus className="w-4 h-4" /> Create Account
            </TabsTrigger>
            <TabsTrigger value="login" className="flex-1 gap-2">
              <LogIn className="w-4 h-4" /> Sign In
            </TabsTrigger>
          </TabsList>

          {/* ── Register Tab ── */}
          <TabsContent value="register">
            {registerUser.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(() => {
                    const msg = (registerUser.error as any)?.message || "";
                    if (msg.includes("409") || msg.toLowerCase().includes("already")) {
                      return (
                        <span>
                          That email is already registered.{" "}
                          <button
                            type="button"
                            className="font-semibold underline underline-offset-2"
                            onClick={() => {
                              loginForm.setValue("email", registerForm.getValues("email"));
                              setActiveTab("login");
                            }}
                          >
                            Sign in instead →
                          </button>
                        </span>
                      );
                    }
                    return msg || "Registration failed. Please try again.";
                  })()}
                </AlertDescription>
              </Alert>
            )}
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-5">
                <FormField
                  control={registerForm.control}
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
                  control={registerForm.control}
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
                  control={registerForm.control}
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
                  {registerUser.isPending ? "Creating account..." : "Create Account & Continue"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" className="text-primary font-medium hover:underline" onClick={() => setActiveTab("login")}>
                    Sign in
                  </button>
                </p>
              </form>
            </Form>
          </TabsContent>

          {/* ── Login Tab ── */}
          <TabsContent value="login">
            {loginUser.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(loginUser.error as any)?.message || "Invalid credentials. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-5">
                <FormField
                  control={loginForm.control}
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
                  control={loginForm.control}
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
                  {loginUser.isPending ? "Signing in..." : "Sign In & Continue"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" className="text-primary font-medium hover:underline" onClick={() => setActiveTab("register")}>
                    Create one
                  </button>
                </p>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── Main Apply Page ─────────────────────────────────────────────────────────

export default function Apply() {
  const hasToken = !!localStorage.getItem("bluestar_token");
  const { data: currentUser, isLoading: authLoading, isError: authError } = useGetCurrentUser({
    query: { enabled: hasToken },
  });
  const isAuthenticated = !!currentUser;

  const [isSuccess, setIsSuccess] = useState(false);
  const [isPayLaterSuccess, setIsPayLaterSuccess] = useState(false);
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
  const [addonOrderLoading, setAddonOrderLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Read URL search params to pre-select industry + role from homepage links
  const searchStr = useSearch();
  const urlParams = new URLSearchParams(searchStr);
  const urlIndustry = urlParams.get("industry") ?? "";
  const urlRole = urlParams.get("role") ?? "";

  // Industry / sub-role selection state
  const [selectedIndustry, setSelectedIndustry] = useState(urlIndustry);

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

  // Pre-fill industry + role from URL params (e.g. /apply?industry=Oil+%26+Gas&role=Drilling+Engineer)
  useEffect(() => {
    if (urlIndustry) setSelectedIndustry(urlIndustry);
    if (urlRole) form.setValue("position", urlRole, { shouldValidate: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill name & email once the user is authenticated
  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) form.setValue("fullName", currentUser.fullName, { shouldValidate: true });
      if (currentUser.email) form.setValue("email", currentUser.email, { shouldValidate: true });
    }
  }, [currentUser, form]);

  // Called right after inline auth succeeds (before the query re-fetches)
  function handleInlineAuth(name: string, email: string) {
    if (name) form.setValue("fullName", name, { shouldValidate: true });
    if (email) form.setValue("email", email, { shouldValidate: true });
  }

  const totalAddonAmount = ADDONS.filter(a => selectedAddons[a.id as AddonId]).reduce((sum, a) => sum + a.price, 0);
  const hasAddons = Object.values(selectedAddons).some(Boolean);

  useEffect(() => {
    if (showPayment) {
      fetch("/api/payment-settings")
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
        throw new Error((err as any).error || "Upload failed");
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

  async function submitAddonOrder(paymentMethod: "bank_transfer" | "pay_later") {
    if (!applicationId || !submittedData) return;
    setAddonOrderLoading(true);
    try {
      const res = await fetch("/api/addon-orders", {
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
          paymentMethod,
        }),
      });
      if (!res.ok) throw new Error("Order failed");
      if (paymentMethod === "bank_transfer") {
        setAddonOrderSubmitted(true);
      } else {
        setIsPayLaterSuccess(true);
      }
    } catch {
      // Show a fallback — still let them proceed
      if (paymentMethod === "bank_transfer") {
        setAddonOrderSubmitted(true);
      } else {
        setIsPayLaterSuccess(true);
      }
    } finally {
      setAddonOrderLoading(false);
    }
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
        const appId = result?.id || null;
        setApplicationId(appId);

        if (hasAddons) {
          // Fire pay-later addon order silently in background
          fetch("/api/addon-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationId: appId,
              applicantEmail: data.email,
              applicantName: data.fullName,
              visaSponsorship: selectedAddons.visaSponsorship,
              flightTicket: selectedAddons.flightTicket,
              workPermit: selectedAddons.workPermit,
              totalAmount: 0,
              paymentMethod: "pay_later",
            }),
          }).catch(() => {});
          setIsPayLaterSuccess(true);
        } else {
          setIsSuccess(true);
        }
      },
      onError: () => {
        form.setError("root", { message: "Submission failed. Please check your details and try again." });
      }
    });
  }

  // ── Success screens ──────────────────────────────────────────────────────

  if (isPayLaterSuccess) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-2xl w-full text-center border-border shadow-lg">
          <CardContent className="pt-12 pb-12 px-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-primary mb-4">Application Confirmed!</h2>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed max-w-xl mx-auto">
              Your application has been successfully submitted and your add-on request has been saved.
            </p>
            <div className="w-full bg-amber-50 border border-amber-200 rounded-sm p-5 mb-8 text-left space-y-2">
              <p className="font-semibold text-amber-900 text-sm">What happens next:</p>
              <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
                <li>Our team will review your application and reach out within <strong>2–3 business days</strong>.</li>
                <li>We'll send bank transfer details to <strong>{submittedData?.email}</strong> when you're ready to proceed.</li>
                <li>Your add-on services will be activated upon payment confirmation.</li>
              </ul>
            </div>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="min-w-[200px]">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
                Your application and add-on order have been received. Our team will confirm your bank transfer within 1–2 business days.
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

            {/* Selected add-ons summary */}
            <Card className="mb-6 border-border shadow-md">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="font-serif text-xl text-primary">Your Selected Add-ons</CardTitle>
                <CardDescription>Total: <strong className="text-foreground">${totalAddonAmount.toLocaleString()}</strong></CardDescription>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-border">
                {ADDONS.filter(a => selectedAddons[a.id as AddonId]).map(a => (
                  <div key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{a.label}</p>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                    </div>
                    <span className="font-bold text-primary ml-4">${a.price}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bank details */}
            {paymentSettings ? (
              <Card className="mb-6 border-border shadow-md">
                <CardHeader className="border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <CardTitle className="font-serif text-xl text-primary">Bank Transfer Details</CardTitle>
                  </div>
                  <CardDescription>Use your full name as the payment reference. Our team will contact you to confirm receipt.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {[
                    { label: "Bank Name", value: paymentSettings.bankName },
                    { label: "Account Name", value: paymentSettings.accountName },
                    { label: "Account Number", value: paymentSettings.accountNumber },
                    paymentSettings.routingNumber && { label: "Routing Number", value: paymentSettings.routingNumber },
                    paymentSettings.swiftCode && { label: "SWIFT / BIC Code", value: paymentSettings.swiftCode },
                    submittedData && { label: "Reference (your name)", value: submittedData.fullName },
                    { label: "Amount", value: `$${totalAddonAmount.toLocaleString()} USD` },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-muted/30 rounded-sm border border-border/50">
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
              <Card className="mb-6 border-amber-200 bg-amber-50">
                <CardContent className="pt-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm">
                    Payment details are being configured. Our team will contact you with bank transfer information within 24 hours at <strong>{submittedData?.email}</strong>.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90 h-14 text-base"
                onClick={() => submitAddonOrder("bank_transfer")}
                disabled={addonOrderLoading}
              >
                {addonOrderLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "I've Completed the Transfer"
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-14 border-2"
                onClick={() => submitAddonOrder("pay_later")}
                disabled={addonOrderLoading}
              >
                <Clock className="w-4 h-4 mr-2" />
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

  // ── Main form view ───────────────────────────────────────────────────────

  return (
    <div className="w-full bg-background pb-24 pt-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-primary mb-4">Professional Application</h1>
          <p className="text-muted-foreground text-lg">Take the next step in your global career.</p>
        </div>

        {/* ── Auth gate ── */}
        {authLoading && !authError ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="max-w-md mx-auto">
            <AuthPanel onAuth={handleInlineAuth} />
          </div>
        ) : (
          /* ── Application form ── */
          <Card className="border-border shadow-md rounded-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-6">
              <CardTitle className="font-serif text-2xl text-primary">Candidate Profile</CardTitle>
              <CardDescription>Please provide accurate details for our recruitment team.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
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

                    {/* Email */}
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

                    {/* Phone */}
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

                    {/* Country */}
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Country of Residence</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Philippines, Nigeria, India..." {...field} className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Industry selector (controls sub-role list) */}
                    <div className="space-y-2">
                      <Label className="text-foreground">Industry / Sector</Label>
                      <Select
                        value={selectedIndustry}
                        onValueChange={(val) => {
                          setSelectedIndustry(val);
                          form.setValue("position", "", { shouldValidate: false });
                        }}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(INDUSTRIES).map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Specific role — only enabled once industry is chosen */}
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Desired Role / Position</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedIndustry}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder={selectedIndustry ? "Select a role" : "Select industry first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedIndustry && (
                                <SelectGroup>
                                  <SelectLabel className="text-xs text-muted-foreground font-semibold tracking-wide">
                                    {selectedIndustry}
                                  </SelectLabel>
                                  {(INDUSTRIES[selectedIndustry] ?? []).map((role) => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Years of experience */}
                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-foreground">Years of Experience</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              {...field}
                              className="bg-background md:max-w-[200px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* CV Upload */}
                  <div>
                    <Label className="text-foreground mb-3 block">Resume / Curriculum Vitae</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    {cvFile ? (
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

                  {/* Cover Letter */}
                  <FormField
                    control={form.control}
                    name="coverLetter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Cover Letter <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your experience, why you're the right fit, and which countries/destinations you're open to..."
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
                      <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-sm flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-primary">Add-ons Selected</p>
                          <p className="text-sm text-muted-foreground">Our team will contact you about these services after your application is reviewed.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {form.formState.errors.root && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-sm p-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                        : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
