import { useState } from "react";
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Briefcase, Clock, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "All", "Medical", "Engineering", "Industrial", "Maritime", "Hospitality", "Retail", "Logistics"
];

export default function Jobs() {
  const [category, setCategory] = useState("All");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [search, setSearch] = useState("");

  const { data: jobs, isLoading } = useListJobs(
    { 
      category: category !== "All" ? category : undefined, 
      urgent: urgentOnly ? true : undefined 
    },
    { query: { queryKey: getListJobsQueryKey({ category: category !== "All" ? category : undefined, urgent: urgentOnly ? true : undefined }) } }
  );

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) || 
    job.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-background pb-20">
      {/* Banner */}
      <div className="bg-primary text-primary-foreground py-16 text-center px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Open Positions</h1>
          <p className="text-lg md:text-xl text-primary-foreground/90">
            Join Thousands of Professionals Already Working with Bluestar Alliance
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-12">
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="bg-card border rounded-sm p-6 sticky top-28 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-primary mb-6">Filter Opportunities</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Search Role or Location</label>
                  <Input 
                    placeholder="e.g. Engineer, USA..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Industry Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button 
                    variant={urgentOnly ? "default" : "outline"} 
                    className={`w-full justify-start ${urgentOnly ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                    onClick={() => setUrgentOnly(!urgentOnly)}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {urgentOnly ? "Showing Urgent Only" : "Show Urgent Only"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 lg:w-3/4">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="rounded-sm border-border overflow-hidden">
                    <CardHeader className="pb-4">
                      <Skeleton className="h-8 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs && filteredJobs.length > 0 ? (
              <div className="space-y-6">
                {filteredJobs.map(job => (
                  <Card key={job.id} className="rounded-sm border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all group">
                    <CardHeader className="pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="font-serif text-2xl text-primary group-hover:text-accent transition-colors">
                            {job.title}
                          </CardTitle>
                          {job.isUrgent && (
                            <Badge variant="destructive" className="uppercase tracking-wider text-[10px] font-bold rounded-sm px-2">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            {job.category}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {job.experienceLevel}
                          </div>
                        </div>
                      </div>
                      <Link href="/apply">
                        <Button className="shrink-0 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                          Apply Now
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                        {job.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card border rounded-sm">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-serif font-bold text-foreground mb-2">No roles found</h3>
                <p className="text-muted-foreground mb-6">We couldn't find any positions matching your criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCategory("All");
                    setUrgentOnly(false);
                    setSearch("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
