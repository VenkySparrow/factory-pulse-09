import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  machines: { name: string } | null;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, machines(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlerts(data);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (!error) {
      toast({
        title: 'Alert Acknowledged',
        description: 'The alert has been acknowledged successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert.',
        variant: 'destructive',
      });
    }
  };

  const handleResolve = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (!error) {
      toast({
        title: 'Alert Resolved',
        description: 'The alert has been resolved successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert.',
        variant: 'destructive',
      });
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  const getSeverityIcon = (severity: string) => {
    const className = cn(
      "h-5 w-5",
      severity === 'high' && "text-status-down",
      severity === 'medium' && "text-status-idle",
      severity === 'low' && "text-muted-foreground"
    );
    return <AlertCircle className={className} />;
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage system alerts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-down">
                {alerts.filter(a => a.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Acknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-idle">
                {alerts.filter(a => a.status === 'acknowledged').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-running">
                {alerts.filter(a => a.status === 'resolved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="border-border bg-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{alert.message}</h3>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          alert.severity === 'high' && "bg-status-down/20 text-status-down",
                          alert.severity === 'medium' && "bg-status-idle/20 text-status-idle",
                          alert.severity === 'low' && "bg-muted text-muted-foreground"
                        )}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>Machine: {alert.machines?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                        {alert.acknowledged_at && (
                          <div className="flex items-center gap-2 text-status-running">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Acknowledged at {new Date(alert.acknowledged_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {alert.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.status !== 'resolved' && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                No alerts found. Try adjusting your filters.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Alerts;