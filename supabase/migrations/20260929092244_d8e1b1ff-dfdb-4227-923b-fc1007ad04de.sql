
-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orgs readable by authenticated" ON public.organizations FOR SELECT TO authenticated USING (true);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  organization_name TEXT NOT NULL DEFAULT '',
  organization_id UUID REFERENCES public.organizations(id),
  role TEXT NOT NULL DEFAULT 'Security Analyst',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  risk_score INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  source TEXT,
  actor_user TEXT,
  source_ip TEXT,
  destination TEXT,
  device TEXT,
  category TEXT,
  initial_hypothesis TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX alerts_severity_idx ON public.alerts(severity);
CREATE INDEX alerts_status_idx ON public.alerts(status);
CREATE INDEX alerts_created_idx ON public.alerts(created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts readable by authenticated" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts writable by authenticated" ON public.alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "alerts insertable by authenticated" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);

-- Evidence events
CREATE TABLE public.evidence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  label TEXT NOT NULL,
  detail TEXT,
  event_type TEXT,
  severity TEXT DEFAULT 'info',
  sequence INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX evidence_alert_idx ON public.evidence_events(alert_id, sequence);
GRANT SELECT, INSERT ON public.evidence_events TO authenticated;
GRANT ALL ON public.evidence_events TO service_role;
ALTER TABLE public.evidence_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence readable by authenticated" ON public.evidence_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "evidence insertable by authenticated" ON public.evidence_events FOR INSERT TO authenticated WITH CHECK (true);

-- Investigations
CREATE TABLE public.investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT,
  ai_state TEXT NOT NULL DEFAULT 'idle',
  confidence INT,
  assigned_to UUID,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  hindsight_experience_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX investigations_alert_idx ON public.investigations(alert_id);
CREATE INDEX investigations_status_idx ON public.investigations(status);
GRANT SELECT, INSERT, UPDATE ON public.investigations TO authenticated;
GRANT ALL ON public.investigations TO service_role;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investigations readable by authenticated" ON public.investigations FOR SELECT TO authenticated USING (true);
CREATE POLICY "investigations insertable by authenticated" ON public.investigations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "investigations updatable by authenticated" ON public.investigations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Hypotheses
CREATE TABLE public.hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'initial',
  statement TEXT NOT NULL,
  confidence INT,
  reasoning TEXT,
  source TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX hypotheses_investigation_idx ON public.hypotheses(investigation_id);
GRANT SELECT, INSERT ON public.hypotheses TO authenticated;
GRANT ALL ON public.hypotheses TO service_role;
ALTER TABLE public.hypotheses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hypotheses readable by authenticated" ON public.hypotheses FOR SELECT TO authenticated USING (true);
CREATE POLICY "hypotheses insertable by authenticated" ON public.hypotheses FOR INSERT TO authenticated WITH CHECK (true);

-- Hindsight experiences
CREATE TABLE public.hindsight_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL,
  investigation_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_pattern TEXT[] NOT NULL DEFAULT '{}',
  analyst_decision TEXT,
  outcome TEXT,
  hindsight_remote_id TEXT,
  source_investigation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX hindsight_type_idx ON public.hindsight_experiences(investigation_type);
CREATE INDEX hindsight_created_idx ON public.hindsight_experiences(created_at DESC);
GRANT SELECT, INSERT ON public.hindsight_experiences TO authenticated;
GRANT ALL ON public.hindsight_experiences TO service_role;
ALTER TABLE public.hindsight_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experiences readable by authenticated" ON public.hindsight_experiences FOR SELECT TO authenticated USING (true);
CREATE POLICY "experiences insertable by authenticated" ON public.hindsight_experiences FOR INSERT TO authenticated WITH CHECK (true);

-- Hindsight recalls
CREATE TABLE public.hindsight_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.hindsight_experiences(id) ON DELETE CASCADE,
  similarity NUMERIC(5,2) NOT NULL DEFAULT 0,
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recalls_investigation_idx ON public.hindsight_recalls(investigation_id);
GRANT SELECT, INSERT ON public.hindsight_recalls TO authenticated;
GRANT ALL ON public.hindsight_recalls TO service_role;
ALTER TABLE public.hindsight_recalls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recalls readable by authenticated" ON public.hindsight_recalls FOR SELECT TO authenticated USING (true);
CREATE POLICY "recalls insertable by authenticated" ON public.hindsight_recalls FOR INSERT TO authenticated WITH CHECK (true);

-- Analyst decisions
CREATE TABLE public.analyst_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  analyst_id UUID NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  original_hypothesis TEXT,
  final_hypothesis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX decisions_investigation_idx ON public.analyst_decisions(investigation_id);
GRANT SELECT, INSERT ON public.analyst_decisions TO authenticated;
GRANT ALL ON public.analyst_decisions TO service_role;
ALTER TABLE public.analyst_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decisions readable by authenticated" ON public.analyst_decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "own decision insert" ON public.analyst_decisions FOR INSERT TO authenticated WITH CHECK (auth.uid() = analyst_id);

-- Outcomes
CREATE TABLE public.investigation_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  analyst_id UUID NOT NULL,
  outcome TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX outcomes_investigation_idx ON public.investigation_outcomes(investigation_id);
GRANT SELECT, INSERT ON public.investigation_outcomes TO authenticated;
GRANT ALL ON public.investigation_outcomes TO service_role;
ALTER TABLE public.investigation_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outcomes readable by authenticated" ON public.investigation_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "own outcome insert" ON public.investigation_outcomes FOR INSERT TO authenticated WITH CHECK (auth.uid() = analyst_id);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name TEXT NOT NULL DEFAULT 'System',
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  description TEXT,
  investigation_id UUID REFERENCES public.investigations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit readable by authenticated" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit insertable by authenticated" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============ SEED DATA (synthetic) ============
INSERT INTO public.organizations (id, name, domain) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Northwind Grid Industries', 'northwind-grid.example');

INSERT INTO public.alerts (id, organization_id, ref, title, description, severity, risk_score, status, source, actor_user, source_ip, destination, device, category, initial_hypothesis, metadata, created_at) VALUES
('aaaa1047-0000-4000-8000-000000001047','11111111-1111-1111-1111-111111111111','INC-1047','Authentication Anomaly Followed by PowerShell Execution','Repeated authentication failures against Azure AD followed by a successful sign-in from an unrecognised device and local PowerShell execution.','critical',94,'investigating','Azure AD','john.doe','185.198.42.17','Corporate Identity Service','WIN-7F3A','credential','Possible Brute-Force Attack','{"failed_attempts":47,"successful_login":true,"new_device":true,"powershell":true,"mfa":"MFA Passed","process":"powershell.exe","command":"powershell.exe -ExecutionPolicy Bypass -Command \"Get-Process\""}'::jsonb, now() - interval '2 hours'),
('aaaa1046-0000-4000-8000-000000001046','11111111-1111-1111-1111-111111111111','INC-1046','Suspicious PowerShell Execution','PowerShell spawned by a document editor process on a managed endpoint.','high',87,'open','EDR','alex.morgan','192.0.2.55','Endpoint','WIN-4B91','endpoint','Potential Malicious Script Execution','{"process":"powershell.exe","parent_process":"winword.exe","new_device":false,"powershell":true}'::jsonb, now() - interval '5 hours'),
('aaaa1045-0000-4000-8000-000000001045','11111111-1111-1111-1111-111111111111','INC-1045','Unusual VPN Authentication','VPN authentication from an unexpected network range outside normal working hours.','high',78,'open','VPN Gateway','sam.wilson','203.0.113.42','Corporate VPN','VPN-EDGE-2','authentication','Possible Account Misuse','{"new_device":true,"failed_attempts":3}'::jsonb, now() - interval '9 hours'),
('aaaa1044-0000-4000-8000-000000001044','11111111-1111-1111-1111-111111111111','INC-1044','Impossible Travel Authentication','Two successful authentications from geographically impossible locations within 40 minutes.','medium',68,'open','Azure AD','emma.jones','203.0.113.91','Corporate Identity Service','MAC-22C7','authentication','Potential Account Compromise','{"previous_location":"Bengaluru","current_location":"Singapore","new_device":true}'::jsonb, now() - interval '14 hours');

-- Additional synthetic alerts
INSERT INTO public.alerts (organization_id, ref, title, description, severity, risk_score, status, source, actor_user, source_ip, destination, device, category, initial_hypothesis, created_at)
SELECT '11111111-1111-1111-1111-111111111111',
  'INC-' || (1043 - g)::text,
  (ARRAY['Anomalous Mailbox Rule Created','Excessive Data Transfer to External Host','Privileged Group Membership Change','Disabled Endpoint Protection','Repeated MFA Push Requests','Suspicious Service Installation','Unusual Admin Console Access','Legacy Protocol Authentication'])[1 + (g % 8)],
  'Synthetic telemetry generated for demonstration of the adaptive investigation workflow.',
  (ARRAY['critical','high','medium','low','medium','high','low','medium'])[1 + (g % 8)],
  40 + ((g * 7) % 55),
  (ARRAY['open','open','triaged','investigating','open','closed'])[1 + (g % 6)],
  (ARRAY['Azure AD','EDR','VPN Gateway','Cloud DLP','SIEM Correlation'])[1 + (g % 5)],
  (ARRAY['priya.nair','liam.carter','maya.rossi','tom.baker','nina.petrov','omar.haddad'])[1 + (g % 6)],
  '192.0.2.' || (10 + g)::text,
  'Corporate Identity Service',
  'WIN-' || upper(substr(md5(g::text), 1, 4)),
  (ARRAY['credential','endpoint','authentication','exfiltration'])[1 + (g % 4)],
  (ARRAY['Possible Policy Violation','Potential Insider Activity','Possible Account Misuse','Potential Malware Activity'])[1 + (g % 4)],
  now() - ((g + 1) * interval '7 hours')
FROM generate_series(0, 21) AS g;

-- Evidence for INC-1047
INSERT INTO public.evidence_events (alert_id, occurred_at, label, detail, event_type, severity, sequence) VALUES
('aaaa1047-0000-4000-8000-000000001047', (current_date + time '10:42:01'), '47 FAILED LOGIN ATTEMPTS', 'Consecutive failed authentications against Azure AD for john.doe from 185.198.42.17', 'authentication', 'high', 1),
('aaaa1047-0000-4000-8000-000000001047', (current_date + time '10:43:17'), 'SUCCESSFUL LOGIN', 'Successful authentication for john.doe, MFA passed', 'authentication', 'critical', 2),
('aaaa1047-0000-4000-8000-000000001047', (current_date + time '10:43:21'), 'NEW DEVICE DETECTED', 'Device WIN-7F3A not previously associated with this identity', 'device', 'high', 3),
('aaaa1047-0000-4000-8000-000000001047', (current_date + time '10:44:02'), 'POWERSHELL EXECUTION', 'powershell.exe -ExecutionPolicy Bypass -Command "Get-Process" (simulated telemetry, not executed)', 'process', 'critical', 4);

INSERT INTO public.evidence_events (alert_id, occurred_at, label, detail, event_type, severity, sequence) VALUES
('aaaa1046-0000-4000-8000-000000001046', (current_date + time '08:11:40'), 'DOCUMENT OPENED', 'winword.exe opened Q3-Budget-Review.docm', 'process', 'info', 1),
('aaaa1046-0000-4000-8000-000000001046', (current_date + time '08:12:02'), 'CHILD PROCESS SPAWNED', 'winword.exe spawned powershell.exe', 'process', 'high', 2),
('aaaa1046-0000-4000-8000-000000001046', (current_date + time '08:12:09'), 'OUTBOUND CONNECTION', 'Connection attempt to 192.0.2.201:443', 'network', 'high', 3),
('aaaa1045-0000-4000-8000-000000001045', (current_date + time '02:31:12'), 'VPN AUTHENTICATION', 'Successful VPN authentication for sam.wilson from 203.0.113.42', 'authentication', 'medium', 1),
('aaaa1045-0000-4000-8000-000000001045', (current_date + time '02:33:47'), 'INTERNAL SCAN ACTIVITY', 'Sequential connections to 18 internal hosts', 'network', 'high', 2),
('aaaa1044-0000-4000-8000-000000001044', (current_date + time '05:02:10'), 'AUTHENTICATION - BENGALURU', 'Successful sign-in from Bengaluru', 'authentication', 'info', 1),
('aaaa1044-0000-4000-8000-000000001044', (current_date + time '05:41:55'), 'AUTHENTICATION - SINGAPORE', 'Successful sign-in from Singapore, 40 minutes later', 'authentication', 'high', 2);

-- Historical organizational memory
INSERT INTO public.hindsight_experiences (id, ref, investigation_type, summary, evidence_pattern, analyst_decision, outcome, created_at) VALUES
('bbbb0892-0000-4000-8000-000000000892','INC-0892','Credential Compromise','Repeated authentication failures followed by a successful login from a new device and PowerShell activity. Confirmed as credential compromise after password spray from a hosting provider range.', ARRAY['New device','Failed authentication','PowerShell activity'], 'confirmed', 'Credentials reset', now() - interval '61 days'),
('bbbb0764-0000-4000-8000-000000000764','INC-0764','Brute Force + PowerShell','Brute-force attempt against a service account followed by script execution on the endpoint. Confirmed and contained.', ARRAY['Failed authentication','PowerShell activity','Service account'], 'confirmed', 'Account isolated', now() - interval '97 days'),
('bbbb0611-0000-4000-8000-000000000611','INC-0611','Compromised Endpoint','Endpoint showed script execution after a phishing document was opened. Confirmed compromise, endpoint quarantined.', ARRAY['PowerShell activity','Parent process winword.exe','Outbound connection'], 'confirmed', 'Endpoint quarantined', now() - interval '132 days');

INSERT INTO public.hindsight_experiences (ref, investigation_type, summary, evidence_pattern, analyst_decision, outcome, created_at)
SELECT 'INC-' || (600 + g)::text,
  (ARRAY['Credential Compromise','Compromised Endpoint','Authentication Anomaly','Data Exfiltration','Insider Misuse'])[1 + (g % 5)],
  'Historical investigation experience retained by the SOC team covering ' || (ARRAY['identity abuse','endpoint compromise','authentication anomalies','data movement','policy misuse'])[1 + (g % 5)] || ' patterns.',
  (CASE (g % 5)
     WHEN 0 THEN ARRAY['New device','Failed authentication']
     WHEN 1 THEN ARRAY['PowerShell activity','Outbound connection']
     WHEN 2 THEN ARRAY['Impossible travel','MFA fatigue']
     WHEN 3 THEN ARRAY['Large upload','External host']
     ELSE ARRAY['Privileged access','Off-hours activity']
   END),
  (ARRAY['confirmed','confirmed','rejected','modified'])[1 + (g % 4)],
  (ARRAY['Credentials reset','Endpoint quarantined','False positive','Escalated to incident response','Account isolated'])[1 + (g % 5)],
  now() - ((g + 4) * interval '5 days')
FROM generate_series(1, 33) AS g;

-- Investigations
INSERT INTO public.investigations (id, alert_id, ref, status, category, ai_state, opened_at) VALUES
('cccc1047-0000-4000-8000-000000001047','aaaa1047-0000-4000-8000-000000001047','INC-1047','open','credential','idle', now() - interval '1 hour');

INSERT INTO public.hypotheses (investigation_id, stage, statement, confidence, source)
VALUES ('cccc1047-0000-4000-8000-000000001047','initial','Possible Brute-Force Attack', 62, 'system');

INSERT INTO public.investigations (alert_id, ref, status, category, ai_state, opened_at)
SELECT a.id, a.ref, 'open', a.category, 'idle', a.created_at + interval '20 minutes'
FROM public.alerts a
WHERE a.status = 'investigating' AND a.ref <> 'INC-1047';

INSERT INTO public.audit_logs (actor_name, action, entity, description, created_at) VALUES
('System','ALERT_CREATED','INC-1047','Critical alert ingested from Azure AD correlation', now() - interval '2 hours'),
('System','ALERT_CREATED','INC-1046','High severity alert ingested from EDR', now() - interval '5 hours'),
('System','INVESTIGATION_CREATED','INC-1047','Investigation opened for INC-1047', now() - interval '1 hour');
