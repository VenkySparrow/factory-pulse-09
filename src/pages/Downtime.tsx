import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Clock, AlertTriangle } from 'lucide-react';

interface Downtime {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  reason: string | null;
  status: string;
  machines: { name: string } | null;
}

const Downtime = () => {
  const [downtimeRecords, setDowntimeRecords] = useState<Downtime[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchDowntime();

    const channel = supabase
      .channel('downtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'downtime' }, () => {
        fetchDowntime();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDowntime = async () => {
    const { data, error } = await supabase
      .from('downtime')
      .select('*, machines(name)')
      .order('start_time', { ascending: false });

    if (!error && data) {
      setDowntimeRecords(data);
    }
  };

  const filteredDowntime = downtimeRecords.filter((dt) => {
    if (statusFilter === 'all') return true;
    return dt.status === statusFilter;
  });

  const totalDowntime = downtimeRecords
    .filter(dt => dt.duration_minutes)
    .reduce((acc, dt) => acc + (dt.duration_minutes || 0), 0);

  const openDowntime = downtimeRecords.filter(dt => dt.status === 'open').length;

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Downtime Tracking</h1>
          <p className="text-muted-foreground">Monitor and analyze machine downtime</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Downtime (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-down">
                {totalDowntime} min
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Open Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-idle">
                {openDowntime}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {downtimeRecords.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Downtime List */}
        <div className="space-y-3">
          {filteredDowntime.map((dt) => (
            <Card key={dt.id} className="border-border bg-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <AlertTriangle className="h-5 w-5 text-status-down mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {dt.machines?.name || 'Unknown Machine'}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          dt.status === 'open'
                            ? 'bg-status-down/20 text-status-down'
                            : 'bg-status-running/20 text-status-running'
                        }`}>
                          {dt.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Started: {new Date(dt.start_time).toLocaleString()}
                          </span>
                        </div>
                        {dt.end_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              Ended: {new Date(dt.end_time).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="text-foreground font-medium">
                          Reason: {dt.reason || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-status-down">
                      {dt.duration_minutes ? `${dt.duration_minutes} min` : 'Ongoing'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDowntime.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                No downtime records found.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Downtime;