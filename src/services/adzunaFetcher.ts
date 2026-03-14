import axios from 'axios';
export async function fetchAdzunaJobs(profile: any, country: string) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    console.log('DEBUG: Attempting Adzuna Fetch. Auth ID present:', !!appId);
    
    let allJobs = [];
    for (const query of profile.queries) {
        const url = 'https://api.adzuna.com/v1/api/jobs/' + country + '/search/1?app_id=' + appId + '&app_key=' + appKey + '&what=' + encodeURIComponent(query);
        try {
            const res = await axios.get(url);
            console.log('ADZUNA_STATUS:', res.status, 'Count:', res.data.results?.length);
            allJobs.push(...(res.data.results || []));
        } catch (e) { console.error('ADZUNA_ERROR for ' + query); }
    }
    return allJobs;
}
