import { format } from "date-fns";
import { Link } from "wouter";
import { Check, Clock, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToggleTaskComplete, getGetTasksQueryKey, getGetUpcomingTasksQueryKey, getGetOverdueTasksQueryKey, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "@workspace/api-client-react/src/generated/api.schemas";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const queryClient = useQueryClient();
  const toggleTask = useToggleTaskComplete();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTask.mutate(
      { id: task.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetUpcomingTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOverdueTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        },
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

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className={cn(
        "hover-elevate cursor-pointer transition-all duration-200 border-l-4 group",
        task.status === "completed" ? "opacity-60 border-l-green-500" :
        task.priority === "high" ? "border-l-destructive" :
        task.priority === "medium" ? "border-l-amber-500" :
        "border-l-border"
      )}>
        <CardContent className="p-4 flex items-start gap-4">
          <div className="mt-1" onClick={handleToggle}>
            <Checkbox 
              checked={task.status === "completed"} 
              className={cn(
                "rounded-full w-5 h-5 transition-colors",
                task.status === "completed" ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" : ""
              )}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={cn(
                "font-medium text-base truncate",
                task.status === "completed" && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              <div className="flex gap-2 shrink-0">
                <Badge variant="outline" className={cn("capitalize px-2 py-0 h-5 text-[10px]", priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
              </div>
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                {task.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              <Badge variant="outline" className={cn("capitalize px-2 py-0.5 font-normal text-[10px]", statusColors[task.status])}>
                {task.status.replace("_", " ")}
              </Badge>
              
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue ? "text-destructive font-medium" : ""
                )}>
                  {isOverdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                  <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                </div>
              )}
              
              {task.category && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                  <span>{task.category}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}