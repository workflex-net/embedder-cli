// Category: tools/readFile
// Modules: 1
// Total size: 4,440 chars


// === Module: hZB (offset: 0xc9fab2, 4,440 chars) ===
var hZB=z(()=>{rC();ZE();mO();qI();wC();Fu();oZB=dE({metadata:{name:"readFile",displayName:"Read File",description:"Reads a file from the local filesystem. By default, it reads up to 2000 lines starting from the beginning of the file. You can optionally specify a line offset and limit for long files. Any lines longer than 2000 characters will be truncated. Output is capped at 50KB. Results are returned with line numbers starting at 1. You can read image files using this tool.",category:"file"},inputSchema:S.object({path:S.string().describe("The path to the file to read."),offset:S.number().min(1).optional().describe("Optional: The 1-based line number to start reading from. Use for paginating through large files."),limit:S.number().min(1).optional().describe("Optional: Maximum number of lines to read (defaults to 2000).")}),validateParams:()=>{return null},getDescription:({path:A,offset:B,limit:Q})=>{let E=kD.basename(A);if(B!==void 0&&Q!==void 0)return`Reading ${E} (lines ${B}-${B+Q-1})`;return`Reading ${E}`},getLocations:({path:A})=>{return[{path:kD.isAbsolute(A)?A:kD.resolve(process.cwd(),A),type:"read"}]},execute:async({path:A,offset:B,limit:Q})=>{let E=Date.now();fA.debug("[readFile] Starting",{path:A,offset:B,limit:Q});try{let g=kD.isAbsolute(A)?A:kD.resolve(process.cwd(),A),C;try{C=await oME(g)}catch{let D=await yME(g);if(D.length>0)return{success:!1,llmContent:`File not found: ${g}

Did you mean one of these?
${D.join(`
`)}`,returnDisplay:"File not found."};return{success:!1,llmContent:`File not found: ${g}`,returnDisplay:"File not found."}}if(C.isDirectory())return{success:!1,llmContent:`Path is a directory, not a file: ${g}`,returnDisplay:"Path is a directory."};if(C.size>XME){let D=(C.size/1048576).toFixed(2);return{success:!1,llmContent:`File size exceeds the 20MB limit: ${g} (${D}MB)`,returnDisplay:`File too large (${D}MB).`}}let I=await NME(g),w=kD.basename(g);switch(I){case"binary":return{success:!1,llmContent:`Cannot display content of binary file: ${w}`,returnDisplay:`Skipped binary file: ${w}`};case"svg":{if(C.size>PME)return{success:!1,llmContent:`Cannot display content of SVG file larger than 1MB: ${w}`,returnDisplay:`Skipped large SVG file (>1MB): ${w}`};let D=await Bun.file(g).text();return{success:!0,summary:`Read SVG file: ${w}`,llmContent:D,returnDisplay:`Read SVG as text: ${w}`,locations:[{path:g,type:"read"}],metadata:{toolParams:{path:A,offset:B,limit:Q}}}}case"text":{let H=(await Bun.file(g).text()).split(`
`),L=H.length,R=B?B-1:0,G=Math.min(R+(Q===void 0?hME:Q),L),Y=[],J=0,c=!1,h=R,V=Math.max(3,G.toString().length);for(let i=R;i<G;i++){let d=H[i]??"",l=d.length>cZB?`${d.substring(0,cZB)}...`:d,CA=`${(i+1).toString().padStart(V," ")}| ${l}`,SA=Buffer.byteLength(CA,"utf-8")+1;if(J+SA>kZB){c=!0;break}Y.push(CA),J+=SA,h=i+1}let T=L>h,k=T||c,q=`<file>
`;if(q+=Y.join(`
`),c)q+=`

(Output truncated at ${kZB/1024}KB. Use 'offset' parameter to read beyond line ${h})`;else if(T)q+=`

(File has more lines. Use 'offset' parameter to read beyond line ${h})`;else q+=`

(End of file - total ${L} lines)`;q+=`
</file>`;let s=kD.extname(g).toLowerCase();if(qN.includes(s))sC.touchFile(g,!1).catch(()=>{});let j=k?" (truncated)":"";return fA.info("[readFile] Read text file",{path:g,totalLines:L,truncated:k,duration:Date.now()-E}),{success:!0,summary:`Read ${L} line text file: ${w}${j}`,llmContent:q,returnDisplay:`Read ${L} line text file: ${w}${j}`,locations:[{path:g,type:"read"}],metadata:{lineCount:L,isTruncated:k,startLine:R,endLine:h,toolParams:{path:A,offset:B,limit:Q}}}}case"image":case"pdf":case"audio":case"video":{let H=Buffer.from(await Bun.file(g).arrayBuffer()).toString("base64"),L=TME(g);return{success:!0,summary:`Read ${I} file: ${w}`,llmContent:`[${I.toUpperCase()} FILE: ${w}]
MIME Type: ${L}
File Size: ${C.size} bytes
Base64 Data: ${H.substring(0,100)}...(truncated)`,returnDisplay:`Read ${I} file: ${w}`,locations:[{path:g,type:"read"}],metadata:{fileType:I,mimeType:L,fileSize:C.size,base64Data:H,toolParams:{path:A,offset:B,limit:Q}}}}default:return{success:!1,llmContent:`Unhandled file type: ${I}`,returnDisplay:`Skipped unhandled file type: ${w}`}}}catch(g){let C=uQ(g),I=kD.basename(A);return fA.error("[readFile] Failed",{path:A,error:C,duration:Date.now()-E}),{success:!1,llmContent:`Error reading file ${I}: ${C}`,returnDisplay:`Error reading file ${I}: ${C}`}}}})});import{mkdir as VME}from"fs/promises";import*as WL from"path";var XZB;
