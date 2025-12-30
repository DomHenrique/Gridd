-- =====================================================
-- GRIDD360 - STORED PROCEDURES / FUNCTIONS
-- =====================================================
-- Para PostgreSQL
-- Nota: Adaptar para SQLite/MySQL conforme necessário
-- =====================================================

-- =====================================================
-- FUNÇÃO 1: fn_get_user_recent_activities
-- Retorna últimas atividades de um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_user_recent_activities(
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 20,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  id TEXT,
  action TEXT,
  target_name TEXT,
  target_type TEXT,
  timestamp TIMESTAMP,
  status TEXT,
  details TEXT,
  ip_address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    activity_logs.id,
    activity_logs.action,
    activity_logs.target_name,
    activity_logs.target_type,
    activity_logs.timestamp,
    activity_logs.status,
    activity_logs.details,
    activity_logs.ip_address
  FROM activity_logs
  WHERE activity_logs.user_id = p_user_id
    AND activity_logs.timestamp >= CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL
  ORDER BY activity_logs.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 2: fn_get_login_history
-- Retorna histórico de logins de um usuário ⭐
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_login_history(
  p_user_id TEXT,
  p_days_back INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  session_id TEXT,
  login_at TIMESTAMP,
  logout_at TIMESTAMP,
  ip_address TEXT,
  device_name TEXT,
  location TEXT,
  session_duration_minutes INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    login_sessions.id,
    login_sessions.login_at,
    login_sessions.logout_at,
    login_sessions.ip_address,
    login_sessions.device_name,
    login_sessions.location,
    EXTRACT(EPOCH FROM (COALESCE(login_sessions.logout_at, CURRENT_TIMESTAMP) - login_sessions.login_at))::INTEGER / 60 as session_duration_minutes,
    CASE WHEN login_sessions.is_active THEN 'Ativa' ELSE 'Encerrada' END as status
  FROM login_sessions
  WHERE login_sessions.user_id = p_user_id
    AND login_sessions.login_at >= CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL
  ORDER BY login_sessions.login_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 3: fn_log_user_activity
-- Registra uma atividade de usuário
-- =====================================================
CREATE OR REPLACE FUNCTION fn_log_user_activity(
  p_user_id TEXT,
  p_action TEXT,
  p_target_name TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'SUCCESS',
  p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_log_id TEXT;
  v_user_name TEXT;
BEGIN
  -- Get user name
  SELECT name INTO v_user_name FROM users WHERE id = p_user_id;
  
  v_log_id := 'log_' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT || '_' || 
              SUBSTR(MD5(RANDOM()::TEXT), 1, 8);
  
  INSERT INTO activity_logs (
    id, user_id, user_name, action, target_name, target_id, 
    target_type, details, ip_address, status, timestamp, execution_time_ms
  )
  VALUES (
    v_log_id,
    p_user_id,
    COALESCE(v_user_name, 'Unknown'),
    p_action,
    p_target_name,
    p_target_id,
    p_target_type,
    p_details,
    p_ip_address,
    p_status,
    CURRENT_TIMESTAMP,
    p_execution_time_ms
  );
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO 4: fn_record_login ⭐ CRÍTICA
-- Registra um novo login de usuário
-- =====================================================
CREATE OR REPLACE FUNCTION fn_record_login(
  p_user_id TEXT,
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_name TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE(
  session_id TEXT,
  session_token TEXT,
  expires_at TIMESTAMP,
  user_name TEXT,
  user_role TEXT
) AS $$
DECLARE
  v_session_id TEXT;
  v_session_token TEXT;
  v_expires_at TIMESTAMP;
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  v_session_id := 'sess_' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT;
  v_session_token := MD5(p_user_id || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT || RANDOM()::TEXT);
  v_expires_at := CURRENT_TIMESTAMP + INTERVAL '24 hours';
  
  -- Get user info
  SELECT name, role INTO v_user_name, v_user_role FROM users WHERE id = p_user_id;
  
  -- Insert session
  INSERT INTO login_sessions (
    id, user_id, email, ip_address, user_agent, session_token, expires_at, 
    login_at, is_active, device_name, location
  )
  VALUES (
    v_session_id,
    p_user_id,
    p_email,
    p_ip_address,
    p_user_agent,
    v_session_token,
    v_expires_at,
    CURRENT_TIMESTAMP,
    TRUE,
    p_device_name,
    p_location
  );
  
  -- Update last login
  UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = p_user_id;
  
  -- Log activity
  PERFORM fn_log_user_activity(
    p_user_id,
    'LOGIN',
    p_email,
    p_target_id := v_session_id,
    p_target_type := 'session',
    p_ip_address := p_ip_address,
    p_details := p_device_name || ' | ' || p_location
  );
  
  RETURN QUERY
  SELECT v_session_id, v_session_token, v_expires_at, v_user_name, v_user_role;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO 5: fn_record_logout
-- Encerra uma sessão de login
-- =====================================================
CREATE OR REPLACE FUNCTION fn_record_logout(p_session_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Get user ID from session
  SELECT user_id INTO v_user_id FROM login_sessions WHERE id = p_session_id;
  
  -- Update session
  UPDATE login_sessions 
  SET logout_at = CURRENT_TIMESTAMP, is_active = FALSE
  WHERE id = p_session_id;
  
  -- Log activity
  IF v_user_id IS NOT NULL THEN
    PERFORM fn_log_user_activity(
      v_user_id,
      'LOGOUT',
      'Session Ended',
      p_target_id := p_session_id,
      p_target_type := 'session'
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO 6: fn_validate_session
-- Valida se uma sessão é válida
-- =====================================================
CREATE OR REPLACE FUNCTION fn_validate_session(p_session_token TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  expires_at TIMESTAMP
) AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session FROM login_sessions 
  WHERE session_token = p_session_token;
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP;
    RETURN;
  END IF;
  
  IF v_session.is_active = FALSE OR v_session.expires_at < CURRENT_TIMESTAMP THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP;
    RETURN;
  END IF;
  
  RETURN QUERY 
  SELECT 
    TRUE, 
    v_session.user_id,
    u.name,
    u.role,
    v_session.expires_at
  FROM users u
  WHERE u.id = v_session.user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 7: fn_get_dashboard_summary
-- Retorna resumo do dashboard de um usuário ⭐
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_dashboard_summary(p_user_id TEXT)
RETURNS TABLE(
  total_files INTEGER,
  total_folders INTEGER,
  recent_activity_count INTEGER,
  last_activity_at TIMESTAMP,
  active_sessions INTEGER,
  last_login TIMESTAMP,
  total_uploads INTEGER,
  total_downloads INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM file_assets WHERE uploaded_by = p_user_id AND is_deleted = FALSE)::INTEGER,
    (SELECT COUNT(*) FROM folders WHERE owner_id = p_user_id)::INTEGER,
    (SELECT COUNT(*) FROM activity_logs WHERE user_id = p_user_id AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days')::INTEGER,
    (SELECT MAX(timestamp) FROM activity_logs WHERE user_id = p_user_id)::TIMESTAMP,
    (SELECT COUNT(*) FROM login_sessions WHERE user_id = p_user_id AND is_active = TRUE)::INTEGER,
    (SELECT last_login_at FROM users WHERE id = p_user_id)::TIMESTAMP,
    (SELECT COUNT(*) FROM activity_logs WHERE user_id = p_user_id AND action = 'UPLOAD')::INTEGER,
    (SELECT COUNT(*) FROM activity_logs WHERE user_id = p_user_id AND action = 'DOWNLOAD')::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 8: fn_get_accessible_folders
-- Retorna pastas acessíveis para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_accessible_folders(
  p_user_id TEXT,
  p_parent_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  parent_id TEXT,
  access_level TEXT,
  created_at TIMESTAMP,
  file_count INTEGER,
  owner_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.parent_id,
    COALESCE(up.access_level, CASE WHEN (SELECT role FROM users WHERE id = p_user_id) = 'superuser' THEN 'admin' ELSE 'none' END) as access_level,
    f.created_at,
    (SELECT COUNT(*) FROM file_assets WHERE folder_id = f.id AND is_deleted = FALSE)::INTEGER,
    u.name as owner_name
  FROM folders f
  LEFT JOIN user_permissions up ON f.id = up.folder_id AND up.user_id = p_user_id AND up.is_active = TRUE
  LEFT JOIN users u ON f.owner_id = u.id
  WHERE (
    (SELECT role FROM users WHERE id = p_user_id) = 'superuser' OR
    up.access_level IS NOT NULL
  )
  AND f.parent_id IS NOT DISTINCT FROM p_parent_id
  AND f.is_archived = FALSE
  ORDER BY f.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 9: fn_check_folder_permission
-- Verifica permissão de um usuário em uma pasta
-- =====================================================
CREATE OR REPLACE FUNCTION fn_check_folder_permission(
  p_user_id TEXT,
  p_folder_id TEXT,
  p_required_level TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_access_level TEXT;
BEGIN
  -- Superuser tem acesso total
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  IF v_user_role = 'superuser' THEN
    RETURN TRUE;
  END IF;
  
  -- Check explicit permission
  SELECT access_level INTO v_access_level 
  FROM user_permissions 
  WHERE user_id = p_user_id 
    AND folder_id = p_folder_id 
    AND is_active = TRUE
    AND (expiration_date IS NULL OR expiration_date > CURRENT_TIMESTAMP);
  
  IF v_access_level IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if level satisfies requirement
  IF p_required_level = 'write' THEN
    RETURN v_access_level IN ('write', 'admin');
  ELSIF p_required_level = 'admin' THEN
    RETURN v_access_level = 'admin';
  ELSE -- read
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 10: fn_get_activity_stats
-- Retorna estatísticas de atividades
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_activity_stats(
  p_user_id TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  action TEXT,
  action_count INTEGER,
  success_count INTEGER,
  failed_count INTEGER,
  last_performed TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    activity_logs.action,
    COUNT(*)::INTEGER,
    (COUNT(*) FILTER (WHERE activity_logs.status = 'SUCCESS'))::INTEGER,
    (COUNT(*) FILTER (WHERE activity_logs.status = 'FAILED'))::INTEGER,
    MAX(activity_logs.timestamp)
  FROM activity_logs
  WHERE (p_user_id IS NULL OR activity_logs.user_id = p_user_id)
    AND activity_logs.timestamp >= CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL
  GROUP BY activity_logs.action
  ORDER BY action_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 11: fn_get_most_active_users
-- Retorna usuários mais ativos
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_most_active_users(
  p_days_back INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  user_id TEXT,
  user_name TEXT,
  activity_count INTEGER,
  last_activity TIMESTAMP,
  login_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    activity_logs.user_id,
    activity_logs.user_name,
    COUNT(*)::INTEGER as activity_count,
    MAX(activity_logs.timestamp) as last_activity,
    (COUNT(*) FILTER (WHERE activity_logs.action = 'LOGIN'))::INTEGER as login_count
  FROM activity_logs
  WHERE activity_logs.timestamp >= CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL
  GROUP BY activity_logs.user_id, activity_logs.user_name
  ORDER BY activity_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNÇÃO 12: fn_get_file_access_history
-- Retorna histórico de acesso a um arquivo
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_file_access_history(
  p_file_id TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  user_id TEXT,
  user_name TEXT,
  action TEXT,
  timestamp TIMESTAMP,
  ip_address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    activity_logs.user_id,
    activity_logs.user_name,
    activity_logs.action,
    activity_logs.timestamp,
    activity_logs.ip_address
  FROM activity_logs
  WHERE activity_logs.target_id = p_file_id
    AND activity_logs.action IN ('UPLOAD', 'DELETE', 'VIEW', 'DOWNLOAD')
  ORDER BY activity_logs.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FIM DAS FUNCTIONS
-- =====================================================
