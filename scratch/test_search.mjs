async function testSearch(query) {
  const q = query.toLowerCase();
  const urls = [
    { sec: 'English (1080p)', url: 'http://172.16.50.14/DHAKA-FLIX-14/English%20Movies%20%281080p%29/%282026%29%201080p/' },
    { sec: 'English (720p)', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282026%29/' },
    { sec: 'Hindi Movies', url: 'http://172.16.50.14/DHAKA-FLIX-14/Hindi%20Movies/%282026%29/' },
    { sec: 'South Dubbed', url: 'http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/%282026%29/' },
    { sec: 'TV Series A-L', url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A5%20%20A%20%20%E2%80%94%20%20L/' },
    { sec: 'TV Series S-Z', url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A6%20%20S%20%20%E2%80%94%20%20Z/' },
    { sec: 'Animation', url: 'http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/' },
    { sec: 'Bangla', url: 'http://172.16.50.7/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/' },
  ];

  const t0 = Date.now();
  const results = await Promise.all(urls.map(async u => {
    try {
      const res = await fetch(u.url);
      const html = await res.text();
      const matches = [...html.matchAll(/<td class="fb-n"><a href="([^"]+)">([^<]+)<\/a>/g)]
        .filter(m => m[2] !== 'Parent Directory' && m[2].toLowerCase().includes(q))
        .map(m => ({ section: u.sec, name: m[2], href: new URL(m[1], u.url).href }));
      return matches;
    } catch {
      return [];
    }
  }));

  const flat = results.flat();
  console.log(`Found ${flat.length} results in ${Date.now() - t0}ms for '${query}':`);
  flat.forEach(x => console.log(`[${x.section}] ${x.name}`));
}

testSearch('mummy').then(() => testSearch('border')).then(() => testSearch('spider'));
