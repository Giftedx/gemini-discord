/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { fetchAuthenticated } from '@/lib/backendService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Terminal, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Workflow {
  id: string;
  workflowName: string;
  triggerType: string;
  actionConfig: {
    targetChannelId: string;
  };
  isEnabled: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAuthenticated('/api/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWorkflows();
    }
  }, [user, fetchWorkflows]);

  const handleStatusToggle = async (workflowId: string, isEnabled: boolean) => {
    try {
      await fetchAuthenticated(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });
      
      // Optimistically update UI
      setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, isEnabled: !isEnabled } : w));
      toast({
        title: 'Success',
        description: `Workflow has been ${!isEnabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Error updating workflow',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await fetchAuthenticated(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      setWorkflows(workflows.filter(w => w.id !== workflowId));
      toast({
        title: 'Success',
        description: 'Workflow deleted successfully.',
      });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Error deleting workflow',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
     return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Fetching Workflows</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
     )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflows</CardTitle>
        <CardDescription>
          A list of automated workflows for your server. Manage them here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Target Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.length > 0 ? workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell className="font-medium">{workflow.workflowName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{workflow.triggerType}</Badge>
                </TableCell>
                <TableCell>#{workflow.actionConfig.targetChannelId}</TableCell>
                <TableCell>
                   <Switch
                    checked={workflow.isEnabled}
                    onCheckedChange={() => handleStatusToggle(workflow.id, workflow.isEnabled)}
                    aria-label="Toggle workflow status"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the workflow
                          &quot;{workflow.workflowName}&quot;.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteWorkflow(workflow.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No workflows found. Create one using the bot!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
