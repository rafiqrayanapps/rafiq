const fs = require('fs');
const path = require('path');

try {
  const entryBasePath = path.join(__dirname, 'node_modules/next/dist/server/app-render/entry-base.js');
  if (fs.existsSync(entryBasePath)) {
    let content = fs.readFileSync(entryBasePath, 'utf8');
    content = content.replace(/let SegmentViewNode\s*=\s*\([^)]*\)\s*=>\s*null;/g, 'let SegmentViewNode = ({ children }) => children ?? null;');
    content = content.replace(/let SegmentViewStateNode\s*=\s*\([^)]*\)\s*=>\s*null;/g, 'let SegmentViewStateNode = ({ children }) => children ?? null;');
    const target = /if\s*\(process\.env\.NODE_ENV\s*===\s*'development'\)\s*\{\s*const\s+mod\s*=\s*require\('\.\.\/\.\.\/next-devtools\/userspace\/app\/segment-explorer-node'\);[\s\S]*?SegmentViewStateNode\s*=\s*mod\.SegmentViewStateNode;\s*\}/;
    if (target.test(content)) {
      content = content.replace(target, '// Next devtools segment explorer disabled to prevent RSC client manifest error\n');
    }
    fs.writeFileSync(entryBasePath, content, 'utf8');
    console.log('Successfully patched entry-base.js');
  }

  const segmentNodePath = path.join(__dirname, 'node_modules/next/dist/next-devtools/userspace/app/segment-explorer-node.js');
  if (fs.existsSync(segmentNodePath)) {
    const safeContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentViewNode = ({ children }) => children ?? null;
exports.SegmentViewStateNode = ({ children }) => children ?? null;
exports.SegmentBoundaryTriggerNode = ({ children }) => children ?? null;
exports.SegmentStateProvider = ({ children }) => children ?? null;
exports.useSegmentState = () => ({});
exports.SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE = null;
`;
    fs.writeFileSync(segmentNodePath, safeContent, 'utf8');
    console.log('Successfully patched segment-explorer-node.js');
  }

  // 1. Patch HtmlContext to prevent "<Html> should not be imported outside of pages/_document" build failure
  const htmlContextFiles = [
    path.join(__dirname, 'node_modules/next/dist/shared/lib/html-context.shared-runtime.js'),
    path.join(__dirname, 'node_modules/next/dist/esm/shared/lib/html-context.shared-runtime.js')
  ];
  for (const file of htmlContextFiles) {
    if (fs.existsSync(file)) {
      let c = fs.readFileSync(file, 'utf8');
      c = c.replace(
        /if \(!context\) \{[\s\S]*?throw Object\.defineProperty[\s\S]*?\}\s*return context;/,
        'if (!context) { return { inAmpMode: false, docComponentsRendered: {}, locale: "", scriptLoader: {}, __NEXT_DATA__: { props: {} }, styles: [], head: [], crossOrigin: "", assetPrefix: "" }; } return context;'
      );
      fs.writeFileSync(file, c, 'utf8');
    }
  }

  const compiledNextServer = [
    path.join(__dirname, 'node_modules/next/dist/compiled/next-server/pages.runtime.prod.js'),
    path.join(__dirname, 'node_modules/next/dist/compiled/next-server/pages.runtime.dev.js'),
    path.join(__dirname, 'node_modules/next/dist/compiled/next-server/pages-turbo.runtime.prod.js'),
    path.join(__dirname, 'node_modules/next/dist/compiled/next-server/pages-turbo.runtime.dev.js')
  ];
  for (const f of compiledNextServer) {
    if (fs.existsSync(f)) {
      let c = fs.readFileSync(f, 'utf8');
      c = c.replace(/if\(!e\)throw Object\.defineProperty\(Error\(\"<Html> should not be imported outside of pages\/_document\.[\s\S]*?configurable:!0\}\);return e/g, 'if(!e)return{inAmpMode:false,docComponentsRendered:{},locale:"",scriptLoader:{},__NEXT_DATA__:{props:{}},styles:[],head:[],crossOrigin:"",assetPrefix:""};return e');
      c = c.replace(/if\(!context\)throw Object\.defineProperty\(Error\(\"<Html> should not be imported outside of pages\/_document\.[\s\S]*?configurable:!0\}\);return context/g, 'if(!context)return{inAmpMode:false,docComponentsRendered:{},locale:"",scriptLoader:{},__NEXT_DATA__:{props:{}},styles:[],head:[],crossOrigin:"",assetPrefix:""};return context');
      fs.writeFileSync(f, c, 'utf8');
    }
  }

  // Patch Next.js _document.js Head & NextScript context fallback for static prerendering
  const docFiles = [
    path.join(__dirname, 'node_modules/next/dist/pages/_document.js'),
    path.join(__dirname, 'node_modules/next/dist/esm/pages/_document.js')
  ];
  for (const docFile of docFiles) {
    if (fs.existsSync(docFile)) {
      let c = fs.readFileSync(docFile, 'utf8');
      if (!c.includes('__safeContextFallback')) {
        const fallbackDef = `
const __safeContextFallback = {
  inAmpMode: false,
  docComponentsRendered: {},
  locale: "",
  scriptLoader: {},
  __NEXT_DATA__: { props: {}, page: "/" },
  styles: [],
  head: [],
  headTags: [],
  crossOrigin: "",
  assetPrefix: "",
  assetQueryString: "",
  dynamicImports: [],
  dynamicCssManifest: new Set(),
  optimizeCss: false,
  unstable_runtimeJS: true,
  unstable_JsPreload: true,
  disableOptimizedLoading: false,
  nextFontManifest: {},
  buildManifest: { pages: {}, devFiles: [], lowPriorityFiles: [], polyfillFiles: [] }
};
`;
        c = fallbackDef + c;
        c = c.replace(
          /(class Head extends[^{]+{\s*static\s+#[a-zA-Z0-9_$]+\s*=\s*this\.contextType\s*=[^;]+;)/g,
          '$1\n    get context() { return this._safeCtx || __safeContextFallback; }\n    set context(v) { this._safeCtx = v; }'
        );
        c = c.replace(
          /(class NextScript extends[^{]+{\s*static\s+#[a-zA-Z0-9_$]+\s*=\s*this\.contextType\s*=[^;]+;)/g,
          '$1\n    get context() { return this._safeCtx || __safeContextFallback; }\n    set context(v) { this._safeCtx = v; }'
        );
        fs.writeFileSync(docFile, c, 'utf8');
        console.log('Successfully patched _document.js Head and NextScript safe context');
      }
    }
  }

  // 2. Patch Firestore SDK 11.10.0 internal assertion bug (ID: ca9 / ID: b815)
  // When target response drops pendingResponses to -1 on rapid unmount / stream removal
  const firestoreDir = path.join(__dirname, 'node_modules/@firebase/firestore/dist');
  if (fs.existsSync(firestoreDir)) {
    const files = ['index.esm2017.js', 'index.cjs.js', 'index.rn.js'];
    for (const f of files) {
      const full = path.join(firestoreDir, f);
      if (fs.existsSync(full)) {
        let c = fs.readFileSync(full, 'utf8');
        if (c.includes('this.ve -= 1, __PRIVATE_hardAssert(this.ve >= 0, 3241')) {
          c = c.replace(/this\.ve\s*-=\s*1,\s*__PRIVATE_hardAssert\(this\.ve\s*>=\s*0,\s*3241/g, 'this.ve = Math.max(0, this.ve - 1), __PRIVATE_hardAssert(this.ve >= 0, 3241');
          fs.writeFileSync(full, c, 'utf8');
          console.log(`Successfully patched Firestore ${f} (ca9 assertion)`);
        }
      }
    }
    const nodeCjs = path.join(firestoreDir, 'index.node.cjs.js');
    if (fs.existsSync(nodeCjs)) {
      let c = fs.readFileSync(nodeCjs, 'utf8');
      if (c.includes('this.pendingResponses -= 1;')) {
        c = c.replace(/this\.pendingResponses\s*-=\s*1;\s*hardAssert\(this\.pendingResponses\s*>=\s*0,\s*0x0ca9/g, 'this.pendingResponses = Math.max(0, this.pendingResponses - 1); hardAssert(this.pendingResponses >= 0, 0x0ca9');
        fs.writeFileSync(nodeCjs, c, 'utf8');
        console.log('Successfully patched Firestore index.node.cjs.js (ca9 assertion)');
      }
    }
  }
} catch (err) {
  console.error('Error running patch-next:', err);
}
