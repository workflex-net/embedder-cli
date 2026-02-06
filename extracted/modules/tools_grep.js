// Category: tools/grep
// Modules: 1
// Total size: 4,624 chars


// === Module: eZB (offset: 0xca8afa, 4,624 chars) ===
var eZB=z(()=>{rC();ZE();tKA();qI();wC();rZB=dE({metadata:{name:"grep",displayName:"Search Files",description:'Fast content search tool that works with any codebase size. Searches file contents using regular expressions. Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+"). Filter files by pattern with the filePattern parameter (e.g., "*.js", "*.{ts,tsx}"). Returns file paths and line numbers with matches sorted by modification time. Use this tool when you need to find files containing specific patterns. If you need to count matches within files, use the shell tool with `rg` directly. For open-ended searches requiring multiple rounds, use the task tool instead.',category:"search"},inputSchema:S.object({pattern:S.string().describe("The regex pattern to search for in file contents."),path:S.string().optional().describe("The directory to search in. Defaults to the current working directory."),filePattern:S.string().optional().describe('File pattern to filter which files to search (e.g., "*.ts", "*.{ts,tsx}").'),caseSensitive:S.boolean().optional().describe("Whether the search is case-sensitive. Default is true.")}),validateParams:({pattern:A})=>{try{new RegExp(A)}catch{return`Invalid regular expression pattern: ${A}`}return null},getDescription:({pattern:A,path:B})=>{let Q=B?WN.basename(B):"current directory";return`Searching for "${A}" in ${Q}`},getLocations:({path:A})=>[{path:A||process.cwd(),type:"read"}],execute:async({pattern:A,path:B,filePattern:Q,caseSensitive:E=!0})=>{let g=Date.now();fA.debug("[grep] Starting search",{pattern:A,inputPath:B,filePattern:Q});try{let C=B?WN.isAbsolute(B)?B:WN.resolve(process.cwd(),B):process.cwd();try{await eME(C)}catch{return fA.debug("[grep] Path not found",{searchPath:C}),{success:!1,llmContent:`Path not found: ${C}`,returnDisplay:"Path not found."}}let{matches:I,hasErrors:w}=await AHE(C,A,Q,E);if(I.length===0)return fA.debug("[grep] No matches found",{pattern:A,searchPath:C,duration:Date.now()-g}),{success:!0,summary:"No matches found",llmContent:`No matches found for pattern "${A}" in ${C}`,returnDisplay:"No matches found",locations:[{path:C,type:"read"}]};let D=I.length>pZB,H=D?I.slice(0,pZB):I,L=BHE(H,D,w);return fA.info("[grep] Search completed",{pattern:A,matchCount:H.length,truncated:D,duration:Date.now()-g}),{success:!0,summary:`Found ${H.length} match${H.length===1?"":"es"}`,llmContent:L,returnDisplay:`${H.length} match${H.length===1?"":"es"}`,locations:[{path:C,type:"read"}],metadata:{matchCount:H.length,truncated:D,toolParams:{pattern:A,path:B,filePattern:Q,caseSensitive:E}}}}catch(C){let I=uQ(C);return fA.error("[grep] Search failed",{pattern:A,inputPath:B,error:I,duration:Date.now()-g}),{success:!1,llmContent:`Error searching: ${I}`,returnDisplay:`Error: ${I}`}}}})});import Uu from"path";import{pathToFileURL as QHE}from"url";function uKA(A){if(A===null||A===void 0)return A;if(Array.isArray(A))return A.map(uKA);if(typeof A==="object"){let B={};for(let[Q,E]of Object.entries(A))if((Q==="line"||Q==="character")&&typeof E==="number")B[Q]=E+1;else B[Q]=uKA(E);return B}return A}async function CHE(A,B,Q){switch(A){case"goToDefinition":return sC.definition(B);case"findReferences":return sC.references(B);case"hover":return sC.hover(B);case"documentSymbol":return sC.documentSymbol(Q);case"workspaceSymbol":return sC.workspaceSymbol("");case"goToImplementation":return sC.implementation(B);case"prepareCallHierarchy":return sC.prepareCallHierarchy(B);case"incomingCalls":return sC.incomingCalls(B);case"outgoingCalls":return sC.outgoingCalls(B)}}var EHE=`Interact with Language Server Protocol (LSP) servers to get code intelligence features.

Supported operations:
- goToDefinition: Find where a symbol is defined
- findReferences: Find all references to a symbol
- hover: Get hover information (documentation, type info) for a symbol
- documentSymbol: Get all symbols (functions, classes, variables) in a document
- workspaceSymbol: Search for symbols across the entire workspace
- goToImplementation: Find implementations of an interface or abstract method
- prepareCallHierarchy: Get call hierarchy item at a position (functions/methods)
- incomingCalls: Find all functions/methods that call the function at a position
- outgoingCalls: Find all functions/methods called by the function at a position

All operations require:
- path: The file to operate on
- line: The line number (1-based, as shown in editors)
- character: The character offset (1-based, as shown in editors)

All positions in the output (line, character in ranges) are also 1-based, matching the input format and editor display.`,gHE,A6B;
