// Keep legacy source/contracts untouched; adapt the one demo slot at generation.
exports.integrateProjectDemos = function (engine) {
  const previous = "if(n.demoUrl)RS(e,t,{id:'projetos/demo/'+n.slug,label:'VER PROJETO ONLINE',rect:{x:584,y:Math.min(l+44,540),w:392,h:48},size:20});";
  if (!engine.includes(previous)) throw Error('Project demo integration boundary missing');
  return 'import {drawProjectDemoActions} from "./project-demo-actions.js?v=cs-mode-3";\n' + engine.replace(previous,
    'drawProjectDemoActions(e,t,n,Math.min(l+44,540),RS,Q,X);');
};
