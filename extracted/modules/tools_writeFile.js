// Category: tools/writeFile
// Modules: 1
// Total size: 22,406 chars


// === Module: PZB (offset: 0xca0c0a, 22,406 chars) ===
var PZB=z(()=>{rC();fw();ZE();mO();ZN();qI();Mu();wC();zKA();Fu();XZB=dE({metadata:{name:"writeFile",displayName:"Write File",description:"Creates a new file or completely overwrites an existing file with the provided content. Use this tool when you need to create new files or when you want to replace the entire content of an existing file. For making targeted changes to existing files, prefer the editFile tool instead.",category:"file",requiresConfirmation:!0,requiresSequentialExecution:!0},inputSchema:S.object({path:S.string().describe("The path where the file should be written."),content:S.string().describe("The content to write to the file.")}),validateParams:()=>{return null},getDescription:({path:A})=>{return`Writing ${WL.basename(A)}`},getLocations:()=>[],shouldConfirm:async(A,B)=>{let{path:Q,content:E}=A,g=WL.basename(Q),C=Bun.file(Q),I=!await C.exists(),w="";if(!I)try{w=await C.text()}catch{w=""}let D=c4(Q,w,E);return{type:"edit",title:I?`Create ${g}`:`Overwrite ${g}`,description:I?`Create new file: ${Q}`:`Overwrite existing file: ${Q}`,affectedPaths:[Q],isDestructive:!I,fileName:g,fileDiff:D,originalContent:I?void 0:w,newContent:E}},execute:async({path:A,content:B},Q)=>{let E=WL.isAbsolute(A)?A:WL.resolve(Q.projectRoot,A);fA.info("writeFile execute started",{path:E,mode:Q.mode,projectRoot:Q.projectRoot});let g=Q.projectRoot;if(!xx(E,g))return fA.info("writeFile blocked: path outside project",{path:E,projectRoot:g}),{success:!1,llmContent:`Error: File path "${E}" is outside the project directory "${g}". File operations are restricted to the project folder.`,returnDisplay:"Blocked: path outside project"};let C=Q.sessionSlug&&Q.sessionCreatedAt?Cz("writeFile",Q.mode??"act",E,{projectRoot:g,sessionSlug:Q.sessionSlug,createdAt:Q.sessionCreatedAt}):!0;if(Q.sessionSlug&&Q.sessionCreatedAt&&!C){let I=aU(g,Q.sessionSlug,Q.sessionCreatedAt);return fA.info("writeFile blocked: plan mode restriction",{path:E,planPath:I,mode:Q.mode}),{success:!1,llmContent:`Error: In plan mode, you can only edit the plan file at ${I}. Attempted to write to ${E} which is not allowed.`,returnDisplay:"Blocked: plan mode restriction"}}try{yB.getState().snapshotService?.registerFile(E);let w=WL.dirname(E);return await VME(w,{recursive:!0}),await Hu(E,async()=>{let D=Bun.file(E),H=!await D.exists(),L=WL.basename(E),R="";if(!H)try{R=await D.text()}catch{R=""}let U=c4(E,R,B),G=Q.sessionSlug&&Q.sessionCreatedAt?aU(g,Q.sessionSlug,Q.sessionCreatedAt):null,Y=Q.mode==="plan"&&Q.sessionSlug&&Q.sessionCreatedAt&&G!==null&&E===G;if(fA.info("writeFile permission check",{mode:Q.mode,sessionId:Q.sessionId?"present":"missing",sessionCreatedAt:Q.sessionCreatedAt?"present":"missing",path:E,planPath:G,isPlanFileEdit:Y,willSkipConfirmation:Y}),!Y)fA.info("writeFile requesting permission",{path:E,isNewFile:H}),await Q.ask?.({permission:"edit",patterns:[E],always:["*"],metadata:{confirmationDetails:{type:"edit",title:H?`Create ${L}`:`Overwrite ${L}`,description:H?`Create new file: ${E}`:`Overwrite existing file: ${E}`,affectedPaths:[E],isDestructive:!H,fileName:L,fileDiff:U,originalContent:H?void 0:R,newContent:B}}}),fA.info("writeFile permission granted");else fA.info("writeFile skipping confirmation (plan file in plan mode)");fA.info("writeFile writing file",{path:E,isNewFile:H}),await Bun.write(E,B),fA.info("writeFile write completed",{path:E});let J=B.split(`
`).length,c=H?`Successfully created file: ${E}`:`Successfully wrote to file: ${E}`,h=WL.extname(E);if(qN.includes(h))try{await sC.touchFile(E,!0);let k=((await sC.diagnostics())[E]||[]).filter((q)=>q.severity===1);if(k.length>0){let q=k.map(sC.formatDiagnostic).join(`
`);c+=`

This file has compilation errors that need to be fixed:
<file_diagnostics>
${q}
</file_diagnostics>`}}catch(V){fA.warn("LSP diagnostics failed",V)}return{success:!0,summary:H?`Created ${L} (${J} lines)`:`Wrote ${L} (${J} lines)`,llmContent:c,returnDisplay:H?`Created ${L}`:`Wrote ${L}`,locations:[{path:E,type:"write"}],diffData:{fileName:L,filePath:E,diff:U,isNewFile:H},metadata:{lineCount:J,isNewFile:H,toolParams:{path:E}}}})}catch(I){let w=uQ(I),D=WL.basename(E);return fA.info("writeFile error",{path:E,error:w,mode:Q.mode}),{success:!1,llmContent:`Error writing file ${D}: ${w}`,returnDisplay:`Error writing file ${D}: ${w}`}}}})});async function ZME(A,B,Q,E,g,C){return new Promise((I)=>{let w="",D=!1,H="",L=null,R=null,U=`serial-monitor-${Date.now()}-${Math.random()}`,G=()=>{J(),Y(),I({output:w,success:!1,reason:"Operation was cancelled by user"})},Y=()=>{if(L)clearTimeout(L);if(R)clearTimeout(R);ZI.unsubscribe(A,U),C?.removeEventListener("abort",G)},J=()=>{let h=H.split(`
`);if(h.length>1){H=h.pop()||"";let V=h.join(`
`)+(h.length>0?`
`:"");if(V.trim()){if(w+=V,g)g(w+(H?H:""))}}},c={id:U,onData:(h)=>{if(H+=h,J(),Q&&!D&&(w.includes(Q)||h.includes(Q)||H.includes(Q))){if(D=!0,L)clearTimeout(L);if(g)g(`
Stop string "${Q}" detected. Collecting additional data for 1 second...
`);setTimeout(()=>{J(),Y(),I({output:w,success:!0})},1000)}},onError:(h)=>{Y(),I({output:w,success:!1,reason:`Serial port error: ${h}`})},onClose:()=>{if(!D)Y(),I({output:w,success:!1,reason:"Serial port closed unexpectedly"})}};if(R=setTimeout(()=>{if(!D&&!ZI.isConnected(A))Y(),I({output:w,success:!1,reason:`Connection timeout: Could not open serial port ${A} within 5 seconds`})},5000),ZI.subscribe(A,B,c).then(()=>{if(R)clearTimeout(R),R=null;if(yB.getState().serialAutoConnectHandler?.(A,B),g)g(`Successfully connected to ${A} at ${B} baud
`);L=setTimeout(()=>{if(!D)if(J(),Y(),Q)I({output:w,success:!1,reason:`Timeout: stop_string "${Q}" not found within ${E/1000} seconds`});else I({output:w,success:!0,reason:`Captured output for ${E/1000} seconds`})},E)}).catch((h)=>{Y();let V=uQ(h);I({output:"",success:!1,reason:V})}),C)C.addEventListener("abort",G,{once:!0})})}var OZB=1e4,NZB;var TZB=z(async()=>{fw();ZE();qI();wC();gN();await pQ([EN(),nO()]);NZB=dE({metadata:{name:"serial_monitor",displayName:"Serial Monitor",description:`Opens a serial monitor to capture debug output from embedded devices.

Modes:
- With stop_string: Monitors until the string is found (30s default timeout)
- Without stop_string: Captures for timeout duration (3s default)

Use this when you need to WAIT for specific output (boot completion, test results).

Alternative tools:
- serial_read_history: Read existing buffered output without waiting
- serial_send_command: Send commands to an already-connected device`,category:"system",requiresConfirmation:!0,canStream:!0},inputSchema:sfB,validateParams:({timeout:A})=>{if(A!==void 0&&A<1000)return"timeout must be at least 1000ms";return null},getDescription:(A)=>{let B=A.stop_string?`Monitor serial output for "${A.stop_string}"`:"Capture serial output";if(A.port)B+=` on ${A.port}`;if(A.baud_rate)B+=` at ${A.baud_rate} baud`;let Q=A.stop_string?30000:3000;if(A.timeout&&A.timeout!==Q)B+=` (${A.timeout/1000}s timeout)`;if(A.description)B+=` - ${A.description}`;if(A.startup_commands&&A.startup_commands.length>0)B+=` (with ${A.startup_commands.length} startup command${A.startup_commands.length>1?"s":""})`;return B},getLocations:()=>[{path:process.cwd(),type:"execute"}],execute:async(A,B)=>{let Q=Date.now();fA.debug("[serialMonitor] Starting",{port:A.port,baudRate:A.baud_rate,stopString:A.stop_string,timeout:A.timeout}),await B.ask?.({permission:"serial",patterns:[A.port||"default"],always:["*"],metadata:{confirmationDetails:{type:"execute",title:"Start serial monitor?",description:A.stop_string?`Monitor serial output for "${A.stop_string}" ${A.port?`on ${A.port}`:""} ${A.baud_rate?`at ${A.baud_rate} baud`:""}`:`Capture serial output ${A.port?`on ${A.port}`:""} ${A.baud_rate?`at ${A.baud_rate} baud`:""}`,affectedPaths:[process.cwd()],isDestructive:!1}}});try{let E=A.port||MW(),g=A.baud_rate;if(!g){let R=FG().find((G)=>G.path===E)??null;g=(await z4(E,R)).baudRate}let C=A.stop_string?30000:3000,I=A.timeout??C;if(B.updateOutput)B.updateOutput(`Opening direct serial connection to ${E} at ${g} baud...
`);let w=await ZME(E,g,A.stop_string,I,B.updateOutput,B.signal),D=`Serial Monitor Results:

`;if(D+=`Port: ${E}
`,D+=`Baud Rate: ${g}
`,A.stop_string)D+=`Stop String: "${A.stop_string}"
`;else D+=`Mode: Timed capture (${I/1000}s)
`;if(D+=`Status: ${w.success?"SUCCESS":"FAILED"}
`,w.reason)D+=`Reason: ${w.reason}
`;if(!w.success&&w.output.length>0){if(/[\x00-\x08\x0E-\x1F\x7F-\u00FF]/.test(w.output))D+=`
NOTE: Output contains non-printable characters, which may indicate:
`,D+=`- Incorrect baud rate (try common rates: 9600, 19200, 38400, 57600, 115200)
`,D+=`- Mismatched data bits, stop bits, or parity settings
`,D+=`- Device not ready or sending binary data
`}if(w.output.length>OZB)D+=`
--- Serial Output from ${E} (truncated) ---
${w.output.substring(0,OZB)}
... (output truncated, ${w.output.length} total characters)`;else D+=`
--- Serial Output from ${E} ---
${w.output}`;let H,L;if(w.success)if(A.stop_string)H=`Serial monitor completed - found "${A.stop_string}"`,L=`Found "${A.stop_string}"`;else H=`Serial monitor completed - captured ${I/1000}s of output`,L=`Captured ${I/1000}s of output`;else H=`Serial monitor failed - ${w.reason}`,L=`Failed: ${w.reason}`;if(w.output.trim())H+=`

Captured Output:
${w.output}`;return fA.info("[serialMonitor] Completed",{port:E,baudRate:g,success:w.success,outputLength:w.output.length,duration:Date.now()-Q}),{success:w.success,llmContent:D,returnDisplay:H,summary:L,locations:[{path:process.cwd(),type:"execute"}],metadata:{port:E,baudRate:g,...A.stop_string&&{stopString:A.stop_string},timeout:I,outputLength:w.output.length}}}catch(E){let g=uQ(E);return fA.error("[serialMonitor] Failed",{port:A.port,error:g,duration:Date.now()-Q}),{success:!1,llmContent:`Serial monitor error: ${g}`,returnDisplay:`Serial monitor failed: ${g}`,summary:`Error: ${g}`}}}})});function jME(A){if(A.length<=qME)return A;let B=A.slice(0,WME),Q=A.slice(-zME),E=A.length-B.length-Q.length;return[...B,`
... (${E} lines truncated) ...
`,...Q]}var qME=100,WME=30,zME=70,yZB;var VZB=z(async()=>{qI();gN();await v4();yZB=dE({metadata:{name:"serial_read_history",displayName:"Serial Read History",description:`Reads buffered output from connected serial monitors without waiting.

- Without port: Lists all connected monitors and their status
- With port: Returns buffered output from that monitor
- With only_new: true: Returns only output since last read (for polling)

Use serial_monitor to wait for specific output, serial_send_command to send data.`,category:"system",requiresConfirmation:!1,canStream:!1},inputSchema:bfB,getDescription:(A)=>{if(!A.port)return"List all connected serial monitors";if(A.only_new)return`Read new output from ${A.port}`;return`Read history from ${A.port}`},getLocations:(A)=>{if(A.port)return[{path:A.port,type:"read"}];return[]},execute:async(A)=>{let B=fg.getState(),Q=B.tabs.filter((H)=>H.connectionState==="connected"&&H.activePort);if(!A.port){if(Q.length===0)return{success:!0,llmContent:`No serial monitors are currently connected.

To connect, ask the user to open the serial monitor sidebar and connect to a port, or use serial_monitor to establish a connection.`,returnDisplay:"No connected serial monitors",summary:"No connected monitors"};let H=Q.map((R)=>({port:R.activePort,baudRate:R.activeBaudRate,lineCount:R.outputLines.length,unreadCount:R.outputLines.length-R.lastRetrievedIndex})),L=`Connected Serial Monitors:

`;for(let R of H)L+=`- ${R.port} at ${R.baudRate} baud
`,L+=`  Lines buffered: ${R.lineCount}
`,L+=`  Unread lines: ${R.unreadCount}

`;return L+=`
Use serial_read_history with a specific port to read output.`,{success:!0,llmContent:L,returnDisplay:`${Q.length} connected monitor(s)`,summary:`${Q.length} monitors`,metadata:{monitors:H}}}let E=Q.find((H)=>H.activePort===A.port);if(!E){let H=Q.map((L)=>L.activePort).filter(Boolean);return{success:!1,llmContent:`No connected serial monitor found for port ${A.port}.

${H.length>0?`Available connected ports: ${H.join(", ")}`:"No serial monitors are currently connected."}`,returnDisplay:`Port ${A.port} not connected`,summary:"Port not connected"}}let g,C;if(A.only_new){let H=B.getUnretrievedOutput(A.port);g=H.lines,C=H.newCount}else g=E.outputLines,C=E.outputLines.length-E.lastRetrievedIndex;if(A.last_n_lines&&A.last_n_lines>0)g=g.slice(-A.last_n_lines);let w=jME(g).join(`
`),D=`Serial Output from ${A.port} at ${E.activeBaudRate} baud:

`;if(D+=`Total lines buffered: ${E.outputLines.length}
`,A.only_new)D+=`New lines since last read: ${C}
`;return D+=`
--- Serial Output from ${A.port} ---
${w||"(no output)"}`,{success:!0,llmContent:D,returnDisplay:g.length>0?`${g.length} lines from ${A.port}`:`No ${A.only_new?"new ":""}output from ${A.port}`,summary:`${g.length} lines`,metadata:{port:A.port,baudRate:E.activeBaudRate,totalLines:E.outputLines.length,returnedLines:g.length,onlyNew:A.only_new??!1}}}})});async function ZZB(A,B=vME){let Q=Date.now();while(Date.now()-Q<B){let E=fg.getState(),g=E.tabs.find((I)=>I.activePort===A&&I.connectionState==="connected");if(g)return{tabId:g.id};let C=E.tabs.find((I)=>I.config.port===A&&I.connectionState==="error");if(C)return{tabId:null,error:C.error||"Connection failed"};await new Promise((I)=>setTimeout(I,100))}return{tabId:null,error:"Connection timeout"}}async function iME(A,B,Q){let E=fg.getState(),g=E.tabs.find((D)=>D.id===A);if(!g)return{success:!1,llmContent:"Tab no longer exists.",returnDisplay:"Tab not found",summary:"Tab not found"};let C=g.activeBaudRate,I=g.outputLines.length;if(!E.sendToPort(B,Q))return{success:!1,llmContent:`Failed to send command to ${B}. The connection may have been lost.`,returnDisplay:"Send failed",summary:"Send failed"};return await new Promise((D)=>setTimeout(D,Lu)),sKA(B,C,Q,I)}async function sME(A,B,Q){yB.getState().serialAutoConnectHandler?.(A,B);let{tabId:E}=await ZZB(A,2000);if(E){let g=fg.getState(),I=g.tabs.find((D)=>D.id===E)?.outputLines.length||0;if(!g.sendToPort(A,Q))return{success:!1,llmContent:`Failed to send command to ${A}. The connection may have been lost.`,returnDisplay:"Send failed",summary:"Send failed"};return await new Promise((D)=>setTimeout(D,Lu)),sKA(A,B,Q,I)}try{ZI.write(A,`${Q}
`)}catch(g){let C=g instanceof Error?g.message:String(g);return{success:!1,llmContent:`Failed to send command to ${A}: ${C}`,returnDisplay:"Send failed",summary:"Send failed"}}return await new Promise((g)=>setTimeout(g,Lu)),{success:!0,llmContent:`Sent "${Q}" to ${A} at ${B} baud.

(Note: Response capture unavailable for direct connections without a serial monitor tab. Use serial_read_history if a tab exists, or open the serial monitor UI to view output.)`,returnDisplay:`Sent "${Q}" to ${A}`,summary:`Sent to ${A}`,metadata:{port:A,baudRate:B,command:Q,responseLines:0,truncated:!1}}}async function bME(A,B,Q){let E=`serial-send-${Date.now()}-${Math.random()}`;try{await ZI.subscribe(A,B,{id:E,onData:()=>{},onError:()=>{},onClose:()=>{}}),yB.getState().serialAutoConnectHandler?.(A,B);let{tabId:g,error:C}=await ZZB(A);if(!g)return ZI.unsubscribe(A,E),{success:!1,llmContent:`Failed to connect to ${A}: ${C}`,returnDisplay:`Connection failed: ${C}`,summary:"Connection failed"};let I=fg.getState(),w=I.tabs.find((U)=>U.id===g),D=w?.activeBaudRate||B,H=w?.outputLines.length||0;if(!I.sendToPort(A,Q))return ZI.unsubscribe(A,E),{success:!1,llmContent:`Connected to ${A} but failed to send command. The connection may have been lost.`,returnDisplay:"Send failed after connect",summary:"Send failed"};await new Promise((U)=>setTimeout(U,Lu)),ZI.unsubscribe(A,E);let R=sKA(A,D,Q,H);return R.llmContent=`Opened new connection to ${A} at ${D} baud.

`+R.llmContent,R}catch(g){ZI.unsubscribe(A,E);let C=g instanceof Error?g.message:String(g);return{success:!1,llmContent:`Failed to connect to ${A}: ${C}`,returnDisplay:`Connection failed: ${C}`,summary:"Connection failed"}}}function sKA(A,B,Q,E){let I=fg.getState().tabs.find((L)=>L.activePort===A)?.outputLines.slice(E)??[],w=I.length>iKA,D=w?I.slice(0,iKA):I,H=`Sent "${Q}" to ${A} at ${B} baud.

`;if(D.length>0){if(H+=`--- Device Response from ${A} ---
`,H+=D.join(`
`),w)H+=`

... (${I.length-iKA} more lines truncated, use serial_read_history for full output)`}else H+="(No response received within 1 second)";return{success:!0,llmContent:H,returnDisplay:`Sent "${Q}" to ${A}`,summary:`Sent to ${A}`,metadata:{port:A,baudRate:B,command:Q,responseLines:D.length,truncated:w}}}var Lu=1000,iKA=50,vME=5000,qZB;var WZB=z(async()=>{fw();qI();gN();await pQ([EN(),nO(),v4()]);qZB=dE({metadata:{name:"serial_send_command",displayName:"Serial Send Command",description:`Sends a command to a serial device and returns the response.

Auto-connects if not already connected. Waits 1 second for response (up to 50 lines).
For longer responses, use serial_read_history after sending.

Command is sent with LF line ending.`,category:"system",requiresConfirmation:!0,canStream:!1},inputSchema:dfB,validateParams:({command:A,port:B})=>{if(!A?.trim())return"command is required and cannot be empty";if(!B?.trim())return"port is required and cannot be empty";return null},getDescription:(A)=>{return`Send "${A.command.length>30?`${A.command.slice(0,30)}...`:A.command}" to ${A.port}`},getLocations:(A)=>{return[{path:A.port,type:"execute"}]},shouldConfirm:async(A)=>{return{type:"execute",title:"Send command to serial device?",description:`Send "${A.command}" to ${A.port}`,affectedPaths:[A.port],isDestructive:!1}},execute:async(A,B)=>{await B.ask?.({permission:"serial",patterns:[A.port],always:["*"],metadata:{confirmationDetails:{type:"execute",title:"Send command to serial device?",description:`Send "${A.command}" to ${A.port}`,affectedPaths:[A.port],isDestructive:!1}}});let{port:Q,baud_rate:E}=A;if(!E){let I=FG().find((D)=>D.path===Q)??null;E=(await z4(Q,I)).baudRate}let g=fg.getState().getTabByPort(Q);if(g)return await iME(g.id,Q,A.command);if(ZI.isConnected(Q)){let I=ZI.getBaudRate(Q);return await sME(Q,I||E,A.command)}return await bME(Q,E,A.command)}})});var jZB=`<system-reminder>
# Plan Mode - System Reminder

Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits (with the exception of the plan file mentioned below), run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supersedes any other instructions you have received.

---

## Plan File Info

{existsMessage}

You should build your plan incrementally by writing to or editing this file. NOTE that this is the only file you are allowed to edit - other than this you are only allowed to take READ-ONLY actions.

**Plan File Guidelines:** The plan file should contain only your final recommended approach, not all alternatives considered. Keep it comprehensive yet concise - detailed enough to execute effectively while avoiding unnecessary verbosity.

---

## Enhanced Planning Workflow

### Phase 1: Initial Understanding

**Goal:** Gain a comprehensive understanding of the user's request by reading through code and asking them questions. Critical: In this phase you should only use the codebase-explorer and document-explorer subagent types.

1. Understand the user's request thoroughly

2. **Launch up to 5 codebase-explorer and document-explorer agents IN PARALLEL** (single message, multiple tool calls) to efficiently explore the codebase AND documentation. Each agent can focus on different aspects:
   - Example: One agent searches for existing implementations, another explores related components, a third investigates testing patterns, a fourth one investigates register definitions in the documentation, a fifth one investigates the sequence of operations of a peripheral
   - Provide each agent with a specific search focus or area to explore
   - Quality over quantity - 5 agents maximum, but you should try to use the minimum number of agents necessary (usually just 2 one for codebase, one for documentation)
   - Use 1 agent when: the task is isolated to known files, the user provided specific file paths, or you're making a small targeted change. Use multiple agents when: the scope is uncertain, multiple areas of the codebase are involved, or you need to understand existing patterns before planning.
   - Take into account any context you already have from the user's request or from the conversation so far when deciding how many agents to launch

3. Use askQuestion tool to clarify ambiguities in the user request up front.

### Phase 2: Planning

**Goal:** Come up with an approach to solve the problem identified in phase 1 writing a plan using the writeFile tool.

### Phase 3: Synthesis

**Goal:** Synthesize the perspectives from Phase 2, and ensure that it aligns with the user's intentions by asking them questions.

1. Use askQuestion to ask the users questions about trade offs.
2. Clarify any questions you have regarding the hardware using documentSearch and webContext.

### Phase 4: Final Plan

Once you have all the information you need, ensure that the plan file has been updated with your synthesized recommendation including:
- Recommended approach with rationale
- Key insights from different perspectives
- Critical files that need modification

### Phase 5: Call submitPlan

At the very end of your turn, once you have asked the user questions and are happy with your final plan file - you should always call submitPlan to indicate to the user that you are done planning.

This is critical - your turn should only end with either asking the user a question or calling submitPlan. Do not stop unless it's for these 2 reasons.

---

**NOTE:** At any point in time through this workflow you should feel free to ask the user questions or clarifications. Don't make large assumptions about user intent. The goal is to present a well researched plan to the user, and tie any loose ends before implementation begins.
</system-reminder>
`;var zZB=()=>{};var iZB=`<system-reminder>
Your operational mode has changed from plan to build.
You are no longer in read-only mode.
You are permitted to make file changes, run shell commands, and utilize your arsenal of tools as needed.
</system-reminder>


`;var vZB=()=>{};function sZB(A,B){let Q=B?`A plan file already exists at ${A}. You can read it and make incremental edits using editFile.`:`No plan file exists yet. Create your plan at ${A} using writeFile.`;return jZB.replace("{existsMessage}",Q)}var bZB;
