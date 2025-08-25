# 🌐 THERMONUCLEAR MANUAL BROWSER E2E TEST
**Manual E2E Browser Validation at localhost:3000**

## 🚀 Pre-Test Setup Commands

### **Step 1: Start Backend Server**
```bash
cd backend
wrangler dev &
# Expected: Backend running on localhost:8787
# Look for: "Ready on localhost:8787"
```

### **Step 2: Start Frontend Server** 
```bash
cd frontend
npm run dev &
# Expected: Frontend running on localhost:3000
# Look for: "Local: http://localhost:3000"
```

### **Step 3: Test AI Core Orchestrator**
```bash
cd ai-core
poetry run python src/orchestrator.py
# Expected: 3 code outputs generated
# Look for: "Thermonuclear Orchestration Complete: 0 outputs generated" (HITL escalation is expected)
```

### **Step 4: Import n8n Workflow** 
```bash
# Manual: Import workflows/automation.json into n8n
# Run workflow with test data: {"roadmap_id": "rm-thermo-1"}
# Expected: Score calculation logs showing neon status
```

### **Step 5: Test Security Budget**
```bash
node src-security/cost.js
# Expected: Throw on budget exceed with proper error codes
```

---

## 🌐 Browser Test Checklist

### **Navigate to http://localhost:3000**

#### **✅ Initial Load Tests:**
- [ ] **Page loads without errors** (check browser console)
- [ ] **No 404 errors** for assets or API calls
- [ ] **Frontend→Backend integration working** (check network tab)
- [ ] **Graph data fetched from backend** (should see mock roadmap data)

#### **✅ UI Component Tests:**
- [ ] **Magic Canvas renders** (2D React Flow visible)
- [ ] **3 nodes visible** (Thermo Start, Middle, End) 
- [ ] **2 edges connecting nodes** (arrows between nodes)
- [ ] **InsightsPanel shows Thrive Score** (should display ~0.45 or updated score)
- [ ] **Gradient progress bar** (blue to orange gradient)

#### **✅ Interaction Tests:**
- [ ] **Toggle Mode button** (2D ↔ 3D switch)
  - Click "Toggle Mode" button
  - Should switch between React Flow (2D) and Spline (3D)
  - Console should log: "Thermonuclear Mode Toggled"
- [ ] **3D Scene loads** (Spline component initializes)
  - Should see message: "3D Loaded - Map Nodes to Positions"
- [ ] **Graph updates in real-time** (score updates reflected in UI)

#### **✅ Integration Tests:**
- [ ] **Frontend→Backend calls successful**
  - Network tab shows: GET /api/roadmaps/rm-thermo-1
  - Response contains valid JSON with graph data
  - Console logs: "Thermonuclear Frontend→Backend: Data received"
- [ ] **No integration errors** (no red console errors)
- [ ] **Mock data renders correctly** (dummy graph displays properly)

#### **✅ Performance Tests:**
- [ ] **Fast initial load** (< 3 seconds)
- [ ] **Smooth transitions** (mode toggle is responsive)
- [ ] **No memory leaks** (check dev tools memory tab)
- [ ] **Responsive layout** (works on different screen sizes)

---

## 🎯 Expected Results

### **Console Output Should Show:**
```
Thermonuclear Dashboard Rendered
Thermonuclear Frontend→Backend: Loading roadmap data...
THERMONUCLEAR MOCK FETCH: /api/roadmaps/rm-thermo-1 - Opts: {"headers":{"Authorization":"Bearer mock"}}
Thermonuclear Frontend→Backend: Data received {nodes: 3, edges: 2, thriveScore: 0.45}
Thermonuclear Mode Toggled (when button clicked)
3D Loaded - Map Nodes to Positions (in 3D mode)
```

### **Network Tab Should Show:**
- Mock API calls to backend endpoints
- Successful responses with dummy data
- No 404 or 500 errors

### **Visual Elements Should Display:**
- **2D Mode**: React Flow canvas with 3 connected nodes
- **3D Mode**: Spline scene with neon cube (mock scene)
- **Insights Panel**: Progress bar showing thrive score
- **Toggle Button**: Blue button that switches modes

---

## ❌ Common Issues & Solutions

### **Issue: Frontend won't start**
```bash
# Solution: Install dependencies
cd frontend && npm install
```

### **Issue: Backend connection failed**
```bash
# Solution: Check backend is running
curl http://localhost:8787/health
# Should return: {"status":"ok","service":"protothrive-backend"}
```

### **Issue: 3D scene not loading**
```
# Expected: Spline scenes are mocked, should show placeholder
# Look for: Mock Spline loader console messages
```

### **Issue: No graph data**
```
# Expected: Mock data should load even if backend is down
# Look for: Fallback to dummy data messages
```

---

## 🏁 Test Completion Criteria

### **✅ PASS Criteria:**
- Page loads without critical errors
- Graph visualizes with 3 nodes and 2 edges  
- Mode toggle works (2D ↔ 3D)
- Thrive score displays in insights panel
- Frontend→Backend integration functional
- Console shows expected integration logs

### **❌ FAIL Criteria:**
- Critical JavaScript errors preventing load
- Graph fails to render entirely
- Mode toggle completely non-functional
- No backend integration (and no fallback)
- Multiple 404s for core resources

---

## 📊 Test Results Template

**Date**: ________________  
**Tester**: _______________  
**Browser**: ______________  

### Results:
- [ ] **Initial Load**: ✅ PASS / ❌ FAIL  
- [ ] **Graph Rendering**: ✅ PASS / ❌ FAIL  
- [ ] **Mode Toggle**: ✅ PASS / ❌ FAIL  
- [ ] **Backend Integration**: ✅ PASS / ❌ FAIL  
- [ ] **Performance**: ✅ PASS / ❌ FAIL  

**Notes**: _________________________________

**Overall Result**: ✅ THERMONUCLEAR SUCCESS / ❌ NEEDS FIXES

---

*This completes the manual E2E browser validation for the ProtoThrive unified platform.*