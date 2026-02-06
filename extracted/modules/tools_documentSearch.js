// Category: tools/documentSearch
// Modules: 1
// Total size: 2,416 chars


// === Module: BZB (offset: 0xc9a1be, 2,416 chars) ===
var BZB=z(()=>{rC();ZE();qI();wC();AZB=dE({metadata:{name:"documentSearch",displayName:"Document Search",description:"Performs semantic search across documentation using vector embeddings. Useful for finding relevant context based on semantic similarity.",category:"search",requiresConfirmation:!1},inputSchema:S.object({query:S.string().min(1).describe("The search query to find relevant information."),max_results:S.number().min(1).max(100).optional().describe("Maximum results to return (default: 10)."),threshold:S.number().min(0).max(1).optional().describe("Minimum similarity threshold 0-1 (default: 0.0).")}),validateParams:({query:A})=>{if(!A?.trim())return"Query cannot be empty";return null},getDescription:({query:A,max_results:B})=>{let Q=`Searching for "${A}"`;if(B)Q+=` (max ${B})`;return Q},getLocations:()=>[],execute:async({query:A,max_results:B=10,threshold:Q=0},E)=>{let g=Date.now();if(fA.debug("[documentSearch] Starting",{query:A,max_results:B,threshold:Q}),!E.projectId)return fA.warn("[documentSearch] No project selected"),{success:!1,llmContent:"No project selected. Select a project to use document search.",returnDisplay:"No project selected"};if(!E.apiFetch)return fA.warn("[documentSearch] API not available"),{success:!1,llmContent:"API not available. Please authenticate first.",returnDisplay:"Authentication required"};try{let C=await E.apiFetch.post(`api/v1/projects/${E.projectId}/retrieve-context`,{query:A,max_results:B,threshold:Q}),I=CME(C.text),w=!!C.text?.length;return fA.info("[documentSearch] Completed",{query:A,chunkCount:I,hasResults:w,duration:Date.now()-g}),{success:!0,llmContent:C.text??"",returnDisplay:w?`Found results for "${A}"`:"No results found",summary:w?`Found ${I} chunk(s)`:"No results",metadata:{query:A,chunkCount:I,hasResults:w}}}catch(C){let I=uQ(C);return fA.error("[documentSearch] Failed",{query:A,error:I,duration:Date.now()-g}),{success:!1,llmContent:`Document search failed: ${I}`,returnDisplay:`Error: ${I}`}}}})});var QZB=120,EZB=30,IME=`Fetches content from a specified URL and returns it in a readable format. Useful for reading web pages, documentation, or any publicly accessible URL.

Usage notes:
- The URL must be a fully-formed valid URL (http:// or https://)
- Format options: 'markdown' (default), 'text', or 'html'
- This tool is read-only and does not modify any files
- Results may be summarized if the content is very large`,gZB;
