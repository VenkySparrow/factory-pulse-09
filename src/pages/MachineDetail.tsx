import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MachineData {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  status: 'running' | 'idle' | 'down';
  criticality: string | null;
  last_maintenance_date: string | null;
  ideal_cycle_time: number | null;
  departments: { name: string } | null;
}

const MachineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState<MachineData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [downtime, setDowntime] = useState<any[]>([]);
  const [cycleTimeData, setCycleTimeData] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchMachineData();
      fetchAlerts();
      fetchDowntime();
      fetchCycleTimeData();

      const channel = supabase
        .channel(`machine-${id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'machines', filter: `id=eq.${id}` }, () => {
          fetchMachineData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchMachineData = async () => {
    const { data, error } = await supabase
      .from('machines')
      .select('*, departments(name)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setMachine(data);
    }
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('machine_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setAlerts(data);
    }
  };

  const fetchDowntime = async () => {
    const { data, error } = await supabase
      .from('downtime')
      .select('*')
      .eq('machine_id', id)
      .order('start_time', { ascending: false })
      .limit(5);

    if (!error && data) {
      setDowntime(data);
    }
  };

  const fetchCycleTimeData = async () => {
    const { data, error } = await supabase
      .from('machine_states')
      .select('cycle_time, timestamp')
      .eq('machine_id', id)
      .order('timestamp', { ascending: false })
      .limit(30);

    if (!error && data) {
      const formattedData = data.reverse().map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        cycleTime: item.cycle_time || 0,
      }));
      setCycleTimeData(formattedData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-status-running';
      case 'idle':
        return 'text-status-idle';
      case 'down':
        return 'text-status-down';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!machine) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading machine data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/machines')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{machine.name}</h1>
            <p className="text-muted-foreground">Real-time machine monitoring and analytics</p>
          </div>
          <div className={cn("px-4 py-2 rounded-lg font-medium capitalize", getStatusColor(machine.status))}>
            <Activity className="inline-block h-4 w-4 mr-2" />
            {machine.status}
          </div>
        </div>

        {/* Machine Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{machine.model || 'N/A'}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Serial Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{machine.serial_number || 'N/A'}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {machine.departments?.name || 'Unassigned'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Criticality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground capitalize">
                {machine.criticality || 'Medium'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Ideal Cycle Time</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {machine.ideal_cycle_time || 60}s
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Last Maintenance</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {machine.last_maintenance_date
                  ? new Date(machine.last_maintenance_date).toLocaleDateString()
                  : 'Not scheduled'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Active Alerts</CardTitle>
              <AlertCircle className="h-5 w-5 text-status-down" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-down">
                {alerts.filter(a => a.status === 'active').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cycle Time Trend */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Cycle Time Trend (Last 30 readings)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cycleTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cycleTime"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-border bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{alert.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      alert.severity === 'high' && "bg-status-down/20 text-status-down",
                      alert.severity === 'medium' && "bg-status-idle/20 text-status-idle",
                      alert.severity === 'low' && "bg-muted text-muted-foreground"
                    )}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No alerts for this machine
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Downtime */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Downtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {downtime.map((dt) => (
                <div
                  key={dt.id}
                  className="p-3 rounded-lg border border-border bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{dt.reason || 'No reason specified'}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(dt.start_time).toLocaleString()}
                        {dt.end_time && ` - ${new Date(dt.end_time).toLocaleString()}`}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-status-down">
                      {dt.duration_minutes ? `${dt.duration_minutes} min` : 'Ongoing'}
                    </span>
                  </div>
                </div>
              ))}
              {downtime.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No downtime recorded for this machine
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MachineDetail;