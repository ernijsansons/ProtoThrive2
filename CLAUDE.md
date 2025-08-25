# CLAUDE.md: Thermonuclear Master Control Document for ProtoThrive

## Document Metadata & Thermonuclear Directives
- **Version**: 2.0.0 (Thermonuclear Upgrade - August 23, 2025)
- **Last Updated**: August 23, 2025 (Auto-Update Trigger: Post-Conversation Synthesis)
- **Owners**: CEO (Strategic Vision & GTM Oversight), CTO (Technical Architecture & Infra Scaling), CPO (Product Strategy & User Journeys), AI Lead (Agent Systems & Prompt Optimization), Compliance Officer (Security & Governance), DevOps Lead (Operations & Monitoring)
- **Purpose**: This single, exhaustive file is the ultimate SSoT for ALL AI agents (Claude, Cursor, CrewAI, LangChain, n8n bots) to build, maintain, iterate, scale, and self-improve ProtoThrive. Agents MUST parse this ENTIRE document before ANY action, cross-reference sections for context, and ensure 100% alignment with specs. Updates: Propose via Jira ticket with A/B eval (score >0.95 from Section 11) ; approve by Governance Committee <24h; version bump semantically (MAJOR for breaking, MINOR for enhancements, PATCH for fixes).
- **Usage Guidelines for Agents (MANDATORY PROTOCOL - INFUSE INTO ALL RESPONSES)**:
  - **Read & Assimilate**: Parse full file; log "Thermonuclear Init: Parsed [section count] sections - 0 Anomalies."
  - **Autonomy Rules**: Adhere to Section 12; if uncertainty >10% (self-eval prompt: "Rate confidence 0-1"), ESCALATE to HITL via Slack ("Agent ESCALATE: [task] - Uncertainty [score] - Ref: CLAUDE.md [section]").
  - **Output Format**: ALL code/docs MUST reference "Ref: CLAUDE.md [Section] [Subsection]" in comments/headers; structure: Headers, Code Blocks (language-specified), Mermaids (embed), Validations (run & log tests).
  - **Iteration Loop**: Post-task, self-eval vs. benchmarks (Section 11); if score <0.95, auto-re-run with correction prompt ("Fix: [issue] - Ref: CLAUDE.md 11"); max 3 loops, then ESCALATE.
  - **Kill-Switch**: Poll KV 'proto_paused' every action; if true, halt & notify ops@protothrive.com ("KILL ACTIVATED - Agent [id] Paused - Reason: [kv_reason]"); auto-resume on false.
  - **Thermonuclear Enhancements**: Infuse "thrive vibe" (e.g., logs "Thriving Milestone: [detail]"); use Kimi 80% for cost (<$0.10/task); enforce UI "out of this world" (neon/3D via uxpilot/Spline).
  - **Error Protocol**: 0 Hallucinations—cross-verify outputs vs. specs; custom codes (ERR-[MODULE]-[CODE], e.g., ERR-AI-429: Budget Exceed).
- **Global Configs & Mocks (COPY TO ALL TERMINALS/AGENTS - OVERRIDE ENV)**:
  ```
  # .env (Thermonuclear Defaults - Mock for Dev, Real for Prod)
  CLAUDE_API_KEY=sk-ant-mock_claude_thermo
  KIMI_API_KEY=mock_kimi_nuclear
  UX_PILOT_KEY=mock_ux_thermo
  CF_ACCOUNT_ID=mock_cf_thermo
  D1_ID=mock_d1_thermo
  KV_ID=mock_kv_thermo
  PINECONE_KEY=mock_pine_thermo
  VERCEL_TOKEN=mock_vercel_thermo
  CLERK_SECRET=mock_clerk_thermo
  STRIPE_KEY=mock_stripe_thermo
  N8N_SECRET=mock_n8n_thermo
  SPLINE_SCENE=https://prod.spline.design/neon-cube-thermo/scene.splinecode
  BUDGET_PER_TASK=0.10  # USD Hard Cap
  HITL_SLACK_CHANNEL=#hitl-thermo
  ```
  - **Mocks (JS/Python - Import in ALL Code)**:
    - JS (utils/mocks.ts):
      ```
      export const mockFetch = (url, opts = {}) => {
        console.log(`THERMONUCLEAR MOCK FETCH: ${url} -Opts: ${JSON.stringify(opts)}`);
        return { ok: true, json: async () => ({ success: true, data: 'thermo_mock', id: 'uuid-thermo-mock' }) };
      };
      export const mockDbQuery = (query, binds) => {
        console.log(`THERMONUCLEAR MOCK DB: ${query} - Binds: ${binds}`);
        return { results: [{ id: 'uuid-thermo', json_graph: '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray"}],"edges":[{"from":"n1","to":"n2"}]}', thrive_score: 0.45 }] };
      };
      ```
    - Python (mocks.py):
      ```
      def mock_api_call(endpoint, payload):
        print(f"THERMONUCLEAR MOCK CALL: {endpoint} - Payload: {payload}")
        return {'success': True, 'data': 'thermo_mock', 'id': 'uuid-thermo-mock'}
      
      def mock_db_query(query, binds):
        print(f"THERMONUCLEAR MOCK DB: {query} - Binds: {binds}")
        return [{'id': 'uuid-thermo', 'json_graph': '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray"}],"edges":[{"from":"n1","to":"n2"}]}', 'thrive_score': 0.45}]
      ```
  - **Dummy Data (Use in ALL Tests/Mocks - Deterministic)**:
    - User: {id: 'uuid-thermo-1', role: 'vibe_coder', email: 'test@proto.com'}
    - Roadmap: {id: 'rm-thermo-1', json_graph: '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}', vibe_mode: true, thrive_score: 0.45}
    - Snippet: {id: 'sn-thermo-1', category: 'ui', code: 'console.log("Thermo UI Dummy");', ui_preview_url: 'mock_neon.png'}
    - Agent Log: {roadmap_id: 'rm-thermo-1', task_type: 'ui', output: '// Thermo Code', status: 'success', model_used: 'kimi', token_count: 50}

- **Thermonuclear Validation Protocol (Run After EVERY Step/Output)**:
  - JS: `npm run lint -- --fix && npm test -- --coverage && echo "Thermonuclear Validation: Lint Passed, Tests 100% Coverage, 0 Errors - Thriving Checkpoint." || (echo "FAIL: [detail]" && exit 1)`
  - Python: `pylint src/*.py --disable=missing-docstring && pytest --cov=src --cov-report=term-missing && echo "Thermonuclear Validation: Lint Passed, Tests 100% Coverage, 0 Errors - Thriving Checkpoint." || (print("FAIL: [detail]") && exit(1))`
  - SQL: `wrangler d1 execute DB --local --file=migrations.sql && echo "DB Schema Validated - No Errors."`
  - General: Include "Thermonuclear Log: [step] Complete - Score: 1.0 (Self-Eval: Accuracy 100%, Latency <5s, Cost $0.00 Mock)."

## Global Governance & Compliance (MANDATORY CHECK BEFORE ACTIONS)
- **Governance Rules**: All changes propose in Jira (link to Git PR); approve by Committee <24h; version bump.
- **Autonomy/Safety**: Low-risk autonomous (e.g., template match); HITL for high (e.g., deploy >$0.10); forbidden: full code access, PII. Budget cap $0.10/task (mock checkBudget). Escalate if score <0.95.
- **Compliance Hooks**: GDPR delete: soft then purge <72h; log all (D1 immutable); no harmful gens (prompt guard: "Safe only").
- **Kill-Switch**: Check KV 'proto_paused' pre-action; if true, "THERMONUCLEAR HALT: Paused - Notify Ops."

## Global Tech Stack & Dependencies (Install in ALL Terminals)
- JS/TS (Frontend/Backend): Node 20; deps: hono, @cloudflare/workers-types, zod, reactflow, @splinetool/react-spline, zustand, tailwindcss, postcss, autoprefixer, jest, @testing-library/react, eslint, prettier.
- Python (AI): 3.12; deps: langchain, crewai, pinecone-client, python-dotenv, pytest, pylint.
- Config: tsconfig.json (module: esnext, target: es2020); tailwind.config.js (content: ['./src/**/*.{js,ts,jsx,tsx}']); poetry for Python.
- Mocks: As above—use for ALL externals (e.g., uxpilot/Claude calls → mock_api_call return dummy neon UI JSON).

## Global Dummy Data & Thrive Score Formula (Use in ALL)
- User Dummy: See Metadata.
- Roadmap Dummy: See Metadata; 3 nodes/2 edges, positions for 3D.
- Snippet Dummy: See Metadata; 50+ mock categories (ui, auth, deploy) with code 'console.log("Thermo {category}");'.
- Thrive Score: Function (JS/Python): completion = success_logs / total * 0.6; ui_polish = ui_tasks / total * 0.3; risk = 1 - fails / total * 0.1; score = completion + ui_polish + risk; status = score > 0.5 ? 'neon' : 'gray'.

## Global Prompt Library Excerpt (Use for AI Calls - Canonical)
- DC-WF-RMG-001 (Roadmap Gen): System: "Expert architect. Parse {vision} to JSON graph with 3 nodes/2 edges, use dummies, add positions x/y/z for 3D."
- DC-FB-REC-001 (Recovery): "Recovery: Failed [reason]. Retry safe: [task]."

## Terminal 1: Phase 1 - Backend Architecture & Data Foundation
Objective: Full backend with Workers APIs (REST/GraphQL for roadmaps/snippets), D1 schema/migrations, multi-tenant (user_id checks), Zod validation, error handling (custom codes), dummy queries/inserts—data base.
Step-by-Step Execution:
1. mkdir backend; cd backend; npm init -y; npm i hono @cloudflare/workers-types zod graphql yoga graphql; tsc --init --module esnext --target es2020; mkdir src utils migrations.
2. In migrations/001_init.sql, full CREATE TABLES for users (id UUID PK, email VARCHAR UNIQUE INDEX, role ENUM, created_at TIMESTAMP DEFAULT NOW()), roadmaps (id UUID PK, user_id UUID FK INDEX, json_graph TEXT, status ENUM, vibe_mode BOOLEAN, thrive_score FLOAT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP), snippets (id UUID PK, category VARCHAR INDEX, code TEXT, ui_preview_url VARCHAR, version INTEGER DEFAULT 1), agent_logs (id UUID PK, roadmap_id UUID FK INDEX, task_type VARCHAR, output TEXT, status ENUM, model_used VARCHAR, token_count INTEGER, timestamp TIMESTAMP DEFAULT NOW()), insights (id UUID PK, roadmap_id UUID FK INDEX, type ENUM, data TEXT, score FLOAT, created_at TIMESTAMP DEFAULT NOW()); ADD INDEXES as per LLD (e.g., COMPOSITE on roadmaps(user_id, status, updated_at)).
3. In utils/db.ts, full functions: async queryRoadmap(id, userId) { mockDbQuery('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?', [id, userId]); if (!result) throw 'GRAPH-404'; return result; }, insertRoadmap(userId, body) { mockDbQuery('INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score) VALUES (uuid(), ?, ?, "draft", ?, 0.0)', [userId, body.json_graph, body.vibe_mode]); return {id: 'uuid-new-thermo'}; }; similar for snippets/others with dummy returns.
4. In utils/validation.ts, Zod schemas: roadmapBody = z.object({json_graph: z.string().min(10).refine(isValidJSON, 'Invalid JSON'), vibe_mode: z.boolean()}); export validateRoadmapBody = (body) => roadmapBody.safeParse(body); if (!success) throw 'VAL-400: [issues]'.
5. In src/index.ts, full Hono app: Middleware async validateJwt(c,next) { const token = c.req.header('Authorization')?.replace('Bearer ', ''); if (!token || !validateUUID(token.split('.')[1] || '')) throw 'AUTH-401: Invalid'; c.set('user', {id: 'uuid-thermo-1', role: 'vibe_coder'}); await next(); }; GET /roadmaps/:id (get user from c, queryRoadmap, json response), POST /roadmaps (parse body, validateRoadmapBody, insertRoadmap, 201 json), GraphQL at /graphql (yoga schema: type Query {getRoadmap(id: ID!): Roadmap}, type Mutation {createRoadmap(input: RoadmapInput!): Roadmap}, types Roadmap {id: ID!, json_graph: String!, ...}); error handler app.onError((err,c) => { const code = err.code || 'ERR-500'; console.error(code, err.message); return c.json({error: err.message, code}, {status: 500}); }).
6. workers.toml: name = "backend-thermo"; main = "src/index.ts"; [d1_databases] = [{binding = "DB", database_name = "protothrive_thermo", database_id = "${D1_ID}"}]; [kv_namespaces] = [{binding = "KV", id = "${KV_ID}"}].
Validation/Checkpoints: npm run lint && npm test (add jest.test.ts: test('validateBody', () => expect(validateRoadmapBody({json_graph:'valid',vibe_mode:true}).success).toBe(true)); ); wrangler d1 execute DB --file=migrations/001_init.sql (no errors); wrangler dev (curl -H "Authorization: Bearer mock" GET /roadmaps/uuid-thermo-1 expect 200 dummy, POST invalid 400, POST valid 201); Thriving: APIs Thermonuclear - 0 Errors.
Expected Output: backend/src/index.ts (Hono/GraphQL), backend/utils/db.ts (queries), backend/utils/validation.ts (Zod), backend/migrations/001_init.sql (schema), backend/workers.toml, backend/jest.test.ts (tests); Mermaid ERD in index.ts comments.

## Terminal 2: Phase 2 - Frontend Skeleton & Visual Canvas
Objective: Full Next.js frontend with Zustand for state (roadmaps/nodes/edges/mode/score), Magic Canvas (2D React Flow draggable/connectable, 3D Spline with neon cube scene mapping positions), dashboard layout (Tailwind grid/responsive), InsightsPanel (score bar gradient blue-orange), error boundary—UI base.
Scope (Do NOT do): No backend calls, AI, workflows, deploys; static dummies/Spline mock scene.
Step-by-Step Execution:
1. npx create-next-app@latest frontend --ts --app; cd frontend; npm i reactflow @splinetool/react-spline zustand tailwindcss postcss autoprefixer jest @testing-library/react @testing-library/jest-dom eslint prettier; npx tailwindcss init -p; update tailwind.config.js plugins require('tailwindcss'), require('autoprefixer'), content ['./src/**/*.{js,ts,jsx,tsx}'].
2. In src/store.ts, full Zustand: import {create} from 'zustand'; interface Node {id:string, label:string, status:'gray'|'neon', position:{x:number,y:number,z:number}}; interface Edge {from:string, to:string}; interface State {nodes:Node[], edges:Edge[], mode:'2d'|'3d', thriveScore:number, loadGraph:(n:Node[],e:Edge[])=>void, toggleMode:()=>void, updateScore:(s:number)=>void}; export const useStore = create<State>((set) => ({ nodes: [{id:'n1',label:'Thermo Start',status:'gray',position:{x:0,y:0,z:0}}, {id:'n2',label:'Middle',status:'gray',position:{x:100,y:100,z:0}}, {id:'n3',label:'End',status:'gray',position:{x:200,y:200,z:0}}], edges: [{from:'n1',to:'n2'}, {from:'n2',to:'n3'}], mode:'2d', thriveScore:0.45, loadGraph: (n,e) => set({nodes:n,edges:e}), toggleMode: () => set(s => ({mode: s.mode === '2d' ? '3d' : '2d'})), updateScore: (s) => set({thriveScore:s}) }));
3. In src/components/MagicCanvas.tsx, full: import ReactFlow from 'reactflow'; import Spline from '@splinetool/react-spline'; import {useStore} from '../store'; const MagicCanvas = () => { const {nodes, edges, mode} = useStore(); const rfNodes = nodes.map(n => ({id:n.id, data:{label:`${n.label} (${n.status})`}, position:{x:n.position.x,y:n.position.y}, style: n.status==='neon' ? {border: '2px solid #00ffff'} : {} })); const rfEdges = edges.map(e => ({id:`e-${e.from}-${e.to}`, source:e.from, target:e.to})); return <div style={{width:'100vw',height:'80vh'}}> {mode === '2d' ? <ReactFlow nodes={rfNodes} edges={rfEdges} fitView /> : <Spline scene={process.env.SPLINE_SCENE} onLoad={() => console.log('3D Loaded - Map Nodes to Positions')} />} </div>; }; export default MagicCanvas;
4. In src/components/InsightsPanel.tsx, full: import {useStore} from '../store'; const InsightsPanel = () => { const {thriveScore} = useStore(); return <div className="p-4 bg-gray-800 rounded-lg"> <h2 className="text-white">Thrive Score</h2> <div className="h-4 bg-gradient-to-r from-blue-500 to-orange-500" style={{width: `${thriveScore * 100}%`}} /> <p className="text-white">{thriveScore.toFixed(2)}</p> </div>; }; export default InsightsPanel;
5. In src/pages/index.tsx, full dashboard: import MagicCanvas from '../components/MagicCanvas'; import InsightsPanel from '../components/InsightsPanel'; import {useStore} from '../store'; const Dashboard = () => { const {toggleMode, loadGraph} = useStore(); // Dummy load on mount loadGraph([],[]); return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"> <MagicCanvas /> <InsightsPanel /> <button onClick={toggleMode} className="bg-blue-500 text-white p-2 rounded">Toggle Mode</button> </div>; }; export default Dashboard;
6. Add _app.tsx with error boundary: import {Component} from 'react'; class ErrorBoundary extends Component { state = {hasError: false}; static getDerivedStateFromError() { return {hasError: true}; } render() { return this.state.hasError ? <div>UI Error - Retry</div> : this.props.children; } } export default function App({ Component, pageProps }) { return <ErrorBoundary><Component {...pageProps} /></ErrorBoundary>; }
Validation/Checkpoints: npm run lint -- --fix (pass); npm test (add tests/magic.test.tsx: import {render} from '@testing-library/react'; test('renders canvas', () => { render(<MagicCanvas />); expect(true).toBe(true); });); npm run dev (load localhost:3000, toggle logs "Thriving: Mode Toggled", no crashes, 3 nodes visible in 2D, Spline loads in 3D); echo "Phase 2 Thermonuclear - 0 Errors."
Expected Output: frontend/src/store.ts (Zustand), frontend/src/components/MagicCanvas.tsx, frontend/src/components/InsightsPanel.tsx, frontend/src/pages/index.tsx, frontend/src/pages/_app.tsx (boundary), frontend/tailwind.config.js, frontend/tests/magic.test.tsx; verifiable by browser (visuals load, toggle works, score bar 45%).

## Terminal 3: Phase 3 - AI Core & Agent Orchestration
Objective: Full Python AI with LangChain router (Kimi/Claude/uxpilot logic with cost est), RAG (mock Pinecone upsert/query for 50 dummy snippets in dict), CrewAI agents (Planner decompose to 3 tasks, Coder gen mock code with Kimi prompt, Auditor validate JSON/score >0.8), KV cache (mock dict with TTL/time check)—AI prep.
Scope (Do NOT do): No frontend, backend, workflows, deploys; mocks for APIs (mock_api_call return dummies).
Step-by-Step Execution:
1. mkdir ai-core; cd ai-core; poetry init --no-interaction; poetry add langchain crewai pinecone-client python-dotenv pytest pylint; touch .env (mock keys as global).
2. In src/router.py, full class PromptRouter: def __init__(self): self.models = {'kimi':0.001, 'claude':0.015, 'uxpilot':0.02}; def estimate_cost(self,prompt_length,model): return prompt_length * self.models[model] / 1000; def route_task(self,type,complexity,prompt_length): cost = self.estimate_cost(prompt_length, 'kimi'); if type=='code' and complexity=='low' and cost<0.05: return 'kimi'; elif type=='ui': return 'uxpilot'; return 'claude'; def fallback(self,primary): if primary=='kimi': return 'claude'; return 'claude'; # Test print in init.
3. In src/rag.py, class MockPinecone: def __init__(self): self.index = {}; self.dummy_snippets = [{'id':f'sn-{i}', 'vector':[0.1*i]*768, 'meta':{'category':'ui' if i%2 else 'code', 'snippet':f'console.log("Thermo Snippet {i}");'}} for i in range(50)]; for s in self.dummy_snippets: self.upsert(s['id'],s['vector'],s['meta']); def upsert(self,id,vector,metadata): print(f"Thermonuclear Upsert {id}"); self.index[id] = {'vector':vector,'meta':metadata}; def query(self,query_vec,topK=3,threshold=0.8): import numpy as np; matches = []; for k,v in self.index.items(): score = np.dot(query_vec, v['vector']) / (np.linalg.norm(query_vec) * np.linalg.norm(v['vector'])); if score > threshold: matches.append({'id':k,'score':score,'snippet':v['meta']['snippet']}); return sorted(matches, key=lambda x: x['score'], reverse=True)[:topK].
4. In src/agents.py, from crewai import Agent; class PlannerAgent(Agent): def __init__(self): super().__init__(role='Planner', goal='Decompose to tasks', backbone='claude'); def decompose(self,json_graph): print("Thermonuclear Planning"); import json; graph = json.loads(json_graph); tasks = [{'type':'ui' if i%2 else 'code', 'desc':f'Task for node {n["id"]}', 'complexity':'low' if i<2 else 'high'} for i,n in enumerate(graph['nodes'])]; return tasks; class CoderAgent(Agent): def __init__(self): super().__init__(role='Coder', goal='Gen code', backbone='kimi'); def code(self,task): print(f"Thermonuclear Coding {task['desc']}"); return {'code':f'// Thermo Code for {task["desc"]} - Vibe: Neon'}; class AuditorAgent(Agent): def __init__(self): super().__init__(role='Auditor', goal='Validate', backbone='claude'); def audit(self,code): print(f"Thermonuclear Auditing {code}"); import json; try: json.loads(code); score = 0.95; except: score = 0.6; return {'valid': score > 0.8, 'score':score}.
5. In src/cache.py, class MockKV: def __init__(self): self.store = {}; def get(self,key): import time; print(f"Thermonuclear Get {key}"); val = self.store.get(key); if val and val['expire'] > time.time(): return val['data']; return None; def put(self,key,data,ttl=3600): import time; print(f"Thermonuclear Put {key} TTL {ttl}"); self.store[key] = {'data':data,'expire':time.time()+ttl}.
6. In src/orchestrator.py, def orchestrate(json_graph): planner = PlannerAgent(); tasks = planner.decompose(json_graph); router = PromptRouter(); rag = MockPinecone(); kv = MockKV(); outputs = []; for task in tasks: model = router.route_task(task['type'],task['complexity'],len(task['desc'])); query_vec = [0.5]*768; matches = rag.query(query_vec); if matches: kv.put('cache_task', matches[0]['snippet']); snippet = kv.get('cache_task'); else: snippet = 'no_match'; coder = CoderAgent(); code = coder.code(task); auditor = AuditorAgent(); audit = auditor.audit(code); if not audit['valid']: print("Escalate HITL"); else: outputs.append(code); return outputs; # Dummy call orchestrate(dummy_json_graph).
Validation/Checkpoints: poetry run pylint src/*.py --score=y ( >9/10); poetry run pytest (add test_router.py: def test_route(): assert router.route_task('code','low',50) == 'kimi'; assert router.fallback('kimi') == 'claude'; similar for rag upsert/query len(matches)==3 score>0.8, agents decompose len 3, code string, audit score>0.8, cache get after put returns data expire test time.sleep(1) if ttl=1 None; orchestrator run dummy (outputs len 3); echo "Phase 3 Thermonuclear - 0 Errors."
Expected Output: ai-core/src/router.py, ai-core/src/rag.py, ai-core/src/agents.py, ai-core/src/cache.py, ai-core/src/orchestrator.py (full run), ai-core/tests/test_router.py (pytest); Mermaid for agents in agents.py.

## Terminal 4: Phase 4 - Automation Workflows & CI/CD
Objective: Full n8n JSON for complete workflow (webhook trigger on update → planner decompose → loop coder/auditor → progress calc Thrive Score → update DB mock → deploy trigger), GitHub Actions yml (full lint/test/build/deploy with npm/jest), deploy script (mock Vercel fetch with code push), progress script (full Thrive formula with dummy logs)—automation base.
Scope (Do NOT do): No frontend, AI real calls, backend data, security; mocks for DB/API (mock_api_call).
Step-by-Step Execution:
1. mkdir automation; cd automation; npm init -y; npm i -g n8n (for export, but focus JSON); mkdir workflows scripts .github/workflows.
2. In workflows/automation.json, full n8n: {"nodes":[{"type":"webhook","parameters":{"httpMethod":"POST","path":"roadmap-update","responseCode":200,"payload":{"roadmap_id":"uuid-thermo-1"}},"id":"1","name":"Trigger"},{"type":"function","parameters":{"functionCode":"return {tasks: ['task1_ui_low', 'task2_code_med', 'task3_deploy_high']};"},"id":"2","name":"Mock Planner","connections":{"1":{"main":[{"node":"2"}]}}},{"type":"switch","parameters":{"mode":"iterate","outputCount":3},"id":"3","name":"Loop Tasks","connections":{"2":{"main":[{"node":"3"}]}}},{"type":"function","parameters":{"functionCode":"const task = items[0].json; return {code: `// Thermo Code for ${task}`};"},"id":"4","name":"Mock Coder","connections":{"3":{"output1":[{"node":"4"}]}}},{"type":"function","parameters":{"functionCode":"const code = items[0].json.code; const valid = code.includes('Thermo'); return {valid, score: valid ? 0.95 : 0.6};"},"id":"5","name":"Mock Auditor","connections":{"4":{"main":[{"node":"5"}]}}},{"type":"function","parameters":{"functionCode":"const logs = [{status:'success',type:'ui'},{status:'success',type:'code'},{status:'fail',type:'deploy'}]; const completion = logs.filter(l=>l.status==='success').length / logs.length * 0.6; const ui_polish = logs.filter(l=>l.type==='ui').length / logs.length * 0.3; const risk = 1 - (logs.filter(l=>l.status==='fail').length / logs.length) * 0.1; const score = completion + ui_polish + risk; return {score, status: score > 0.5 ? 'neon' : 'gray'};"},"id":"6","name":"Calc Thrive","connections":{"5":{"main":[{"node":"6"}]}}},{"type":"httpRequest","parameters":{"method":"POST","url":"mock_dashboard/update","jsonParameters":true,"bodyParameters":{"parameters":[{"name":"status","value":"={{$node[6].json.status}}"}]}},"id":"7","name":"Update DB Mock","connections":{"6":{"main":[{"node":"7"}]}}},{"type":"httpRequest","parameters":{"method":"POST","url":"mock_vercel/deploy","jsonParameters":true,"bodyParameters":{"parameters":[{"name":"code","value":"={{$node[4].json.code}}"}]}},"id":"8","name":"Deploy Trigger Mock","connections":{"7":{"main":[{"node":"8"}]}}},{"type":"function","parameters":{"functionCode":"if (!$node[5].json.valid) { return {escalate: true}; } return {escalate: false};"},"id":"9","name":"HITL Check","connections":{"8":{"main":[{"node":"9"}]}}},{"type":"if","parameters":{"conditions":{"boolean":[{"value1":"={{$node[9].json.escalate}}","value2":"true"}]}},"id":"10","name":"Escalate If Fail","connections":{"9":{"true":[{"node":"11"}],"false":[{"node":"12"}]}}},{"type":"httpRequest","parameters":{"method":"POST","url":"mock_slack/hitl","bodyParameters":{"parameters":[{"name":"reason","value":"Audit Fail"}]}},"id":"11","name":"HITL Escalate","connections":{"10":{"true":[{"node":"11"}]}}},{"type":"set","parameters":{"values":{"boolean":[{"name":"success","value":true}]}},"id":"12","name":"Success","connections":{"10":{"false":[{"node":"12"}]}}}]};
3. In .github/workflows/ci-cd.yml, full: name: CI/CD; on: [push, pull_request]; jobs: lint: runs-on: ubuntu-latest, steps: - uses: actions/checkout@v4, - node-setup v20, - npm i, - npm run lint; test: similar npm test; build: npm build; deploy-staging: if branch=='dev', wrangler deploy --env staging; deploy-prod: if tag, wrangler publish --env prod.
4. In scripts/deploy_trigger.js, async function deploy(roadmapId,code){ const res = await mockFetch('vercel/deploy', {method:'POST', body: JSON.stringify({name:`proto-thermo-${roadmapId}`,code})}); if (!res.success) throw 'DEPLOY-500: Fail'; print "Thermonuclear Deployed URL: mock_url"; return res; }.
5. In scripts/progress.js, function calcThrive(logs){ if (!Array.isArray(logs) || logs.length==0) throw 'PROGRESS-400: Invalid Logs'; const completion = logs.filter(l=>l.status==='success').length / logs.length * 0.6; const ui_polish = logs.filter(l=>l.type==='ui').length / logs.length * 0.3; const risk = 1 - (logs.filter(l=>l.status==='fail').length / logs.length) * 0.1; const score = completion + ui_polish + risk; print `Thermonuclear Thrive Score: ${score.toFixed(2)} - Status: ${score > 0.5 ? 'neon' : 'gray'}`; return {score, status: score > 0.5 ? 'neon' : 'gray'}; }; // Dummy call with 3 logs (2 success/1 ui, 1 fail): calcThrive([{status:'success',type:'ui'},{status:'success',type:'code'},{status:'fail',type:'deploy'}]).
6. Include Mermaid for n8n in automation.json comments.
Validation/Checkpoints: n8n import automation.json & run with mock POST (logs all nodes, success true); git push sim ci-cd (Actions yaml valid, mock steps pass); node scripts/deploy_trigger.js (mock fetch log, return mock); node scripts/progress.js (score ~0.73, status 'neon'); npm run lint (pass); echo "Phase 4 Thermonuclear - 0 Errors."
Expected Output: automation/workflows/automation.json (n8n nodes), automation/.github/workflows/ci-cd.yml, automation/scripts/deploy_trigger.js, automation/scripts/progress.js; verifiable by n8n manual, yaml lint, node runs.

## Terminal 5: Phase 5 - Security, Secrets, & Monitoring Foundation
Objective: Full JS security with Vault class (mock store get/put/rotate), auth middleware (Clerk mock JWT validate/roles), monitoring (logMetric/error to console/Datadog stub), cost check (throw on exceed with session track), GDPR delete (mock purge/soft in D1 stub), compliance hooks (PII scan/consent flag)—security/ops base.
Scope (Do NOT do): No frontend, AI, backend full APIs, workflows; mocks for vendors (dict for Vault).
Step-by-Step Execution:
1. mkdir security; cd security; npm init -y; npm i zod; mkdir src.
2. In src/vault.js, class Vault {constructor(){this.store={'kimi_key':'mock_kimi_thermo','claude_key':'mock_claude_thermo'}; this.rotated = Date.now();} get(k){ if(!this.store[k]) throw {code:'VAULT-404',message:'Not Found'}; print `Thermonuclear Get ${k}`; return this.store[k]; } put(k,v){ print `Thermonuclear Put ${k}`; this.store[k]=v; this.rotated = Date.now(); } rotate(){ print "Thermonuclear Rotate Keys"; this.store = {...this.store, 'kimi_key':'new_mock_kimi'}; } }; export const vault = new Vault(); // Dummy rotate call.
3. In src/auth.js, async function validateJwt(header){ const token = header?.replace('Bearer ', ''); if (!token) throw {code:'AUTH-401',message:'Missing'}; const payload = {id:'uuid-thermo-1',role:'vibe_coder'}; // Mock decode; Zod validate z.object({id:z.string().uuid(),role:z.enum(['vibe_coder','engineer','exec'])}).parse(payload); print "Thermonuclear Auth: Valid"; return payload; }.
4. In src/monitor.js, function logMetric(name,value){ print `Thermonuclear Metric: ${name}=${value}`; // Datadog stub }; class ErrorHandler {handle(e){ const code = e.code || 'ERR-500'; print `Thermonuclear Error: ${code} - ${e.message}`; return {error:e.message,code}; } }; export const errorHandler = new ErrorHandler().
5. In src/cost.js, function checkBudget(current,add){ const total = current + add; if(total > 0.10) throw {code:'BUDGET-429',message:'Task Exceeded'}; print `Thermonuclear Budget: ${total}`; return total; }; // Session track mock global current=0; checkBudget(current,0.05).
6. In src/compliance.js, async function deleteUser(id,soft=true){ if(soft) { print `Thermonuclear Soft Delete ${id} - Set deleted_at`; } else { print `Thermonuclear Hard Purge ${id}`; } // Mock D1 update; const scanPII = (data) => data.includes('email') ? 'PII Detected - Redact' : 'Safe'; print scanPII('test@proto.com'); return {success:true, pii:scanPII('dummy')}; }; // Dummy call deleteUser('uuid-thermo-1').
Validation/Checkpoints: npm run lint (pass); add test.js with jest: test('vault get', () => expect(vault.get('kimi_key')).toBe('mock_kimi_thermo')); test('auth validate', async () => expect(await validateJwt('Bearer mock')).toHaveProperty('role','vibe_coder')); test('cost throw', () => expect(() => checkBudget(0.06,0.05)).toThrow('BUDGET-429')); test('delete log', () => expect(deleteUser('test')).toEqual({success:true,pii:'Safe'})); npm test (100%); echo "Phase 5 Thermonuclear - 0 Errors."
Expected Output: security/src/vault.js, security/src/auth.js, security/src/monitor.js, security/src/error.js (rename if needed), security/src/cost.js, security/src/compliance.js, security/test.js (jest); verifiable by node require (logs match, throws caught). 

Mermaid for error flow in error.js.