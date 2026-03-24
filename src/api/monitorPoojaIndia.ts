/**
 * api/monitorPoojaIndia.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pooja India Career Monitor — isolated from DJ's monitor entirely.
 * Mounted at: /api/monitor/pooja-india/*
 *
 * Uses Serper API to search Indian government/research portals for relevant
 * Scientist / Faculty / Scientific Officer openings. Stores results in
 * pooja_india_monitor_jobs (separate table, zero crossover with DJ tables).
 *
 * Endpoints:
 *   GET  /api/monitor/pooja-india/jobs        — cached results (filterable)
 *   POST /api/monitor/pooja-india/scan        — trigger fresh Serper scan
 *   DELETE /api/monitor/pooja-india/jobs/:id  — dismiss a job (applied / done)
 *   GET  /api/monitor/pooja-india/status      — last scan time + counts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db/client'
import crypto from 'crypto'

const router = Router()

// ─── Portal registry (non-fellowship only) ────────────────────────────────────

interface MonitorPortal {
  id:       string
  name:     string
  category: 'central-govt' | 'state-psc' | 'academia' | 'aggregator'
  query:    string   // Serper search query
}

const POOJA_INDIA_PORTALS: MonitorPortal[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTRAL GOVT — Core Bodies
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'icmr', name: 'ICMR', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR advertisement) 2026 (site:icmr.nic.in OR site:recruitment.icmr.org.in)',
  },
  {
    id: 'csir', name: 'CSIR HQ', category: 'central-govt',
    // -intitle:results blocks the noisy "Recruitments & Results" index page
    query: 'intitle:(scientist OR "senior scientist" OR recruitment OR vacancy OR advertisement) -intitle:results -intitle:career 2026 (site:csir.res.in OR site:csirhrdg.res.in)',
  },
  {
    id: 'thsti', name: 'THSTI Faridabad', category: 'central-govt',
    // -intitle:result -intitle:shortlisted blocks result/shortlist announcement pages
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR position) -intitle:result -intitle:shortlisted -intitle:"list of" 2026 site:thsti.res.in',
  },
  {
    id: 'nii', name: 'NII Delhi', category: 'central-govt',
    // -intitle:results blocks walk-in-interview results; -intitle:programme blocks generic postdoc programme page
    query: 'intitle:(scientist OR "staff scientist" OR "project scientist" OR recruitment OR vacancy OR advertisement) -intitle:results -intitle:programme -intitle:"post-doctoral" 2026 site:nii.res.in',
  },
  {
    id: 'nbrc', name: 'NBRC Manesar', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening) 2026 site:nbrc.ac.in',
  },
  {
    id: 'nipgr', name: 'NIPGR Delhi', category: 'central-govt',
    query: 'intitle:(scientist OR "research associate" OR recruitment OR vacancy OR opening OR position) 2026 site:nipgr.ac.in',
  },
  {
    id: 'drdo', name: 'DRDO CEPTAM', category: 'central-govt',
    query: 'intitle:(scientist OR CEPTAM OR recruitment OR vacancy OR advertisement) (biology OR "life science" OR biomedical) 2026 site:drdo.gov.in',
  },
  {
    id: 'drdo-bio-labs', name: 'DRDO Bio Labs', category: 'central-govt',
    // INMAS / DIPAS / DIBER / DFRL — DRDO institutes relevant to life sciences
    query: 'intitle:(scientist OR "scientific officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 (site:inmas.drdo.in OR site:dipas.drdo.in OR site:diber.drdo.in OR site:dfrl.drdo.in)',
  },
  {
    id: 'icar', name: 'ICAR HQ', category: 'central-govt',
    query: 'intitle:(scientist OR ARS OR "agricultural research" OR recruitment OR vacancy OR advertisement) 2026 site:icar.org.in',
  },
  {
    id: 'aiims-delhi', name: 'AIIMS Delhi', category: 'central-govt',
    // -intitle:fellowship -intitle:programme block "Fellowship Programme January 2026" noise
    query: 'intitle:(scientist OR faculty OR "assistant professor" OR "associate professor" OR recruitment OR vacancy OR advertisement) -intitle:fellowship -intitle:programme -intitle:phd 2026 site:aiims.edu',
  },
  {
    id: 'aiims-new-1', name: 'AIIMS (Bhopal/Bhubaneswar/Jodhpur/Patna)', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 (site:aiimsbhopal.edu.in OR site:aiimsbhubaneswar.edu.in OR site:aiimsjodhpur.edu.in OR site:aiimspatna.edu.in)',
  },
  {
    id: 'aiims-new-2', name: 'AIIMS (Raipur/Rishikesh/Nagpur/Bathinda)', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 (site:aiimsraipur.edu.in OR site:aiimsrishikesh.edu.in OR site:aiimsnagpur.edu.in OR site:aiimsbathinda.edu.in)',
  },
  {
    id: 'rgcb', name: 'RGCB Thiruvananthapuram', category: 'central-govt',
    // -intitle:admission -intitle:admissions blocks "PhD ADMISSIONS – January 2026" pages
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR advertisement) -intitle:admission -intitle:admissions 2026 site:rgcb.res.in',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CSIR LABORATORY NETWORK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'csir-ccmb', name: 'CSIR-CCMB Hyderabad', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR position OR advertisement) 2026 site:ccmb.res.in',
  },
  {
    id: 'csir-cdri', name: 'CSIR-CDRI Lucknow', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:cdri.res.in',
  },
  {
    id: 'csir-igib', name: 'CSIR-IGIB Delhi', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR position) 2026 site:igib.res.in',
  },
  {
    id: 'csir-imtech', name: 'CSIR-IMTECH Chandigarh', category: 'central-govt',
    query: 'intitle:(scientist OR "research associate" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:imtech.res.in',
  },
  {
    id: 'csir-iicb', name: 'CSIR-IICB Kolkata', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR position OR advertisement) 2026 site:iicb.res.in',
  },
  {
    id: 'csir-ihbt', name: 'CSIR-IHBT Palampur', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR advertisement) 2026 site:ihbt.res.in',
  },
  {
    id: 'csir-nbri', name: 'CSIR-NBRI Lucknow', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nbri.res.in',
  },
  {
    id: 'csir-cimap', name: 'CSIR-CIMAP Lucknow', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR advertisement) 2026 site:cimap.res.in',
  },
  {
    id: 'csir-ncl', name: 'CSIR-NCL Pune', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR recruitment OR vacancy OR opening OR position) (biology OR biochemistry OR biotech) 2026 (site:ncl-india.org OR site:ncl.res.in)',
  },
  {
    id: 'csir-cftri', name: 'CSIR-CFTRI Mysore', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:cftri.res.in',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ICMR INSTITUTE NETWORK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'icmr-nin', name: 'ICMR-NIN Hyderabad', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nin.res.in',
  },
  {
    id: 'icmr-nimr', name: 'ICMR-NIMR Delhi', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nimr.icmr.org.in',
  },
  {
    id: 'icmr-nirt', name: 'ICMR-NIRT Chennai', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nirt.res.in',
  },
  {
    id: 'icmr-niced', name: 'ICMR-NICED Kolkata', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:niced.org.in',
  },
  {
    id: 'icmr-nirrh', name: 'ICMR-NIRRH Mumbai', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 (site:nirrch.res.in OR site:nirrh.res.in)',
  },
  {
    id: 'icmr-nari', name: 'ICMR-NARI Pune', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nari-icmr.res.in',
  },
  {
    id: 'icmr-nireh', name: 'ICMR-NIREH Bhopal', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nireh.icmr.org.in',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ICAR INSTITUTE NETWORK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'icar-iari', name: 'ICAR-IARI Delhi', category: 'central-govt',
    query: 'intitle:(scientist OR ARS OR recruitment OR vacancy OR opening OR advertisement) 2026 site:iari.res.in',
  },
  {
    id: 'icar-ndri', name: 'ICAR-NDRI Karnal', category: 'central-govt',
    query: 'intitle:(scientist OR "research associate" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:ndri.res.in',
  },
  {
    id: 'icar-ivri', name: 'ICAR-IVRI Izatnagar', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:ivri.nic.in',
  },
  {
    id: 'icar-nbfgr', name: 'ICAR-NBFGR Lucknow', category: 'central-govt',
    query: 'intitle:(scientist OR "research associate" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nbfgr.res.in',
  },
  {
    id: 'icar-nbagr', name: 'ICAR-NBAGR Karnal', category: 'central-govt',
    query: 'intitle:(scientist OR "research associate" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nbagr.res.in',
  },
  {
    id: 'icar-cife', name: 'ICAR-CIFE Mumbai', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:cife.edu.in',
  },
  {
    id: 'icar-nbpgr', name: 'ICAR-NBPGR Delhi', category: 'central-govt',
    query: 'intitle:(scientist OR "research associate" OR recruitment OR vacancy OR opening OR advertisement) 2026 site:nbpgr.org.in',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTONOMOUS & APEX RESEARCH INSTITUTES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tifr', name: 'TIFR Mumbai', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR opening OR position) (biology OR "life science" OR biochemistry) 2026 site:tifr.res.in',
  },
  {
    id: 'nccs', name: 'NCCS Pune', category: 'central-govt',
    query: 'intitle:(scientist OR "research associate" OR recruitment OR vacancy OR opening OR advertisement OR position) 2026 site:nccs.res.in',
  },
  {
    id: 'barc', name: 'BARC Mumbai', category: 'central-govt',
    query: 'intitle:(scientist OR "scientific officer" OR recruitment OR vacancy OR advertisement OR opening) (biology OR "life science" OR biochemistry OR bioscience) 2026 site:barc.gov.in',
  },
  {
    id: 'nimhans', name: 'NIMHANS Bengaluru', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 (site:nimhans.ac.in OR site:nimhans.co.in)',
  },
  {
    id: 'sctimst', name: 'SCTIMST Thiruvananthapuram', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 site:sctimst.ac.in',
  },
  {
    id: 'pgimer', name: 'PGIMER Chandigarh', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 site:pgimer.edu.in',
  },
  {
    id: 'jipmer', name: 'JIPMER Pondicherry', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 site:jipmer.edu.in',
  },
  {
    id: 'sgpgims', name: 'SGPGIMS Lucknow', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR "research officer" OR recruitment OR vacancy OR opening OR advertisement) 2026 (site:sgpgims.org.in OR site:sgpgi.ac.in)',
  },
  {
    id: 'actrec', name: 'ACTREC Mumbai', category: 'central-govt',
    query: 'intitle:(scientist OR "research officer" OR faculty OR recruitment OR vacancy OR opening OR advertisement) 2026 site:actrec.gov.in',
  },
  {
    id: 'icgeb', name: 'ICGEB Delhi', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR researcher OR recruitment OR vacancy OR opening OR position) India 2026 site:icgeb.org',
  },
  {
    id: 'zsi-bsi', name: 'ZSI / BSI', category: 'central-govt',
    query: 'intitle:(scientist OR "zoological survey" OR "botanical survey" OR recruitment OR vacancy OR advertisement) 2026 (site:zsi.gov.in OR site:bsi.gov.in)',
  },
  {
    id: 'wii', name: 'WII Dehradun', category: 'central-govt',
    query: 'intitle:(scientist OR faculty OR researcher OR recruitment OR vacancy OR opening OR advertisement) 2026 site:wii.gov.in',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE PSC — All Major States
  // ═══════════════════════════════════════════════════════════════════════════
  // Uttar Pradesh
  {
    id: 'uppsc', name: 'UPPSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR "scientific officer" OR lecturer OR professor OR biology) 2026 site:uppsc.up.nic.in',
  },
  // Madhya Pradesh
  {
    id: 'mppsc', name: 'MPPSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR "scientific officer" OR biology OR "life science") 2026 site:mppsc.mp.gov.in',
  },
  // West Bengal
  {
    id: 'wbpsc', name: 'WBPSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:psc.wb.gov.in',
  },
  // Tamil Nadu
  {
    id: 'tnpsc', name: 'TNPSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (professor OR "assistant professor" OR "scientific officer" OR biology OR "life science") 2026 site:tnpsc.gov.in',
  },
  // Rajasthan
  {
    id: 'rpsc', name: 'RPSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (professor OR "assistant professor" OR "scientific officer" OR biology OR "life science") 2026 site:rpsc.rajasthan.gov.in',
  },
  // Karnataka
  {
    id: 'kpsc', name: 'KPSC Karnataka', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR "scientific officer" OR lecturer OR professor OR biology) 2026 site:kpsc.kar.nic.in',
  },
  // Kerala
  {
    id: 'kscste', name: 'KSCSTE Kerala', category: 'state-psc',
    // -intitle:"selection list" blocks result pages; -intitle:fellowship blocks postdoc programme noise
    query: 'intitle:(scientist OR "junior scientist" OR recruitment OR vacancy OR opening OR advertisement) -intitle:"selection list" -intitle:fellowship -intitle:postdoctoral -intitle:"post-doctoral" 2026 site:kscste.kerala.gov.in',
  },
  // Bihar
  {
    id: 'bpsc', name: 'BPSC Bihar', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "assistant professor" OR "scientific officer" OR biology OR "life science") 2026 site:bpsc.bihar.gov.in',
  },
  // Jharkhand
  {
    id: 'jpsc', name: 'JPSC Jharkhand', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:jpsc.gov.in',
  },
  // Odisha
  {
    id: 'opsc', name: 'OPSC Odisha', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "assistant professor" OR "scientific officer" OR biology OR "life science") 2026 site:opsc.gov.in',
  },
  // Himachal Pradesh
  {
    id: 'hppsc', name: 'HPPSC Himachal', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:hppsc.hp.gov.in',
  },
  // Haryana
  {
    id: 'hpsc', name: 'HPSC Haryana', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:hpsc.gov.in',
  },
  // Punjab
  {
    id: 'ppsc', name: 'PPSC Punjab', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:ppsc.gov.in',
  },
  // Chhattisgarh
  {
    id: 'cgpsc', name: 'CGPSC Chhattisgarh', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:psc.cg.gov.in',
  },
  // Gujarat
  {
    id: 'gpsc-guj', name: 'GPSC Gujarat', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:gpsc.gujarat.gov.in',
  },
  // Andhra Pradesh
  {
    id: 'appsc', name: 'APPSC Andhra Pradesh', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "assistant professor" OR "scientific officer" OR biology OR "life science") 2026 site:psc.ap.gov.in',
  },
  // Telangana
  {
    id: 'tspsc', name: 'TSPSC Telangana', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "assistant professor" OR "scientific officer" OR biology OR "life science") 2026 site:tgpsc.gov.in',
  },
  // Maharashtra
  {
    id: 'mpsc', name: 'MPSC Maharashtra', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:mpsc.gov.in',
  },
  // Assam
  {
    id: 'apsc', name: 'APSC Assam', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:apsc.nic.in',
  },
  // Jammu & Kashmir
  {
    id: 'jkpsc', name: 'JKPSC J&K', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:jkpsc.nic.in',
  },
  // Uttarakhand
  {
    id: 'ukpsc', name: 'UKPSC Uttarakhand', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:ukpsc.gov.in',
  },
  // Goa
  {
    id: 'gpsc-goa', name: 'Goa PSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology OR "life science") 2026 site:gpsc.goa.gov.in',
  },
  // Manipur
  {
    id: 'manipur-psc', name: 'Manipur PSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology) 2026 site:mpscmanipur.gov.in',
  },
  // Nagaland
  {
    id: 'nagaland-psc', name: 'Nagaland PSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology) 2026 site:npsc.nagaland.gov.in',
  },
  // Tripura
  {
    id: 'tripura-psc', name: 'Tripura PSC', category: 'state-psc',
    query: 'intitle:(recruitment OR vacancy OR advertisement OR notification) (scientist OR professor OR "scientific officer" OR biology) 2026 site:tpsc.tripura.gov.in',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACADEMIA — IITs, IISERs, NISER, NIT, Central & Deemed Universities
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'iit-a', name: 'IIT (Delhi/Bombay/Madras/Kanpur)', category: 'academia',
    query: 'intitle:("assistant professor" OR "associate professor" OR faculty OR recruitment OR vacancy OR opening OR advertisement) (biosciences OR biology OR biochemistry OR biomedical) 2026 (site:iitd.ac.in OR site:iitb.ac.in OR site:iitm.ac.in OR site:iitk.ac.in)',
  },
  {
    id: 'iit-b', name: 'IIT (Kharagpur/Hyderabad/Gandhinagar/Roorkee)', category: 'academia',
    query: 'intitle:("assistant professor" OR "associate professor" OR faculty OR recruitment OR vacancy OR opening OR advertisement) (biosciences OR biology OR biochemistry) 2026 (site:iitkgp.ac.in OR site:iith.ac.in OR site:iitgn.ac.in OR site:iitr.ac.in)',
  },
  {
    id: 'iit-c', name: 'IIT (Indore/Mandi/Tirupati/Palakkad/Jodhpur)', category: 'academia',
    query: 'intitle:("assistant professor" OR "associate professor" OR faculty OR recruitment OR vacancy OR opening) (biosciences OR biology OR biochemistry OR biomedical) 2026 (site:iiti.ac.in OR site:iitmandi.ac.in OR site:iittirupati.ac.in OR site:iitpkd.ac.in OR site:iitj.ac.in)',
  },
  {
    id: 'iiser-a', name: 'IISER (Pune/Bhopal/Kolkata/Mohali)', category: 'academia',
    query: 'intitle:("assistant professor" OR "associate professor" OR faculty OR recruitment OR vacancy OR opening OR advertisement) (biology OR molecular OR bioscience) 2026 (site:iiserpune.ac.in OR site:iiserb.ac.in OR site:iiserk.ac.in OR site:iisermohali.ac.in)',
  },
  {
    id: 'iiser-b', name: 'IISER (Tirupati/TVM/Berhampur)', category: 'academia',
    query: 'intitle:("assistant professor" OR "associate professor" OR faculty OR recruitment OR vacancy OR opening) (biology OR molecular OR bioscience) 2026 (site:iisertirupati.ac.in OR site:iisertvm.ac.in OR site:iiserbpr.ac.in)',
  },
  {
    id: 'niser', name: 'NISER Bhubaneswar', category: 'academia',
    query: 'intitle:(faculty OR "assistant professor" OR scientist OR recruitment OR vacancy OR opening OR position) (biology OR bioscience OR molecular) 2026 site:niser.ac.in',
  },
  {
    id: 'iisc', name: 'IISc Bengaluru', category: 'academia',
    query: 'intitle:(faculty OR "assistant professor" OR "associate professor" OR recruitment OR vacancy OR opening OR position) (biology OR biomedical OR biochemistry OR "molecular biophysics") 2026 site:iisc.ac.in',
  },
  {
    id: 'jncasr', name: 'JNCASR Bengaluru', category: 'academia',
    query: 'intitle:(faculty OR scientist OR recruitment OR vacancy OR opening OR position OR advertisement) (biology OR "molecular biology" OR bioscience) 2026 site:jncasr.ac.in',
  },
  {
    id: 'ncbs', name: 'NCBS-TIFR Bengaluru', category: 'academia',
    // -intitle:"final list" -intitle:result -intitle:eligible blocks result/shortlist announcements
    query: 'intitle:(faculty OR scientist OR recruitment OR vacancy OR opening OR position OR advertisement) -intitle:"final list" -intitle:result -intitle:eligible 2026 site:ncbs.res.in',
  },
  {
    id: 'instem', name: 'InStem Bengaluru', category: 'academia',
    query: 'intitle:(faculty OR scientist OR researcher OR recruitment OR vacancy OR opening OR position OR advertisement) 2026 site:instem.res.in',
  },
  {
    id: 'nit', name: 'NIT System', category: 'academia',
    query: 'intitle:("assistant professor" OR "associate professor" OR faculty OR recruitment OR vacancy OR advertisement OR opening) (bioscience OR biology OR biochemistry OR biotechnology) 2026 (site:nitrkl.ac.in OR site:nitw.ac.in OR site:nitk.ac.in OR site:nitt.edu OR site:nitc.ac.in)',
  },
  {
    id: 'niper', name: 'NIPER Network', category: 'academia',
    query: 'intitle:(faculty OR "assistant professor" OR scientist OR recruitment OR vacancy OR opening OR advertisement) 2026 (site:niper.gov.in OR site:niperhyd.ac.in OR site:niperahm.ac.in OR site:niperkolkata.edu.in OR site:niperguwahati.ac.in OR site:niperraebareli.edu.in)',
  },
  {
    id: 'uoh', name: 'University of Hyderabad', category: 'academia',
    query: 'intitle:(faculty OR "assistant professor" OR recruitment OR vacancy OR opening OR advertisement) (biology OR "life science" OR biochemistry) 2026 site:uohyd.ac.in',
  },
  {
    id: 'jnu', name: 'JNU Delhi', category: 'academia',
    query: 'intitle:(faculty OR "assistant professor" OR "associate professor" OR recruitment OR vacancy OR opening OR advertisement) (biology OR "life science" OR biochemistry) 2026 site:jnu.ac.in',
  },
  {
    id: 'bhu', name: 'BHU Varanasi', category: 'academia',
    query: 'intitle:(faculty OR "assistant professor" OR "associate professor" OR recruitment OR vacancy OR advertisement OR opening) (biology OR "life science" OR biochemistry OR zoology OR botany) 2026 site:bhu.ac.in',
  },
  {
    id: 'tezpur-univ', name: 'Tezpur University', category: 'academia',
    query: 'intitle:(faculty OR "assistant professor" OR recruitment OR vacancy OR opening OR advertisement) (biology OR bioscience OR molecular) 2026 site:tezu.ernet.in',
  },
  {
    id: 'ugc-central', name: 'Central Universities (UGC)', category: 'academia',
    query: 'intitle:("assistant professor" OR "associate professor" OR faculty OR recruitment OR vacancy OR advertisement) ("life sciences" OR biology OR biochemistry) 2026 site:ugc.ac.in',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AGGREGATORS & OFFICIAL JOB PORTALS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'indiabioscience', name: 'IndiaBioscience', category: 'aggregator',
    // -intitle:"jobs in 20" -intitle:"research jobs" -intitle:"jobs based" blocks category/index pages
    query: 'intitle:(job OR vacancy OR position OR opening OR recruitment OR advertisement) -intitle:"jobs in 20" -intitle:"research jobs" -intitle:"jobs based" (scientist OR faculty OR "life science") 2026 site:indiabioscience.org',
  },
  {
    id: 'employment-news', name: 'Employment News', category: 'aggregator',
    query: 'intitle:(recruitment OR vacancy OR advertisement) (scientist OR "scientific officer" OR "life science" OR biology) 2026 site:employmentnews.gov.in',
  },
  {
    id: 'dbt', name: 'DBT Portal', category: 'aggregator',
    query: 'intitle:(scientist OR recruitment OR vacancy OR opening OR advertisement) 2026 site:dbtindia.gov.in',
  },
  {
    id: 'serb-dst', name: 'SERB / DST', category: 'aggregator',
    // Require scientist/officer in title to block generic "Department of S&T" + "Announcement" pages
    query: 'intitle:(scientist OR "research officer" OR "scientific officer" OR recruitment OR vacancy OR advertisement OR opening) -intitle:announcement 2026 (site:serb.gov.in OR site:dst.gov.in)',
  },
  {
    id: 'birac', name: 'BIRAC', category: 'aggregator',
    query: 'intitle:(scientist OR "research officer" OR recruitment OR vacancy OR advertisement OR opening) 2026 site:birac.nic.in',
  },
  {
    id: 'biotecnika', name: 'Biotecnika', category: 'aggregator',
    query: 'intitle:(job OR vacancy OR recruitment OR opening OR advertisement OR position) (scientist OR faculty OR "research officer") India 2026 site:biotecnika.org',
  },
]

// ─── Relevance Scoring ────────────────────────────────────────────────────────

const CORE_KEYWORDS = [
  'scientist', 'faculty', 'professor', 'researcher', 'scientific officer',
  'research scientist', 'research associate', 'scientist-b', 'scientist-c',
  'scientist-d', 'scientist-e', 'scientist-f', 'scientist-g',
  'assistant professor', 'associate professor', 'principal scientist',
  'senior scientist', 'chief scientist', 'research officer',
  'principal investigator', 'ars scientist', 'emeritus scientist',
  'staff scientist', 'project scientist', 'project research scientist',
]
const BOOST_KEYWORDS = [
  'life science', 'biology', 'molecular', 'cardiovascular', 'biomedical',
  'phd', 'biotechnology', 'biochemistry', 'genomics', 'immunology',
  'translational', 'stem cell', 'neuroscience', 'microbiology', 'virology',
  'pharmacology', 'toxicology', 'bioinformatics', 'cell biology', 'genetics',
  'ecology', 'zoology', 'botany', 'biophysics', 'structural biology',
  'cancer biology', 'infectious disease', 'epidemiology', 'nutrition',
  'reproductive health', 'environmental health', 'plant biology',
  'veterinary science', 'animal science', 'fisheries', 'dairy science',
]

// ─── Hard filter ──────────────────────────────────────────────────────────────
// Any of these in title+snippet → score = -1 → record discarded entirely.
// Covers: non-science roles, result/answer-key pages, admission pages,
// programme-description pages, category/index pages, and profile pages.
const HARD_FILTER_TERMS = [
  // Non-relevant support/admin roles
  'intern', 'technical assistant', 'lab attendant', 'peon', 'stenographer',
  'accountant', 'clerk', 'driver', 'nurse', 'pharmacist', 'radiographer',
  'security guard', 'multi tasking', 'multi-tasking', 'mts', 'group d',
  'lower division', 'upper division', 'assistant librarian',
  // Exam result / answer-key / admit-card pages — not recruitment
  'answer key', 'admit card', 'merit list', 'cut off list', 'cutoff list',
  'final result', 'provisional result', 'exam result', 'examination result',
  'selected candidates', 'waiting list',
  'scorecard', 'rank list', 'panel result', 'written result',
  'declaration of result', 'declaration of final result',
  'walk-in-interview results', 'walk-in interview results',
  // Selection/shortlist result announcements
  'selection list for', 'list of candidates recommended',
  'provisionally shortlisted', 'provisionally eligible',
  'final list of provisionally',
  // PhD admission / programme pages (not a scientist job)
  'phd admission', 'phd admissions', 'ph.d. admission',
  'phd programme', 'phd program', 'ph.d. programme',
  'admissions – january', 'admissions – july', 'admissions open',
  // Generic programme description pages (not specific open vacancies)
  'post-doctoral programme', 'postdoctoral programme',
  'fellowship programme', 'fellowship program',
  // Admission / entrance noise
  'admission open', 'admission notice', 'entrance exam', 'entrance test',
  'prospectus', 'application form for admission',
  // IndiaBioscience category/index pages
  'jobs in 2025', 'jobs in 2024', 'research jobs in 2025', 'jobs based at',
  // Profile / about / news pages (not job postings)
  'my journey', 'career & opportunities',
  // CSIR "Recruitments & Results" index page (appears as duplicates)
  'recruitments & results', 'recruitments and results', 'recruitment & results',
  // Recruitment Rules documents (not open vacancies)
  'recruitment rules, 20',
]

// ─── Post-March 2026 date gate ─────────────────────────────────────────────
// Returns false when Serper's r.date is an absolute date clearly before March 2026.
// Relative dates ("3 days ago", "yesterday") and unparseable strings always pass.
function isDateAcceptable(dateStr: string): boolean {
  if (!dateStr || dateStr === 'Recent') return true
  if (/\bago\b|\bhour|\bday|\bmin|\byesterday\b/i.test(dateStr)) return true
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return true
  return parsed >= new Date('2026-03-01T00:00:00Z')
}

// ─── DB-level noise title patterns (run as DELETE after each scan) ─────────
// Belt-and-suspenders: removes noise records that slipped past scoring,
// including any that were stored in earlier scans before the filters hardened.
const NOISE_SQL_PATTERNS = [
  '%phd admission%', '%phd admissions%', '%phd programme%', '%phd program%',
  '%recruitments & results%', '%recruitments and results%', '%recruitment & results%',
  '%selection list for%', '%list of candidates recommended%',
  '%provisionally shortlisted%', '%provisionally eligible%',
  '%final list of provisionally%', '%fellowship programme%', '%fellowship program%',
  '%post-doctoral programme%', '%postdoctoral programme%',
  '%jobs in 2025%', '%jobs in 2024%', '%research jobs in 2025%', '%jobs based at%',
  '%my journey%', '%career & opportunities%',
  '%walk-in-interview results%', '%walk-in interview results%',
  '%case recruitments%',
  '%recruitment rules, 20%',
]

function scoreJob(title: string, snippet: string): number {
  const text = `${title} ${snippet}`.toLowerCase()
  if (HARD_FILTER_TERMS.some(kw => text.includes(kw))) return -1
  let score = 0
  if (CORE_KEYWORDS.some(kw => text.includes(kw))) score += 2
  if (BOOST_KEYWORDS.some(kw => text.includes(kw))) score += 1
  return score
}

// ─── GET /api/monitor/pooja-india/jobs ────────────────────────────────────────

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { category } = req.query
    const params: any[] = []
    // Hard floor: March 2026+, must have a core keyword (score ≥ 2).
    let where = `WHERE dismissed = false AND relevance_score >= 2 AND detected_at >= GREATEST('2026-03-01'::timestamptz, NOW() - INTERVAL '30 days')`

    if (category && category !== 'all') {
      params.push(category)
      where += ` AND portal_category = $${params.length}`
    }

    const result = await pool.query(
      `SELECT * FROM pooja_india_monitor_jobs
       ${where}
       ORDER BY relevance_score DESC, detected_at DESC
       LIMIT 500`,
      params
    )

    const lastScan = await pool.query(
      `SELECT MAX(detected_at) as last_scan, COUNT(*) as total
       FROM pooja_india_monitor_jobs
       WHERE dismissed = false`
    )

    res.json({
      status:   'success',
      jobs:     result.rows,
      total:    result.rows.length,
      lastScan: lastScan.rows[0]?.last_scan || null,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message, jobs: [] })
  }
})

// ─── POST /api/monitor/pooja-india/scan ──────────────────────────────────────

router.post('/scan', async (req: Request, res: Response) => {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'SERPER_API_KEY not configured' })

  // Respond immediately — scan runs in background
  res.json({ status: 'scanning', message: 'Scan started — results available in ~30 seconds' })
  runScan(apiKey).catch(console.error)
})

async function runScan(apiKey: string): Promise<void> {
  console.log('[PoojaIndia] Starting scan across', POOJA_INDIA_PORTALS.length, 'portals')
  let totalStored = 0

  const client = await pool.connect()
  try {
    for (const portal of POOJA_INDIA_PORTALS) {
      try {
        const resp = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          // tbs:'qdr:m1' → Google only returns pages published in the past 30 days,
          // preventing old index entries (Aug/Nov/Jan) from ever reaching our DB.
          body: JSON.stringify({ q: portal.query, num: 10, gl: 'in', hl: 'en', tbs: 'qdr:m1' }),
        })

        if (!resp.ok) {
          console.warn(`[PoojaIndia] Serper ${resp.status} for ${portal.name}`)
          continue
        }

        const data: any = await resp.json()
        const results: any[] = [
          ...(data.organic || []),
          ...(data.news    || []),
        ]

        for (const r of results) {
          const title   = (r.title   || '').trim()
          const snippet = (r.snippet || '').trim()
          const link    = (r.link    || r.url || '').trim()

          if (!title || !link) continue

          // Gate 1: skip pages with explicit pre-March 2026 publish dates
          const postedDate = (r.date || 'Recent').trim()
          if (!isDateAcceptable(postedDate)) continue

          // Gate 2: scoring — must pass hard filter AND have ≥1 core keyword
          const score = scoreJob(title, snippet)
          if (score < 2) continue   // 0 = no keywords; 1 = boost only; 2+ = has core keyword

          // Dedup by URL so the same page can never appear as multiple rows
          // (fixes CSIR "Recruitments & Results" appearing 5× per scan)
          const id = crypto
            .createHash('md5')
            .update(link)
            .digest('hex')
            .slice(0, 24)

          await client.query(
            `INSERT INTO pooja_india_monitor_jobs
               (id, title, org_name, portal_category, snippet, apply_url,
                posted_date, source_portal, relevance_score, is_new, dismissed)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,false)
             ON CONFLICT (id) DO UPDATE SET
               snippet         = EXCLUDED.snippet,
               posted_date     = EXCLUDED.posted_date,
               relevance_score = EXCLUDED.relevance_score,
               last_seen_at    = NOW()`,
            [
              id, title, portal.name, portal.category,
              snippet, link,
              r.date || 'Recent',
              portal.id,
              score,
            ]
          )
          totalStored++
        }
      } catch (err) {
        console.error(`[PoojaIndia] Error scanning ${portal.name}:`, (err as Error).message)
      }

      // Respect Serper rate limits — 200 ms between calls
      await new Promise(r => setTimeout(r, 200))
    }
    console.log(`[PoojaIndia] Scan complete — ${totalStored} jobs upserted`)

    // ── Noise sweep: delete known-bad title patterns that slipped past scoring ──
    // Runs on every scan so records from older (looser) scans are retroactively cleaned.
    const noiseWhere = NOISE_SQL_PATTERNS
      .map((_, i) => `LOWER(title) LIKE $${i + 1}`)
      .join(' OR ')
    const noiseDel = await client.query(
      `DELETE FROM pooja_india_monitor_jobs WHERE ${noiseWhere}`,
      NOISE_SQL_PATTERNS
    )
    if (noiseDel.rowCount && noiseDel.rowCount > 0) {
      console.log(`[PoojaIndia] Noise sweep removed ${noiseDel.rowCount} records`)
    }

    // ── Auto-purge: stale records before March 2026 or older than 30 days ──
    const purge = await client.query(
      `DELETE FROM pooja_india_monitor_jobs
       WHERE detected_at < GREATEST('2026-03-01'::timestamptz, NOW() - INTERVAL '30 days')`
    )
    if (purge.rowCount && purge.rowCount > 0) {
      console.log(`[PoojaIndia] Purged ${purge.rowCount} stale jobs (pre-March 2026 or >30 days)`)
    }
  } finally {
    client.release()
  }
}

// ─── DELETE /api/monitor/pooja-india/jobs/:id  (dismiss — applied / done) ────

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await pool.query(
      'UPDATE pooja_india_monitor_jobs SET dismissed = true WHERE id = $1',
      [id]
    )
    res.json({ status: 'success', dismissed: id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/monitor/pooja-india/status ─────────────────────────────────────

router.get('/status', async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT
        portal_category,
        COUNT(*)                              FILTER (WHERE dismissed = false) AS active,
        COUNT(*)                              FILTER (WHERE dismissed = true)  AS dismissed,
        MAX(detected_at)                      FILTER (WHERE dismissed = false) AS last_detected
      FROM pooja_india_monitor_jobs
      GROUP BY portal_category
    `)
    const lastScan = await pool.query(
      `SELECT MAX(detected_at) as last_scan FROM pooja_india_monitor_jobs`
    )
    res.json({
      status:   'success',
      byCategory: stats.rows,
      lastScan:   lastScan.rows[0]?.last_scan || null,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
