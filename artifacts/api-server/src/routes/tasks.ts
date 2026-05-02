import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, lt, gte, lte, sql } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetTasksQueryParams,
  GetTasksResponse,
  CreateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  ToggleTaskCompleteParams,
  ToggleTaskCompleteResponse,
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

router.get("/tasks/upcoming", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, userId),
        gte(tasksTable.dueDate, now),
        lte(tasksTable.dueDate, sevenDaysLater),
        sql`${tasksTable.status} != 'completed'`
      )
    )
    .orderBy(asc(tasksTable.dueDate));

  res.json(GetTasksResponse.parse(tasks));
});

router.get("/tasks/overdue", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const now = new Date();

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, userId),
        lt(tasksTable.dueDate, now),
        sql`${tasksTable.status} != 'completed'`
      )
    )
    .orderBy(asc(tasksTable.dueDate));

  res.json(GetTasksResponse.parse(tasks));
});

router.get("/tasks", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = GetTasksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, priority, search, category, dueBefore, dueAfter } = parsed.data;
  const conditions = [eq(tasksTable.userId, userId)];

  if (status) conditions.push(eq(tasksTable.status, status));
  if (priority) conditions.push(eq(tasksTable.priority, priority));
  if (search) conditions.push(ilike(tasksTable.title, `%${search}%`));
  if (category) conditions.push(eq(tasksTable.category, category));
  if (dueBefore) conditions.push(lte(tasksTable.dueDate, dueBefore));
  if (dueAfter) conditions.push(gte(tasksTable.dueDate, dueAfter));

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(...conditions))
    .orderBy(desc(tasksTable.createdAt));

  res.json(GetTasksResponse.parse(tasks));
});

router.post("/tasks", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      ...parsed.data,
      userId,
      tags: parsed.data.tags ?? [],
    })
    .returning();

  res.status(201).json(GetTaskResponse.parse(task));
});

router.get("/tasks/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .update(tasksTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/tasks/:id/complete", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = ToggleTaskCompleteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));

  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const newStatus = existing.status === "completed" ? "pending" : "completed";

  const [task] = await db
    .update(tasksTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  res.json(ToggleTaskCompleteResponse.parse(task));
});

export default router;
