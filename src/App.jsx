import React,{useEffect,useMemo,useRef,useState} from 'react';

const STORE='acl-foundboard-v3';
// Fictional campus locations for this standalone teaching demo.
// A found report can exist before the item has been received by staff.
const seed=[
 {id:'f1',title:'Black backpack',category:'accessories',status:'lost',location:'Library - second floor',description:'Black backpack with a small red keychain. Left near the study desks.',owner:'you',created:'Oct 23',emoji:'🎒'},
 {id:'f2',title:'Dark backpack',category:'accessories',status:'found',location:'Library - main stairwell',description:'Found a dark backpack with a small red keychain near the library stairs.',owner:'other',created:'Oct 24',emoji:'🎒',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f3',title:'Student ID card',category:'documents',status:'found',location:'Near Gate 3',description:'A student card was turned in. No personal details are published.',owner:'other',created:'Oct 24',emoji:'🪪',collectionPoint:'Student Services Office',handoverStatus:'received'},
 {id:'f4',title:'Wireless earbuds',category:'electronics',status:'lost',location:'Main cafeteria',description:'White earbuds in a distinctive blue case. Lost on Monday.',owner:'other',created:'Oct 24',emoji:'🎧'},
 {id:'f5',title:'Earbuds in blue case',category:'electronics',status:'found',location:'Cafeteria entrance',description:'White earbuds in a blue charging case found near the coffee counter.',owner:'other',created:'Oct 25',emoji:'🎧',collectionPoint:'',handoverStatus:'reported'},
 {id:'f6',title:'Blue sports bottle',category:'other',status:'lost',location:'Sports Hall - lockers',description:'Tall blue metal water bottle, possibly left after practice.',owner:'other',created:'Oct 25',emoji:'🥤'},
 {id:'f7',title:'Metal water bottle',category:'other',status:'found',location:'Sports Hall - benches',description:'Blue reusable metal bottle found after a basketball session.',owner:'other',created:'Oct 25',emoji:'🥤',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f8',title:'Engineering lab coat',category:'clothing',status:'claimed',location:'Building C',description:'Owner verified the item and collected it from the reception desk.',owner:'you',created:'Oct 22',emoji:'🥼',collectionPoint:'Library Reception',handoverStatus:'released'},
 {id:'f9',title:'Small notebook',category:'other',status:'lost',location:'C7 lecture room',description:'Brown cover with handwritten engineering notes.',owner:'other',created:'Oct 25',emoji:'📒'},
 {id:'f10',title:'Scientific calculator',category:'electronics',status:'lost',location:'B2 lecture hall',description:'Black scientific calculator with a protective cover.',owner:'other',created:'Oct 26',emoji:'🧮'},
 {id:'f11',title:'Calculator',category:'electronics',status:'found',location:'B2 study area',description:'Scientific calculator with a black cover, found on a desk.',owner:'you',created:'Oct 26',emoji:'🧮',collectionPoint:'Library Reception',handoverStatus:'received'},
 {id:'f12',title:'Canvas tote bag',category:'accessories',status:'lost',location:'Main campus bus stop',description:'Beige tote with green writing on one side.',owner:'other',created:'Oct 26',emoji:'👜'},
 {id:'f13',title:'USB flash drive',category:'electronics',status:'found',location:'Building A computer lab',description:'A small black flash drive was found beside a workstation.',owner:'other',created:'Oct 27',emoji:'💾',collectionPoint:'',handoverStatus:'reported'},
];
const categories=['all','electronics','clothing','documents','accessories','other'];
const statuses=['lost','found','claimed'];
// Fictional designated collection points used in this demo.
const collectionPoints=['Campus Security Desk','Student Services Office','Library Reception'];
const clean={title:'',category:'',status:'',location:'',description:''};
const fieldOrder=['title','status','category','location','description'];
function getSaved(){try{const s=JSON.parse(localStorage.getItem(STORE));return Array.isArray(s)?s:seed;}catch{return seed;}}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

// Same rules as before, but each problem is attached to the field it belongs to
// so the form can say what is wrong and where.
function validate(f,arr,id){
 const errors={};
 if(!f.title.trim()||f.title.trim().length<2)errors.title='Enter an item title of at least 2 characters.';
 if(!statuses.includes(f.status))errors.status='Choose lost, found or claimed.';
 if(!categories.slice(1).includes(f.category))errors.category='Choose a category.';
 const duplicate=errors.title?null:arr.find(r=>r.id!==id&&r.title.toLowerCase()===f.title.trim().toLowerCase()&&(r.location||'').toLowerCase()===(f.location||'').trim().toLowerCase());
 if(duplicate){
  const where=duplicate.location?`at “${duplicate.location}”`:'with no location';
  errors.title=`“${duplicate.title}” has already been reported ${where}. Change the title or location, or open the existing report.`;
  errors.location='Same location as the existing report.';
 }
 return {errors,duplicate};
}

// Every search word must appear somewhere (title, location, description or category),
// so "red backpack" finds "Dark backpack … small red keychain".
function matchesSearch(item,q){
 const hay=`${item.title} ${item.location} ${item.description} ${item.category}`.toLowerCase();
 return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>hay.includes(w));
}

const formCopy={
 lost:{location:'Where did you last see it?',locationPh:'e.g., Library - second floor (optional)',details:'Description',detailsPh:'Distinctive features: colour, brand, stickers, case…',detailsHint:'Specific details help finders and staff recognise your item.'},
 found:{location:'Where did you find it?',locationPh:'e.g., Cafeteria entrance (optional)',details:'Description',detailsPh:'General description, e.g. “blue water bottle”.',detailsHint:'Keep one unique detail private (contents, serial number, engraving) so staff can verify the real owner.'},
 claimed:{location:'Location',locationPh:'Location (optional)',details:'Description',detailsPh:'How was it returned?',detailsHint:''},
 '':{location:'Location',locationPh:'Location (optional)',details:'Description',detailsPh:'Describe the item',detailsHint:'Choose a status first for tailored guidance.'},
};

function Handover({item}){
 if(item.status==='lost')return null;
 if(item.handoverStatus==='released')return <div className="handover done"><strong>✓ Returned to owner</strong><span>Ownership verified{item.collectionPoint?` at ${item.collectionPoint}`:''}.</span></div>;
 if(item.handoverStatus==='received'&&item.collectionPoint)return <div className="handover held"><strong>📍 Held at {item.collectionPoint}</strong><span>Collect in person after proving ownership.</span></div>;
 return <div className="handover pending"><strong>⚠ Not yet at a collection point</strong><span>A finder reported it; staff have not confirmed receiving it.</span></div>;
}

export default function App(){
 const [items,setItems]=useState(getSaved);
 const [page,setPage]=useState('board');
 const [q,setQ]=useState('');
 const [cat,setCat]=useState('all');
 const [filterStatus,setFilterStatus]=useState('all');
 const [pickup,setPickup]=useState('any');
 const [mineOnly,setMineOnly]=useState(false);
 const [current,setCurrent]=useState(null);
 const [form,setForm]=useState(clean);
 const [errors,setErrors]=useState({});
 const [duplicate,setDuplicate]=useState(null);
 const [message,setMessage]=useState('');
 const fieldRefs=useRef({});
 useEffect(()=>localStorage.setItem(STORE,JSON.stringify(items)),[items]);
 const filtered=useMemo(()=>items.filter(x=>
  (cat==='all'||x.category===cat)&&
  (filterStatus==='all'||x.status===filterStatus)&&
  (pickup==='any'||(pickup==='held'?x.status==='found'&&x.handoverStatus==='received'&&x.collectionPoint:x.status==='found'&&!(x.handoverStatus==='received'&&x.collectionPoint)))&&
  (!mineOnly||x.owner==='you')&&
  matchesSearch(x,q)),[items,q,cat,filterStatus,pickup,mineOnly]);
 const filtersActive=q||cat!=='all'||filterStatus!=='all'||pickup!=='any'||mineOnly;
 function clearFilters(){setQ('');setCat('all');setFilterStatus('all');setPickup('any');setMineOnly(false);}
 function goBoard(){setPage('board');setCurrent(null);window.scrollTo(0,0);}
 function openForm(next,id){setCurrent(id);setForm(next);setErrors({});setDuplicate(null);setPage('form');window.scrollTo(0,0);}
 function create(status=''){openForm({...clean,status},null);}
 function edit(row){if(row.owner!=='you')return;openForm({title:row.title,category:row.category,status:row.status,location:row.location||'',description:row.description||''},row.id);}
 function update(field,value){
  setForm(s=>({...s,[field]:value}));
  // Clear a field's message as soon as the user changes it; duplicate affects title and location together.
  setErrors(e=>{if(!e[field])return e;const n={...e};delete n[field];if(duplicate&&(field==='title'||field==='location')){delete n.title;delete n.location;setDuplicate(null);}return n;});
 }
 function findMatches(item){
  // Use the item's key noun (last word of the title) to look for found reports in the same category.
  const key=item.title.trim().split(/\s+/).pop();
  clearFilters();setQ(key);setCat(item.category);setFilterStatus('found');
  setMessage(`Showing found reports in ${cap(item.category)} that mention “${key}”. Clear filters to see everything.`);
  window.scrollTo(0,0);
 }
 function viewExisting(){const d=duplicate;clearFilters();setQ(d.title);goBoard();setMessage(`Showing the existing report “${d.title}”.`);}
 function submit(e){
  e.preventDefault();
  const {errors:v,duplicate:dup}=validate(form,items,current);
  if(Object.keys(v).length){
   setErrors(v);setDuplicate(dup);
   const first=fieldOrder.find(f=>v[f]);
   fieldRefs.current[first]?.focus();
   return;
  }
  const existing=current?items.find(x=>x.id===current):null;
  const d={...form,title:form.title.trim(),location:form.location.trim(),description:form.description.trim(),owner:'you',created:existing?existing.created:'Today',emoji:existing?existing.emoji:'📌',...(current?{}:{collectionPoint:'',handoverStatus:'reported'})};
  if(current){setItems(items.map(x=>x.id===current?{...x,...d}:x));setMessage(`Your report “${d.title}” was updated.`);}
  else{setItems([{id:`f-${Date.now()}`,...d},...items]);setMessage(d.status==='found'?`Your report “${d.title}” has been posted. Please hand the item in at a collection point.`:`Your report “${d.title}” has been posted.`);}
  goBoard();
 }
 function reset(){setItems(seed);clearFilters();goBoard();setMessage('Example reports restored.');}
 const copy=formCopy[form.status]||formCopy[''];
 const errorCount=Object.keys(errors).length;
 const fieldProps=name=>({id:`f-${name}`,ref:el=>{fieldRefs.current[name]=el;},value:form[name],onChange:e=>update(name,e.target.value),'aria-invalid':errors[name]?'true':undefined,'aria-describedby':errors[name]?`f-${name}-err`:undefined,className:errors[name]?'invalid':undefined});
 const fieldError=name=>errors[name]&&<span className="field-error" id={`f-${name}-err`}>{errors[name]}</span>;
 const navActive=s=>page==='board'&&filterStatus===s&&!q&&cat==='all'&&pickup==='any'&&!mineOnly;

 return <div className="notice-app"><header className="header"><div className="headline"><span className="sun">✺</span><button onClick={()=>{clearFilters();goBoard();}} className="wordmark">FOUND<span>on campus</span></button><p>Community noticeboard</p></div>
  <nav className="header-links" aria-label="Quick views">
   <button className={navActive('all')?'active':''} aria-pressed={navActive('all')} onClick={()=>{clearFilters();goBoard();}}>Noticeboard</button>
   <button className={navActive('lost')?'active':''} aria-pressed={navActive('lost')} onClick={()=>{clearFilters();setFilterStatus('lost');goBoard();}}>Missing items</button>
   <button className={navActive('found')?'active':''} aria-pressed={navActive('found')} onClick={()=>{clearFilters();setFilterStatus('found');goBoard();}}>Recently found</button>
  </nav><button className="report-button" onClick={()=>create()}>+ Post a report</button></header>
  <div className="ruleline"><span>SEARCH • DISCOVER • REUNITE</span><span>Helping lost things find their way back.</span></div>
  {page==='board'?<main className="workspace"><aside className="filters"><p className="kicker">YOUR NOTICEBOARD</p><h1>Lost something?<br/><em>You're in the right place.</em></h1><p className="intro">Browse what the campus community has shared or post what you've lost or found.</p>
   <div className="filterbox"><h3>Browse reports</h3>
    <label>Search items<input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g., blue bottle, keychain"/></label>
    <label>Item category<select value={cat} onChange={e=>setCat(e.target.value)}><option value="all">All categories</option>{categories.slice(1).map(c=><option key={c} value={c}>{cap(c)}</option>)}</select></label>
    <label>Report status<select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select></label>
    <label>Pickup availability<select value={pickup} onChange={e=>setPickup(e.target.value)}><option value="any">Any</option><option value="held">Found – held at a collection point</option><option value="pending">Found – not yet handed in</option></select></label>
    <label className="check"><input type="checkbox" checked={mineOnly} onChange={e=>setMineOnly(e.target.checked)}/>Only my reports</label>
    <div className="filter-summary" aria-live="polite"><span>Showing <b>{filtered.length}</b> of {items.length}</span>{filtersActive&&<button onClick={clearFilters}>Clear filters</button>}</div>
   </div>
   <div className="side-message recovery"><strong>How recovery works</strong>
    <ol><li><b>Lost it?</b> Search for a matching found notice, or post a lost report.</li><li>Go to the <b>collection point</b> shown on the notice.</li><li>Staff release the item after you <b>prove ownership</b> (describe unique details or show ID).</li></ol>
    <p><b>Found something?</b> Hand it in at one of:</p><ul className="points">{collectionPoints.map(p=><li key={p}>📍 {p}</li>)}</ul>
    <div className="side-actions"><button onClick={()=>create('lost')}>Report a lost item →</button><button onClick={()=>create('found')}>Report a found item →</button></div>
   </div><button className="reset" onClick={reset}>Reset demo data</button></aside>
   <section className="board"><div className="board-top"><div><p className="kicker">CAMPUS COMMUNITY</p><h2>Latest notices <span>({filtered.length})</span></h2></div><span className="time-note">Updated today</span></div>{message&&<div className="message" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss message">✕</button></div>}
    {filtered.length===0?<div className="empty-results"><strong>No reports match your filters.</strong><p>Try fewer or different words, or a different category.</p><div><button onClick={clearFilters}>Clear filters</button><button className="report-button" onClick={()=>create('lost')}>Post a lost report</button></div></div>:
    <div className="board-grid">{[{key:'lost',title:'LOST',sub:'Searching for these things',icon:'↗'},{key:'found',title:'FOUND',sub:'Looking for the owners',icon:'⌁'},{key:'claimed',title:'CLAIMED',sub:'Back where they belong',icon:'✓'}].map(col=><div className="board-column" key={col.key}><div className="column-head"><span className={'col-icon '+col.key}>{col.icon}</span><div><strong>{col.title}</strong><small>{col.sub}</small></div><span className="col-count">{filtered.filter(r=>r.status===col.key).length}</span></div><div className="sticky-list">{filtered.filter(r=>r.status===col.key).map(item=><article className={'sticky'+(item.owner==='you'?' mine':'')} key={item.id}>
     <div className="sticky-top"><span>{item.category}</span>{item.owner==='you'&&<span className="mine-badge">Your report</span>}</div>
     <div className="sticky-emoji">{item.emoji}</div><h3>{item.title}</h3><p>{item.description||'No additional description.'}</p>
     <Handover item={item}/>
     <div className="sticky-bottom"><span>⌖ {item.location||'Location not provided'}</span><small>{item.created}</small></div>
     {(item.owner==='you'||item.status==='lost')&&<div className="card-actions">{item.status==='lost'&&<button onClick={()=>findMatches(item)}>Find possible matches</button>}{item.owner==='you'&&<button className="edit" onClick={()=>edit(item)} aria-label={`Edit your report: ${item.title}`}>✎ Edit</button>}</div>}
    </article>)}{filtered.every(x=>x.status!==col.key)&&<div className="empty-column">Nothing here yet</div>}</div></div>)}</div>}
   </section></main>:<main className="report-page"><div className="crumbs"><button onClick={goBoard}>← Noticeboard</button><span>/</span><span>{current?'Edit your report':'Report an item'}</span></div><div className="report-layout"><div className="report-intro"><span className="seal">✺</span><p className="kicker">HELP THE COMMUNITY</p><h1>{current?'Update your report':'Tell us what happened.'}</h1><p>Small details can help someone recognize their belongings.</p><div className="paper-note">Your report will appear on the public campus noticeboard with the details you provide.</div></div>
   <section className="form-paper"><header><p>{current?'EDIT NOTICE':'NEW NOTICE / FORM 01'}</p><h2>{current?'Edit report':'Report an item'}</h2><small className="req-note"><b>*</b> required</small></header>
    <form onSubmit={submit} noValidate>
     <label htmlFor="f-title"><span className="label-text">Item title <b>*</b></span><input {...fieldProps('title')} placeholder="e.g., Black backpack"/>{fieldError('title')}{duplicate&&<button type="button" className="link-button" onClick={viewExisting}>View the existing report →</button>}</label>
     <label htmlFor="f-status"><span className="label-text">Status <b>*</b></span><select {...fieldProps('status')}><option value="">Choose one</option>{statuses.map(s=><option key={s} value={s}>{s==='lost'?'Lost – I lost this item':s==='found'?'Found – I found this item':'Claimed – returned to its owner'}</option>)}</select>{fieldError('status')}</label>
     {form.status==='found'&&<div className="found-guide" role="note"><strong>Please hand the item in at a collection point</strong><ul>{collectionPoints.map(p=><li key={p}>📍 {p}</li>)}</ul><span>Your notice shows <em>“Not yet at a collection point”</em> until staff confirm they have received it. Owners collect items there after verification, so you don't need to meet anyone.</span></div>}
     <label htmlFor="f-category"><span className="label-text">Category <b>*</b></span><select {...fieldProps('category')}><option value="">Select item category</option>{categories.slice(1).map(s=><option key={s} value={s}>{cap(s)}</option>)}</select>{fieldError('category')}</label>
     <label htmlFor="f-location"><span className="label-text">{copy.location}</span><input {...fieldProps('location')} placeholder={copy.locationPh}/>{fieldError('location')}</label>
     <label htmlFor="f-description"><span className="label-text">{copy.details} <i>(optional)</i></span><textarea rows="6" {...fieldProps('description')} placeholder={copy.detailsPh}/>{copy.detailsHint&&<span className="field-hint">{copy.detailsHint}</span>}</label>
     {errorCount>0&&<div className="form-error" role="alert">{errorCount===1?'1 field needs':`${errorCount} fields need`} your attention. See the highlighted fields above.</div>}
     <div className="form-actions"><button type="button" onClick={goBoard}>Cancel</button><button className="report-button" type="submit">{current?'Save changes':'Publish notice'}</button></div>
    </form></section></div></main>}
  <footer className="pagefooter"><span>FOUND / Campus noticeboard</span><span>Community project • Demo only</span></footer>
 </div>;
}
