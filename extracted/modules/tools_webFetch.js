// Category: tools/webFetch
// Modules: 1
// Total size: 2,532 chars


// === Module: CZB (offset: 0xc9ab2e, 2,532 chars) ===
var CZB=z(()=>{rC();ZE();qI();wC();gZB=dE({metadata:{name:"webFetch",displayName:"Web Fetch",description:IME,category:"network",requiresConfirmation:!1},inputSchema:S.object({url:S.string().min(1).describe("The URL to fetch content from (must start with http:// or https://)."),format:S.enum(["text","markdown","html"]).optional().describe("The format to return the content in - 'text': plain text, 'markdown': converted to markdown (default), 'html': raw HTML."),timeout:S.number().int().min(1).max(QZB).optional().describe(`Timeout in seconds (default: ${EZB}, max: ${QZB}).`)}),validateParams:({url:A})=>{if(!A?.trim())return"URL cannot be empty";if(!A.startsWith("http://")&&!A.startsWith("https://"))return"URL must start with http:// or https://";return null},getDescription:({url:A})=>`Fetching content from ${A}`,getLocations:()=>[],execute:async({url:A,format:B,timeout:Q},E)=>{let g=Date.now();if(fA.debug("[webFetch] Starting",{url:A,format:B,timeout:Q}),!E.apiFetch)return fA.warn("[webFetch] API not available"),{success:!1,llmContent:"API not available. Please authenticate first.",returnDisplay:"Authentication required"};try{let C=await E.apiFetch.post("api/v1/proxy/web-fetch",{url:A,format:B??"markdown",timeout:Q??EZB});if(!C.response)return{success:!1,llmContent:"No content returned from URL.",returnDisplay:"No content"};return fA.info("[webFetch] Completed",{url:A,responseLength:C.response.length,duration:Date.now()-g}),{success:!0,llmContent:C.response,returnDisplay:`Fetched content from ${A}`,summary:"Web fetch completed",metadata:{url:A,format:B??"markdown",contentType:C.contentType,responseLength:C.response.length}}}catch(C){let I=uQ(C);return fA.error("[webFetch] Failed",{url:A,error:I,duration:Date.now()-g}),{success:!1,llmContent:`Web fetch failed: ${I}`,returnDisplay:`Error: ${I}`}}}})});function wME(){return`Performs real-time web searches to find up-to-date information. Use for current events, recent data, or general web queries.

Usage notes:
- Supports live crawling modes: 'fallback' (backup if cached unavailable) or 'preferred' (prioritize live crawling)
- Search types: 'auto' (balanced), 'fast' (quick results), 'deep' (comprehensive search)
- Configurable context length for optimal LLM integration

Today's date is ${new Date().toISOString().slice(0,10)}. You MUST use this year when searching for recent information or current events.
- Example: If today is 2025-07-15 and the user asks for "latest AI news", search for "AI news 2025", NOT "AI news 2024"`}var Du=8,WKA=1e4,IZB;
