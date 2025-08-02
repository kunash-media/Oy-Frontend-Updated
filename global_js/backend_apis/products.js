// ===== REPLACE YOUR ENTIRE GLOBAL PRODUCTS.JS FILE WITH THIS =====

const API_BASE = 'https://api.oyjewells.com/api';

// Cache configuration
const CACHE_KEY = 'oyjewells_products_cache';
const CACHE_TIMESTAMP_KEY = 'oyjewells_products_cache_timestamp';
const LOADING_FLAG_KEY = 'oyjewells_products_loading';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Check if cache is valid and not expired
 */
const isCacheValid = () => {
    try {
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const cachedData = localStorage.getItem(CACHE_KEY);
        
        if (!timestamp || !cachedData) {
            return false;
        }

        const cacheAge = Date.now() - parseInt(timestamp);
        return cacheAge < CACHE_EXPIRY;
    } catch (error) {
        console.error('Error checking cache validity:', error);
        return false;
    }
};

/**
 * Get products from localStorage if valid
 */
const getCachedProducts = () => {
    try {
        if (!isCacheValid()) {
            // Clear invalid cache
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
            return null;
        }

        const cachedData = localStorage.getItem(CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
        console.error('Error reading cached products:', error);
        return null;
    }
};

/**
 * Save products to localStorage
 */
const setCachedProducts = (products) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        localStorage.removeItem(LOADING_FLAG_KEY); // Clear loading flag
        console.log('Products cached successfully');
    } catch (error) {
        console.error('Error caching products:', error);
        localStorage.removeItem(LOADING_FLAG_KEY);
    }
};

/**
 * Check if another tab/page is currently loading products
 */
const isAnotherInstanceLoading = () => {
    const loadingFlag = localStorage.getItem(LOADING_FLAG_KEY);
    if (!loadingFlag) return false;
    
    // Check if loading flag is stale (older than 2 minutes)
    const loadingTime = parseInt(loadingFlag);
    const timeSinceLoading = Date.now() - loadingTime;
    
    if (timeSinceLoading > 2 * 60 * 1000) {
        // Stale loading flag, remove it
        localStorage.removeItem(LOADING_FLAG_KEY);
        return false;
    }
    
    return true;
};

/**
 * Set loading flag to prevent multiple simultaneous API calls
 */
const setLoadingFlag = () => {
    localStorage.setItem(LOADING_FLAG_KEY, Date.now().toString());
};

/**
 * Wait for another instance to finish loading
 */
const waitForOtherInstanceToFinish = async (maxWaitTime = 30000) => {
    const startTime = Date.now();
    
    while (isAnotherInstanceLoading() && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        
        // Check if cache became available while waiting
        if (isCacheValid()) {
            return getCachedProducts();
        }
    }
    
    return null;
};

/**
 * Fetch products from API with transformation
 */
const fetchAllProductsFromAPI = async () => {
    console.log('🔄 Fetching products from API...');
    
    let allProducts = [];
    let page = 0;
    const pageSize = 10;
    const delayMs = 100;
    let hasMore = true;

    try {
        while (hasMore) {
            const response = await fetch(`${API_BASE}/products/get-all-product?page=${page}&size=${pageSize}&delayMillis=${delayMs}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();

            // Transform backend data
            const transformedData = data.map(product => {
                const mainImage = `data:image/jpeg;base64,${product.ProductImage}`;
                let subImages = [mainImage];

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

        console.log(`✅ Successfully fetched ${allProducts.length} products`);
        return allProducts;

    } catch (error) {
        console.error('❌ Error fetching products from API:', error);
        localStorage.removeItem(LOADING_FLAG_KEY); // Clear loading flag on error
        throw error;
    }
};

/**
 * Main function to get all products - BULLETPROOF VERSION
 */
export const fetchAllProducts = async () => {
    // Step 1: Check if we have valid cached data
    const cachedProducts = getCachedProducts();
    if (cachedProducts && cachedProducts.length > 0) {
        console.log('⚡ Using cached products (instant load)');
        return cachedProducts;
    }

    // Step 2: Check if another instance is already loading
    if (isAnotherInstanceLoading()) {
        console.log('⏳ Another instance is loading, waiting...');
        const waitedResult = await waitForOtherInstanceToFinish();
        if (waitedResult) {
            console.log('✅ Got products from other instance');
            return waitedResult;
        }
    }

    // Step 3: We need to load from API
    setLoadingFlag();
    
    try {
        const products = await fetchAllProductsFromAPI();
        setCachedProducts(products);
        return products;
    } catch (error) {
        localStorage.removeItem(LOADING_FLAG_KEY);
        throw error;
    }
};

/**
 * Get products by category
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
 * Get single product by ID
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
 * Clear all cache and force refresh
 */
export const clearProductsCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    localStorage.removeItem(LOADING_FLAG_KEY);
    console.log('🗑️ All cache cleared');
};

/**
 * Force refresh products
 */
export const refreshProducts = async () => {
    clearProductsCache();
    return await fetchAllProducts();
};

/**
 * Get cache status for debugging
 */
export const getCacheStatus = () => {
    const hasCache = !!getCachedProducts();
    const isLoading = isAnotherInstanceLoading();
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cacheAge = timestamp ? Math.round((Date.now() - parseInt(timestamp)) / 1000) : null;
    
    return {
        hasValidCache: hasCache,
        isCurrentlyLoading: isLoading,
        cacheAgeSeconds: cacheAge,
        cacheExpirySeconds: CACHE_EXPIRY / 1000
    };
};




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