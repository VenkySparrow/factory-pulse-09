import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, AlertCircle, Factory, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MachineStats {
  total: number;
  running: number;
  idle: number;
  down: number;
}

interface Machine {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'down';
  utilization?: number;
  output_count?: number;
}

const Dashboard = () => {
  const [machineStats, setMachineStats] = useState<MachineStats>({
    total: 0,
    running: 0,
    idle: 0,
    down: 0,
  });
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to real-time updates
    const machinesChannel = supabase
      .channel('machines-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const alertsChannel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(machinesChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    const { data: machinesData, error } = await supabase
      .from('machines')
      .select('*')
      .eq('is_active', true);

    if (!error && machinesData) {
      const stats = {
        total: machinesData.length,
        running: machinesData.filter((m) => m.status === 'running').length,
        idle: machinesData.filter((m) => m.status === 'idle').length,
        down: machinesData.filter((m) => m.status === 'down').length,
      };
      setMachineStats(stats);
      setMachines(machinesData);
    }
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setAlerts(data);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-status-running';
      case 'idle':
        return 'bg-status-idle';
      case 'down':
        return 'bg-status-down';
      default:
        return 'bg-muted';
    }
  };

  const oee = machineStats.total > 0 
    ? ((machineStats.running / machineStats.total) * 100).toFixed(1)
    : '0';

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Factory Command Center</h1>
          <p className="text-muted-foreground">Real-time factory health and performance metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Machines
              </CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{machineStats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card cursor-pointer hover:shadow-glow transition-shadow"
                onClick={() => navigate('/machines?status=running')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Running
              </CardTitle>
              <Activity className="h-4 w-4 text-status-running" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-running">{machineStats.running}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card cursor-pointer hover:shadow-glow transition-shadow"
                onClick={() => navigate('/machines?status=idle')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Idle
              </CardTitle>
              <Activity className="h-4 w-4 text-status-idle" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-idle">{machineStats.idle}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card cursor-pointer hover:shadow-glow transition-shadow"
                onClick={() => navigate('/machines?status=down')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Down
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-status-down" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-down">{machineStats.down}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Factory OEE
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{oee}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Machine Heat Map */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Machine Status Heat Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  onClick={() => navigate(`/machines/${machine.id}`)}
                  className={cn(
                    "p-4 rounded-lg cursor-pointer transition-all hover:scale-105",
                    "border-2",
                    machine.status === 'running' && "border-status-running bg-status-running/10",
                    machine.status === 'idle' && "border-status-idle bg-status-idle/10",
                    machine.status === 'down' && "border-status-down bg-status-down/10"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-3 h-3 rounded-full", getStatusColor(machine.status))} />
                    <span className="font-medium text-sm text-foreground truncate">{machine.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Status: {machine.status}</div>
                  </div>
                </div>
              ))}
            </div>
            {machines.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No machines found. Add machines to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-border bg-secondary/50 flex items-center justify-between cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => navigate('/alerts')}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className={cn(
                      "h-5 w-5",
                      alert.severity === 'high' && "text-status-down",
                      alert.severity === 'medium' && "text-status-idle",
                      alert.severity === 'low' && "text-muted-foreground"
                    )} />
                    <div>
                      <div className="font-medium text-foreground">{alert.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
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
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;