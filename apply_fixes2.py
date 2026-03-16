import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'C:\Users\DJ\Desktop\career\files (33)\career-os-backend\career-os-v2.html'

with open(file_path, encoding='utf-8-sig') as f:
    content = f.read()

print(f"File loaded. Length: {len(content)} chars")

# Helper: convert emoji/unicode to garbled form as stored in file
# (UTF-8 bytes re-interpreted as cp1252/latin-1, then stored as UTF-8)
def g(text):
    """Convert text with emojis to the garbled form stored in file"""
    result = ''
    for char in text:
        code = ord(char)
        if code < 0x80:
            result += char  # ASCII unchanged
        else:
            # Get UTF-8 bytes, then decode each byte as cp1252/latin-1
            utf8_bytes = char.encode('utf-8')
            for b in utf8_bytes:
                try:
                    result += bytes([b]).decode('cp1252')
                except:
                    result += bytes([b]).decode('latin-1')
    return result

# New strings use proper unicode (will be written as clean UTF-8)
# Old strings must match the garbled content in the file

replacements = []
total_count = 0

# REPLACEMENT 1 — Country dropdown
# Already succeeded in previous run, but let's verify and skip if already done
old1 = '''      <select class="job-country-select" id="jh-country" onchange="updateCountryHint()">\r\n        <option>United States</option><option>United Kingdom</option><option>Canada</option>\r\n        <option>Germany</option><option>Australia</option><option>Netherlands</option>\r\n        <option>Switzerland</option><option>Sweden</option><option>Denmark</option>\r\n        <option>Singapore</option><option>Japan</option>\r\n      </select>'''

new1 = '      <select class="job-country-select" id="jh-country" onchange="onCountryChange()">\r\n        <option value="all">\U0001f30d All Countries</option>\r\n        <option value="usa" selected>\U0001f1fa\U0001f1f8 United States</option>\r\n        <option value="uk">\U0001f1ec\U0001f1e7 United Kingdom</option>\r\n        <option value="germany">\U0001f1e9\U0001f1ea Germany</option>\r\n        <option value="canada">\U0001f1e8\U0001f1e6 Canada</option>\r\n        <option value="australia">\U0001f1e6\U0001f1fa Australia</option>\r\n        <option value="netherlands">\U0001f1f3\U0001f1f1 Netherlands</option>\r\n        <option value="switzerland">\U0001f1e8\U0001f1ed Switzerland</option>\r\n        <option value="sweden">\U0001f1f8\U0001f1ea Sweden</option>\r\n        <option value="denmark">\U0001f1e9\U0001f1f0 Denmark</option>\r\n        <option value="singapore">\U0001f1f8\U0001f1ec Singapore</option>\r\n        <option value="japan">\U0001f1ef\U0001f1f5 Japan</option>\r\n      </select>'

replacements.append(('REPLACEMENT 1', old1, new1))

# REPLACEMENT 2 — DJ controls
# File uses \r\n, garbled emoji for 🔍, and garbled · (Â·)
old2 = ('    <div id="jh-dj-controls">\r\n'
        '      <button class="btn btn-primary" onclick="searchJobs()" id="jh-search-btn">'
        + g('\U0001f50d') +
        ' Search Remote CISA Jobs</button>\r\n'
        '      <span style="font-size:11px;color:var(--text-muted);margin-left:10px">Web Search '
        + g('\u00b7') +
        ' USA ' + g('\u00b7') + ' Remote ' + g('\u00b7') + ' CISA / SOX / ITGC</span>\r\n'
        '    </div>')

new2 = ('    <div id="jh-dj-controls" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">\r\n'
        '      <button class="btn btn-primary" onclick="searchJobs()" id="jh-search-btn">'
        '\U0001f50d Search Remote CISA Jobs</button>\r\n'
        '      <div style="padding:5px 12px;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.25);border-radius:20px;font-size:11px;font-weight:700;color:#06b6d4">'
        '\U0001f310 Remote Only</div>\r\n'
        '      <select id="jh-sort" onchange="setSort(this.value)" style="padding:6px 12px;background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:8px;color:var(--text-secondary);font-size:12px;cursor:pointer;outline:none">\r\n'
        '        <option value="fit">Best Match \u25bc</option>\r\n'
        '        <option value="newest">Newest First</option>\r\n'
        '        <option value="salary">Salary High\u2013Low</option>\r\n'
        '        <option value="company">Company A\u2013Z</option>\r\n'
        '      </select>\r\n'
        '      <span style="font-size:10px;color:var(--text-muted)">CISA \u00b7 SOX \u00b7 IT Audit</span>\r\n'
        '    </div>')

replacements.append(('REPLACEMENT 2', old2, new2))

# REPLACEMENT 3 — JH state (already succeeded but include for completeness check)
old3 = ("const JH = {\r\n"
        "  dj: { jobs:[], page:1, cat:'ALL', loading:false, lastRefresh:null },\r\n"
        "  pj: { jobs:[], page:1, cat:'ALL', loading:false, lastRefresh:null }\r\n"
        "};")

new3 = ("const JH = {\r\n"
        "  dj: { jobs:[], page:1, cat:'ALL', sort:'fit', loading:false, lastRefresh:null },\r\n"
        "  pj: { jobs:[], page:1, cat:'ALL', sort:'fit', loading:false, lastRefresh:null }\r\n"
        "};")

replacements.append(('REPLACEMENT 3', old3, new3))

# REPLACEMENT 4 — renderJobCards filtered logic
old4 = ("  const filtered=state.cat==='ALL'?state.jobs:state.jobs.filter(j=>j.category===state.cat);\r\n"
        "  const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));\r\n"
        "  if(state.page>totalPages)state.page=totalPages;\r\n"
        "  const paged=filtered.slice((state.page-1)*PER_PAGE,state.page*PER_PAGE);\r\n"
        "  const infoEl=document.getElementById('jh-results-info');\r\n"
        "  if(filtered.length>0){infoEl.style.display='block';infoEl.textContent=`${filtered.length} position${filtered.length!==1?'s':''} "
        + g('\u00b7') +
        " Page ${state.page}/${totalPages}`;}\r\n"
        "  else infoEl.style.display='none';")

new4 = ("  let filtered=state.cat==='ALL'?[...state.jobs]:state.jobs.filter(j=>j.category===state.cat);\r\n"
        "  if(!isPJ){const srt=state.sort||'fit';filtered.sort((a,b)=>srt==='fit'?(b.fitScore||0)-(a.fitScore||0):srt==='newest'?(b.postedDate||'').localeCompare(a.postedDate||''):srt==='salary'?(parseInt((b.salary||'').replace(/[^0-9]/g,''))||0)-(parseInt((a.salary||'').replace(/[^0-9]/g,''))||0):srt==='company'?(a.company||'').localeCompare(b.company||''):0);}\r\n"
        "  const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));\r\n"
        "  if(state.page>totalPages)state.page=totalPages;\r\n"
        "  const paged=filtered.slice((state.page-1)*PER_PAGE,state.page*PER_PAGE);\r\n"
        "  const infoEl=document.getElementById('jh-results-info');\r\n"
        "  if(filtered.length>0){\r\n"
        "    infoEl.style.display='block';\r\n"
        "    const refreshTime=state.lastRefresh?state.lastRefresh.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';\r\n"
        "    if(isPJ){\r\n"
        "      const cval=(document.getElementById('jh-country')?.value||'usa');\r\n"
        "      const cLabel={all:'Global',usa:'USA',uk:'UK',germany:'Germany',canada:'Canada',australia:'Australia',netherlands:'Netherlands',switzerland:'Switzerland',sweden:'Sweden',denmark:'Denmark',singapore:'Singapore',japan:'Japan'}[cval]||cval.toUpperCase();\r\n"
        "      const catLabel=state.cat==='INDUSTRY'?'Industry Only':state.cat==='ACADEMIA'?'Academia Only':'Industry + Academia';\r\n"
        "      infoEl.textContent=`${filtered.length} research position${filtered.length!==1?'s':''} \u00b7 ${cLabel} \u00b7 ${catLabel}${refreshTime?' \u00b7 Updated '+refreshTime:''} \u00b7 Page ${state.page}/${totalPages}`;\r\n"
        "    } else {\r\n"
        "      const sortEl=document.getElementById('jh-sort');\r\n"
        "      const sortLbl=sortEl?sortEl.options[sortEl.selectedIndex]?.text||'Best Match':'Best Match';\r\n"
        "      infoEl.textContent=`${filtered.length} remote IT audit position${filtered.length!==1?'s':''} \u00b7 USA \u00b7 ${sortLbl}${refreshTime?' \u00b7 Updated '+refreshTime:''} \u00b7 Page ${state.page}/${totalPages}`;\r\n"
        "    }\r\n"
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
old6 = ("function renderJobHub(){\r\n"
        "  const isPJ=currentProfile==='pj';\r\n"
        "  document.getElementById('jh-title').textContent=`Job Hub "
        + g('\u2014') +
        " ${isPJ?'Pooja':'DJ'}`;\r\n"
        "  document.getElementById('jh-sub').textContent=isPJ?'Real active research positions "
        + g('\u00b7') + " AI-scored " + g('\u00b7') + " Industry & Academia " + g('\u00b7') + " 11 countries':'Real active remote IT audit positions "
        + g('\u00b7') + " AI-scored against DJ profile " + g('\u00b7') + " USA " + g('\u00b7') + " Strict isolation';\r\n"
        "  document.getElementById('jh-dj-controls').style.display=isPJ?'none':'flex';\r\n"
        "  document.getElementById('jh-pj-controls').style.display=isPJ?'flex':'none';\r\n"
        "  renderJobCards();\r\n"
        "}")

new6 = ("function renderJobHub(){\r\n"
        "  const isPJ=currentProfile==='pj';\r\n"
        "  document.getElementById('jh-title').textContent=`Job Hub \u2014 ${isPJ?'Pooja':'DJ'}`;\r\n"
        "  document.getElementById('jh-sub').textContent=isPJ?'Real active research positions \u00b7 AI-scored \u00b7 Industry & Academia \u00b7 11 countries':'Real active remote IT audit positions \u00b7 AI-scored against DJ profile \u00b7 USA \u00b7 Strict isolation';\r\n"
        "  document.getElementById('jh-dj-controls').style.display=isPJ?'none':'flex';\r\n"
        "  document.getElementById('jh-pj-controls').style.display=isPJ?'flex':'none';\r\n"
        "  renderJobCards();\r\n"
        "  if(JH[currentProfile].jobs.length===0 && !JH[currentProfile].loading){searchJobs();}\r\n"
        "}")

replacements.append(('REPLACEMENT 6', old6, new6))

# REPLACEMENT 7 — switchProfile (already succeeded)
old7 = ("function switchProfile(id) {\r\n"
        "  currentProfile = id;\r\n"
        "  document.querySelectorAll('.psw').forEach(b => b.classList.remove('active'));\r\n"
        "  document.querySelector(`.psw.${id}`).classList.add('active');\r\n"
        "  const p = PROFILES[id];\r\n"
        "  document.getElementById('avatar').className = `avatar av-${id}`;\r\n"
        "  document.getElementById('avatar').textContent = p.initials;\r\n"
        "  document.getElementById('uname').textContent = p.name;\r\n"
        "  document.getElementById('utitle').textContent = p.title;\r\n"
        "  refreshAll();\r\n"
        "}")

new7 = ("function switchProfile(id) {\r\n"
        "  currentProfile = id;\r\n"
        "  document.querySelectorAll('.psw').forEach(b => b.classList.remove('active'));\r\n"
        "  document.querySelector(`.psw.${id}`).classList.add('active');\r\n"
        "  const p = PROFILES[id];\r\n"
        "  document.getElementById('avatar').className = `avatar av-${id}`;\r\n"
        "  document.getElementById('avatar').textContent = p.initials;\r\n"
        "  document.getElementById('uname').textContent = p.name;\r\n"
        "  document.getElementById('utitle').textContent = p.title;\r\n"
        "  // Reset job hub state for new profile so auto-search fires\r\n"
        "  JH[id].jobs=[]; JH[id].page=1; JH[id].cat='ALL'; JH[id].sort='fit';\r\n"
        "  // If on job hub view, refresh country dropdown default for Pooja\r\n"
        "  if(id==='pj'){const sel=document.getElementById('jh-country');if(sel&&sel.value==='')sel.value='usa';}\r\n"
        "  refreshAll();\r\n"
        "}")

replacements.append(('REPLACEMENT 7', old7, new7))

# REPLACEMENT 8 — Add missing functions before toggleAutoRefresh (already succeeded)
old8 = 'function toggleAutoRefresh(){'

new8 = ("function refreshAll(){\r\n"
        "  renderJobHub();\r\n"
        "  if(document.getElementById('view-tracker')?.classList.contains('active'))renderTracker();\r\n"
        "}\r\n"
        "function setSort(s){JH[currentProfile].sort=s;JH[currentProfile].page=1;renderJobCards();}\r\n"
        "function onCountryChange(){\r\n"
        "  const c=document.getElementById('jh-country')?.value||'usa';\r\n"
        "  const hints={all:'Global \u00b7 US + UK combined',usa:'USA \u00b7 Adzuna live',uk:'UK \u00b7 Adzuna live',germany:'Germany \u00b7 Adzuna',canada:'Canada \u00b7 Adzuna',australia:'Australia \u00b7 Adzuna',netherlands:'Netherlands \u00b7 Adzuna',switzerland:'Switzerland \u00b7 Adzuna',sweden:'Sweden \u00b7 Adzuna',denmark:'Denmark \u00b7 Adzuna',singapore:'Singapore \u00b7 Adzuna',japan:'Japan \u00b7 Adzuna'};\r\n"
        "  const hintEl=document.getElementById('jh-country-hint');\r\n"
        "  if(hintEl)hintEl.textContent=`${hints[c]||c} \u00b7 All work modes \u00b7 Industry + Academia`;\r\n"
        "  JH[currentProfile].jobs=[];JH[currentProfile].page=1;JH[currentProfile].cat='ALL';\r\n"
        "  renderJobCards();searchJobs();\r\n"
        "}\r\n"
        "function toggleAutoRefresh(){")

replacements.append(('REPLACEMENT 8', old8, new8))

# Apply all replacements
errors = []
for name, old, new in replacements:
    count = content.count(old)
    if count == 0:
        # Debug: find first line
        first_line = old.strip().split('\n')[0].strip()[:60]
        idx = content.find(first_line)
        if idx == -1:
            print(f"ERROR: {name} — old string NOT FOUND. First line also not found: {repr(first_line)}")
        else:
            print(f"ERROR: {name} — old string NOT FOUND (first line at {idx})")
            print(f"  Expected: {repr(old[:100])}")
            print(f"  Found:    {repr(content[idx:idx+100])}")
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
