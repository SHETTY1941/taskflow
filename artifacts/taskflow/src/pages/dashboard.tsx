import { useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus, Clock, AlertCircle, CheckCircle2, ListTodo, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout";
import { TaskCard } from "@/components/task-card";
import { 
  useGetStatsSummary, 
  useGetStatsByPriority, 
  useGetStatsByStatus,
  useGetUpcomingTasks,
  useGetOverdueTasks
} from "@workspace/api-client-react";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetStatsSummary();
  const { data: priorityStats, isLoading: isLoadingPriority } = useGetStatsByPriority();
  const { data: statusStats, isLoading: isLoadingStatus } = useGetStatsByStatus();
  const { data: upcomingTasks, isLoading: isLoadingUpcoming } = useGetUpcomingTasks();
  const { data: overdueTasks, isLoading: isLoadingOverdue } = useGetOverdueTasks();

  const priorityColors = {
    high: "hsl(var(--destructive))",
    medium: "hsl(34 100% 50%)", // Amber
    low: "hsl(var(--muted-foreground))",
  };

  const statusColors = {
    pending: "hsl(var(--muted-foreground))",
    in_progress: "hsl(var(--primary))",
    completed: "hsl(142 71% 45%)", // Green
  };

  const chartDataPriority = useMemo(() => {
    if (!priorityStats) return [];
    return priorityStats.map(item => ({
      name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
      count: item.count,
      fill: priorityColors[item.priority as keyof typeof priorityColors] || priorityColors.low
    }));
  }, [priorityStats]);

  const chartDataStatus = useMemo(() => {
    if (!statusStats) return [];
    return statusStats.map(item => ({
      name: item.status.replace("_", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      count: item.count,
      fill: statusColors[item.status as keyof typeof statusColors] || statusColors.pending
    }));
  }, [statusStats]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back. Here's what needs your attention.</p>
          </div>
          <Link href="/tasks">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>

        {/* Stats Summary */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between space-x-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-4 flex items-baseline">
                  {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
                    <span className="text-3xl font-bold text-foreground">{summary?.total || 0}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between space-x-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 flex items-baseline">
                  {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
                    <span className="text-3xl font-bold text-foreground">{summary?.pending || 0}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between space-x-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Overdue</h3>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div className="mt-4 flex items-baseline">
                  {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
                    <span className="text-3xl font-bold text-destructive">{summary?.overdue || 0}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between space-x-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="mt-4 flex items-baseline">
                  {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">{summary?.completed || 0}</span>
                      <span className="text-sm font-medium text-green-500">
                        {summary?.completionRate ? `${Math.round(summary.completionRate)}%` : '0%'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charts */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
                <CardDescription>Distribution of active tasks by priority level.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[250px] w-full">
                  {isLoadingPriority ? <Skeleton className="w-full h-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataPriority} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--muted))' }} 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {chartDataPriority.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
                <CardDescription>Breakdown of all tasks by current status.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  {isLoadingStatus ? <Skeleton className="w-full h-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {chartDataStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Task Lists */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-6"
          >
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertCircle size={18} />
                    Overdue
                  </CardTitle>
                  <CardDescription>Tasks past their due date.</CardDescription>
                </div>
                <Link href="/tasks?status=pending&dueBefore=today">
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-t border-border">
                  {isLoadingOverdue ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>
                    ))
                  ) : overdueTasks && overdueTasks.length > 0 ? (
                    overdueTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="p-0">
                        <TaskCard task={task} />
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No overdue tasks. Great job!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock size={18} className="text-primary" />
                    Upcoming
                  </CardTitle>
                  <CardDescription>Tasks due soon.</CardDescription>
                </div>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-t border-border">
                  {isLoadingUpcoming ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>
                    ))
                  ) : upcomingTasks && upcomingTasks.length > 0 ? (
                    upcomingTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="p-0">
                        <TaskCard task={task} />
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No upcoming tasks.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}