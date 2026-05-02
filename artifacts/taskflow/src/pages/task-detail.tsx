import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Trash2, Edit, Calendar, Tag, CheckCircle2, Clock } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TaskForm, TaskFormValues } from "@/components/task-form";
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
} from "@/components/ui/alert-dialog";
import {
  useGetTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskComplete,
  getGetTasksQueryKey,
  getGetTaskQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: task, isLoading, isError } = useGetTask(taskId, {
    query: { enabled: !!taskId }
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTaskComplete();

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Task Not Found</h2>
          <p className="text-muted-foreground mb-6">This task might have been deleted or doesn't exist.</p>
          <Button onClick={() => setLocation("/tasks")}>Back to Tasks</Button>
        </div>
      </Layout>
    );
  }

  const handleUpdate = (values: TaskFormValues) => {
    const tags = values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    updateTask.mutate(
      { 
        id: taskId,
        data: {
          title: values.title,
          description: values.description,
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
          priority: values.priority,
          status: values.status,
          category: values.category,
          tags: tags
        }
      },
      {
        onSuccess: (updatedTask) => {
          setIsEditing(false);
          toast({ title: "Task updated" });
          queryClient.setQueryData(getGetTaskQueryKey(taskId), updatedTask);
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        },
        onError: () => {
          toast({ 
            title: "Failed to update", 
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(
      { id: taskId },
      {
        onSuccess: () => {
          toast({ title: "Task deleted" });
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          setLocation("/tasks");
        },
        onError: () => {
          toast({ 
            title: "Failed to delete task", 
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleToggleStatus = () => {
    toggleTask.mutate(
      { id: taskId },
      {
        onSuccess: (updatedTask) => {
          queryClient.setQueryData(getGetTaskQueryKey(taskId), updatedTask);
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          toast({ title: updatedTask.status === "completed" ? "Marked as completed" : "Marked as pending" });
        }
      }
    );
  };

  const priorityColors = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-muted text-muted-foreground border-border",
  };

  const statusColors = {
    pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/tasks")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Task Details</div>
          </div>
          
          {!isLoading && task && !isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the task "{task.title}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <div className="py-4"><Skeleton className="h-24 w-full" /></div>
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ) : isEditing && task ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Edit Task</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
                <TaskForm 
                  defaultValues={{
                    title: task.title,
                    description: task.description || "",
                    dueDate: task.dueDate ? new Date(task.dueDate) : null,
                    priority: task.priority,
                    status: task.status,
                    category: task.category || "",
                    tags: task.tags?.join(", ") || "",
                  }}
                  onSubmit={handleUpdate}
                  isSubmitting={updateTask.isPending}
                />
              </div>
            ) : task ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className={`text-2xl sm:text-3xl font-bold ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className={`capitalize ${statusColors[task.status]}`}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className={`capitalize ${priorityColors[task.priority]}`}>
                        {task.priority} Priority
                      </Badge>
                      {task.category && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-primary/50 mr-2"></span>
                          {task.category}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant={task.status === "completed" ? "outline" : "default"}
                    onClick={handleToggleStatus}
                    className="shrink-0"
                    disabled={toggleTask.isPending}
                  >
                    {task.status === "completed" ? (
                      <><Clock className="mr-2 h-4 w-4" /> Mark Pending</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete</>
                    )}
                  </Button>
                </div>

                {task.description && (
                  <div className="bg-muted/50 rounded-lg p-4 text-foreground whitespace-pre-wrap">
                    {task.description}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t pt-6 border-border">
                  {task.dueDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Due Date</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(task.dueDate), "EEEE, MMMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="font-normal text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground text-right mt-8 pt-4 border-t border-border">
                  Created {format(new Date(task.createdAt), "MMM d, yyyy h:mm a")}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}