import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Plus, Search, SortAsc, SortDesc } from "lucide-react";
import { Layout } from "@/components/layout";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TaskForm, TaskFormValues } from "@/components/task-form";
import { 
  useGetTasks, 
  useCreateTask, 
  useGetCategories,
  getGetTasksQueryKey,
  getGetUpcomingTasksQueryKey,
  getGetOverdueTasksQueryKey,
  getGetStatsSummaryQueryKey,
  getGetStatsByPriorityQueryKey,
  getGetStatsByStatusQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Debounce search
  useState(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Query params
  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
    ...(priorityFilter !== "all" ? { priority: priorityFilter as any } : {}),
    ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
  };

  const { data: tasks, isLoading } = useGetTasks(params);
  const { data: categories } = useGetCategories();
  
  const createTask = useCreateTask();

  const handleCreateTask = (values: TaskFormValues) => {
    const tags = values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    createTask.mutate(
      { 
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
        onSuccess: () => {
          setIsCreateOpen(false);
          toast({ title: "Task created successfully" });
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetUpcomingTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOverdueTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsByPriorityQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsByStatusQueryKey() });
        },
        onError: (err) => {
          toast({ 
            title: "Failed to create task", 
            description: "Please try again later.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 pb-12 h-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
            <p className="text-muted-foreground">Manage and track your work.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <TaskForm onSubmit={handleCreateTask} isSubmitting={createTask.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span><span className="text-muted-foreground mr-1">Status:</span> {statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span><span className="text-muted-foreground mr-1">Priority:</span> {priorityFilter === 'all' ? 'All' : priorityFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span><span className="text-muted-foreground mr-1">Category:</span> {categoryFilter === 'all' ? 'All' : categoryFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {tasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <TaskCard task={task} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 bg-card border border-border border-dashed rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                We couldn't find any tasks matching your current filters. Try adjusting them or create a new task.
              </p>
              <Button onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setCategoryFilter("all");
              }} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}