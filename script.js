// SIDE BAR
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const overlay = document.getElementById('overlay');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
});

document.getElementById('closeBtn').addEventListener('click', () => {
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
});


// Connect to Supabase
const SUPABASE_URL = 'https://jzpjmefbbuxqidhlkcdz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cGptZWZiYnV4cWlkaGxrY2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTMwMTcsImV4cCI6MjA5OTc2OTAxN30.23RsubY4qgLEsAg8ipi1o3-c7FxPEl4Asg4L9zXn8DM';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SURAH CARDS - now pulling from Supabase instead of data.js
const container = document.getElementById('surah-list');

async function loadSurahs() {
  const { data, error } = await supabaseClient
    .from('recitations')
    .select('*')
    .eq('category', 'Quran')
    .order('number', { ascending: true });

  if (error) {
    console.error('Error fetching surahs:', error);
    return;
  }

  data.forEach(surah => {
    const card = document.createElement('div');
    card.className = 'recitation-card';
    card.innerHTML = `
      <h2>${surah.number}. Surah ${surah.title} - ${surah.translation}</h2>
      <audio controls src="${surah.audio_url}"></audio>
    `;
    container.appendChild(card);
  });
}

loadSurahs();

// Pause all other audio players when one starts playing
document.addEventListener('play', function(e) {
  const allAudio = document.querySelectorAll('audio');
  allAudio.forEach(audio => {
    if (audio !== e.target) {
      audio.pause();
    }
  });
}, true);


// RAMADAN PAGE
const ramadanContainer = document.getElementById('ramadan-list');

if (ramadanContainer) {
  async function loadRamadan(year) {
    const { data, error } = await supabaseClient
      .from('recitations')
      .select('*')
      .eq('category', 'Ramadan')
      .eq('year', year)
      .order('number', { ascending: true });

      if (error) {
        console.error('Error fetching Ramadan nights:', error);
        return;
      }

      ramadanContainer.innerHTML = '';

      data.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'recitation-card';
        
        let label;
        if (entry.year == 1446) {
          label = `${entry.title}${entry.translation ? ' - ' + entry.translation : ''}`;
        } else {
          label = `Night ${entry.number}`;
        }

        card.innerHTML = `
          <h2>${label}</h2>
          <audio controls src="${entry.audio_url}"></audio>
        `;
        ramadanContainer.appendChild(card);
      });
    }

    document.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadRamadan(Number(btn.dataset.year)); // convert string to number
    });
  });

  loadRamadan(1447); // already a number, no change needed here // default year on page load
}


// KHUTBAH PAGE
const khutbahContainer = document.getElementById('khutbah-list');
if (khutbahContainer) {
  loadGroupedByMonth('Khutbah', khutbahContainer, true); // true = has two audio parts
}

// DUROOS PAGE
const duroosContainer = document.getElementById('duroos-list');
if (duroosContainer) {
  loadGroupedByMonth('Duroos', duroosContainer, false); // false = single audio only
}

// Shared function for month-grouped, lazy-loaded display
async function loadGroupedByMonth(category, container, hasTwoParts) {
  const { data, error } = await supabaseClient
    .from('recitations')
    .select('*')
    .eq('category', category)
    .order('date', { ascending: false });

  if (error) {
    console.error(`Error fetching ${category}:`, error);
    return;
  }

  const groups = {};
  data.forEach(entry => {
    const dateObj = new Date(entry.date);
    const monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[monthLabel]) groups[monthLabel] = [];
    groups[monthLabel].push(entry);
  });

  container.innerHTML = '';
  let isFirst = true;

  for (const month in groups) {
    const section = document.createElement('div');
    section.className = 'month-group';

    const header = document.createElement('div');
    header.className = 'month-header';
    header.innerHTML = `<span>${month} (${groups[month].length})</span> <i class="fa-solid fa-chevron-down"></i>`;

    const grid = document.createElement('div');
    grid.className = 'month-grid';
    grid.style.display = isFirst ? 'grid' : 'none';

    let built = false;

    function buildCards() {
      if (built) return;
      groups[month].forEach(entry => {
        const card = document.createElement('div');
        card.className = 'recitation-card';

        const audioSection = hasTwoParts
          ? `
            <p class="audio-label">Khutbah</p>
            <audio controls src="${entry.audio_url}"></audio>
            <p class="audio-label">Salah</p>
            <audio controls src="${entry.audio_url_2}"></audio>
          `
          : `<audio controls src="${entry.audio_url}"></audio>`;

        card.innerHTML = `
          <h2>${entry.title}</h2>
          <p class="entry-meta">${entry.hijri_date || ''}${entry.date ? ' | ' + new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
          ${entry.surahs_recited ? `<p class="entry-surahs">Recited: ${entry.surahs_recited}</p>` : ''}
          ${entry.location ? `<p class="entry-location"><i class="fa-solid fa-location-dot"></i> ${entry.location}</p>` : ''}
          ${audioSection}
        `;
        grid.appendChild(card);
      });
      built = true;
    }

    if (isFirst) buildCards();

    header.addEventListener('click', () => {
      const isOpening = grid.style.display === 'none';
      if (isOpening) buildCards();
      grid.style.display = isOpening ? 'grid' : 'none';
      header.querySelector('i').classList.toggle('fa-chevron-down');
      header.querySelector('i').classList.toggle('fa-chevron-up');
    });

    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);
    isFirst = false;
  }
}