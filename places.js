// wonders.js - Specific functionality for the wonders page

// Constants
const ITEMS_PER_PAGE = 9; // Show 9 items per page
let currentPage = 1;
let allCards = []; // Array to store all wonder cards
let filteredCards = []; // Array to store filtered wonder cards
let totalPages = 1; // Total number of pages

// Current filter state
const filterState = {
  country: 'all',
  city: null,
  category: 'all'
};

// City to country mapping - same as in food.js and stays.js
const cityToCountry = {
  'tokyo': 'japan',
  'osaka': 'japan',
  'kyoto': 'japan',
  'kobe': 'japan',
  'shanghai': 'china',
  'beijing': 'china',
  'shenzhen': 'china',
  'chongqing': 'china',
  'guangzhou': 'china',
  'seoul': 'korea',
  'busan': 'korea',
  'bangkok': 'thailand',
  'chiang-mai': 'thailand', 
  'phuket': 'thailand',
  'phnom-penh': 'cambodia',
  'siem-reap': 'cambodia',
  'melbourne': 'australia',
  'sydney': 'australia'
};

// Wonders data - top tourist destinations for each city
const wondersData = {
  'tokyo': [
    { name: 'Tokyo Skytree', description: 'The tallest tower in Japan offering panoramic views of the entire city', category: 'landmark' },
    { name: 'Meiji Shrine', description: 'Serene Shinto shrine set in a forested area in the heart of Tokyo', category: 'cultural' },
    { name: 'Senso-ji Temple', description: 'Tokyo\'s oldest and most significant Buddhist temple with iconic red lantern', category: 'cultural' },
    { name: 'Shibuya Crossing', description: 'The world\'s busiest pedestrian intersection and a symbol of modern Tokyo', category: 'urban' },
    { name: 'Tokyo Imperial Palace', description: 'Historic residence of Japan\'s Imperial Family with beautiful gardens', category: 'historical' },
    { name: 'TeamLab Borderless', description: 'Interactive art experience', category: 'entertainment', link: 'wonders/teamlab-borderless.html' }
  ],
  'osaka': [
    { name: 'Osaka Castle', description: 'Historic castle and cultural icon surrounded by moats and park grounds', category: 'historical' },
    { name: 'Dotonbori', description: 'Vibrant entertainment district with iconic neon signs and street food', category: 'urban' },
    { name: 'Universal Studios Japan', description: 'Major theme park featuring attractions based on popular movies', category: 'entertainment' },
    { name: 'Shitennoji Temple', description: 'Japan\'s oldest officially administered temple, founded in 593 CE', category: 'cultural' },
    { name: 'Osaka Aquarium Kaiyukan', description: 'One of the largest aquariums in the world focusing on Pacific Rim marine life', category: 'nature' }
  ],
  'kyoto': [
    { name: 'Fushimi Inari Taisha', description: 'Famous shrine with thousands of vermilion torii gates winding up a mountain', category: 'cultural' },
    { name: 'Kinkaku-ji (Golden Pavilion)', description: 'Zen Buddhist temple covered in gold leaf, reflected in a tranquil pond', category: 'cultural' },
    { name: 'Arashiyama Bamboo Grove', description: 'Enchanting path through towering bamboo forests on Kyoto\'s outskirts', category: 'nature' },
    { name: 'Kiyomizu-dera Temple', description: 'UNESCO World Heritage site perched on a hillside with wooden terrace', category: 'cultural' },
    { name: 'Gion District', description: 'Historic geisha district with preserved traditional architecture and teahouses', category: 'cultural' }
  ],
  'kobe': [
    { name: 'Mount Rokko', description: 'Mountain range offering spectacular views of Kobe and Osaka Bay', category: 'nature' },
    { name: 'Kobe Harborland', description: 'Waterfront shopping and entertainment district with illuminated Ferris wheel', category: 'urban' },
    { name: 'Kobe Port Tower', description: 'Iconic red steel tower resembling a tsuzumi drum with observation deck', category: 'landmark' },
    { name: 'Arima Onsen', description: 'One of Japan\'s oldest hot spring resorts known for its mineral-rich waters', category: 'nature' },
    { name: 'Ikuta Shrine', description: 'Ancient Shinto shrine dating back to the 3rd century in central Kobe', category: 'cultural' }
  ],
  'shanghai': [
    { name: 'The Bund', description: 'Waterfront promenade featuring colonial-era buildings and skyline views', category: 'urban' },
    { name: 'Yu Garden', description: 'Traditional Chinese garden from the Ming Dynasty with pavilions and rockeries', category: 'cultural' },
    { name: 'Shanghai Tower', description: 'China\'s tallest skyscraper with world\'s highest observation deck', category: 'landmark' },
    { name: 'Nanjing Road', description: 'Major shopping street and pedestrian-friendly thoroughfare', category: 'urban' },
    { name: 'Jade Buddha Temple', description: 'Buddhist temple housing two jade Buddha statues brought from Burma', category: 'cultural' }
  ],
  'beijing': [
    { name: 'Great Wall of China', description: 'Iconic UNESCO World Heritage site and one of humanity\'s most impressive architectural feats', category: 'historical' },
    { name: 'Forbidden City', description: 'Imperial palace complex housing the Palace Museum with thousands of artifacts', category: 'historical' },
    { name: 'Temple of Heaven', description: 'Historic imperial complex where emperors performed ceremonies for good harvests', category: 'cultural' },
    { name: 'Summer Palace', description: 'Vast ensemble of lakes, gardens, and palaces serving as imperial retreat', category: 'historical' },
    { name: 'Tiananmen Square', description: 'World\'s largest public square, site of many historic events', category: 'landmark' },
    { name: 'Terracotta Warriors', description: 'Army of life-sized clay soldiers guarding China\'s first emperor for over 2,000 years', category: 'historical', forceImage: 'https://images.unsplash.com/photo-1549867499-c530333a6881?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80' }
  ],
  'shenzhen': [
    { name: 'Window of the World', description: 'Theme park featuring miniature replicas of famous landmarks from around the globe', category: 'entertainment' },
    { name: 'OCT Loft', description: 'Creative cultural park converted from industrial buildings with art galleries', category: 'cultural' },
    { name: 'Shenzhen Bay Park', description: 'Scenic coastline park with views of Hong Kong across the bay', category: 'nature' },
    { name: 'Dafen Oil Painting Village', description: 'Unique art district known for reproductions and original paintings', category: 'cultural' },
    { name: 'Splendid China Folk Village', description: 'Cultural theme park showcasing China\'s diverse ethnic traditions', category: 'cultural' }
  ],
  'chongqing': [
    { name: 'Three Gorges Museum', description: 'Museum detailing the history of the Yangtze River region and Three Gorges Dam', category: 'cultural' },
    { name: 'Hongya Cave', description: 'Stilted wooden structure built into a hillside with shops and restaurants', category: 'urban' },
    { name: 'Wulong Karst National Geology Park', description: 'UNESCO site with dramatic natural bridges and sinkholes', category: 'nature' },
    { name: 'Ciqikou Ancient Town', description: 'Well-preserved Ming and Qing Dynasty port town with traditional teahouses', category: 'historical' },
    { name: 'Liziba Monorail Station', description: 'Famous train station built through the middle of a residential building', category: 'urban' }
  ],
  'guangzhou': [
    { name: 'Canton Tower', description: 'Iconic TV tower with observation decks and thrill rides at the summit', category: 'landmark' },
    { name: 'Chen Clan Ancestral Hall', description: 'Historic Qing Dynasty academic temple now housing folk art museum', category: 'cultural' },
    { name: 'Shamian Island', description: 'Former colonial concession with European architecture along the Pearl River', category: 'historical' },
    { name: 'Yuexiu Park', description: 'Largest park in downtown Guangzhou with Five Rams Sculpture, city symbol', category: 'nature' },
    { name: 'Baiyun Mountain', description: 'Sacred mountain offering hiking trails and panoramic city views', category: 'nature' }
  ],
  'phnom-penh': [
    { name: 'Royal Palace', description: 'Official residence of Cambodia\'s king with ornate throne hall and Silver Pagoda', category: 'historical' },
    { name: 'Tuol Sleng Genocide Museum', description: 'Former prison documenting Cambodia\'s tragic Khmer Rouge period', category: 'historical' },
    { name: 'National Museum of Cambodia', description: 'Distinctive terracotta building housing world\'s finest collection of Khmer art', category: 'cultural' },
    { name: 'Central Market (Phsar Thmei)', description: 'Art Deco landmark with stalls selling everything from jewelry to food', category: 'urban' },
    { name: 'Sisowath Quay', description: 'Riverside promenade with cafes, restaurants and views of confluence of rivers', category: 'urban' }
  ],
  'siem-reap': [
    { name: 'Angkor Wat', description: 'Iconic temple complex and largest religious monument in the world', category: 'historical' },
    { name: 'Bayon Temple', description: 'Famous for its 216 serene and smiling stone faces carved into its towers', category: 'historical' },
    { name: 'Ta Prohm', description: 'Ancient temple partially reclaimed by jungle, featured in Tomb Raider', category: 'historical' },
    { name: 'Angkor Thom', description: 'Last capital of Khmer Empire with impressive stone gate entrances', category: 'historical' },
    { name: 'Pub Street', description: 'Lively area in the center of Siem Reap with restaurants, bars and night markets', category: 'urban' }
  ],
  'melbourne': [
    { name: 'Federation Square', description: 'Cultural hub with distinctive architecture hosting events and exhibitions', category: 'urban' },
    { name: 'Royal Botanic Gardens Victoria', description: 'Picturesque gardens with more than 8,500 plant species', category: 'nature' },
    { name: 'National Gallery of Victoria', description: 'Australia\'s oldest and most visited art museum with diverse collection', category: 'cultural' },
    { name: 'Great Ocean Road', description: 'Scenic coastal drive featuring the iconic Twelve Apostles rock formations', category: 'nature' },
    { name: 'Queen Victoria Market', description: 'Historic landmark marketplace offering fresh produce and specialty shopping', category: 'urban' }
  ],
  'sydney': [
    { name: 'Sydney Opera House', description: 'UNESCO-listed architectural masterpiece with distinctive sail-shaped design', category: 'landmark' },
    { name: 'Sydney Harbour Bridge', description: 'Iconic steel arch bridge spanning Sydney Harbour, offering bridge climbs', category: 'landmark' },
    { name: 'Bondi Beach', description: 'Famous crescent-shaped beach with golden sand and excellent surfing', category: 'nature' },
    { name: 'The Rocks', description: 'Historic area with cobblestone streets and Australia\'s oldest pubs', category: 'historical' },
    { name: 'Royal Botanic Garden', description: 'Oasis of 30 hectares in the heart of Sydney with harbor views', category: 'nature' }
  ]
};

// Featured wonders for each country
const featuredWonders = {
  'japan': {
    name: 'Fushimi Inari Taisha',
    city: 'kyoto',
    description: 'Iconic shrine with thousands of vermilion torii gates winding up Mount Inari',
    category: 'cultural',
    image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
  },
  'china': {
    name: 'Great Wall of China',
    city: 'beijing',
    description: 'One of the greatest wonders of the world and the only man-made structure visible from space',
    category: 'historical',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
  },
  'korea': {
    name: 'Gyeongbokgung Palace',
    city: 'seoul',
    description: 'Grand palace of the Joseon Dynasty featuring traditional architecture and cultural performances',
    category: 'historical',
    image: 'https://images.unsplash.com/photo-1548113616-1c307a399407?ixlib=rb-1.2.1&auto=format&fit=crop&w=1051&q=80'
  },
  'thailand': {
    name: 'Grand Palace',
    city: 'bangkok',
    description: 'Spectacular complex of buildings serving as the official residence of the Kings of Thailand',
    category: 'historical',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80'
  },
  'cambodia': {
    name: 'Angkor Wat',
    city: 'siem-reap',
    description: 'Magnificent temple complex and the largest religious monument in the world',
    category: 'historical',
    image: 'https://images.unsplash.com/photo-1526558998726-aa738b56a238?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
  },
  'australia': {
    name: 'Sydney Opera House',
    city: 'sydney',
    description: 'Iconic architectural masterpiece and one of the most recognizable buildings in the world',
    category: 'landmark',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded - initializing places page");
  initWondersPage();
  setupFeaturedWonderListeners();
});

function initWondersPage() {
  console.log("Initializing places page");
  
  // Get the places grid
  const placesGrid = document.querySelector('.places-grid');
  if (!placesGrid) {
    console.error("Places grid not found");
    return;
  }
  
  // Remove initial message if any
  const initialMessage = document.querySelector('.initial-message');
  if (initialMessage) {
    initialMessage.remove();
  }
  
  // Generate wonder cards
  generateAllWonderCards(placesGrid);
  
  // Initialize all cards array
  allCards = Array.from(document.querySelectorAll('.wonder-card'));
  
  console.log(`Generated ${allCards.length} wonder cards in total`);
  
  // Set filtered cards to all cards initially
  filteredCards = [...allCards];
  
  // Log wonder counts by country
  const countryCardCounts = {};
  allCards.forEach(card => {
    const cardCountry = card.getAttribute('data-country');
    if (!countryCardCounts[cardCountry]) {
      countryCardCounts[cardCountry] = 0;
    }
    countryCardCounts[cardCountry]++;
  });
  console.log("Wonder counts by country:", countryCardCounts);
  
  // Set up event listeners for filter buttons
  setupFilterListeners();
  
  // Make sure the "All" country button is active
  const allCountryButton = document.querySelector('.filter-section.countries .filter-btn[data-country="all"]');
  if (allCountryButton) {
    allCountryButton.classList.add('active');
  }
  
  // Update the filter path display
  const currentFilterElement = document.querySelector('.current-filter');
  if (currentFilterElement) {
    currentFilterElement.textContent = 'All';
  }
  
  // Calculate total pages
  calculateTotalPages();
  
  // Create pagination controls
  createPaginationControls();
  
  // Show first page
  showPage(1);
  
  
  
  console.log("Places page initialization complete");
}

function generateAllWonderCards(placesGrid) {
  console.log("Generating all wonder cards");
  
  // Clear any existing cards
  const existingCards = placesGrid.querySelectorAll('.dynamic-card');
  existingCards.forEach(card => card.remove());
  
  // Track how many cards are generated
  let cardCount = 0;
  
  // Generate cards for each city's wonders
  for (const city in wondersData) {
    const country = cityToCountry[city];
    
    // Debug log
    console.log(`Generating cards for ${city}, ${country}`);
    
    // Skip if city doesn't have a country mapping
    if (!country) {
      console.error(`No country mapping found for city: ${city}`);
      continue;
    }
    
    // Generate cards for this city's wonders
    wondersData[city].forEach(wonder => {
      createWonderCard(wonder, country, city, placesGrid);
      cardCount++;
    });
  }
  
  console.log(`Generated ${cardCount} wonder cards`);
}

function createWonderCard(wonder, country, city, placesGrid) {
  // Create a new wonder card
  const card = document.createElement('a');
  
  // Special case for Angkor Wat - link to dedicated page
  if (wonder.name === 'Angkor Wat') {
    card.href = 'places/angkor-wat.html';
  } else if (wonder.name === 'Fushimi Inari Taisha') {
    card.href = 'places/fushimi-inari.html';
  } else if (wonder.name === 'Great Wall of China') {
    card.href = 'places/great-wall.html';
  } else if (wonder.name === 'Forbidden City') {
    card.href = 'places/forbidden-city.html';
  } else if (wonder.name === 'Golden Temple' || wonder.name === 'Kinkaku-ji') {
    card.href = 'places/golden-temple.html';
  } else if (wonder.name === 'TeamLab Borderless') {
    card.href = 'places/teamlab-borderless.html';
  } else if (wonder.name === 'Terracotta Warriors') {
    card.href = 'places/terracotta-warriors.html';
  } else {
    card.href = '#'; // We could link to a detail page in the future
  }
  
  card.className = 'wonder-card dynamic-card';
  
  // Set data attributes for filtering
  const countryLower = country.toLowerCase();
  const cityLower = city.toLowerCase();
  
  // Double-check country mapping
  let confirmedCountry = countryLower;
  if (cityToCountry[cityLower] && countryLower !== 'test') {
    confirmedCountry = cityToCountry[cityLower];
  }
  
  card.setAttribute('data-country', confirmedCountry);
  card.setAttribute('data-city', cityLower);
  card.setAttribute('data-category', wonder.category);
  card.setAttribute('data-id', `${cityLower}-${wonder.name.replace(/\s+/g, '-').toLowerCase()}`);
  
  // Debug log - helps identify issues with specific countries/cities
  console.log(`Creating card for ${wonder.name} in ${cityLower}, ${confirmedCountry}`);
  
  // Validate data - ensure city has a valid country mapping
  if (!cityToCountry[cityLower] && countryLower !== 'test') {
    console.warn(`City "${cityLower}" has no country mapping in cityToCountry object!`);
  } else if (cityToCountry[cityLower] !== countryLower && countryLower !== 'test') {
    console.warn(`City "${cityLower}" maps to "${cityToCountry[cityLower]}" but card is for "${countryLower}"! Using ${confirmedCountry} as country.`);
  }
  
  // Map category to display name
  let categoryDisplay;
  switch(wonder.category) {
    case 'landmark':
      categoryDisplay = 'Landmark';
      break;
    case 'cultural':
      categoryDisplay = 'Cultural';
      break;
    case 'historical':
      categoryDisplay = 'Historical';
      break;
    case 'nature':
      categoryDisplay = 'Nature';
      break;
    case 'urban':
      categoryDisplay = 'Urban';
      break;
    case 'entertainment':
      categoryDisplay = 'Entertainment';
      break;
    default:
      categoryDisplay = wonder.category.charAt(0).toUpperCase() + wonder.category.slice(1);
  }
  
  // Get an image URL - use forced image if provided, otherwise get a random one
  const imageUrl = wonder.forceImage || getWonderImageUrl(wonder.category, cityLower);
  
  // Add special case for Terracotta Warriors location
  let displayCity = cityLower.charAt(0).toUpperCase() + cityLower.slice(1);
  let locationDisplay = `${displayCity}, ${confirmedCountry.charAt(0).toUpperCase() + confirmedCountry.slice(1)}`;
  
  // Special case for Terracotta Warriors which is actually in Xi'an but categorized under Beijing
  if (wonder.name === 'Terracotta Warriors') {
    locationDisplay = `Xi'an, ${confirmedCountry.charAt(0).toUpperCase() + confirmedCountry.slice(1)}`;
  }
  
  // Create card HTML
  card.innerHTML = `
    <div class="wonder-card-img">
      <img src="${imageUrl}" alt="${wonder.name}">
    </div>
    <div class="wonder-card-content">
      <div class="wonder-card-category">${categoryDisplay.toUpperCase()}</div>
      <h3 class="wonder-card-title">${wonder.name}</h3>
      <p class="wonder-card-description">${wonder.description}</p>
      <div class="wonder-card-location"><i class="fas fa-map-marker-alt"></i> ${locationDisplay}</div>
    </div>
  `;
  
  // Add the card to the grid
  placesGrid.appendChild(card);
  return card;
}

// Helper function to get a random wonder image URL based on category
function getWonderImageUrl(category, city) {
  // Define image collections for different categories
  const imageUrls = {
    'landmark': [
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1494922275507-58dc039ed337?ixlib=rb-1.2.1&auto=format&fit=crop&w=1047&q=80'
    ],
    'cultural': [
      'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1583396618422-436c7f3fa61e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1533050487297-09b450131914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ],
    'historical': [
      'https://images.unsplash.com/photo-1547965010-953a711d363d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1526558998726-aa738b56a238?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1555921015-5ab9d0e4c1de?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ],
    'nature': [
      'https://images.unsplash.com/photo-1502787530428-11cf61d6ba18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1565019011521-254775ab169a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ],
    'urban': [
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-1.2.1&auto=format&fit=crop&w=1824&q=80',
      'https://images.unsplash.com/photo-1495562569060-2eec283d3391?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ],
    'entertainment': [
      'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1048&q=80',
      'https://images.unsplash.com/photo-1603123853880-a92fafb7809f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1568736333610-eae6e0ab9206?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ],
    'test': [
      'https://images.unsplash.com/photo-1568736333610-eae6e0ab9206?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ]
  };
  
  // Get city-specific image collection if available, otherwise use category collection
  const categoryImages = imageUrls[category] || imageUrls['landmark'];
  
  // Generate a random index
  const randomIndex = Math.floor(Math.random() * categoryImages.length);
  
  // Return the selected image URL
  return categoryImages[randomIndex];
}

function setupFilterListeners() {
  console.log("Setting up filter listeners");
  
  // Country filter buttons
  const countryButtons = document.querySelectorAll('.filter-section.countries .filter-btn');
  console.log(`Found ${countryButtons.length} country buttons`);
  
  // Log all country buttons for debugging
  countryButtons.forEach(btn => {
    console.log(`- Country button: ${btn.textContent} (${btn.getAttribute('data-country')})`);
  });
  
  countryButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const country = this.getAttribute('data-country');
      console.log(`Country button clicked: ${country}`);
      
      // Update filter state
      filterState.country = country;
      filterState.city = null; // Reset city when country changes
      
      // Clear active class from all country buttons
      countryButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');

      // Clear any active class from city buttons
      document.querySelectorAll('.filter-section.cities .filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Show/hide city sections
      if (country === 'all') {
        // Hide all city sections
        document.querySelectorAll('.filter-section.cities').forEach(section => {
          section.style.display = 'none';
        });
        
        // Hide category filters
        const categorySection = document.querySelector('.filter-section.categories');
        if (categorySection) {
          categorySection.style.display = 'none';
        }
        
        // Hide featured wonder
        const featuredSection = document.querySelector('.featured-section');
        if (featuredSection) {
          featuredSection.style.display = 'none';
        }
      } else {
        // Show cities for this country
        showCitiesForCountry(country);
        
        // Show category filters
        const categorySection = document.querySelector('.filter-section.categories');
        if (categorySection) {
          categorySection.style.display = 'block';
        }
        
        // Show featured wonder for this country
        showFeaturedWonders(country);
      }
      
      // Apply filters and update UI
      applyFilters();
    });
  });
  
  // City filter buttons
  const cityButtons = document.querySelectorAll('.filter-section.cities .filter-btn');
  console.log(`Found ${cityButtons.length} city buttons across all countries`);
  
  cityButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const city = this.getAttribute('data-city');
      const country = cityToCountry[city];
      console.log(`City button clicked: ${city} in ${country}`);
      
      if (!country) {
        console.error(`No country mapping found for city: ${city}`);
        return;
      }
      
      // Update filter state
      filterState.city = city;
      
      // Clear active class from all city buttons within the same country section
      const countrySection = this.closest('.filter-section.cities');
      if (countrySection) {
        countrySection.querySelectorAll('.filter-btn.active').forEach(btn => {
          btn.classList.remove('active');
        });
      }
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Apply filters and update UI
      applyFilters();
    });
  });
  
  // Category filter buttons
  const categoryButtons = document.querySelectorAll('.filter-section.categories .filter-btn');
  console.log(`Found ${categoryButtons.length} category buttons`);
  
  categoryButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const category = this.getAttribute('data-category');
      console.log(`Category button clicked: ${category}`);
      
      // Update filter state
      filterState.category = category;
      
      // Clear active class from all category buttons
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Apply filters and update UI
      applyFilters();
    });
  });
  
  // Clear filter button
  const clearFilterButton = document.querySelector('.clear-filter');
  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Clear filter button clicked");
      resetFilters();
    });
  } else {
    console.error("Clear filter button not found");
  }
}

function showFeaturedWonders(country) {
  console.log(`Showing featured wonders for ${country}`);
  
  const featuredSection = document.querySelector('.featured-section');
  const featuredGrid = document.querySelector('.featured-grid');
  
  if (!featuredSection || !featuredGrid) {
    console.error("Featured section or grid not found");
    return;
  }
  
  const featuredWonder = featuredWonders[country];
  
  if (featuredWonder) {
    // Clear existing featured wonders
    featuredGrid.innerHTML = '';
    
    // Create the featured wonder card
    const categoryDisplay = featuredWonder.category.charAt(0).toUpperCase() + featuredWonder.category.slice(1);
    
    const featuredCard = document.createElement('a');
    
    // Special case for Angkor Wat - link to dedicated page
    if (country === 'cambodia' && featuredWonder.name === 'Angkor Wat') {
      featuredCard.href = 'places/angkor-wat.html';
    } else if (country === 'japan' && featuredWonder.name === 'Fushimi Inari Taisha') {
      featuredCard.href = 'places/fushimi-inari.html';
    } else if (country === 'china' && featuredWonder.name === 'Great Wall of China') {
      featuredCard.href = 'places/great-wall.html';
    } else if (country === 'china' && featuredWonder.name === 'Forbidden City') {
      featuredCard.href = 'places/forbidden-city.html';
    } else if (country === 'japan' && (featuredWonder.name === 'Golden Temple' || featuredWonder.name === 'Kinkaku-ji')) {
      featuredCard.href = 'places/golden-temple.html';
    } else if (country === 'japan' && featuredWonder.name === 'TeamLab Borderless') {
      featuredCard.href = 'places/teamlab-borderless.html';
    } else if (country === 'china' && featuredWonder.name === 'Terracotta Warriors') {
      featuredCard.href = 'places/terracotta-warriors.html';
    } else {
      featuredCard.href = '#';
    }
    
    featuredCard.className = 'featured-card';
    featuredCard.setAttribute('data-country', country);
    featuredCard.setAttribute('data-city', featuredWonder.city);
    
    featuredCard.innerHTML = `
      <img src="${featuredWonder.image}" alt="${featuredWonder.name}">
      <div class="featured-content">
        <span class="featured-category">${categoryDisplay}</span>
        <h3 class="featured-title">${featuredWonder.name}</h3>
        <p class="featured-desc">${featuredWonder.description}</p>
      </div>
    `;
    
    featuredGrid.appendChild(featuredCard);
    
    // Show the featured section
    featuredSection.style.display = 'block';
  } else {
    // Hide the featured section if no featured wonder for this country
    featuredSection.style.display = 'none';
  }
}

function showCitiesForCountry(country) {
  console.log(`Showing cities for country: ${country}`);
  
  // Hide all city sections first
  document.querySelectorAll('.filter-section.cities').forEach(section => {
    section.style.display = 'none';
  });
  
  if (country === 'all') {
    console.log('All countries selected, not showing any city filters');
    return;
  }
  
  // Show cities for selected country
  const citiesSection = document.querySelector(`.filter-section.cities.${country}-cities`);
  if (citiesSection) {
    console.log(`Found cities section for ${country}`);
    citiesSection.style.display = 'block';
  } else {
    console.error(`Cities section for ${country} not found`);
  }
}

function updateFilterPath() {
  const currentFilterElement = document.querySelector('.current-filter');
  if (!currentFilterElement) {
    console.error("Current filter element not found");
    return;
  }
  
  let filterPath = 'All';
  
  console.log("Updating filter path with state:", 
    "country:", filterState.country, 
    "city:", filterState.city,
    "category:", filterState.category
  );
  
  if (filterState.country !== 'all') {
    // Get country name from the button text
    const countryButton = document.querySelector(`.filter-btn[data-country="${filterState.country}"]`);
    if (countryButton) {
      filterPath = countryButton.textContent;
      
      if (filterState.city) {
        // Get city name from the button text
        const cityButton = document.querySelector(`.filter-btn[data-city="${filterState.city}"]`);
        if (cityButton) {
          filterPath += ' > ' + cityButton.textContent;
        }
      }
      
      if (filterState.category !== 'all') {
        // Get category name from the button text
        const categoryButton = document.querySelector(`.filter-btn[data-category="${filterState.category}"]`);
        if (categoryButton) {
          filterPath += ' > ' + categoryButton.textContent;
        }
      }
    }
  }
  
  currentFilterElement.textContent = filterPath;
  
  // Show/hide clear filter button
  const clearFilterButton = document.querySelector('.clear-filter');
  if (clearFilterButton) {
    if (filterState.country === 'all' && !filterState.city && filterState.category === 'all') {
      clearFilterButton.style.display = 'none';
    } else {
      clearFilterButton.style.display = 'inline-block';
    }
  }
}

function resetFilters() {
  console.log("Resetting all filters");
  
  // Reset filter state
  filterState.country = 'all';
  filterState.city = null;
  filterState.category = 'all';
  
  // Reset all active buttons
  document.querySelectorAll('.filter-btn.active').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Make "All" country button active
  const allCountryButton = document.querySelector('.filter-section.countries .filter-btn[data-country="all"]');
  if (allCountryButton) {
    allCountryButton.classList.add('active');
  }
  
  // Make "All" category button active
  const allCategoryButton = document.querySelector('.filter-section.categories .filter-btn[data-category="all"]');
  if (allCategoryButton) {
    allCategoryButton.classList.add('active');
  }
  
  // Hide all city sections
  document.querySelectorAll('.filter-section.cities').forEach(section => {
    section.style.display = 'none';
  });
  
  // Hide category section
  const categorySection = document.querySelector('.filter-section.categories');
  if (categorySection) {
    categorySection.style.display = 'none';
  }
  
  // Hide featured sections
  const featuredSection = document.querySelector('.featured-section');
  if (featuredSection) {
    featuredSection.style.display = 'none';
  }
  
  // Apply filters to show all wonders
  applyFilters();
}

function applyFilters() {
  console.log("Applying filters with state:", filterState);
  
  // Start with all cards
  filteredCards = [...allCards];
  
  // Filter by country
  if (filterState.country !== 'all') {
    filteredCards = filteredCards.filter(card => {
      return card.getAttribute('data-country') === filterState.country;
    });
    console.log(`After country filter: ${filteredCards.length} cards remaining`);
  }
  
  // Filter by city if specified
  if (filterState.city) {
    filteredCards = filteredCards.filter(card => {
      return card.getAttribute('data-city') === filterState.city;
    });
    console.log(`After city filter: ${filteredCards.length} cards remaining`);
  }
  
  // Filter by category if specified
  if (filterState.category !== 'all') {
    filteredCards = filteredCards.filter(card => {
      return card.getAttribute('data-category') === filterState.category;
    });
    console.log(`After category filter: ${filteredCards.length} cards remaining`);
  }
  
  // Update filter path display
  updateFilterPath();
  
  // Check if we have any results
  if (filteredCards.length === 0) {
    showNoResultsMessage();
  } else {
    hideNoResultsMessage();
  }
  
  // Reset pagination to page 1
  currentPage = 1;
  
  // Recalculate pagination
  calculateTotalPages();
  
  // Create pagination controls
  createPaginationControls();
  
  // Show the first page
  showCurrentPage();
}

function calculateTotalPages() {
  totalPages = Math.max(1, Math.ceil(filteredCards.length / ITEMS_PER_PAGE));
  console.log(`Calculated total pages: ${totalPages}`);
}

function showCurrentPage() {
  showPage(currentPage);
}

function createPaginationControls() {
  console.log("Creating pagination controls");
  
  // Remove any existing pagination container
  const existingPagination = document.querySelector('.pagination');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  // Create a new pagination container
  const paginationContainer = document.createElement('div');
  paginationContainer.classList.add('pagination');
  
  // Add pagination container after the places grid
  const placesGrid = document.querySelector('.places-grid');
  if (placesGrid && placesGrid.parentNode) {
    placesGrid.parentNode.insertBefore(paginationContainer, placesGrid.nextSibling);
  } else {
    console.error("Cannot find places grid to add pagination after");
    return;
  }
  
  // Initial update of pagination UI
  updatePaginationUI();
}

function showPage(page) {
  console.log(`Showing page ${page} of ${totalPages}`);
  
  // Validate page number
  if (page < 1) {
    page = 1;
  } else if (page > totalPages) {
    page = totalPages;
  }
  
  // Update current page
  currentPage = page;
  
  // Hide all cards first
  allCards.forEach(card => {
    card.style.display = 'none';
  });
  
  // Show only the cards for the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCards.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    if (i < filteredCards.length) {
      filteredCards[i].style.display = 'block';
    } else {
      console.warn(`Card index ${i} is out of bounds (filtered cards: ${filteredCards.length})`);
    }
  }
  
  // Update pagination UI
  updatePaginationUI();
}

function updatePaginationUI() {
  console.log(`Updating pagination UI for page ${currentPage} of ${totalPages}`);
  
  // Get the pagination container
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) {
    console.error("Pagination container not found");
    return;
  }
  
  // Clear existing pagination buttons
  paginationContainer.innerHTML = '';
  
  // Don't show pagination if only one page
  if (totalPages <= 1) {
    paginationContainer.style.display = 'none';
    return;
  }
  
  // Show pagination container
  paginationContainer.style.display = 'flex';
  
  // Previous button
  const prevButton = document.createElement('button');
  prevButton.innerHTML = '&laquo;';
  prevButton.classList.add('pagination-btn');
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      showPage(currentPage - 1);
    }
  });
  paginationContainer.appendChild(prevButton);
  
  // Create page buttons
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // Adjust if needed to always show 5 pages when possible
  if (endPage - startPage < 4 && totalPages > 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.add('pagination-btn');
    if (i === currentPage) {
      pageButton.classList.add('active');
    }
    pageButton.addEventListener('click', () => {
      showPage(i);
    });
    paginationContainer.appendChild(pageButton);
  }
  
  // Next button
  const nextButton = document.createElement('button');
  nextButton.innerHTML = '&raquo;';
  nextButton.classList.add('pagination-btn');
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      showPage(currentPage + 1);
    }
  });
  paginationContainer.appendChild(nextButton);
}

function showNoResultsMessage() {
  console.log("Showing no results message");
  
  // Remove any existing message
  hideNoResultsMessage();
  
  // Create the message element
  const messageElement = document.createElement('div');
  messageElement.className = 'no-results-message';
  messageElement.style.textAlign = 'center';
  messageElement.style.padding = '2rem';
  messageElement.style.color = '#666';
  messageElement.innerHTML = `
    <div style="font-size: 1.5rem; margin-bottom: 1rem;">No matching experiences found</div>
    <div>Try adjusting your filters or <button class="clear-filter-inline" style="background: none; border: none; color: #007bff; text-decoration: underline; cursor: pointer;">clear all filters</button></div>
  `;
  
  // Add message after places grid
  const placesGrid = document.querySelector('.places-grid');
  if (placesGrid && placesGrid.parentNode) {
    placesGrid.parentNode.insertBefore(messageElement, placesGrid.nextSibling);
    
    // Add event listener for inline clear filter button
    const clearFilterInline = messageElement.querySelector('.clear-filter-inline');
    if (clearFilterInline) {
      clearFilterInline.addEventListener('click', resetFilters);
    }
  }
}

function hideNoResultsMessage() {
  const messageElement = document.querySelector('.no-results-message');
  if (messageElement) {
    messageElement.remove();
  }
}

function debugPaginationState() {
  console.log("=== PAGINATION DEBUG ===");
  console.log(`Total cards: ${allCards.length}`);
  console.log(`Filtered cards: ${filteredCards.length}`);
  console.log(`Items per page: ${ITEMS_PER_PAGE}`);
  console.log(`Current page: ${currentPage}`);
  console.log(`Total pages: ${totalPages}`);
  
  const paginationContainer = document.querySelector('.pagination');
  console.log(`Pagination container exists: ${!!paginationContainer}`);
  if (paginationContainer) {
    console.log(`Pagination container display: ${window.getComputedStyle(paginationContainer).display}`);
    console.log(`Pagination buttons: ${paginationContainer.querySelectorAll('button').length}`);
  }
  console.log("=== END PAGINATION DEBUG ===");
}

function setupFeaturedWonderListeners() {
  // Get all featured wonder links
  const featuredCards = document.querySelectorAll('.featured-card');
  
  // Add hover effect and click tracking
  featuredCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const img = card.querySelector('img');
      if (img) {
        img.style.transform = 'scale(1.05)';
      }
    });
    
    card.addEventListener('mouseleave', () => {
      const img = card.querySelector('img');
      if (img) {
        img.style.transform = 'scale(1)';
      }
    });
    
    card.addEventListener('click', (e) => {
      const wonderName = card.querySelector('.featured-title').textContent;
      console.log(`Featured wonder clicked: ${wonderName}`);
      
      // Example analytics tracking (commented out)
      // if (typeof gtag !== 'undefined') {
      //   gtag('event', 'click', {
      //     'event_category': 'Featured Wonder',
      //     'event_label': wonderName
      //   });
      // }
    });
  });
}

function addDebugButton() {
  // Only add in development environment
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return;
  }
  
  // Add a debug button that's only visible in development
  const debugButton = document.createElement('button');
  debugButton.textContent = 'Debug Filter System';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '10px';
  debugButton.style.right = '10px';
  debugButton.style.zIndex = '9999';
  debugButton.style.padding = '5px 10px';
  debugButton.style.background = '#f0f0f0';
  debugButton.style.border = '1px solid #ccc';
  debugButton.style.display = 'none'; // Hidden by default
  
  debugButton.addEventListener('click', () => {
    console.group('Filter System Debug');
    console.log('Current filter state:', filterState);
    console.log('Total cards:', allCards.length);
    console.log('Filtered cards:', filteredCards.length);
    console.log('Pagination:', { currentPage, totalPages });
    console.groupEnd();
    
    // Toggle visibility of all country and city sections for inspection
    document.querySelectorAll('.filter-section.cities').forEach(section => {
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
    });
  });
  
  // Add keyboard shortcut to show/hide the debug button (Ctrl+Shift+D)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      debugButton.style.display = debugButton.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  document.body.appendChild(debugButton);
}