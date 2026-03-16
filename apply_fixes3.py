import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'C:\Users\DJ\Desktop\career\files (33)\career-os-backend\career-os-v2.html'

with open(file_path, encoding='utf-8-sig') as f:
    content = f.read()

print(f"File loaded. Length: {len(content)} chars")

# Helper: convert emoji/unicode to garbled form as stored in file
def g(text):
    """Convert text with emojis to the garbled form stored in file"""
    result = ''
    for char in text:
        code = ord(char)
        if code < 0x80:
            result += char  # ASCII unchanged
        else:
            utf8_bytes = char.encode('utf-8')
            for b in utf8_bytes:
                try:
                    result += bytes([b]).decode('cp1252')
                except:
                    result += bytes([b]).decode('latin-1')
    return result

# Verify line endings
if '\r\n' in content:
    print("WARNING: File has CRLF line endings!")
else:
    print("File uses LF line endings only.")

replacements = []
total_count = 0

# REPLACEMENT 1 — Country dropdown
old1 = ('      <select class="job-country-select" id="jh-country" onchange="updateCountryHint()">\n'
        '        <option>United States</option><option>United Kingdom</option><option>Canada</option>\n'
        '        <option>Germany</option><option>Australia</option><option>Netherlands</option>\n'
        '        <option>Switzerland</option><option>Sweden</option><option>Denmark</option>\n'
        '        <option>Singapore</option><option>Japan</option>\n'
        '      </select>')

new1 = ('      <select class="job-country-select" id="jh-country" onchange="onCountryChange()">\n'
        '        <option value="all">\U0001f30d All Countries</option>\n'
        '        <option value="usa" selected>\U0001f1fa\U0001f1f8 United States</option>\n'
        '        <option value="uk">\U0001f1ec\U0001f1e7 United Kingdom</option>\n'
        '        <option value="germany">\U0001f1e9\U0001f1ea Germany</option>\n'
        '        <option value="canada">\U0001f1e8\U0001f1e6 Canada</option>\n'
        '        <option value="australia">\U0001f1e6\U0001f1fa Australia</option>\n'
        '        <option value="netherlands">\U0001f1f3\U0001f1f1 Netherlands</option>\n'
        '        <option value="switzerland">\U0001f1e8\U0001f1ed Switzerland</option>\n'
        '        <option value="sweden">\U0001f1f8\U0001f1ea Sweden</option>\n'
        '        <option value="denmark">\U0001f1e9\U0001f1f0 Denmark</option>\n'
        '        <option value="singapore">\U0001f1f8\U0001f1ec Singapore</option>\n'
        '        <option value="japan">\U0001f1ef\U0001f1f5 Japan</option>\n'
        '      </select>')

replacements.append(('REPLACEMENT 1', old1, new1))

# REPLACEMENT 2 — DJ controls
old2 = ('    <div id="jh-dj-controls">\n'
        '      <button class="btn btn-primary" onclick="searchJobs()" id="jh-search-btn">'
        + g('\U0001f50d') +
        ' Search Remote CISA Jobs</button>\n'
        '      <span style="font-size:11px;color:var(--text-muted);margin-left:10px">Web Search '
        + g('\u00b7') + ' USA ' + g('\u00b7') + ' Remote ' + g('\u00b7') + ' CISA / SOX / ITGC</span>\n'
        '    </div>')

new2 = ('    <div id="jh-dj-controls" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">\n'
        '      <button class="btn btn-primary" onclick="searchJobs()" id="jh-search-btn">\U0001f50d Search Remote CISA Jobs</button>\n'
        '      <div style="padding:5px 12px;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.25);border-radius:20px;font-size:11px;font-weight:700;color:#06b6d4">\U0001f310 Remote Only</div>\n'
        '      <select id="jh-sort" onchange="setSort(this.value)" style="padding:6px 12px;background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:8px;color:var(--text-secondary);font-size:12px;cursor:pointer;outline:none">\n'
        '        <option value="fit">Best Match \u25bc</option>\n'
        '        <option value="newest">Newest First</option>\n'
        '        <option value="salary">Salary High\u2013Low</option>\n'
        '        <option value="company">Company A\u2013Z</option>\n'
        '      </select>\n'
        '      <span style="font-size:10px;color:var(--text-muted)">CISA \u00b7 SOX \u00b7 IT Audit</span>\n'
        '    </div>')

replacements.append(('REPLACEMENT 2', old2, new2))

# REPLACEMENT 3 — JH state
old3 = ("const JH = {\n"
        "  dj: { jobs:[], page:1, cat:'ALL', loading:false, lastRefresh:null },\n"
        "  pj: { jobs:[], page:1, cat:'ALL', loading:false, lastRefresh:null }\n"
        "};")

new3 = ("const JH = {\n"
        "  dj: { jobs:[], page:1, cat:'ALL', sort:'fit', loading:false, lastRefresh:null },\n"
        "  pj: { jobs:[], page:1, cat:'ALL', sort:'fit', loading:false, lastRefresh:null }\n"
        "};")

replacements.append(('REPLACEMENT 3', old3, new3))

# REPLACEMENT 4 — renderJobCards filtered logic
old4 = ("  const filtered=state.cat==='ALL'?state.jobs:state.jobs.filter(j=>j.category===state.cat);\n"
        "  const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));\n"
        "  if(state.page>totalPages)state.page=totalPages;\n"
        "  const paged=filtered.slice((state.page-1)*PER_PAGE,state.page*PER_PAGE);\n"
        "  const infoEl=document.getElementById('jh-results-info');\n"
        "  if(filtered.length>0){infoEl.style.display='block';infoEl.textContent=`${filtered.length} position${filtered.length!==1?'s':''} "
        + g('\u00b7') +
        " Page ${state.page}/${totalPages}`;}\n"
        "  else infoEl.style.display='none';")

new4 = ("  let filtered=state.cat==='ALL'?[...state.jobs]:state.jobs.filter(j=>j.category===state.cat);\n"
        "  if(!isPJ){const srt=state.sort||'fit';filtered.sort((a,b)=>srt==='fit'?(b.fitScore||0)-(a.fitScore||0):srt==='newest'?(b.postedDate||'').localeCompare(a.postedDate||''):srt==='salary'?(parseInt((b.salary||'').replace(/[^0-9]/g,''))||0)-(parseInt((a.salary||'').replace(/[^0-9]/g,''))||0):srt==='company'?(a.company||'').localeCompare(b.company||''):0);}\n"
        "  const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));\n"
        "  if(state.page>totalPages)state.page=totalPages;\n"
        "  const paged=filtered.slice((state.page-1)*PER_PAGE,state.page*PER_PAGE);\n"
        "  const infoEl=document.getElementById('jh-results-info');\n"
        "  if(filtered.length>0){\n"
        "    infoEl.style.display='block';\n"
        "    const refreshTime=state.lastRefresh?state.lastRefresh.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';\n"
        "    if(isPJ){\n"
        "      const cval=(document.getElementById('jh-country')?.value||'usa');\n"
        "      const cLabel={all:'Global',usa:'USA',uk:'UK',germany:'Germany',canada:'Canada',australia:'Australia',netherlands:'Netherlands',switzerland:'Switzerland',sweden:'Sweden',denmark:'Denmark',singapore:'Singapore',japan:'Japan'}[cval]||cval.toUpperCase();\n"
        "      const catLabel=state.cat==='INDUSTRY'?'Industry Only':state.cat==='ACADEMIA'?'Academia Only':'Industry + Academia';\n"
        "      infoEl.textContent=`${filtered.length} research position${filtered.length!==1?'s':''} \u00b7 ${cLabel} \u00b7 ${catLabel}${refreshTime?' \u00b7 Updated '+refreshTime:''} \u00b7 Page ${state.page}/${totalPages}`;\n"
        "    } else {\n"
        "      const sortEl=document.getElementById('jh-sort');\n"
        "      const sortLbl=sortEl?sortEl.options[sortEl.selectedIndex]?.text||'Best Match':'Best Match';\n"
        "      infoEl.textContent=`${filtered.length} remote IT audit position${filtered.length!==1?'s':''} \u00b7 USA \u00b7 ${sortLbl}${refreshTime?' \u00b7 Updated '+refreshTime:''} \u00b7 Page ${state.page}/${totalPages}`;\n"
        "    }\n"
        "  } else infoEl.style.display='none';")

replacements.append(('REPLACEMENT 4', old4, new4))

# REPLACEMENT 5 — EY badge
old5 = ('      <div class="job-badges">${isPJ&&job.category?`<span class="jbadge ${job.category===\'INDUSTRY\'?\'jbadge-industry\':\'jbadge-academia\'}">${job.category===\'INDUSTRY\'?\''
        + g('\U0001f3ed') +
        ' INDUSTRY\':\''
        + g('\U0001f393') +
        ' ACADEMIA\'}</span>`:\'\'}<span class="jbadge ${wmCls}">${wm}</span>${job.salary?`<span class="jbadge jbadge-salary">${escHtml(job.salary)}</span>`:\'\'}</div>')

new5 = ('      <div class="job-badges">${isPJ&&job.category?`<span class="jbadge ${job.category===\'INDUSTRY\'?\'jbadge-industry\':\'jbadge-academia\'}">${job.category===\'INDUSTRY\'?\''
        '\U0001f3ed INDUSTRY\':\''
        '\U0001f393 ACADEMIA\'}</span>`:\'\'}<span class="jbadge ${wmCls}">${wm}</span>${job.salary?`<span class="jbadge jbadge-salary">${escHtml(job.salary)}</span>`:\'\'} ${!isPJ&&job.eyConnection?`<span class="jbadge" style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.3)">\u2b50 EY Alumni Advantage</span>`:\'\'}</div>')

replacements.append(('REPLACEMENT 5', old5, new5))

# REPLACEMENT 6 — renderJobHub auto-search
old6 = ("function renderJobHub(){\n"
        "  const isPJ=currentProfile==='pj';\n"
        "  document.getElementById('jh-title').textContent=`Job Hub "
        + g('\u2014') +
        " ${isPJ?'Pooja':'DJ'}`;\n"
        "  document.getElementById('jh-sub').textContent=isPJ?'Real active research positions "
        + g('\u00b7') + " AI-scored " + g('\u00b7') + " Industry & Academia " + g('\u00b7') + " 11 countries':'Real active remote IT audit positions "
        + g('\u00b7') + " AI-scored against DJ profile " + g('\u00b7') + " USA " + g('\u00b7') + " Strict isolation';\n"
        "  document.getElementById('jh-dj-controls').style.display=isPJ?'none':'flex';\n"
        "  document.getElementById('jh-pj-controls').style.display=isPJ?'flex':'none';\n"
        "  renderJobCards();\n"
        "}")

new6 = ("function renderJobHub(){\n"
        "  const isPJ=currentProfile==='pj';\n"
        "  document.getElementById('jh-title').textContent=`Job Hub \u2014 ${isPJ?'Pooja':'DJ'}`;\n"
        "  document.getElementById('jh-sub').textContent=isPJ?'Real active research positions \u00b7 AI-scored \u00b7 Industry & Academia \u00b7 11 countries':'Real active remote IT audit positions \u00b7 AI-scored against DJ profile \u00b7 USA \u00b7 Strict isolation';\n"
        "  document.getElementById('jh-dj-controls').style.display=isPJ?'none':'flex';\n"
        "  document.getElementById('jh-pj-controls').style.display=isPJ?'flex':'none';\n"
        "  renderJobCards();\n"
        "  if(JH[currentProfile].jobs.length===0 && !JH[currentProfile].loading){searchJobs();}\n"
        "}")

replacements.append(('REPLACEMENT 6', old6, new6))

# REPLACEMENT 7 — switchProfile
old7 = ("function switchProfile(id) {\n"
        "  currentProfile = id;\n"
        "  document.querySelectorAll('.psw').forEach(b => b.classList.remove('active'));\n"
        "  document.querySelector(`.psw.${id}`).classList.add('active');\n"
        "  const p = PROFILES[id];\n"
        "  document.getElementById('avatar').className = `avatar av-${id}`;\n"
        "  document.getElementById('avatar').textContent = p.initials;\n"
        "  document.getElementById('uname').textContent = p.name;\n"
        "  document.getElementById('utitle').textContent = p.title;\n"
        "  refreshAll();\n"
        "}")

new7 = ("function switchProfile(id) {\n"
        "  currentProfile = id;\n"
        "  document.querySelectorAll('.psw').forEach(b => b.classList.remove('active'));\n"
        "  document.querySelector(`.psw.${id}`).classList.add('active');\n"
        "  const p = PROFILES[id];\n"
        "  document.getElementById('avatar').className = `avatar av-${id}`;\n"
        "  document.getElementById('avatar').textContent = p.initials;\n"
        "  document.getElementById('uname').textContent = p.name;\n"
        "  document.getElementById('utitle').textContent = p.title;\n"
        "  // Reset job hub state for new profile so auto-search fires\n"
        "  JH[id].jobs=[]; JH[id].page=1; JH[id].cat='ALL'; JH[id].sort='fit';\n"
        "  // If on job hub view, refresh country dropdown default for Pooja\n"
        "  if(id==='pj'){const sel=document.getElementById('jh-country');if(sel&&sel.value==='')sel.value='usa';}\n"
        "  refreshAll();\n"
        "}")

replacements.append(('REPLACEMENT 7', old7, new7))

# REPLACEMENT 8 — Add missing functions before toggleAutoRefresh
old8 = 'function toggleAutoRefresh(){'

new8 = ("function refreshAll(){\n"
        "  renderJobHub();\n"
        "  if(document.getElementById('view-tracker')?.classList.contains('active'))renderTracker();\n"
        "}\n"
        "function setSort(s){JH[currentProfile].sort=s;JH[currentProfile].page=1;renderJobCards();}\n"
        "function onCountryChange(){\n"
        "  const c=document.getElementById('jh-country')?.value||'usa';\n"
        "  const hints={all:'Global \u00b7 US + UK combined',usa:'USA \u00b7 Adzuna live',uk:'UK \u00b7 Adzuna live',germany:'Germany \u00b7 Adzuna',canada:'Canada \u00b7 Adzuna',australia:'Australia \u00b7 Adzuna',netherlands:'Netherlands \u00b7 Adzuna',switzerland:'Switzerland \u00b7 Adzuna',sweden:'Sweden \u00b7 Adzuna',denmark:'Denmark \u00b7 Adzuna',singapore:'Singapore \u00b7 Adzuna',japan:'Japan \u00b7 Adzuna'};\n"
        "  const hintEl=document.getElementById('jh-country-hint');\n"
        "  if(hintEl)hintEl.textContent=`${hints[c]||c} \u00b7 All work modes \u00b7 Industry + Academia`;\n"
        "  JH[currentProfile].jobs=[];JH[currentProfile].page=1;JH[currentProfile].cat='ALL';\n"
        "  renderJobCards();searchJobs();\n"
        "}\n"
        "function toggleAutoRefresh(){")

replacements.append(('REPLACEMENT 8', old8, new8))

# Apply all replacements
errors = []
for name, old, new in replacements:
    count = content.count(old)
    if count == 0:
        first_line = old.strip().split('\n')[0].strip()[:70]
        idx = content.find(first_line)
        if idx == -1:
            print(f"ERROR: {name} — NOT FOUND. First line not found: {repr(first_line)}")
        else:
            print(f"ERROR: {name} — NOT FOUND (first line at {idx})")
            print(f"  Expected: {repr(old[:150])}")
            print(f"  Found:    {repr(content[idx:idx+150])}")
        errors.append(name)
    elif count > 1:
        print(f"WARNING: {name} — found {count} occurrences. Replacing all.")
        content = content.replace(old, new)
        total_count += count
        print(f"  OK: {name} — replaced {count} occurrences")
    else:
        content = content.replace(old, new)
        total_count += 1
        print(f"  OK: {name} — replaced 1 occurrence")

if errors:
    print(f"\nFAILED: {len(errors)} replacement(s) failed: {errors}")
    print("File NOT written.")
else:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\nSUCCESS: All {total_count} replacements applied.")
    print(f"File written to: {file_path}")
