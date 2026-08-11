-- Migration 009: Deduplicate duplicate PageVisitLog entries

DELETE FROM "PageVisitLog" 
WHERE id NOT IN (
  SELECT min(id) 
  FROM "PageVisitLog" 
  GROUP BY "sessionId", "pagePath", "durationSeconds", "visitedAt"
);
