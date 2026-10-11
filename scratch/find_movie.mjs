async function find() {
  const urls = [
    "http://172.16.50.14/DHAKA-FLIX-14/English%20Movies%20%281080p%29/%282026%29%201080p/",
    "http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282026%29/",
    "http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/",
    "http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/",
  ];

  for (const url of urls) {
    const res = await fetch(url);
    const text = await res.text();
    if (text.toLowerCase().includes("28 years")) {
      console.log("FOUND IN:", url);
      const re = /<td class="fb-n"><a href="([^"]+)">([^<]*28 years[^<]*)<\/a>/gi;
      let m;
      while ((m = re.exec(text)) !== null) {
        console.log(" - Item:", m[2]);
      }
    }
    if (text.toLowerCase().includes("crime 101")) {
      console.log("FOUND CRIME 101 IN:", url);
    }
  }
}
find().catch(console.error);
