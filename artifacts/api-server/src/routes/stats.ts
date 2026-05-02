import { Router, type IRouter } from "express";
import { and, eq, lt, count, sql } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetStatsSummaryResponse,
  GetStatsByPriorityResponse,
  GetStatsByStatusResponse,
  GetCategoriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

router.get("/stats/summary", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const now = new Date();

  const allTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId));

  const total = allTasks.length;
  const pending = allTasks.filter((t) => t.status === "pending").length;
  const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
  const completed = allTasks.filter((t) => t.status === "completed").length;
  const overdue = allTasks.filter(
    (t) => t.dueDate && t.dueDate < now && t.status !== "completed"
  ).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json(
    GetStatsSummaryResponse.parse({
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate,
    })
  );
});

router.get("/stats/by-priority", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const rows = await db
    .select({
      priority: tasksTable.priority,
      count: count(),
    })
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId))
    .groupBy(tasksTable.priority);

  const result = rows.map((r) => ({ priority: r.priority, count: r.count }));
  res.json(GetStatsByPriorityResponse.parse(result));
});

router.get("/stats/by-status", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const rows = await db
    .select({
      status: tasksTable.status,
      count: count(),
    })
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId))
    .groupBy(tasksTable.status);

  const result = rows.map((r) => ({ status: r.status, count: r.count }));
  res.json(GetStatsByStatusResponse.parse(result));
});

router.get("/categories", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const rows = await db
    .select({ category: tasksTable.category })
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), sql`${tasksTable.category} IS NOT NULL`))
    .groupBy(tasksTable.category);

  const categories = rows
    .map((r) => r.category)
    .filter((c): c is string => c !== null);

  res.json(GetCategoriesResponse.parse(categories));
});

export default router;
