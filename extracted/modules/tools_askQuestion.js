// Category: tools/askQuestion
// Modules: 1
// Total size: 2,310 chars


// === Module: ZKA (offset: 0xc99035, 2,310 chars) ===
var ZKA=z(()=>{rC();fw();qI();wC();$VB();pVB=dE({metadata:{name:"askQuestion",displayName:"Ask Question",description:"Ask the user interactive questions with multiple-choice options. Ask multiple related questions at once (up to 4) for better UX.",category:"development"},inputSchema:S.object({questions:S.array(lVB).min(1).max(4).describe("Array of 1-4 questions to ask the user")}),validateParams:({questions:A})=>{let B=A.map((Q)=>Q.header);if(B.length!==new Set(B).size)return"All questions must have unique headers";for(let Q of A)if(!Q.question.trim().endsWith("?"))return"Questions should end with '?'";return null},getDescription:({questions:A})=>{if(A.length===1)return`Asking: ${A[0]?.header??"Question"}`;return`Asking ${A.length} questions`},getLocations:()=>[],execute:async({questions:A})=>{try{let B=yB.getState().questionHandler;if(!B)return{success:!1,llmContent:"Question handler not available. UI integration required.",summary:"Cannot ask questions"};let Q={id:`q_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,questions:A,timestamp:Date.now()},E=await B(Q),g=Object.entries(E.answers).map(([C,I])=>{let w=I.isCustom?`Custom: ${I.answers.join(", ")}`:I.answers.join(", ");return`**${C}**: ${w}`}).join(`
`);return{success:!0,summary:`User answered ${Object.keys(E.answers).length} question(s)`,llmContent:`User responses:
${g}`,metadata:{promptId:Q.id,answers:E.answers}}}catch(B){return{success:!1,llmContent:`Error asking questions: ${uQ(B)}`,summary:"Failed to ask questions"}}}})});var qKA=5000,gME=`Search and get relevant context for any programming task.
- Provides the highest quality and freshest context for libraries, SDKs, and APIs
- Use this tool for ANY question or task related to programming
- Returns comprehensive code examples, documentation, and API references
- Optimized for finding specific programming patterns and solutions

Usage notes:
- Adjustable token count (1000-50000) for focused or comprehensive results
- Default 5000 tokens provides balanced context for most queries
- Use lower values for specific questions, higher values for comprehensive documentation
- Supports queries about frameworks, libraries, APIs, and programming concepts
- Examples: 'React useState hook examples', 'Python pandas dataframe filtering', 'Express.js middleware'`,rVB;
