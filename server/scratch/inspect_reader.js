import axios from 'axios';
axios.get('https://kingofshojo.com/manga/2nd-strongest-high-school-student/chapter-1/')
  .then(r => {
    const match = r.data.match(/<div id="readerarea".*?<\/div>/s);
    if (match) {
      console.log(match[0].substring(0, 3000));
    } else {
      console.log('Readerarea not found');
    }
  })
  .catch(e => console.error(e.message));
