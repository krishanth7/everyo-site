#!/usr/bin/env python3
"""Publish the complete reviewed EveryO guides as static, locally searchable pages."""
import argparse
import hashlib
import json
from html import escape, unescape
from pathlib import Path
import re
import subprocess
from urllib.parse import urljoin, urlsplit
from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://krishanth7.github.io/everyo-site/'
REPO = 'https://github.com/krishanth7/EveryO'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=ROOT.parent / 'EveryO')
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
revision = re.search(r'Content reviewed against upstream commit ([0-9a-f]{40})\.', (ROOT/'llms.txt').read_text())[1]
head = subprocess.check_output(['git','-C',str(args.source),'rev-parse','HEAD'],text=True).strip()
if head != revision:
    parser.error('Review upstream changes and provenance before rebuilding from a different source revision.')

GUIDES = [
 ('getting-started','Getting started','The complete installation and first-model guide, including tensors, gradients, CNNs, charts, and model saving.','FOUNDATIONS','Install, understand, and train.','Work through the CPU workflow before adding optional integrations. The full upstream guide below includes the first tensor, gradient, neural network, convolution, and saved model.'),
 ('architecture','Architecture','Understand EveryO package boundaries, tensor flow, backend dispatch, design decisions, and how to extend the framework.','INTERNALS','Follow the whole stack.','Read the architecture from NumPy upward. Each layer gives the next one a smaller, clearer contract: storage, differentiable operations, modules, optimization, and training.'),
 ('autograd','Automatic differentiation','Trace computation graphs, the reverse-mode backward pass, gradient accumulation, broadcasting, and finite-difference verification.','INTERNALS','Make the chain rule concrete.','Every differentiable operation computes a result and records how to send a gradient back to its inputs. Follow the forward graph first, then walk the same operations backward.'),
 ('api-reference','Full API reference','Explore the complete public API: tensors, layers, losses, optimizers, training, callbacks, serialization, profiling, and command-line tools.','REFERENCE','Find the API. Understand its role.','This is the complete upstream API map. Entries identify public names and important arguments; source docstrings remain the authoritative field-by-field reference.'),
 ('scaling','Scaling & export','Understand mixed precision, GradScaler, ONNX export, CPU data parallelism, and experimental TCP process groups with their limits.','ADVANCED','Scale the idea with context.','Treat precision, export, and parallel execution as separate choices. Each has distinct prerequisites, numerical checks, and deployment boundaries.'),
 ('cuda','CUDA & devices','Build the optional CUDA extension, understand fallback and strict mode, inspect kernels, and distinguish host-backed tensors from resident buffers.','ADVANCED','Know where computation runs.','Start with a working CPU installation. Add the native extension only when compatible NVIDIA hardware and the build toolchain are available.'),
 ('troubleshooting','Troubleshooting','Diagnose installation, interpreter selection, missing optional backends, shape errors, JSON reports, and reproducible bug reports.','SUPPORT','Diagnose one boundary at a time.','Start with the interpreter and environment, then the numerical inputs, then the optional backend. Keep the smallest example that reproduces the problem.'),
]
FILES = {key:'docs-'+key+'.html' for key,*_ in GUIDES}
outputs = {}
def save(path,text): outputs[path]=text

def text_only(html):
    return re.sub(r'\s+',' ',unescape(re.sub(r'<[^>]*>',' ',html))).strip()

def slug(text): return re.sub(r'[^a-z0-9]+','-',text.lower()).strip('-')

md = MarkdownIt('commonmark', {'html':False}).enable('table')
def fence(tokens,index,options,env):
    token=tokens[index]; language=token.info.strip().split()[0] if token.info.strip() else ''
    label={'python':'Python · reference snippet','bash':'Terminal','powershell':'PowerShell'}.get(language,'Reference / output')
    return '<div class="codebox"><div class="codebar"><span>'+label+'</span><button class="copy-button" type="button">Copy code</button></div><pre><code>'+escape(token.content)+'</code></pre><span class="copy-status" role="status"></span></div>\n'
md.renderer.rules['fence']=fence
original_link=md.renderer.rules.get('link_open')
def link_open(tokens,index,options,env):
    token=tokens[index];href=token.attrGet('href') or ''
    if not urlsplit(href).scheme and not href.startswith('#'):
        absolute=urljoin(REPO+'/blob/'+revision+'/docs/'+env['key']+'.md',href)
        match=re.search(r'/docs/([^/#]+)\.md(#[^ ]*)?$',absolute)
        if match and match[1] in FILES:href=FILES[match[1]]+(match[2] or '')
        elif re.search(r'/examples/?$',absolute):href='examples.html'
        else:href=absolute
        token.attrSet('href',href)
    return md.renderer.renderToken(tokens,index,options,env)
md.renderer.rules['link_open']=link_open

def render_markdown(key,source):
    # Preserve the original downloadable file. Repair the known source fence error
    # only for presentation so the TCP section is prose rather than shell code.
    if key=='scaling':
        source=source.replace('OMP_NUM_THREADS=1 python examples/distributed_training.py\n\n## Multi-node TCP process groups', 'OMP_NUM_THREADS=1 python examples/distributed_training.py\n```\n\n## Multi-node TCP process groups')
        source=source.rstrip()
        if source.endswith('```'):source=source[:-3].rstrip()+'\n'
    tokens=md.parse(source,{'key':key})
    if tokens and tokens[0].type=='heading_open' and tokens[0].tag=='h1':tokens=tokens[3:]
    headings=[];used=set()
    for i,token in enumerate(tokens):
        if token.type=='heading_open':
            label=tokens[i+1].content
            id=slug(text_only(md.renderInline(label)))
            candidate=id;n=2
            while candidate in used:candidate=id+'-'+str(n);n+=1
            used.add(candidate);token.attrSet('id',candidate)
            if token.tag=='h2':headings.append((candidate,text_only(md.renderInline(label))))
    html=md.renderer.render(tokens,md.options,{'key':key})
    # Tables scroll within the article rather than overflowing a mobile page.
    html=html.replace('<th></th>\n<th></th>', '<th>Component</th>\n<th>Purpose</th>')
    html=re.sub(r'<table>.*?</table>',lambda m:'<div class="table-scroll">'+m[0]+'</div>',html,flags=re.S)
    sections=[];first=re.search(r'<h2\b',html)
    intro=html[:first.start()] if first else html
    if first:
        chunks=re.split(r'(?=<h2\b)',html[first.start():])
        for chunk in chunks:
            match=re.search(r'<h2 id="([^"]+)">(.*?)</h2>',chunk,re.S)
            if match:
                id,label=match.groups()
                chunk=chunk.replace(' id="'+id+'"','',1)
                sections.append((id,text_only(label),'<section id="'+id+'" data-doc-section>'+chunk+'</section>'))
    return intro,sections,headings

# Add a library to the quickstart without replacing its existing material.
root_page=(ROOT/'documentation.html').read_text()
def library(current='documentation.html'):
    items=[('documentation.html','Quickstart overview')]+[(FILES[key],title) for key,title,*_ in GUIDES]
    nav=''.join('<a href="'+file+'"'+((' aria-current="page"' if current!='documentation.html' else ' aria-current="true"') if file==current else '')+'>'+escape(title)+'</a>' for file,title in items)
    return '<!-- DOC-LIBRARY:START --><details class="docs-library"><summary>Complete documentation library</summary><nav aria-label="Documentation library">'+nav+'</nav></details><!-- DOC-LIBRARY:END -->'
if '<!-- DOC-LIBRARY:START -->' in root_page:
    root_page=re.sub(r'<!-- DOC-LIBRARY:START -->.*?<!-- DOC-LIBRARY:END -->',lambda _:library(),root_page,flags=re.S)
else:root_page=root_page.replace('<div class="docs-sidebar-resources">',library()+'<div class="docs-sidebar-resources">',1)
for key,file in FILES.items():
    root_page=root_page.replace(REPO+'/blob/main/docs/'+key+'.md',file)
new_cards=''.join('<article class="card"><span class="card-index">'+group+'</span><h3>'+escape(title)+'</h3><p>'+escape(desc)+'</p><a class="text-link" href="'+FILES[key]+'">Read the complete guide →</a></article>' for key,title,desc,group,*_ in GUIDES if key in ['getting-started','autograd','api-reference','cuda'])
if '<!-- DOC-CARDS:START -->' in root_page:
    root_page=re.sub(r'<!-- DOC-CARDS:START -->.*?<!-- DOC-CARDS:END -->',lambda _:'<!-- DOC-CARDS:START -->'+new_cards+'<!-- DOC-CARDS:END -->',root_page,flags=re.S)
else:
    match=re.search(r'(<section id="guides"[^>]*>)(.*?)(</section>)',root_page,re.S)
    content=match[2];position=content.rfind('</div>')
    content=content[:position]+'<!-- DOC-CARDS:START -->'+new_cards+'<!-- DOC-CARDS:END -->'+content[position:]
    root_page=root_page[:match.start()]+match[1]+content+match[3]+root_page[match.end():]
search_script='<script src="assets/js/docs-search-data.js" defer></script>'
if 'src="assets/js/docs-search-data.js"' not in root_page:
    root_page=re.sub(r'(<script src="assets/js/site-experience.js" defer></script>)',lambda m:search_script+m[1],root_page)
if 'assets/css/reference-docs.css' not in root_page:root_page=root_page.replace('</head>','<link rel="stylesheet" href="assets/css/reference-docs.css"></head>')
root_schema = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',root_page,re.S)[1])
root_article = next(item for item in root_schema['@graph'] if item['@type']=='TechArticle')
root_article['hasPart'] = [{'@id':BASE+FILES[key]+'#page'} for key,*_ in GUIDES]
root_page = re.sub(r'<script type="application/ld\+json">.*?</script>',lambda _:'<script type="application/ld+json">'+json.dumps(root_schema,indent=2,ensure_ascii=False)+'</script>',root_page,flags=re.S)
save('documentation.html',root_page)

# Fresh conceptual introductions add context to the preserved upstream reference.
architecture_map='''<div class="architecture-map" role="img" aria-label="EveryO layers: training uses optimizers and neural network modules; modules use core tensors and autograd; backend dispatch runs operations on NumPy or optional CUDA."><div><span>05</span><strong>Training &amp; visualization</strong><small>Trainer · callbacks · History · charts</small></div><span class="map-arrow" aria-hidden="true">↓</span><div><span>04</span><strong>Optimization</strong><small>SGD · Adam · parameter updates</small></div><span class="map-arrow" aria-hidden="true">↓</span><div><span>03</span><strong>Neural-network modules</strong><small>Layers · activations · losses · state</small></div><span class="map-arrow" aria-hidden="true">↓</span><div><span>02</span><strong>Core tensors &amp; autograd</strong><small>Data · shapes · graph · derivatives</small></div><span class="map-arrow" aria-hidden="true">↓</span><div><span>01</span><strong>Backend dispatch</strong><small>NumPy CPU · optional native CUDA</small></div><p>Data loading feeds the training loop. Serialization saves model configuration and parameters.</p></div>'''
introductions={
 'architecture':architecture_map+'''<h3>A training step across the layers</h3><ol><li><strong>Load a batch.</strong> DataLoader yields features and targets.</li><li><strong>Run the model.</strong> Module calls compose differentiable tensor operations.</li><li><strong>Measure the loss.</strong> The loss reduces prediction errors to a scalar.</li><li><strong>Propagate gradients.</strong> backward() traverses the recorded graph.</li><li><strong>Update parameters.</strong> SGD or Adam applies the gradients; History records the epoch results.</li></ol><div class="callout"><b>Two CUDA paths, two contracts</b><p>The standard Tensor architecture described below keeps NumPy buffers in host memory. The separate <code>eo.cuda.to_device()</code> resident-buffer API is inference-only and does not attach autograd nodes. See the device guide for that distinction.</p></div>''',
 'autograd':'''<div class="concept-walkthrough"><h3>Work through y = x × x at x = 2</h3><ol><li>The forward pass reads x twice and produces y = 4.</li><li>The scalar backward pass starts with an incoming gradient of 1.</li><li>Each multiplication input contributes 1 × 2 to x.</li><li>The two paths accumulate: x.grad = 2 + 2 = 4.</li></ol></div><div class="callout"><b>Accumulation is part of the contract</b><p>Calling backward() again adds gradients. Clear them between optimizer steps unless accumulation is intentional. Intermediate tensors keep gradients only when requested with retain_grad().</p></div>''',
 'api-reference':'''<div class="reference-key"><h3>How to read a signature</h3><dl><div><dt>eo.</dt><dd>Imported as <code>import everyo as eo</code>; the API map lists top-level exports.</dd></div><div><dt>*</dt><dd>Arguments after this marker are keyword-only.</dd></div><div><dt>...</dt><dd>Additional arguments exist. Use the source docstring for the full contract.</dd></div></dl></div><div class="callout"><b>Import paths matter</b><p>Specialized APIs also live under <code>everyo.quantization</code>, <code>everyo.profiler</code>, and <code>everyo.distributed_tcp</code>. The shared-memory <code>everyo.distributed</code> API is the single-machine path described below; TCP groups are a separate API.</p></div>''',
 'scaling':'''<div class="callout"><b>Read the validation boundary first</b><p>The shared-memory process groups in this guide are single-machine. The later TCP process-group API is separate and has been exercised across processes, not separate physical hosts. CUDA runtime behavior needs hardware validation; CPU stand-ins only check the resident-buffer transfer design.</p></div><h3>Choose one change to validate</h3><ul><li><strong>Mixed precision:</strong> check numerical behavior and which operations autocast.</li><li><strong>ONNX:</strong> check supported operations, input shapes, and agreement in your target runtime.</li><li><strong>Parallelism:</strong> control BLAS threads, keep collective order consistent, and compare with a one-process baseline.</li></ul>''',
 'cuda':'''<div class="callout"><b>A device tag is not a resident training tensor</b><p>The standard <code>Tensor(device="cuda")</code> path dispatches supported operations while keeping host-backed tensor data. The separate resident-buffer API uploads data once for supported inference operations. It has no autograd nodes. Neither path has GPU runtime validation in project CI.</p></div>''',
 'troubleshooting':'''<ol class="diagnostic-path"><li><strong>Environment:</strong> activate the intended virtual environment and install with that interpreter.</li><li><strong>Core numerics:</strong> run <code>everyo doctor</code> before diagnosing a larger model.</li><li><strong>Inputs:</strong> inspect shapes, dtypes, labels, and the loss contract.</li><li><strong>Optional components:</strong> test the CPU baseline before adding CUDA, TensorFlow, or ONNX.</li><li><strong>Report:</strong> reduce the failing case and include versions and commands without private data.</li></ol>''',
 'getting-started':'''<div class="callout"><b>What should be working when you finish?</b><p>You should be able to run the installation check, create tensors, inspect a gradient, train and evaluate a small classifier, and save its model. Code snippets build on earlier definitions; the overview quickstart also provides a self-contained classifier script.</p></div>'''
}

manual_step = """import everyo as eo

features = eo.tensor([[1.0, 2.0]])
targets = eo.tensor([[1.0]])
model = eo.Sequential(eo.Linear(2, 1, seed=0))
optimizer = eo.SGD(model.parameters(), lr=0.01)
criterion = eo.MSELoss()

model.train()
optimizer.zero_grad()
predictions = model(features)
loss = criterion(predictions, targets)
loss.backward()
optimizer.step()

print(loss.item())  # loss from the forward pass, before the update
"""
accumulation = """import everyo as eo

x = eo.tensor([2.0], requires_grad=True)
(x * x).backward()
print(x.grad)  # [4.]

(x * x).backward()
print(x.grad)  # [8.] -- contributions accumulate

x.zero_grad()
(x * x).backward()
print(x.grad)  # [4.]
"""
introductions['architecture'] += '<h3>One update without Trainer</h3><p>This complete example makes the training contract explicit. The optimizer receives model parameters, the forward pass creates a scalar loss, backward() fills the gradients, and step() applies one update.</p>' + md.render('```python\n'+manual_step+'```', {'key':'architecture'}) + '<p>Call zero_grad() before each fresh update. Use model.eval() and eo.no_grad() when you want evaluation behavior without recording a new gradient graph. Trainer manages the standard epoch loop for you.</p>'
introductions['autograd'] += '<h3>Observe accumulation, then reset it</h3><p>Run this complete example after installation. Rebuilding the same scalar expression creates a fresh graph, while the leaf tensor keeps its accumulated gradient until you clear it.</p>' + md.render('```python\n'+accumulation+'```', {'key':'autograd'})

manifest=[];search_entries=[]
for match in re.finditer(r'<section id="([^"]+)"[^>]*data-doc-section[^>]*>(.*?)</section>',root_page,re.S):
    id,body=match.groups();title=text_only(re.search(r'<h2[^>]*>(.*?)</h2>',body,re.S)[1]);para=re.search(r'<p(?![^>]*class="eyebrow")[^>]*>(.*?)</p>',body,re.S)
    search_entries.append({'id':id,'href':'documentation.html#'+id,'title':title,'guide':'Quickstart','excerpt':text_only(para[1]) if para else title,'text':text_only(body).lower()})

def metadata(template,key,title,desc):
    url=BASE+FILES[key]
    template=re.sub(r'<title>.*?</title>',lambda _:'<title>EveryO '+escape(title)+' — Complete Developer Guide</title>',template,flags=re.S)
    for attr,name,value in [('name','description',desc),('property','og:title','EveryO '+title+' — Complete Developer Guide'),('property','og:description',desc),('property','og:url',url),('name','twitter:title','EveryO '+title+' — Complete Developer Guide'),('name','twitter:description',desc)]:
        template=re.sub(r'<meta\s+'+attr+'="'+re.escape(name)+r'"\s+content="[^"]+"\s*/?>',lambda _,attr=attr,name=name,value=value:f'<meta {attr}="{name}" content="{escape(value,quote=True)}" />',template)
    template=re.sub(r'<link\s+rel="canonical"\s+href="[^"]+"\s*/?>',lambda _:f'<link rel="canonical" href="{url}" />',template)
    template=re.sub(r'(<link\s+rel="alternate"\s+type="text/markdown"[^>]*href=")[^"]+("[^>]*>)',lambda m:m[1]+'docs/'+key+'.md'+m[2],template)
    graph=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',template,re.S)[1])
    nodes=graph['@graph'];page=next(n for n in nodes if n['@type']=='TechArticle')
    page.update({'@id':url+'#page','url':url,'name':'EveryO '+title+' — Complete Developer Guide','description':desc,'breadcrumb':{'@id':url+'#breadcrumbs'},'citation':REPO+'/blob/'+revision+'/docs/'+key+'.md'})
    page.pop('hasPart',None)
    breadcrumb=next(n for n in nodes if n['@type']=='BreadcrumbList')
    breadcrumb.update({'@id':url+'#breadcrumbs','itemListElement':[{'@type':'ListItem','position':1,'name':'EveryO','item':BASE},{'@type':'ListItem','position':2,'name':'Documentation','item':BASE+'documentation.html'},{'@type':'ListItem','position':3,'name':title,'item':url}]})
    return re.sub(r'<script type="application/ld\+json">.*?</script>',lambda _:'<script type="application/ld+json">'+json.dumps(graph,indent=2,ensure_ascii=False)+'</script>',template,flags=re.S)

# Reuse the exact search dialog and site chrome. Guide navigation stays within the website.
dialog=re.search(r'<dialog\s+id="docs-search".*?</dialog>',root_page,re.S)[0]
for position,(key,title,desc,group,lead,introtext) in enumerate(GUIDES):
    source=(args.source/'docs'/f'{key}.md').read_text();save('docs/'+key+'.md',source)
    intro,sections,headings=render_markdown(key,source)
    orientation='<section id="reading-this-guide" data-doc-section><p class="eyebrow">BEFORE YOU BEGIN</p><h2>'+lead+'</h2><p>'+introtext+'</p>'+introductions[key]+'</section>'
    nav='<a href="#reading-this-guide">Reading this guide</a>'+''.join('<a href="#'+id+'">'+escape(label)+'</a>' for id,label in headings)
    prev='documentation.html' if position==0 else FILES[GUIDES[position-1][0]]
    nxt='examples.html' if position==len(GUIDES)-1 else FILES[GUIDES[position+1][0]]
    main=f'''<main id="main"><section class="container docs-masthead" id="top"><div><nav class="docs-breadcrumb" aria-label="Breadcrumb"><a href="index.html">EveryO</a><span aria-hidden="true">/</span><a href="documentation.html">Documentation</a><span aria-hidden="true">/</span><span>{escape(title)}</span></nav><p class="eyebrow">{group} / COMPLETE GUIDE <span class="version-pill">v0.2.0 source snapshot</span></p><h1>{escape(title)}<span class="accent-word">.</span></h1><p>{escape(desc)}</p><div class="docs-hero-actions"><a class="button" href="#reading-this-guide">Read the guide ↓</a><a class="text-link" href="docs/{key}.md" download>Download original Markdown ↓</a></div></div><div class="docs-intro-card"><span class="eyebrow">READ WITH CONTEXT</span><p><strong>Complete upstream reference</strong>All source sections are preserved below, with added explanations and local guide links.</p><p>Some snippets require earlier definitions or optional integrations. Start with the complete CPU quickstart for a runnable baseline.</p><a href="documentation.html">Back to the quickstart →</a></div></section><div class="container docs-workspace"><aside class="docs-sidebar"><button type="button" class="docs-search-trigger" id="docs-search-open" aria-haspopup="dialog" aria-controls="docs-search"><span>Search all documentation</span><kbd>⌘ K</kbd></button>{library(FILES[key])}<details class="docs-page-toc" open><summary>On this page</summary><nav aria-label="On this page">{nav}</nav></details><div class="docs-sidebar-resources"><a href="docs/{key}.md" download>Original Markdown ↓</a><a href="llms-full.txt">Full AI reference →</a><a href="examples.html">Runnable examples →</a></div></aside><article class="docs-content reference-content"><div class="docs-source-note"><span class="eyebrow">READ THE FULL STORY</span><p>Source: EveryO <code>{revision[:7]}</code>. This page preserves the reviewed upstream guide and adds learning context. Version-specific headings and historical wording remain visible; boundary notes explain newer APIs separately.</p></div>{orientation}<div class="reference-intro">{intro}</div>{''.join(body for _,_,body in sections)}<div class="guide-pagination"><a href="{prev}"><small>PREVIOUS</small><span>{'Quickstart overview' if position==0 else escape(GUIDES[position-1][1])}</span></a><a href="{nxt}"><small>NEXT</small><span>{'Runnable examples' if position==len(GUIDES)-1 else escape(GUIDES[position+1][1])}</span></a></div><div class="reference-provenance"><p>Original guide reproduced under the project’s MIT license. Upstream source remains authoritative.</p><a href="{REPO}/blob/{revision}/docs/{key}.md">View the reviewed source on GitHub ↗</a></div></article><aside class="docs-reading" aria-label="Reading guide"><p class="eyebrow">YOUR PROGRESS</p><div class="reading-track" aria-hidden="true"><span id="docs-reading-fill"></span></div><p class="reading-position" id="docs-reading-label">Reading this guide</p><p class="eyebrow">KEEP EXPLORING</p><a href="documentation.html">Quickstart overview</a><a href="docs-architecture.html">Architecture</a><a href="docs-api-reference.html">Complete API map</a><a class="back-top" href="#top">Back to top ↑</a></aside></div>{dialog}</main>'''
    template=metadata(root_page,key,title,desc)
    template=template.replace('<body data-page="documentation">','<body data-page="documentation" class="reference-page">')
    template=re.sub(r'<main id="main">.*?</main>',lambda _:main,template,flags=re.S)
    # The primary navigation marks the documentation area; the library marks this page.
    template=re.sub(r'(<a\s+data-page="documentation"[^>]*?)aria-current="page"',r'\1aria-current="true"',template)
    save(FILES[key],template)
    for id,label,body in [('reading-this-guide',lead,orientation)]+sections:
        paragraph=re.search(r'<p(?![^>]*class="eyebrow")[^>]*>(.*?)</p>',body,re.S)
        search_entries.append({'id':id,'href':FILES[key]+'#'+id,'title':label,'guide':title,'excerpt':text_only(paragraph[1]) if paragraph else desc,'text':(title+' '+text_only(body)).lower()})
    manifest.append({'source':'docs/'+key+'.md','page':FILES[key],'title':title,'sha256':hashlib.sha256(source.encode()).hexdigest(),'sourceHeadings':[label for _,label in headings],'sections':[id for id,_,_ in sections]})
save('docs/README.md',(args.source/'docs/README.md').read_text())
save('docs/manifest.json',json.dumps({'revision':revision,'guides':manifest},indent=2)+'\n')
save('assets/js/docs-search-data.js','/* Generated from reviewed visible documentation. */\nwindow.EVERYO_DOC_INDEX = '+json.dumps(search_entries,ensure_ascii=False,separators=(',',':'))+';\n')
if args.check:
    stale=[path for path,text in outputs.items() if not (ROOT/path).exists() or (ROOT/path).read_text()!=text]
    if stale:parser.exit(1,'Stale documentation outputs: '+', '.join(stale)+'\n')
    print(f'PASS: {len(GUIDES)} full guides, source downloads, and {len(search_entries)} search entries match the reviewed source')
else:
    for path,text in outputs.items():(ROOT/path).parent.mkdir(parents=True,exist_ok=True);(ROOT/path).write_text(text)
    print(f'Published {len(GUIDES)} complete guides and {len(search_entries)} searchable sections')
