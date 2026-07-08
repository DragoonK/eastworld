// food.js - Specific functionality for the food page

// CLEANUP - Remove any buttons that may have been added by previous code
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    // Find and remove any action-buttons containers and quick-filter-button containers
    document.querySelectorAll('.action-buttons, .quick-filter-button').forEach(el => {
      console.log('Removing added button:', el);
      el.remove();
    });
  }, 100);
});

// Constants
const ITEMS_PER_PAGE = 9; // Show 9 items per page
let currentPage = 1;
let allCards = []; // Array to store all restaurant cards
let filteredCards = []; // Array to store filtered restaurant cards
let totalPages = 1; // Total number of pages

// Current filter state
const filterState = {
  country: 'all',
  city: null,
  price: null
};

// Restaurant data by city
const RESTAURANTS_BY_CITY = {
  'tokyo': [
    { name: 'Ichiran Ramen', price: '$10-15', description: 'Famous individual ramen booths with customizable broths', category: 'budget' },
    { name: 'Genki Sushi', price: '$10-15', description: 'Tech-savvy conveyor belt sushi with tablet ordering', category: 'budget' },
    { name: 'CoCo Ichibanya', price: '$8-14', description: 'Popular curry chain with customizable spice levels', category: 'budget' },
    { name: 'Afuri Ramen', price: '$15-25', description: 'Renowned for yuzu-flavored ramen in stylish setting', category: 'standard' },
    { name: 'Maisen Tonkatsu', price: '$20-30', description: 'Specialty restaurant for premium breaded pork cutlets', category: 'standard' },
    { name: 'Gonpachi Nishi-Azabu', price: '$25-40', description: 'Inspired the famous Kill Bill restaurant scene, serving quality Japanese cuisine', category: 'standard' },
    { name: 'Sushi Saito', price: '$300-400', description: 'Exclusive three-Michelin-star sushi experience', category: 'premium' },
    { name: 'Narisawa', price: '$200-300', description: 'Innovative, sustainable Japanese cuisine with artistic presentation', category: 'premium' },
    { name: 'Nihonryori RyuGin', price: '$250-350', description: 'Three-Michelin-star kaiseki restaurant showcasing seasonal ingredients', category: 'premium' }
  ],
  'osaka': [
    { name: 'Bonzo', price: '$10-20', description: 'Authentic yakitori experience in the heart of Osaka\'s vibrant Dotonbori district', category: 'budget' },
    { name: 'Takoyaki Juhachiban', price: '$5-10', description: 'Famous octopus dumplings from a long-standing street stall', category: 'budget' },
    { name: 'Kinryu Ramen', price: '$8-12', description: 'Popular 24-hour ramen shop with dragon decor', category: 'budget' },
    { name: 'Takiman Kitahorie Yakiniku', price: '$30-45', description: 'Premium yakiniku restaurant operated by a 70-year-old butcher shop, specializing in carefully selected Kuroge Wagyu beef and rare cuts', category: 'standard', link: 'restaurants/osaka-takiman-kitahorie.html' },
    { name: 'Kani Doraku', price: '$30-50', description: 'Famous crab restaurant with giant crab sign in Dotonbori', category: 'standard' },
    { name: 'Mizuno', price: '$20-35', description: 'Legendary okonomiyaki restaurant with perpetual lines', category: 'standard' },
    { name: 'Jonetsu Horumon', price: '$25-40', description: 'Popular yakiniku restaurant specializing in high-quality horumon (offal) with flavorful marinades', category: 'standard' },
    { name: 'Hajime', price: '$200-350', description: 'Three-Michelin-star restaurant with philosophy-driven, innovative cuisine', category: 'premium' },
    { name: 'La Cime', price: '$150-250', description: 'Two-Michelin-star French-Japanese fusion by Chef Yusuke Takada', category: 'premium' },
    { name: 'Fujiya 1935', price: '$130-200', description: 'Innovative, experimental cuisine that blends Japanese and European influences', category: 'premium' }
  ],
  'kyoto': [
    { name: 'Musashi Sushi', price: '$10-20', description: 'Fast-paced conveyor belt sushi with fresh fish at reasonable prices', category: 'budget' },
    { name: 'Omen', price: '$12-20', description: 'Specializing in udon noodles with various toppings and dipping sauces', category: 'budget' },
    { name: 'Gyoza ChaoChao Sanjo Kiyamachi', price: '$8-15', description: 'Popular spot for crispy pan-fried dumplings and cold beer', category: 'budget' },
    { name: 'Kichi Kichi Omurice', price: '$20-35', description: 'Famous for theatrical omurice preparation by Chef Yukimura', category: 'standard' },
    { name: 'Pontocho Misoguigawa', price: '$40-70', description: 'French-Japanese fusion cuisine in a traditional setting', category: 'standard' },
    { name: 'Gion Karyo', price: '$50-80', description: 'Refined Kyoto cuisine in an elegant setting in the Gion district', category: 'standard' },
    { name: 'Kikunoi', price: '$150-300', description: 'Three-Michelin-star kaiseki restaurant showcasing seasonal Kyoto cuisine', category: 'premium' },
    { name: 'Hyotei', price: '$200-350', description: 'Historic restaurant serving traditional kaiseki in a 300-year-old setting', category: 'premium' },
    { name: 'Gion Sasaki', price: '$180-300', description: 'Intimate counter-only kaiseki experience with personalized service', category: 'premium' }
  ],
  'kobe': [
    { name: 'Kobe Beef Steakhouse', description: 'Experience authentic Kobe beef prepared by master chefs at this upscale steakhouse', category: 'premium', link: 'restaurants/kobe-beef-steakhouse.html' },
    { name: 'Kobe Gyoza Garden', description: 'Family-friendly restaurant specializing in delicious pan-fried gyoza dumplings', category: 'budget', link: 'restaurants/kobe-gyoza-garden.html' },
    { name: 'Oyster House Kobe', description: 'Fresh seafood restaurant specializing in premium oysters and champagne', category: 'premium', link: 'restaurants/kobe-oyster-house.html' },
    { name: 'Kitano Cafe', description: 'Charming cafe serving Western-inspired dishes in Kobe\'s historic Kitano district', category: 'standard', link: 'restaurants/kitano-cafe.html' },
    { name: 'The Bake Kobe', description: 'Trendy establishment that functions as an artisanal bakery & café by day and stylish cocktail bar by night.', category: 'premium', link: 'restaurants/kobe-the-bake.html' }
  ],
  'shanghai': [
    { name: 'Yang\'s Dumplings', price: '$3-7', description: 'Famous for crispy-bottomed pan-fried soup dumplings', category: 'budget' },
    { name: 'Jia Jia Tang Bao', price: '$5-10', description: 'Wildly popular hole-in-the-wall for perfect soup dumplings', category: 'budget' },
    { name: 'A Niang Mian', price: '$4-8', description: 'Authentic Shanghainese noodles with long history', category: 'budget' },
    { name: 'Din Tai Fung', price: '$20-40', description: 'Famous Taiwanese chain known for impeccable soup dumplings', category: 'standard' },
    { name: 'Lost Heaven', price: '$25-45', description: 'Atmospheric restaurant serving Yunnan cuisine from southwest China', category: 'standard' },
    { name: 'Old Jesse', price: '$30-50', description: 'Classic local favorite serving traditional Shanghai home cooking', category: 'standard' },
    { name: 'Ultraviolet by Paul Pairet', price: '$600-800', description: 'Multi-sensory dining experience with 20+ course avant-garde menu', category: 'premium' },
    { name: 'Fu 1088', price: '$100-150', description: 'High-end Shanghainese cuisine served in a restored 1930s villa', category: 'premium' },
    { name: '8 1/2 Otto e Mezzo Bombana', price: '$150-300', description: 'Three-Michelin-star Italian restaurant by Chef Umberto Bombana', category: 'premium' }
  ],
  'beijing': [
    { name: 'Baoyuan Dumplings', price: '$5-10', description: 'Colorful dumplings in various flavors popular with locals', category: 'budget' },
    { name: 'Mr. Shi\'s Dumplings', price: '$8-15', description: 'Foreigner-friendly dumpling spot with English menu', category: 'budget' },
    { name: 'Jing-A Brewing Co.', price: '$10-20', description: 'Craft brewery with pub food and relaxed atmosphere', category: 'budget' },
    { name: 'Duck de Chine', price: '$30-60', description: 'Upscale Peking duck restaurant with French influences', category: 'standard' },
    { name: 'Haidilao Hot Pot', price: '$25-50', description: 'Popular hot pot chain known for exceptional service', category: 'standard' },
    { name: 'TRB Hutong', price: '$40-80', description: 'Contemporary European cuisine in a restored temple setting', category: 'standard' },
    { name: 'King\'s Joy', price: '$100-200', description: 'Michelin-starred vegetarian restaurant with Buddhist influences', category: 'premium' },
    { name: 'Xin Rong Ji', price: '$150-300', description: 'Three-Michelin-star restaurant specializing in Taizhou cuisine', category: 'premium' },
    { name: 'Cai Yi Xuan', price: '$120-250', description: 'Refined Cantonese dining at the Four Seasons Hotel', category: 'premium' }
  ],
  'shenzhen': [
    { name: 'Shenzhen Dongmen Food Street', price: '$5-10', description: 'Bustling street food market with diverse regional cuisines', category: 'budget' },
    { name: 'Saizeriya', price: '$8-15', description: 'Budget-friendly Italian chain popular with young locals', category: 'budget' },
    { name: 'Baia Burger Concept', price: '$10-20', description: 'Creative burger joint with craft beers in OCT-LOFT', category: 'budget' },
    { name: 'Laurel Restaurant', price: '$25-45', description: 'Classic Cantonese cuisine with modern presentation', category: 'standard' },
    { name: 'Tian Gong', price: '$30-60', description: 'Authentic Sichuan cuisine with beautiful garden setting', category: 'standard' },
    { name: 'Paletto Italian Restaurant', price: '$40-70', description: 'Upscale Italian dining at the Ritz-Carlton', category: 'standard' },
    { name: 'Shang Garden', price: '$80-150', description: 'Refined Cantonese cuisine at the Shangri-La Hotel', category: 'premium' },
    { name: 'Ensue', price: '$200-350', description: 'Michelin-starred restaurant by Chef Christopher Kostow blending California and Cantonese influences', category: 'premium' },
    { name: 'Xiangqing Mansion', price: '$100-200', description: 'Exclusive private dining venue specializing in imperial cuisine', category: 'premium' }
  ],
  'chongqing': [
    { name: 'Chuanchuanxiang', price: '$5-10', description: 'Local-style skewer hot pot with various meat and vegetable options', category: 'budget' },
    { name: 'Zao Gao Li', price: '$8-15', description: 'Popular chain for authentic Chongqing xiaomian (spicy noodles)', category: 'budget' },
    { name: 'Qin Ma Hotpot', price: '$10-20', description: 'Traditional Chongqing hot pot at reasonable prices', category: 'budget' },
    { name: 'Cai Xiang Yuan', price: '$25-45', description: 'Refined Sichuan cuisine with elegant presentation', category: 'standard' },
    { name: 'De Zhuang', price: '$30-60', description: 'Popular upscale hot pot chain with quality ingredients', category: 'standard' },
    { name: 'Laurel Restaurant (Chongqing)', price: '$35-65', description: 'Classic Cantonese dishes alongside Sichuan specialties', category: 'standard' },
    { name: 'Spice Temple Chongqing', price: '$80-150', description: 'Contemporary fine dining featuring refined Sichuan flavors', category: 'premium' },
    { name: 'Yu\'s Family Kitchen', price: '$100-200', description: 'Private kitchen-style dining with innovative Sichuan cuisine', category: 'premium' },
    { name: 'Jade Garden', price: '$70-140', description: 'Upscale Cantonese restaurant with river views', category: 'premium' }
  ],
  'guangzhou': [
    { name: 'Guangzhou Restaurant', price: '$8-15', description: 'Historic establishment serving classic Cantonese dim sum', category: 'budget' },
    { name: 'Liwan Snack Street', price: '$5-10', description: 'Collection of street food stalls offering local specialties', category: 'budget' },
    { name: 'Tongqing Noodle Restaurant', price: '$5-12', description: 'Popular spot for authentic Cantonese noodle dishes', category: 'budget' },
    { name: 'Bingsheng Pinwei', price: '$25-50', description: 'Modern Cantonese restaurant popular with locals', category: 'standard' },
    { name: 'Panxi Restaurant', price: '$30-60', description: 'Traditional Cantonese cuisine in a beautiful garden setting', category: 'standard' },
    { name: 'Tian Tian Seafood Restaurant', price: '$40-80', description: 'Fresh seafood prepared in classic Cantonese style', category: 'standard' },
    { name: 'Jade River', price: '$70-150', description: 'Upscale Cantonese restaurant at the White Swan Hotel', category: 'premium' },
    { name: 'Jiang by Chef Fei', price: '$100-200', description: 'Innovative Cantonese cuisine by celebrated local chef', category: 'premium' },
    { name: 'Imperial Treasure Fine Chinese Cuisine', price: '$80-180', description: 'Refined Cantonese dining with emphasis on premium ingredients', category: 'premium' }
  ],
  'melbourne': [
    { name: 'Lentil As Anything', price: '$10-15', description: 'Pay-as-you-feel vegetarian restaurant with social mission', category: 'budget' },
    { name: 'Don Don', price: '$8-12', description: 'Fast, affordable Japanese rice bowls popular with students', category: 'budget' },
    { name: 'Shanghai Street Dumplings', price: '$10-15', description: 'Delicious, affordable dumplings with multiple locations', category: 'budget' },
    { name: 'Chin Chin', price: '$25-50', description: 'Perpetually buzzing Southeast Asian restaurant with no-reservations policy', category: 'standard' },
    { name: 'Tipo 00', price: '$30-60', description: 'Acclaimed pasta bar serving handmade Italian in relaxed setting', category: 'standard' },
    { name: 'Supernormal', price: '$35-65', description: 'Andrew McConnell\'s popular Asian-inspired restaurant', category: 'standard' },
    { name: 'Attica', price: '$300-350', description: 'Internationally acclaimed restaurant showcasing native Australian ingredients', category: 'premium' },
    { name: 'Vue de Monde', price: '$250-350', description: 'Theatrical fine dining with panoramic city views', category: 'premium' },
    { name: 'Flower Drum', price: '$150-250', description: 'Legendary Cantonese restaurant known for impeccable service', category: 'premium' }
  ],
  'sydney': [
    { name: 'Spice Alley', price: '$10-15', description: 'Open-air hawker-style food court serving diverse Asian cuisines', category: 'budget' },
    { name: 'Chat Thai', price: '$15-20', description: 'Popular Thai eatery serving authentic dishes in a casual setting', category: 'budget' },
    { name: 'Mr. Wong', price: '$20-30', description: 'Bustling Cantonese-style restaurant with dim sum and classic dishes', category: 'budget' },
    { name: 'Quay', price: '$40-80', description: 'Elegant waterfront dining with innovative Australian cuisine and harbor views', category: 'standard' },
    { name: 'Tetsuya\'s', price: '$50-90', description: 'Refined Japanese-French fusion in a serene Japanese garden setting', category: 'standard' },
    { name: 'Icebergs Dining Room', price: '$50-90', description: 'Iconic Bondi Beach restaurant with spectacular ocean views and Italian cuisine', category: 'standard' },
    { name: 'Sixpenny', price: '$180-250', description: 'Intimate fine dining restaurant with tasting menu highlighting local ingredients', category: 'premium' },
    { name: 'Sepia', price: '$200-300', description: 'Japanese-influenced fine dining with artistic presentation and innovative techniques', category: 'premium' },
    { name: 'Bennelong', price: '$150-250', description: 'Australian fine dining in the iconic Sydney Opera House with harbor views', category: 'premium' }
  ],
  'phnom-penh': [
    { name: 'Romdeng', price: '$8-15', description: 'NGO-run restaurant serving Cambodian cuisine with a social mission', category: 'budget' },
    { name: 'Phsar Kapko Restaurant', price: '$5-10', description: 'Local eatery serving authentic Khmer dishes near the Russian Market', category: 'budget' },
    { name: 'Eleven One Kitchen', price: '$6-12', description: 'Casual restaurant with healthy Cambodian food and vegetarian options', category: 'budget' },
    { name: 'Malis', price: '$15-30', description: 'Upscale restaurant specializing in traditional and modern Cambodian cuisine', category: 'standard' },
    { name: 'Khéma', price: '$20-40', description: 'French-inspired bistro with excellent charcuterie and pastries', category: 'standard' },
    { name: 'Topaz', price: '$30-60', description: 'Fine French dining in elegant surroundings', category: 'standard' },
    { name: 'Chinese House', price: '$40-80', description: 'Contemporary Asian fusion in a historic Chinese mansion', category: 'premium' },
    { name: 'Palais de la Poste', price: '$50-100', description: 'Fine dining in a beautifully restored colonial building', category: 'premium' },
    { name: 'Brasserie Louis', price: '$60-120', description: 'Sophisticated French and Cambodian cuisine at the Rosewood hotel', category: 'premium' }
  ],
  'siem-reap': [
    { name: 'Chanrey Tree', price: '$15-25', description: 'Traditional Khmer cuisine in a beautiful garden setting near the river', category: 'standard' },
    { name: 'Marum', price: '$12-25', description: 'Training restaurant for disadvantaged youth serving creative local dishes in a garden setting', category: 'standard' },
    { name: 'Cuisine Wat Damnak', price: '$25-35', description: 'Fine dining restaurant offering innovative Cambodian cuisine with seasonal tasting menus', category: 'premium' },
    { name: 'Khmer Kitchen', price: '$5-10', description: 'Authentic local dishes at affordable prices in a casual setting', category: 'budget' },
    { name: 'Mie Cafe', price: '$20-35', description: 'Fusion of traditional Khmer and modern international cuisine in a wooden Khmer house', category: 'standard' },
    { name: 'Pub Street Food Stands', price: '$3-8', description: 'Various street food vendors offering local specialties in the lively Pub Street area', category: 'budget' },
    { name: 'Malis Siem Reap', price: '$25-40', description: 'Elegant restaurant serving traditional recipes with contemporary presentations', category: 'premium' },
    { name: 'The Sugar Palm', price: '$15-30', description: 'Classic Cambodian home-style cooking in a beautiful wooden house', category: 'standard' },
    { name: 'Spoons', price: '$8-15', description: 'Social enterprise café serving Cambodian classics while supporting local youth', category: 'budget' }
  ],
  'bangkok': [
    // Budget options
    { name: 'Jay Fai', price: '$10-15', description: 'Michelin-starred street food stall famous for crab omelettes and wok-fired dishes', category: 'budget', link: 'restaurants/bangkok-jay-fai.html' },
    { name: 'Som Tam Nua', price: '$5-10', description: 'Popular spot specializing in Northeastern Thai cuisine, particularly papaya salad', category: 'budget', link: 'restaurants/bangkok-som-tam-nua.html' },
    { name: 'Thipsamai Pad Thai', price: '$5-8', description: 'Historic restaurant serving what many consider Bangkok\'s best pad thai since 1966', category: 'budget', link: 'restaurants/bangkok-thipsamai.html' },
    
    // Standard options
    { name: 'Supanniga Eating Room', price: '$20-35', description: 'Stylish restaurant offering traditional Thai recipes from Eastern and Northeastern regions', category: 'standard', link: 'restaurants/bangkok-supanniga.html' },
    { name: 'Err Urban Rustic Thai', price: '$25-40', description: 'Casual concept by acclaimed chefs, focusing on Thai drinking food and craft cocktails', category: 'standard', link: 'restaurants/bangkok-err.html' },
    { name: 'Soul Food Mahanakorn', price: '$25-45', description: 'Comfortable spot serving regional Thai dishes with quality ingredients and creative cocktails', category: 'standard', link: 'restaurants/bangkok-soul-food.html' },
    
    // Premium options
    { name: 'Gaggan Anand', price: '$200-300', description: 'Innovative, progressive Indian-influenced tasting menu by renowned chef Gaggan Anand', category: 'premium', link: 'restaurants/bangkok-gaggan.html' },
    { name: 'Le Normandie', price: '$150-250', description: 'Two-Michelin-starred French restaurant in the Mandarin Oriental with river views', category: 'premium', link: 'restaurants/bangkok-le-normandie.html' },
    { name: 'Sühring', price: '$150-220', description: 'Two-Michelin-starred modern German cuisine by twin chefs in a garden villa setting', category: 'premium', link: 'restaurants/bangkok-suhring.html' }
  ],
  
  'phuket': [
    // Budget options
    { name: 'Moo Moo Cabaret Restaurant', price: '$10-15', description: 'Local spot serving authentic Southern Thai dishes with fresh seafood', category: 'budget', link: 'restaurants/phuket-moo-moo.html' },
    { name: 'Raya Restaurant', price: '$8-15', description: 'Family-run restaurant in a historic Sino-Portuguese building serving classic Phuket cuisine', category: 'budget', link: 'restaurants/phuket-raya.html' },
    { name: 'Bang Pae Seafood', price: '$10-20', description: 'Rustic seafood restaurant near a waterfall serving freshly caught seafood', category: 'budget', link: 'restaurants/phuket-bang-pae.html' },
    
    // Standard options
    { name: 'Blue Elephant', price: '$30-60', description: 'Royal Thai cuisine in a stunning colonial mansion with cooking classes available', category: 'standard', link: 'restaurants/phuket-blue-elephant.html' },
    { name: 'Suay Restaurant', price: '$25-45', description: 'Creative Thai fusion cuisine by Chef Tammasak "Noi" Chootong in stylish surroundings', category: 'standard', link: 'restaurants/phuket-suay.html' },
    { name: 'Bampot Kitchen & Bar', price: '$35-70', description: 'European-inspired cuisine with a focus on modern techniques and quality ingredients', category: 'standard', link: 'restaurants/phuket-bampot.html' },
    
    // Premium options
    { name: 'PRU', price: '$120-180', description: 'Michelin-starred restaurant with farm-to-table concept using ingredients from their own farm', category: 'premium', link: 'restaurants/phuket-pru.html' },
    { name: 'Ta Khai', price: '$80-150', description: 'Rustic-luxe beachfront restaurant at Rosewood Phuket featuring authentic southern Thai seafood', category: 'premium', link: 'restaurants/phuket-ta-khai.html' },
    { name: 'Acqua', price: '$100-200', description: 'Award-winning contemporary Italian restaurant with chef Alessandro Frau at the helm', category: 'premium', link: 'restaurants/phuket-acqua.html' }
  ],
};

// City to country mapping
const CITY_TO_COUNTRY = {
  'tokyo': 'japan',
  'kyoto': 'japan',
  'osaka': 'japan',
  'kobe': 'japan',
  'shanghai': 'china',
  'beijing': 'china',
  'shenzhen': 'china',
  'chongqing': 'china',
  'guangzhou': 'china',
  'melbourne': 'australia',
  'sydney': 'australia',
  'phnom-penh': 'cambodia',
  'siem-reap': 'cambodia',
  'bangkok': 'thailand',
  'phuket': 'thailand'
};

// Unique image mapping for each restaurant
const RESTAURANT_IMAGES = {
  // Tokyo
  'Ichiran Ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Genki Sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'CoCo Ichibanya': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'Afuri Ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Maisen Tonkatsu': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Gonpachi Nishi-Azabu': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
  'Sushi Saito': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'Narisawa': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Nihonryori RyuGin': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Osaka
  'Bonzo': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Takoyaki Juhachiban': 'https://images.unsplash.com/photo-1609501676725-7186f1f4b1c4?w=800&q=80',
  'Kinryu Ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Takiman Kitahorie Yakiniku': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Kani Doraku': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Mizuno': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Jonetsu Horumon': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Hajime': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'La Cime': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Fujiya 1935': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Kyoto
  'Musashi Sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'Omen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Gyoza ChaoChao Sanjo Kiyamachi': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Kichi Kichi Omurice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Pontocho Misoguigawa': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Gion Karyo': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Kikunoi': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Hyotei': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Gion Sasaki': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Kobe
  'Kobe Beef Steakhouse': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Kobe Gyoza Garden': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Oyster House Kobe': 'assets/Oyster-House-Kobe.jpg',
  'Kitano Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'The Bake Kobe': 'assets/The-Bake-Kobe.png',
  
  // Shanghai
  'Yang\'s Dumplings': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  'Jia Jia Tang Bao': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
  'A Niang Mian': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Din Tai Fung': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'Lost Heaven': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Old Jesse': 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
  'Ultraviolet by Paul Pairet': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Fu 1088': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  '8 1/2 Otto e Mezzo Bombana': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Beijing
  'Baoyuan Dumplings': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  'Mr. Shi\'s Dumplings': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
  'Jing-A Brewing Co.': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'Duck de Chine': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Haidilao Hot Pot': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'TRB Hutong': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'King\'s Joy': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Xin Rong Ji': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Cai Yi Xuan': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Shenzhen
  'Shenzhen Dongmen Food Street': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Saizeriya': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Baia Burger Concept': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
  'Laurel Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Tian Gong': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Paletto Italian Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Shang Garden': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Ensue': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Xiangqing Mansion': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Chongqing
  'Chuanchuanxiang': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Zao Gao Li': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Qin Ma Hotpot': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Cai Xiang Yuan': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'De Zhuang': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
  'Laurel Restaurant (Chongqing)': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Spice Temple Chongqing': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Yu\'s Family Kitchen': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Jade Garden': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Guangzhou
  'Guangzhou Restaurant': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  'Liwan Snack Street': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Tongqing Noodle Restaurant': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Bingsheng Pinwei': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Panxi Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Tian Tian Seafood Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Jade River': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Jiang by Chef Fei': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Imperial Treasure Fine Chinese Cuisine': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Melbourne
  'Lentil As Anything': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Don Don': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'Shanghai Street Dumplings': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  'Chin Chin': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Tipo 00': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Supernormal': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Attica': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Vue de Monde': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Flower Drum': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Sydney
  'Spice Alley': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Chat Thai': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Mr. Wong': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Quay': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Tetsuya\'s': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Icebergs Dining Room': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Sixpenny': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Sepia': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Bennelong': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Phnom Penh
  'Romdeng': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Phsar Kapko Restaurant': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Eleven One Kitchen': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Malis': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Khéma': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Topaz': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Chinese House': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Palais de la Poste': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Brasserie Louis': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Siem Reap
  'Chanrey Tree': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Marum': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Cuisine Wat Damnak': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Khmer Kitchen': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Mie Cafe': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Pub Street Food Stands': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Malis Siem Reap': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'The Sugar Palm': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Spoons': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  
  // Bangkok
  'Jay Fai': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Som Tam Nua': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Thipsamai Pad Thai': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Supanniga Eating Room': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Err Urban Rustic Thai': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Soul Food Mahanakorn': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Gaggan Anand': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Le Normandie': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Sühring': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  
  // Phuket
  'Moo Moo Cabaret Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Raya Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Bang Pae Seafood': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Blue Elephant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Suay Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Bampot Kitchen & Bar': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'PRU': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Ta Khai': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Acqua': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'
};

// Featured restaurants by country
const FEATURED_RESTAURANTS = {
  'japan': ['tokyo-sushi-dai', 'kyoto-kikunoi', 'osaka-kani-doraku'],
  'china': ['guangzhou-dim-sum'],
  'cambodia': ['phnom-penh-romdeng'],
  'australia': ['melbourne-attica', 'sydney-bennelong'],
  'thailand': ['bangkok-jay-fai', 'phuket-moo-moo']
};

// Restaurant highlight for each country
const COUNTRY_HIGHLIGHT = {
  'japan': {
    city: 'tokyo',
    name: 'Sushi Dai',
    image: 'https://www.gotokyo.org/en/spot/482/images/482_0203_1.jpg',
    description: 'Located in Tokyo\'s renowned Toyosu Market, Sushi Dai offers some of the freshest sushi in the world. Despite the early morning queues, diners are rewarded with an unforgettable omakase experience featuring seasonal seafood selected by master chefs.',
    price: '$40-60 per person'
  },
  'china': {
    city: 'guangzhou',
    name: 'Guangzhou Dim Sum',
    image: 'https://www.springtomorrow.com/wp-content/uploads/2019/04/Din-Tai-Fung-Dim-Sum-Feast.jpg',
    description: 'Experience the birthplace of Cantonese dim sum with delicate dumplings, steamed buns, and other bite-sized delights. Guangzhou\'s teahouses offer traditional dim sum service, where trolleys loaded with bamboo steamers circulate through the dining room.',
    price: '$15-30 per person'
  },
  'cambodia': {
    city: 'siem-reap',
    name: 'Cuisine Wat Damnak',
    image: 'https://media-cdn.tripadvisor.com/media/photo-s/10/84/75/3a/cuisine-wat-damnak.jpg',
    description: 'Located in a traditional Cambodian wooden house, Cuisine Wat Damnak offers innovative Cambodian cuisine using fresh local ingredients. Chef Joannès Rivière creates sophisticated dishes based on traditional flavors, with seasonal tasting menus that highlight the richness of Cambodian culinary heritage.',
    price: '$25-35 per person'
  },
  'australia': {
    city: 'melbourne',
    name: 'Attica',
    image: 'https://cdn.broadsheet.com.au/cache/58/80/5880547647c4b2ae6155b92748dee379.jpg',
    description: 'One of Australia\'s most celebrated restaurants, Attica showcases native Australian ingredients in innovative ways. Chef Ben Shewry\'s tasting menu tells the story of the land through creative dishes that highlight indigenous flavors and sustainable practices.',
    price: '$300-350 per person'
  },
  'thailand': {
    city: 'bangkok',
    name: 'Jay Fai',
    image: 'https://asianinspirations.com.au/wp-content/uploads/2019/07/20190723-Jay-Fai.jpg',
    description: 'A Michelin-starred street food stall run by the legendary chef Jay Fai, known for her signature crab omelette and wok-fired seafood dishes. Watch as this goggle-wearing culinary master prepares each dish herself over charcoal fires.',
    price: '$10-15 per dish'
  }
};

// Global variables for pagination
// totalPages is already declared at the top of the file

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded - initializing food page");
  
  // Force a small delay to ensure all elements are properly loaded
  setTimeout(() => {
    initFoodPage();
    setupFeaturedRestaurantListeners();
    console.log("Food page initialization complete after delay");
  }, 300);
});

function verifyFilterSystem() {
  console.log("Verifying filter system functionality...");
  
  // Check if city filter buttons have proper event listeners
  const cityButtons = document.querySelectorAll('.filter-section.cities .filter-btn');
  console.log(`Found ${cityButtons.length} city filter buttons`);
  
  // Log the first few city buttons with their attributes
  cityButtons.forEach((btn, index) => {
    if (index < 5) {
      const city = btn.getAttribute('data-city');
      console.log(`City button ${index}: ${btn.textContent} (${city})`);
    }
  });
  
  // Check if any cards match common cities
  ['tokyo', 'phnom-penh', 'siem-reap', 'melbourne', 'sydney'].forEach(city => {
    const cityCards = Array.from(document.querySelectorAll('.food-card')).filter(
      card => card.getAttribute('data-city') === city
    );
    console.log(`Cards for city '${city}': ${cityCards.length}`);
  });
  
  // Test direct filtering on a sample city
  const sampleCity = 'tokyo';
  console.log(`Manually filtering for city: ${sampleCity}`);
  manualCityFilter(sampleCity);
}

function manualCityFilter(city) {
  // Get all cards
  const cards = document.querySelectorAll('.food-card');
  
  // Hide all cards first
  cards.forEach(card => {
    card.style.display = 'none';
  });
  
  // Show only cards with matching city
  let matchCount = 0;
  cards.forEach(card => {
    const cardCity = card.getAttribute('data-city');
    if (cardCity === city) {
      card.style.display = 'block';
      matchCount++;
    }
  });
  
  console.log(`Manual filter found ${matchCount} cards for ${city}`);
}

function initFoodPage() {
  console.log("Initializing food page");
  
  // Get the food grid
  const foodGrid = document.querySelector('.food-grid');
  if (!foodGrid) {
    console.error("Food grid not found");
    return;
  }
  
  // Remove initial message
  const initialMessage = document.querySelector('.initial-message');
  if (initialMessage) {
    initialMessage.remove();
  }
  
  // Generate restaurant cards
  generateAllRestaurantCards(foodGrid);
  
  // Initialize all cards array
  allCards = Array.from(document.querySelectorAll('.food-card'));
  
  console.log(`Generated ${allCards.length} restaurant cards in total`);
  
  // Set filtered cards to all cards initially
  filteredCards = [...allCards];
  
  // Log restaurant counts by country
  const countryCardCounts = {};
  allCards.forEach(card => {
    const cardCountry = card.getAttribute('data-country');
    if (!countryCardCounts[cardCountry]) {
      countryCardCounts[cardCountry] = 0;
    }
    countryCardCounts[cardCountry]++;
  });
  console.log("Restaurant counts by country:", countryCardCounts);
  
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
  
  console.log("Food page initialization complete");
}

function setupFilterListeners() {
  console.log("Setting up filter listeners");
  
  // Country filter buttons
  let countryButtons = document.querySelectorAll('.filter-section.countries .filter-btn');
  console.log(`Found ${countryButtons.length} country buttons`);
  
  // Clone buttons and remove old listeners
  const newCountryButtons = [];
  countryButtons.forEach(button => {
    // Create a clone to remove any existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newCountryButtons.push(newButton);
    
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      const country = this.getAttribute('data-country');
      console.log(`Country button clicked: ${country}`);
      
      // Update filter state
      filterState.country = country;
      filterState.city = null; // Reset city when country changes
      filterState.price = null; // Reset price when country changes
      
      // Clear active class from all country buttons - using current DOM elements
      document.querySelectorAll('.filter-section.countries .filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to clicked button
      this.classList.add('active');

      // Clear any active class from city buttons
      document.querySelectorAll('.filter-section.cities .filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Clear any active class from price buttons
      document.querySelectorAll('.filter-section.price-categories .filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Show/hide city sections
      if (country === 'all') {
        // Hide all city sections
        document.querySelectorAll('.filter-section.cities').forEach(section => {
          section.style.display = 'none';
        });
        
        // Update featured restaurant display
        const featuredSection = document.querySelector('.featured-section');
        if (featuredSection) {
          featuredSection.style.display = 'none';
        }
      } else {
        // Show cities for this country
        showCitiesForCountry(country);
        
        // Show featured restaurant for this country
        showFeaturedRestaurant(country);
      }
      
      // Apply filters and update UI
      applyFilters();
    });
  });
  
  // City filter buttons - completely revised approach
  let cityButtons = document.querySelectorAll('.filter-section.cities .filter-btn');
  console.log(`Found ${cityButtons.length} city buttons across all countries`);
  
  // Clone buttons and remove old listeners
  const newCityButtons = [];
  cityButtons.forEach(button => {
    // Create a clone to remove any existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newCityButtons.push(newButton);
    
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      const city = this.getAttribute('data-city');
      const country = CITY_TO_COUNTRY[city];
      console.log(`City button clicked: ${city} in ${country}`);
      
      if (!country) {
        console.error(`No country mapping found for city: ${city}`);
        return;
      }
      
      // Update filter state
      filterState.city = city;
      console.log(`Updated filter state: city=${filterState.city}`);
      
      // Clear active class from all city buttons within all country sections
      document.querySelectorAll('.filter-section.cities .filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Directly filter the cards for this city
      filterCardsByCity(city);
      
      // Update the filter path display
      updateFilterPath();
    });
  });
  
  // Price filter buttons - revised approach
  let priceButtons = document.querySelectorAll('.filter-section.price-categories .filter-btn');
  
  // Clone buttons and remove old listeners
  const newPriceButtons = [];
  priceButtons.forEach(button => {
    // Create a clone to remove any existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newPriceButtons.push(newButton);
    
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      const price = this.getAttribute('data-price');
      console.log(`Price button clicked: ${price}`);
      
      // Check if this price is already active
      const isAlreadyActive = this.classList.contains('active');
      
      // Clear active class from all price buttons using current DOM elements
      document.querySelectorAll('.filter-section.price-categories .filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Update filter state
      if (isAlreadyActive) {
        filterState.price = null; // Toggle off if already active
      } else {
        filterState.price = price;
        this.classList.add('active');
      }
      
      // Apply filters and update UI
      applyFilters();
    });
  });
  
  // Clear filter button
  const clearFilterButton = document.querySelector('.clear-filter');
  if (clearFilterButton) {
    // Remove any existing listeners first
    const newButton = clearFilterButton.cloneNode(true);
    clearFilterButton.parentNode.replaceChild(newButton, clearFilterButton);
    
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Clear filter button clicked");
      resetFilters();
      return false;
    });
  } else {
    console.error("Clear filter button not found");
  }
}

function showFeaturedRestaurant(country) {
  console.log(`Showing featured restaurant for ${country}`);
  
  const featuredSection = document.querySelector('.featured-section');
  const featuredHero = document.querySelector('.featured-hero');
  
  if (!featuredSection || !featuredHero) {
    console.error("Featured section or hero not found");
    return;
  }
  
  const countryHighlight = COUNTRY_HIGHLIGHT[country];
  
  if (countryHighlight) {
    // Create the featured restaurant hero
    featuredHero.innerHTML = `
      <div class="featured-hero-image">
        <img src="${countryHighlight.image}" alt="${countryHighlight.name}">
      </div>
      <div class="featured-hero-content">
        <span class="featured-category">${countryHighlight.category || 'Featured'}</span>
        <h3 class="featured-title">${countryHighlight.name}</h3>
        <p class="featured-desc">${countryHighlight.description}</p>
        <div class="featured-meta">
          <div class="featured-location"><i class="fas fa-map-marker-alt"></i> ${countryHighlight.city.charAt(0).toUpperCase() + countryHighlight.city.slice(1).replace(/-/g, ' ')}, ${country.charAt(0).toUpperCase() + country.slice(1)}</div>
          <div class="featured-price">${countryHighlight.price}</div>
        </div>
        <a href="#" class="featured-cta" data-city="${countryHighlight.city}">Explore Restaurants in ${countryHighlight.city.charAt(0).toUpperCase() + countryHighlight.city.slice(1).replace(/-/g, ' ')}</a>
      </div>
    `;
    
    // Show the featured section
    featuredSection.style.display = 'block';
    
    // Add event listener to the CTA button
    const ctaButton = featuredHero.querySelector('.featured-cta');
    if (ctaButton) {
      ctaButton.addEventListener('click', function(e) {
        e.preventDefault();
        const city = this.getAttribute('data-city');
        if (city) {
          // Find and click the corresponding city button
          const cityButton = document.querySelector(`.filter-btn[data-city="${city}"]`);
          if (cityButton) {
            cityButton.click();
          }
        }
      });
    }
  } else {
    // Hide the featured section if no featured restaurant for this country
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
      filterPath = 'All > ' + priceButton.textContent;
    } else {
      console.error(`Price button for "${filterState.price}" not found`);
    }
  }
  
  console.log(`Setting filter text to: ${filterPath}`);
  currentFilterElement.textContent = filterPath;
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
  
  // Reset active buttons - using current DOM queries to ensure we target the right elements
  document.querySelectorAll('.filter-btn.active').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Set "All" button as active
  const allButton = document.querySelector('.filter-btn[data-country="all"]');
  if (allButton) {
    allButton.classList.add('active');
  } else {
    console.error("All country button not found - filter reset may not display correctly");
  }
  
  // Hide featured restaurant
  const featuredSection = document.querySelector('.featured-section');
  if (featuredSection) {
    featuredSection.style.display = 'none';
  }
  
  // Update filter path
  updateFilterPath();
  
  // Reset to page 1
  currentPage = 1;
  
  // Recalculate total pages - using all cards
  totalPages = Math.ceil(allCards.length / ITEMS_PER_PAGE);
  if (totalPages < 1) totalPages = 1;
  
  // Force at least 2 pages for the "All" view to ensure pagination shows
  if (totalPages < 2) {
    console.warn("Forcing at least 2 pages for All view after reset");
    totalPages = Math.max(2, totalPages);
  }
  
  console.log(`After reset: ${filteredCards.length} cards, ${totalPages} pages`);
  
  // Show first page of all cards
  showCurrentPage();
  
  // Update pagination UI
  updatePaginationUI();
  
  console.log("Filters reset successfully");
}

function applyFilters() {
  console.log("Applying filters:", 
    "country:", filterState.country, 
    "city:", filterState.city, 
    "price:", filterState.price
  );
  
  // If no filters are applied (showing "All"), use all cards
  if (filterState.country === 'all' && !filterState.city && !filterState.price) {
    console.log("No filters applied, showing all cards");
    filteredCards = [...allCards];
  } else {
    // Filter cards based on current filter state
    filteredCards = [];
    
    // Debug: Check how many cards we have
    console.log(`Total cards before filtering: ${allCards.length}`);
    
    // Loop through each card and check if it matches the filters
    allCards.forEach(card => {
      const cardCountry = card.getAttribute('data-country');
      const cardCity = card.getAttribute('data-city');
      const cardPrice = card.getAttribute('data-price');
      
      let include = true;
      
      // Country filter - always check this
      if (filterState.country !== 'all' && cardCountry !== filterState.country) {
        include = false;
      }
      
      // City filter - only apply if a city is selected
      if (include && filterState.city && cardCity !== filterState.city) {
        include = false;
      }
      
      // Price filter - only apply if a price is selected
      if (include && filterState.price && cardPrice !== filterState.price) {
        include = false;
      }
      
      // Add to filtered cards if it passed all filters
      if (include) {
        filteredCards.push(card);
      }
    });
  }
  
  console.log(`After filtering: ${filteredCards.length} cards match the current filters`);
  
  // Debug: Show filtered card countries and cities
  if (filteredCards.length > 0) {
    console.log("Sample filtered cards:");
    const sampleSize = Math.min(3, filteredCards.length);
    for (let i = 0; i < sampleSize; i++) {
      const card = filteredCards[i];
      console.log(`Card ${i}: country=${card.getAttribute('data-country')}, city=${card.getAttribute('data-city')}, price=${card.getAttribute('data-price')}`);
    }
  } else {
    console.warn("No cards match the current filters!");
    
    // Debug info to help diagnose why no cards matched
    if (filterState.city) {
      const cityMatches = allCards.filter(card => card.getAttribute('data-city') === filterState.city);
      console.log(`Cards matching city '${filterState.city}': ${cityMatches.length}`);
      
      if (cityMatches.length === 0) {
        // Check if any cards have this city attribute at all
        const allCities = new Set();
        allCards.forEach(card => {
          allCities.add(card.getAttribute('data-city'));
        });
        console.log("Available cities in cards:", Array.from(allCities));
      }
    }
  }
  
  // Update filter path display
  updateFilterPath();
  
  // Calculate total pages
  calculateTotalPages();
  
  // Reset to page 1 when filters change
  currentPage = 1;
  
  // Update pagination UI
  updatePaginationUI();
  
  // Show first page
  showPage(1);
}

function calculateTotalPages() {
  const previousTotal = totalPages;
  totalPages = Math.max(1, Math.ceil(filteredCards.length / ITEMS_PER_PAGE));
  console.log(`Calculated total pages: ${totalPages} (${filteredCards.length} cards, ${ITEMS_PER_PAGE} per page)`);
  if (previousTotal !== totalPages) {
    console.log(`Total pages changed from ${previousTotal} to ${totalPages}`);
  }
}

function showCurrentPage() {
  showPage(currentPage);
}

function createPaginationControls() {
  console.log("Creating pagination controls");
  
  // Remove any existing pagination container
  const existingPagination = document.querySelector('.pagination');
  if (existingPagination) {
    console.log("Removing existing pagination container");
    existingPagination.remove();
  }
  
  // Create a new pagination container
  const paginationContainer = document.createElement('div');
  paginationContainer.classList.add('pagination');
  paginationContainer.style.display = 'flex';
  paginationContainer.style.justifyContent = 'center';
  paginationContainer.style.marginTop = '2rem';
  paginationContainer.style.marginBottom = '2rem';
  
  // Add pagination container after the food grid
  const foodGrid = document.querySelector('.food-grid');
  if (foodGrid && foodGrid.parentNode) {
    console.log("Adding pagination container after food grid");
    foodGrid.parentNode.insertBefore(paginationContainer, foodGrid.nextSibling);
  } else {
    console.error("Cannot find food grid to add pagination after");
    // Fallback: Add to the main content
    const mainContent = document.querySelector('.content-container');
    if (mainContent) {
      console.log("Adding pagination container to main content as fallback");
      mainContent.appendChild(paginationContainer);
    } else {
      console.error("Cannot find main content for fallback pagination placement");
    }
  }
  
  console.log(`Pagination container created, totalPages: ${totalPages}`);
  
  // Initial update of pagination UI
  updatePaginationUI();
}

function showPage(page) {
  console.log(`Showing page ${page} of ${totalPages}`);
  
  // Validate page number
  if (page < 1) {
    console.error(`Invalid page number: ${page}`);
    page = 1;
  } else if (page > totalPages) {
    console.error(`Page number ${page} exceeds total pages ${totalPages}`);
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
  
  console.log(`Showing cards from index ${startIndex} to ${endIndex-1} (total: ${endIndex-startIndex})`);
  
  // Check if we're trying to show cards that don't exist
  if (startIndex >= filteredCards.length && filteredCards.length > 0) {
    console.error(`Start index ${startIndex} is out of bounds (filtered cards: ${filteredCards.length})`);
    // Show the last page instead
    showPage(totalPages);
    return;
  }
  
  for (let i = startIndex; i < endIndex; i++) {
    if (i < filteredCards.length) {
      filteredCards[i].style.display = 'block';
    } else {
      console.warn(`Tried to show non-existent card at index ${i}`);
    }
  }
  
  // Update pagination UI to reflect the current page
  updatePaginationUI();
}

function updatePaginationUI() {
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) {
    console.error("Pagination container not found");
    return;
  }
  
  console.log(`Updating pagination UI: ${totalPages} pages, current page: ${currentPage}`);
  
  // Clear existing pagination
  paginationContainer.innerHTML = '';
  
  // Don't hide pagination controls for "All" view - we want to show all pages
  if (totalPages <= 1 && filterState.country !== 'all') {
    paginationContainer.style.display = 'none';
    console.log("Hiding pagination - only one page (and not showing all)");
    return;
  }
  
  // Force display for "All" view even if there's only one page (for testing)
  if (filterState.country === 'all') {
    console.log("Forcing pagination display for 'All' view");
    paginationContainer.style.display = 'flex';
  } else {
    // Make sure pagination is visible
    paginationContainer.style.display = 'flex';
  }
  
  // Create previous button
  const prevButton = document.createElement('button');
  prevButton.classList.add('pagination-btn', 'prev-btn');
  prevButton.innerHTML = '&laquo; Previous';
  prevButton.disabled = currentPage <= 1;
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
      paginationContainer.appendChild(ellipsis);
    }
  }
  
  // Add page buttons
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.classList.add('pagination-btn', 'page-btn');
    if (i === currentPage) {
      pageButton.classList.add('active');
    }
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
      paginationContainer.appendChild(ellipsis);
    }
    
    const lastPageButton = document.createElement('button');
    lastPageButton.classList.add('pagination-btn', 'page-btn');
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
  nextButton.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentPage < totalPages) {
      showPage(currentPage + 1);
    }
  });
  paginationContainer.appendChild(nextButton);
  
  console.log(`Pagination updated with ${paginationContainer.querySelectorAll('button').length} buttons`);
}

function setupFeaturedRestaurantListeners() {
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

function generateAllRestaurantCards(foodGrid) {
  console.log("Generating all restaurant cards");
  
  // First clear any existing cards
  const existingCards = foodGrid.querySelectorAll('.food-card');
  if (existingCards.length > 0) {
    console.log(`Removing ${existingCards.length} existing cards`);
    existingCards.forEach(card => card.remove());
  }
  
  // Track how many cards are generated
  let cardCount = 0;
  let countryCounts = {};
  
  // Loop through each city in RESTAURANTS_BY_CITY
  for (const city in RESTAURANTS_BY_CITY) {
    const restaurants = RESTAURANTS_BY_CITY[city];
    const country = CITY_TO_COUNTRY[city] || 'unknown';
    
    // Track counts by country
    if (!countryCounts[country]) {
      countryCounts[country] = 0;
    }
    countryCounts[country] += restaurants.length;
    
    console.log(`Processing ${restaurants.length} restaurants in ${city}, ${country}`);
    
    // Loop through each restaurant
    restaurants.forEach(restaurant => {
      createRestaurantCard(restaurant, country, city, foodGrid);
      cardCount++;
    });
  }
  
  console.log(`Generated ${cardCount} restaurant cards for all cities`);
  console.log("Restaurants by country:", countryCounts);
}

function createRestaurantCard(restaurant, country, city, foodGrid) {
  // Create card elements
  const card = document.createElement('a');
  card.className = 'food-card';
  
  // Set the proper link for the card
  if (restaurant.link) {
    // Use explicit link if provided
    card.href = restaurant.link;
  } else {
    // Generate the URL using city-restaurant pattern
    const restaurantSlug = restaurant.name.toLowerCase().replace(/\s+/g, '-').replace(/[\'\.]/g, '');
    card.href = `restaurants/${city}-${restaurantSlug}.html`;
  }
  
  // Set data attributes for filtering
  card.setAttribute('data-country', country);
  card.setAttribute('data-city', city);
  card.setAttribute('data-price', restaurant.category);
  
  // Create card structure
  const cardImg = document.createElement('div');
  cardImg.className = 'food-card-img';
  
  // Determine category for highlighting
  const categoryClass = restaurant.category === 'premium' ? 'PREMIUM' : 
                        restaurant.category === 'standard' ? 'STANDARD' : 'BUDGET';
  
  const categorySpan = document.createElement('span');
  categorySpan.className = 'food-card-category';
  categorySpan.textContent = categoryClass;
  
  // Set image based on restaurant - use unique image mapping
  const img = document.createElement('img');
  
  // Get unique image for this restaurant from the mapping
  if (RESTAURANT_IMAGES[restaurant.name]) {
    img.src = RESTAURANT_IMAGES[restaurant.name];
  } else {
    // Fallback: Use cuisine-specific images based on country and category
    const imageVariants = {
      'japan': {
        'premium': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
          'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80'
        ],
        'standard': [
          'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80'
        ],
        'budget': [
          'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
          'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'
        ]
      },
      'china': {
        'premium': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'
        ],
        'standard': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80'
        ],
        'budget': [
          'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'
        ]
      },
      'thailand': {
        'premium': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'
        ],
        'standard': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'
        ],
        'budget': [
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'
        ]
      },
      'cambodia': {
        'premium': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'
        ],
        'standard': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'
        ],
        'budget': [
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'
        ]
      },
      'australia': {
        'premium': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'
        ],
        'standard': [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'
        ],
        'budget': [
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
          'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80'
        ]
      }
    };
    
    // Use hash of restaurant name to consistently pick a variant
    let hash = 0;
    for (let i = 0; i < restaurant.name.length; i++) {
      hash = ((hash << 5) - hash) + restaurant.name.charCodeAt(i);
      hash = hash & hash;
    }
    
    const variants = imageVariants[country]?.[restaurant.category] || 
                    imageVariants[country]?.['standard'] || 
                    ['https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80'];
    const variantIndex = Math.abs(hash) % variants.length;
    img.src = variants[variantIndex];
  }
  
  img.alt = restaurant.name;
  // Add error handling for images
  img.onerror = function() {
    this.src = 'https://via.placeholder.com/400x300?text=Restaurant+Image';
  };
  
  // Create card content
  const cardContent = document.createElement('div');
  cardContent.className = 'food-card-content';
  
  const title = document.createElement('h3');
  title.className = 'food-card-title';
  title.textContent = restaurant.name;
  
  const desc = document.createElement('p');
  desc.className = 'food-card-desc';
  desc.textContent = restaurant.description;
  
  const cardMeta = document.createElement('div');
  cardMeta.className = 'food-card-meta';
  
  const price = document.createElement('div');
  price.textContent = restaurant.price;
  
  const location = document.createElement('div');
  location.textContent = `${city.charAt(0).toUpperCase() + city.slice(1)}, ${country.charAt(0).toUpperCase() + country.slice(1)}`;
  
  // Assemble the card
  cardImg.appendChild(img);
  cardImg.appendChild(categorySpan);
  card.appendChild(cardImg);
  
  cardMeta.appendChild(price);
  cardMeta.appendChild(location);
  
  cardContent.appendChild(title);
  cardContent.appendChild(desc);
  cardContent.appendChild(cardMeta);
  
  card.appendChild(cardContent);
  
  // Add to grid
  foodGrid.appendChild(card);
}

 

 

// Direct city filtering function that bypasses the regular filter mechanism
function filterCardsByCity(city) {
  console.log(`Direct filtering for city: ${city}`);
  
  // Get all cards
  const cards = Array.from(document.querySelectorAll('.food-card'));
  console.log(`Total cards: ${cards.length}`);
  
  // Filter cards directly by data-city attribute
  filteredCards = cards.filter(card => {
    const cardCity = card.getAttribute('data-city');
    const match = cardCity === city;
    if (match) {
      console.log(`Found matching card: ${card.querySelector('.food-card-title').textContent}`);
    }
    return match;
  });
  
  console.log(`Found ${filteredCards.length} cards for city ${city}`);
  
  // Calculate total pages
  calculateTotalPages();
  
  // Reset to page 1
  currentPage = 1;
  
  // Update pagination UI
  updatePaginationUI();
  
  // Show first page
  showPage(1);
}

// Show all Osaka restaurants on initial load if requested
 

// Add Osaka filter button with highlight functionality
 

// Update country-to-city mappings (kept minimal for production)
const CITIES_BY_COUNTRY = {
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Kobe'],
  'China': ['Shanghai', 'Beijing', 'Shenzhen', 'Chongqing', 'Guangzhou'],
  'Australia': ['Melbourne', 'Sydney'],
  'Cambodia': ['Phnom Penh', 'Siem Reap'],
  'Thailand': ['Bangkok', 'Phuket']
};