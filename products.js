// Eastworld Products Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Filter functionality
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  const featuredProducts = document.querySelectorAll('.featured-product');
  const currentFilterText = document.querySelector('.current-filter');
  const clearFilterBtn = document.querySelector('.clear-filter');
  
  // Set initial state
  let currentFilter = {
    country: 'all',
    price: null
  };
  
  // Function to update filter path display
  function updateFilterPath() {
    let filterText = 'All';
    
    if (currentFilter.country !== 'all') {
      filterText = document.querySelector(`.filter-btn[data-country="${currentFilter.country}"]`).textContent;
    }
    
    if (currentFilter.price) {
      const priceText = document.querySelector(`.filter-btn[data-price="${currentFilter.price}"]`).textContent;
      filterText += ` · ${priceText}`;
    }
    
    currentFilterText.textContent = filterText;
  }
  
  // Function to filter products based on current filter state
  function filterProducts() {
    // Filter product cards
    productCards.forEach(card => {
      let shouldShow = true;
      
      // Filter by country
      if (currentFilter.country !== 'all') {
        shouldShow = shouldShow && card.dataset.country === currentFilter.country;
      }
      
      // Filter by price (to be implemented)
      
      // Update visibility
      card.style.display = shouldShow ? 'block' : 'none';
    });
    
    // Filter featured products as well
    featuredProducts.forEach(product => {
      let shouldShow = true;
      
      // Filter by country
      if (currentFilter.country !== 'all') {
        shouldShow = shouldShow && product.dataset.country === currentFilter.country;
      }
      
      // Update visibility
      product.style.display = shouldShow ? 'block' : 'none';
    });
    
    // If the featured section has no visible products, hide it
    const featuredSection = document.querySelector('.featured-section');
    const visibleFeaturedProducts = document.querySelectorAll('.featured-product[style="display: block;"]');
    if (visibleFeaturedProducts.length === 0 && currentFilter.country !== 'all') {
      featuredSection.style.display = 'none';
    } else {
      featuredSection.style.display = 'block';
    }
  }
  
  // Country filter buttons
  const countryButtons = document.querySelectorAll('.filter-btn[data-country]');
  countryButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all country buttons
      countryButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Update filter state
      currentFilter.country = button.dataset.country;
      
      // Update display
      updateFilterPath();
      filterProducts();
    });
  });
  
  // Price filter buttons
  const priceButtons = document.querySelectorAll('.filter-btn[data-price]');
  priceButtons.forEach(button => {
    button.addEventListener('click', () => {
      // If already active, deactivate
      if (button.classList.contains('active')) {
        button.classList.remove('active');
        currentFilter.price = null;
      } else {
        // Remove active class from all price buttons
        priceButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update filter state
        currentFilter.price = button.dataset.price;
      }
      
      // Update display
      updateFilterPath();
      filterProducts();
    });
  });
  
  // Clear filter button
  clearFilterBtn.addEventListener('click', () => {
    // Reset filter state
    currentFilter.country = 'all';
    currentFilter.price = null;
    
    // Reset active classes
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-country="all"]').classList.add('active');
    
    // Update display
    updateFilterPath();
    filterProducts();
  });
  
  // Shopping cart functionality
  let cart = [];
  const cartCounter = document.querySelector('.cart-count');
  
  // Add to cart buttons
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  
  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const productCard = e.target.closest('.product-card') || e.target.closest('.featured-product');
      const productTitle = productCard.querySelector('.product-title, .featured-product-title').textContent;
      const productPrice = productCard.querySelector('.product-price').textContent;
      const productImg = productCard.querySelector('img').src;
      
      // Add product to cart
      cart.push({
        title: productTitle,
        price: productPrice,
        image: productImg,
        quantity: 1
      });
      
      // Update cart counter
      if (cartCounter) {
        cartCounter.textContent = cart.length;
      }
      
      // Show confirmation
      button.textContent = 'Added!';
      setTimeout(() => {
        button.textContent = 'Add to Cart';
      }, 2000);
      
      // Save cart to localStorage
      localStorage.setItem('eastworld-cart', JSON.stringify(cart));
    });
  });
  
  // Load cart from localStorage on page load
  if (localStorage.getItem('eastworld-cart')) {
    cart = JSON.parse(localStorage.getItem('eastworld-cart'));
    if (cartCounter) {
      cartCounter.textContent = cart.length;
    }
  }

  // Country-specific initialization
  ['japan', 'china', 'cambodia', 'australia'].forEach(country => {
    // Initialize featured restaurants for each country
    const featuredContainer = document.querySelector(`.${country}-featured-restaurants`);
    if (featuredContainer && FEATURED_RESTAURANTS[country]) {
      // ... existing code ...
    }
  });
}); 