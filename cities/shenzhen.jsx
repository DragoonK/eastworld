import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaMoon, FaSun, FaMapMarkerAlt, FaSubway, FaUtensils, FaBuilding, FaShoppingBag, FaBed, FaInfoCircle } from 'react-icons/fa';
import './shenzhen.css';

const ShenzhenGuide = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { scrollY } = useScroll();
  
  const headerRef = useRef(null);
  const sectionsRef = useRef([]);
  
  // Parallax effects
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroY = useTransform(scrollY, [0, 300], [0, 100]);
  const titleY = useTransform(scrollY, [0, 300], [0, -50]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };
  
  // Scroll animation for sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });
    
    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);
  
  // Districts data
  const districts = [
    {
      name: "Futian",
      description: "The modern CBD with skyscrapers and shopping malls",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Shenzhen_CBD_at_night.jpg/1280px-Shenzhen_CBD_at_night.jpg",
      highlights: ["Ping An Finance Center", "Civic Center", "Lianhuashan Park"]
    },
    {
      name: "Nanshan",
      description: "Tech hub housing many startups and major companies",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Coastal_City_Shenzhen.jpg/1280px-Coastal_City_Shenzhen.jpg",
      highlights: ["Window of the World", "OCT Harbour", "Shenzhen Bay"]
    },
    {
      name: "Luohu",
      description: "The original SEZ area, known for shopping and border crossing",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Shun_Hing_Square%2C_Shenzhen%2C_China.jpg/800px-Shun_Hing_Square%2C_Shenzhen%2C_China.jpg",
      highlights: ["Dongmen Pedestrian Street", "Luohu Commercial City", "Diwang Building"]
    },
    {
      name: "Bao'an",
      description: "Home to the airport and manufacturing zones",
      image: "https://images.unsplash.com/photo-1611062683834-526f96467feb",
      highlights: ["Shenzhen International Airport", "Waterlands Resort", "Phoenix Mountain"]
    }
  ];
  
  // Attractions data
  const attractions = [
    {
      name: "Window of the World",
      description: "Theme park with miniature replicas of famous global landmarks",
      image: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Window_of_the_World_in_the_central_part_of_Shenzhen_City.jpg",
      location: "Nanshan District"
    },
    {
      name: "Shenzhen Safari Park",
      description: "One of China's largest wildlife zoos with over 300 species",
      image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d",
      location: "Nanshan District"
    },
    {
      name: "OCT Loft",
      description: "Creative cultural park with art galleries, design studios and cafes",
      image: "https://images.unsplash.com/photo-1485627941502-d2e6429a8af0",
      location: "Nanshan District"
    },
    {
      name: "Dafen Oil Painting Village",
      description: "Famous art district known for replica paintings and original art",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Dafen_Oil_Painting_Village_2.jpg/1280px-Dafen_Oil_Painting_Village_2.jpg",
      location: "Longgang District"
    }
  ];
  
  // Food spots data
  const foodSpots = [
    {
      name: "Shenzhen Dongmen Food Street",
      description: "Bustling street food area with local Cantonese delicacies",
      image: "https://images.unsplash.com/photo-1533622597897-3faf54ef5859",
      specialty: "Dim Sum, Cantonese BBQ"
    },
    {
      name: "Sea World Food Street",
      description: "International dining options in a lively entertainment complex",
      image: "https://images.unsplash.com/photo-1526318896980-cf78c088247c",
      specialty: "Seafood, Western cuisine"
    },
    {
      name: "Xiangmihu Holiday Plaza",
      description: "Upscale dining area around a scenic lake",
      image: "https://images.unsplash.com/photo-1552566626-52f8b828add9",
      specialty: "Fine dining, Cantonese cuisine"
    }
  ];
  
  // Tech companies data
  const techCompanies = [
    {
      name: "Tencent",
      description: "Tech giant behind WeChat and many gaming platforms",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Tencent_Global_Headquarters_in_Nanshan_Hi-Tech_Industrial_Park.jpg/1280px-Tencent_Global_Headquarters_in_Nanshan_Hi-Tech_Industrial_Park.jpg"
    },
    {
      name: "Huawei",
      description: "Leading telecommunications equipment and smartphone manufacturer",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Huawei_headquarters_in_Bantian%2C_Longgang_District%2C_Shenzhen.jpg/1280px-Huawei_headquarters_in_Bantian%2C_Longgang_District%2C_Shenzhen.jpg"
    },
    {
      name: "DJI",
      description: "World's leading drone manufacturer",
      image: "https://images.unsplash.com/photo-1521405617584-1d9867aecad3"
    }
  ];

  return (
    <div className={`shenzhen-guide ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header with parallax hero image */}
      <motion.header 
        ref={headerRef} 
        className="hero-header"
        style={{ opacity: heroOpacity }}
      >
        <motion.div className="hero-image" style={{ y: heroY }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Civic_Center_Shenzhen_China.jpg/1280px-Civic_Center_Shenzhen_China.jpg" alt="Shenzhen Skyline" />
        </motion.div>
        
        <motion.div className="hero-content" style={{ y: titleY }}>
          <h1>SHENZHEN</h1>
          <p>China's Silicon Valley & Innovation Hub</p>
        </motion.div>
      </motion.header>
      
      {/* Dark mode toggle */}
      <button className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>
      
      {/* Quick nav */}
      <nav className="quick-nav">
        <a href="#intro"><FaInfoCircle /> Intro</a>
        <a href="#districts"><FaMapMarkerAlt /> Districts</a>
        <a href="#transport"><FaSubway /> Transport</a>
        <a href="#food"><FaUtensils /> Food</a>
        <a href="#attractions"><FaBuilding /> Attractions</a>
        <a href="#shopping"><FaShoppingBag /> Shopping</a>
        <a href="#stay"><FaBed /> Stay</a>
      </nav>
      
      {/* Main content container */}
      <div className="content-container">
        {/* Introduction section */}
        <section 
          id="intro" 
          className="content-section intro-section fade-in"
          ref={el => sectionsRef.current[0] = el}
        >
          <div className="section-inner">
            <h2>The Rise of a Megacity</h2>
            <div className="two-column">
              <div>
                <p>
                  Once a small fishing village, Shenzhen has transformed into a global technology hub and innovation center in just four decades. Designated as China's first Special Economic Zone in 1980, the city has experienced unprecedented growth, becoming a metropolis of over 17 million people.
                </p>
                <p>
                  Today, Shenzhen is known as China's "Silicon Valley," home to tech giants like Tencent, Huawei, and DJI. The city represents China's remarkable economic transformation and serves as a window into the country's future innovation landscape.
                </p>
                <p>
                  With its modern architecture, efficient public transportation, vibrant cultural scene, and proximity to Hong Kong, Shenzhen offers visitors a glimpse into China's rapid modernization while retaining elements of Cantonese culture and tradition.
                </p>
              </div>
              <div className="stats-container">
                <div className="stat-item">
                  <h3>17.56M</h3>
                  <p>Population</p>
                </div>
                <div className="stat-item">
                  <h3>1,997 km²</h3>
                  <p>Area</p>
                </div>
                <div className="stat-item">
                  <h3>1980</h3>
                  <p>Year SEZ Established</p>
                </div>
                <div className="stat-item">
                  <h3>$403B</h3>
                  <p>GDP (2021)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Districts section */}
        <section 
          id="districts" 
          className="content-section districts-section fade-in"
          ref={el => sectionsRef.current[1] = el}
        >
          <div className="section-inner">
            <h2>Districts Worth Exploring</h2>
            <div className="districts-grid">
              {districts.map((district, index) => (
                <div className="district-card" key={index}>
                  <div className="hover-image-container">
                    <img src={district.image} alt={district.name} />
                    <div className="image-overlay">
                      <ul>
                        {district.highlights.map((highlight, i) => (
                          <li key={i}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <h3>{district.name}</h3>
                  <p>{district.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Transportation section */}
        <section 
          id="transport" 
          className="content-section transport-section fade-in"
          ref={el => sectionsRef.current[2] = el}
        >
          <div className="section-inner">
            <h2>Getting Around</h2>
            <div className="transport-content">
              <div className="transport-image">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Shenzhen_Metro_Line_4_Depot.jpg/1280px-Shenzhen_Metro_Line_4_Depot.jpg" alt="Shenzhen Metro" />
              </div>
              <div className="transport-info">
                <div className="transport-method">
                  <h3><FaSubway /> Metro</h3>
                  <p>Shenzhen's modern metro system has 11 lines covering most areas of the city. Clean, efficient, and with English signage, it's the best way to navigate the city. Single journey tickets range from ¥2-10 based on distance.</p>
                </div>
                <div className="transport-method">
                  <h3><i className="fas fa-bus"></i> Buses</h3>
                  <p>An extensive bus network serves areas not covered by the metro. Fares start at ¥2. Use a Shenzhen Tong card for convenience across all public transport.</p>
                </div>
                <div className="transport-method">
                  <h3><i className="fas fa-taxi"></i> Taxis</h3>
                  <p>Readily available and affordable. Flag fall is ¥10 for the first 2km, then ¥2.4/km. Most drivers don't speak English, so have your destination written in Chinese.</p>
                </div>
                <div className="transport-method">
                  <h3><i className="fas fa-mobile-alt"></i> Ride-Sharing</h3>
                  <p>DiDi is the dominant ride-sharing app. The English version is available and integrates with international credit cards.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Food section */}
        <section 
          id="food" 
          className="content-section food-section fade-in"
          ref={el => sectionsRef.current[3] = el}
        >
          <div className="section-inner">
            <h2>Culinary Experiences</h2>
            <p className="section-intro">Shenzhen's food scene blends traditional Cantonese cuisine with influences from across China and beyond, reflecting its migrant population.</p>
            
            <div className="food-grid">
              {foodSpots.map((spot, index) => (
                <div className="food-card" key={index}>
                  <div className="hover-image-container">
                    <img src={spot.image} alt={spot.name} />
                    <div className="image-overlay">
                      <p>Specialty: {spot.specialty}</p>
                    </div>
                  </div>
                  <h3>{spot.name}</h3>
                  <p>{spot.description}</p>
                </div>
              ))}
            </div>
            
            <div className="local-dishes">
              <h3>Must-Try Local Dishes</h3>
              <ul className="dishes-list">
                <li><strong>Shajing Oysters</strong> - Fresh oysters from Shajing town</li>
                <li><strong>Cantonese Dim Sum</strong> - Variety of steamed and fried dumplings</li>
                <li><strong>Hakka Stuffed Tofu</strong> - Tofu stuffed with meat and herbs</li>
                <li><strong>Dongjiang Salt-baked Chicken</strong> - Tender chicken with crispy skin</li>
                <li><strong>Shrimp Wonton Noodles</strong> - Cantonese classic noodle soup</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Attractions section */}
        <section 
          id="attractions" 
          className="content-section attractions-section fade-in"
          ref={el => sectionsRef.current[4] = el}
        >
          <div className="section-inner">
            <h2>What to See & Do</h2>
            
            <div className="attractions-slider">
              {attractions.map((attraction, index) => (
                <div className="attraction-card" key={index}>
                  <div className="hover-image-container">
                    <img src={attraction.image} alt={attraction.name} />
                    <div className="image-overlay">
                      <p><FaMapMarkerAlt /> {attraction.location}</p>
                    </div>
                  </div>
                  <h3>{attraction.name}</h3>
                  <p>{attraction.description}</p>
                </div>
              ))}
            </div>
            
            <div className="tech-tourism">
              <h3>Tech Tourism</h3>
              <p>As China's technology hub, Shenzhen offers unique opportunities to witness innovation in action:</p>
              
              <div className="tech-companies-grid">
                {techCompanies.map((company, index) => (
                  <div className="tech-company-card" key={index}>
                    <div className="hover-image-container">
                      <img src={company.image} alt={company.name} />
                    </div>
                    <h4>{company.name}</h4>
                    <p>{company.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Shopping section */}
        <section 
          id="shopping" 
          className="content-section shopping-section fade-in"
          ref={el => sectionsRef.current[5] = el}
        >
          <div className="section-inner">
            <h2>Shopping Experiences</h2>
            <div className="shopping-areas">
              <div className="shopping-area">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Huaqiangbei.jpg/1280px-Huaqiangbei.jpg" alt="Huaqiangbei Electronics Market" />
                <div className="shopping-info">
                  <h3>Huaqiangbei Electronics Market</h3>
                  <p>The world's largest electronics market spread across several buildings. Find everything from components to finished gadgets, genuine products to knock-offs. A paradise for tech enthusiasts and makers.</p>
                  <p><strong>Tip:</strong> Bargaining is expected. Start at 50% of the initial asking price.</p>
                </div>
              </div>
              
              <div className="shopping-area">
                <img src="https://images.unsplash.com/photo-1546213290-e1b492ab3eee" alt="Dongmen Pedestrian Street" />
                <div className="shopping-info">
                  <h3>Dongmen Pedestrian Street</h3>
                  <p>One of Shenzhen's oldest and busiest shopping areas. Hundreds of fashion stores, local brands, and street food vendors make this a lively place to experience local shopping culture.</p>
                </div>
              </div>
              
              <div className="shopping-area">
                <img src="https://images.unsplash.com/photo-1568736772261-f963a359fa91" alt="MixC Mall" />
                <div className="shopping-info">
                  <h3>MixC & Coastal City Malls</h3>
                  <p>For luxury shopping, these upscale malls offer international brands, gourmet restaurants, and entertainment facilities including ice skating rinks and cinemas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Accommodation section */}
        <section 
          id="stay" 
          className="content-section stay-section fade-in"
          ref={el => sectionsRef.current[6] = el}
        >
          <div className="section-inner">
            <h2>Where to Stay</h2>
            <div className="accommodation-options">
              <div className="accommodation-category">
                <h3>Luxury</h3>
                <ul>
                  <li>
                    <strong>Futian Shangri-La</strong> - Centrally located 5-star hotel with excellent city views
                  </li>
                  <li>
                    <strong>The St. Regis Shenzhen</strong> - Occupying the top floors of a skyscraper with panoramic views
                  </li>
                  <li>
                    <strong>Four Seasons Hotel Shenzhen</strong> - Sophisticated luxury in the heart of the CBD
                  </li>
                </ul>
              </div>
              
              <div className="accommodation-category">
                <h3>Mid-Range</h3>
                <ul>
                  <li>
                    <strong>Courtyard by Marriott Shenzhen Bay</strong> - Comfortable rooms near the tech parks
                  </li>
                  <li>
                    <strong>Lily Hotel Shenzhen</strong> - Good value in the Luohu shopping district
                  </li>
                  <li>
                    <strong>Vienna Hotel (Various Locations)</strong> - Reliable local chain with multiple properties
                  </li>
                </ul>
              </div>
              
              <div className="accommodation-category">
                <h3>Budget</h3>
                <ul>
                  <li>
                    <strong>Shenzhen Hostel</strong> - Clean dormitories and private rooms near Dongmen
                  </li>
                  <li>
                    <strong>7 Days Inn</strong> - Basic but comfortable chain with several locations
                  </li>
                  <li>
                    <strong>Hanting Express</strong> - Budget chain with good standards and locations near metro stations
                  </li>
                </ul>
              </div>
              
              <div className="accommodation-tips">
                <h4>Accommodation Tips:</h4>
                <ul>
                  <li>The <strong>Futian and Nanshan</strong> districts offer the most convenient locations for business travelers</li>
                  <li><strong>Luohu</strong> is ideal for shopping and access to Hong Kong</li>
                  <li>Book in advance during <strong>Canton Fair</strong> periods (April-May and October-November)</li>
                  <li>Most hotels can arrange <strong>Hong Kong border transfer</strong> services</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Practical info section */}
        <section 
          id="practical" 
          className="content-section practical-section fade-in"
          ref={el => sectionsRef.current[7] = el}
        >
          <div className="section-inner">
            <h2>Practical Information</h2>
            <div className="practical-grid">
              <div className="practical-item">
                <h3>Visa</h3>
                <p>Most visitors need a visa to enter mainland China. Hong Kong residents can get a special Shenzhen visa at the border. 144-hour visa-free transit is available for certain nationalities.</p>
              </div>
              
              <div className="practical-item">
                <h3>Weather</h3>
                <p>Subtropical climate with warm weather year-round. Summer (Jun-Sep) is hot and humid with occasional typhoons. Winter (Dec-Feb) is mild and dry. Spring and autumn are the best times to visit.</p>
              </div>
              
              <div className="practical-item">
                <h3>Internet</h3>
                <p>The Great Firewall blocks many Western sites and apps. Get a VPN before arrival. WeChat is essential for daily life in China. Free WiFi is available in most public places.</p>
              </div>
              
              <div className="practical-item">
                <h3>Currency</h3>
                <p>Chinese Yuan (CNY/RMB). ATMs are widely available. WeChat Pay and Alipay dominate, but require a Chinese bank account. Credit cards are accepted in large establishments.</p>
              </div>
              
              <div className="practical-item">
                <h3>Language</h3>
                <p>Mandarin is the official language, but Cantonese is also widely spoken. English signs are common in tourist areas and the metro, but less so elsewhere.</p>
              </div>
              
              <div className="practical-item">
                <h3>Hong Kong Connection</h3>
                <p>Easily visit Hong Kong from Shenzhen via multiple border crossings. The most convenient is Futian/Lok Ma Chau with direct metro connections on both sides.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Newsletter signup */}
      <div className="newsletter-container">
        <div className="newsletter-content">
          <h3>Stay Updated on Shenzhen</h3>
          <p>Subscribe to receive the latest news, events, and travel tips about China's innovation hub.</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Your email address" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="guide-footer">
        <div className="footer-content">
          <div className="footer-column">
            <h4>About Eastworld</h4>
            <p>Your premier guide to Asian culture, travel, and lifestyle.</p>
          </div>
          <div className="footer-column">
            <h4>More City Guides</h4>
            <ul>
              <li><a href="/cities/tokyo.html">Tokyo</a></li>
              <li><a href="/cities/seoul.html">Seoul</a></li>
              <li><a href="/cities/bangkok.html">Bangkok</a></li>
              <li><a href="/cities/shanghai.html">Shanghai</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-facebook"></i></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Eastworld. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ShenzhenGuide; 