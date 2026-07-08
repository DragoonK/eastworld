// ============================================================
// Trending sidebar: top five per category, filterable by country.
// Data lives here as a plain object; the logic at the bottom
// renders the list and wires up the tabs and country dropdown.
// ============================================================

const TRENDING_DATA = {
  food: {
    japan: [
      { name: 'Den', location: 'Tokyo', image: 'https://media.timeout.com/images/105741936/750/422/image.jpg', link: 'restaurants/tokyo-den.html' },
      { name: 'Kikunoi', location: 'Kyoto', image: 'https://www.kikunoi.jp/english/images/restaurant/kyoto/main.jpg', link: 'restaurants/kyoto-kikunoi.html' },
      { name: 'Kani Doraku', location: 'Osaka', image: 'https://media-cdn.tripadvisor.com/media/photo-s/0e/cc/0a/dc/kani-doraku-main-store.jpg', link: 'restaurants/osaka-kani-doraku.html' },
      { name: 'Takiman Kitahorie', location: 'Osaka', image: 'https://media-cdn.tripadvisor.com/media/photo-s/10/e0/04/76/photo0jpg.jpg', link: 'restaurants/osaka-takiman-kitahorie.html' },
      { name: 'Ichiran Ramen', location: 'Tokyo', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=70', link: 'restaurants/tokyo-ichiran-ramen.html' }
    ],
    china: [
      { name: 'Lost Heaven', location: 'Shanghai', image: 'https://www.smartshanghai.com/uploads/venues/thumbs/thumb_1590112328.jpg', link: 'restaurants/shanghai-lost-heaven.html' },
      { name: 'Ultraviolet', location: 'Shanghai', image: 'https://media.cntraveler.com/photos/5a8c94b2fa1b802d711bbc75/16:9/w_2560%2Cc_limit/DA_China_Feb28_2022_18.jpg', link: 'restaurants/shanghai-ultraviolet.html' },
      { name: 'Duck de Chine', location: 'Beijing', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=70', link: 'restaurants/beijing-duck-de-chine.html' },
      { name: 'Fu 1088', location: 'Shanghai', image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=70', link: 'restaurants/shanghai-fu-1088.html' },
      { name: 'Haidilao Hot Pot', location: 'Beijing', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=70', link: 'restaurants/beijing-haidilao-hot-pot.html' }
    ],
    thailand: [
      { name: 'Jay Fai', location: 'Bangkok', image: 'https://media.timeout.com/images/105761718/image.jpg' },
      { name: 'Gaggan Anand', location: 'Bangkok', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=70' },
      { name: 'PRU', location: 'Phuket', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=70' },
      { name: 'Supanniga Eating Room', location: 'Bangkok', image: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=400&q=70' },
      { name: 'Blue Elephant', location: 'Phuket', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=70' }
    ],
    cambodia: [
      { name: 'Cuisine Wat Damnak', location: 'Siem Reap', image: 'https://media-cdn.tripadvisor.com/media/photo-s/10/84/75/3a/cuisine-wat-damnak.jpg' },
      { name: 'Malis', location: 'Phnom Penh', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=70' },
      { name: 'Romdeng', location: 'Phnom Penh', image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=70' },
      { name: 'Chanrey Tree', location: 'Siem Reap', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=70' },
      { name: 'Marum', location: 'Siem Reap', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=70' }
    ],
    australia: [
      { name: 'Attica', location: 'Melbourne', image: 'https://www.theworlds50best.com/filestore/jpg/W50BR2022-150-Attica-1.jpg' },
      { name: 'Quay', location: 'Sydney', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=70' },
      { name: 'Bennelong', location: 'Sydney', image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=70' },
      { name: 'Chin Chin', location: 'Melbourne', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=70' },
      { name: 'Flower Drum', location: 'Melbourne', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=70' }
    ]
  },
  stays: {
    japan: [
      { name: 'Aman Kyoto', location: 'Kyoto', image: 'https://www.amankyoto.com/wp-content/uploads/2019/03/Aman-Kyoto-Exterior.jpg', link: 'aman-kyoto.html' },
      { name: 'Park Hyatt Tokyo', location: 'Tokyo', image: 'https://www.hyatt.com/content/dam/hyatt/hyattdam/images/2014/09/03/1258/Park-Hyatt-Tokyo-P127-Park-Suite-King.masthead-feature-panel-medium.jpg', link: 'stays/tokyo-park-hyatt.html' },
      { name: 'Conrad Osaka', location: 'Osaka', image: 'https://www.hilton.com/im/en/OSACO/14258571/osaka-conrad-exterior.jpg?impolicy=crop&cw=5616&ch=3159&gravity=NorthWest&xposition=0&yposition=421&rw=768&rh=432', link: 'stays/osaka-conrad.html' },
      { name: 'The Ritz-Carlton Tokyo', location: 'Tokyo', image: 'https://cache.marriott.com/content/dam/marriott-renditions/TYORC/tyorc-exterior-0087-hor-wide.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=1215px:*', link: 'stays/tokyo-ritz-carlton.html' },
      { name: 'W Osaka', location: 'Osaka', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=70', link: 'stays/osaka-w-hotel.html' }
    ],
    china: [
      { name: 'The Peninsula Shanghai', location: 'Shanghai', image: 'https://www.peninsula.com/en/-/media/images/shanghai/compressed-images/psh-exterior-l.jpg', link: 'stays/shanghai-peninsula.html' },
      { name: 'Park Hyatt Shanghai', location: 'Shanghai', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=70', link: 'stays/shanghai-park-hyatt.html' },
      { name: 'Bulgari Shanghai', location: 'Shanghai', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=400&q=70', link: 'stays/shanghai-bulgari.html' },
      { name: 'The Yangtze Boutique', location: 'Shanghai', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=400&q=70', link: 'stays/shanghai-yangtze-boutique.html' },
      { name: 'The Peninsula Beijing', location: 'Beijing', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=70' }
    ],
    thailand: [
      { name: 'Amanpuri', location: 'Phuket', image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/223648066.jpg?k=d58798afbae56c84df99129aee5a1dfc21c1d0f62ef06836a4adf20e2ef12a11&o=&hp=1' },
      { name: 'Mandarin Oriental', location: 'Bangkok', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=70' },
      { name: 'The Siam Hotel', location: 'Bangkok', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=70' },
      { name: 'Sri Panwa', location: 'Phuket', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=400&q=70' },
      { name: 'Lebua at State Tower', location: 'Bangkok', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=400&q=70' }
    ],
    cambodia: [
      { name: 'Amansara', location: 'Siem Reap', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=70' },
      { name: 'Raffles Le Royal', location: 'Phnom Penh', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=70' },
      { name: 'Phum Baitang', location: 'Siem Reap', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=400&q=70' },
      { name: 'Rosewood Phnom Penh', location: 'Phnom Penh', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=400&q=70' },
      { name: "Raffles Grand d'Angkor", location: 'Siem Reap', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=70' }
    ],
    australia: [
      { name: 'Park Hyatt Sydney', location: 'Sydney', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=70' },
      { name: 'Park Hyatt Melbourne', location: 'Melbourne', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=70', link: 'stays/melbourne-park-hyatt.html' },
      { name: 'QT Melbourne', location: 'Melbourne', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=400&q=70', link: 'stays/melbourne-qt.html' },
      { name: 'Four Seasons Sydney', location: 'Sydney', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=400&q=70' },
      { name: 'The Langham Melbourne', location: 'Melbourne', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=70' }
    ]
  },
  places: {
    japan: [
      { name: 'teamLab Borderless', location: 'Tokyo', image: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/f6/39/f4/teamlab-borderless-is.jpg?w=1200&h=-1&s=1', link: 'places/teamlab-borderless.html' },
      { name: 'Fushimi Inari Taisha', location: 'Kyoto', image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=400&q=70', link: 'places/fushimi-inari.html' },
      { name: 'Arashiyama Bamboo Grove', location: 'Kyoto', image: 'https://images.unsplash.com/photo-1503640538573-148065ba4904?auto=format&fit=crop&w=400&q=70', link: 'places/arashiyama-bamboo.html' },
      { name: 'Tokyo Skytree', location: 'Tokyo', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=400&q=70', link: 'places/tokyo-skytree.html' },
      { name: 'Senso-ji Temple', location: 'Tokyo', image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=400&q=70' }
    ],
    china: [
      { name: 'Great Wall of China', location: 'Beijing', image: 'https://cdn.britannica.com/17/155017-050-9AC96FC8/Great-Wall-of-China-Beijing.jpg', link: 'places/great-wall.html' },
      { name: 'Forbidden City', location: 'Beijing', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=400&q=70', link: 'places/forbidden-city.html' },
      { name: 'Terracotta Warriors', location: "Xi'an", image: 'https://images.unsplash.com/photo-1591709270280-8b1287c9b371?auto=format&fit=crop&w=400&q=70', link: 'places/terracotta-warriors.html' },
      { name: 'The Bund', location: 'Shanghai', image: 'https://images.unsplash.com/photo-1537981576271-d2c0d8b95c2e?auto=format&fit=crop&w=400&q=70' },
      { name: 'Canton Tower', location: 'Guangzhou', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=400&q=70' }
    ],
    thailand: [
      { name: 'Songkran Festival', location: 'Bangkok', image: 'https://media.timeout.com/images/105879997/image.jpg' },
      { name: 'Grand Palace', location: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=400&q=70' },
      { name: 'Phi Phi Islands', location: 'Phuket', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=70' },
      { name: 'Wat Pho Temple', location: 'Bangkok', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=400&q=70' },
      { name: 'Big Buddha', location: 'Phuket', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=400&q=70' }
    ],
    cambodia: [
      { name: 'Angkor Wat', location: 'Siem Reap', image: 'https://images.herzindagi.info/image/2024/May/ankor-wat-full-travel-guide.jpg', link: 'places/angkor-wat.html' },
      { name: 'Royal Palace', location: 'Phnom Penh', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=400&q=70' },
      { name: 'Bayon Temple', location: 'Siem Reap', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=70' },
      { name: 'Ta Prohm Temple', location: 'Siem Reap', image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=400&q=70' },
      { name: 'Tuol Sleng Museum', location: 'Phnom Penh', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=400&q=70' }
    ],
    australia: [
      { name: 'Sydney Opera House', location: 'Sydney', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400&q=70' },
      { name: 'Great Ocean Road', location: 'Melbourne', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=70' },
      { name: 'Bondi Beach', location: 'Sydney', image: 'https://images.unsplash.com/photo-1523428096881-5bd79d043006?auto=format&fit=crop&w=400&q=70' },
      { name: 'Royal Botanic Gardens', location: 'Melbourne', image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=400&q=70' },
      { name: 'Harbour Bridge', location: 'Sydney', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400&q=70' }
    ]
  },
  products: {
    japan: [
      { name: 'Shiseido Ultimune', location: 'Japan', image: 'https://www.shiseido.co.jp/on/demandware.static/-/Sites-shiseido-global-master-catalog/default/dwa96d2b3b/images/products/82828_000000000001_L.jpg', link: 'products.html#shiseido-ultimune' },
      { name: 'Uniqlo Heattech', location: 'Japan', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7bdaf?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Nintendo Switch', location: 'Japan', image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Muji Essentials', location: 'Japan', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Sony WH-1000XM5', location: 'Japan', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&q=70', link: 'products.html' }
    ],
    china: [
      { name: 'Shanghai Beauty Cream', location: 'China', image: 'https://m.media-amazon.com/images/I/71-YtI+hMCL._AC_UF1000,1000_QL80_.jpg', link: 'products.html#shanghai-beauty-cream' },
      { name: 'Xiaomi Mi Band', location: 'China', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Pechoin Face Cream', location: 'China', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'DJI Drone', location: 'China', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Huawei MatePad', location: 'China', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=70', link: 'products.html' }
    ],
    thailand: [
      { name: 'Srichand Powder', location: 'Thailand', image: 'https://srichand.co.th/cdn/shop/files/SRICHANDBaretoPerfectTranslucentPowder10g..jpg?v=1699435229', link: 'products.html#srichand-powder' },
      { name: 'Counterpain Balm', location: 'Thailand', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Jim Thompson Silk', location: 'Thailand', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Tiger Balm', location: 'Thailand', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Royal Chitralada', location: 'Thailand', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&q=70', link: 'products.html' }
    ],
    cambodia: [
      { name: 'Kampot Pepper', location: 'Cambodia', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Krama Scarf', location: 'Cambodia', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Angkor Beer', location: 'Cambodia', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Cambodian Silk', location: 'Cambodia', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Palm Sugar', location: 'Cambodia', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&q=70', link: 'products.html' }
    ],
    australia: [
      { name: 'Lanolips 101 Ointment', location: 'Australia', image: 'https://lanolips.com/cdn/shop/products/101-Ointment-Multi-Balm-Strawberry_PDP-Main-Image-1024px_700x.jpg?v=1652789883', link: 'products.html#lanolips-101-ointment' },
      { name: 'Aesop Skincare', location: 'Australia', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'UGG Boots', location: 'Australia', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Tim Tam Biscuits', location: 'Australia', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&q=70', link: 'products.html' },
      { name: 'Vegemite', location: 'Australia', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&q=70', link: 'products.html' }
    ]
  }
};

// ------------------------------------------------------------
// Rendering + controls
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('trending-list');
  const countrySelect = document.getElementById('trending-country');
  const tabs = document.querySelectorAll('.trending-tab');
  if (!list || !countrySelect || tabs.length === 0) return;

  let activeTab = 'food';

  function itemsFor(tab, country) {
    const categories = TRENDING_DATA[tab];
    if (country === 'all') {
      // One top pick from each country
      return ['japan', 'china', 'thailand', 'cambodia', 'australia']
        .map(c => categories[c][0]);
    }
    return categories[country].slice(0, 5);
  }

  function render() {
    const items = itemsFor(activeTab, countrySelect.value);
    list.innerHTML = items.map((item, i) => `
      <a class="trending-item" href="${item.link || '#'}">
        <span class="rank">${i + 1}</span>
        <img src="${item.image}" alt="${item.name}" loading="lazy"
             onerror="this.style.visibility='hidden'">
        <span class="trending-text">
          <span class="name">${item.name}</span>
          <span class="location">${item.location}</span>
        </span>
      </a>
    `).join('');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      render();
    });
  });

  countrySelect.addEventListener('change', render);

  render();
});
