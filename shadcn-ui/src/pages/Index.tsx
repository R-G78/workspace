import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { UserRound, Stethoscope, Hospital, BarChart } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Triage AI System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An intelligent healthcare triage system designed to optimize patient care and resource allocation
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">For Patients</TabsTrigger>
            <TabsTrigger value="doctors">For Doctors</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-100 p-2 rounded-md">
                      <UserRound className="h-6 w-6 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-medium">Patient-Centered</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Prioritizes patient well-being with accurate assessments and reduced wait times.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-indigo-100 p-2 rounded-md">
                      <Stethoscope className="h-6 w-6 text-indigo-700" />
                    </div>
                    <h3 className="text-lg font-medium">AI-Powered</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Leverages advanced algorithms to analyze symptoms and determine optimal care paths.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-100 p-2 rounded-md">
                      <Hospital className="h-6 w-6 text-purple-700" />
                    </div>
                    <h3 className="text-lg font-medium">Resource Optimization</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Efficiently allocates healthcare resources based on real-time demand and severity.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex flex-col items-center justify-center mt-8 space-y-6">
              <p className="text-muted-foreground text-center max-w-2xl">
                Our triage system combines cutting-edge AI technology with medical expertise to streamline patient flow, reduce wait times, and ensure the most critical cases receive immediate attention.
              </p>
              <div className="flex gap-4 flex-wrap justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/dashboard">
                    <BarChart className="h-5 w-5" />
                    Main Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="patients" className="space-y-6 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold">For Patients</h2>
                <p className="text-muted-foreground mt-2">
                  Our patient portal streamlines your visit and keeps you informed every step of the way.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-blue-700">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Easy Check-in</h3>
                    <p className="text-muted-foreground text-sm">
                      Complete your check-in process digitally and provide your symptoms in detail.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-blue-700">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Real-time Status Updates</h3>
                    <p className="text-muted-foreground text-sm">
                      Monitor your position in the queue and receive estimated wait times.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-blue-700">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Transparent Process</h3>
                    <p className="text-muted-foreground text-sm">
                      Understand how your case is prioritized and who will be treating you.
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-center">
                <Button asChild size="lg">
                  <Link to="/patient">
                    Go to Patient Portal
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="doctors" className="space-y-6 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold">For Healthcare Providers</h2>
                <p className="text-muted-foreground mt-2">
                  Our comprehensive doctor dashboard helps you manage patients efficiently with AI-assisted insights.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-indigo-700">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Prioritized Patient Queue</h3>
                    <p className="text-muted-foreground text-sm">
                      See patients ordered by severity with AI-recommended prioritization.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-indigo-700">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Comprehensive Patient Information</h3>
                    <p className="text-muted-foreground text-sm">
                      Access detailed patient data, symptoms, medical history, and AI analysis in one place.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-indigo-700">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Resource Management</h3>
                    <p className="text-muted-foreground text-sm">
                      Efficiently assign rooms, update patient status, and collaborate with other providers.
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-center">
                <Button asChild size="lg">
                  <Link to="/doctor">
                    Go to Doctor Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-6 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Administrative Tools</h2>
                <p className="text-muted-foreground mt-2">
                  Powerful analytics and management tools for healthcare facility administrators.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-purple-700">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Real-time Analytics</h3>
                    <p className="text-muted-foreground text-sm">
                      Monitor facility performance, wait times, and resource utilization in real time.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-purple-700">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Staff Management</h3>
                    <p className="text-muted-foreground text-sm">
                      Optimize staff allocation based on current demand and specialization needs.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-1">
                    <span className="font-medium text-purple-700">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">System Configuration</h3>
                    <p className="text-muted-foreground text-sm">
                      Customize triage algorithms, facility settings, and integration with other systems.
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-center">
                <Button asChild size="lg">
                  <Link to="/dashboard">
                    Go to Admin Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}