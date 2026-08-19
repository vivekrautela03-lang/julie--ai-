-- =============================================================================
-- PROJECT JULIE — DATABASE FUNCTIONS & TRIGGERS
-- Migration 03: Vector Search, Deterministic Stats, Auto-timestamps
-- =============================================================================

-- 1. Auto-update `updated_at` trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER tr_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
    END LOOP;
END;
$$;

-- 2. Semantic Memory Vector Search Function (Cosine Distance via pgvector)
CREATE OR REPLACE FUNCTION public.search_memories(
    p_user_id UUID,
    p_query_embedding vector(1536),
    p_match_threshold FLOAT DEFAULT 0.65,
    p_match_count INT DEFAULT 5,
    p_memory_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    memory_type TEXT,
    category TEXT,
    topic_tag TEXT,
    importance INT,
    similarity FLOAT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.memory_type,
        m.category,
        m.topic_tag,
        m.importance,
        1 - (m.embedding <=> p_query_embedding) AS similarity,
        m.created_at
    FROM public.memories m
    WHERE m.user_id = p_user_id
      AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
      AND (m.embedding IS NOT NULL)
      AND (1 - (m.embedding <=> p_query_embedding) >= p_match_threshold)
    ORDER BY similarity DESC
    LIMIT p_match_count;
END;
$$;

-- 3. Topic Forgetfulness Function ("Forget everything about topic")
CREATE OR REPLACE FUNCTION public.forget_topic_memories(
    p_user_id UUID,
    p_topic TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.memories
    WHERE user_id = p_user_id
      AND (
          LOWER(topic_tag) = LOWER(p_topic)
          OR LOWER(content) LIKE '%' || LOWER(p_topic) || '%'
      );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log action in transparency audit log
    INSERT INTO public.ai_action_logs (user_id, action_type, description, reason, source, user_confirmed)
    VALUES (
        p_user_id,
        'MEMORY_PURGE',
        format('Purged %s memories related to topic: %s', deleted_count, p_topic),
        'User requested to forget topic',
        'User Command',
        TRUE
    );

    RETURN deleted_count;
END;
$$;

-- 4. Calculate Subject Attendance Summary
CREATE OR REPLACE FUNCTION public.get_attendance_summary(p_user_id UUID)
RETURNS TABLE (
    subject_id UUID,
    subject_code TEXT,
    subject_name TEXT,
    total_classes BIGINT,
    attended_classes BIGINT,
    missed_classes BIGINT,
    percentage NUMERIC(5, 2),
    min_required NUMERIC(5, 2),
    safe_misses INT,
    status_level TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH att_counts AS (
        SELECT 
            s.id AS sub_id,
            s.subject_code AS s_code,
            s.subject_name AS s_name,
            s.min_attendance_req AS s_min,
            COUNT(ar.id) FILTER (WHERE ar.status IN ('attended', 'missed')) AS total_cnt,
            COUNT(ar.id) FILTER (WHERE ar.status = 'attended') AS attended_cnt,
            COUNT(ar.id) FILTER (WHERE ar.status = 'missed') AS missed_cnt
        FROM public.subjects s
        LEFT JOIN public.attendance_records ar ON ar.subject_id = s.id AND ar.user_id = p_user_id
        WHERE s.user_id = p_user_id
        GROUP BY s.id, s.subject_code, s.subject_name, s.min_attendance_req
    )
    SELECT
        sub_id,
        s_code,
        s_name,
        total_cnt,
        attended_cnt,
        missed_cnt,
        CASE WHEN total_cnt = 0 THEN 100.00 
             ELSE ROUND((attended_cnt::numeric / total_cnt::numeric) * 100, 2) 
        END AS percentage,
        s_min,
        CASE WHEN total_cnt = 0 THEN 0
             WHEN (attended_cnt::numeric / total_cnt::numeric) * 100 >= s_min THEN
                 FLOOR((attended_cnt::numeric - (s_min / 100.0) * total_cnt::numeric) / (s_min / 100.0))::INT
             ELSE
                 -1 * CEIL(((s_min / 100.0) * total_cnt::numeric - attended_cnt::numeric) / (1.0 - (s_min / 100.0)))::INT
        END AS safe_misses,
        CASE 
            WHEN total_cnt = 0 THEN 'Good'
            WHEN (attended_cnt::numeric / total_cnt::numeric) * 100 >= s_min + 5 THEN 'Safe'
            WHEN (attended_cnt::numeric / total_cnt::numeric) * 100 >= s_min THEN 'Warning'
            ELSE 'Critical'
        END AS status_level
    FROM att_counts;
END;
$$;
