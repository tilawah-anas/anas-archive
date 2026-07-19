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