// stays.js - Specific functionality for the stays page

// Constants
const ITEMS_PER_PAGE = 9; // Show 9 items per page
let currentPage = 1;
let allCards = []; // Array to store all hotel cards
let filteredCards = []; // Array to store filtered hotel cards
let totalPages = 1; // Total number of pages

// Current filter state
const filterState = {
  country: 'all',
  city: null,
  price: null
};

// City to country mapping - same as in food.js
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
  // 'seoul': 'korea',
  // 'busan': 'korea',
  'bangkok': 'thailand',
  'phuket': 'thailand',
  'phnom-penh': 'cambodia',
  'siem-reap': 'cambodia',
  'melbourne': 'australia',
  'sydney': 'australia'
};

// Find the countryToCities mapping and add Thailand
const countryToCities = {
  'japan': ['tokyo', 'kyoto', 'osaka'],
  'china': ['shanghai', 'beijing', 'guangzhou'],
  'thailand': ['bangkok', 'phuket'],
  'cambodia': ['phnom-penh', 'siem-reap'],
  'australia': ['melbourne', 'sydney']
};

// Hotel data directly included in this file
const hotelData = {
  'tokyo': [
    { name: 'Sakura Hostel Asakusa', price: '$25-45/night', description: 'Centrally located hostel with clean facilities and friendly staff', category: 'budget' },
    { name: 'Wise Owl Hostels Shibuya', price: '$30-50/night', description: 'Modern capsule-style accommodation with great location', category: 'budget' },
    { name: 'UNPLAN Kagurazaka', price: '$35-60/night', description: 'Stylish hostel with both dorms and private rooms', category: 'budget' },
    { name: 'Hotel Gracery Shinjuku', price: '$120-180/night', description: 'Modern hotel featuring the famous Godzilla head, near entertainment district', category: 'standard' },
    { name: 'Mitsui Garden Hotel Ginza Premier', price: '$150-220/night', description: 'Sleek hotel with city views and easy access to shopping', category: 'standard' },
    { name: 'Shibuya Stream Excel Hotel Tokyu', price: '$170-250/night', description: 'Contemporary hotel connected to Shibuya Station', category: 'standard' },
    { name: 'Park Hyatt Tokyo', price: '$400-800/night', description: 'Luxury hotel featured in Lost in Translation with spectacular city views', category: 'premium' },
    { name: 'The Ritz-Carlton Tokyo', price: '$500-1000/night', description: 'Opulent accommodations in Roppongi with world-class service', category: 'premium' },
    { name: 'Aman Tokyo', price: '$700-1500/night', description: 'Ultra-luxury urban retreat with minimalist Japanese aesthetics', category: 'premium' }
  ],
  'osaka': [
    { name: 'J-Hoppers Osaka Guesthouse', price: '$20-40/night', description: 'Friendly hostel with great facilities and central location', category: 'budget' },
    { name: 'Osaka Guesthouse HIVE', price: '$25-45/night', description: 'Modern capsule-style hostel with stylish common areas', category: 'budget' },
    { name: 'Hotel Toyo', price: '$30-50/night', description: 'Simple, traditional Japanese-style budget hotel near markets', category: 'budget' },
    { name: 'Hotel Granvia Osaka', price: '$120-200/night', description: 'Connected to Osaka Station with convenient access to shopping and dining', category: 'standard' },
    { name: 'Cross Hotel Osaka', price: '$140-220/night', description: 'Trendy design hotel located in the heart of Dotonbori', category: 'standard', link: 'stays/osaka-cross-hotel.html' },
    { name: 'Osaka Marriott Miyako Hotel', price: '$180-280/night', description: 'Rooms with stunning city views in Japan\'s tallest building', category: 'standard' },
    { name: 'Conrad Osaka', price: '$350-700/night', description: 'Luxury high-rise hotel with panoramic city views and elegant interiors', category: 'premium', link: 'stays/osaka-conrad.html' },
    { name: 'The St. Regis Osaka', price: '$400-800/night', description: 'Sophisticated luxury hotel with signature butler service', category: 'premium' },
    { name: 'W Osaka', price: '$380-750/night', description: 'Vibrant, design-forward luxury hotel with distinctive style', category: 'premium', link: 'stays/osaka-w-hotel.html' }
  ],
  'kyoto': [
    { name: 'Guest House Oumi', price: '$25-45/night', description: 'Charming traditional house with tatami rooms and garden', category: 'budget' },
    { name: 'Len Kyoto Kawaramachi', price: '$30-60/night', description: 'Stylish hostel with coffee shop in central location', category: 'budget' },
    { name: 'Piece Hostel Kyoto', price: '$30-55/night', description: 'Award-winning design hostel with modern amenities', category: 'budget' },
    { name: 'Hotel Kanra Kyoto', price: '$150-250/night', description: 'Boutique hotel with contemporary Japanese design', category: 'standard' },
    { name: 'Kyoto Yura Hotel MGallery', price: '$180-280/night', description: 'Elegant hotel blending tradition and modernity near Nijo Castle', category: 'standard' },
    { name: 'The Thousand Kyoto', price: '$170-270/night', description: 'Sophisticated modern hotel near Kyoto Station', category: 'standard' },
    { name: 'The Ritz-Carlton Kyoto', price: '$600-1200/night', description: 'Luxury riverside property with impeccable service and design', category: 'premium' },
    { name: 'Aman Kyoto', price: '$900-1800/night', description: 'Exclusive retreat set in a secret garden surrounded by forest and ancient temples', category: 'premium', link: 'stays/kyoto-aman.html' },
    { name: 'Four Seasons Hotel Kyoto', price: '$500-1100/night', description: 'Elegant luxury hotel with beautiful pond garden in historic district', category: 'premium' }
  ],
  'kobe': [
    { name: 'Kobe Kua House', price: '$30-50/night', description: 'Budget-friendly hostel with comfortable common areas', category: 'budget' },
    { name: 'Hostel Nakamura Kobe', price: '$25-45/night', description: 'Simple, clean accommodation near Sannomiya Station', category: 'budget' },
    { name: 'Kobe Sannomiya R2 Hostel', price: '$30-55/night', description: 'Modern capsule hotel in convenient location', category: 'budget' },
    { name: 'Oriental Hotel', price: '$150-250/night', description: 'Historic hotel with European charm reopened after renovation', category: 'standard' },
    { name: 'La Suite Kobe Harborland', price: '$220-350/night', description: 'All-suite hotel with ocean views and spa services', category: 'standard' },
    { name: 'Hotel Okura Kobe', price: '$180-270/night', description: 'Elegant high-rise hotel with panoramic port views', category: 'standard' },
    { name: 'Kobe Kitano Hotel', price: '$300-500/night', description: 'Boutique luxury hotel in historic foreign settlement area', category: 'premium' },
    { name: 'Arima Grand Hotel', price: '$350-650/night', description: 'Traditional luxury ryokan with natural hot springs', category: 'premium' },
    { name: 'Ginsuiso Bekkan Choraku', price: '$400-700/night', description: 'Exclusive ryokan with private onsen baths and gourmet kaiseki cuisine', category: 'premium' }
  ],
  'shanghai': [
    { name: 'Blue Mountain Bund Youth Hostel', price: '$15-35/night', description: 'Budget hostel in historic building near the Bund', category: 'budget' },
    { name: 'Captain Hostel', price: '$20-40/night', description: 'Hostel on a renovated boat with river views', category: 'budget' },
    { name: 'Fish Inn East Nanjing Road', price: '$30-50/night', description: 'Artsy budget hotel in central location near Nanjing Road', category: 'budget' },
    { name: 'Hotel Indigo Shanghai on the Bund', price: '$130-220/night', description: 'Boutique hotel with eclectic design and river views', category: 'standard' },
    { name: 'The Yangtze Boutique Shanghai', price: '$120-200/night', description: 'Art deco hotel with 1930s Shanghai flair', category: 'standard' },
    { name: 'Jin Jiang Tower', price: '$120-190/night', description: 'Well-located hotel with classic Shanghai elegance', category: 'standard' },
    { name: 'The Peninsula Shanghai', price: '$400-800/night', description: 'Opulent art deco-inspired luxury on the historic Bund', category: 'premium' },
    { name: 'Park Hyatt Shanghai', price: '$380-750/night', description: 'Sleek, minimalist luxury in one of the world\'s tallest hotels', category: 'premium' },
    { name: 'Bulgari Hotel Shanghai', price: '$500-1000/night', description: 'Contemporary Italian luxury in a garden setting with river views', category: 'premium' }
  ],
  'beijing': [
    { name: 'Beijing Downtown Backpackers', price: '$15-35/night', description: 'Popular hostel in historic hutong with lively bar', category: 'budget' },
    { name: 'Leo Hostel', price: '$18-40/night', description: 'Budget-friendly accommodation in traditional courtyard house', category: 'budget' },
    { name: 'Peking Station Hostel', price: '$20-45/night', description: 'Clean, simple hostel with convenient location', category: 'budget' },
    { name: 'Hotel Jen Beijing', price: '$120-220/night', description: 'Modern hotel with co-working spaces and rooftop fitness', category: 'standard' },
    { name: 'The Emperor Tiananmen', price: '$130-210/night', description: 'Design hotel with rooftop bar near the Forbidden City', category: 'standard' },
    { name: 'Regent Beijing', price: '$150-250/night', description: 'Elegant hotel with traditional Chinese touches', category: 'standard' },
    { name: 'The Peninsula Beijing', price: '$350-700/night', description: 'Recently renovated luxury hotel with all-suite accommodations', category: 'premium' },
    { name: 'Waldorf Astoria Beijing', price: '$300-650/night', description: 'Sophisticated luxury in bronze-paneled architectural gem', category: 'premium' },
    { name: 'Mandarin Oriental Wangfujing', price: '$400-800/night', description: 'Refined luxury with stunning views of the Forbidden City', category: 'premium' }
  ],
  'shenzhen': [
    { name: 'Shenzhen Loft Youth Hostel', price: '$15-30/night', description: 'Industrial-style hostel with friendly atmosphere and communal spaces', category: 'budget' },
    { name: 'Pengker Deluxe Hostel', price: '$20-40/night', description: 'Clean, modern hostel with private pods and social areas', category: 'budget' },
    { name: 'Shenzhen Sunon Hotel', price: '$40-60/night', description: 'Budget business hotel with convenient location near shopping districts', category: 'budget' },
    { name: 'The Langham, Shenzhen', price: '$150-250/night', description: 'Elegant hotel with classic British styling and prime Futian location', category: 'standard' },
    { name: 'Shangri-La Shenzhen', price: '$160-280/night', description: 'High-rise hotel with spectacular views of Hong Kong and Shenzhen Bay', category: 'standard' },
    { name: 'Hard Rock Hotel Shenzhen', price: '$140-230/night', description: 'Trendy music-themed hotel within Mission Hills complex', category: 'standard' },
    { name: 'Muji Hotel Shenzhen', price: '$300-450/night', description: 'Minimalist luxury hotel by the popular Japanese lifestyle brand', category: 'premium' },
    { name: 'Raffles Shenzhen', price: '$450-700/night', description: 'Exquisite luxury hotel occupying the top floors of One Shenzhen Bay', category: 'premium' },
    { name: 'The St. Regis Shenzhen', price: '$400-650/night', description: 'Sophisticated high-rise luxury hotel with butler service and city views', category: 'premium' }
  ],
  'chongqing': [
    { name: 'Yangtze River Youth Hostel', price: '$12-25/night', description: 'Simple hostel with river views and rooftop terrace', category: 'budget' },
    { name: 'Chongqing Travelling With Hostel', price: '$15-30/night', description: 'Cozy hostel in central location with traditional Chinese decor', category: 'budget' },
    { name: 'Chongqing Jiangbei Hotel', price: '$35-55/night', description: 'Basic business hotel with convenient access to metro stations', category: 'budget' },
    { name: 'Somerset Jiefangbei Chongqing', price: '$110-180/night', description: 'Serviced apartments in the heart of the CBD with kitchen facilities', category: 'standard' },
    { name: 'Radisson Blu Hotel Chongqing Shapingba', price: '$130-200/night', description: 'Contemporary hotel with multiple dining options and wellness center', category: 'standard' },
    { name: 'InterContinental Chongqing Raffles City', price: '$150-250/night', description: 'Modern hotel in iconic "horizontal skyscraper" with amazing views', category: 'standard' },
    { name: 'JW Marriott Hotel Chongqing', price: '$280-450/night', description: 'Luxury hotel with panoramic views of Yuzhong Peninsula', category: 'premium' },
    { name: 'The Westin Chongqing Liberation Square', price: '$250-400/night', description: 'Upscale hotel with signature wellness amenities in downtown location', category: 'premium' },
    { name: 'Banyan Tree Chongqing Beibei', price: '$350-600/night', description: 'Luxury hot spring resort with private pools in tranquil mountain setting', category: 'premium' }
  ],
  'guangzhou': [
    { name: 'Lazy Gaga Hostel', price: '$15-30/night', description: 'Colorful, quirky hostel with communal kitchen and garden', category: 'budget' },
    { name: 'Guangzhou Yuexiu Youth Hostel', price: '$18-35/night', description: 'Clean, no-frills accommodation in historic district', category: 'budget' },
    { name: 'City Inn Plus Taojin Metro Station', price: '$40-65/night', description: 'Modern budget hotel with efficient service near subway', category: 'budget' },
    { name: 'LN Garden Hotel', price: '$140-220/night', description: 'Historic hotel set in lush gardens along the Pearl River', category: 'standard' },
    { name: 'Mandarin Oriental Guangzhou', price: '$180-280/night', description: 'Elegant hotel connected to high-end shopping mall in Tianhe district', category: 'standard' },
    { name: 'Conrad Guangzhou', price: '$160-250/night', description: 'Contemporary luxury hotel with river views and rooftop bar', category: 'standard' },
    { name: 'Four Seasons Hotel Guangzhou', price: '$300-500/night', description: 'Sophisticated luxury occupying top floors of IFC tower with amazing skyline views', category: 'premium' },
    { name: 'The Ritz-Carlton, Guangzhou', price: '$280-450/night', description: 'Refined luxury hotel with exceptional service in Zhujiang New Town', category: 'premium' },
    { name: 'Park Hyatt Guangzhou', price: '$250-400/night', description: 'Sleek, modern luxury with minimalist aesthetics and dramatic city views', category: 'premium' }
  ],
  'phnom-penh': [
    { name: 'Envoy Hostel Phnom Penh', price: '$8-20/night', description: 'Clean, social hostel with rooftop bar and river views', category: 'budget' },
    { name: 'Feliz Hostel & Cafe', price: '$10-25/night', description: 'Stylish hostel with cafe in renovated colonial building', category: 'budget' },
    { name: 'The Artist Guesthouse', price: '$25-45/night', description: 'Creative accommodation with art gallery and workshop space', category: 'budget' },
    { name: 'Plantation Urban Resort', price: '$90-150/night', description: 'Tropical oasis in the city center with lush gardens and pool', category: 'standard' },
    { name: 'Palace Gate Hotel', price: '$100-180/night', description: 'Elegant hotel opposite Royal Palace with colonial-inspired design', category: 'standard' },
    { name: 'Penh House & Jungle Addition', price: '$80-140/night', description: 'Boutique hotel with contrasting urban and tropical buildings', category: 'standard' },
    { name: 'Raffles Hotel Le Royal', price: '$250-400/night', description: 'Historic landmark hotel with classic colonial elegance since 1929', category: 'premium' },
    { name: 'Rosewood Phnom Penh', price: '$300-500/night', description: 'Ultra-luxury hotel occupying top floors of Vattanac Capital Tower', category: 'premium' },
    { name: 'Sofitel Phnom Penh Phokeethra', price: '$200-350/night', description: 'French colonial-style luxury hotel with expansive river views', category: 'premium' }
  ],
  'siem-reap': [
    { name: 'Onederz Hostel Siem Reap', price: '$10-25/night', description: 'Modern hostel with large pool and social atmosphere', category: 'budget' },
    { name: 'Baby Elephant Boutique Hotel', price: '$30-60/night', description: 'Eco-friendly hotel with tropical gardens and social impact initiatives', category: 'budget' },
    { name: 'Lub d Cambodia Siem Reap', price: '$20-45/night', description: 'Contemporary hostel with co-working space and outdoor pool', category: 'budget' },
    { name: 'Shinta Mani Angkor', price: '$120-220/night', description: 'Designer hotel by Bill Bensley with striking black and white aesthetic', category: 'standard' },
    { name: 'Viroth\'s Hotel', price: '$150-250/night', description: '1950s-inspired design hotel with vintage modernist architecture', category: 'standard' },
    { name: 'Jaya House River Park', price: '$180-280/night', description: 'Boutique hotel with two swimming pools and extensive sustainability initiatives', category: 'standard' },
    { name: 'Amansara', price: '$1000-1800/night', description: 'Former royal guesthouse transformed into an intimate luxury resort', category: 'premium' },
    { name: 'Phum Baitang', price: '$400-700/night', description: 'Luxury resort designed as a traditional Cambodian village with rice paddies', category: 'premium' },
    { name: 'Raffles Grand Hotel d\'Angkor', price: '$350-650/night', description: 'Historic landmark hotel with colonial grandeur and extensive gardens', category: 'premium' }
  ],
  'melbourne': [
    { name: 'Space Hotel', price: '$30-70/night', description: 'Modern budget hotel with rooftop jacuzzi and CBD location', category: 'budget' },
    { name: 'The Nunnery', price: '$25-65/night', description: 'Unique hostel in historic convent building', category: 'budget' },
    { name: 'Melbourne Central YHA', price: '$30-75/night', description: 'Well-equipped hostel with rooftop and great city views', category: 'budget' },
    { name: 'QT Melbourne', price: '$180-300/night', description: 'Playful, design-focused hotel in the fashion district', category: 'standard' },
    { name: 'The Savoy Hotel on Little Collins', price: '$150-250/night', description: 'Art Deco charm with modern amenities', category: 'standard' },
    { name: 'Ovolo Laneways', price: '$170-280/night', description: 'Boutique hotel on one of Melbourne\'s famous laneways', category: 'standard' },
    { name: 'Park Hyatt Melbourne', price: '$300-500/night', description: 'Elegant luxury with Italian marble bathrooms and city views', category: 'premium' },
    { name: 'The Langham Melbourne', price: '$350-600/night', description: 'Refined riverside luxury with acclaimed high tea service', category: 'premium' },
    { name: 'Jackalope Hotel', price: '$400-750/night', description: 'Avant-garde luxury boutique hotel with unique design', category: 'premium' }
  ],
  'sydney': [
    { name: 'Sydney Harbour YHA', price: '$40-80/night', description: 'Budget accommodation with rooftop and harbor views', category: 'budget' },
    { name: 'Wake Up! Sydney', price: '$30-70/night', description: 'Award-winning hostel with fun social atmosphere', category: 'budget' },
    { name: 'The Pod Sydney', price: '$35-75/night', description: 'Capsule-style budget hotel with modern pods', category: 'budget' },
    { name: 'QT Sydney', price: '$200-350/night', description: 'Quirky design hotel in historic building', category: 'standard' },
    { name: 'The Old Clare Hotel', price: '$190-320/night', description: 'Boutique hotel in converted brewery with rooftop pool', category: 'standard' },
    { name: 'Paramount House Hotel', price: '$180-300/night', description: 'Hip boutique hotel in former film studio headquarters', category: 'standard' },
    { name: 'Park Hyatt Sydney', price: '$800-1500/night', description: 'Prestigious luxury with Opera House views', category: 'premium' },
    { name: 'The Langham Sydney', price: '$450-850/night', description: 'Classic luxury in The Rocks with elegant afternoon tea', category: 'premium' },
    { name: 'Four Seasons Hotel Sydney', price: '$350-750/night', description: 'Harbor-front luxury with premium Opera House views', category: 'premium' }
  ],
  'thailand': [
    { name: 'Mandarin Oriental Bangkok', price: '$400-700/night', description: 'An iconic luxury hotel on the banks of the Chao Phraya River, offering timeless elegance, legendary service, world-class dining options, and an award-winning spa since 1876.', category: 'premium' }
  ],
  // Bangkok Hotels
  'bangkok': [
    // Budget Hotels
    { 
      name: "Lub d Bangkok Silom", 
      price: "$30-50/night", 
      description: "A trendy hostel with modern amenities and private rooms, located in the vibrant Silom district with easy access to BTS stations and nightlife.", 
      category: "budget",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/39615603.jpg?k=ffa7f14b1c5235d6ce05d737329387311c7ac10a8786a0f9b2c7fae6eb67f16d&o=&hp=1"
    },
    { 
      name: "Cloudy Hostel Sukhumvit", 
      price: "$25-40/night", 
      description: "Located in the heart of Sukhumvit, this cozy hostel offers clean rooms, a communal kitchen, and a rooftop lounge with city views, just minutes from shopping malls and restaurants.", 
      category: "budget",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/290043281.jpg?k=ec8dc2ff22cd8375c5f2c51dc85a490c6bcaa0d3e8756bc6bbcf31d6a610a87a&o=&hp=1"
    },
    { 
      name: "Nap Park Hostel", 
      price: "$20-35/night", 
      description: "Situated near Khao San Road, this stylish hostel features a mix of dorms and private rooms, a garden terrace, and personalized city tours for exploring Bangkok's highlights.", 
      category: "budget",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/105997305.jpg?k=ee7dd8e68b3cdb9cadf7f5e8baf1f3d3cc09b394cc87e3eea5073d6c31861a5e&o=&hp=1"
    },
    
    // Moderate Hotels
    { 
      name: "Amara Bangkok Hotel", 
      price: "$80-120/night", 
      description: "A contemporary 4-star hotel in Silom featuring a rooftop infinity pool with panoramic city views, a fitness center, and rooms with floor-to-ceiling windows and modern amenities.", 
      category: "standard",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/205840622.jpg?k=128737be82bfcf7374b0fc2072701f1e2db50c5b7c64b2a4acd13c0828e64a63&o=&hp=1"
    },
    { 
      name: "Modena by Fraser Bangkok", 
      price: "$70-110/night", 
      description: "A serviced apartment-style hotel offering spacious studios with kitchenettes, an outdoor pool, and a 24-hour fitness center, conveniently located near Queen Sirikit National Convention Center.", 
      category: "standard",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/66354929.jpg?k=b97a6353d2aa647c13eb74f9a02e7fcad24f9da3d92427147a0b8496d2eb7f9f&o=&hp=1"
    },
    { 
      name: "U Sukhumvit Bangkok", 
      price: "$90-130/night", 
      description: "A boutique hotel with innovative 24-hour stay policy, featuring a rooftop pool and bar, in the heart of the Sukhumvit area with complimentary tuk-tuk service to nearby attractions.", 
      category: "standard",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/52289544.jpg?k=3a7d57590fa11c8ed07d0811b1e216e8b04bbc29c4eaf06fd2e9b9100d7962f5&o=&hp=1"
    },
    
    // Premium Hotels
    { 
      name: "Mandarin Oriental Bangkok", 
      price: "$400-700/night", 
      description: "An iconic luxury hotel on the banks of the Chao Phraya River, offering timeless elegance, legendary service, world-class dining options, and an award-winning spa since 1876.", 
      category: "premium",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/187120043.jpg?k=ad87a3c87e8d33de5706be000769e30d1f7c127b20fcb3e4caf36ca02882c505&o=&hp=1"
    },
    { 
      name: "The Siam Hotel", 
      price: "$500-800/night", 
      description: "A luxurious urban retreat on the riverside featuring private pool villas, a Muay Thai boxing ring, art deco-inspired design, antique collections, and personalized butler service.", 
      category: "premium",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/85824483.jpg?k=fcc561cf1ffce3e0dc42ca7b4433b20c46f7c8a675918c8bab7e26f574461ad0&o=&hp=1"
    },
    { 
      name: "Lebua at State Tower", 
      price: "$250-450/night", 
      description: "Famous for its stunning rooftop restaurants and bars featured in 'The Hangover Part II', this all-suite luxury hotel offers breathtaking city and river views from its iconic golden dome.", 
      category: "premium",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/32649359.jpg?k=77ce801f644394faaef44bae2b4922b38d908f38ed6f8ede2a234ec5b7baee21&o=&hp=1"
    }
  ],
  
  // Phuket Hotels
  'phuket': [
    // Budget Hotels
    { 
      name: "Lub d Phuket Patong", 
      price: "$30-50/night", 
      description: "A vibrant social hostel just a short walk from Patong Beach, featuring a pool, co-working space, and cinema room, perfect for solo travelers and digital nomads.", 
      category: "budget",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/163517489.jpg?k=fc8906c85cd4c801a2bf3ff958f7cad1cb78c8fcb0b7d1e0e0de55f620322cd1&o=&hp=1"
    },
    { 
      name: "The Memory at On On Hotel", 
      price: "$35-60/night", 
      description: "Phuket's oldest hotel (established 1927) and featured in 'The Beach' film, beautifully restored with a mix of dormitories and private rooms in the heart of Phuket Old Town.", 
      category: "budget",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/204859441.jpg?k=fddee57eaf0432383a4326b311a7116b82a0147c5b7884f74407e9ac1c72fa2f&o=&hp=1"
    },
    { 
      name: "Evergreen Guesthouse", 
      price: "$25-45/night", 
      description: "A friendly, family-run guesthouse in Kata Beach offering simple, clean accommodations with air conditioning, a restaurant serving Thai cuisine, and only a 5-minute walk to the beach.", 
      category: "budget",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/252445290.jpg?k=264f28ec63a569599f184a65d055e4878f3c90f798b04d6b1d4867bed5466e60&o=&hp=1"
    },
    
    // Moderate Hotels
    { 
      name: "The Marina Phuket Hotel", 
      price: "$80-120/night", 
      description: "A stylish hotel in Patong featuring an infinity pool with panoramic Andaman Sea views, modern rooms with balconies, and a rooftop restaurant serving Thai and international cuisine.", 
      category: "standard",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/211155438.jpg?k=ebe9740d05af5825aff2feb8fc9dc34ccfb020881ecb929cdec0bdc490373f56&o=&hp=1"
    },
    { 
      name: "Burasari Phuket Resort", 
      price: "$100-150/night", 
      description: "A tranquil oasis just steps from Patong Beach, offering pool access rooms, lush tropical gardens, a spa specializing in traditional Thai treatments, and personalized service.", 
      category: "standard",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/87342464.jpg?k=e592d6b88f9ea0d9f9e576e8787e3476e9c5f2e30cb5f3bcd3df587488639475&o=&hp=1"
    },
    { 
      name: "The Slate (formerly Indigo Pearl)", 
      price: "$120-200/night", 
      description: "A design-focused resort inspired by Phuket's tin mining history, featuring uniquely styled suites, multiple pools, a spa, and eight restaurants near the tranquil Nai Yang Beach.", 
      category: "standard",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/168845911.jpg?k=0c20c48a7f16ea53a0f5ba7a1496ddfe7e9a765f80b32f1e0fa1eb023b19ebc0&o=&hp=1"
    },
    
    // Premium Hotels
    { 
      name: "Amanpuri", 
      price: "$800-1500/night", 
      description: "Aman's original resort celebrating 30+ years as Phuket's most exclusive address, featuring elegant pavilions and villas on a secluded peninsula with a private beach and exceptional service.", 
      category: "premium",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/223648066.jpg?k=d58798afbae56c84df99129aee5a1dfc21c1d0f62ef06836a4adf20e2ef12a11&o=&hp=1"
    },
    { 
      name: "Sri Panwa Phuket", 
      price: "$500-950/night", 
      description: "A stylish pool villa resort perched on Cape Panwa offering breathtaking Andaman Sea views, private infinity pools, and the famous Baba Nest rooftop bar rated among the world's best.", 
      category: "premium",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/224278400.jpg?k=c9c66871ee1f4f38bf419f4ef9e477e81e6e673c4f6cf4cd51ab05d2baeefb51&o=&hp=1"
    },
    { 
      name: "Trisara", 
      price: "$900-2000/night", 
      description: "An award-winning luxury resort featuring spacious pool villas with sea views, a private beach, exceptional dining including Michelin-starred PRU restaurant, and bespoke experiences.", 
      category: "premium",
      image: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/33598363.jpg?k=5bbcc0e4e871a67bdd048879fd2ce6b2e8a2e5b92c2822f1af1b61663ba2c0e1&o=&hp=1"
    }
  ]
};

// Featured hotels for each country
const featuredHotels = {
  'japan': {
    name: 'Aman Kyoto',
    city: 'kyoto',
    price: '$900-1800/night',
    description: 'Exclusive retreat set in a secret garden surrounded by forest and ancient temples',
    category: 'premium',
    image: 'https://www.amankyoto.com/wp-content/uploads/2019/03/Aman-Kyoto-Exterior.jpg'
  },
  'china': {
    name: 'The Peninsula Shanghai',
    city: 'shanghai',
    price: '$400-800/night',
    description: 'Opulent art deco-inspired luxury hotel on the historic Bund waterfront',
    category: 'premium',
    image: 'https://www.peninsula.com/en/-/media/images/shanghai/compressed-images/psh-exterior-l.jpg'
  },
  'cambodia': {
    name: 'Amansara',
    city: 'siem-reap',
    price: '$1000-1800/night',
    description: 'Former royal guesthouse transformed into an intimate luxury resort near Angkor Wat',
    category: 'premium',
    image: 'https://www.aman.com/sites/default/files/2021-03/Amansara-Exterior.jpg'
  },
  'australia': {
    name: 'Park Hyatt Sydney',
    city: 'sydney',
    price: '$800-1500/night',
    description: 'Prestigious waterfront luxury hotel with unparalleled Opera House views',
    category: 'premium',
    image: 'https://www.hyatt.com/content/dam/hyatt/hyattdam/images/2022/03/21/0748/SYDPH-P044-Exterior-Twilight.jpg/SYDPH-P044-Exterior-Twilight.16x9.jpg'
  },
  'thailand': {
    name: 'Mandarin Oriental Bangkok',
    city: 'bangkok',
    price: '$400-700/night',
    description: 'An iconic luxury hotel on the banks of the Chao Phraya River, offering timeless elegance, legendary service, world-class dining options, and an award-winning spa since 1876.',
    category: 'premium',
    image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/187120043.jpg?k=ad87a3c87e8d33de5706be000769e30d1f7c127b20fcb3e4caf36ca02882c505&o=&hp=1'
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded - initializing stays page");
  
  // Adding a slight delay to ensure all elements are properly loaded
  setTimeout(() => {
    initStaysPage();
    setupFeaturedHotelListeners();
  }, 300);
});

function initStaysPage() {
  console.log("Initializing stays page");
  
  // Get the stays grid
  const staysGrid = document.querySelector('.stays-grid');
  if (!staysGrid) {
    console.error("Stays grid not found");
    return;
  }
  
  // Remove initial message if any
  const initialMessage = document.querySelector('.initial-message');
  if (initialMessage) {
    initialMessage.remove();
  }
  
  // Generate hotel cards
  generateAllHotelCards(staysGrid);
  
  // Initialize all cards array
  allCards = Array.from(document.querySelectorAll('.stay-card'));
  
  console.log(`Generated ${allCards.length} hotel cards in total`);
  
  // Set filtered cards to all cards initially
  filteredCards = [...allCards];
  
  // Log hotel counts by country
  const countryCardCounts = {};
  allCards.forEach(card => {
    const cardCountry = card.getAttribute('data-country');
    if (!countryCardCounts[cardCountry]) {
      countryCardCounts[cardCountry] = 0;
    }
    countryCardCounts[cardCountry]++;
  });
  console.log("Hotel counts by country:", countryCardCounts);
  
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
  
  // Calculate total pages based on all cards
  totalPages = Math.ceil(allCards.length / ITEMS_PER_PAGE);
  
  // Create pagination controls
  createPaginationControls();
  
  // Show first page
  showPage(1);
  
  console.log("Stays page initialization complete");
}

function generateAllHotelCards(staysGrid) {
  console.log("Generating all hotel cards");
  
  // First clear any existing cards
  const existingCards = staysGrid.querySelectorAll('.stay-card');
  if (existingCards.length > 0) {
    console.log(`Removing ${existingCards.length} existing cards`);
    existingCards.forEach(card => card.remove());
  }
  
  // Track how many cards are generated
  let cardCount = 0;
  let countryCounts = {};
  
  // Loop through each city in hotelData
  for (const city in hotelData) {
    const hotels = hotelData[city];
    const country = cityToCountry[city] || 'unknown';
    
    // Track counts by country
    if (!countryCounts[country]) {
      countryCounts[country] = 0;
    }
    countryCounts[country] += hotels.length;
    
    console.log(`Processing ${hotels.length} hotels in ${city}, ${country}`);
    
    // Loop through each hotel
    hotels.forEach(hotel => {
      createHotelCard(hotel, country, city, staysGrid);
      cardCount++;
    });
  }
  
  console.log(`Generated ${cardCount} hotel cards for all cities`);
  console.log("Hotels by country:", countryCounts);
  
  
}

function createHotelCard(hotel, country, city, staysGrid) {
  // Create a new hotel card
  const card = document.createElement('a');
  
  // Set the proper link for the card - FIXED to create actual working links
  if (hotel.link) {
    // Use explicit link if provided
    card.href = hotel.link;
  } else {
    // Generate the URL using city-hotel pattern
    const hotelSlug = hotel.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[\'\.]/g, '')
      .replace(/&/g, 'and');
    card.href = `stays/${city}-${hotelSlug}.html`;
  }
  
  card.className = 'stay-card dynamic-card';
  
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
  
  // FIXED: Ensure price category is correctly set
  const priceCategory = hotel.category.toLowerCase();
  card.setAttribute('data-price', priceCategory);
  
  card.setAttribute('data-id', `${cityLower}-${hotel.name.replace(/\s+/g, '-').toLowerCase()}`);
  
  // Debug log - helps identify issues with specific countries/cities
  console.log(`Creating card for ${hotel.name} in ${cityLower}, ${confirmedCountry}, category: ${priceCategory}`);
  
  // Validate data - ensure city has a valid country mapping
  if (!cityToCountry[cityLower] && country !== 'test') {
    console.warn(`City "${cityLower}" has no country mapping in cityToCountry object!`);
  } else if (cityToCountry[cityLower] !== countryLower && country !== 'test') {
    console.warn(`City "${cityLower}" maps to "${cityToCountry[cityLower]}" but card is for "${countryLower}"! Using ${confirmedCountry} as country.`);
  }
  
  // Map price category to a stay category for display
  let category;
  switch(priceCategory) {
    case 'budget':
      category = 'Budget';
      card.setAttribute('data-category', 'budget');
      break;
    case 'standard':
      category = 'Standard';
      card.setAttribute('data-category', 'standard');
      break;
    case 'premium':
      category = 'Luxury';
      card.setAttribute('data-category', 'premium');
      break;
    default:
      category = 'Hotel';
      card.setAttribute('data-category', 'hotel');
  }
  
  // Generate a random image for the hotel based on category
  const imageUrls = {
    'budget': [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?ixlib=rb-1.2.1&auto=format&fit=crop&w=1189&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ],
    'standard': [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1053&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-1.2.1&auto=format&fit=crop&w=1189&q=80'
    ],
    'premium': [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    ]
  };
  
  const categoryImages = imageUrls[priceCategory] || imageUrls['standard'];
  const randomIndex = Math.floor(Math.random() * categoryImages.length);
  const imageUrl = categoryImages[randomIndex];
  
  // Generate appropriate star rating based on category
  let starRating = '';
  const fullStars = priceCategory === 'premium' ? 5 : (priceCategory === 'standard' ? 4 : 3);
  
  for (let i = 0; i < fullStars; i++) {
    starRating += '<i class="fas fa-star"></i>';
  }
  
  if (priceCategory === 'standard' && Math.random() > 0.5) {
    starRating += '<i class="fas fa-star-half-alt"></i>';
  } else if (priceCategory === 'budget') {
    starRating += '<i class="far fa-star"></i><i class="far fa-star"></i>';
  }
  
  card.innerHTML = `
    <div class="stay-card-img">
      <img src="${imageUrl}" alt="${hotel.name}">
      <span class="stay-card-category">${category}</span>
    </div>
    <div class="stay-card-content">
      <h3 class="stay-card-title">${hotel.name}</h3>
      <p class="stay-card-desc">${hotel.description}</p>
      <div class="stay-card-meta">
        <div class="stay-card-location"><i class="fas fa-map-marker-alt"></i> ${city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ')}, ${country.charAt(0).toUpperCase() + country.slice(1)}</div>
        <div class="stay-card-stars">
          ${starRating}
        </div>
      </div>
      <div class="price-range">${hotel.price}</div>
    </div>
  `;
  
  // Add the card to the grid
  staysGrid.appendChild(card);
}

function setupFilterListeners() {
  console.log("Setting up filter listeners");
  
  // Country filter buttons
  const countryButtons = document.querySelectorAll('.filter-section.countries .filter-btn');
  console.log(`Found ${countryButtons.length} country buttons`);
  
  countryButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const country = this.getAttribute('data-country');
      console.log(`Country button clicked: ${country}`);
      
      // Update filter state
      filterState.country = country;
      filterState.city = null; // Reset city when country changes
      
      // Clear active class from all country buttons
      document.querySelectorAll('.filter-section.countries .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        btn.style.color = '';
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      this.style.backgroundColor = '#000';
      this.style.color = '#fff';
      
      // Clear any active class from city buttons
      document.querySelectorAll('.filter-section.cities .filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        btn.style.color = '';
      });
      
      // Show/hide city sections
      if (country === 'all') {
        // Hide all city sections
        document.querySelectorAll('.filter-section.cities').forEach(section => {
          section.style.display = 'none';
        });
        
        // Hide featured hotel
        const featuredSection = document.querySelector('.featured-section');
        if (featuredSection) {
          featuredSection.style.display = 'none';
        }
      } else {
        // Show cities for this country
        showCitiesForCountry(country);
        
        // Show featured hotel for this country
        showFeaturedHotels(country);
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
      filterState.city = city === 'all' ? null : city;
      
      // Clear active class from all city buttons within the same country section
      const countrySection = this.closest('.filter-section.cities');
      if (countrySection) {
        countrySection.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
          btn.style.backgroundColor = '';
          btn.style.color = '';
        });
      }
      
      // Add active class and styling to clicked button
      this.classList.add('active');
      this.style.backgroundColor = '#000';
      this.style.color = '#fff';
      
      // Apply filters and update UI
      applyFilters();
    });
  });
  
  // Set up price filter buttons separately
  setupPriceFilterListeners();
  
  // Clear filter button
  const clearFilterButton = document.querySelector('.clear-filter');
  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Clear filter button clicked");
      resetFilters();
      return false;
    });
  } else {
    console.error("Clear filter button not found");
  }
}

function showFeaturedHotels(country) {
  console.log(`Showing featured hotels for ${country}`);
  
  const featuredSection = document.querySelector('.featured-section');
  const featuredGrid = document.querySelector('.featured-grid');
  
  if (!featuredSection || !featuredGrid) {
    console.error("Featured section or grid not found");
    return;
  }
  
  const featuredHotel = featuredHotels[country];
  
  if (featuredHotel) {
    // Clear existing featured hotels
    featuredGrid.innerHTML = '';
    
    // Create the featured hotel card
    const categoryDisplay = featuredHotel.category === 'premium' ? 'LUXURY' : 
                            (featuredHotel.category === 'standard' ? 'STANDARD' : 'BUDGET');
    
    const featuredCard = document.createElement('a');
    featuredCard.href = '#';
    featuredCard.className = 'featured-card';
    featuredCard.setAttribute('data-country', country);
    featuredCard.setAttribute('data-city', featuredHotel.city);
    
    featuredCard.innerHTML = `
      <img src="${featuredHotel.image}" alt="${featuredHotel.name}">
      <div class="featured-content">
        <span class="featured-category">${categoryDisplay}</span>
        <h3 class="featured-title">${featuredHotel.name}</h3>
        <p class="featured-desc">${featuredHotel.description}</p>
      </div>
    `;
    
    featuredGrid.appendChild(featuredCard);
    
    // Show the featured section
    featuredSection.style.display = 'block';
  } else {
    // Hide the featured section if no featured hotel for this country
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
    console.log(`Found cities section for ${country}: ${citiesSection.className}`);
    
    // Make sure cities section is visible with proper display style
    citiesSection.style.display = 'block';
    
    // Make sure cities are correctly reset when switching countries
    citiesSection.querySelectorAll('.filter-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Log all city buttons found for debugging
    const cityButtons = citiesSection.querySelectorAll('.filter-btn');
    console.log(`Found ${cityButtons.length} city buttons for ${country}:`);
    cityButtons.forEach(btn => {
      console.log(`- ${btn.getAttribute('data-city')}`);
    });
    
    // Check for common issues with city buttons
    if (cityButtons.length === 0) {
      console.error(`No city buttons found for ${country} - check HTML structure`);
    }
  } else {
    console.error(`Cities section for ${country} not found - check class name: '.filter-section.cities.${country}-cities'`);
    
    // Debug: List all city sections available
    console.log('Available city sections:');
    document.querySelectorAll('.filter-section.cities').forEach(section => {
      console.log(`- ${section.className}`);
    });
  }
  
  // Make sure price range filters are visible
  const priceSection = document.querySelector('.filter-section.price-categories');
  if (priceSection) {
    priceSection.style.display = 'block';
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
    "price:", filterState.price
  );
  
  if (filterState.country !== 'all') {
    // Get country name from the button text
    const countryButton = document.querySelector(`.filter-btn[data-country="${filterState.country}"]`);
    if (countryButton) {
      // If country is selected but no city, show "All [Country]"
      if (!filterState.city) {
        filterPath = `All ${countryButton.textContent}`;
      } else {
        filterPath = countryButton.textContent;
        
        // Get city name from the button text
        const cityButton = document.querySelector(`.filter-btn[data-city="${filterState.city}"]`);
        if (cityButton) {
          filterPath += ' > ' + cityButton.textContent;
        } else {
          console.error(`City button for "${filterState.city}" not found`);
        }
      }
      
      if (filterState.price) {
        // Get price name from the button text
        const priceButton = document.querySelector(`.filter-btn[data-price="${filterState.price}"]`);
        if (priceButton) {
          filterPath += ' > ' + priceButton.textContent;
        } else {
          console.error(`Price button for "${filterState.price}" not found`);
        }
      }
    } else {
      console.error(`Country button for "${filterState.country}" not found`);
    }
  } else if (filterState.price) {
    // Just price filter on "All"
    const priceButton = document.querySelector(`.filter-btn[data-price="${filterState.price}"]`);
    if (priceButton) {
      filterPath = `All > ${priceButton.textContent}`;
    } else {
      console.error(`Price button for "${filterState.price}" not found`);
    }
  }
  
  currentFilterElement.textContent = filterPath;
  
  // Show/hide clear filter button
  const clearFilterButton = document.querySelector('.clear-filter');
  if (clearFilterButton) {
    if (filterState.country === 'all' && !filterState.city && !filterState.price) {
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
  filterState.price = null;
  
  // Hide all city sections
  document.querySelectorAll('.filter-section.cities').forEach(section => {
    section.style.display = 'none';
  });
  
  // Show all cards
  filteredCards = [...allCards];
  
  // Reset active buttons and their styling
  document.querySelectorAll('.filter-btn.active').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.color = '';
  });
  
  // Set "All" button as active with proper styling
  const allButton = document.querySelector('.filter-btn[data-country="all"]');
  if (allButton) {
    allButton.classList.add('active');
    allButton.style.backgroundColor = '#000';
    allButton.style.color = '#fff';
  }
  
  // Hide featured hotel
  const featuredSection = document.querySelector('.featured-section');
  if (featuredSection) {
    featuredSection.style.display = 'none';
  }
  
  // Update filter path
  updateFilterPath();
  
  // Reset to page 1
  currentPage = 1;
  
  // Recalculate total pages
  totalPages = Math.ceil(allCards.length / ITEMS_PER_PAGE);
  
  // Show first page of all cards
  showPage(1);
}

function applyFilters() {
  console.log("Applying filters with state:", 
    "country:", filterState.country, 
    "city:", filterState.city,
    "price:", filterState.price
  );
  
  // Start with all cards
  filteredCards = [...allCards];
  
  // Filter by country
  if (filterState.country !== 'all') {
    filteredCards = filteredCards.filter(card => {
      const cardCountry = card.getAttribute('data-country');
      return cardCountry === filterState.country;
    });
    console.log(`Filtered by country=${filterState.country}: ${filteredCards.length} cards`);
  }
  
  // Filter by city if specified
  if (filterState.city) {
    filteredCards = filteredCards.filter(card => {
      const cardCity = card.getAttribute('data-city');
      return cardCity === filterState.city;
    });
    console.log(`Filtered by city=${filterState.city}: ${filteredCards.length} cards`);
  }
  
  // Filter by price if specified - IMPROVED PRICE FILTERING
  if (filterState.price) {
    // Log the first few cards to debug price values
    console.log("Checking card price values before filtering:");
    for (let i = 0; i < Math.min(5, filteredCards.length); i++) {
      console.log(`Card ${i}: data-price="${filteredCards[i].getAttribute('data-price')}", name="${filteredCards[i].querySelector('.stay-card-title').textContent}"`);
    }
    
    // Check if price buttons exist and log their data-price attributes
    const priceButtons = document.querySelectorAll('.filter-section.price-categories .filter-btn');
    console.log("Price filter buttons:");
    priceButtons.forEach(btn => {
      console.log(`- ${btn.textContent}: data-price="${btn.getAttribute('data-price')}" active=${btn.classList.contains('active')}`);
    });
    
    filteredCards = filteredCards.filter(card => {
      const cardPrice = card.getAttribute('data-price');
      const match = cardPrice === filterState.price;
      
      // If card doesn't match, log why for debugging
      if (!match && Math.random() < 0.1) { // log only 10% of non-matches to avoid console flood
        console.log(`Card didn't match: card price="${cardPrice}" vs filter="${filterState.price}"`);
      }
      
      return match;
    });
    
    console.log(`Filtered by price=${filterState.price}: ${filteredCards.length} cards`);
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
  totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  console.log(`Total pages: ${totalPages}`);
  
  // Update pagination controls
  updatePaginationUI();
  
  // Show the first page
  showPage(1);
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
  
  console.log(`Showing cards from index ${startIndex} to ${endIndex-1}`);
  
  for (let i = startIndex; i < endIndex; i++) {
    if (i < filteredCards.length) {
      filteredCards[i].style.display = 'block';
    }
  }
  
  // Update pagination UI to reflect the current page
  updatePaginationUI();
}

function createPaginationControls() {
  // Remove any existing pagination container
  const existingPagination = document.querySelector('.pagination');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  // Create a new pagination container
  const paginationContainer = document.createElement('div');
  paginationContainer.classList.add('pagination');
  
  // Apply consistent styles
  paginationContainer.style.display = 'flex';
  paginationContainer.style.justifyContent = 'center';
  paginationContainer.style.alignItems = 'center';
  paginationContainer.style.margin = '2rem 0';
  paginationContainer.style.gap = '0.5rem';
  paginationContainer.style.flexWrap = 'wrap';
  
  // Add pagination container after the stays grid
  const staysGrid = document.querySelector('.stays-grid');
  if (staysGrid && staysGrid.parentNode) {
    staysGrid.parentNode.insertBefore(paginationContainer, staysGrid.nextSibling);
  } else {
    // Fallback: Add to the main content
    const mainContent = document.querySelector('.content-container');
    if (mainContent) {
      mainContent.appendChild(paginationContainer);
    }
  }
  
  // Initial update of pagination UI
  updatePaginationUI();
}

function updatePaginationUI() {
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) {
    console.error("Pagination container not found");
    return;
  }
  
  // Clear existing pagination
  paginationContainer.innerHTML = '';
  
  // Only show pagination if we have more than one page
  if (totalPages <= 1) {
    paginationContainer.style.display = 'none';
    return;
  }
  
  paginationContainer.style.display = 'flex';
  
  // Create previous button
  const prevButton = document.createElement('button');
  prevButton.classList.add('pagination-btn', 'prev-btn');
  prevButton.innerHTML = '&laquo; Previous';
  prevButton.disabled = currentPage <= 1;
  
  // Apply styles for prev button
  prevButton.style.background = '#fff';
  prevButton.style.border = '1px solid #ddd';
  prevButton.style.padding = '0.5rem 1rem';
  prevButton.style.cursor = prevButton.disabled ? 'not-allowed' : 'pointer';
  
  if (prevButton.disabled) {
    prevButton.style.opacity = '0.5';
  }
  
  prevButton.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentPage > 1) {
      showPage(currentPage - 1);
    }
  });
  paginationContainer.appendChild(prevButton);
  
  // Create page buttons (show max 5 pages with ellipsis)
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // Add first page button if not included in range
  if (startPage > 1) {
    const firstPageButton = document.createElement('button');
    firstPageButton.classList.add('pagination-btn', 'page-btn');
    firstPageButton.textContent = '1';
    
    // Apply styles
    firstPageButton.style.background = '#fff';
    firstPageButton.style.border = '1px solid #ddd';
    firstPageButton.style.padding = '0.5rem 1rem';
    firstPageButton.style.cursor = 'pointer';
    
    firstPageButton.addEventListener('click', function(e) {
      e.preventDefault();
      showPage(1);
    });
    paginationContainer.appendChild(firstPageButton);
    
    // Add ellipsis if there's a gap
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.classList.add('pagination-ellipsis');
      ellipsis.textContent = '...';
      ellipsis.style.padding = '0.5rem 0.3rem';
      paginationContainer.appendChild(ellipsis);
    }
  }
  
  // Add page buttons
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.classList.add('pagination-btn', 'page-btn');
    
    // Apply styles
    pageButton.style.background = i === currentPage ? '#000' : '#fff';
    pageButton.style.color = i === currentPage ? '#fff' : '#000';
    pageButton.style.border = '1px solid #ddd';
    pageButton.style.padding = '0.5rem 1rem';
    pageButton.style.cursor = 'pointer';
    pageButton.style.minWidth = '2.5rem';
    pageButton.style.textAlign = 'center';
    
    pageButton.textContent = i;
    pageButton.addEventListener('click', function(e) {
      e.preventDefault();
      showPage(i);
    });
    paginationContainer.appendChild(pageButton);
  }
  
  // Add last page button if not included in range
  if (endPage < totalPages) {
    // Add ellipsis if there's a gap
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.classList.add('pagination-ellipsis');
      ellipsis.textContent = '...';
      ellipsis.style.padding = '0.5rem 0.3rem';
      paginationContainer.appendChild(ellipsis);
    }
    
    const lastPageButton = document.createElement('button');
    lastPageButton.classList.add('pagination-btn', 'page-btn');
    
    // Apply styles
    lastPageButton.style.background = '#fff';
    lastPageButton.style.border = '1px solid #ddd';
    lastPageButton.style.padding = '0.5rem 1rem';
    lastPageButton.style.cursor = 'pointer';
    lastPageButton.style.minWidth = '2.5rem';
    lastPageButton.style.textAlign = 'center';
    
    lastPageButton.textContent = totalPages;
    lastPageButton.addEventListener('click', function(e) {
      e.preventDefault();
      showPage(totalPages);
    });
    paginationContainer.appendChild(lastPageButton);
  }
  
  // Create next button
  const nextButton = document.createElement('button');
  nextButton.classList.add('pagination-btn', 'next-btn');
  nextButton.innerHTML = 'Next &raquo;';
  nextButton.disabled = currentPage >= totalPages;
  
  // Apply styles for next button
  nextButton.style.background = '#fff';
  nextButton.style.border = '1px solid #ddd';
  nextButton.style.padding = '0.5rem 1rem';
  nextButton.style.cursor = nextButton.disabled ? 'not-allowed' : 'pointer';
  
  if (nextButton.disabled) {
    nextButton.style.opacity = '0.5';
  }
  
  nextButton.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentPage < totalPages) {
      showPage(currentPage + 1);
    }
  });
  paginationContainer.appendChild(nextButton);
}

function setupFeaturedHotelListeners() {
  const featuredCards = document.querySelectorAll('.featured-card');
  
  featuredCards.forEach(card => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      const country = this.getAttribute('data-country');
      const city = this.getAttribute('data-city');
      
      if (country && city) {
        // Update filter state
        filterState.country = country;
        filterState.city = city;
        
        // Update UI to reflect the new filter state
        // Find and activate country button
        const countryButton = document.querySelector(`.filter-btn[data-country="${country}"]`);
        if (countryButton) {
          countryButton.click();
          
          // Find and activate city button
          setTimeout(() => {
            const cityButton = document.querySelector(`.filter-btn[data-city="${city}"]`);
            if (cityButton) {
              cityButton.click();
            }
          }, 100);
        }
      }
    });
  });
}

function debugPaginationState() {
  console.log("=== PAGINATION DEBUG ===");
  console.log("Current filter state:", 
    "country:", filterState.country, 
    "city:", filterState.city, 
    "price:", filterState.price
  );
  console.log(`Total cards: ${allCards.length}`);
  console.log(`Filtered cards: ${filteredCards.length}`);
  console.log(`Current page: ${currentPage}`);
  console.log(`Total pages: ${totalPages}`);
  console.log(`Items per page: ${ITEMS_PER_PAGE}`);
  
  // Check if pagination container exists
  const paginationContainer = document.querySelector('.pagination');
  console.log(`Pagination container exists: ${!!paginationContainer}`);
  
  if (paginationContainer) {
    console.log(`Pagination container display: ${window.getComputedStyle(paginationContainer).display}`);
    console.log(`Pagination buttons count: ${paginationContainer.querySelectorAll('button').length}`);
  }
  
  // Check a sample of filtered cards for debugging
  if (filteredCards.length > 0) {
    const sampleCard = filteredCards[0];
    console.log(`Sample card:`, {
      id: sampleCard.getAttribute('data-id'),
      country: sampleCard.getAttribute('data-country'),
      city: sampleCard.getAttribute('data-city'),
      price: sampleCard.getAttribute('data-price'),
      category: sampleCard.getAttribute('data-category'),
      display: sampleCard.style.display
    });
  } else {
    console.warn("No filtered cards to sample!");
  }
  
  console.log("=== END PAGINATION DEBUG ===");
}

function addDebugButton() {}

// Function to show a message when no results are found
function showNoResultsMessage() {
  console.log("Showing no results message");
  
  // Remove any existing message first
  hideNoResultsMessage();
  
  // Create a new message
  const staysGrid = document.querySelector('.stays-grid');
  if (!staysGrid) {
    console.error("Cannot find stays grid to add no results message");
    return;
  }
  
  const noResultsMessage = document.createElement('div');
  noResultsMessage.className = 'no-results-message';
  noResultsMessage.style.textAlign = 'center';
  noResultsMessage.style.padding = '2rem';
  noResultsMessage.style.gridColumn = '1 / -1';
  noResultsMessage.style.width = '100%';
  
  noResultsMessage.innerHTML = `
    <h3>No accommodations found</h3>
    <p>No accommodations match your current filter criteria. Please try different filters or <button class="reset-filters-btn">clear all filters</button>.</p>
  `;
  
  staysGrid.appendChild(noResultsMessage);
  
  // Add event listener to the reset button
  const resetButton = noResultsMessage.querySelector('.reset-filters-btn');
  if (resetButton) {
    resetButton.addEventListener('click', function(e) {
      e.preventDefault();
      resetFilters();
    });
  }
  
  // Hide the pagination
  const paginationContainer = document.querySelector('.pagination');
  if (paginationContainer) {
    paginationContainer.style.display = 'none';
  }
}

// Function to hide the no results message
function hideNoResultsMessage() {
  const existingMessage = document.querySelector('.no-results-message');
  if (existingMessage) {
    existingMessage.remove();
  }
}

// Add a new function to directly filter by city (similar to food.js)
function manualCityFilter(city) {
  if (!city) return;
  
  console.log(`Manual city filter triggered for: ${city}`);
  
  // First find the country for this city
  const country = cityToCountry[city];
  if (!country) {
    console.error(`Cannot filter by city "${city}" - no country mapping found`);
    return;
  }
  
  // Set filter state
  filterState.country = country;
  filterState.city = city;
  
  // Update UI to show the selection
  // First select country
  const countryBtn = document.querySelector(`.filter-btn[data-country="${country}"]`);
  if (countryBtn) {
    // Remove active class from all country buttons first
    document.querySelectorAll('.filter-section.countries .filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Make country button active
    countryBtn.classList.add('active');
    
    // Show city section for this country
    showCitiesForCountry(country);
    
    // Then select city
    setTimeout(() => {
      const cityBtn = document.querySelector(`.filter-btn[data-city="${city}"]`);
      if (cityBtn) {
        // Remove active class from all city buttons first
        document.querySelectorAll('.filter-section.cities .filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Make city button active
        cityBtn.classList.add('active');
      }
    }, 100);
  }
  
  // Apply filters
  applyFilters();
}

// Add a function to reset and reinitialize everything if needed
function resetAndReinitialize() {}

// Add a function to verify the filter system is working
function verifyFilterSystem() {}

// Add diagnostic function to check hotel distribution
function diagnoseHotelDistribution() {}

// New function to add missing Kobe button
function addMissingCityButtons() {}

// New function to fix price filter buttons
function fixPriceButtons() {}

// Separate function for price filter listeners
function setupPriceFilterListeners() {
  const priceButtons = document.querySelectorAll('.filter-section.price-categories .filter-btn');
  
  // Remove any existing listeners (to prevent duplicates)
  priceButtons.forEach(btn => {
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
  });
  
  // Get fresh references after cloning
  const freshPriceButtons = document.querySelectorAll('.filter-section.price-categories .filter-btn');
  
  freshPriceButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const price = this.getAttribute('data-price');
      console.log(`Price button clicked: ${price}, button text: ${this.textContent}`);
      
      // Check if this price is already active
      const isAlreadyActive = this.classList.contains('active');
      
      // Clear active class from all price buttons
      document.querySelectorAll('.filter-section.price-categories .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = '#fff';
        btn.style.color = '#000';
      });
      
      // Update filter state
      if (isAlreadyActive) {
        filterState.price = null; // Toggle off if already active
      } else {
        filterState.price = price;
        this.classList.add('active');
        
        // Apply active styling - BLACK BACKGROUND FOR ACTIVE BUTTON
        this.style.backgroundColor = '#000';
        this.style.color = '#fff';
      }
      
      // Log debug info
      console.log(`Price filter selected: ${filterState.price}`);
      console.log(`Button active class: ${this.classList.contains('active')}`);
      console.log(`Button styles: bgColor=${this.style.backgroundColor}, color=${this.style.color}`);
      
      // Apply filters and update UI
      applyFilters();
      
      // Debug the filter results
      console.log(`Filter by price=${filterState.price} results: ${filteredCards.length} cards`);
    });
  });
} 