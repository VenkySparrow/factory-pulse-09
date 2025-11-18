import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Building2 } from 'lucide-react';

const Settings = () => {
  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and preferences</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-foreground">User Management</CardTitle>
                    <CardDescription>Manage users and their roles in the system</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <h4 className="font-medium text-foreground mb-2">Available Roles:</h4>
                    <ul className="space-y-2">
                      <li><strong className="text-foreground">Admin:</strong> Full access to all features and settings</li>
                      <li><strong className="text-foreground">Manager:</strong> Access to dashboards, reports, and machine management</li>
                      <li><strong className="text-foreground">Maintenance:</strong> Machine management and downtime tracking</li>
                      <li><strong className="text-foreground">Operator:</strong> View-only access to machine status</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-foreground">Shift Configuration</CardTitle>
                    <CardDescription>Define shift timings and production targets</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Configure shift schedules, timings, and planned production targets for accurate performance tracking.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-foreground">Department Setup</CardTitle>
                    <CardDescription>Manage departments and production lines</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Organize your factory floor by creating departments and production lines, then assign machines accordingly.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;