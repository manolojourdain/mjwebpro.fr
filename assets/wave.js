import {vertex,surface,accent} from './wave-shaders.js';
const host = document.querySelector('#wave');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0, last = 0, draw, resize, elapsed = 0;

function lightweightWave() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  host.replaceChildren(canvas);
  resize = () => {
    canvas.width = innerWidth; canvas.height = innerHeight;
  };
  draw = time => {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    const point = (u,v) => {
      const swell = Math.sin(6*u+time*.34+v*2.6)*.06 + Math.sin(7*v-time*.22+u*2.3)*.04;
      return [w*(u*1.34-.14+Math.sin(3*v+time*.12)*.04),h*(.42+.5*v+swell*Math.sin(Math.PI*v)+.07*Math.sin(5*u+time*.12))];
    };
    function line(count,coordinates,alpha) {
      ctx.beginPath();
      for(let k=0;k<=count;k++){const [x,y]=coordinates(k/count); if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
      ctx.strokeStyle='rgba(211,211,214,'+alpha+')';ctx.lineWidth=innerWidth<768?.95:.7;ctx.stroke();
    }
    for(let j=1;j<26;j++) line(52,u=>point(u,j/26),(innerWidth<768?.46:.22)*Math.sin(Math.PI*j/26));
    for(let i=1;i<20;i++) line(26,v=>point(i/20,v),(innerWidth<768?.24:.09)*Math.sin(Math.PI*i/20));
  };
}
async function spatialWave() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2',{alpha:true,antialias:false,powerPreference:'low-power'});
  if (!context) { lightweightWave(); return; }
  const T = await import('./three-runtime.js');
  const engine = new T.WebGLRenderer({canvas,context,alpha:true,antialias:false,powerPreference:'low-power'});
  host.replaceChildren(engine.domElement);
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(42,1,.1,80), group=new T.Group();
  camera.position.set(0,1.2,11.5);camera.lookAt(0,-.5,-5.5);
  const mesh=new T.PlaneGeometry(30,17,96,52);
  const uniforms={uTime:{value:0},uProgress:{value:0},uMouse:{value:new T.Vector2()},uOpacity:{value:.42}};
  group.add(new T.Mesh(mesh,new T.ShaderMaterial({vertexShader:vertex,fragmentShader:surface,uniforms,transparent:true,depthWrite:false,side:2})));
  const highlight=new T.Mesh(mesh,new T.ShaderMaterial({vertexShader:vertex,fragmentShader:accent,uniforms:{...uniforms,uOpacity:{value:.11}},transparent:true,depthWrite:false,side:2,blending:2}));
  highlight.position.z=.018;group.add(highlight);scene.add(group);
  group.rotation.x=-1.02;group.position.set(1.8,-3.65,-5.8);
  resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();engine.setPixelRatio(Math.min(devicePixelRatio,1.25));engine.setSize(innerWidth,innerHeight);};
  const pointer=event=>uniforms.uMouse.value.set(2*event.clientX/innerWidth-1,1-2*event.clientY/innerHeight);
  window.addEventListener('pointermove',pointer,{passive:true});
  draw=time=>{uniforms.uTime.value=time;uniforms.uProgress.value=scrollY/Math.max(innerHeight,1);group.rotation.z=-.08+.045*Math.sin(time*.12);group.position.y=-3.65+.07*Math.sin(time*.18);engine.render(scene,camera);};
  engine.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();window.removeEventListener('pointermove',pointer);lightweightWave();resize();restart();},{once:true});
}
function paused(){return document.hidden||!!document.querySelector('dialog[open]')}
function tick(now) {
  if(paused())return;
  if(now-last>=1000/24){elapsed+=Math.min(now-last,80)/1000;draw?.(reduce.matches?0:elapsed);last=now;}
  if(!reduce.matches)frame=requestAnimationFrame(tick);
}
function restart(){cancelAnimationFrame(frame);last=performance.now();if(!paused()){draw?.(reduce.matches?0:elapsed);if(!reduce.matches)frame=requestAnimationFrame(tick);}}
async function start(){
  if(innerWidth<768||reduce.matches||navigator.connection?.saveData) lightweightWave();
  else try {await spatialWave();}catch {lightweightWave();}
  resize?.();restart();
  window.addEventListener('resize',()=>{resize?.();restart()},{passive:true});
  reduce.addEventListener('change',restart);document.addEventListener('visibilitychange',restart);
  const dialog = document.querySelector('#demande');
  if(dialog) new MutationObserver(restart).observe(dialog,{attributes:true,attributeFilter:['open']});
}
if('requestIdleCallback' in window) requestIdleCallback(start,{timeout:1200}); else requestAnimationFrame(start);
