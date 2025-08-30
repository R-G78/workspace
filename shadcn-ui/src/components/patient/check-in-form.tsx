import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Patient } from "@/types/medical";
import type { TriageItem } from "@/types/triage";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Age must be a positive number",
  }),
  gender: z.string().min(1, "Please select your gender"),
  contactNumber: z.string().optional(),
  insuranceInfo: z.string().optional(),
  title: z.string().min(5, "Chief complaint must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  emergencyContact: z.string().optional(),
  consentToTreatment: z.boolean().refine((val) => val === true, {
    message: "You must consent to treatment",
  }),
});

interface CheckInFormProps {
  onCheckInComplete: (patient: Patient & { triage: TriageItem }) => void;
}

export function CheckInForm({ onCheckInComplete }: CheckInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "",
      contactNumber: "",
      insuranceInfo: "",
      title: "",
      description: "",
      medicalHistory: "",
      allergies: "",
      currentMedications: "",
      emergencyContact: "",
      consentToTreatment: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Parse allergies and medications from comma-separated strings
      const allergies = values.allergies 
        ? values.allergies.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : [];
      
      const currentMedications = values.currentMedications
        ? values.currentMedications.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : [];

      // Create patient record
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          age: parseInt(values.age),
          gender: values.gender,
          contactNumber: values.contactNumber,
          insuranceInfo: values.insuranceInfo,
          medicalHistory: values.medicalHistory,
          allergies,
          currentMedications,
          emergencyContact: values.emergencyContact,
        })
      });

      if (!patientResponse.ok) {
        throw new Error('Failed to create patient record');
      }

      const patient = await patientResponse.json();

      // Create triage item
      const triageResponse = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          status: "new",
          category: "general",
          patientId: patient.id,
          symptoms: values.description.split(',').map(s => s.trim()),
          priority: "medium" // Default priority, will be updated by AI
        })
      });

      if (!triageResponse.ok) {
        throw new Error('Failed to create triage record');
      }

      const processedItem = await triageResponse.json();
      
      // In a real app, we would save the patient record to the database here
      // const connection = await pool.getConnection();
      // await connection.execute(
      //   'INSERT INTO patients (name, symptoms, status) VALUES (?, ?, ?)',
      //   [patient.name, triageItem.description, 'waiting']
      // );
      // connection.release();
      
      // Notify parent component
      onCheckInComplete({
        ...patient,
        triage: processedItem
      });
      
      // Reset form
      form.reset();
      
      // Show success notification
      toast.success("Check-in complete", {
        description: "Your information has been received. A healthcare provider will be with you shortly.",
      });
    } catch (error) {
      console.error("Failed to process check-in:", error);
      toast.error("Check-in failed", {
        description: "Please try again or speak to the front desk staff for assistance.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Patient Check-In</CardTitle>
        <CardDescription>
          Please complete this form to check in for your visit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact (Name & Number)</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Insurance provider and policy number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Visit Information</h3>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint</FormLabel>
                    <FormControl>
                      <Input placeholder="Main reason for your visit today" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe your symptoms, when they started, and any other relevant details" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Medical Information</h3>
              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please list any significant medical conditions or previous surgeries" 
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Input placeholder="Separate multiple allergies with commas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentMedications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Input placeholder="Separate multiple medications with commas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="consentToTreatment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Consent to Treatment</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      I consent to treatment and acknowledge that my information will be used for medical purposes.
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Complete Check-in"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="bg-muted/20 text-xs text-muted-foreground border-t">
        Your privacy is important to us. Your information will be handled according to our privacy policy.
      </CardFooter>
    </Card>
  );
}

