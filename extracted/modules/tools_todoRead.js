// Category: tools/todoRead
// Modules: 1
// Total size: 1,183 chars


// === Module: K6B (offset: 0xcad79a, 1,183 chars) ===
var K6B=z(()=>{rC();qI();Z4();aKA();wC();R6B=dE({metadata:{name:"todoRead",displayName:"Todo Read",description:"Read your current todo list to check progress and see what tasks remain",category:"development"},inputSchema:S.object({}),getDescription:()=>"Reading todo list",getLocations:()=>[],execute:async()=>{try{let A=ZF(),B=zJ(A);if(B.length===0)return{success:!0,summary:"No todos tracked",llmContent:"No todos found for this session",metadata:{todoCount:0,sessionId:A}};let Q=wz(B),E=B.map((C)=>{let I=C.status===Xg.COMPLETED?"[x]":"[ ]",w=C.status===Xg.CANCELLED?`~~${C.content}~~`:C.status===Xg.IN_PROGRESS?`**${C.content}**`:C.content;return`${I} ${w}`}).join(`
`),g=[Q.pendingCount>0?`${Q.pendingCount} pending`:null,Q.inProgressCount>0?`${Q.inProgressCount} in progress`:null,Q.completedCount>0?`${Q.completedCount} completed`:null,Q.cancelledCount>0?`${Q.cancelledCount} cancelled`:null].filter(Boolean).join(", ");return{success:!0,summary:`${Q.totalCount} todos: ${g}`,llmContent:`Current todo list:
${E}`,metadata:{todoMetadata:Q,todos:B,sessionId:A}}}catch(A){return{success:!1,llmContent:`Error reading todos: ${uQ(A)}`,summary:"Failed to read todos"}}}})});var Y6B;
