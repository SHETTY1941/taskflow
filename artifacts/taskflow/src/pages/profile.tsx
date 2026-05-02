import { useUser } from "@clerk/react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { user, isLoaded } = useUser();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
          <p className="text-muted-foreground">Your account information.</p>
        </div>

        {isLoaded && user ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                  <AvatarImage src={user.imageUrl} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1 mt-2">
                  <h2 className="text-2xl font-bold">{user.fullName}</h2>
                  <p className="text-muted-foreground">User ID: <span className="font-mono text-xs">{user.id}</span></p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Information associated with your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Email Addresses</div>
                    <div className="text-sm text-muted-foreground">
                      {user.emailAddresses.map(e => e.emailAddress).join(", ")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Member Since</div>
                    <div className="text-sm text-muted-foreground">
                      {user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "Unknown"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Last Sign In</div>
                    <div className="text-sm text-muted-foreground">
                      {user.lastSignInAt ? format(new Date(user.lastSignInAt), "MMMM d, yyyy 'at' h:mm a") : "Unknown"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </Layout>
  );
}