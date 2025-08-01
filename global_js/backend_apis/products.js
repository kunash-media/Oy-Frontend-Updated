// ===== UPDATE YOUR GLOBAL PRODUCTS.JS FILE =====
// Replace your entire global products.js file with this:

const API_BASE = 'https://api.oyjewells.com/api';

// Use localStorage for persistent cache across page redirects
const CACHE_KEY = 'oyjewells_products_cache';
const CACHE_TIMESTAMP_KEY = 'oyjewells_products_cache_timestamp';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

// In-memory cache for current session
let sessionCache = null;
let isLoadingProducts = false;
let loadingPromise = null;

/**
 * Get cached products from localStorage
 */
const getCachedProducts = () => {
    try {
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (!timestamp) return null;

        const cacheAge = Date.now() - parseInt(timestamp);
        if (cacheAge > CACHE_EXPIRY) {
            // Cache expired, clear it
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
            return null;
        }

        const cachedData = localStorage.getItem(CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
};

/**
 * Save products to localStorage cache
 */
const setCachedProducts = (products) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error saving cache:', error);
    }
};

/**
 * Internal function to fetch from API (only called when cache is empty/expired)
 */
const fetchAllProductsFromAPI = async () => {
    let allProducts = [];
    let page = 0;
    const pageSize = 10;
    const delayMs = 100;
    let hasMore = true;

    console.log('Fetching fresh products from API...'); // Debug log

    while (hasMore) {
        const response = await fetch(`${API_BASE}/products/get-all-product?page=${page}&size=${pageSize}&delayMillis=${delayMs}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await handleResponse(response);

        // Transform backend data to match frontend structure
        const transformedData = data.map(product => {
            // Process main image
            const mainImage = `data:image/jpeg;base64,${product.ProductImage}`;

            // Process sub images
            let subImages = [];
            subImages.push(mainImage);

            if (product.ProductSubImages && Array.isArray(product.ProductSubImages)) {
                const additionalSubImages = product.ProductSubImages
                    .filter(img => img && img.trim() !== '')
                    .map(img => `data:image/jpeg;base64,${img}`);
                subImages.push(...additionalSubImages);
            }

            return {
                id: product.productId,
                title: product.ProductTitle,
                name: product.ProductTitle,
                price: product.ProductPrice,
                oldPrice: product.ProductOldPrice || null,
                image: mainImage,
                subImages: subImages,
                description: product.ProductDescription,
                features: product.ProductFeatures || ["Feature not available"],
                sizes: product.ProductSizes || [],
                unavailableSizes: product.ProductUnavailableSizes || [],
                stock: product.productQuantity,
                discount: product.productDiscount,
                skuNo: product.ProductSku || product.skuNo,
                metalColor: product.ProductMetalColor || product.metalColor,
                category: product.ProductCategory,
                quantity: product.productQuantity,
                shopBy: product.shopBy,
                couponCode: product.productCouponCode,
                stoneColor: product.stoneColor,
                rating: product.rating
            };
        });

        allProducts = [...allProducts, ...transformedData];
        hasMore = data.length === pageSize;
        page++;

        if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return allProducts;
};

/**
 * Main function - use this everywhere (PERSISTENT CACHE VERSION)
 */
export const fetchAllProducts = async () => {
    // First check session cache (fastest)
    if (sessionCache) {
        console.log('Using session cache'); // Debug log
        return sessionCache;
    }

    // Then check localStorage cache (still fast)
    const cachedProducts = getCachedProducts();
    if (cachedProducts) {
        console.log('Using localStorage cache'); // Debug log
        sessionCache = cachedProducts; // Also store in session for faster access
        return cachedProducts;
    }

    // If already loading, return the existing promise
    if (isLoadingProducts && loadingPromise) {
        return loadingPromise;
    }

    // Only fetch from API if no cache exists
    console.log('No cache found, fetching from API...'); // Debug log
    isLoadingProducts = true;
    loadingPromise = fetchAllProductsFromAPI()
        .then(products => {
            sessionCache = products;
            setCachedProducts(products); // Save to localStorage
            isLoadingProducts = false;
            return products;
        })
        .catch(error => {
            isLoadingProducts = false;
            loadingPromise = null;
            throw error;
        });

    return loadingPromise;
};

/**
 * Fetches products by category (uses cached data)
 */
export const fetchProductsByCategory = async (category) => {
    try {
        const allProducts = await fetchAllProducts();
        return allProducts.filter(product =>
            product.category && product.category.toLowerCase() === category.toLowerCase()
        );
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw error;
    }
};

/**
 * Get single product by ID (uses cached data)
 */
export const getProductById = async (productId) => {
    try {
        const allProducts = await fetchAllProducts();
        return allProducts.find(product => product.id === productId) || null;
    } catch (error) {
        console.error('Error getting product by ID:', error);
        throw error;
    }
};

/**
 * Clear all caches (useful for refreshing data)
 */
export const clearProductsCache = () => {
    sessionCache = null;
    isLoadingProducts = false;
    loadingPromise = null;
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('All caches cleared');
};

/**
 * Force refresh products (clears cache and fetches fresh data)
 */
export const refreshProducts = async () => {
    clearProductsCache();
    return await fetchAllProducts();
};

/**
 * Handles API response
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
    }
    return response.json();
};

// ===== OPTIONAL: ADD CACHE STATUS FUNCTION FOR DEBUGGING =====
export const getCacheStatus = () => {
    const hasSessionCache = !!sessionCache;
    const hasLocalStorageCache = !!getCachedProducts();
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : null;
    
    return {
        hasSessionCache,
        hasLocalStorageCache,
        cacheAge: cacheAge ? Math.round(cacheAge / 1000) + ' seconds' : 'No cache',
        cacheExpiry: CACHE_EXPIRY / 1000 + ' seconds'
    };
};

// ===== YOUR PRODUCT DETAIL PAGE REMAINS THE SAME =====
// No changes needed in your product detail page script
// It will automatically benefit from the persistent cache




// //C:\Jewelry-frontend-updated\global_js\backend_apis\products.js

// const API_BASE = 'https://api.oyjewells.com/api';

// /**
//  * Fetches all products from backend
//  * @returns {Promise<Array>} Array of product objects
//  */
// export const fetchAllProducts = async () => {
//   try {
//     const response = await fetch(`${API_BASE}/products/get-all-product`, {
//       headers: {
//         'Accept': 'application/json'
//       }
//     });
    
//     const data = await handleResponse(response);
    
//     // Transform backend data to match frontend structure
//     return data.map(product => ({
//       id: product.productId,
//       name: product.ProductTitle,
//       price: product.ProductPrice,
//       image: `data:image/jpeg;base64,${product.ProductImage}`,
//       description: product.ProductDescription,
//       features: product.ProductFeatures,
//       sizes: product.ProductSizes,
//       stock: product.productQuantity,
//       category: product.ProductCategory,
//       productDiscount : product.productDiscount,
//       productOldPrice : product.ProductOldPrice
//     }));
    
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     throw error;
//   }
// };

// /**
//  * Fetches products by category
//  * @param {string} category - Category to filter by
//  * @returns {Promise<Array>} Array of filtered product objects
//  */
// export const fetchProductsByCategory = async (category) => {
//   try {
//     const allProducts = await fetchAllProducts();
//     return allProducts.filter(product => 
//       product.category && product.category.toLowerCase() === category.toLowerCase()
//     );
//   } catch (error) {
//     console.error('Error fetching products by category:', error);
//     throw error;
//   }
// };

// /**
//  * Handles API response
//  * @param {Response} response 
//  * @returns {Promise<any>}
//  */
// const handleResponse = async (response) => {
//   if (!response.ok) {
//     const error = await response.text();
//     throw new Error(error || 'Request failed');
//   }
//   return response.json();
// };