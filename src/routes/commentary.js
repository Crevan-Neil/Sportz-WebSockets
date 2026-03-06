import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamsSchema } from "../validation/matches.js";
import { listCommentaryQuerySchema, createCommentarySchema } from "../validation/commentary.js";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
    const parsedParams = matchIdParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
        return res.status(400).json({
            error: "Invalid match ID.",
            details: parsedParams.error.issues
        });
    }

    const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        return res.status(400).json({
            error: "Invalid query.",
            details: parsedQuery.error.issues
        });
    }

    const MAX_LIMIT = 100;
    const limit = Math.min(parsedQuery.data.limit ?? 100, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, parsedParams.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({ data });
    } catch (e) {
        console.error("Failed to list commentary", e);
        res.status(500).json({ error: "Failed to list commentary entries." });
    }
});

commentaryRouter.post("/", async (req, res) => {
    const parsedParams = matchIdParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
        return res.status(400).json({
            error: "Invalid match ID.",
            details: parsedParams.error.issues
        });
    }

    const parsedBody = createCommentarySchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({
            error: "Invalid payload.",
            details: parsedBody.error.issues
        });
    }

    try {
        const [entry] = await db.insert(commentary).values({
            ...parsedBody.data,
            matchId: parsedParams.data.id
        }).returning();
        if (res.app.locals.broadcastCommentary(entry.matchId, entry));
        return res.status(201).json({ data: entry });
    } catch (e) {
        console.error("Failed to insert commentary", e);
        return res.status(500).json({ error: "Failed to create commentary entry." });
    }
});
