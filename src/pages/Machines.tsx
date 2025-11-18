import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Machine {
  id: string;
  name: string;
  model: string | null;
  status: 'running' | 'idle' | 'down';
  departments: { name: string } | null;
}

const Machines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchMachines();

    const channel = supabase
      .channel('machines-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, () => {
        fetchMachines();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMachines = async () => {
    const { data, error } = await supabase
      .from('machines')
      .select('*, departments(name)')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setMachines(data);
    }
  };

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Machines</h1>
            <p className="text-muted-foreground">Monitor and manage all factory machines</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Machine
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search machines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Machine Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.map((machine) => (
            <Card
              key={machine.id}
              className="border-border bg-card shadow-card cursor-pointer hover:shadow-glow transition-all"
              onClick={() => navigate(`/machines/${machine.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">{machine.name}</CardTitle>
                  <Activity className={cn("h-5 w-5", getStatusColor(machine.status))} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="text-foreground font-medium">{machine.model || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="text-foreground font-medium">
                      {machine.departments?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={cn("font-medium capitalize", getStatusColor(machine.status))}>
                      {machine.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMachines.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                No machines found. Try adjusting your filters.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Machines;